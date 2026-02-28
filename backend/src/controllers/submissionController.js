// src/controllers/submission.controller.js
import { prisma } from "../lib/prisma.js";
import { runTestPipeline } from "../services/testRunner.js";
import {
  computeKpiScore,
  computeCodeFingerprint,
  checkSimilarity,
} from "../services/scoringService.js";

// ─────────────────────────────────────────────
// POST /api/submissions
// Engineer submits a solution repo URL.
// Requires: shortlisted proposal for this challenge.
// ─────────────────────────────────────────────
export const createSubmission = async (req, res) => {
  try {
    const engineerId = req.user.userId;
    const { challengeId, repoUrl } = req.body;

    console.log("[createSubmission] engineerId:", engineerId, "challengeId:", challengeId, "repoUrl:", repoUrl);

    if (!challengeId || !repoUrl) {
      return res.status(400).json({
        success: false,
        message: "challengeId and repoUrl are required",
      });
    }

    // Validate repoUrl is a GitHub URL
    if (!repoUrl.startsWith("https://github.com/")) {
      return res.status(400).json({
        success: false,
        message: "repoUrl must be a valid GitHub repository URL",
      });
    }

    // 1. Check challenge exists and is still open
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return res
        .status(404)
        .json({ success: false, message: "challenge not found" });
    }

    if (challenge.status !== "open") {
      return res
        .status(400)
        .json({ success: false, message: "challenge is no longer open" });
    }

    // 2. Check engineer has a shortlisted proposal for this challenge
    const proposal = await prisma.proposal.findUnique({
      where: {
        challengeId_engineerId: { challengeId, engineerId },
      },
    });

    console.log("[createSubmission] proposal found:", proposal ? `id=${proposal.id}, status=${proposal.status}, decision=${proposal.decision}` : "none");

    if (!proposal) {
      return res.status(403).json({
        success: false,
        message: "you must submit a proposal before submitting a solution",
      });
    }

    if (proposal.status !== "shortlisted") {
      console.log("[createSubmission] REJECTED: proposal status is", proposal.status, "not shortlisted");
      return res.status(403).json({
        success: false,
        message: `your proposal is ${proposal.status} — only shortlisted proposals can proceed to submission`,
      });
    }

    // 3. Check no existing submission for this proposal
    const existingSubmission = await prisma.submission.findUnique({
      where: { proposalId: proposal.id },
    });

    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        message: "you have already submitted a solution for this challenge",
        data: {
          submissionId: existingSubmission.id,
          status: existingSubmission.status,
        },
      });
    }

    // 4. Create submission record in pending state
    const submission = await prisma.submission.create({
      data: {
        proposalId: proposal.id,
        challengeId,
        engineerId,
        repoUrl,
        status: "pending",
      },
    });

    // 5. Run test pipeline asynchronously — do NOT await here
    // Client will poll GET /api/submissions/:id for status
    runSubmissionPipeline(submission.id, challenge, proposal, repoUrl).catch(
      (err) => {
        console.error(`[pipeline error] submissionId=${submission.id}`, err);
      },
    );

    return res.status(201).json({
      success: true,
      message: "submission received — test pipeline is running",
      data: { submissionId: submission.id, status: "pending" },
    });
  } catch (error) {
    console.error("[createSubmission]", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/submissions/:id
// Get submission detail + test results.
// Engineers can only see their own.
// ─────────────────────────────────────────────
export const getSubmission = async (req, res) => {
  try {
    const engineerId = req.user.userId;
    const { id } = req.params;

    const submission = await prisma.submission.findUnique({
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
          },
        },
        proposal: {
          select: {
            id: true,
            percentage: true,
            decision: true,
            reason: true,
            ticked: true,
            total: true,
          },
        },
        impactRecord: true,
      },
    });

    if (!submission) {
      return res
        .status(404)
        .json({ success: false, message: "submission not found" });
    }

    if (submission.engineerId !== engineerId) {
      return res.status(403).json({ success: false, message: "access denied" });
    }

    return res.status(200).json({ success: true, data: { submission } });
  } catch (error) {
    console.error("[getSubmission]", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/submissions/:id/status
// Lightweight polling endpoint — returns only status.
// ─────────────────────────────────────────────
export const getSubmissionStatus = async (req, res) => {
  try {
    const engineerId = req.user.userId;
    const { id } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      select: {
        id: true,
        engineerId: true,
        status: true,
        passed: true,
        achievedValue: true,
        improvementDelta: true,
        constraintsPassed: true,
        integrityFlag: true,
      },
    });

    if (!submission) {
      return res
        .status(404)
        .json({ success: false, message: "submission not found" });
    }

    if (submission.engineerId !== engineerId) {
      return res.status(403).json({ success: false, message: "access denied" });
    }

    return res.status(200).json({ success: true, data: submission });
  } catch (error) {
    console.error("[getSubmissionStatus]", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/submissions/my
// All submissions by the current engineer.
// ─────────────────────────────────────────────
export const getMySubmissions = async (req, res) => {
  try {
    const engineerId = req.user.userId;

    const submissions = await prisma.submission.findMany({
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
          },
        },
        impactRecord: {
          select: {
            improvementDelta: true,
            passed: true,
            recordedAt: true,
          },
        },
      },
    });

    return res.status(200).json({ success: true, data: { submissions } });
  } catch (error) {
    console.error("[getMySubmissions]", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// ─────────────────────────────────────────────
// INTERNAL — async pipeline
// Runs after submission is created.
// Handles: test execution → integrity checks → scoring → profile update
// ─────────────────────────────────────────────
async function runSubmissionPipeline(
  submissionId,
  challenge,
  proposal,
  repoUrl,
) {
  try {
    // ── Step 1: Run automated tests ──────────────────────────────────────
    const testResult = await runTestPipeline({
      vertical: challenge.vertical,
      repoUrl,
      challengeId: challenge.id,
      baselineValue: challenge.baselineValue,
      targetValue: challenge.targetValue,
      comparisonOperator: challenge.comparisonOperator,
      constraints: challenge.constraints,
    });

    // testResult shape:
    // {
    //   achievedValue: Float,
    //   constraintsPassed: Boolean,
    //   passed: Boolean,         — did it meet success criteria?
    //   error: String | null     — populated if runner crashed
    // }

    if (testResult.error) {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: "completed", passed: false },
      });
      return;
    }

    const improvementDelta = computeImprovementDelta(
      challenge.baselineValue,
      testResult.achievedValue,
    );

    // ── Step 2: Integrity checks ─────────────────────────────────────────
    const codeFingerprint = await computeCodeFingerprint(repoUrl);

    // Check similarity against all other submissions for this challenge
    const priorSubmissions = await prisma.submission.findMany({
      where: {
        challengeId: challenge.id,
        id: { not: submissionId },
        codeFingerprint: { not: null },
        status: "completed",
      },
      select: { id: true, codeFingerprint: true, engineerId: true },
    });

    let similarityScore = 0;
    let integrityFlag = false;

    if (priorSubmissions.length > 0) {
      const similarities = priorSubmissions.map((s) =>
        checkSimilarity(codeFingerprint, s.codeFingerprint),
      );
      similarityScore = Math.max(...similarities);

      // Flag if any prior submission is >85% similar
      if (similarityScore > 0.85) {
        integrityFlag = true;
        console.warn(
          `[integrity] submissionId=${submissionId} flagged — similarity=${similarityScore.toFixed(2)}`,
        );
      }
    }

    // Also check proposal-to-outcome consistency
    // If engineer predicted X% improvement but achieved > 2X, flag for review
    const predictedImprovement = proposal.expectedImprovement;
    if (
      improvementDelta > 0 &&
      predictedImprovement > 0 &&
      improvementDelta > predictedImprovement * 2
    ) {
      integrityFlag = true;
      console.warn(
        `[integrity] submissionId=${submissionId} flagged — predicted=${predictedImprovement}% achieved=${improvementDelta.toFixed(1)}%`,
      );
    }

    // ── Step 3: Update submission record ─────────────────────────────────
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        achievedValue: testResult.achievedValue,
        improvementDelta,
        constraintsPassed: testResult.constraintsPassed,
        passed: testResult.passed && testResult.constraintsPassed,
        codeFingerprint,
        similarityScore,
        integrityFlag,
        status: "completed",
      },
    });

    // ── Step 4: Write impact record ───────────────────────────────────────
    // Always write — pass AND fail. This is what makes the ledger credible.
    // Flagged submissions are written but marked, pending manual review.
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { engineerId: true, challengeId: true },
    });

    await prisma.impactRecord.create({
      data: {
        engineerId: submission.engineerId,
        challengeId: submission.challengeId,
        submissionId,
        baselineValue: challenge.baselineValue,
        achievedValue: testResult.achievedValue,
        improvementDelta,
        passed: updatedSubmission.passed,
        integrityFlag,
      },
    });

    // ── Step 5: Update engineer profile ──────────────────────────────────
    // Only recalculate from clean (non-flagged) records
    await recalculateEngineerProfile(submission.engineerId);
  } catch (error) {
    console.error(
      `[runSubmissionPipeline] submissionId=${submissionId}`,
      error,
    );

    // Mark as completed even on pipeline error so the engineer isn't stuck polling
    await prisma.submission
      .update({
        where: { id: submissionId },
        data: { status: "completed", passed: false },
      })
      .catch(() => {});
  }
}

