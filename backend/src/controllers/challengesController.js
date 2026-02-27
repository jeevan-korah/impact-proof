import { prisma } from "../lib/prisma.js";

// ─────────────────────────────────────────────
// GET /api/challenges
// Public. List all challenges.
// Query params: vertical, source, difficulty, status
// ─────────────────────────────────────────────
export const getChallenges = async (req, res) => {
  try {
    const { vertical, source, difficulty, status } = req.query;

    const where = {};
    if (vertical) where.vertical = vertical;
    if (source) where.source = source;
    if (difficulty) where.difficulty = difficulty;

    // Default to only showing open challenges unless explicitly requested
    where.status = status ?? "open";

    const challenges = await prisma.challenge.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        postedBy: {
          select: { id: true, name: true },
        },
        _count: {
          select: { proposals: true, submissions: true },
        },
      },
    });

    return res.status(200).json({ success: true, data: { challenges } });
  } catch (error) {
    console.error("[getChallenges]", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/challenges/:id
// Public. Full detail of a single challenge.
// If engineer is authenticated, also returns their
// proposal + submission status for this challenge.
// ─────────────────────────────────────────────
export const getChallengeById = async (req, res) => {
  try {
    const { id } = req.params;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        postedBy: {
          select: { id: true, name: true },
        },
        _count: {
          select: { proposals: true, submissions: true },
        },
      },
    });

    if (!challenge) {
      return res
        .status(404)
        .json({ success: false, message: "challenge not found" });
    }

    // If a logged-in engineer is requesting, attach their progress on this challenge
    let engineerProgress = null;
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const jwt = await import("jsonwebtoken");
        const decoded = jwt.default.verify(
          authHeader.split(" ")[1],
          process.env.JWT_SECRET,
        );

        if (decoded.role === "engineer") {
          const proposal = await prisma.proposal.findUnique({
            where: {
              challengeId_engineerId: {
                challengeId: id,
                engineerId: decoded.userId,
              },
            },
            select: {
              id: true,
              status: true,
              score: true,
              createdAt: true,
              submission: {
                select: {
                  id: true,
                  status: true,
                  passed: true,
                  achievedValue: true,
                  improvementDelta: true,
                },
              },
            },
          });

          engineerProgress = proposal ?? null;
        }
      } catch (_) {
        // Invalid or expired token — just skip the progress lookup
      }
    }

    return res.status(200).json({
      success: true,
      data: { challenge, engineerProgress },
    });
  } catch (error) {
    console.error("[getChallengeById]", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// ─────────────────────────────────────────────
// POST /api/challenges
// Company role only. Post a new challenge.
// ─────────────────────────────────────────────
export const createChallenge = async (req, res) => {
  try {
    const companyId = req.user.userId;

    const {
      title,
      description,
      vertical,
      difficulty,
      source,
      baselineValue,
      targetValue,
      comparisonOperator,
      constraints,
      repoUrl,
      issueUrl,
    } = req.body;

    // ── Validation ───────────────────────────────────────────────────────
    const requiredFields = {
      title,
      description,
      vertical,
      difficulty,
      baselineValue,
      targetValue,
      comparisonOperator,
    };
    const missing = Object.entries(requiredFields)
      .filter(([, v]) => v === undefined || v === null || v === "")
      .map(([k]) => k);

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `missing required fields: ${missing.join(", ")}`,
      });
    }

    const validVerticals = ["frontend", "backend", "ml"];
    if (!validVerticals.includes(vertical)) {
      return res.status(400).json({
        success: false,
        message: `vertical must be one of: ${validVerticals.join(", ")}`,
      });
    }

    const validDifficulties = ["easy", "medium", "hard"];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: `difficulty must be one of: ${validDifficulties.join(", ")}`,
      });
    }

    const validOperators = [">=", "<=", ">", "<", "=="];
    if (!validOperators.includes(comparisonOperator)) {
      return res.status(400).json({
        success: false,
        message: `comparisonOperator must be one of: ${validOperators.join(", ")}`,
      });
    }

    if (typeof baselineValue !== "number" || typeof targetValue !== "number") {
      return res.status(400).json({
        success: false,
        message: "baselineValue and targetValue must be numbers",
      });
    }

    // Sanity check — target should represent an improvement over baseline
    // For >= and > operators, target should be higher; for <= and <, lower
    const improvementCheck = {
      ">=": targetValue > baselineValue,
      ">": targetValue > baselineValue,
      "<=": targetValue < baselineValue,
      "<": targetValue < baselineValue,
      "==": true,
    };

    if (!improvementCheck[comparisonOperator]) {
      return res.status(400).json({
        success: false,
        message:
          "targetValue must represent an improvement over baselineValue for the given operator",
      });
    }

    // opensource challenges must have issueUrl
    const resolvedSource = source ?? "company";
    if (resolvedSource === "opensource" && !issueUrl) {
      return res.status(400).json({
        success: false,
        message: "issueUrl is required for open-source challenges",
      });
    }

    const challenge = await prisma.challenge.create({
      data: {
        postedById: companyId,
        title: title.trim(),
        description: description.trim(),
        vertical,
        difficulty,
        source: resolvedSource,
        baselineValue,
        targetValue,
        comparisonOperator,
        constraints: constraints ?? null,
        repoUrl: repoUrl ?? null,
        issueUrl: issueUrl ?? null,
        status: "open",
      },
      include: {
        postedBy: {
          select: { id: true, name: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "challenge created successfully",
      data: { challenge },
    });
  } catch (error) {
    console.error("[createChallenge]", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/challenges/:id/status
// Company role only. Open or close a challenge.
// Only the company that posted it can update it.
// ─────────────────────────────────────────────
export const updateChallengeStatus = async (req, res) => {
  try {
    const companyId = req.user.userId;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["open", "closed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const challenge = await prisma.challenge.findUnique({ where: { id } });

    if (!challenge) {
      return res
        .status(404)
        .json({ success: false, message: "challenge not found" });
    }

    // Only the company that posted it can close it
    if (challenge.postedById !== companyId) {
      return res.status(403).json({
        success: false,
        message: "you can only update challenges you posted",
      });
    }

    if (challenge.status === status) {
      return res.status(400).json({
        success: false,
        message: `challenge is already ${status}`,
      });
    }

    const updated = await prisma.challenge.update({
      where: { id },
      data: { status },
      include: {
        postedBy: { select: { id: true, name: true } },
        _count: { select: { proposals: true, submissions: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: `challenge ${status === "closed" ? "closed" : "reopened"} successfully`,
      data: { challenge: updated },
    });
  } catch (error) {
    console.error("[updateChallengeStatus]", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/challenges/my
// Company role only. All challenges posted by
// the authenticated company, with full stats.
// ─────────────────────────────────────────────
export const getMyChallenges = async (req, res) => {
  try {
    const companyId = req.user.userId;

    const challenges = await prisma.challenge.findMany({
      where: { postedById: companyId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { proposals: true, submissions: true },
        },
        submissions: {
          where: { passed: true },
          select: { id: true },
        },
      },
    });

    // Enrich each challenge with a passing submission count
    const enriched = challenges.map((c) => ({
      ...c,
      passedSubmissionsCount: c.submissions.length,
      submissions: undefined, // strip raw array from response
    }));

    return res
      .status(200)
      .json({ success: true, data: { challenges: enriched } });
  } catch (error) {
    console.error("[getMyChallenges]", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/challenges/:id/leaderboard
// Public. Top passing submissions for a challenge,
// ordered by improvement delta descending.
// Powers the per-challenge leaderboard on the UI.
// ─────────────────────────────────────────────
export const getChallengeLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        vertical: true,
        baselineValue: true,
        targetValue: true,
      },
    });

    if (!challenge) {
      return res
        .status(404)
        .json({ success: false, message: "challenge not found" });
    }

    const topSubmissions = await prisma.submission.findMany({
      where: {
        challengeId: id,
        passed: true,
        integrityFlag: false,
        status: "completed",
      },
      orderBy: { improvementDelta: "desc" },
      take: 10,
      select: {
        id: true,
        achievedValue: true,
        improvementDelta: true,
        constraintsPassed: true,
        createdAt: true,
        engineer: {
          select: {
            id: true,
            name: true,
            githubUrl: true,
          },
        },
        proposal: {
          select: {
            score: true,
            expectedImprovement: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: { challenge, leaderboard: topSubmissions },
    });
  } catch (error) {
    console.error("[getChallengeLeaderboard]", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};
