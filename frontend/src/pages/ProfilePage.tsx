// src/pages/ProfilePage.tsx
// ── Full engineer profile: LeetCode × GitHub aesthetic ──────────────────
// Uses: getMyProfile, getPublicProfile, discoverEngineers, getMyProposalHistory
// Design matches DashboardPage.tsx surface/card/border/accent tokens.

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/common/Navbar";
import { useAuth } from "@/hooks/useAuth";
import type {
  PrivateProfileResponse,
  EngineerProfile,
  VerticalStats,
} from "@/types/profile.types";
import type { Vertical, Difficulty } from "@/types/challenge.types";
import {
  getMyProfile,
  getPublicProfile,
  getMyProposalHistory,
} from "@/api/profile.api";

// ── Colour maps matching DashboardPage ───────────────────────────────────
const verticalColor: Record<string, string> = {
  ml: "bg-purple-600",
  ai_ml: "bg-purple-600",
  frontend: "bg-blue-600",
  backend: "bg-orange-600",
  fullstack: "bg-teal-600",
};
const verticalLabel: Record<string, string> = {
  ml: "AI/ML",
  ai_ml: "AI/ML",
  frontend: "Frontend",
  backend: "Backend",
  fullstack: "Fullstack",
};
const difficultyColor: Record<string, string> = {
  easy: "text-accent",
  medium: "text-yellow-400",
  hard: "text-red-400",
};

// ── Small reusable atoms ─────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
        {label}
      </span>
      <span className="text-2xl font-bold text-white font-mono">{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  );
}

