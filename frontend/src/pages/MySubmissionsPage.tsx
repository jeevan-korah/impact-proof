import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMySubmissions } from "@/api/submissions.api";
import { useAuth } from "@/hooks/useAuth";
import type { Submission } from "@/types/submission.types";
import Navbar from "@/components/common/Navbar";

export default function MySubmissionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getMySubmissions()
      .then((data) => {
        setSubmissions(data ?? []);
      })
      .catch((err) => {
        setError(err?.response?.data?.message ?? "Failed to load submissions");
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-gray-400 mb-4">
            You must be logged in to view your submissions.
          </p>
          <Link to="/login" className="text-accent hover:underline">
            Login
          </Link>
        </div>
      </div>
    );
  }

  const statusBadge = (s: string) => {
    if (s === "completed")
      return (
        <span className="px-2 py-0.5 text-xs rounded bg-accent/10 border border-accent/30 text-accent font-medium">
          Completed
        </span>
      );
    if (s === "flagged")
      return (
        <span className="px-2 py-0.5 text-xs rounded bg-red-500/10 border border-red-500/30 text-red-400 font-medium">
          Flagged
        </span>
      );
    return (
      <span className="px-2 py-0.5 text-xs rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-medium">
        Pending
      </span>
    );
  };

  const passBadge = (passed: boolean | null) => {
    if (passed === null)
      return <span className="text-xs text-gray-600">—</span>;
    if (passed)
      return <span className="text-xs text-accent font-medium">PASS</span>;
    return <span className="text-xs text-red-400 font-medium">FAIL</span>;
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-white mb-6">
          My Submissions
        </h1>

        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {!loading && submissions.length === 0 && (
          <div className="bg-surface-card border border-surface-border rounded-xl p-10 text-center">
            <p className="text-gray-400 mb-2">
              You haven't submitted any solutions yet.
            </p>
            <p className="text-gray-600 text-sm">
              Submit a proposal first, get approved, then submit your GitHub
              repo.
            </p>
            <Link
              to="/"
              className="text-accent text-sm hover:underline mt-3 inline-block"
            >
              Browse challenges
            </Link>
          </div>
        )}

        {submissions.length > 0 && (
          <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_200px_90px_80px_100px_100px] gap-4 px-5 py-3 border-b border-surface-border text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span>Challenge</span>
              <span>Repo</span>
              <span>Status</span>
              <span className="text-center">Result</span>
              <span className="text-center">Achieved</span>
              <span className="text-right">Date</span>
            </div>

            {/* Rows */}
            {submissions.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  const v = s.challenge?.vertical;
                  const route =
                    v === "ml"
                      ? `/challenge/ml/${s.challengeId}`
                      : `/challenge/ide/${s.challengeId}`;
                  navigate(route);
                }}
                className="grid grid-cols-[1fr_200px_90px_80px_100px_100px] gap-4 px-5 py-4 border-b border-surface-border/50 hover:bg-surface-hover cursor-pointer transition-colors"
              >
                <span className="text-sm text-gray-200 truncate">
                  {s.challenge?.title ?? s.challengeId}
                </span>
                <a
                  href={s.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-accent hover:underline truncate"
                >
                  {s.repoUrl.replace("https://github.com/", "")}
                </a>
                <div className="flex items-center">{statusBadge(s.status)}</div>
                <div className="flex items-center justify-center">
                  {passBadge(s.passed)}
                </div>
                <div className="flex items-center justify-center text-sm text-gray-300 font-mono">
                  {s.achievedValue != null ? s.achievedValue : "—"}
                  {s.improvementDelta != null && (
                    <span
                      className={`ml-1 text-xs ${s.improvementDelta >= 0 ? "text-accent" : "text-red-400"}`}
                    >
                      ({s.improvementDelta >= 0 ? "+" : ""}
                      {s.improvementDelta})
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-end text-xs text-gray-500">
                  {new Date(s.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
