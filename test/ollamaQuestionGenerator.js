// ollamaQuestionGenerator.js
const fetch = require("node-fetch"); // npm install node-fetch@2

// ─────────────────────────────────────────────────────────────────────────────
// APISIX Issue #7919 — Pre-filled context
// ─────────────────────────────────────────────────────────────────────────────

const PROBLEM_STATEMENT = `
Apache APISIX (v2.15.0) exhibits severe P99 / long-tail latency spikes when the
prometheus plugin is active on any route.

Observed behaviour
- Upstream P99 ≈ 1 ms.
- APISIX P99 > 3 000 ms at only ~30 RPS.
- One NGINX worker CPU spikes to 100 % during every Prometheus scrape of
  /apisix/prometheus/metrics.
- CPU flame-graphs show prometheus:metric_data() and the exporter/collect()
  coroutine consuming the dominant share of Lua-land CPU time.

Root cause
NGINX uses a multi-process, single-threaded event loop. When Prometheus scrapes
the metrics endpoint, APISIX calls collect() inside an ordinary worker coroutine.
That coroutine runs synchronously and never yields, so it monopolises the event
loop for the entire duration of:
  1. nginx_status()  — regex parsing of /nginx_status output (re_gmatch loop)
  2. etcd_modify_index() — HTTP call to etcd
  3. health-checker iteration — table iteration over all upstream nodes
  4. prometheus:metric_data() — sorts ~100 000 metric strings (table.sort),
     serialises histogram buckets (string.format), and applies label rewrites
     (fix_histogram_bucket_labels) all of which are JIT-uncompilable hot paths.

While the worker is busy no other request inside the same worker can be
dispatched, causing queued requests to observe latencies proportional to the
metric count (linear relationship confirmed by benchmarks).

Goal
Reduce P99 latency to < 10 ms and P999 to < 40 ms under the same 30 RPS load
without dropping any metric values or breaking existing plugin semantics.
`;

const DATASET = `
Reporter environment (Apache APISIX issue #7919, filed 2022-09-14):
- APISIX version : 2.15.0-alpine (Docker)
- Helm chart     : apisix/apisix 0.11.0
- Platform       : Kubernetes on AWS (Amazon Linux 2, kernel 5.4.190)
- etcd           : bitnami/etcd 3.5.4
- Prometheus scrape interval : default 15 s
- Route plugins  : prometheus + proxy-mirror
- Upstream topology : 5-node roundrobin with active + passive health checks
- Traffic load   : ~30 RPS

Reproduction steps provided by reporter:
1. Create a roundrobin upstream across 5 nodes with active/passive health checks.
2. Create a route with prometheus + proxy-mirror plugins attached.
3. Apply ~30 RPS of traffic.
4. Allow Prometheus to scrape /apisix/prometheus/metrics on its normal interval.
5. Observe P99 on Grafana dashboard (ID 11719) spike to seconds while upstream
   P99 stays below 2 ms.

Benchmark data (wrk2, 100 000 metrics, before any fix):
  P50   = 10.21 ms
  P75   = 12.03 ms
  P90   = 13.25 ms
  P99   =  92.80 ms
  P99.9 = 926.72 ms  ← long-tail spike
  P100  = 934.91 ms

Related prior issues: #5604, #5500, #5755 (community discussion thread).
`;

const PROPOSAL = `
Two-phase fix targeting the root cause (event-loop starvation):

Phase 1 — Yield points in the hot path (ngx.sleep(0) micro-yields)
  Insert ngx.sleep(0) calls at strategic points inside exporter.lua so the
  worker voluntarily surrenders the event loop between expensive operations,
  giving queued requests a chance to be dispatched:
    • Before and after the re_gmatch iterator in nginx_status().
    • At the top of each iteration in the upstream health-checker loop inside
      collect().
  Also patch the upstream nginx-lua-prometheus library (prometheus.lua) to
  yield every N metrics (e.g. every 200 items) inside metric_data() so the
  table.sort + string.format hot path is interrupted periodically.
  Expected gain: P100 drops from ~935 ms to ~400 ms (≈ 55 % reduction).

Phase 2 — Offload collect() to the privileged agent process (architectural fix)
  NGINX's privileged agent is a special process that does not handle regular
  HTTP traffic. Move the entire prometheus collect / metric_data pipeline into
  this process so that metric serialisation never runs inside a worker that is
  also serving user requests.
  Changes required:
    a. apisix-nginx-module: extend the privileged agent to listen on an
       internal port (feat: allow privileged agent to listen port, PR #71).
    b. exporter.lua: when enable_export_server = true (new config flag),
       register the /apisix/prometheus/metrics handler in the privileged agent
       instead of in worker processes.
  Expected gain (benchmark after full fix):
    P50   =  3.74 ms
    P99   =  9.99 ms   ← within acceptable range
    P99.9 = 13.41 ms
    P100  = 18.40 ms
  Long-tail requests eliminated in production verification.
`;

