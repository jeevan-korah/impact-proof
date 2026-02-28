import { evaluateProposal } from "../services/llmService.js";
import { prisma } from "../lib/prisma.js";

// ── POST / — Engineer only (enforced at route level) ─────────────────────
export async function evaluate(req, res) {
  const engineerId = req.user.userId;  
  const { challengeId, proposalText } = req.body;

  if (!proposalText) {
    return res.status(400).json({ error: "proposalText is required" });
  }
  if (!challengeId) {
    return res.status(400).json({ error: "challengeId is required" });
  }

  try {
    // 1. Fetch challenge to get checklist + threshold set by company
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: {
        id:        true,
        checklist: true,
        threshold: true,
        status:    true,
      },
    });

    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    if (challenge.status !== "open") {
      return res.status(400).json({ error: "This challenge is no longer open" });
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
      return res.status(409).json({ error: "You have already submitted a proposal for this challenge" });
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
        evaluation:  result.evaluation,
        ticked:      result.ticked,
        total:       result.total,
        percentage:  result.percentage,
        decision:    result.decision,
        reason:      result.reason,
        status:      result.decision === "APPROVED" ? "shortlisted" : "rejected",
      },
    });

    // 5. Return result
    return res.status(201).json({
      success: true,
      message: "proposal evaluated",
      data: {
        proposalId:  proposal.id,
        evaluation:  result.evaluation,
        ticked:      result.ticked,
        total:       result.total,
        percentage:  result.percentage,
        decision:    result.decision,
        reason:      result.reason,
        status:      proposal.status,
      },
    });
  } catch (error) {
    console.error("createProposal error:", error);
    return res.status(500).json({
      error:   "Something went wrong. Please try again.",
      details: error.message,
    });
  }
}

// ── GET /my ───────────────────────────────────────────────────────────────
export async function getMyProposals(req, res) {
  const engineerId = req.user.userId;  // ✅ fixed
  try {
    const proposals = await prisma.proposal.findMany({
      where: { engineerId },
      orderBy: { createdAt: "desc" },
      include: {
        challenge: {
          select: { id: true, title: true, threshold: true, checklist: true }
        }
      }
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
          select: { id: true, title: true, threshold: true, checklist: true }
        }
      }
    });
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found" });
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
        id:         true,
        decision:   true,
        status:     true,
        percentage: true,
        ticked:     true,
        total:      true,
        reason:     true,
      },
    });
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found" });
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