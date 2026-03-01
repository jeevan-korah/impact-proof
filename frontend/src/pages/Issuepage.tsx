import { useState, useEffect } from "react";
import type { Issue } from "../data/issues";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Sora:wght@300;400;600;700&display=swap');

  .issue-wrapper {
    background: #0d1117;
    color: #c9d1d9;
    font-family: 'Sora', sans-serif;
    min-height: 100vh;
    padding: 40px 20px;
    line-height: 1.6;
  }
  .issue-inner {
    max-width: 860px;
    margin: 0 auto;
    animation: fadeUp 0.6s ease both;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .issue-breadcrumb {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 28px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: #8b949e;
  }
  .issue-breadcrumb a { color: #58a6ff; text-decoration: none; }
  .issue-breadcrumb a:hover { text-decoration: underline; }
  .issue-card {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 12px;
    overflow: hidden;
  }
  .issue-card-top {
    padding: 24px 28px 20px;
    border-bottom: 1px solid #30363d;
  }
  .issue-title-row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }
  .issue-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: #8b949e;
    padding-top: 3px;
    white-space: nowrap;
  }
  .issue-title {
    font-size: 22px;
    font-weight: 700;
    color: #e6edf3;
    letter-spacing: -0.3px;
    margin: 0;
  }
  .issue-tags-row {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
  }
  .badge-hard   { background: rgba(248,81,73,0.1); color: #f85149; border: 1px solid rgba(248,81,73,0.3); }
  .badge-medium { background: rgba(210,153,34,0.1); color: #d29922; border: 1px solid rgba(210,153,34,0.3); }
  .badge-easy   { background: rgba(86,211,100,0.1); color: #56d364; border: 1px solid rgba(86,211,100,0.3); }
  .badge-perf   { background: rgba(86,211,100,0.1); color: #56d364; border: 1px solid rgba(86,211,100,0.3); }
  .badge-tag    { background: #1c2333; color: #8b949e; border: 1px solid #30363d; font-weight: 400; }
  .issue-stats-row {
    display: flex;
    gap: 24px;
    padding: 14px 28px;
    background: #1c2333;
    border-bottom: 1px solid #30363d;
    flex-wrap: wrap;
  }
  .stat-item { display: flex; flex-direction: column; gap: 2px; }
  .stat-label { font-size: 11px; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'JetBrains Mono', monospace; }
  .stat-value { font-size: 14px; font-weight: 600; font-family: 'JetBrains Mono', monospace; }
  .sv-green  { color: #56d364; }
  .sv-red    { color: #f85149; }
  .sv-blue   { color: #58a6ff; }
  .sv-yellow { color: #d29922; }
  .issue-body { padding: 28px; }
  .issue-section + .issue-section { margin-top: 28px; }
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
  .section-title::after { content: ''; flex: 1; height: 1px; background: #30363d; }
  .prose { color: #c9d1d9; font-size: 15px; margin-bottom: 10px; }
  .prose:last-child { margin-bottom: 0; }
  .icode { background: #1c2333; padding: 1px 5px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
  .callout { background: #1c2333; border-left: 3px solid #58a6ff; border-radius: 0 8px 8px 0; padding: 14px 16px; font-size: 14px; margin: 12px 0; color: #c9d1d9; }
  .callout-warn   { border-color: #d29922; }
  .callout-danger { border-color: #f85149; }
  .code-block { background: #010409; border: 1px solid #30363d; border-radius: 8px; padding: 16px; font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.7; overflow-x: auto; margin: 12px 0; color: #c9d1d9; white-space: pre; }
  .latency-visual { display: flex; align-items: flex-end; gap: 6px; height: 80px; margin: 16px 0 8px; padding: 0 4px; }
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
  .constraints-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; padding: 10px 14px; background: #1c2333; border: 1px solid #30363d; border-radius: 8px; transition: border-color 0.2s; }
  .constraints-list li:hover { border-color: #58a6ff; }
  .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }
  .dot-blue   { background: #58a6ff; }
  .dot-yellow { background: #d29922; }
  .dot-red    { background: #f85149; }
  .dot-green  { background: #56d364; }
  .example-box { background: #010409; border: 1px solid #30363d; border-radius: 8px; padding: 16px; margin: 10px 0; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
  .example-label { color: #8b949e; margin-bottom: 8px; font-size: 12px; }
  .io-row { display: flex; gap: 8px; margin: 4px 0; color: #c9d1d9; }
  .io-key { color: #58a6ff; flex-shrink: 0; }
  .issue-footer { padding: 16px 28px; border-top: 1px solid #30363d; background: #1c2333; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
  .footer-links { display: flex; gap: 16px; }
  .footer-link { font-size: 12px; color: #8b949e; text-decoration: none; font-family: 'JetBrains Mono', monospace; display: flex; align-items: center; gap: 5px; transition: color 0.2s; }
  .footer-link:hover { color: #58a6ff; }
  .footer-source { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8b949e; }
`;

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  );
}

interface IssuePageProps {
  issue: Issue;
}

export default function IssuePage({ issue }: IssuePageProps) {
  const [barsVisible, setBarsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBarsVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  const diffBadgeClass =
    issue.difficulty === "hard" ? "badge-hard"
    : issue.difficulty === "medium" ? "badge-medium"
    : "badge-easy";

  return (
    <>
      <style>{styles}</style>
      <div className="issue-wrapper">
        <div className="issue-inner">

          {/* Breadcrumb */}
          <div className="issue-breadcrumb">
            <span>Problems</span>
            <span style={{ color: "#30363d" }}>/</span>
            <span>Issues</span>
            <span style={{ color: "#30363d" }}>/</span>
            <span style={{ color: "#e6edf3" }}>{issue.id.toUpperCase()}</span>
            <span style={{ marginLeft: "auto" }}>
              <a href={issue.githubUrl} target="_blank" rel="noreferrer">↗ View on GitHub</a>
            </span>
          </div>

          <div className="issue-card">

            {/* Title */}
            <div className="issue-card-top">
              <div className="issue-title-row">
                <span className="issue-num">#{issue.id}</span>
                <h1 className="issue-title">{issue.title}</h1>
              </div>
              <div className="issue-tags-row">
                <span className={`badge ${diffBadgeClass}`}>
                  {issue.difficulty.charAt(0).toUpperCase() + issue.difficulty.slice(1)}
                </span>
                <span className="badge badge-perf">{issue.tag}</span>
                {issue.tags.map((t) => (
                  <span key={t} className="badge badge-tag">{t}</span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="issue-stats-row">
              {issue.stats.map((s) => (
                <div key={s.label} className="stat-item">
                  <span className="stat-label">{s.label}</span>
                  <span className={`stat-value sv-${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="issue-body">

              {/* Description */}
              <div className="issue-section">
                <div className="section-title">Description</div>
                {issue.description.map((para, i) => (
                  <p key={i} className="prose"
                    dangerouslySetInnerHTML={{
                      __html: para.replace(/`([^`]+)`/g, '<code class="icode">$1</code>')
                        .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#e6edf3">$1</strong>'),
                    }}
                  />
                ))}

                <div className="callout callout-warn"
                  dangerouslySetInnerHTML={{
                    __html: issue.warningCallout
                      .replace(/`([^`]+)`/g, '<code class="icode">$1</code>')
                      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'),
                  }}
                />

                {/* Bar chart */}
                {issue.bars.length > 0 && (
                  <>
                    <div className="latency-visual">
                      {issue.bars.map((b, i) => (
                        <div key={i} className="bar-group">
                          <div
                            className={`bar ${b.spike ? "bar-spike" : "bar-normal"}`}
                            style={{ height: barsVisible ? b.height : 0 }}
                          />
                          <span className="bar-label">{b.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="visual-caption">{issue.barCaption}</p>
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
                  </>
                )}
              </div>

              {/* Code */}
              <div className="issue-section">
                <div className="section-title">Relevant Code</div>
                <p style={{ fontSize: 13, color: "#8b949e", marginBottom: 8 }}>
                  {issue.codeBlock.filename}
                </p>
                <div className="code-block">{issue.codeBlock.code}</div>
                <div className="callout callout-danger"
                  dangerouslySetInnerHTML={{
                    __html: issue.dangerCallout
                      .replace(/`([^`]+)`/g, '<code class="icode">$1</code>')
                      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'),
                  }}
                />
              </div>

              {/* Examples */}
              <div className="issue-section">
                <div className="section-title">Examples</div>
                {issue.examples.map((ex, i) => (
                  <div key={i} className="example-box">
                    <div className="example-label">{ex.label}</div>
                    {ex.rows.map((row, j) => (
                      <div key={j} className="io-row">
                        <span className="io-key">{row.key}</span>
                        <span>{row.value}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Constraints */}
              <div className="issue-section">
                <div className="section-title">Constraints</div>
                <ul className="constraints-list">
                  {issue.constraints.map((c, i) => (
                    <li key={i}>
                      <div className={`dot dot-${c.dot}`} />
                      <span
                        dangerouslySetInnerHTML={{
                          __html: c.text.replace(/`([^`]+)`/g, '<code class="icode">$1</code>'),
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hints */}
              <div className="issue-section">
                <div className="section-title">Hints</div>
                {issue.hints.map((h, i) => (
                  <div key={i} className="callout"
                    dangerouslySetInnerHTML={{
                      __html: h.text.replace(/`([^`]+)`/g, '<code class="icode">$1</code>'),
                    }}
                  />
                ))}
              </div>

            </div>

            {/* Footer */}
            <div className="issue-footer">
              <div className="footer-links">
                <a className="footer-link" href={issue.repoUrl} target="_blank" rel="noreferrer">
                  <GitHubIcon /> {issue.repoLabel}
                </a>
                {issue.relatedUrls?.map((u) => (
                  <a key={u.url} className="footer-link" href={u.url} target="_blank" rel="noreferrer">
                    {u.label}
                  </a>
                ))}
              </div>
              <span className="footer-source">{issue.sourceLabel}</span>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}