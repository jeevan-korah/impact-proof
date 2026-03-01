import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
  language?: string;
}

const fileTree: FileNode[] = [
  {
    name: "src",
    type: "folder",
    children: [
      {
        name: "app.js",
        type: "file",
        language: "javascript",
        content: `import React from "react";
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import "./styles.css";

export default function App() {
  const [metrics, setMetrics] = useState({
    lighthouse: 58,
    fcp: 3800,
    lcp: 5200,
    tbt: 890,
  });

  useEffect(() => {
    // Fetch initial metrics
    fetchMetrics().then(setMetrics);
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">
        <Header title="ImpactProof Performance" />
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <Dashboard metrics={metrics} />
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

async function fetchMetrics() {
  // Simulate API call
  return {
    lighthouse: 58,
    fcp: 3800,
    lcp: 5200,
    tbt: 890,
  };
}`,
      },
      {
        name: "components",
        type: "folder",
        children: [
          {
            name: "Header.js",
            type: "file",
            language: "javascript",
            content: `import React from "react";

export default function Header({ title }) {
  return (
    <header className="header">
      <h1>{title}</h1>
      <nav>
        <a href="/">Dashboard</a>
        <a href="/metrics">Metrics</a>
      </nav>
    </header>
  );
}`,
          },
          {
            name: "Dashboard.js",
            type: "file",
            language: "javascript",
            content: `import React from "react";
import MetricCard from "./MetricCard";

export default function Dashboard({ metrics }) {
  return (
    <div className="dashboard">
      <MetricCard
        label="Lighthouse Score"
        value={metrics.lighthouse}
        target={80}
      />
      <MetricCard
        label="First Contentful Paint"
        value={metrics.fcp + "ms"}
        target="< 1800ms"
      />
      <MetricCard
        label="Largest Contentful Paint"
        value={metrics.lcp + "ms"}
        target="< 2500ms"
      />
    </div>
  );
}`,
          },
          {
            name: "MetricCard.js",
            type: "file",
            language: "javascript",
            content: `import React from "react";

export default function MetricCard({ label, value, target }) {
  return (
    <div className="metric-card">
      <h3>{label}</h3>
      <p className="value">{value}</p>
      <p className="target">Target: {target}</p>
    </div>
  );
}`,
          },
        ],
      },
      {
        name: "styles.css",
        type: "file",
        language: "css",
        content: `.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #eee;
}

.dashboard {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 24px;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.metric-card .value {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 8px 0;
}

.metric-card .target {
  color: #666;
  font-size: 0.875rem;
}`,
      },
      {
        name: "index.html",
        type: "file",
        language: "html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ImpactProof</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="app.js"></script>
</body>
</html>`,
      },
    ],
  },
];

// Syntax highlighting (simplified token-based)
function highlightCode(code: string, language: string): JSX.Element[] {
  const lines = code.split("\n");
  return lines.map((line, i) => (
    <div key={i} className="flex">
      <span className="w-12 text-right pr-4 text-gray-600 select-none text-xs leading-6">
        {i + 1}
      </span>
      <span className="flex-1 leading-6 text-xs">
        <HighlightedLine line={line} language={language} />
      </span>
    </div>
  ));
}

function HighlightedLine({
  line,
  language,
}: {
  line: string;
  language: string;
}) {
  if (language === "css") {
    return <CSSLine line={line} />;
  }
  // JS/HTML highlighting
  const tokens = tokenizeLine(line);
  return (
    <>
      {tokens.map((token, i) => (
        <span key={i} className={token.className}>
          {token.text}
        </span>
      ))}
    </>
  );
}

function CSSLine({ line }: { line: string }) {
  const trimmed = line.trim();
  if (
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*") ||
    trimmed.endsWith("*/")
  ) {
    return <span className="text-gray-500 italic">{line}</span>;
  }
  if (trimmed.includes("{") || trimmed.includes("}")) {
    return <span className="text-yellow-300">{line}</span>;
  }
  if (trimmed.includes(":")) {
    const colonIdx = line.indexOf(":");
    return (
      <>
        <span className="text-sky-300">{line.slice(0, colonIdx)}</span>
        <span className="text-gray-300">:</span>
        <span className="text-orange-300">{line.slice(colonIdx + 1)}</span>
      </>
    );
  }
  return <span className="text-gray-300">{line}</span>;
}

interface Token {
  text: string;
  className: string;
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  const keywords = [
    "import",
    "from",
    "export",
    "default",
    "function",
    "return",
    "const",
    "let",
    "var",
    "if",
    "else",
    "async",
    "await",
    "new",
    "class",
    "extends",
  ];
  const jsxKeywords = [
    "className",
    "onClick",
    "onChange",
    "href",
    "type",
    "value",
    "key",
    "src",
    "alt",
    "label",
    "target",
    "title",
  ];

  // Simple regex-based tokenizer
  let remaining = line;
  while (remaining.length > 0) {
    // Comments
    if (remaining.startsWith("//")) {
      tokens.push({ text: remaining, className: "text-gray-500 italic" });
      break;
    }
    // Strings
    const stringMatch = remaining.match(/^(["'`])([^"'`]*)\1/);
    if (stringMatch) {
      tokens.push({ text: stringMatch[0], className: "text-accent" });
      remaining = remaining.slice(stringMatch[0].length);
      continue;
    }
    // JSX tags
    const tagMatch = remaining.match(/^(<\/?)([\w]+)/);
    if (tagMatch) {
      tokens.push({ text: tagMatch[1], className: "text-gray-400" });
      tokens.push({ text: tagMatch[2], className: "text-red-400" });
      remaining = remaining.slice(tagMatch[0].length);
      continue;
    }
    // Keywords
    const wordMatch = remaining.match(/^(\w+)/);
    if (wordMatch) {
      const word = wordMatch[1];
      if (keywords.includes(word)) {
        tokens.push({ text: word, className: "text-purple-400" });
      } else if (jsxKeywords.includes(word)) {
        tokens.push({ text: word, className: "text-sky-300" });
      } else if (word[0] === word[0].toUpperCase() && /^[A-Z]/.test(word)) {
        tokens.push({ text: word, className: "text-yellow-300" });
      } else if (/^\d+$/.test(word)) {
        tokens.push({ text: word, className: "text-orange-300" });
      } else {
        tokens.push({ text: word, className: "text-gray-200" });
      }
      remaining = remaining.slice(word.length);
      continue;
    }
    // Operators & punctuation
    tokens.push({ text: remaining[0], className: "text-gray-400" });
    remaining = remaining.slice(1);
  }
  return tokens;
}

export default function IDEChallengePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeFile, setActiveFile] = useState<string>("src/app.js");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["src", "src/components"]),
  );

  const challengeTitle =
    id === "9"
      ? "Improve Lighthouse score from 58 to ≥80"
      : id === "4" || id === "11"
        ? "Optimize SVG Rendering Performance"
        : id === "7"
          ? "Bug Fix: Fix React State Race Condition"
          : id === "12"
            ? "Frontend: Fix Button Border Bug"
            : id === "6"
              ? "Fullstack Dev Environment: Replicate UI/UX"
              : id === "2"
                ? "Refactor Legacy Payment Microservice"
                : id === "3" || id === "10"
                  ? "Implement GraphQL Schema"
                  : "Challenge";

  // Find active file content
  function findFile(nodes: FileNode[], path: string): FileNode | null {
    for (const node of nodes) {
      if (node.type === "file") {
        const fullPath = path ? `${path}/${node.name}` : node.name;
        // We'll match by the stored activeFile path
      }
      if (node.type === "folder" && node.children) {
        const found = findFile(
          node.children,
          path ? `${path}/${node.name}` : node.name,
        );
        if (found) return found;
      }
    }
    return null;
  }

  function getFileByPath(
    path: string,
    nodes: FileNode[],
    currentPath: string = "",
  ): FileNode | null {
    for (const node of nodes) {
      const fullPath = currentPath ? `${currentPath}/${node.name}` : node.name;
      if (fullPath === path && node.type === "file") return node;
      if (node.type === "folder" && node.children) {
        const found = getFileByPath(path, node.children, fullPath);
        if (found) return found;
      }
    }
    return null;
  }

  const currentFile = getFileByPath(activeFile, fileTree);

  function toggleFolder(path: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function renderFileTree(
    nodes: FileNode[],
    parentPath: string = "",
    depth: number = 0,
  ) {
    return nodes.map((node) => {
      const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;
      if (node.type === "folder") {
        const isExpanded = expandedFolders.has(fullPath);
        return (
          <div key={fullPath}>
            <div
              onClick={() => toggleFolder(fullPath)}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:bg-surface-hover cursor-pointer"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="#e8a838"
                stroke="none"
              >
                <path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              <span>{node.name}</span>
            </div>
            {isExpanded &&
              node.children &&
              renderFileTree(node.children, fullPath, depth + 1)}
          </div>
        );
      }

      const isActive = activeFile === fullPath;
      const ext = node.name.split(".").pop();
      const iconColor =
        ext === "js"
          ? "text-yellow-400"
          : ext === "css"
            ? "text-blue-400"
            : ext === "html"
              ? "text-orange-400"
              : "text-gray-400";

      return (
        <div
          key={fullPath}
          onClick={() => setActiveFile(fullPath)}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs cursor-pointer ${
            isActive
              ? "bg-surface-hover text-white"
              : "text-gray-400 hover:bg-surface-hover/50"
          }`}
          style={{ paddingLeft: `${depth * 12 + 20}px` }}
        >
          <span className={`font-bold text-[10px] ${iconColor}`}>
            {ext === "js"
              ? "JS"
              : ext === "css"
                ? "#"
                : ext === "html"
                  ? "<>"
                  : ""}
          </span>
          <span>{node.name}</span>
        </div>
      );
    });
  }

  return (
    <div className="h-screen flex flex-col bg-surface overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-card border-b border-surface-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-accent rounded flex items-center justify-center">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">
              ImpactProof
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-300 font-medium">
          #{id}: {challengeTitle}
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-xs bg-accent hover:bg-accent-dim text-white rounded-md font-medium transition-colors">
            Submit Solution
          </button>
        </div>
      </div>

      {/* Main IDE Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar (VS Code sidebar icons) */}
        <div className="w-12 bg-surface flex flex-col items-center py-3 gap-4 border-r border-surface-border">
          <button className="p-2 text-white bg-surface-hover rounded">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
            </svg>
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-300">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-300">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
            </svg>
          </button>
        </div>

        {/* File Explorer */}
        <div className="w-56 bg-surface-card border-r border-surface-border flex flex-col">
          <div className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            File Explorer
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderFileTree(fileTree)}
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor Tabs */}
          <div className="flex bg-surface border-b border-surface-border">
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-card border-r border-surface-border text-xs text-white">
              <span className="text-yellow-400 font-bold text-[10px]">JS</span>
              <span>{activeFile.split("/").pop()}</span>
              <button className="ml-2 text-gray-500 hover:text-white">×</button>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="px-4 py-1 bg-surface-card border-b border-surface-border text-[11px] text-gray-500">
            {activeFile.split("/").map((part, i, arr) => (
              <span key={i}>
                {i > 0 && <span className="mx-1 text-gray-600">›</span>}
                <span className={i === arr.length - 1 ? "text-gray-300" : ""}>
                  {part}
                </span>
              </span>
            ))}
          </div>

          {/* Code Content */}
          <div className="flex-1 overflow-auto bg-surface-card font-mono p-2">
            {currentFile ? (
              highlightCode(
                currentFile.content || "",
                currentFile.language || "javascript",
              )
            ) : (
              <div className="text-gray-600 text-sm p-4">
                Select a file to view its contents
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between px-4 py-1 bg-[#007acc] text-white text-[11px]">
            <div className="flex items-center gap-4">
              <span>⚡ ImpactProof</span>
              <span>main</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Ln 1, Col 1</span>
              <span>Spaces: 2</span>
              <span>UTF-8</span>
              <span>{currentFile?.language?.toUpperCase() || "JS"}</span>
            </div>
          </div>
        </div>

        {/* Browser Preview Panel */}
        <div className="w-[420px] flex flex-col border-l border-surface-border">
          {/* Browser toolbar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-card border-b border-surface-border">
            <span className="text-[11px] text-gray-500 font-medium">
              Browser Preview
            </span>
            <div className="flex-1" />
            <button className="text-gray-500 hover:text-white text-xs">
              ×
            </button>
          </div>

          {/* URL bar */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border-b border-surface-border">
            <button className="text-gray-500 hover:text-gray-300">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="text-gray-500 hover:text-gray-300">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button className="text-gray-500 hover:text-gray-300">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
              </svg>
            </button>
            <div className="flex-1 bg-surface-card rounded px-3 py-1 text-[11px] text-gray-400 border border-surface-border">
              localhost:3000
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-surface-card border border-surface-border" />
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-500"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </div>
          </div>

          {/* Browser content - Mockup of the app */}
          <div className="flex-1 bg-white overflow-auto p-4">
            {/* Mock rendered page */}
            <div className="max-w-md mx-auto">
              {/* App icon */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-accent flex items-center justify-center">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
              </div>

              {/* Performance card */}
              <div className="bg-gray-900 rounded-xl p-6 text-white mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-300">
                    ImpactProof Performance
                  </h3>
                  <button className="text-gray-500 text-xs">×</button>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  Current Lighthouse Score:
                </p>
                <div className="text-6xl font-bold text-center mb-6">58</div>

                {/* Mini chart */}
                <div className="relative h-20 mb-4">
                  <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between h-full px-2">
                    <div className="text-[9px] text-gray-500 absolute left-0 top-0">
                      100
                    </div>
                    <div className="text-[9px] text-gray-500 absolute left-0 top-1/2">
                      50
                    </div>
                    <div className="text-[9px] text-gray-500 absolute left-0 bottom-0">
                      35
                    </div>
                  </div>
                  <svg viewBox="0 0 200 80" className="w-full h-full">
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      points="10,65 50,55 90,50 130,40 170,35 200,30"
                    />
                    <polyline
                      fill="url(#gradient)"
                      stroke="none"
                      points="10,65 50,55 90,50 130,40 170,35 200,30 200,80 10,80"
                      opacity="0.15"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="flex justify-between text-[9px] text-gray-600 mt-1 px-2">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                  </div>
                </div>

                <button className="w-full py-2.5 bg-surface-card border border-surface-border rounded-lg text-sm text-gray-300 hover:bg-surface-hover transition-colors flex items-center justify-center gap-2">
                  Run Lighthouse Check
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                  </svg>
                </button>

                {/* Metric badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium">
                    FCP
                  </span>
                  <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium">
                    LCP
                  </span>
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                    TBT
                  </span>
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                    CTP
                  </span>
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                    RMG
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
