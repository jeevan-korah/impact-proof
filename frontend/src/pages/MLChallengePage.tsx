import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { getChallengeById } from "@/api/challenges.api";
import { createProposal } from "@/api/proposals.api";
import { useAuth } from "@/hooks/useAuth";
import type { Challenge } from "@/types/challenge.types";

// Right-panel phases (no auto-skip)
type Phase = "register" | "proposal" | "upload";

export default function MLChallengePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Backend state
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [phase, setPhase] = useState<Phase>("register");

  // Proposal file state
  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const [proposalResult, setProposalResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload state
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch challenge only - no auto-skip
  useEffect(() => {
    if (!id) return;
    getChallengeById(id)
      .then((data) => {
        if (data.challenge) setChallenge(data.challenge);
      })
      .catch(() => {});
  }, [id]);

  const challengeTitle = challenge?.title ?? "ML Challenge";
  const targetValue = challenge?.targetValue ?? 90;
  const baselineValue = challenge?.baselineValue ?? 78;

  // Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".txt") && file.type !== "text/plain") {
        setSubmitMsg("Only .txt files are accepted");
        return;
      }
      setProposalFile(file);
      setSubmitMsg(null);
    }
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.endsWith(".txt") && file.type !== "text/plain") {
        setSubmitMsg("Only .txt files are accepted");
        return;
      }
      setProposalFile(file);
      setSubmitMsg(null);
    }
  };

  const handleProposalSubmit = async () => {
    if (!id || !proposalFile) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const result = await createProposal({ challengeId: id, proposalFile });
      setProposalResult(result);
      if (result.decision === "APPROVED") {
        setSubmitMsg("Proposal APPROVED (" + result.percentage + "%)");
        setTimeout(() => setPhase("upload"), 1200);
      } else {
        setSubmitMsg(
          "Proposal REJECTED (" + result.percentage + "%) - " + result.reason,
        );
      }
    } catch (err: any) {
      setSubmitMsg(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to submit proposal",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleModelUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadedFile("improved_model_v2.h5");
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);
  };

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-[#222] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-emerald-600 rounded flex items-center justify-center">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-200">
              ImpactProof
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-400 font-medium max-w-md truncate">
          #{id}: {challengeTitle}
        </div>
        <div className="flex items-center gap-3 px-3 py-1.5 rounded bg-[#111] border border-[#222]">
          <span className="text-[10px] uppercase tracking-wider text-gray-600">
            Baseline
          </span>
          <span className="text-sm text-gray-300 font-mono">
            {baselineValue}%
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#333"
            strokeWidth="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          <span className="text-[10px] uppercase tracking-wider text-gray-600">
            Target
          </span>
          <span className="text-sm text-emerald-400 font-mono font-medium">
            {targetValue}%
          </span>
        </div>
      </div>

      {/* Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT: Challenge Description (always visible) ─────────────── */}
        <div className="w-1/2 border-r border-[#222] flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center gap-0 bg-[#111] border-b border-[#222] px-0 shrink-0">
            <div className="px-4 py-2.5 text-xs font-medium text-white bg-black border-b-2 border-emerald-500">
              Description
            </div>
            <div className="px-4 py-2.5 text-xs font-medium text-gray-600 hover:text-gray-400 cursor-pointer">
              Resources
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Description */}
            <div>
              <h2 className="text-base font-semibold text-white mb-3">
                {challengeTitle}
              </h2>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  ML/AI
                </span>
                <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {challenge?.difficulty ?? "Medium"}
                </span>
              </div>
              <div className="text-sm text-gray-400 leading-relaxed space-y-3">
                {challenge?.description ? (
                  <p>{challenge.description}</p>
                ) : (
                  <>
                    <p>
                      Improve a classification model&apos;s accuracy on the
                      provided test dataset. The current baseline achieves{" "}
                      <span className="text-gray-200 font-medium">
                        {baselineValue}% accuracy
                      </span>{" "}
                      on the validation set.
                    </p>
                    <p>
                      Your goal is to reach at least{" "}
                      <span className="text-emerald-400 font-medium">
                        {targetValue}%
                      </span>{" "}
                      while maintaining inference latency constraints.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* KPI */}
            <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                KPI Metric
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 text-xs block mb-1">
                    Baseline
                  </span>
                  <span className="text-gray-200 font-mono text-lg">
                    {baselineValue}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 text-xs block mb-1">
                    Target
                  </span>
                  <span className="text-emerald-400 font-mono text-lg">
                    {targetValue}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 text-xs block mb-1">
                    Operator
                  </span>
                  <span className="text-gray-200 font-mono text-lg">
                    {challenge?.comparisonOperator ?? ">="}
                  </span>
                </div>
              </div>
            </div>

            {/* Constraints */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">
                Constraints
              </h3>
              <ul className="text-sm text-gray-500 space-y-2">
                {[
                  "Base model architecture must remain a transformer or similar",
                  "Inference latency must stay under 200ms per prediction",
                  "Model accuracy must reach at least " +
                    targetValue +
                    "% on hidden test set",
                  "Training must complete within 800 seconds on provided hardware",
                  "Full-stack model evaluation with cached predictions",
                ].map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-gray-700 mt-0.5">&#8226;</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">
                Downloads
              </h3>
              <div className="flex flex-wrap gap-2">
                {["Baseline Model v1.2", "Baseline Model v1.3", "Dataset"].map(
                  (label) => (
                    <a
                      key={label}
                      href="#"
                      className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 bg-[#111] border border-[#222] rounded hover:border-emerald-600/30 hover:text-emerald-400 transition-all"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                      </svg>
                      {label}
                    </a>
                  ),
                )}
              </div>
            </div>

            {/* Checklist */}
            {challenge?.checklist &&
              Array.isArray(challenge.checklist) &&
              (challenge.checklist as string[]).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Evaluation Checklist{" "}
                    <span className="text-gray-600 font-normal">
                      ({(challenge.checklist as string[]).length} items,
                      threshold: {challenge.threshold ?? 70}%)
                    </span>
                  </h3>
                  <ul className="text-sm text-gray-500 space-y-1.5">
                    {(challenge.checklist as string[]).map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-gray-700 font-mono text-xs mt-0.5">
                          {i + 1}.
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </div>

        {/* ── RIGHT: Action Panel (changes based on phase) ────────────── */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center gap-0 bg-[#111] border-b border-[#222] px-0 shrink-0">
            <div
              className={
                "px-4 py-2.5 text-xs font-medium cursor-pointer " +
                (phase === "register"
                  ? "text-white bg-black border-b-2 border-emerald-500"
                  : "text-gray-600 hover:text-gray-400")
              }
              onClick={() => phase !== "upload" && setPhase("register")}
            >
              Register
            </div>
            <div
              className={
                "px-4 py-2.5 text-xs font-medium cursor-pointer " +
                (phase === "proposal"
                  ? "text-white bg-black border-b-2 border-emerald-500"
                  : "text-gray-600 hover:text-gray-400")
              }
              onClick={() => phase !== "register" && setPhase("proposal")}
            >
              Proposal
            </div>
            <div
              className={
                "px-4 py-2.5 text-xs font-medium " +
                (phase === "upload"
                  ? "text-white bg-black border-b-2 border-emerald-500 cursor-pointer"
                  : "text-gray-700 cursor-not-allowed")
              }
            >
              Upload
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Phase: Register */}
            {phase === "register" && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-[#111] border border-[#222] flex items-center justify-center">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#555"
                    strokeWidth="1.5"
                  >
                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Register for this Challenge
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Read the challenge description on the left, then register to
                    submit your proposal.
                  </p>
                </div>
                {user ? (
                  <button
                    onClick={() => setPhase("proposal")}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    Register &amp; Continue
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/login")}
                    className="px-8 py-3 bg-[#111] border border-[#222] text-gray-400 rounded-lg text-sm font-medium hover:border-emerald-600/30 transition-colors"
                  >
                    Log in to participate
                  </button>
                )}
              </div>
            )}

            {/* Phase: Proposal */}
            {phase === "proposal" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">
                    Upload Your Proposal
                  </h3>
                  <p className="text-xs text-gray-500">
                    Upload a <span className="text-gray-300">.txt</span> file
                    containing your proposal and code. It will be evaluated
                    against the checklist.
                    {challenge?.threshold && (
                      <span className="text-gray-400">
                        {" "}
                        Need &ge;{challenge.threshold}% to pass.
                      </span>
                    )}
                  </p>
                </div>

                {/* File dropzone */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {!proposalFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropFile}
                    className="border-2 border-dashed border-[#222] rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-600/30 transition-all group"
                  >
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-gray-700 group-hover:text-emerald-500 transition-colors mb-3"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <polyline points="9 15 12 12 15 15" />
                    </svg>
                    <p className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors">
                      Drop your proposal file here or click to browse
                    </p>
                    <p className="text-xs text-gray-700 mt-1">
                      .txt files only (max 5MB)
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-[#111] rounded-lg border border-[#222]">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6ee7b7"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {proposalFile.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {(proposalFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setProposalFile(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      className="text-gray-600 hover:text-red-400 transition-colors"
                      title="Remove file"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                )}

                <button
                  onClick={handleProposalSubmit}
                  disabled={submitting || !proposalFile}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                      Evaluating...
                    </>
                  ) : (
                    "Submit Proposal"
                  )}
                </button>
                {/* Result */}
                {proposalResult && (
                  <div
                    className={
                      "p-4 rounded-lg border text-sm " +
                      (proposalResult.decision === "APPROVED"
                        ? "bg-emerald-900/10 border-emerald-600/20 text-emerald-400"
                        : "bg-red-900/10 border-red-500/20 text-red-400")
                    }
                  >
                    <div className="font-semibold mb-1 flex items-center gap-2">
                      {proposalResult.decision === "APPROVED" ? (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      )}
                      {proposalResult.decision} &mdash;{" "}
                      {proposalResult.percentage}% ({proposalResult.ticked}/
                      {proposalResult.total})
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {proposalResult.reason}
                    </div>
                  </div>
                )}
                {submitMsg && !proposalResult && (
                  <div className="p-3 rounded-lg bg-[#111] border border-[#222] text-xs text-gray-400">
                    {submitMsg}
                  </div>
                )}
              </div>
            )}

            {/* Phase: Upload */}
            {phase === "upload" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">
                    Upload Your Model
                  </h3>
                  <p className="text-xs text-gray-500">
                    Your proposal was approved. Upload your trained model file
                    below.
                  </p>
                </div>
                {!uploadedFile && !isUploading ? (
                  <div
                    onClick={handleModelUpload}
                    className="border-2 border-dashed border-[#222] rounded-lg p-16 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-600/30 transition-all group"
                  >
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-gray-700 group-hover:text-emerald-500 transition-colors mb-4"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors">
                      Click to upload your model
                    </p>
                    <p className="text-xs text-gray-700 mt-1">
                      .h5, .pkl, .pt, .onnx (max 500MB)
                    </p>
                  </div>
                ) : isUploading ? (
                  <div className="space-y-4 py-8">
                    <div className="flex items-center gap-3">
                      <svg
                        className="animate-spin text-emerald-500"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                      <span className="text-sm text-gray-300">
                        Uploading model...
                      </span>
                      <span className="text-xs text-gray-500 ml-auto font-mono">
                        {Math.min(Math.round(uploadProgress), 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#111] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-200"
                        style={{ width: Math.min(uploadProgress, 100) + "%" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-[#111] rounded-lg border border-emerald-600/20">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="2"
                      >
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm text-white">{uploadedFile}</p>
                        <p className="text-xs text-gray-600">
                          42.3 MB &middot; Uploaded successfully
                        </p>
                      </div>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="2.5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <button
                      onClick={() => navigate("/challenge/ml/" + id + "/quiz")}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 12l2 2 4-4" />
                        <path d="M21 12c0 1.2-.4 2.3-1 3.3-1.6 2.7-4.6 4.7-8 4.7s-6.4-2-8-4.7A9 9 0 0112 3c2 0 3.8.6 5.3 1.7" />
                      </svg>
                      Proceed to Verification Quiz
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
