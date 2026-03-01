// src/services/grokService.js
// Generates quiz questions from the challenge problem + proposal text using Groq API.
// Falls back to mock generation when the API key is missing or Groq is unreachable.

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

/**
 * Generate quiz questions from problem description + proposal content.
 *
 * @param {object} params
 * @param {string} params.problemDescription - The challenge description / title
 * @param {string} params.proposalText       - Full proposal content (may include code)
 * @param {number} [params.count=10]         - Number of questions to generate
 * @returns {Promise<{ questions: Array<{ id: number, question: string, answer: string, keywords: string[] }>, source: string }>}
 */
export async function generateQuizQuestions({
  problemDescription,
  proposalText,
  count = 10,
}) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.warn(
      "[groqService] No GROQ_API_KEY set — using mock question generator",
    );
    return {
      questions: mockGenerateQuestions(problemDescription, proposalText, count),
      source: "mock",
    };
  }

  try {
    const prompt = buildFullPrompt(problemDescription, proposalText, count);

    console.log("[groqService] Sending proposal to Groq API...");
    console.log("[groqService] Proposal length:", proposalText.length, "chars");
    console.log("[groqService] Model:", GROQ_MODEL);

    // Retry up to 3 times for rate-limit (429)
    let response;
    for (let attempt = 1; attempt <= 3; attempt++) {
      response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: "system",
              content: "You are a technical interview question generator. You MUST respond with valid JSON only, no markdown, no extra text.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 4096,
          response_format: { type: "json_object" },
        }),
      });

      if (response.status === 429 && attempt < 3) {
        console.warn(
          `[groqService] Rate limited (429), retrying in ${attempt * 2}s... (attempt ${attempt}/3)`,
        );
        await new Promise((r) => setTimeout(r, attempt * 2000));
        continue;
      }
      break;
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error(
        "[groqService] Groq API error:",
        response.status,
        errText,
      );
      throw new Error(`Groq API returned ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "";

    // Extract JSON from response (LLM might wrap it in markdown code blocks)
    let jsonText = raw;
    const jsonMatch =
      raw.match(/```json\s*([\s\S]*?)\s*```/) ||
      raw.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonText);

    // Normalise and validate
    const questions = (parsed.questions || []).slice(0, count).map((q, i) => ({
      id: i + 1,
      question: q.question,
      answer: q.answer,
      keywords: Array.isArray(q.keywords)
        ? q.keywords.map((k) => k.toLowerCase())
        : extractKeywords(q.answer),
    }));

    // Console.log answers for debugging
    console.log("\n🧠 [groqService] Generated quiz answers (for debugging):");
    questions.forEach((q) => {
      console.log(`  Q${q.id}: ${q.question}`);
      console.log(`   → Answer: ${q.answer}`);
      console.log(`   → Keywords: [${q.keywords.join(", ")}]`);
    });

    return { questions, source: "groq" };
  } catch (error) {
    console.error("[groqService] Failed to call Groq API:", error.message);
    console.warn("[groqService] Falling back to mock question generator");
    return {
      questions: mockGenerateQuestions(problemDescription, proposalText, count),
      source: "mock",
    };
  }
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildFullPrompt(problemDescription, proposalText, count) {
  return `You are a technical interview question generator for an engineering challenge platform.
Your job is to generate ${count} verification questions that test whether the person actually wrote the proposal / code they submitted.

Rules:
- Questions should be specific to the proposal content and code snippets provided
- Questions should test understanding, not just recall (e.g., "Why did you choose X?" not "What is X?")
- Include questions about implementation details, trade-offs, edge cases, and design decisions
- Some questions should be about specific code/architecture choices mentioned in the proposal
- Each question should be answerable in 1-2 sentences
- Generate a concise correct answer and relevant keywords for automated checking
- RESPOND ONLY WITH VALID JSON

## Challenge Problem
${problemDescription}

## Submitted Proposal (may include code)
${proposalText}

## Task
Generate exactly ${count} verification questions to test if the submitter truly understands and authored this proposal.

Return ONLY a JSON object in this exact format:
{
  "questions": [
    {
      "question": "Your question here?",
      "answer": "The expected correct answer in 1-2 sentences.",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}

The keywords array should contain 4-8 lowercase words/phrases that would appear in a correct answer.
At least 3 questions should reference specific technical choices or code from the proposal.`;
}

// ─── Mock question generator (keyword extraction from proposal) ──────────────

function mockGenerateQuestions(problemDescription, proposalText, count) {
  const combined = (problemDescription + " " + proposalText).toLowerCase();

  // Extract technical terms from the proposal
  const techTerms = extractTechnicalTerms(combined);

  // Template questions that adapt to the proposal content
  const templates = [
    {
      q: "What was the primary technical approach you described in your proposal?",
      keywords: techTerms.slice(0, 5),
    },
    {
      q: "What specific optimization or improvement technique did you propose?",
      keywords: findTermsMatching(combined, [
        "optim",
        "improv",
        "enhanc",
        "reduc",
        "increas",
      ]),
    },
    {
      q: "How did you plan to validate or evaluate the results of your approach?",
      keywords: findTermsMatching(combined, [
        "validat",
        "evaluat",
        "test",
        "benchmark",
        "metric",
        "f1",
        "accuracy",
        "latency",
      ]),
    },
    {
      q: "What trade-offs did you consider in your proposed solution?",
      keywords: findTermsMatching(combined, [
        "trade",
        "balanc",
        "cost",
        "complex",
        "limit",
        "constraint",
      ]),
    },
    {
      q: "Describe the data processing or preparation steps you mentioned.",
      keywords: findTermsMatching(combined, [
        "data",
        "process",
        "prepar",
        "clean",
        "augment",
        "pipeline",
        "curati",
      ]),
    },
    {
      q: "What architecture or framework choices did you make and why?",
      keywords: findTermsMatching(combined, [
        "architect",
        "framework",
        "model",
        "layer",
        "network",
        "transform",
      ]),
    },
    {
      q: "How does your approach handle edge cases or failure scenarios?",
      keywords: findTermsMatching(combined, [
        "edge",
        "fail",
        "error",
        "robust",
        "fallback",
        "handl",
      ]),
    },
    {
      q: "What monitoring or observability strategy did you plan for production?",
      keywords: findTermsMatching(combined, [
        "monitor",
        "log",
        "observ",
        "alert",
        "metric",
        "dashboard",
      ]),
    },
    {
      q: "What was your timeline or phasing strategy for implementing this solution?",
      keywords: findTermsMatching(combined, [
        "phase",
        "timeline",
        "step",
        "first",
        "then",
        "stage",
        "sprint",
      ]),
    },
    {
      q: "What specific tooling, libraries, or services did you mention using?",
      keywords: findTermsMatching(combined, [
        "redis",
        "postgres",
        "pytorch",
        "tensorflow",
        "onnx",
        "docker",
        "k8s",
        "react",
        "python",
        "node",
      ]),
    },
    {
      q: "How did you quantify the expected improvement in your proposal?",
      keywords: findTermsMatching(combined, [
        "percent",
        "improv",
        "target",
        "baseline",
        "expect",
        "goal",
      ]),
    },
    {
      q: "What risk mitigation strategies did you include?",
      keywords: findTermsMatching(combined, [
        "risk",
        "mitig",
        "prevent",
        "overfit",
        "fail",
        "rollback",
        "safet",
      ]),
    },
  ];

  // Pick the best `count` questions (those with the most keyword matches)
  const scored = templates.map((t) => ({
    ...t,
    score: t.keywords.length,
  }));
  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, count);

  const questions = selected.map((t, i) => ({
    id: i + 1,
    question: t.q,
    answer: `(Mock answer — based on proposal keywords: ${t.keywords.slice(0, 4).join(", ")})`,
    keywords:
      t.keywords.length > 0 ? t.keywords : ["approach", "method", "solution"],
  }));

  // Console.log answers for debugging
  console.log(
    "\n🧪 [grokService:mock] Generated quiz answers (for debugging):",
  );
  questions.forEach((q) => {
    console.log(`  Q${q.id}: ${q.question}`);
    console.log(`   → Keywords: [${q.keywords.join(", ")}]`);
  });

  return questions;
}

// ─── Utility functions ───────────────────────────────────────────────────────

function extractTechnicalTerms(text) {
  const techWords = [
    "dropout",
    "l2",
    "regularization",
    "adam",
    "sgd",
    "learning rate",
    "batch",
    "epoch",
    "transformer",
    "attention",
    "convolution",
    "lstm",
    "embedding",
    "fine-tune",
    "freeze",
    "quantization",
    "pruning",
    "distillation",
    "onnx",
    "smote",
    "oversampling",
    "augmentation",
    "f1",
    "precision",
    "recall",
    "auc",
    "roc",
    "k-fold",
    "cross-validation",
    "stratified",
    "holdout",
    "redis",
    "caching",
    "postgres",
    "index",
    "query",
    "async",
    "microservice",
    "docker",
    "kubernetes",
    "ci/cd",
    "pipeline",
    "deployment",
    "monitoring",
    "latency",
    "throughput",
    "p99",
    "optimization",
    "refactoring",
    "lighthouse",
    "bundle",
    "code splitting",
    "lazy loading",
    "ssr",
    "rlhf",
    "dpo",
    "benchmark",
    "inference",
    "training",
  ];

  return techWords.filter((term) => text.includes(term));
}

function findTermsMatching(text, prefixes) {
  // Find actual words in the text that start with any of the given prefixes
  const words = [...new Set(text.match(/\b[a-z][a-z0-9-]{2,}\b/g) || [])];
  return words.filter((w) => prefixes.some((p) => w.startsWith(p))).slice(0, 6);
}

function extractKeywords(answer) {
  if (!answer) return ["approach", "method"];
  return answer
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 4)
    .slice(0, 6);
}
