export type Difficulty = "easy" | "medium" | "hard";

export interface IssueStat {
  label: string;
  value: string;
  color: "green" | "red" | "blue" | "yellow";
}

export interface IssueBar {
  label: string;
  height: number;
  spike: boolean;
}

export interface IssueConstraint {
  dot: "blue" | "green" | "yellow" | "red";
  text: string;
}

export interface IssueExample {
  label: string;
  rows: { key: string; value: string }[];
}

export interface IssueHint {
  text: string;
}

export interface IssueCodeBlock {
  filename: string;
  code: string; // raw string, rendered in <pre>
}

export interface Issue {
  id: string;
  title: string;
  githubUrl: string;
  relatedUrls?: { label: string; url: string }[];
  repoLabel: string;
  repoUrl: string;
  sourceLabel: string;
  tag: string;
  tagColor: string; // tailwind bg class for dashboard pill
  company: string;
  companyLogo: string;
  kpiMetric: string;
  difficulty: Difficulty;
  progress: number;
  tags: string[];
  stats: IssueStat[];
  description: string[];       // paragraphs
  warningCallout: string;
  bars: IssueBar[];
  barCaption: string;
  codeBlock: IssueCodeBlock;
  dangerCallout: string;
  examples: IssueExample[];
  constraints: IssueConstraint[];
  hints: IssueHint[];
}

