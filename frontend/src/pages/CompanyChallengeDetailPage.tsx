import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  getChallengeById,
  getChallengeProposals,
  updateChallengeStatus,
} from "@/api/challenges.api";
import Navbar from "@/components/common/Navbar";

interface ProposalRow {
  id: string;
  proposalText: string;
  evaluation: any;
  ticked: number | null;
  total: number | null;
  percentage: number | null;
  decision: string | null;
  reason: string | null;
  status: string;
  createdAt: string;
  engineer: { id: string; name: string; email: string };
  submission: {
    id: string;
    status: string;
    passed: boolean | null;
    achievedValue: number | null;
    improvementDelta: number | null;
    repoUrl: string;
    integrityFlag: boolean;
    createdAt: string;
  } | null;
}

const decisionBadge = (decision: string | null) => {
  if (!decision)
    return {
      cls: "bg-gray-500/15 text-gray-400 border-gray-500/30",
      label: "Pending",
    };
  if (decision === "APPROVED")
    return {
      cls: "bg-green-500/15 text-green-400 border-green-500/30",
      label: "Approved",
    };
  return {
    cls: "bg-red-500/15 text-red-400 border-red-500/30",
    label: "Rejected",
  };
};

const submissionBadge = (sub: ProposalRow["submission"]) => {
  if (!sub) return null;
  if (sub.status === "pending")
    return {
      cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
      label: "Running",
    };
  if (sub.passed)
    return {
      cls: "bg-green-500/15 text-green-400 border-green-500/30",
      label: "Passed",
    };
  if (sub.integrityFlag)
    return {
      cls: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      label: "Flagged",
    };
  return {
    cls: "bg-red-500/15 text-red-400 border-red-500/30",
    label: "Failed",
  };
};

