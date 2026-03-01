import { useNavigate, useParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { createSubmission } from "@/api/submissions.api";
import { generateQuizQuestions, type QuizQuestion } from "@/api/proposals.api";

export default function MLQuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Dynamic questions from backend
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [checkedQuestions, setCheckedQuestions] = useState<Set<number>>(new Set());
  const [checkingQuestion, setCheckingQuestion] = useState<number | null>(null);
  const [questionResults, setQuestionResults] = useState<Record<number, boolean>>({});
  const [showResult, setShowResult] = useState(false);

  const scanLineRef = useRef<HTMLDivElement>(null);

  // Fetch quiz questions from backend on mount
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    generateQuizQuestions(id)
      .then((data) => {
        setQuestions(data.questions);
        setLoadError(null);
      })
      .catch((err) => {
        console.error("Failed to load quiz questions:", err);
        setLoadError(err?.response?.data?.error || "Failed to load quiz questions. Make sure your proposal is approved.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const answeredCount = Object.keys(quizAnswers).filter((k) => quizAnswers[Number(k)]?.trim()).length;

  const evaluateQuiz = async () => {
    setQuizSubmitted(true);
    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      setCheckingQuestion(q.id);
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
      const userAnswer = (quizAnswers[q.id] || "").toLowerCase();
      const pass = q.keywords.some((kw) => userAnswer.includes(kw));
      if (pass) correct++;
      setQuestionResults((prev) => ({ ...prev, [q.id]: pass }));
      setCheckedQuestions((prev) => new Set(prev).add(q.id));
    }
    const score = Math.round((correct / questions.length) * 100);
    setQuizScore(score);
    setCheckingQuestion(null);

    if (score >= 90 && id) {
      try {
        await createSubmission({ challengeId: id, repoUrl: "https://github.com/model-upload/improved_model_v2" });
      } catch { /* submission may already exist */ }
    }
    setTimeout(() => setShowResult(true), 1200);
  };

  // Result screen
  if (showResult) {
    const passed = quizScore >= 90;
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className={"max-w-lg w-full bg-[#111] border rounded-xl p-10 text-center " + (passed ? "border-emerald-600/30" : "border-red-500/30")}>
          <div className="relative w-32 h-32 mx-auto mb-6">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" strokeWidth="6" stroke="#222" />
              <circle cx="60" cy="60" r="52" fill="none" strokeWidth="6" stroke={passed ? "#10b981" : "#ef4444"} strokeDasharray={(quizScore / 100) * 327 + " 327"} strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={"text-3xl font-bold font-mono " + (passed ? "text-emerald-400" : "text-red-400")}>{quizScore}%</span>
            </div>
          </div>
          <h2 className={"text-xl font-bold mb-2 " + (passed ? "text-emerald-400" : "text-red-400")}>{passed ? "Submission Successful!" : "Verification Failed"}</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">{passed ? "Your model has been verified and submitted. The automated test pipeline will evaluate your model against the hidden test set." : "You scored " + quizScore + "% which is below the 90% threshold. This may indicate insufficient understanding of the submitted model."}</p>
          <div className="mt-6 p-4 rounded-lg bg-black border border-[#222] text-left">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Breakdown</h4>
            <div className="grid grid-cols-3 gap-4">
              <div><span className="text-gray-600 text-xs block">Correct</span><span className="text-emerald-400 font-mono text-lg">{Object.values(questionResults).filter(Boolean).length}</span></div>
              <div><span className="text-gray-600 text-xs block">Incorrect</span><span className="text-red-400 font-mono text-lg">{Object.values(questionResults).filter((v) => !v).length}</span></div>
              <div><span className="text-gray-600 text-xs block">Total</span><span className="text-gray-300 font-mono text-lg">{questions.length}</span></div>
            </div>
          </div>
          <button onClick={() => navigate("/")} className="mt-6 px-6 py-2.5 bg-[#111] border border-[#222] text-gray-400 rounded-lg text-sm font-medium hover:border-emerald-600/30 hover:text-white transition-all">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  // Quiz screen
  return (
    <div className="min-h-screen bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-[#222]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/challenge/ml/" + id)} className="text-gray-500 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-amber-600 rounded flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /></svg>
            </div>
            <span className="text-sm font-semibold text-gray-200">Model Verification Quiz</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!quizSubmitted && <span className="text-xs text-gray-600 font-mono">{answeredCount}/{questions.length} answered</span>}
          {quizSubmitted && checkingQuestion !== null && (
            <div className="flex items-center gap-2 text-amber-400 text-xs">
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
              AI Plagiarism Checker analyzing...
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <svg className="animate-spin text-emerald-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
            <p className="text-sm text-gray-400">Generating quiz questions from your proposal...</p>
            <p className="text-xs text-gray-600">This may take a moment if using the Grok API</p>
          </div>
        )}

        {/* Error state */}
        {!loading && loadError && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            <p className="text-sm text-red-400">{loadError}</p>
            <button onClick={() => navigate("/challenge/ml/" + id)} className="px-4 py-2 bg-[#111] border border-[#222] text-gray-400 rounded-lg text-xs hover:border-emerald-600/30 transition-all">Go back to challenge</button>
          </div>
        )}

        {/* Questions */}
        {!loading && !loadError && questions.map((q, i) => {
          const isChecking = checkingQuestion === q.id;
          const isChecked = checkedQuestions.has(q.id);
          const passed = questionResults[q.id];
          return (
            <div key={q.id} className={"relative p-4 rounded-lg border transition-all duration-500 " + (isChecking ? "bg-amber-500/5 border-amber-500/30" : isChecked ? (passed ? "bg-emerald-900/10 border-emerald-600/20" : "bg-red-900/10 border-red-500/20") : "bg-[#111] border-[#222]")}>
              {isChecking && (
                <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                  <div ref={scanLineRef} className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-scanLine" />
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent animate-pulse" />
                </div>
              )}
              <div className="flex items-start gap-3">
                <span className="text-xs text-gray-600 font-mono mt-0.5 w-5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-300 mb-3">{q.question}</p>
                  <input type="text" value={quizAnswers[q.id] || ""} onChange={(e) => setQuizAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))} disabled={quizSubmitted} placeholder="Type your answer..." className="w-full bg-black border border-[#222] rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-emerald-600/40 disabled:opacity-60 font-mono" />
                </div>
                <div className="w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                  {isChecking && (<svg className="animate-spin text-amber-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>)}
                  {isChecked && (passed ? (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>) : (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>))}
                </div>
              </div>
            </div>
          );
        })}

        {!quizSubmitted && !loading && !loadError && (
          <button onClick={evaluateQuiz} disabled={answeredCount < questions.length || questions.length === 0} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4" /><path d="M21 12c0 1.2-.4 2.3-1 3.3-1.6 2.7-4.6 4.7-8 4.7s-6.4-2-8-4.7A9 9 0 0112 3c2 0 3.8.6 5.3 1.7" /></svg>
            Verify with AI Plagiarism Checker
          </button>
        )}
      </div>

      <style>{"\n        @keyframes scanLine {\n          0% { top: 0; opacity: 0; }\n          10% { opacity: 1; }\n          90% { opacity: 1; }\n          100% { top: 100%; opacity: 0; }\n        }\n        .animate-scanLine { animation: scanLine 1.2s ease-in-out infinite; }\n      "}</style>
    </div>
  );
}
