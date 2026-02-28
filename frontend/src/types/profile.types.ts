// src/types/profile.types.ts

import type { ImpactRecord } from "./submission.types";
import type { Vertical, Difficulty } from "./challenge.types";

export interface EngineerProfile {
  engineerId: string;
  totalSubmissions: number;
  totalPassed: number;
  avgImprovement: number;
  kpiScore: number;
  updatedAt: string;
}

export interface VerticalStats {
  attempted: number;
  passed: number;
  passRate: number;
  avgImprovement: number;
}

export interface PrivateProfileResponse {
  user: {
    id: string;
    name: string;
    email: string;
    githubUrl: string | null;
    createdAt: string;
  };

  profile: EngineerProfile;

  impactRecords: (ImpactRecord & {
    challenge: {
      id: string;
      title: string;
      vertical: Vertical;
      difficulty: Difficulty;
      comparisonOperator: ">=" | "<=" | ">" | "<" | "==";
    };
  })[];

  proposalSummary: {
    total: number;
    shortlisted: number;
    rejected: number;
    pending: number;
    acceptanceRate: number;
  };

  verticalBreakdown: Record<Vertical, VerticalStats>;

  recentActivity: {
    challengeId: string;
    challengeTitle: string;
    vertical: Vertical;
    difficulty: Difficulty;
    passed: boolean;
    improvementDelta: number;
    integrityFlag: boolean;
    recordedAt: string;
  }[];
}