// ─────────────────────────────────────────────
// INTERNAL — recalculate and upsert EngineerProfile
// Called after every completed submission.
// Only uses non-flagged impact records.
// ─────────────────────────────────────────────
async function recalculateEngineerProfile(engineerId) {
  // Pull all non-flagged impact records for this engineer
  const records = await prisma.impactRecord.findMany({
    where: { engineerId, integrityFlag: false },
    include: {
      challenge: { select: { difficulty: true } },
    },
  });

  // Pull all proposals to compute acceptance rate
  const allProposals = await prisma.proposal.findMany({
    where: { engineerId },
    select: { status: true },
  });

  const totalSubmissions = records.length;
  const totalPassed = records.filter((r) => r.passed).length;

  const passedRecords = records.filter((r) => r.passed);
  const avgImprovement =
    passedRecords.length > 0
      ? passedRecords.reduce((sum, r) => sum + r.improvementDelta, 0) /
        passedRecords.length
      : 0;

  const shortlistedCount = allProposals.filter(
    (p) => p.status === "shortlisted",
  ).length;
  const proposalAcceptanceRate =
    allProposals.length > 0 ? shortlistedCount / allProposals.length : 0;

  // KPI score formula (0-100 scale):
  // Weighted combination of pass rate, avg improvement, and proposal quality
  const passRate = totalSubmissions > 0 ? totalPassed / totalSubmissions : 0;

  // Difficulty multipliers: easy=1, medium=1.5, hard=2
  const difficultyMultiplierMap = { easy: 1, medium: 1.5, hard: 2 };
  const weightedImprovementSum = passedRecords.reduce((sum, r) => {
    const multiplier = difficultyMultiplierMap[r.challenge.difficulty] ?? 1;
    return sum + r.improvementDelta * multiplier;
  }, 0);

  // Normalise improvement contribution — cap at 100 points per challenge
  const normalisedImprovementScore =
    passedRecords.length > 0
      ? Math.min((weightedImprovementSum / passedRecords.length) * 2, 100)
      : 0;

  const kpiScore =
    passRate * 40 + // 40% weight: consistency
    normalisedImprovementScore * 0.4 + // 40% weight: impact magnitude
    proposalAcceptanceRate * 20; // 20% weight: proposal quality signal

  await prisma.engineerProfile.upsert({
    where: { engineerId },
    update: {
      totalSubmissions,
      totalPassed,
      avgImprovement: parseFloat(avgImprovement.toFixed(2)),
      kpiScore: parseFloat(kpiScore.toFixed(2)),
      updatedAt: new Date(),
    },
    create: {
      engineerId,
      totalSubmissions,
      totalPassed,
      avgImprovement: parseFloat(avgImprovement.toFixed(2)),
      kpiScore: parseFloat(kpiScore.toFixed(2)),
    },
  });
}

// ─────────────────────────────────────────────
// UTIL — compute % improvement over baseline
// ─────────────────────────────────────────────
function computeImprovementDelta(baseline, achieved) {
  if (baseline === 0) return 0;
  return parseFloat(
    (((achieved - baseline) / Math.abs(baseline)) * 100).toFixed(2),
  );
}
