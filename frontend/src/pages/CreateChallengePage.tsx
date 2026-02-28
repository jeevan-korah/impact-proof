import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/common/Navbar";
import { api } from "@/lib/axios";

export default function CreateChallengePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    vertical: "backend" as "frontend" | "backend" | "ml",
    difficulty: "medium" as "easy" | "medium" | "hard",
    source: "company" as "company" | "opensource",
    baselineValue: 0,
    targetValue: 0,
    comparisonOperator: ">=" as ">=" | "<=" | "==" | ">" | "<",
    threshold: 70,
    checklist: [""],
    repoUrl: "",
    issueUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Filter out empty checklist items
      const checklist = formData.checklist.filter((item) => item.trim() !== "");
      
      if (checklist.length === 0) {
        setError("At least one checklist item is required");
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        checklist,
        baselineValue: parseFloat(formData.baselineValue.toString()),
        targetValue: parseFloat(formData.targetValue.toString()),
        threshold: parseFloat(formData.threshold.toString()),
      };

      await api.post("/challenges", payload);
      navigate("/");
    } catch (err: any) {
      console.error("Challenge creation error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create challenge"
      );
    } finally {
      setLoading(false);
    }
  };

  const addChecklistItem = () => {
    setFormData((prev) => ({ ...prev, checklist: [...prev.checklist, ""] }));
  };

  const removeChecklistItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index),
    }));
  };

  const updateChecklistItem = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item, i) => (i === index ? value : item)),
    }));
  };

  if (user?.role !== "company") {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <p className="text-gray-400">Only company accounts can create challenges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-white mb-6">Create New Challenge</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-accent/50"
                placeholder="e.g., Improve API Response Time to <100ms"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-accent/50 resize-none"
                placeholder="Detailed description of the challenge..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Vertical</label>
                <select
                  value={formData.vertical}
                  onChange={(e) => setFormData({ ...formData, vertical: e.target.value as any })}
                  className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-accent/50"
                >
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="ml">ML/AI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                  className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-accent/50"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value as any })}
                  className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-accent/50"
                >
                  <option value="company">Company</option>
                  <option value="opensource">Open Source</option>
                </select>
              </div>
            </div>
          </div>

          {/* KPI Metrics */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">KPI Metrics</h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Baseline Value</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.baselineValue}
                  onChange={(e) => setFormData({ ...formData, baselineValue: parseFloat(e.target.value) })}
                  className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-accent/50"
                  placeholder="78"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Value</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) })}
                  className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-accent/50"
                  placeholder="90"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Operator</label>
                <select
                  value={formData.comparisonOperator}
                  onChange={(e) => setFormData({ ...formData, comparisonOperator: e.target.value as any })}
                  className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-accent/50"
                >
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                  <option value="==">=</option>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                </select>
              </div>
            </div>
          </div>

          {/* Proposal Evaluation */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">Proposal Evaluation</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Approval Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: parseFloat(e.target.value) })}
                className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-accent/50"
                placeholder="70"
              />
              <p className="text-xs text-gray-500 mt-1">
                Proposals must score above this threshold to be approved
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Evaluation Checklist
              </label>
              <div className="space-y-2">
                {formData.checklist.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateChecklistItem(index, e.target.value)}
                      className="flex-1 bg-surface border border-surface-border rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-accent/50"
                      placeholder="e.g., Proposal includes specific optimization techniques"
                    />
                    {formData.checklist.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(index)}
                        className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addChecklistItem}
                className="mt-2 text-sm text-accent hover:text-accent-dim transition-colors"
              >
                + Add checklist item
              </button>
            </div>
          </div>

          {/* Optional Links */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">Optional Links</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Repository URL (optional)
              </label>
              <input
                type="url"
                value={formData.repoUrl}
                onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
                className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-accent/50"
                placeholder="https://github.com/org/repo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Issue URL (optional)
              </label>
              <input
                type="url"
                value={formData.issueUrl}
                onChange={(e) => setFormData({ ...formData, issueUrl: e.target.value })}
                className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-accent/50"
                placeholder="https://github.com/org/repo/issues/123"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-accent hover:bg-accent-dim disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? "Creating..." : "Create Challenge"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
