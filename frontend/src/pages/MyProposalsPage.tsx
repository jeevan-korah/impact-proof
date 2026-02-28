import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyProposals } from "@/api/proposals.api";
import { useAuth } from "@/hooks/useAuth";
import type { Proposal } from "@/types/proposal.types";
import Navbar from "@/components/common/Navbar";

export default function MyProposalsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getMyProposals()
      .then((data) => {
        setProposals(data ?? []);
      })
      .catch((err) => {
        setError(err?.response?.data?.message ?? "Failed to load proposals");
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-gray-400 mb-4">
            You must be logged in to view your proposals.
          </p>
          <Link to="/login" className="text-accent hover:underline">
            Login
          </Link>
        </div>
      </div>
    );
  }

  const decisionBadge = (d: string | null) => {
    if (!d)
      return (
        <span className="px-2 py-0.5 text-xs rounded bg-gray-700 text-gray-400">
          Pending
        </span>
      );
    if (d === "APPROVED")
      return (
        <span className="px-2 py-0.5 text-xs rounded bg-accent/10 border border-accent/30 text-accent font-medium">
          Approved
        </span>
      );
    return (
      <span className="px-2 py-0.5 text-xs rounded bg-red-500/10 border border-red-500/30 text-red-400 font-medium">
        Rejected
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-white mb-6">My Proposals</h1>

        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {!loading && proposals.length === 0 && (
          <div className="bg-surface-card border border-surface-border rounded-xl p-10 text-center">
            <p className="text-gray-400 mb-2">
              You haven't submitted any proposals yet.
            </p>
            <Link to="/" className="text-accent text-sm hover:underline">
              Browse challenges
            </Link>
          </div>
        )}

        {proposals.length > 0 && (
          <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_140px_80px_80px_100px] gap-4 px-5 py-3 border-b border-surface-border text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span>Challenge</span>
              <span>Decision</span>
              <span className="text-center">Score</span>
              <span className="text-center">Items</span>
              <span className="text-right">Date</span>
            </div>

            {/* Rows */}
            {proposals.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  const v = p.challenge?.vertical;
                  const route =
                    v === "ml"
                      ? `/challenge/ml/${p.challengeId}`
                      : `/challenge/ide/${p.challengeId}`;
                  navigate(route);
                }}
                className="grid grid-cols-[1fr_140px_80px_80px_100px] gap-4 px-5 py-4 border-b border-surface-border/50 hover:bg-surface-hover cursor-pointer transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-200 truncate">
                    {p.challenge?.title ?? p.challengeId}
                  </span>
                  <span className="text-xs text-gray-600 truncate max-w-md">
                    {p.proposalText.slice(0, 80)}…
                  </span>
                </div>
                <div className="flex items-center">
                  {decisionBadge(p.decision)}
                </div>
                <div className="flex items-center justify-center">
                  <span
                    className={`text-sm font-mono ${(p.percentage ?? 0) >= 50 ? "text-accent" : "text-red-400"}`}
                  >
                    {p.percentage != null ? `${p.percentage}%` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-center text-sm text-gray-400">
                  {p.ticked != null ? `${p.ticked}/${p.total}` : "—"}
                </div>
                <div className="flex items-center justify-end text-xs text-gray-500">
                  {new Date(p.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
