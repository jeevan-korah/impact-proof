import { useNavigate } from "react-router-dom";
import { useState } from "react";

type Vertical = "ai_ml" | "frontend" | "backend" | "fullstack";
type Difficulty = "easy" | "medium" | "hard";

interface Problem {
  id: number;
  title: string;
  vertical: Vertical;
  company: string;
  companyLogo: string;
  kpiMetric: string;
  difficulty: Difficulty;
  progress: number; // 0-100
}

const problems: Problem[] = [
  {
    id: 1,
    title: "ML Model Performance on Edge: Reduce to",
    vertical: "ai_ml",
    company: "NVIDIA",
    companyLogo: "NV",
    kpiMetric: "Inference Time",
    difficulty: "hard",
    progress: 85,
  },
  {
    id: 2,
    title: "Refactor Legacy Payment Microservice",
    vertical: "backend",
    company: "PayGlobal",
    companyLogo: "PG",
    kpiMetric: "Transaction Latency",
    difficulty: "hard",
    progress: 70,
  },
  {
    id: 3,
    title: "Implement GraphQL Schema",
    vertical: "backend",
    company: "Meta",
    companyLogo: "M",
    kpiMetric: "Merged PR",
    difficulty: "medium",
    progress: 60,
  },
  {
    id: 4,
    title: "Optimize SVG Rendering Performance",
    vertical: "frontend",
    company: "VectorFlow",
    companyLogo: "VF",
    kpiMetric: "FPS Rate",
    difficulty: "medium",
    progress: 80,
  },
  {
    id: 5,
    title: "ML Model Accuracy Increase to 90%",
    vertical: "ai_ml",
    company: "OpenAI",
    companyLogo: "OA",
    kpiMetric: "Accuracy",
    difficulty: "medium",
    progress: 55,
  },
  {
    id: 6,
    title: "Fullstack Dev Environment: Replicate UI/UX",
    vertical: "fullstack",
    company: "Neural Dynamics",
    companyLogo: "ND",
    kpiMetric: "Visual Fidelity",
    difficulty: "hard",
    progress: 40,
  },
  {
    id: 7,
    title: "Bug Fix: Fix React State Race Condition",
    vertical: "fullstack",
    company: "StartupX",
    companyLogo: "SX",
    kpiMetric: "p99 Latency",
    difficulty: "hard",
    progress: 90,
  },
  {
    id: 8,
    title: "ML Model Accuracy Increase to 90%",
    vertical: "ai_ml",
    company: "OpenAI",
    companyLogo: "OA",
    kpiMetric: "Accuracy",
    difficulty: "medium",
    progress: 45,
  },
  {
    id: 9,
    title: "Improve Lighthouse score from 58 to ≥80",
    vertical: "frontend",
    company: "Acme Corp",
    companyLogo: "AC",
    kpiMetric: "Lighthouse Score",
    difficulty: "medium",
    progress: 65,
  },
  {
    id: 10,
    title: "Implement GraphQL Schema",
    vertical: "backend",
    company: "Meta",
    companyLogo: "M",
    kpiMetric: "Merged PR",
    difficulty: "medium",
    progress: 75,
  },
  {
    id: 11,
    title: "Optimize SVG Rendering Performance",
    vertical: "frontend",
    company: "VectorFlow",
    companyLogo: "VF",
    kpiMetric: "FPS Rate",
    difficulty: "medium",
    progress: 50,
  },
  {
    id: 12,
    title: "Frontend: Fix Button Border Bug",
    vertical: "frontend",
    company: "Vercel",
    companyLogo: "V",
    kpiMetric: "Merged PR",
    difficulty: "easy",
    progress: 30,
  },
];

const verticalLabel: Record<Vertical, string> = {
  ai_ml: "AI/ML",
  frontend: "Frontend",
  backend: "Backend",
  fullstack: "Fullstack",
};

const verticalColor: Record<Vertical, string> = {
  ai_ml: "bg-purple-600",
  frontend: "bg-blue-600",
  backend: "bg-orange-600",
  fullstack: "bg-teal-600",
};

const difficultyColor: Record<Difficulty, string> = {
  easy: "text-accent",
  medium: "text-yellow-400",
  hard: "text-red-400",
};

const difficultyLabel: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Med.",
  hard: "Hard",
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = problems.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.company.toLowerCase().includes(search.toLowerCase()) ||
      p.kpiMetric.toLowerCase().includes(search.toLowerCase()),
  );

  const handleProblemClick = (problem: Problem) => {
    if (problem.vertical === "ai_ml") {
      navigate(`/challenge/ml/${problem.id}`);
    } else {
      navigate(`/challenge/ide/${problem.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-surface-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded flex items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-white tracking-tight">
            ImpactProof
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-surface-card border border-surface-border flex items-center justify-center text-sm text-gray-400">
            U
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Title + Search */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-white">
            ImpactProof Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions"
                className="bg-surface-card border border-surface-border rounded-lg pl-9 pr-4 py-2 text-sm text-gray-300 placeholder-gray-600 w-64 focus:outline-none focus:border-accent/50"
              />
            </div>
            <button className="p-2 rounded-lg border border-surface-border hover:bg-surface-hover text-gray-400">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button className="p-2 rounded-lg border border-surface-border hover:bg-surface-hover text-gray-400">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[60px_1fr_180px_160px_100px] gap-4 px-5 py-3 border-b border-surface-border text-xs font-medium text-gray-500 uppercase tracking-wider">
            <span>#</span>
            <span>Challenge Title (with Vertical Icon)</span>
            <span>Company</span>
            <span>KPI Metric</span>
            <span className="text-right">Difficulty</span>
          </div>

          {/* Table Body */}
          {filtered.map((problem, _idx) => (
            <div
              key={`${problem.id}-${_idx}`}
              onClick={() => handleProblemClick(problem)}
              className="grid grid-cols-[60px_1fr_180px_160px_100px] gap-4 px-5 py-4 border-b border-surface-border/50 hover:bg-surface-hover cursor-pointer transition-colors group"
            >
              {/* Number */}
              <span className="text-sm text-gray-500 font-mono">
                {_idx + 1}.
              </span>

              {/* Title + Vertical Tag */}
              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${verticalColor[problem.vertical]} text-white leading-none`}
                >
                  {verticalLabel[problem.vertical]}
                </span>
                <span className="text-sm text-gray-200 group-hover:text-white transition-colors">
                  {problem.title}
                </span>
              </div>

              {/* Company */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-surface border border-surface-border flex items-center justify-center text-[10px] font-bold text-gray-400">
                  {problem.companyLogo}
                </div>
                <span className="text-sm text-gray-400">{problem.company}</span>
              </div>

              {/* KPI Metric */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">
                  {problem.kpiMetric}
                </span>
                <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden max-w-[60px]">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${problem.progress}%` }}
                  />
                </div>
              </div>

              {/* Difficulty */}
              <div className="text-right">
                <span
                  className={`text-sm font-medium ${difficultyColor[problem.difficulty]}`}
                >
                  {difficultyLabel[problem.difficulty]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
