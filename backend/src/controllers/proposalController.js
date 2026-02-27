// src/controllers/proposal.controller.js
import { evaluateProposal } from "../services/llmService.js";
import { prisma } from "../lib/prisma.js";

// ─────────────────────────────────────────────
// POST /api/proposals
// Engineer submits a proposal for a challenge.
// Triggers LLM evaluation immediately.
// ─────────────────────────────────────────────
export const createProposal = async (req, res) => {
  try {
    const engineerId = req.user.userId;
    const { challengeId, diagnosis, approach, expectedImprovement } = req.body;

    // ── Validation ───────────────────────────────────────────────────────
    if (
      !challengeId ||
      !diagnosis ||
      !approach ||
      expectedImprovement === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "challengeId, diagnosis, approach, and expectedImprovement are required",
      });
    }

    if (typeof expectedImprovement !== "number" || expectedImprovement <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "expectedImprovement must be a positive number representing % improvement",
      });
    }

    // Enforce minimum content length — prevents one-liner submissions
    if (diagnosis.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: "diagnosis must be at least 50 characters",
      });
    }

    if (approach.trim().length < 100) {
      return res.status(400).json({
        success: false,
        message: "approach must be at least 100 characters",
      });
    }

    // ── Check challenge exists and is open ───────────────────────────────
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return res
        .status(404)
        .json({ success: false, message: "challenge not found" });
    }

    if (challenge.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "this challenge is no longer accepting proposals",
      });
    }

    // ── Check engineer hasn't already submitted a proposal ───────────────
    const existing = await prisma.proposal.findUnique({
      where: {
        challengeId_engineerId: { challengeId, engineerId },
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "you have already submitted a proposal for this challenge",
        data: { proposalId: existing.id, status: existing.status },
      });
    }

    // ── Create proposal in pending state ─────────────────────────────────
    const proposal = await prisma.proposal.create({
      data: {
        challengeId,
        engineerId,
        diagnosis: diagnosis.trim(),
        approach: approach.trim(),
        expectedImprovement,
        status: "pending",
      },
    });

    // ── Trigger LLM evaluation asynchronously ────────────────────────────
    // Return immediately — client polls GET /api/proposals/:id for result
    runProposalEvaluation(proposal.id, challenge, proposal).catch((err) => {
      console.error(`[proposal eval error] proposalId=${proposal.id}`, err);
    });

    return res.status(201).json({
      success: true,
      message: "proposal submitted — evaluation is running",
      data: { proposalId: proposal.id, status: "pending" },
    });
  } catch (error) {
    console.error("[createProposal]", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/proposals/:id
// Engineer fetches their proposal detail + scores.
// ─────────────────────────────────────────────
export const getProposalById = async (req, res) => {
  try {
    const engineerId = req.user.userId;
    const { id } = req.params;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            vertical: true,
            difficulty: true,
            baselineValue: true,
            targetValue: true,
            comparisonOperator: true,
            constraints: true,
            repoUrl: true,
          },
        },
        submission: {
          select: {
            id: true,
            status: true,
            passed: true,
            achievedValue: true,
            improvementDelta: true,
            constraintsPassed: true,
            integrityFlag: true,
          },
        },
      },
    });

    if (!proposal) {
      return res
        .status(404)
        .json({ success: false, message: "proposal not found" });
    }

    if (proposal.engineerId !== engineerId) {
      return res.status(403).json({ success: false, message: "access denied" });
    }

    return res.status(200).json({ success: true, data: { proposal } });
  } catch (error) {
    console.error("[getProposalById]", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/proposals/:id/status
// Lightweight polling endpoint.
// Returns only status + scores once evaluated.
// ─────────────────────────────────────────────
export const getProposalStatus = async (req, res) => {
  try {
    const engineerId = req.user.userId;
    const { id } = req.params;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      select: {
        id: true,
        engineerId: true,
        status: true,
        score: true,
        feedback: true,
      },
    });

    if (!proposal) {
      return res
        .status(404)
        .json({ success: false, message: "proposal not found" });
    }

    if (proposal.engineerId !== engineerId) {
      return res.status(403).json({ success: false, message: "access denied" });
    }

    return res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    console.error("[getProposalStatus]", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/proposals/my
// All proposals by the current engineer,
// with challenge info and submission status.
// ─────────────────────────────────────────────
export const getMyProposals = async (req, res) => {
  try {
    const engineerId = req.user.userId;

    const proposals = await prisma.proposal.findMany({
      where: { engineerId },
      orderBy: { createdAt: "desc" },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            vertical: true,
            difficulty: true,
            baselineValue: true,
            targetValue: true,
            comparisonOperator: true,
            status: true,
          },
        },
        submission: {
          select: {
            id: true,
            status: true,
            passed: true,
            improvementDelta: true,
          },
        },
      },
    });

    return res.status(200).json({ success: true, data: { proposals } });
  } catch (error) {
    console.error("[getMyProposals]", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/proposals/challenge/:challengeId
// Company only. See all proposals for a challenge
// they posted. Used for visibility into demand.
// ─────────────────────────────────────────────
export const getProposalsForChallenge = async (req, res) => {
  try {
    const companyId = req.user.userId;
    const { challengeId } = req.params;

    // Verify the company owns this challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { id: true, postedById: true, title: true },
    });

    if (!challenge) {
      return res
        .status(404)
        .json({ success: false, message: "challenge not found" });
    }

    if (challenge.postedById !== companyId) {
      return res.status(403).json({
        success: false,
        message: "you can only view proposals for challenges you posted",
      });
    }

    const proposals = await prisma.proposal.findMany({
      where: { challengeId },
      orderBy: { score: "desc" },
      include: {
        engineer: {
          select: {
            id: true,
            name: true,
            githubUrl: true,
            profile: {
              select: {
                kpiScore: true,
                totalPassed: true,
                avgImprovement: true,
              },
            },
          },
        },
        submission: {
          select: {
            id: true,
            passed: true,
            achievedValue: true,
            improvementDelta: true,
            status: true,
          },
        },
      },
    });

    // Aggregate stats for the company dashboard
    const stats = {
      total: proposals.length,
      shortlisted: proposals.filter((p) => p.status === "shortlisted").length,
      rejected: proposals.filter((p) => p.status === "rejected").length,
      pending: proposals.filter((p) => p.status === "pending").length,
      avgScore:
        proposals.filter((p) => p.score !== null).length > 0
          ? parseFloat(
              (
                proposals
                  .filter((p) => p.score !== null)
                  .reduce((sum, p) => sum + p.score, 0) /
                proposals.filter((p) => p.score !== null).length
              ).toFixed(1),
            )
          : null,
    };

    return res.status(200).json({
      success: true,
      data: { challenge, proposals, stats },
    });
  } catch (error) {
    console.error("[getProposalsForChallenge]", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// ─────────────────────────────────────────────
// INTERNAL — async LLM evaluation pipeline
// Called after proposal creation.
// Scores the proposal, updates status to
// shortlisted or rejected.
// ─────────────────────────────────────────────
async function runProposalEvaluation(proposalId, challenge, proposal) {
  try {
    const result = await evaluateProposal({ challenge, proposal });

    // result shape from llm.service.js:
    // {
    //   score: number (0-100),
    //   feedback: string,
    //   error: string | null
    // }

    if (result.error) {
      console.error(
        `[proposal eval] LLM error for proposalId=${proposalId}: ${result.error}`,
      );
      // Don't leave the proposal stuck on pending — mark as rejected with explanation
      await prisma.proposal.update({
        where: { id: proposalId },
        data: {
          status: "rejected",
          score: 0,
          feedback: "Evaluation could not be completed. Please resubmit.",
        },
      });
      return;
    }

    // Shortlist threshold: score >= 65
    const SHORTLIST_THRESHOLD = 65;
    const status =
      result.score >= SHORTLIST_THRESHOLD ? "shortlisted" : "rejected";

    await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        score: result.score,
        feedback: result.feedback,
        status,
      },
    });

    console.log(
      `[proposal eval] proposalId=${proposalId} score=${result.score} status=${status}`,
    );
  } catch (error) {
    console.error(`[runProposalEvaluation] proposalId=${proposalId}`, error);
    await prisma.proposal
      .update({
        where: { id: proposalId },
        data: {
          status: "rejected",
          score: 0,
          feedback: "Evaluation failed due to a system error. Please resubmit.",
        },
      })
      .catch(() => {});
  }
}
