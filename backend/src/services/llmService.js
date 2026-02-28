// evaluateProposal
// Sends the proposalText + checklist + threshold to Ollama
// and returns a parsed evaluation object.
//
// @param {object} params
// @param {string} params.proposalText   - free text proposal from engineer
// @param {string[]} params.checklist    - array of checklist items from company
// @param {number} params.threshold      - approval threshold percentage (default 70)
//
// @returns {{ evaluation, ticked, total, percentage, decision, reason, error }}
// ─────────────────────────────────────────────
export async function evaluateProposal({
  proposalText,
  checklist,
  threshold = 70,
}) {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(proposalText, checklist, threshold);

  // Check if we should use mock evaluation (when Ollama is unavailable)
  const useMock = process.env.USE_MOCK_LLM === "true";

  if (useMock) {
    console.log("[evaluateProposal] Using mock evaluation (USE_MOCK_LLM=true)");
    return mockEvaluation(proposalText, checklist, threshold);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "mistral",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
        format: "json",
        options: { temperature: 0 },
      }),
    });

    clearTimeout(timeout);
    const data = await response.json();
    const raw = data.message?.content ?? "";
    return parseEvaluationResponse(raw);
  } catch (error) {
    console.error("[evaluateProposal] Ollama error:", error.message);

    // If Ollama is not running, fall back to mock evaluation
    if (
      error.message.includes("fetch failed") ||
      error.message.includes("ECONNREFUSED") ||
      error.name === "AbortError"
    ) {
      console.warn(
        "[evaluateProposal] Ollama unavailable — falling back to mock evaluation",
      );
      return mockEvaluation(proposalText, checklist, threshold);
    }

    return {
      evaluation: null,
      ticked: 0,
      total: 0,
      percentage: 0,
      decision: "REJECTED",
      reason: null,
      error: `LLM service unavailable: ${error.message}. Make sure Ollama is running (ollama serve) with the mistral model.`,
    };
  }
}

// ─────────────────────────────────────────────
// INTERNAL — build system prompt
// ─────────────────────────────────────────────
function buildSystemPrompt() {
  return `You are a strict but fair proposal evaluation assistant.
You evaluate proposals against a checklist and return a structured JSON result.
Always respond with valid JSON only. Do not include any text outside the JSON.`;
}

// ─────────────────────────────────────────────
// INTERNAL — build user prompt
// ─────────────────────────────────────────────
function buildUserPrompt(proposalText, checklist, threshold) {
  const checklistFormatted = checklist.map((item) => `- ${item}`).join("\n");

  return `You are a proposal evaluation assistant. Your job is to review a proposal and determine
whether it satisfies each item in a predefined checklist.

## Checklist
For each item below, tick it (true) if the proposal clearly addresses it, otherwise mark it false.

${checklistFormatted}

## Proposal
${proposalText}

## Instructions
1. Go through each checklist item one by one.
2. Mark it as true ONLY if the proposal explicitly or clearly implies it is covered.
3. Calculate the percentage of ticked items.
4. If the percentage is ${threshold}% or above → APPROVED, otherwise → REJECTED.
5. Return your response ONLY as a valid JSON object in this exact format:

{
  "evaluation": {
    "checklist item 1": true or false,
    "checklist item 2": true or false
  },
  "ticked": <number of true items>,
  "total": <total checklist items>,
  "percentage": <percentage as a number>,
  "decision": "APPROVED" or "REJECTED",
  "reason": "<brief explanation>"
}

Do not include any text outside the JSON.`;
}

// ─────────────────────────────────────────────
// INTERNAL — parse and validate Ollama's response
// Returns a safe object even if JSON is malformed.
// ─────────────────────────────────────────────
function mockEvaluation(proposalText, checklist, threshold) {
  // Simple keyword-based mock: check if proposal mentions key terms from each checklist item
  const evaluation = {};
  let ticked = 0;

  for (const item of checklist) {
    // Extract keywords (3+ char words) from checklist item
    const keywords = item
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 3);
    const proposalLower = proposalText.toLowerCase();
    const matched = keywords.some((kw) => proposalLower.includes(kw));
    evaluation[item] = matched;
    if (matched) ticked++;
  }

  const total = checklist.length;
  const percentage =
    total > 0 ? parseFloat(((ticked / total) * 100).toFixed(1)) : 0;
  const decision = percentage >= threshold ? "APPROVED" : "REJECTED";
  const reason =
    decision === "APPROVED"
      ? `Proposal addresses ${ticked}/${total} checklist items (${percentage}%), meeting the ${threshold}% threshold. (Mock evaluation — Ollama unavailable)`
      : `Proposal only addresses ${ticked}/${total} checklist items (${percentage}%), below the ${threshold}% threshold. (Mock evaluation — Ollama unavailable)`;

  return {
    evaluation,
    ticked,
    total,
    percentage,
    decision,
    reason,
    error: null,
  };
}

// ─────────────────────────────────────────────
// INTERNAL — parse and validate Ollama's response
// Returns a safe object even if JSON is malformed.
// ─────────────────────────────────────────────
function parseEvaluationResponse(raw) {
  try {
    const cleaned = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    // Recompute ticked count from evaluation object to prevent injection
    const evaluation = parsed.evaluation ?? {};
    const ticked = Object.values(evaluation).filter(Boolean).length;
    const total = Object.keys(evaluation).length;
    const percentage =
      total > 0 ? parseFloat(((ticked / total) * 100).toFixed(1)) : 0;
    const decision = parsed.decision === "APPROVED" ? "APPROVED" : "REJECTED";
    const reason =
      typeof parsed.reason === "string" && parsed.reason.length > 0
        ? parsed.reason
        : "No reason provided.";

    return {
      evaluation,
      ticked,
      total,
      percentage,
      decision,
      reason,
      error: null,
    };
  } catch (error) {
    console.error("[parseEvaluationResponse] failed to parse:", raw);
    return {
      evaluation: null,
      ticked: 0,
      total: 0,
      percentage: 0,
      decision: "REJECTED",
      reason: null,
      error: `Failed to parse evaluation response: ${error.message}`,
    };
  }
}
