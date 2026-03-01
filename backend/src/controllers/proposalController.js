import { evaluateProposal } from "../services/llmService.js";
import { generateQuizQuestions } from "../services/grokService.js";
import { prisma } from "../lib/prisma.js";

// ── POST / — Engineer only (enforced at route level) ─────────────────────
// Now accepts multipart/form-data with a .txt file OR JSON body with proposalText
export async function evaluate(req, res) {
  const engineerId = req.user.userId;

  // Support both file upload and JSON text
  let proposalText = req.body.proposalText || "";
  const challengeId = req.body.challengeId;

  // If a file was uploaded via multer, read its content
  if (req.file) {
    proposalText = req.file.buffer.toString("utf-8");
  }

  if (!proposalText || !proposalText.trim()) {
    return res
      .status(400)
      .json({
        error:
          "proposalText is required (either in body or uploaded as .txt file)",
      });
  }
  if (!challengeId) {
    return res.status(400).json({ error: "challengeId is required" });
  }

  try {
    // 1. Fetch challenge to get checklist + threshold set by company
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        checklist: true,
        threshold: true,
        status: true,
      },
    });

    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    if (challenge.status !== "open") {
      return res
        .status(400)
        .json({ error: "This challenge is no longer open" });
    }

    // 2. Prevent duplicate proposals — one per engineer per challenge
    const existing = await prisma.proposal.findUnique({
      where: {
        challengeId_engineerId: {
          challengeId,
          engineerId,
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        error: "You have already submitted a proposal for this challenge",
      });
    }

    // 3. Run evaluation via Ollama using company's checklist + threshold
    const result = await evaluateProposal({
      proposalText,
      checklist: challenge.checklist,
      threshold: challenge.threshold,
    });

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    // 4. Save proposal + evaluation result to DB
    const proposal = await prisma.proposal.create({
      data: {
        challengeId,
        engineerId,
        proposalText,
        evaluation: result.evaluation,
        ticked: result.ticked,
        total: result.total,
        percentage: result.percentage,
        decision: result.decision,
        reason: result.reason,
        status: result.decision === "APPROVED" ? "shortlisted" : "rejected",
      },
    });

    // 5. Return result
    return res.status(201).json({
      success: true,
      message: "proposal evaluated",
      data: {
        proposalId: proposal.id,
        evaluation: result.evaluation,
        ticked: result.ticked,
        total: result.total,
        percentage: result.percentage,
        decision: result.decision,
        reason: result.reason,
        status: proposal.status,
      },
    });
  } catch (error) {
    console.error("createProposal error:", error);
    return res.status(500).json({
      error: "Something went wrong. Please try again.",
      details: error.message,
    });
  }
}

// ── GET /my ───────────────────────────────────────────────────────────────
export async function getMyProposals(req, res) {
  const engineerId = req.user.userId; // ✅ fixed
  try {
    const proposals = await prisma.proposal.findMany({
      where: { engineerId },
      orderBy: { createdAt: "desc" },
      include: {
        challenge: {
          select: { id: true, title: true, threshold: true, checklist: true },
        },
      },
    });
    return res.status(200).json({ success: true, data: { proposals } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── GET /:id ──────────────────────────────────────────────────────────────
export async function getProposalById(req, res) {
  const { id } = req.params;
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        challenge: {
          select: { id: true, title: true, threshold: true, checklist: true },
        },
      },
    });
    if (!proposal)
      return res
        .status(404)
        .json({ success: false, message: "Proposal not found" });
    return res.status(200).json({ success: true, data: { proposal } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── GET /:id/status ───────────────────────────────────────────────────────
export async function getProposalStatus(req, res) {
  const { id } = req.params;
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      select: {
        id: true,
        decision: true,
        status: true,
        percentage: true,
        ticked: true,
        total: true,
        reason: true,
      },
    });
    if (!proposal)
      return res
        .status(404)
        .json({ success: false, message: "Proposal not found" });
    return res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── GET /challenge/:challengeId ───────────────────────────────────────────
export async function getProposalsForChallenge(req, res) {
  const { challengeId } = req.params;
  try {
    const proposals = await prisma.proposal.findMany({
      where: { challengeId },
      orderBy: { percentage: "desc" },
      include: {
        engineer: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    return res.status(200).json({ success: true, data: { proposals } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── POST /quiz/generate — Generate quiz questions from problem + proposal ──
// Expects: { challengeId } — looks up the engineer's approved proposal
export async function generateQuiz(req, res) {
  const engineerId = req.user.userId;
  const { challengeId } = req.body;

  if (!challengeId) {
    return res.status(400).json({ error: "challengeId is required" });
  }

  try {
    // 1. Get the challenge description
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { id: true, title: true, description: true },
    });

    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    // 2. Get the engineer's approved proposal for this challenge
    const proposal = await prisma.proposal.findUnique({
      where: {
        challengeId_engineerId: {
          challengeId,
          engineerId,
        },
      },
      select: { proposalText: true, decision: true },
    });

    if (!proposal) {
      return res
        .status(404)
        .json({
          error:
            "No proposal found for this challenge. Submit a proposal first.",
        });
    }

    if (proposal.decision !== "APPROVED") {
      return res
        .status(400)
        .json({
          error: "Your proposal must be approved before taking the quiz.",
        });
    }

    // 3. Generate questions via Grok (or mock fallback)
    const problemDescription = `${challenge.title}\n\n${challenge.description}`;
    const result = await generateQuizQuestions({
      problemDescription,
      proposalText: proposal.proposalText,
      count: 10,
    });

    return res.status(200).json({
      success: true,
      data: {
        questions: result.questions.map((q) => ({
          id: q.id,
          question: q.question,
          // Send keywords to frontend for client-side checking (same flow as before)
          keywords: q.keywords,
        })),
        source: result.source,
        total: result.questions.length,
      },
    });
  } catch (error) {
    console.error("[generateQuiz] error:", error);
    return res
      .status(500)
      .json({
        error: "Failed to generate quiz questions",
        details: error.message,
      });
  }
}
