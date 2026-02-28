const express = require("express");
const { generateVerificationQuestions } = require("./ollamaQuestionGenerator");

const app = express();
app.use(express.json());

/**
 * POST /generate
 *
 * If body is empty → uses default hardcoded APISIX dataset.
 * If body contains fields → overrides defaults.
 */
app.post("/generate", async (req, res) => {
  try {
    const { problemStatement, dataset, proposal, solutionCode } = req.body;

    const questions = await generateVerificationQuestions(
      problemStatement,
      dataset,
      proposal,
      solutionCode,
    );

    res.json({
      success: true,
      questions,
    });
  } catch (err) {
    console.error("Error generating questions:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /generate
 *
 * Quick test route using only hardcoded defaults.
 */
app.get("/generate", async (req, res) => {
  try {
    const questions = await generateVerificationQuestions();

    res.json({
      success: true,
      questions,
    });
  } catch (err) {
    console.error("Error generating questions:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

const PORT = 3003;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
