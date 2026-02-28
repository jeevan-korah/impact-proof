import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getMyChallenges, updateChallengeStatus } from "@/api/challenges.api";
import type { Challenge } from "@/types/challenge.types";
import Navbar from "@/components/common/Navbar";

const verticalLabel: Record<string, string> = {
  ml: "AI/ML",
  frontend: "Frontend",
  backend: "Backend",
};

const verticalColor: Record<string, string> = {
  ml: "bg-purple-600",
  frontend: "bg-blue-600",
  backend: "bg-orange-600",
};

const difficultyColor: Record<string, string> = {
  easy: "text-accent",
  medium: "text-yellow-400",
  hard: "text-red-400",
};

export default function MyChallengesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "company") return;
    loadChallenges();
  }, [user]);

  async function loadChallenges() {
    try {
      setLoading(true);
      const data = await getMyChallenges();
      setChallenges(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load challenges");
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(challengeId: string, currentStatus: string) {
    const newStatus = currentStatus === "open" ? "closed" : "open";
    try {
      setTogglingId(challengeId);
      await updateChallengeStatus(challengeId, newStatus as "open" | "closed");
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challengeId ? { ...c, status: newStatus } : c,
        ),
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
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

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-white">My Challenges</h1>
          <button
            onClick={() => navigate("/create-challenge")}
            className="px-4 py-2 text-sm bg-accent hover:bg-accent-dim text-white rounded-lg font-medium transition-colors"
          >
            + New Challenge
          </button>
        </div>

        {loading && (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {!loading && challenges.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">
              You haven't created any challenges yet.
            </p>
            <button
              onClick={() => navigate("/create-challenge")}
              className="px-4 py-2 text-sm bg-accent hover:bg-accent-dim text-white rounded-lg font-medium transition-colors"
            >
              Create Your First Challenge
            </button>
          </div>
        )}

        {!loading && challenges.length > 0 && (
          <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_100px_100px_100px_100px_140px] gap-4 px-5 py-3 border-b border-surface-border text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span>Challenge</span>
              <span className="text-center">Vertical</span>
              <span className="text-center">Proposals</span>
              <span className="text-center">Submissions</span>
              <span className="text-center">Status</span>
              <span className="text-center">Actions</span>
            </div>

            {/* Table Body */}
            {challenges.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-[1fr_100px_100px_100px_100px_140px] gap-4 px-5 py-4 border-b border-surface-border/50 hover:bg-surface-hover transition-colors"
              >
                {/* Title + Difficulty */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => navigate(`/company/challenge/${c.id}`)}
                    className="text-sm text-gray-200 hover:text-white transition-colors text-left font-medium"
                  >
                    {c.title}
                  </button>
                  <span
                    className={`text-xs ${difficultyColor[c.difficulty] || "text-gray-500"}`}
                  >
                    {c.difficulty?.charAt(0).toUpperCase() +
                      c.difficulty?.slice(1)}{" "}
                    · {c.baselineValue} → {c.targetValue}
                  </span>
                </div>

                {/* Vertical */}
                <div className="flex items-center justify-center">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${verticalColor[c.vertical] || "bg-gray-600"} text-white leading-none`}
                  >
                    {verticalLabel[c.vertical] || c.vertical}
                  </span>
                </div>

                {/* Proposal count */}
                <div className="flex items-center justify-center">
                  <span className="text-sm text-gray-300">
                    {c._count?.proposals ?? 0}
                  </span>
                </div>

                {/* Submission count */}
                <div className="flex items-center justify-center">
                  <span className="text-sm text-gray-300">
                    {c._count?.submissions ?? 0}
                  </span>
                </div>

                {/* Status badge */}
                <div className="flex items-center justify-center">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.status === "open"
                        ? "bg-green-500/15 text-green-400 border border-green-500/30"
                        : "bg-gray-500/15 text-gray-400 border border-gray-500/30"
                    }`}
                  >
                    {c.status === "open" ? "Open" : "Closed"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => navigate(`/company/challenge/${c.id}`)}
                    className="text-xs px-2.5 py-1 rounded border border-accent/30 text-accent hover:bg-accent/10 transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(c.id, c.status);
                    }}
                    disabled={togglingId === c.id}
                    className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                      c.status === "open"
                        ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                        : "border-green-500/30 text-green-400 hover:bg-green-500/10"
                    } disabled:opacity-50`}
                  >
                    {togglingId === c.id
                      ? "..."
                      : c.status === "open"
                        ? "Close"
                        : "Reopen"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
