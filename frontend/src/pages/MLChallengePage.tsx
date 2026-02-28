import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

interface TestCase {
  name: string;
  accuracy: number | null;
  passed: boolean | null;
}

export default function MLChallengePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestCase[]>([
    { name: "Test Case 1", accuracy: null, passed: null },
    { name: "Test Case 2", accuracy: null, passed: null },
    { name: "Test Case 3", accuracy: null, passed: null },
  ]);
  const [currentAccuracy, setCurrentAccuracy] = useState(78);

  const challengeTitle =
    id === "5" || id === "8"
      ? "ML Model Accuracy Increase to 90% (OpenAI)"
      : id === "1"
        ? "ML Model Performance on Edge: Reduce to (NVIDIA)"
        : "ML Challenge";

  const handleUpload = () => {
    setUploadedFile("improved_model_v2.pkl");
  };

  const handleRunTests = () => {
    if (!uploadedFile) return;
    setIsRunning(true);
    // Simulate test execution
    setTimeout(() => {
      setTestResults([
        { name: "Test Case 1", accuracy: 91.2, passed: true },
        { name: "Test Case 2", accuracy: 90.5, passed: true },
        { name: "Test Case 3", accuracy: 88.5, passed: false },
      ]);
      setCurrentAccuracy(88.5);
      setIsRunning(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-surface-card border-b border-surface-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
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
        <button className="px-4 py-1.5 text-xs bg-accent hover:bg-accent-dim text-white rounded-md font-medium transition-colors">
          Submit Results
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 gap-6">
          {/* LEFT COLUMN - Problem Description */}
          <div className="space-y-6">
            {/* Description Card */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-6">
              <h2 className="text-base font-semibold text-white mb-4">
                Description
              </h2>
              <div className="text-sm text-gray-400 space-y-3 leading-relaxed">
                <p>
                  The ML Model Accuracy Increase to 90% (OpenAI) challenge
                  requires improving a classification model's accuracy on the
                  provided test dataset. The current baseline model achieves 78%
                  accuracy on the validation set.
                </p>
                <p>
                  The model architecture is based on a pre-trained transformer
                  with fine-tuned classification layers. Your task is to improve
                  the model's accuracy to at least 90% while maintaining
                  inference latency constraints.
                </p>
              </div>

              <h3 className="text-sm font-semibold text-white mt-6 mb-3">
                Constraints:
              </h3>
              <ul className="text-sm text-gray-400 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 mt-1">•</span>
                  <span>
                    Base model architecture must remain a transformer or similar
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 mt-1">•</span>
                  <span>
                    Inference latency must stay under 200ms per prediction
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 mt-1">•</span>
                  <span>
                    Model accuracy must reach at least 90% on hidden test set
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 mt-1">•</span>
                  <span>
                    Training must complete within 800 seconds on provided
                    hardware
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 mt-1">•</span>
                  <span>
                    Full-stack model evaluation with cached predictions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 mt-1">•</span>
                  <span>Unmodified model architecture layer count</span>
                </li>
              </ul>

              <h3 className="text-sm font-semibold text-white mt-6 mb-3">
                Downloads:
              </h3>
              <div className="space-y-2">
                <a
                  href="#"
                  className="flex items-center gap-2 text-sm text-accent hover:text-accent-dim transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Download Baseline Model v1.2
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 text-sm text-accent hover:text-accent-dim transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Download Baseline Model v1.3
                </a>
              </div>

              <h3 className="text-sm font-semibold text-white mt-6 mb-3">
                Dataset:
              </h3>
              <a
                href="#"
                className="flex items-center gap-2 text-sm text-accent hover:text-accent-dim transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Download Dataset
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN - Submission & Metrics */}
          <div className="space-y-6">
            {/* Upload Card */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-6">
              <h2 className="text-base font-semibold text-white mb-4">
                Model Submission
              </h2>

              {!uploadedFile ? (
                <div
                  onClick={handleUpload}
                  className="border-2 border-dashed border-surface-border rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-accent/40 transition-colors group"
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-gray-500 group-hover:text-accent transition-colors mb-3"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    Drag and drop & upload
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    New trained model file
                  </p>
                  <p className="text-xs text-gray-600">(drag file here)</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-surface-border">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm text-white">{uploadedFile}</p>
                      <p className="text-xs text-gray-500">
                        42.3 MB • Uploaded just now
                      </p>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="text-gray-500 hover:text-red-400 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <button
                    onClick={handleRunTests}
                    disabled={isRunning}
                    className="w-full py-2.5 bg-accent hover:bg-accent-dim disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isRunning ? (
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
                        Running Tests...
                      </>
                    ) : (
                      <>
                        Run Evaluation
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Performance Metrics */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-6">
              <h2 className="text-base font-semibold text-white mb-4">
                Performance Metrics
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">
                      Current Accuracy: {currentAccuracy}%
                    </span>
                  </div>
                  <div className="h-3 bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${currentAccuracy >= 90 ? "bg-accent" : "bg-accent"}`}
                      style={{ width: `${currentAccuracy}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-600">0%</span>
                    <div className="relative flex-1 mx-2">
                      <div className="absolute right-[10%] -top-1 w-px h-3 bg-gray-600" />
                      <span className="absolute right-[10%] top-3 text-[10px] text-gray-500 -translate-x-1/2">
                        Target
                      </span>
                    </div>
                    <span className="text-xs text-gray-600">100%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-surface-border">
                  <span className="text-sm text-gray-400">Target:</span>
                  <span className="text-sm text-white font-medium">90%</span>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-surface-border">
                  <span className="text-sm text-gray-400">
                    Performance vs. Baseline:
                  </span>
                  <span className="text-sm text-accent font-medium">
                    {testResults[0].accuracy !== null
                      ? `+${(currentAccuracy - 78).toFixed(1)}%`
                      : "+XX%"}
                  </span>
                </div>
              </div>
            </div>

            {/* Validation Test Cases */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-6">
              <h2 className="text-base font-semibold text-white mb-4">
                Validation Test Cases
              </h2>
              <div className="space-y-3">
                {testResults.map((test, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-surface-border/50 last:border-0"
                  >
                    <span className="text-sm text-gray-300">{test.name}</span>
                    <div className="flex items-center gap-3">
                      {test.accuracy !== null && (
                        <span
                          className={`text-sm font-mono ${test.passed ? "text-accent" : "text-yellow-400"}`}
                        >
                          {test.accuracy}%
                        </span>
                      )}
                      {test.passed === null ? (
                        <span className="text-xs text-gray-600 px-2 py-0.5 rounded bg-surface border border-surface-border">
                          PENDING
                        </span>
                      ) : test.passed ? (
                        <span className="text-xs text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20 font-medium">
                          PASS
                        </span>
                      ) : (
                        <span className="text-xs text-red-400 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 font-medium">
                          FAIL
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent star decoration */}
      <div className="fixed bottom-6 right-6">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          className="text-accent/20"
        >
          <path
            d="M12 2l2.09 6.26L20 10l-5 4.27L16.18 22 12 18.56 7.82 22 9 14.27 4 10l5.91-1.74L12 2z"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
}