// ─── Actual solution code (exporter.lua diff — translated to JS for review) ──
const SOLUTION_CODE = `
-- FILE: apisix/plugins/prometheus/exporter.lua
-- Key changes made to fix issue #7919

-- 1. Localise ngx.sleep at module level to avoid repeated global lookups
local ngx_sleep = ngx.sleep

-- 2. nginx_status(): add yield points around the expensive re_gmatch loop
local function nginx_status()
    local res = ngx_capture("/apisix/nginx_status")
    if not res then
        core.log.error("failed to fetch Nginx status")
        return
    end

    ngx_sleep(0)  -- <-- yield BEFORE regex iterator creation

    local iterator, err = re_gmatch(res.body, [[(\d+)]], "jmo")
    if not iterator then
        core.log.error("failed to re.gmatch Nginx status: ", err)
        return
    end

    ngx_sleep(0)  -- <-- yield AFTER iterator creation, BEFORE loop

    for _, name in ipairs(ngx_status_items) do
        local val, err = iterator()
        if err then
            core.log.error("failed to re.gmatch Nginx status: ", err)
            return
        end
        if not val then
            return
        end
        if name == "total" then
            metrics.requests:set(val[1], {"http"})
        else
            metrics.connections:set(val[1], {name})
        end
    end
end

-- 3. collect(): yield inside the upstream health-checker loop
local function collect(ctx, stream_only)
    shared_dict_status()

    ngx_sleep(0)  -- yield between major sub-routines

    nginx_status()

    ngx_sleep(0)

    etcd_modify_index()

    ngx_sleep(0)

    local stats = control.get_health_checkers()
    for i, c in ipairs(stats) do
        -- yield every iteration so that health-checker tables with many
        -- upstream nodes do not monopolise the event loop
        if i % 10 == 0 then
            ngx_sleep(0)
        end
        -- ... update upstream_status gauge metrics ...
        local nodes = c.nodes
        for _, node in ipairs(nodes) do
            local ok = node.healthy
            metrics.upstream_status:set(
                ok and 1 or 0,
                { c.src_id, node.ip, node.port }
            )
        end
    end

    ngx_sleep(0)

    -- metric_data() now yields every 200 metrics internally (patched in
    -- nginx-lua-prometheus PR #139) so we do not need extra sleeps here.
    core.response.set_header("content_type",
        "text/plain; version=0.0.4; charset=utf-8")
    return 200, core.table.concat(prometheus:metric_data())
end

-- 4. Privileged-agent mode (Phase 2 fix)
-- When plugin_attr.prometheus.enable_export_server = true, the metrics
-- endpoint is registered inside the privileged agent process instead of
-- inside every worker.  This is the definitive fix: metric serialisation
-- never runs in a request-serving worker again.
local function get_api(called_by_api_router)
    local attr = plugin.plugin_attr("prometheus") or {}

    -- If the dedicated export server is enabled, only expose the handler
    -- inside the privileged agent; regular workers return nothing.
    if attr.enable_export_server then
        if process.type() ~= "privileged agent" then
            return {}
        end
    end

    return {
        {
            methods = {"GET"},
            uri     = attr.export_uri or "/apisix/prometheus/metrics",
            handler = collect,
        }
    }
end
`;

// ─────────────────────────────────────────────────────────────────────────────
// Core generator function (unchanged contract)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates targeted verification questions using Ollama.
 *
 * @param {string} problemStatement
 * @param {string} dataset
 * @param {string} proposal
 * @param {string} solutionCode
 * @returns {Promise<string[]>} Array of generated questions
 */
async function generateVerificationQuestions(
  problemStatement,
  dataset,
  proposal,
  solutionCode,
) {
  const prompt = `
You are a senior technical interviewer.
Your task is to generate 3-5 highly targeted verification questions
based ONLY on the submitted solution below.
The goal is to determine whether the developer genuinely understands
their implementation or may have AI-generated it.

IMPORTANT RULES:
- Questions must focus on decisions made in the code.
- Ask about WHY certain approaches were chosen.
- Do NOT ask general theory questions.
- Do NOT ask to explain concepts.
- Do NOT ask obvious surface-level questions.
- Questions should force the developer to justify implementation decisions.
- Make them specific to the submitted code.

-------------------------
PROBLEM STATEMENT:
${problemStatement}

DATASET:
${dataset}

PROPOSAL (Design Approach):
${proposal}

SOLUTION CODE:
${solutionCode}
-------------------------

Return ONLY the questions as a numbered list.
`;

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "mistral:latest",
      prompt: prompt,
      stream: false,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.response) {
    throw new Error("No response field from Ollama");
  }

  // Extract numbered questions (lines that start with a digit and a dot)
  const questions = data.response
    .split("\n")
    .map((q) => q.trim())
    .filter((q) => /^\d+\./.test(q));

  return questions;
}

module.exports = { generateVerificationQuestions };

// ─────────────────────────────────────────────────────────────────────────────
// Example usage — runs when this file is executed directly
// ─────────────────────────────────────────────────────────────────────────────

if (require.main === module) {
  (async () => {
    console.log("Generating verification questions for APISIX issue #7919…\n");

    try {
      const questions = await generateVerificationQuestions(
        PROBLEM_STATEMENT,
        DATASET,
        PROPOSAL,
        SOLUTION_CODE,
      );

      console.log("Generated Verification Questions:\n");
      questions.forEach((q) => console.log(q));
    } catch (err) {
      console.error("Failed to generate questions:", err.message);
      process.exit(1);
    }
  })();
}
