// src/types/challenge.types.ts

import { User } from "./auth.types";

export interface Challenge {
  id: string;
  postedById: string | null;

  title: string;
  description: string;

  vertical: Vertical;
  difficulty: Difficulty;
  source: ChallengeSource;

  baselineValue: number;
  targetValue: number;
  comparisonOperator: ">=" | "<=" | ">" | "<" | "==";

  constraints: Record<string, any> | null;

  repoUrl: string | null;
  issueUrl: string | null;

  status: ChallengeStatus;
  createdAt: string;

  postedBy?: {
    id: string;
    name: string;
  };

  _count?: {
    proposals: number;
    submissions: number;
  };
}