function VerticalBar({
  vertical,
  stats,
}: {
  vertical: string;
  stats: VerticalStats;
}) {
  const pct = stats.passRate;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${verticalColor[vertical]} text-white leading-none`}
          >
            {verticalLabel[vertical] ?? vertical}
          </span>
          <span className="text-xs text-gray-400">
            {stats.passed}/{stats.attempted} passed
          </span>
        </div>
        <span className="text-xs font-mono text-gray-300">{pct}%</span>
      </div>
      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-gray-600">
        avg Δ {stats.avgImprovement}%
      </span>
    </div>
  );
}

function ActivityHeatmap({ records }: { records: any[] }) {
  // Build a simple 12-week × 7-day grid from recordedAt timestamps
  const today = new Date();
  const cells: { date: string; count: number; passed: boolean | null }[] = [];
  const lookup: Record<string, { count: number; passed: boolean }> = {};

  records.forEach((r) => {
    const d = r.recordedAt?.slice(0, 10);
    if (!d) return;
    if (!lookup[d]) lookup[d] = { count: 0, passed: false };
    lookup[d].count++;
    if (r.passed) lookup[d].passed = true;
  });

  // 84 days back
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({
      date: key,
      count: lookup[key]?.count ?? 0,
      passed: lookup[key]?.passed ?? null,
    });
  }

  function cellColor(c: { count: number; passed: boolean | null }) {
    if (c.count === 0) return "bg-surface border border-surface-border";
    if (!c.passed) return "bg-red-900/60 border border-red-800/40";
    if (c.count >= 3) return "bg-accent border border-accent/60";
    if (c.count === 2) return "bg-accent/70 border border-accent/40";
    return "bg-accent/40 border border-accent/20";
  }

  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < 84; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div className="flex gap-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((cell, di) => (
            <div
              key={di}
              title={`${cell.date} — ${cell.count} submission${cell.count !== 1 ? "s" : ""}`}
              className={`w-3 h-3 rounded-sm ${cellColor(cell)} cursor-default`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function ProposalDonut({ summary }: { summary: any }) {
  const { shortlisted = 0, rejected = 0, pending = 0, total = 0 } = summary;
  const r = 28,
    cx = 36,
    cy = 36,
    circumference = 2 * Math.PI * r;
  const sRate = total > 0 ? shortlisted / total : 0;
  const rRate = total > 0 ? rejected / total : 0;

  return (
    <div className="flex items-center gap-4">
      <svg width="72" height="72" className="shrink-0">
        {/* background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#1e2130"
          strokeWidth="8"
        />
        {/* shortlisted arc */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#22c55e"
          strokeWidth="8"
          strokeDasharray={`${circumference * sRate} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          className="transition-all duration-700"
        />
        {/* rejected arc */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#ef4444"
          strokeWidth="8"
          strokeDasharray={`${circumference * rRate} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(${-90 + 360 * sRate} ${cx} ${cy})`}
          className="transition-all duration-700"
        />
        <text
          x={cx}
          y={cy + 5}
          textAnchor="middle"
          fill="white"
          fontSize="12"
          fontWeight="bold"
        >
          {summary.acceptanceRate}%
        </text>
      </svg>
      <div className="flex flex-col gap-1.5 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          <span className="text-gray-400">
            Shortlisted{" "}
            <span className="text-white font-mono">{shortlisted}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          <span className="text-gray-400">
            Rejected <span className="text-white font-mono">{rejected}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-500 inline-block" />
          <span className="text-gray-400">
            Pending <span className="text-white font-mono">{pending}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────
type Tab = "overview" | "impact" | "proposals";

// ── Main Component ────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { engineerId } = useParams<{ engineerId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isOwn = !engineerId || engineerId === user?.id;

  const [data, setData] = useState<PrivateProfileResponse | null>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    setLoading(true);
    const profileFetch = isOwn ? getMyProfile() : getPublicProfile(engineerId!);
    const proposalFetch = isOwn ? getMyProposalHistory() : Promise.resolve([]);

    Promise.all([profileFetch, proposalFetch])
      .then(([profileData, proposalData]) => {
        setData(profileData);
        setProposals(proposalData);
      })
      .catch(() => setError("Could not load profile."))
      .finally(() => setLoading(false));
  }, [engineerId, isOwn]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-500 text-sm">Loading profile…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-gray-400">{error ?? "Profile not found."}</div>
        </div>
      </div>
    );
  }

  const {
    user: profileUser,
    profile,
    impactRecords,
    proposalSummary,
    verticalBreakdown,
    recentActivity,
  } = data;

  const passRate =
    profile.totalSubmissions > 0
      ? ((profile.totalPassed / profile.totalSubmissions) * 100).toFixed(1)
      : "0.0";

  const joinYear = new Date(profileUser.createdAt).getFullYear();
  const memberSince = `${new Date(profileUser.createdAt).toLocaleString("default", { month: "short" })} ${joinYear}`;

  // ── Rank badge ──
  function rankBadge(kpi: number) {
    if (kpi >= 90)
      return {
        label: "Elite",
        color: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
      };
    if (kpi >= 70)
      return {
        label: "Expert",
        color: "text-purple-400 border-purple-400/40 bg-purple-400/10",
      };
    if (kpi >= 50)
      return {
        label: "Advanced",
        color: "text-blue-400 border-blue-400/40 bg-blue-400/10",
      };
    if (kpi >= 30)
      return {
        label: "Intermediate",
        color: "text-teal-400 border-teal-400/40 bg-teal-400/10",
      };
    return {
      label: "Beginner",
      color: "text-gray-400 border-gray-400/40 bg-gray-400/10",
    };
  }

  const rank = rankBadge(profile.kpiScore);

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* ── Hero card ─────────────────────────────────────────────── */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-6 flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-xl bg-surface border border-surface-border flex items-center justify-center text-2xl font-bold text-gray-300 select-none">
              {profileUser.name.slice(0, 2).toUpperCase()}
            </div>
            <span
              className={`absolute -bottom-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded border ${rank.color}`}
            >
              {rank.label}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold text-white">
                {profileUser.name}
              </h1>
              {isOwn && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent font-semibold uppercase tracking-wide">
                  You
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 flex-wrap text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                Member since {memberSince}
              </span>
              {profileUser.githubUrl && (
                <a
                  href={profileUser.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  GitHub
                </a>
              )}
            </div>

            {/* KPI Score bar */}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500 w-16 shrink-0">
                KPI Score
              </span>
              <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden max-w-xs">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, profile.kpiScore)}%` }}
                />
              </div>
              <span className="text-sm font-mono text-white">
                {profile.kpiScore.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="flex sm:flex-col gap-3 sm:items-end text-right shrink-0">
            <div>
              <div className="text-2xl font-bold text-white font-mono">
                {profile.totalPassed}
              </div>
              <div className="text-[11px] text-gray-500">challenges passed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white font-mono">
                {profile.avgImprovement.toFixed(1)}%
              </div>
              <div className="text-[11px] text-gray-500">avg improvement</div>
            </div>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────── */}
        <div className="flex gap-1 border-b border-surface-border">
          {(
            ["overview", "impact", ...(isOwn ? ["proposals"] : [])] as Tab[]
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-accent text-accent"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB: OVERVIEW                                             */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            {/* Stat cards row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Submissions" value={profile.totalSubmissions} />
              <StatCard
                label="Passed"
                value={profile.totalPassed}
                sub={`${passRate}% pass rate`}
              />
              <StatCard
                label="Avg Improvement"
                value={`${profile.avgImprovement.toFixed(1)}%`}
              />
              <StatCard
                label="KPI Score"
                value={profile.kpiScore.toFixed(1)}
                sub={rank.label}
              />
            </div>

            {/* Activity heatmap + vertical breakdown side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Heatmap */}
              <div className="bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">
                    Submission Activity
                  </h2>
                  <span className="text-xs text-gray-600">last 12 weeks</span>
                </div>
                <div className="overflow-x-auto">
                  <ActivityHeatmap records={impactRecords} />
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-600">
                  <span>Less</span>
                  <div className="flex gap-0.5">
                    {[
                      "bg-surface border-surface-border",
                      "bg-accent/30",
                      "bg-accent/50",
                      "bg-accent/70",
                      "bg-accent",
                    ].map((c, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-sm ${c} border border-surface-border`}
                      />
                    ))}
                  </div>
                  <span>More</span>
                </div>
              </div>

              {/* Vertical breakdown */}
              <div className="bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col gap-4">
                <h2 className="text-sm font-semibold text-white">
                  Vertical Performance
                </h2>
                <div className="flex flex-col gap-4">
                  {Object.entries(verticalBreakdown).map(([vert, stats]) => (
                    <VerticalBar
                      key={vert}
                      vertical={vert}
                      stats={stats as VerticalStats}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Proposal summary */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-white">
                Proposal Summary
              </h2>
              <ProposalDonut summary={proposalSummary} />
            </div>

            {/* Recent activity */}
            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-surface-border flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  Recent Activity
                </h2>
                <button
                  onClick={() => setActiveTab("impact")}
                  className="text-xs text-accent hover:text-accent/80 transition-colors"
                >
                  View all →
                </button>
              </div>
              {recentActivity.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-600 text-sm">
                  No activity yet.
                </div>
              ) : (
                recentActivity.map((item, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_140px_80px_80px] gap-4 px-5 py-3.5 border-b border-surface-border/50 hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.passed ? "bg-accent" : "bg-red-500"}`}
                      />
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${verticalColor[item.vertical] ?? "bg-gray-700"} text-white leading-none shrink-0`}
                      >
                        {verticalLabel[item.vertical] ?? item.vertical}
                      </span>
                      <span className="text-sm text-gray-300 truncate">
                        {item.challengeTitle}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-medium ${difficultyColor[item.difficulty] ?? "text-gray-400"}`}
                    >
                      {item.difficulty.charAt(0).toUpperCase() +
                        item.difficulty.slice(1)}
                    </span>
                    <span
                      className={`text-sm font-mono ${item.improvementDelta >= 0 ? "text-accent" : "text-red-400"}`}
                    >
                      {item.improvementDelta >= 0 ? "+" : ""}
                      {item.improvementDelta}%
                    </span>
                    <span className="text-xs text-gray-600 text-right">
                      {new Date(item.recordedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB: IMPACT RECORDS                                       */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "impact" && (
          <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[60px_1fr_120px_100px_90px_90px] gap-4 px-5 py-3 border-b border-surface-border text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span>#</span>
              <span>Challenge</span>
              <span>Vertical</span>
              <span>Difficulty</span>
              <span>Δ Improvement</span>
              <span className="text-right">Date</span>
            </div>

            {impactRecords.length === 0 ? (
              <div className="px-5 py-12 text-center text-gray-600 text-sm">
                No impact records yet.
              </div>
            ) : (
              impactRecords.map((record, idx) => (
                <div
                  key={record.id ?? idx}
                  className="grid grid-cols-[60px_1fr_120px_100px_90px_90px] gap-4 px-5 py-4 border-b border-surface-border/50 hover:bg-surface-hover transition-colors group"
                >
                  <span className="text-sm text-gray-500 font-mono">
                    {idx + 1}.
                  </span>

                  <div className="flex items-center gap-2 min-w-0">
                    {(record as any).integrityFlag && (
                      <span
                        title="Flagged"
                        className="shrink-0 w-2 h-2 rounded-full bg-yellow-500"
                      />
                    )}
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${record.passed ? "bg-accent" : "bg-red-500"}`}
                    />
                    <span className="text-sm text-gray-200 group-hover:text-white transition-colors truncate">
                      {(record as any).challenge?.title ?? "—"}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded self-center ${verticalColor[(record as any).challenge?.vertical] ?? "bg-gray-700"} text-white leading-none w-fit`}
                  >
                    {verticalLabel[(record as any).challenge?.vertical] ??
                      (record as any).challenge?.vertical}
                  </span>

                  <span
                    className={`text-sm font-medium self-center ${difficultyColor[(record as any).challenge?.difficulty] ?? "text-gray-400"}`}
                  >
                    {((record as any).challenge?.difficulty ?? "")
                      .charAt(0)
                      .toUpperCase() +
                      ((record as any).challenge?.difficulty ?? "").slice(1)}
                  </span>

                  <span
                    className={`text-sm font-mono self-center ${(record as any).improvementDelta >= 0 ? "text-accent" : "text-red-400"}`}
                  >
                    {(record as any).improvementDelta >= 0 ? "+" : ""}
                    {(record as any).improvementDelta}%
                  </span>

                  <span className="text-xs text-gray-600 text-right self-center">
                    {new Date((record as any).recordedAt).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "2-digit" },
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB: PROPOSALS  (owner only)                              */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "proposals" && isOwn && (
          <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_130px_100px_110px_90px] gap-4 px-5 py-3 border-b border-surface-border text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span>Challenge</span>
              <span>Vertical</span>
              <span>Status</span>
              <span>Submission</span>
              <span className="text-right">Date</span>
            </div>

            {proposals.length === 0 ? (
              <div className="px-5 py-12 text-center text-gray-600 text-sm">
                No proposals yet.
              </div>
            ) : (
              proposals.map((p, idx) => {
                const statusColor: Record<string, string> = {
                  shortlisted:
                    "text-green-400 bg-green-400/10 border-green-400/30",
                  rejected: "text-red-400 bg-red-400/10 border-red-400/30",
                  pending:
                    "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
                };
                const sc =
                  statusColor[p.status] ??
                  "text-gray-400 bg-gray-400/10 border-gray-400/30";

                return (
                  <div
                    key={p.id ?? idx}
                    className="grid grid-cols-[1fr_130px_100px_110px_90px] gap-4 px-5 py-4 border-b border-surface-border/50 hover:bg-surface-hover transition-colors group"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm text-gray-200 group-hover:text-white transition-colors truncate">
                        {p.challenge?.title ?? "—"}
                      </span>
                      <span className="text-[11px] text-gray-600">
                        {p.challenge?.baselineValue} →{" "}
                        {p.challenge?.targetValue}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded self-center ${verticalColor[p.challenge?.vertical] ?? "bg-gray-700"} text-white leading-none w-fit`}
                    >
                      {verticalLabel[p.challenge?.vertical] ??
                        p.challenge?.vertical}
                    </span>

                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded border self-center w-fit capitalize ${sc}`}
                    >
                      {p.status}
                    </span>

                    <div className="flex flex-col self-center">
                      {p.submission ? (
                        <>
                          <span
                            className={`text-xs font-mono ${p.submission.passed ? "text-accent" : "text-red-400"}`}
                          >
                            {p.submission.passed ? "✓ Passed" : "✗ Failed"}
                          </span>
                          <span className="text-[11px] text-gray-600">
                            Δ {p.submission.improvementDelta >= 0 ? "+" : ""}
                            {p.submission.improvementDelta}%
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-600">
                          No submission
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-gray-600 text-right self-center">
                      {new Date(p.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}