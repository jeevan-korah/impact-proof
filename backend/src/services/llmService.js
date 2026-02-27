// src/services/llm.service.js
// Evaluates engineer proposals using Claude API.
// Returns a structured score + feedback object.

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─────────────────────────────────────────────
// evaluateProposal
// Sends the challenge + proposal to Claude and
// returns a parsed score and feedback.
//
// @param {object} params
// @param {object} params.challenge  - challenge row from DB
// @param {object} params.proposal   - proposal row from DB
//
// @returns {{ score, feedback, error }}
// ─────────────────────────────────────────────
export async function evaluateProposal({ challenge, proposal }) {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(challenge, proposal);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = response.content[0]?.text ?? "";
    return parseEvaluationResponse(raw);
  } catch (error) {
    console.error("[evaluateProposal] Claude API error:", error);
    return { score: 0, feedback: null, error: error.message };
  }
}

// ─────────────────────────────────────────────
// INTERNAL — build system prompt
// ─────────────────────────────────────────────
function buildSystemPrompt() {
  return `You are a senior technical evaluator for a software engineering challenge platform called ImpactProof.

Your job is to evaluate engineer proposals against real-world KPI challenges.

You must evaluate each proposal on three criteria and return a single composite score plus concise written feedback.

SCORING CRITERIA:

1. DIAGNOSIS QUALITY (0-33 points)
   - Does the engineer demonstrate understanding of WHY the baseline metric is where it is?
   - Is the root cause analysis specific to this problem, or is it generic?
   - Vague diagnosis ("the code is slow") scores low. Specific diagnosis ("the N+1 query in the data fetch layer causes 300ms overhead") scores high.

2. TECHNICAL APPROACH FEASIBILITY (0-34 points)
   - Is the proposed solution technically capable of achieving the stated metric improvement?
   - Does it align with the challenge's vertical (frontend/backend/ml)?
   - Are the specific techniques mentioned appropriate and realistic?
   - Generic AI-generated approaches ("use caching, indexing, and optimise loops") score low.
   - Specific, grounded approaches referencing the actual problem score high.

3. CONSTRAINT AWARENESS (0-33 points)
   - Does the engineer acknowledge the challenge's specific constraints?
   - Do they explain how their approach respects those constraints?
   - Do they identify trade-offs?
   - Ignoring constraints entirely = 0 points for this criterion.

TOTAL SCORE = sum of all three criteria (0-100).

Shortlist threshold: 65 and above.

IMPORTANT RULES:
- Be strict. A score of 80+ means the proposal is genuinely excellent.
- Penalise heavily for vagueness and generic language.
- Reward specificity, trade-off awareness, and constraint acknowledgement.
- Do NOT reward proposals that merely restate the problem.

Respond ONLY with valid JSON. No preamble, no explanation outside the JSON, no markdown backticks.

Required format:
{
  "score_diagnosis": <integer 0-33>,
  "score_feasibility": <integer 0-34>,
  "score_constraints": <integer 0-33>,
  "score_total": <integer 0-100>,
  "feedback": "<2-4 sentences explaining the score. Be specific about what was strong and what was weak. Reference the engineer's actual words where relevant.>"
}`;
}

// ─────────────────────────────────────────────
// INTERNAL — build user prompt from DB rows
// ─────────────────────────────────────────────
function buildUserPrompt(challenge, proposal) {
  const constraintText = challenge.constraints
    ? JSON.stringify(challenge.constraints, null, 2)
    : "No explicit constraints specified.";

  return `CHALLENGE DETAILS:
Title: ${challenge.title}
Vertical: ${challenge.vertical}
Difficulty: ${challenge.difficulty}
Description: ${challenge.description}
Baseline Value: ${challenge.baselineValue}
Target Value: ${challenge.targetValue} (operator: ${challenge.comparisonOperator})
Constraints:
${constraintText}

ENGINEER'S PROPOSAL:

Diagnosis:
${proposal.diagnosis}

Technical Approach:
${proposal.approach}

Expected Improvement: ${proposal.expectedImprovement}%

Evaluate this proposal strictly against the criteria in your instructions.`;
}

// ─────────────────────────────────────────────
// INTERNAL — parse and validate Claude's response
// Returns a safe object even if JSON is malformed.
// ─────────────────────────────────────────────
function parseEvaluationResponse(raw) {
  try {
    // Strip any accidental markdown fences
    const cleaned = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validate all required fields exist and are in range
    const scoreDiagnosis = clamp(parseInt(parsed.score_diagnosis ?? 0), 0, 33);
    const scoreFeasibility = clamp(
      parseInt(parsed.score_feasibility ?? 0),
      0,
      34,
    );
    const scoreConstraints = clamp(
      parseInt(parsed.score_constraints ?? 0),
      0,
      33,
    );

    // Recompute total from parts to prevent prompt injection inflating scores
    const score = scoreDiagnosis + scoreFeasibility + scoreConstraints;

    const feedback =
      typeof parsed.feedback === "string" && parsed.feedback.length > 0
        ? parsed.feedback
        : "No feedback provided.";

    return { score, feedback, error: null };
  } catch (error) {
    console.error("[parseEvaluationResponse] failed to parse:", raw);
    return {
      score: 0,
      feedback: null,
      error: `Failed to parse evaluation response: ${error.message}`,
    };
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