export default function CompanyChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [challenge, setChallenge] = useState<any>(null);
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!id || user?.role !== "company") return;
    loadData();
  }, [id, user]);

  async function loadData() {
    try {
      setLoading(true);
      const [challengeRes, proposalsList] = await Promise.all([
        getChallengeById(id!),
        getChallengeProposals(id!),
      ]);
      setChallenge(challengeRes.challenge);
      setProposals(proposalsList);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load challenge");
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus() {
    if (!challenge) return;
    const newStatus = challenge.status === "open" ? "closed" : "open";
    try {
      setTogglingStatus(true);
      await updateChallengeStatus(challenge.id, newStatus);
      setChallenge((prev: any) => ({ ...prev, status: newStatus }));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update status");
    } finally {
      setTogglingStatus(false);
    }
  }

  if (user?.role !== "company") {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <p className="text-gray-400">
            Only company accounts can view this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 py-16 text-center text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <p className="text-red-400 mb-4">{error || "Challenge not found"}</p>
          <button
            onClick={() => navigate("/my-challenges")}
            className="text-sm text-accent hover:underline"
          >
            Back to My Challenges
          </button>
        </div>
      </div>
    );
  }

  const approvedCount = proposals.filter(
    (p) => p.decision === "APPROVED",
  ).length;
  const submissionCount = proposals.filter((p) => p.submission).length;
  const passedCount = proposals.filter((p) => p.submission?.passed).length;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Back link */}
        <button
          onClick={() => navigate("/my-challenges")}
          className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-1 transition-colors"
        >
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
          Back to My Challenges
        </button>

        {/* Challenge Header */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white mb-2">
                {challenge.title}
              </h1>
              <p className="text-sm text-gray-400 mb-4 max-w-2xl">
                {challenge.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>
                  Vertical:{" "}
                  <span className="text-gray-300 font-medium">
                    {challenge.vertical}
                  </span>
                </span>
                <span>
                  Difficulty:{" "}
                  <span className="text-gray-300 font-medium">
                    {challenge.difficulty}
                  </span>
                </span>
                <span>
                  KPI: {challenge.baselineValue} → {challenge.targetValue} (
                  {challenge.comparisonOperator})
                </span>
                <span>
                  Threshold:{" "}
                  <span className="text-gray-300 font-medium">
                    {challenge.threshold ?? 70}%
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                  challenge.status === "open"
                    ? "bg-green-500/15 text-green-400 border-green-500/30"
                    : "bg-gray-500/15 text-gray-400 border-gray-500/30"
                }`}
              >
                {challenge.status === "open" ? "Open" : "Closed"}
              </span>
              <button
                onClick={toggleStatus}
                disabled={togglingStatus}
                className={`text-xs px-3 py-1.5 rounded border transition-colors disabled:opacity-50 ${
                  challenge.status === "open"
                    ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                    : "border-green-500/30 text-green-400 hover:bg-green-500/10"
                }`}
              >
                {togglingStatus
                  ? "..."
                  : challenge.status === "open"
                    ? "Close Challenge"
                    : "Reopen Challenge"}
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-surface-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {proposals.length}
              </p>
              <p className="text-xs text-gray-500">Proposals</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {approvedCount}
              </p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {submissionCount}
              </p>
              <p className="text-xs text-gray-500">Submissions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">{passedCount}</p>
              <p className="text-xs text-gray-500">Passed</p>
            </div>
          </div>
        </div>

        {/* Checklist */}
        {challenge.checklist && Array.isArray(challenge.checklist) && (
          <div className="bg-surface-card border border-surface-border rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-white mb-3">
              Evaluation Checklist
            </h2>
            <ul className="space-y-1.5">
              {(challenge.checklist as string[]).map(
                (item: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-400"
                  >
                    <span className="text-gray-600 mt-0.5">{i + 1}.</span>
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
        )}

        {/* Proposals + Submissions table */}
        <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-surface-border">
            <h2 className="text-sm font-semibold text-white">
              Proposals & Submissions
            </h2>
          </div>

          {proposals.length === 0 ? (
            <div className="px-5 py-12 text-center text-gray-500 text-sm">
              No proposals have been submitted yet.
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="grid grid-cols-[1fr_120px_80px_100px_120px] gap-4 px-5 py-2.5 border-b border-surface-border text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span>Engineer</span>
                <span className="text-center">Decision</span>
                <span className="text-center">Score</span>
                <span className="text-center">Submission</span>
                <span className="text-center">Date</span>
              </div>

              {/* Rows */}
              {proposals.map((p) => {
                const db = decisionBadge(p.decision);
                const sb = p.submission ? submissionBadge(p.submission) : null;
                const isExpanded = expandedId === p.id;

                return (
                  <div key={p.id} className="border-b border-surface-border/50">
                    {/* Summary row */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      className="grid grid-cols-[1fr_120px_80px_100px_120px] gap-4 px-5 py-3.5 hover:bg-surface-hover cursor-pointer transition-colors"
                    >
                      {/* Engineer */}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-xs text-accent font-medium">
                          {p.engineer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm text-gray-200">
                            {p.engineer.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {p.engineer.email}
                          </p>
                        </div>
                      </div>

                      {/* Decision */}
                      <div className="flex items-center justify-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium border ${db.cls}`}
                        >
                          {db.label}
                        </span>
                      </div>

                      {/* Score */}
                      <div className="flex items-center justify-center">
                        <span className="text-sm text-gray-300 font-mono">
                          {p.percentage != null
                            ? `${Math.round(p.percentage)}%`
                            : "—"}
                        </span>
                      </div>

                      {/* Submission */}
                      <div className="flex items-center justify-center">
                        {sb ? (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium border ${sb.cls}`}
                          >
                            {sb.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </div>

                      {/* Date */}
                      <div className="flex items-center justify-center">
                        <span className="text-xs text-gray-500">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-5 pb-4 bg-surface/50">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Proposal text */}
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                              Proposal Text
                            </h4>
                            <p className="text-sm text-gray-300 whitespace-pre-wrap bg-surface rounded-lg p-3 border border-surface-border max-h-48 overflow-y-auto">
                              {p.proposalText}
                            </p>
                          </div>

                          {/* Evaluation details */}
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                              Evaluation
                            </h4>
                            <div className="bg-surface rounded-lg p-3 border border-surface-border space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Checklist</span>
                                <span className="text-gray-300 font-mono">
                                  {p.ticked ?? "?"}/{p.total ?? "?"} items
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Score</span>
                                <span className="text-gray-300 font-mono">
                                  {p.percentage != null
                                    ? `${p.percentage.toFixed(1)}%`
                                    : "—"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Decision</span>
                                <span className="text-gray-300">
                                  {p.decision ?? "Pending"}
                                </span>
                              </div>
                              {p.reason && (
                                <div>
                                  <span className="text-gray-500 text-xs">
                                    Reason:
                                  </span>
                                  <p className="text-gray-400 text-xs mt-1">
                                    {p.reason}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Submission detail */}
                        {p.submission && (
                          <div className="mt-4">
                            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                              Submission Detail
                            </h4>
                            <div className="bg-surface rounded-lg p-3 border border-surface-border text-sm grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <span className="text-gray-500 text-xs block">
                                  Status
                                </span>
                                <span className="text-gray-300">
                                  {p.submission.status}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-xs block">
                                  Passed
                                </span>
                                <span
                                  className={
                                    p.submission.passed
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }
                                >
                                  {p.submission.passed == null
                                    ? "—"
                                    : p.submission.passed
                                      ? "Yes"
                                      : "No"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-xs block">
                                  Achieved
                                </span>
                                <span className="text-gray-300 font-mono">
                                  {p.submission.achievedValue ?? "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-xs block">
                                  Improvement
                                </span>
                                <span className="text-gray-300 font-mono">
                                  {p.submission.improvementDelta != null
                                    ? `${p.submission.improvementDelta.toFixed(1)}%`
                                    : "—"}
                                </span>
                              </div>
                              {p.submission.repoUrl && (
                                <div className="col-span-2 md:col-span-4">
                                  <span className="text-gray-500 text-xs block">
                                    Repository
                                  </span>
                                  <a
                                    href={p.submission.repoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent text-xs hover:underline"
                                  >
                                    {p.submission.repoUrl}
                                  </a>
                                </div>
                              )}
                              {p.submission.integrityFlag && (
                                <div className="col-span-2 md:col-span-4">
                                  <span className="text-xs px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30">
                                    Integrity Flag — manual review required
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
