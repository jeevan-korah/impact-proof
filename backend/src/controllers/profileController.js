// src/controllers/profile.controller.js
import { prisma } from "../lib/prisma.js";

// ─────────────────────────────────────────────
// GET /api/profile/me
// Engineer only. Own full profile with all
// impact records, proposal history, and stats.
// ─────────────────────────────────────────────
export const getMyProfile = async (req, res) => {
  try {
    const engineerId = req.user.userId;

    const [user, profile, impactRecords, proposalStats] = await Promise.all([
      // Base user info
      prisma.user.findUnique({
        where: { id: engineerId },
        select: {
          id: true,
          name: true,
          email: true,
          githubUrl: true,
          createdAt: true,
        },
      }),

      // Aggregated profile scores
      prisma.engineerProfile.findUnique({
        where: { engineerId },
      }),

      // Full impact record history — pass and fail
      prisma.impactRecord.findMany({
        where: { engineerId },
        orderBy: { recordedAt: "desc" },
        include: {
          challenge: {
            select: {
              id: true,
              title: true,
              vertical: true,
              difficulty: true,
              comparisonOperator: true,
            },
          },
        },
      }),

      // Proposal acceptance stats
      prisma.proposal.groupBy({
        by: ["status"],
        where: { engineerId },
        _count: { status: true },
      }),
    ]);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }

    const proposalSummary = buildProposalSummary(proposalStats);
    const verticalBreakdown = buildVerticalBreakdown(impactRecords);
    const recentActivity = buildRecentActivity(impactRecords);

    return res.status(200).json({
      success: true,
      data: {
        user,
        profile: profile ?? buildEmptyProfile(engineerId),
        impactRecords,
        proposalSummary,
        verticalBreakdown,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("[getMyProfile]", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/profile/:engineerId
// Public. Anyone can view an engineer's
// credibility ledger. Companies use this to
// evaluate engineers before reaching out.
// Flagged impact records are hidden publicly.
// ─────────────────────────────────────────────
export const getPublicProfile = async (req, res) => {
  try {
    const { engineerId } = req.params;

    const [user, profile, impactRecords, proposalStats] = await Promise.all([
      prisma.user.findUnique({
        where: { id: engineerId },
        select: {
          id: true,
          name: true,
          githubUrl: true,
          createdAt: true,
          role: true,
        },
      }),

      prisma.engineerProfile.findUnique({
        where: { engineerId },
      }),

      // Public view: only clean, non-flagged records
      prisma.impactRecord.findMany({
        where: { engineerId, integrityFlag: false },
        orderBy: { recordedAt: "desc" },
        include: {
          challenge: {
            select: {
              id: true,
              title: true,
              vertical: true,
              difficulty: true,
              comparisonOperator: true,
            },
          },
        },
      }),

      prisma.proposal.groupBy({
        by: ["status"],
        where: { engineerId },
        _count: { status: true },
      }),
    ]);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "engineer not found" });
    }

    // Don't expose company profiles at this endpoint
    if (user.role !== "engineer") {
      return res
        .status(404)
        .json({ success: false, message: "engineer not found" });
    }

    const proposalSummary = buildProposalSummary(proposalStats);
    const verticalBreakdown = buildVerticalBreakdown(impactRecords);
    const recentActivity = buildRecentActivity(impactRecords);

    return res.status(200).json({
      success: true,
      data: {
        user,
        profile: profile ?? buildEmptyProfile(engineerId),
        impactRecords,
        proposalSummary,
        verticalBreakdown,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("[getPublicProfile]", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/profile/discover
// Company only. Search and filter engineers
// by KPI score, vertical performance, and
// improvement delta for reverse recruiting.
// ─────────────────────────────────────────────
export const discoverEngineers = async (req, res) => {
  try {
    const {
      minKpi,
      minAvgImprovement,
      minTotalPassed,
      vertical, // filter by vertical strength
      sortBy = "kpiScore", // kpiScore | avgImprovement | totalPassed
      order = "desc",
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build profile filters
    const profileWhere = {};
    if (minKpi) profileWhere.kpiScore = { gte: parseFloat(minKpi) };
    if (minAvgImprovement)
      profileWhere.avgImprovement = { gte: parseFloat(minAvgImprovement) };
    if (minTotalPassed)
      profileWhere.totalPassed = { gte: parseInt(minTotalPassed) };

    // Valid sort fields
    const validSortFields = [
      "kpiScore",
      "avgImprovement",
      "totalPassed",
      "totalSubmissions",
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "kpiScore";
    const sortOrder = order === "asc" ? "asc" : "desc";

    const [profiles, total] = await Promise.all([
      prisma.engineerProfile.findMany({
        where: profileWhere,
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limitNum,
        include: {
          engineer: {
            select: {
              id: true,
              name: true,
              githubUrl: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.engineerProfile.count({ where: profileWhere }),
    ]);

    // For each profile, attach their top 3 impact records
    // and vertical breakdown. Run in parallel.
    const enriched = await Promise.all(
      profiles.map(async (profile) => {
        const [topRecords, verticalStats] = await Promise.all([
          prisma.impactRecord.findMany({
            where: {
              engineerId: profile.engineerId,
              passed: true,
              integrityFlag: false,
            },
            orderBy: { improvementDelta: "desc" },
            take: 3,
            include: {
              challenge: {
                select: {
                  title: true,
                  vertical: true,
                  difficulty: true,
                },
              },
            },
          }),

          prisma.impactRecord.groupBy({
            by: ["challengeId"],
            where: {
              engineerId: profile.engineerId,
              integrityFlag: false,
            },
            _avg: { improvementDelta: true },
            _count: { passed: true },
          }),
        ]);

        // If filtering by vertical, check engineer has records in that vertical
        if (vertical) {
          const challengeIds = verticalStats.map((v) => v.challengeId);
          const verticalRecords = await prisma.challenge.findMany({
            where: { id: { in: challengeIds }, vertical },
            select: { id: true },
          });
          if (verticalRecords.length === 0) return null;
        }

        return {
          ...profile,
          topImpactRecords: topRecords,
        };
      }),
    );

    // Remove nulls from vertical filter
    const filtered = enriched.filter(Boolean);

    return res.status(200).json({
      success: true,
      data: {
        engineers: filtered,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("[discoverEngineers]", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/profile/me/proposals
// Engineer only. Full proposal history with
// challenge context and submission outcomes.
// Useful for the "My Activity" dashboard tab.
// ─────────────────────────────────────────────
export const getMyProposalHistory = async (req, res) => {
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
            achievedValue: true,
            improvementDelta: true,
            constraintsPassed: true,
            integrityFlag: true,
            createdAt: true,
          },
        },
      },
    });

    return res.status(200).json({ success: true, data: { proposals } });
  } catch (error) {
    console.error("[getMyProposalHistory]", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// ─────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────

// Flatten groupBy result into a readable summary object
function buildProposalSummary(groupByResult) {
  const summary = {
    total: 0,
    shortlisted: 0,
    rejected: 0,
    pending: 0,
    acceptanceRate: 0,
  };

  for (const row of groupByResult) {
    const count = row._count.status;
    summary[row.status] = count;
    summary.total += count;
  }

  summary.acceptanceRate =
    summary.total > 0
      ? parseFloat(((summary.shortlisted / summary.total) * 100).toFixed(1))
      : 0;

  return summary;
}

// Compute per-vertical pass rate and avg improvement from impact records
function buildVerticalBreakdown(impactRecords) {
  const verticals = ["frontend", "backend", "ml"];
  const breakdown = {};

  for (const vertical of verticals) {
    const records = impactRecords.filter(
      (r) => r.challenge.vertical === vertical,
    );
    const passed = records.filter((r) => r.passed);

    breakdown[vertical] = {
      attempted: records.length,
      passed: passed.length,
      passRate:
        records.length > 0
          ? parseFloat(((passed.length / records.length) * 100).toFixed(1))
          : 0,
      avgImprovement:
        passed.length > 0
          ? parseFloat(
              (
                passed.reduce((s, r) => s + r.improvementDelta, 0) /
                passed.length
              ).toFixed(1),
            )
          : 0,
    };
  }

  return breakdown;
}

// Last 5 activity items combining passes and fails, sorted by date
function buildRecentActivity(impactRecords) {
  return impactRecords.slice(0, 5).map((r) => ({
    challengeId: r.challengeId,
    challengeTitle: r.challenge.title,
    vertical: r.challenge.vertical,
    difficulty: r.challenge.difficulty,
    passed: r.passed,
    improvementDelta: r.improvementDelta,
    integrityFlag: r.integrityFlag,
    recordedAt: r.recordedAt,
  }));
}

// Default empty profile shape for engineers who haven't submitted yet
function buildEmptyProfile(engineerId) {
  return {
    engineerId,
    totalSubmissions: 0,
    totalPassed: 0,
    avgImprovement: 0,
    kpiScore: 0,
    updatedAt: null,
  };
}
