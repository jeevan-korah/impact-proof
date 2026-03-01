import { useState, useEffect } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Sora:wght@300;400;600;700&display=swap');

  .apisix-wrapper {
    background: #0d1117;
    color: #c9d1d9;
    font-family: 'Sora', sans-serif;
    min-height: 100vh;
    padding: 40px 20px;
    line-height: 1.6;
  }

  .apisix-inner {
    max-width: 860px;
    margin: 0 auto;
    animation: fadeUp 0.6s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .header-strip {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 28px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: #8b949e;
  }
  .header-strip a { color: #58a6ff; text-decoration: none; }
  .header-strip a:hover { text-decoration: underline; }
  .sep { color: #30363d; }

  .card {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 12px;
    overflow: hidden;
  }

  .card-top {
    padding: 24px 28px 20px;
    border-bottom: 1px solid #30363d;
  }

  .title-row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }

  .problem-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: #8b949e;
    padding-top: 3px;
    white-space: nowrap;
  }

  .problem-title {
    font-size: 22px;
    font-weight: 700;
    color: #e6edf3;
    letter-spacing: -0.3px;
    margin: 0;
  }

  .tags-row {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
  }
  .badge-hard { background: rgba(248,81,73,0.1); color: #f85149; border: 1px solid rgba(248,81,73,0.3); }
  .badge-perf { background: rgba(86,211,100,0.1); color: #56d364; border: 1px solid rgba(86,211,100,0.3); }
  .badge-tag  { background: #1c2333; color: #8b949e; border: 1px solid #30363d; font-weight: 400; }

  .stats-row {
    display: flex;
    gap: 24px;
    padding: 14px 28px;
    background: #1c2333;
    border-bottom: 1px solid #30363d;
    flex-wrap: wrap;
  }
  .stat-item { display: flex; flex-direction: column; gap: 2px; }
  .stat-label {
    font-size: 11px;
    color: #8b949e;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-family: 'JetBrains Mono', monospace;
  }
  .stat-value {
    font-size: 14px;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
  }
  .sv-green { color: #56d364; }
  .sv-red   { color: #f85149; }
  .sv-blue  { color: #58a6ff; }
  .sv-yellow{ color: #d29922; }

  .card-body { padding: 28px; }
  section + section { margin-top: 28px; }

  .section-title {
    font-size: 14px;
    font-weight: 700;
    color: #58a6ff;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
    font-family: 'JetBrains Mono', monospace;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #30363d;
  }

  .prose { color: #c9d1d9; font-size: 15px; margin-bottom: 10px; }
  .prose:last-child { margin-bottom: 0; }

  .inline-code {
    background: #1c2333;
    padding: 1px 5px;
    border-radius: 4px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
  }

  .callout {
    background: #1c2333;
    border-left: 3px solid #58a6ff;
    border-radius: 0 8px 8px 0;
    padding: 14px 16px;
    font-size: 14px;
    margin: 12px 0;
    color: #c9d1d9;
  }
  .callout-warn   { border-color: #d29922; }
  .callout-danger { border-color: #f85149; }

  .code-block {
    background: #010409;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 16px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    line-height: 1.7;
    overflow-x: auto;
    margin: 12px 0;
    color: #c9d1d9;
  }
  .kw  { color: #ff7b72; }
  .fn  { color: #d2a8ff; }
  .str { color: #a5d6ff; }
  .cm  { color: #8b949e; font-style: italic; }
  .num { color: #79c0ff; }

  .latency-visual {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 80px;
    margin: 16px 0 8px;
    padding: 0 4px;
  }
  .bar-group { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
  .bar { width: 100%; border-radius: 4px 4px 0 0; transition: height 0.8s cubic-bezier(0.34,1.56,0.64,1); }
  .bar-normal { background: rgba(86,211,100,0.6); }
  .bar-spike  { background: rgba(248,81,73,0.75); }
  .bar-label  { font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #8b949e; }
  .visual-caption { font-size: 12px; color: #8b949e; text-align: center; font-family: 'JetBrains Mono', monospace; }
  .visual-legend { display: flex; gap: 16px; justify-content: center; margin-top: 8px; }
  .legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #8b949e; font-family: 'JetBrains Mono', monospace; }
  .legend-dot { width: 10px; height: 10px; border-radius: 2px; }

  .constraints-list { list-style: none; display: flex; flex-direction: column; gap: 10px; padding: 0; }
  .constraints-list li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14px;
    padding: 10px 14px;
    background: #1c2333;
    border: 1px solid #30363d;
    border-radius: 8px;
    transition: border-color 0.2s;
  }
  .constraints-list li:hover { border-color: #58a6ff; }
  .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }
  .dot-blue   { background: #58a6ff; }
  .dot-yellow { background: #d29922; }
  .dot-red    { background: #f85149; }
  .dot-green  { background: #56d364; }

  .example-box {
    background: #010409;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 16px;
    margin: 10px 0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
  }
  .example-label { color: #8b949e; margin-bottom: 8px; font-size: 12px; }
  .io-row { display: flex; gap: 8px; margin: 4px 0; color: #c9d1d9; }
  .io-key { color: #58a6ff; flex-shrink: 0; }

  .card-footer {
    padding: 16px 28px;
    border-top: 1px solid #30363d;
    background: #1c2333;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
  }
  .footer-links { display: flex; gap: 16px; }
  .footer-link {
    font-size: 12px;
    color: #8b949e;
    text-decoration: none;
    font-family: 'JetBrains Mono', monospace;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: color 0.2s;
  }
  .footer-link:hover { color: #58a6ff; }
  .footer-source { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8b949e; }
`;

const BARS = [
  { label: "P50",  height: 18, spike: false },
  { label: "",     height: 16, spike: false },
  { label: "P75",  height: 19, spike: false },
  { label: "",     height: 22, spike: false },
  { label: "P90",  height: 24, spike: false },
  { label: "",     height: 25, spike: false },
  { label: "P99",  height: 72, spike: true  },
  { label: "P999", height: 78, spike: true  },
];

const STATS = [
  { label: "Accepted",    value: "12.4%",     cls: "sv-green"  },
  { label: "Submissions", value: "4,831",      cls: "sv-blue"   },
  { label: "Baseline P99",value: "> 3,000ms",  cls: "sv-red"    },
  { label: "Target P99",  value: "< 10ms",     cls: "sv-green"  },
  { label: "Upstream P99",value: "~1ms",       cls: "sv-yellow" },
  { label: "Test QPS",    value: "~30 RPS",    cls: "sv-blue"   },
];

const CONSTRAINTS = [
  { dot: "dot-blue",   text: <>You may only modify files within <code className="inline-code">apisix/plugins/prometheus/</code> — the plugin API surface must remain unchanged.</> },
  { dot: "dot-green",  text: <>All existing Prometheus metrics (<code className="inline-code">apisix_http_status</code>, <code className="inline-code">apisix_http_latency</code>, <code className="inline-code">apisix_bandwidth</code>, etc.) must still be exported correctly.</> },
  { dot: "dot-yellow", text: <>The fix must not introduce data races — NGINX workers share metric state via <code className="inline-code">ngx.shared.DICT</code>.</> },
  { dot: "dot-red",    text: <>P99 latency under a Prometheus scrape at 30 RPS must drop below <strong>10ms</strong> on the provided benchmark hardware.</> },
  { dot: "dot-blue",   text: <>The solution must be compatible with NGINX's single-threaded, non-blocking event loop model — <strong>no blocking C calls or OS threads</strong>.</> },
  { dot: "dot-green",  text: <>All existing test cases in <code className="inline-code">t/plugin/prometheus*.t</code> must continue to pass.</> },
];

const HINTS = [
  { text: <><strong>Hint 1:</strong> In LuaJIT / OpenResty, <code className="inline-code">ngx.sleep(0)</code> yields the current coroutine back to the NGINX event loop without introducing any real delay, allowing pending I/O and timer callbacks to be processed. Strategic placement of yield points inside long-running loops can dramatically reduce scheduling latency for other coroutines.</> },
  { text: <><strong>Hint 2:</strong> Consider whether the metrics scrape endpoint needs to be co-located with the main NGINX worker processes at all. APISIX already has a concept of a separate <em>privileged agent</em> process — could the expensive collection be offloaded there?</> },
  { text: <><strong>Hint 3:</strong> The <code className="inline-code">re_gmatch</code> iterator in <code className="inline-code">nginx_status()</code> and the health-checker loop in <code className="inline-code">collect()</code> are both candidates for yielding. Look at where CPU time is concentrated in the flame graph and add <code className="inline-code">ngx.sleep(0)</code> calls to break up the hot path.</> },
];

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  );
}

export default function APISIXChallenge() {
  const [barsVisible, setBarsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBarsVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div className="apisix-wrapper">
        <div className="apisix-inner">

          {/* Breadcrumb */}
          <div className="header-strip">
            <span>Problems</span>
            <span className="sep">/</span>
            <span>Performance</span>
            <span className="sep">/</span>
            <span style={{ color: "#e6edf3" }}>APISIX-7919</span>
            <span style={{ marginLeft: "auto" }}>
              <a href="https://github.com/apache/apisix/issues/7919" target="_blank" rel="noreferrer">
                ↗ View on GitHub
              </a>
            </span>
          </div>

          <div className="card">

            {/* Title */}
            <div className="card-top">
              <div className="title-row">
                <span className="problem-num">#7919</span>
                <h1 className="problem-title">Reduce P99 Latency Spikes in APISIX Prometheus Plugin</h1>
              </div>
              <div className="tags-row">
                <span className="badge badge-hard">Hard</span>
                <span className="badge badge-perf">Performance</span>
                {["Lua / OpenResty", "Apache APISIX", "Prometheus", "Concurrency"].map(t => (
                  <span key={t} className="badge badge-tag">{t}</span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
              {STATS.map(s => (
                <div key={s.label} className="stat-item">
                  <span className="stat-label">{s.label}</span>
                  <span className={`stat-value ${s.cls}`}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="card-body">

              {/* Description */}
              <section>
                <div className="section-title">Description</div>
                <p className="prose">
                  Apache APISIX is a cloud-native API gateway built on top of OpenResty (NGINX + LuaJIT). When the{" "}
                  <code className="inline-code">prometheus</code> plugin is enabled on a route, APISIX collects request metrics (HTTP status codes, latency histograms, bandwidth) and exports them via{" "}
                  <code className="inline-code">/apisix/prometheus/metrics</code>.
                </p>
                <p className="prose">
                  Users running APISIX v2.15.0 in production have observed that{" "}
                  <strong style={{ color: "#e6edf3" }}>P99 request latency spikes to multiple seconds</strong>, even though upstream services respond in under 2ms. CPU flame graphs clearly show that the{" "}
                  <code className="inline-code">exporter.lua</code> and prometheus metric collection routines are consuming a disproportionate share of CPU time <em>within the request lifecycle</em>.
                </p>

                <div className="callout callout-warn">
                  The Prometheus scrape endpoint's <strong>collect()</strong> function is computationally heavy — it iterates NGINX status, ETCD indices, upstream health checks, and serializes all histogram buckets in one synchronous Lua coroutine. When Prometheus scrapes this endpoint under live traffic, it monopolizes the NGINX event loop and causes other requests to queue up, producing{" "}
                  <strong>long-tail (P99/P999) latency spikes</strong>.
                </div>

                {/* Latency Bar Chart */}
                <div className="latency-visual">
                  {BARS.map((b, i) => (
                    <div key={i} className="bar-group">
                      <div
                        className={`bar ${b.spike ? "bar-spike" : "bar-normal"}`}
                        style={{ height: barsVisible ? b.height : 0 }}
                      />
                      <span className="bar-label">{b.label}</span>
                    </div>
                  ))}
                </div>
                <p className="visual-caption">Latency distribution — P50–P90 normal, P99+ extreme spike</p>
                <div className="visual-legend">
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: "rgba(86,211,100,0.6)" }} />
                    Normal range (&lt;5ms)
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: "rgba(248,81,73,0.75)" }} />
                    Spike zone (&gt;500ms)
                  </div>
                </div>

                <p className="prose" style={{ marginTop: 16 }}>
                  Your task is to identify the root cause in{" "}
                  <code className="inline-code">apisix/plugins/prometheus/exporter.lua</code> and fix it so that the P99 request latency drops to within an acceptable range of upstream latency, without compromising the accuracy of collected metrics.
                </p>
              </section>

              {/* Relevant Code */}
              <section>
                <div className="section-title">Relevant Code</div>
                <p style={{ fontSize: 13, color: "#8b949e", marginBottom: 8 }}>
                  apisix/plugins/prometheus/exporter.lua — collect() function (abridged)
                </p>
                <div className="code-block">
                  <span className="kw">local function</span> <span className="fn">nginx_status</span>()<br />
                  &nbsp;&nbsp;<span className="kw">local</span> res = http_new():request_uri(<span className="str">"http://127.0.0.1:"</span> .. port .. <span className="str">"/nginx_status"</span>)<br />
                  &nbsp;&nbsp;<span className="kw">if not</span> res <span className="kw">then</span> <span className="kw">return</span> <span className="kw">end</span><br />
                  <br />
                  &nbsp;&nbsp;<span className="cm">-- Parses a multi-line text response with regex iteration</span><br />
                  &nbsp;&nbsp;<span className="kw">local</span> iterator = re_gmatch(res.body, <span className="str">[[(\d+)]]</span>, <span className="str">"jmo"</span>)<br />
                  &nbsp;&nbsp;<span className="kw">for</span> _, name <span className="kw">in</span> ipairs(ngx_status_items) <span className="kw">do</span><br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="kw">local</span> val = iterator()<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="cm">-- ... update gauge metrics ...</span><br />
                  &nbsp;&nbsp;<span className="kw">end</span><br />
                  <span className="kw">end</span><br />
                  <br />
                  <span className="kw">local function</span> <span className="fn">collect</span>(ctx, stream_only)<br />
                  &nbsp;&nbsp;<span className="fn">shared_dict_status</span>()   <span className="cm">-- iterate all shared dicts</span><br />
                  &nbsp;&nbsp;<span className="fn">nginx_status</span>()          <span className="cm">-- HTTP call + regex parsing</span><br />
                  &nbsp;&nbsp;<span className="fn">etcd_modify_index</span>()     <span className="cm">-- ETCD HTTP call</span><br />
                  &nbsp;&nbsp;<span className="cm">-- upstream health status loop...</span><br />
                  &nbsp;&nbsp;<span className="kw">local</span> stats = control.get_health_checkers()<br />
                  &nbsp;&nbsp;<span className="kw">for</span> _, c <span className="kw">in</span> ipairs(stats) <span className="kw">do</span><br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="cm">-- ... expensive table iteration ...</span><br />
                  &nbsp;&nbsp;<span className="kw">end</span><br />
                  &nbsp;&nbsp;<span className="cm">-- Serialize all histograms and counters into text</span><br />
                  &nbsp;&nbsp;<span className="kw">return</span> <span className="num">200</span>, prometheus:metric_data()<br />
                  <span className="kw">end</span>
                </div>
                <div className="callout callout-danger">
                  <strong>Key observation:</strong> All work in <code className="inline-code">collect()</code> runs synchronously in a single Lua coroutine with no <code className="inline-code">ngx.sleep(0)</code> yield points, preventing the NGINX event loop from handling other requests while a Prometheus scrape is in progress.
                </div>
              </section>

              {/* Examples */}
              <section>
                <div className="section-title">Examples</div>
                <div className="example-box">
                  <div className="example-label">Example 1 — Reproducing the bug</div>
                  <div className="io-row"><span className="io-key">Setup:&nbsp;&nbsp;&nbsp;&nbsp;</span> Route with prometheus + proxy-mirror plugins, roundrobin upstream (5 nodes)</div>
                  <div className="io-row"><span className="io-key">Traffic:&nbsp;&nbsp;</span> ~30 RPS with concurrent Prometheus scrape every 15s</div>
                  <div className="io-row"><span className="io-key">Observed:</span> P99 latency = 3,000ms+, upstream P99 = ~1ms</div>
                  <div className="io-row"><span className="io-key">Expected:</span> P99 latency ≈ upstream P99 + small constant overhead</div>
                </div>
                <div className="example-box">
                  <div className="example-label">Example 2 — Benchmark target (wrk2 @ 5000 RPS)</div>
                  <div className="io-row"><span className="io-key">Before fix:&nbsp;</span> P99 = 10,900ms | P99.9 = 39,550ms</div>
                  <div className="io-row"><span className="io-key">After fix:&nbsp;&nbsp;</span> P99 &lt; 10ms | P99.9 &lt; 40ms (target)</div>
                </div>
              </section>

              {/* Constraints */}
              <section>
                <div className="section-title">Constraints</div>
                <ul className="constraints-list">
                  {CONSTRAINTS.map((c, i) => (
                    <li key={i}>
                      <div className={`dot ${c.dot}`} />
                      <span>{c.text}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Hints */}
              <section>
                <div className="section-title">Hints</div>
                {HINTS.map((h, i) => (
                  <div key={i} className="callout">{h.text}</div>
                ))}
              </section>

            </div>

            {/* Footer */}
            <div className="card-footer">
              <div className="footer-links">
                <a className="footer-link" href="https://github.com/apache/apisix" target="_blank" rel="noreferrer">
                  <GitHubIcon /> apache/apisix
                </a>
                <a className="footer-link" href="https://github.com/apache/apisix/issues/7919" target="_blank" rel="noreferrer">
                  ↗ Issue #7919
                </a>
                <a className="footer-link" href="https://github.com/apache/apisix/issues/5755" target="_blank" rel="noreferrer">
                  ↗ Related #5755
                </a>
              </div>
              <span className="footer-source">Real-world open source bug · apache/apisix@2.15.0</span>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