export const issues: Issue[] = [
  {
    id: "apisix-7919",
    title: "Reduce P99 Latency Spikes in APISIX Prometheus Plugin",
    githubUrl: "https://github.com/apache/apisix/issues/7919",
    relatedUrls: [
      { label: "↗ Issue #7919", url: "https://github.com/apache/apisix/issues/7919" },
      { label: "↗ Related #5755", url: "https://github.com/apache/apisix/issues/5755" },
    ],
    repoLabel: "apache/apisix",
    repoUrl: "https://github.com/apache/apisix",
    sourceLabel: "Real-world open source bug · apache/apisix@2.15.0",
    tag: "Performance",
    tagColor: "bg-red-700",
    company: "Apache",
    companyLogo: "AP",
    kpiMetric: "P99 Latency",
    difficulty: "hard",
    progress: 12,
    tags: ["Lua / OpenResty", "Apache APISIX", "Prometheus", "Concurrency"],
    stats: [
      { label: "Accepted",     value: "12.4%",    color: "green"  },
      { label: "Submissions",  value: "4,831",     color: "blue"   },
      { label: "Baseline P99", value: "> 3,000ms", color: "red"    },
      { label: "Target P99",   value: "< 10ms",    color: "green"  },
      { label: "Upstream P99", value: "~1ms",      color: "yellow" },
      { label: "Test QPS",     value: "~30 RPS",   color: "blue"   },
    ],
    description: [
      "Apache APISIX is a cloud-native API gateway built on top of OpenResty (NGINX + LuaJIT). When the `prometheus` plugin is enabled on a route, APISIX collects request metrics (HTTP status codes, latency histograms, bandwidth) and exports them via `/apisix/prometheus/metrics`.",
      "Users running APISIX v2.15.0 in production have observed that P99 request latency spikes to multiple seconds, even though upstream services respond in under 2ms. CPU flame graphs clearly show that the `exporter.lua` and prometheus metric collection routines are consuming a disproportionate share of CPU time within the request lifecycle.",
      "Your task is to identify the root cause in `apisix/plugins/prometheus/exporter.lua` and fix it so that the P99 request latency drops to within an acceptable range of upstream latency, without compromising the accuracy of collected metrics.",
    ],
    warningCallout:
      "The Prometheus scrape endpoint's collect() function is computationally heavy — it iterates NGINX status, ETCD indices, upstream health checks, and serializes all histogram buckets in one synchronous Lua coroutine. When Prometheus scrapes this endpoint under live traffic, it monopolizes the NGINX event loop and causes other requests to queue up, producing long-tail (P99/P999) latency spikes.",
    bars: [
      { label: "P50",  height: 18, spike: false },
      { label: "",     height: 16, spike: false },
      { label: "P75",  height: 19, spike: false },
      { label: "",     height: 22, spike: false },
      { label: "P90",  height: 24, spike: false },
      { label: "",     height: 25, spike: false },
      { label: "P99",  height: 72, spike: true  },
      { label: "P999", height: 78, spike: true  },
    ],
    barCaption: "Latency distribution — P50–P90 normal, P99+ extreme spike",
    codeBlock: {
      filename: "apisix/plugins/prometheus/exporter.lua — collect() function (abridged)",
      code: `local function nginx_status()
  local res = http_new():request_uri("http://127.0.0.1:" .. port .. "/nginx_status")
  if not res then return end

  -- Parses a multi-line text response with regex iteration
  local iterator = re_gmatch(res.body, [[(\d+)]], "jmo")
  for _, name in ipairs(ngx_status_items) do
    local val = iterator()
    -- ... update gauge metrics ...
  end
end

local function collect(ctx, stream_only)
  shared_dict_status()   -- iterate all shared dicts
  nginx_status()          -- HTTP call + regex parsing
  etcd_modify_index()     -- ETCD HTTP call
  -- upstream health status loop...
  local stats = control.get_health_checkers()
  for _, c in ipairs(stats) do
    -- ... expensive table iteration ...
  end
  -- Serialize all histograms and counters into text
  return 200, prometheus:metric_data()
end`,
    },
    dangerCallout:
      "Key observation: All work in collect() runs synchronously in a single Lua coroutine with no ngx.sleep(0) yield points, preventing the NGINX event loop from handling other requests while a Prometheus scrape is in progress.",
    examples: [
      {
        label: "Example 1 — Reproducing the bug",
        rows: [
          { key: "Setup:    ", value: "Route with prometheus + proxy-mirror plugins, roundrobin upstream (5 nodes)" },
          { key: "Traffic:  ", value: "~30 RPS with concurrent Prometheus scrape every 15s" },
          { key: "Observed:", value: "P99 latency = 3,000ms+, upstream P99 = ~1ms" },
          { key: "Expected:", value: "P99 latency ≈ upstream P99 + small constant overhead" },
        ],
      },
      {
        label: "Example 2 — Benchmark target (wrk2 @ 5000 RPS)",
        rows: [
          { key: "Before fix: ", value: "P99 = 10,900ms | P99.9 = 39,550ms" },
          { key: "After fix:  ", value: "P99 < 10ms | P99.9 < 40ms (target)" },
        ],
      },
    ],
    constraints: [
      { dot: "blue",   text: "You may only modify files within apisix/plugins/prometheus/ — the plugin API surface must remain unchanged." },
      { dot: "green",  text: "All existing Prometheus metrics (apisix_http_status, apisix_http_latency, apisix_bandwidth, etc.) must still be exported correctly." },
      { dot: "yellow", text: "The fix must not introduce data races — NGINX worker processes share metric state via ngx.shared.DICT." },
      { dot: "red",    text: "P99 latency under a Prometheus scrape at 30 RPS must drop below 10ms on the provided benchmark hardware." },
      { dot: "blue",   text: "The solution must be compatible with NGINX's single-threaded, non-blocking event loop model — no blocking C calls or OS threads." },
      { dot: "green",  text: "All existing test cases in t/plugin/prometheus*.t must continue to pass." },
    ],
    hints: [
      { text: "Hint 1: In LuaJIT / OpenResty, ngx.sleep(0) yields the current coroutine back to the NGINX event loop without introducing any real delay, allowing pending I/O and timer callbacks to be processed. Strategic placement of yield points inside long-running loops can dramatically reduce scheduling latency for other coroutines." },
      { text: "Hint 2: Consider whether the metrics scrape endpoint needs to be co-located with the main NGINX worker processes at all. APISIX already has a concept of a separate privileged agent process — could the expensive collection be offloaded there?" },
      { text: "Hint 3: The re_gmatch iterator in nginx_status() and the health-checker loop in collect() are both candidates for yielding. Look at where CPU time is concentrated in the flame graph and add ngx.sleep(0) calls to break up the hot path." },
    ],
  },

  // ── Add new issues below this line ──────────────────────────────────────────
  // Just copy the object above, change the fields, give it a new unique id,
  // and it will automatically appear in the dashboard and get its own page.

  {
    id: "client-golang-894",
    title: "Security Issues with Crypto and Text — Vulnerable Dependency Versions",
    githubUrl: "https://github.com/prometheus/client_golang/issues/894",
    relatedUrls: [
      { label: "↗ Issue #894", url: "https://github.com/prometheus/client_golang/issues/894" },
      { label: "↗ CVE-2020-9283", url: "https://nvd.nist.gov/vuln/detail/CVE-2020-9283" },
      { label: "↗ CVE-2020-14040", url: "https://nvd.nist.gov/vuln/detail/CVE-2020-14040" },
    ],
    repoLabel: "prometheus/client_golang",
    repoUrl: "https://github.com/prometheus/client_golang",
    sourceLabel: "Real-world open source bug · prometheus/client_golang",
    tag: "Security",
    tagColor: "bg-orange-700",
    company: "Prometheus",
    companyLogo: "PR",
    kpiMetric: "CVE Resolved",
    difficulty: "medium",
    progress: 35,
    tags: ["Go", "Dependency Management", "CVE", "Supply Chain"],
    stats: [
      { label: "Accepted",       value: "38.1%",         color: "green"  },
      { label: "Submissions",    value: "1,204",          color: "blue"   },
      { label: "CVEs",           value: "2 Critical",     color: "red"    },
      { label: "Affected Pkg",   value: "x/crypto",       color: "yellow" },
      { label: "Affected Pkg",   value: "x/text",         color: "yellow" },
      { label: "Fix Type",       value: "Dep Upgrade",    color: "blue"   },
    ],
    description: [
      "The `prometheus/client_golang` library transitively depends on older versions of `golang.org/x/crypto` and `golang.org/x/text` that contain known security vulnerabilities with published CVE proof-of-concept attacks.",
      "**CVE-2020-9283** affects `golang.org/x/crypto` — versions prior to `v0.0.0-20201203163018-be400aefbc4c` are vulnerable to a denial-of-service attack via malformed SSH messages. **CVE-2020-14040** affects `golang.org/x/text` — versions prior to `v0.3.3` are vulnerable to an infinite loop triggered by crafted UTF-8 input in the `encoding/charmap` package.",
      "Your task is to update the module dependency graph so that the minimum required versions of both packages meet the patched thresholds, without breaking any existing functionality or introducing new dependency conflicts.",
    ],
    warningCallout:
      "These vulnerabilities are reported by automated CVE scanners (e.g. `nancy`, `govulncheck`) and block many enterprise deployments from adopting client_golang. The root cause is a transitive dependency pulled in through `prometheus/common` — simply running `go mod tidy` is **not** sufficient because Go's MVS (Minimum Version Selection) will still resolve to the older vulnerable version unless the minimum is explicitly bumped.",
    bars: [
      { label: "v0.3.1", height: 70, spike: true  },
      { label: "",       height: 65, spike: true  },
      { label: "v0.3.2", height: 60, spike: true  },
      { label: "",       height: 20, spike: false },
      { label: "v0.3.3", height: 15, spike: false },
      { label: "",       height: 12, spike: false },
      { label: "v0.3.4", height: 10, spike: false },
      { label: "latest", height:  8, spike: false },
    ],
    barCaption: "x/text vulnerability surface by version — patched at v0.3.3+",
    codeBlock: {
      filename: "go.mod — current vulnerable indirect dependencies",
      code: `module github.com/prometheus/client_golang

go 1.17

require (
  github.com/prometheus/common v0.26.0
  // ...
)

// Transitive chain pulling in vulnerable versions:
// client_golang → prometheus/common@v0.4.1
//               → golang.org/x/crypto@v0.0.0-20180820150726  ← CVE-2020-9283
//               → golang.org/x/text@v0.3.0                   ← CVE-2020-14040

// Running "go mod tidy" alone does NOT fix this.
// MVS picks the MINIMUM satisfying version, not the latest.
// You must explicitly require the patched versions:

require (
  golang.org/x/crypto v0.0.0-20201203163018-be400aefbc4c // indirect
  golang.org/x/text   v0.3.3                             // indirect
)`,
    },
    dangerCallout:
      "Key observation: Go's Minimum Version Selection (MVS) algorithm resolves to the lowest version that satisfies all constraints. Without an explicit `require` directive for the patched versions in `go.mod`, the vulnerable older versions will continue to be selected even after upgrading `prometheus/common`.",
    examples: [
      {
        label: "Example 1 — Detecting the vulnerability",
        rows: [
          { key: "Tool:     ", value: "go list -json -m all | nancy sleuth" },
          { key: "Output:   ", value: "CVE-2020-9283 in golang.org/x/crypto@v0.0.0-20180820150726" },
          { key: "Output:   ", value: "CVE-2020-14040 in golang.org/x/text@v0.3.0" },
          { key: "Expected: ", value: "No vulnerabilities reported after fix" },
        ],
      },
      {
        label: "Example 2 — Required minimum versions",
        rows: [
          { key: "crypto fix: ", value: "golang.org/x/crypto >= v0.0.0-20201203163018-be400aefbc4c" },
          { key: "text fix:   ", value: "golang.org/x/text >= v0.3.3" },
          { key: "Verify:     ", value: "govulncheck ./... → No vulnerabilities found" },
        ],
      },
    ],
    constraints: [
      { dot: "red",    text: "Both CVE-2020-9283 (x/crypto) and CVE-2020-14040 (x/text) must be resolved — no partial fixes accepted." },
      { dot: "blue",   text: "You may only modify go.mod and go.sum — no changes to application source code." },
      { dot: "yellow", text: "The fix must not upgrade prometheus/common to a version that breaks the existing public API surface of client_golang." },
      { dot: "green",  text: "All existing unit tests (go test ./...) must continue to pass after the dependency changes." },
      { dot: "blue",   text: "The solution must work with Go's MVS — do not use replace directives as a permanent fix." },
      { dot: "green",  text: "Running govulncheck ./... after your fix must report zero vulnerabilities for these two CVEs." },
    ],
    hints: [
      { text: "Hint 1: Add explicit `require` entries for the patched versions of golang.org/x/crypto and golang.org/x/text directly in go.mod. Even though they are indirect dependencies, Go's MVS will respect the minimum you declare and select a version >= what you specify." },
      { text: "Hint 2: After editing go.mod, run `go mod tidy` followed by `go mod verify` to regenerate go.sum and ensure the dependency graph is consistent. Check with `go list -m golang.org/x/crypto golang.org/x/text` that the resolved versions are >= the patched thresholds." },
      { text: "Hint 3: The circular dependency between prometheus/client_golang and prometheus/common means that upgrading common alone may not be enough. Focus on pinning the vulnerable packages directly rather than trying to chase the transitive chain upward." },
    ],
  },

  {
    id: "nginx-1027",
    title: "PCRE2 JIT Use-After-Free during Graceful Reload",
    githubUrl: "https://github.com/nginx/nginx/issues/1027",
    relatedUrls: [
      { label: "↗ Issue #1027", url: "https://github.com/nginx/nginx/issues/1027" },
      { label: "↗ PCRE2 JIT Docs", url: "https://www.pcre.org/current/doc/html/pcre2jit.html" },
    ],
    repoLabel: "nginx/nginx",
    repoUrl: "https://github.com/nginx/nginx",
    sourceLabel: "Real-world open source bug · nginx/nginx",
    tag: "Memory Safety",
    tagColor: "bg-purple-700",
    company: "NGINX",
    companyLogo: "NX",
    kpiMetric: "Worker Crashes",
    difficulty: "hard",
    progress: 18,
    tags: ["C", "NGINX", "PCRE2", "Memory Management", "JIT"],
    stats: [
      { label: "Accepted",    value: "9.3%",           color: "green"  },
      { label: "Submissions", value: "2,140",           color: "blue"   },
      { label: "Crash Type",  value: "Use-After-Free",  color: "red"    },
      { label: "Trigger",     value: "nginx -s reload", color: "yellow" },
      { label: "Component",   value: "ngx_regex",       color: "blue"   },
      { label: "PCRE2 Since", value: "nginx 1.21.5",    color: "yellow" },
    ],
    description: [
      "Since nginx switched from PCRE to PCRE2 (starting nginx 1.21.5), worker processes crash during or after a graceful reload (`nginx -s reload`) when `pcre_jit on` is enabled in the configuration.",
      "The crash manifests as a segfault inside `sljit_free_exec` → `_pcre2_jit_free_8` → `pcre2_code_free_8` → `ngx_regex_cleanup`. The root cause is a use-after-free: during reload, the master process forks new workers which inherit the parent's compiled PCRE2 regex objects via copy-on-write memory pages. When the old worker exits and calls `ngx_regex_cleanup`, it frees the JIT-compiled code that the new worker is still actively using — because JIT memory is allocated outside the normal nginx memory pool via `mmap/sljit_alloc_exec`, it is shared across the fork boundary and freed prematurely.",
      "Your task is to fix `ngx_regex_cleanup()` and the PCRE2 JIT lifecycle so that compiled regex objects and their JIT memory are not freed while any forked worker still holds a reference to them.",
    ],
    warningCallout:
      "This bug is silent in low-traffic environments — it only reliably reproduces when a reload happens while workers are actively processing regex-heavy requests. The JIT memory region is mapped executable (PROT_EXEC) and shared across fork, making the use-after-free a potential security boundary violation in addition to a stability issue.",
    bars: [
      { label: "idle",   height: 10, spike: false },
      { label: "",       height: 12, spike: false },
      { label: "low",    height: 15, spike: false },
      { label: "",       height: 18, spike: false },
      { label: "reload", height: 72, spike: true  },
      { label: "",       height: 68, spike: true  },
      { label: "high",   height: 75, spike: true  },
      { label: "peak",   height: 78, spike: true  },
    ],
    barCaption: "Worker crash rate — spikes sharply on reload under traffic",
    codeBlock: {
      filename: "src/core/ngx_regex.c — ngx_regex_cleanup() (abridged)",
      code: `static void
ngx_regex_cleanup(void *data)
{
    ngx_regex_cleanup_t  *cln = data;

    if (cln->regex) {
        /* BUG: pcre2_code_free triggers JIT memory dealloc via sljit_free_exec.
         * After fork(), new worker still maps this JIT region. Freeing it here
         * in the exiting old worker causes a use-after-free in the new worker. */
        pcre2_code_free(cln->regex);   // <- crash site
        cln->regex = NULL;
    }
}

/* The JIT allocator uses mmap(PROT_EXEC) outside nginx's pool.
 * On fork(), copy-on-write does NOT isolate executable mappings —
 * both parent and child share the physical pages until one writes.
 * pcre2_code_free() unmaps them immediately in the exiting worker. */`,
    },
    dangerCallout:
      "Key observation: PCRE2 JIT code is allocated via sljit_alloc_exec (mmap PROT_EXEC) outside nginx's ngx_pool_t. After fork(), the child inherits these mappings. The old worker calling pcre2_code_free() unmaps JIT pages that the new worker's compiled regexes still point into — causing SIGSEGV on the next regex match in the new worker.",
    examples: [
      {
        label: "Example 1 — Reproducing the crash",
        rows: [
          { key: "Config:   ", value: "pcre_jit on; location ~ '^/[a-d]$' { return 200; }" },
          { key: "Trigger:  ", value: "while true; do curl localhost/a; done & nginx -s reload" },
          { key: "Observed: ", value: "worker process SIGSEGV in sljit_free_exec during reload" },
          { key: "Expected: ", value: "Clean reload with zero worker crashes" },
        ],
      },
      {
        label: "Example 2 — Stack trace at crash",
        rows: [
          { key: "Frame 0: ", value: "sljit_free_exec (libpcre2-8.so)" },
          { key: "Frame 1: ", value: "_pcre2_jit_free_8 (libpcre2-8.so)" },
          { key: "Frame 2: ", value: "pcre2_code_free_8 (libpcre2-8.so)" },
          { key: "Frame 3: ", value: "ngx_regex_cleanup (nginx)" },
          { key: "Frame 4: ", value: "ngx_destroy_pool → ngx_worker_process_exit" },
        ],
      },
    ],
    constraints: [
      { dot: "red",    text: "Worker processes must never crash during or after graceful reload when pcre_jit is enabled." },
      { dot: "blue",   text: "You may only modify files within src/core/ngx_regex.c and src/core/ngx_regex.h." },
      { dot: "yellow", text: "The fix must not disable PCRE2 JIT — JIT must remain functional and enabled for performance." },
      { dot: "green",  text: "All nginx test suite cases (./objs/nginx -t) must pass with the patched binary." },
      { dot: "blue",   text: "The solution must handle fork() copy-on-write semantics correctly — no new external library dependencies may be introduced." },
      { dot: "green",  text: "Memory usage must not grow unboundedly across repeated reloads — the fix must not simply defer all frees indefinitely." },
    ],
    hints: [
      { text: "Hint 1: Consider deferring pcre2_code_free() in the worker until after the new worker has fully initialized. The master process knows when a new worker is ready — could it signal the old worker to release JIT memory only after the handoff is complete?" },
      { text: "Hint 2: PCRE2 provides pcre2_jit_stack_create() and separate JIT stack management. Investigate whether re-compiling regex patterns with JIT after fork (instead of inheriting the parent's JIT-compiled code) avoids the shared mmap problem entirely." },
      { text: "Hint 3: Look at how nginx handles other shared resources across reload — specifically the shared memory zones (ngx_shm_zone_t). The pattern used there to defer cleanup until all workers have rotated may apply directly to the JIT regex cleanup lifecycle." },
    ],
  },

  {
    id: "nginx-1157",
    title: "Upstream Host Header Incorrect with Named Upstream Blocks",
    githubUrl: "https://github.com/nginx/nginx/issues/1157",
    relatedUrls: [
      { label: "↗ Issue #1157", url: "https://github.com/nginx/nginx/issues/1157" },
      { label: "↗ Related Trac #501", url: "https://trac.nginx.org/nginx/ticket/501" },
    ],
    repoLabel: "nginx/nginx",
    repoUrl: "https://github.com/nginx/nginx",
    sourceLabel: "Real-world open source bug · nginx/nginx",
    tag: "Correctness",
    tagColor: "bg-yellow-700",
    company: "NGINX",
    companyLogo: "NX",
    kpiMetric: "Host Header Accuracy",
    difficulty: "medium",
    progress: 42,
    tags: ["C", "NGINX", "HTTP", "Proxy", "Upstream"],
    stats: [
      { label: "Accepted",    value: "31.7%",       color: "green"  },
      { label: "Submissions", value: "3,408",        color: "blue"   },
      { label: "Bug Type",    value: "Wrong Header", color: "red"    },
      { label: "Directive",   value: "proxy_pass",   color: "yellow" },
      { label: "Header",      value: "Host",         color: "blue"   },
      { label: "Severity",    value: "Medium",       color: "yellow" },
    ],
    description: [
      "When `proxy_pass` references a named `upstream {}` block, nginx sets the outgoing `Host` header to the name of the upstream block (e.g. `backend`) rather than the actual resolved server address (e.g. `backend.example.com`). This violates RFC 7230 §5.4 which requires the Host header to reflect the target URI authority.",
      "The incorrect Host header causes backend servers that perform virtual-host routing — SNI, name-based vhosts, cloud load balancers — to return 400 Bad Request or route to the wrong application. The bug is particularly impactful in environments where multiple backends with different hostnames are pooled in a single upstream block.",
      "Your task is to identify where nginx constructs the proxy Host header for upstream-block requests and fix it so the Host header reflects the actual peer address being used for the connection, not the upstream block name.",
    ],
    warningCallout:
      "This is a silent correctness bug — nginx does not log any warning, and the misconfigured Host header is forwarded transparently. Backends that do not validate the Host header will silently serve incorrect content. The bug is masked when all upstream servers share a common hostname, making it very easy to miss in unit testing.",
    bars: [
      { label: "1 srv",  height: 8,  spike: false },
      { label: "",       height: 10, spike: false },
      { label: "2 srv",  height: 50, spike: true  },
      { label: "",       height: 55, spike: true  },
      { label: "3 srv",  height: 60, spike: true  },
      { label: "",       height: 58, spike: true  },
      { label: "N srv",  height: 65, spike: true  },
      { label: "cloud",  height: 70, spike: true  },
    ],
    barCaption: "400 error rate — grows with upstream server hostname diversity",
    codeBlock: {
      filename: "src/http/modules/ngx_http_proxy_module.c — Host header construction (abridged)",
      code: `/* When proxy_pass references a named upstream block, nginx uses
 * the upstream block name as the Host header value — set at
 * config parse time, never updated per-request. */

static ngx_int_t
ngx_http_proxy_create_request(ngx_http_request_t *r)
{
    // ...

    /* BUG: plcf->proxy_host is set at parse time to the upstream
     * block name string (e.g. "backend"), not the peer hostname. */
    if (plcf->proxy_host.len) {
        host = plcf->proxy_host;  // <- always "backend", never "api1.example.com"
    }

    /* Example scenario:
     *   upstream backend {
     *     server api1.example.com;   <- chosen peer this request
     *     server api2.example.com;
     *   }
     *   proxy_pass http://backend;
     *
     * nginx sends:  Host: backend           <- WRONG (block name)
     * Should send:  Host: api1.example.com  <- CORRECT (chosen peer)
     */
}`,
    },
    dangerCallout:
      "Key observation: plcf->proxy_host is populated at configuration parse time with the upstream block name. It is never updated at request time to reflect the peer actually selected by the load balancer. The fix must propagate the selected peer's original hostname into the Host header construction path at request time.",
    examples: [
      {
        label: "Example 1 — Reproducing the bug",
        rows: [
          { key: "Config:   ", value: "upstream be { server api1.example.com; server api2.example.com; }" },
          { key: "Request:  ", value: "curl http://nginx-host/api/users" },
          { key: "Observed: ", value: "Host: be   (upstream block name sent to backend)" },
          { key: "Expected: ", value: "Host: api1.example.com  (actual chosen peer hostname)" },
        ],
      },
      {
        label: "Example 2 — Impact on cloud backends",
        rows: [
          { key: "Backend:  ", value: "AWS ALB / GCP Load Balancer (name-based routing)" },
          { key: "Observed: ", value: "HTTP 400 Bad Request — invalid Host header from upstream" },
          { key: "Workaround:", value: "proxy_set_header Host $proxy_host;  (manual, brittle)" },
          { key: "Goal:     ", value: "Correct Host header automatically without manual override" },
        ],
      },
    ],
    constraints: [
      { dot: "red",    text: "The Host header sent to upstream must reflect the actual peer hostname selected for the connection, not the upstream block name." },
      { dot: "blue",   text: "You may only modify src/http/modules/ngx_http_proxy_module.c and src/http/ngx_http_upstream.c." },
      { dot: "yellow", text: "Existing behavior must be fully preserved when proxy_set_header Host is explicitly configured — user overrides must take priority." },
      { dot: "green",  text: "All existing proxy module tests in t/proxy.t must continue to pass." },
      { dot: "blue",   text: "The fix must work correctly for both round-robin and least-connections upstream balancing strategies." },
      { dot: "green",  text: "The corrected Host header must be determined per-request at runtime, not at configuration parse time." },
    ],
    hints: [
      { text: "Hint 1: Look at how nginx populates u->peer.name after the upstream peer is selected in ngx_http_upstream_connect(). This field contains the actual peer address string and is available at request time — it can be used to set the Host header before the upstream request is written." },
      { text: "Hint 2: The proxy module's request construction runs in ngx_http_proxy_create_request(). Trace how plcf->proxy_host flows into the Host header there, and find the earliest point in the request cycle where the selected peer's hostname is known and can be substituted." },
      { text: "Hint 3: Check whether the upstream server directive stores the original hostname string (before DNS resolution) alongside the resolved sockaddr. The Host header should carry the original hostname, not the resolved IP — so you may need to preserve the name string through the peer selection data structures." },
    ],
  },
];