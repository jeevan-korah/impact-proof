// src/types/proposal.types.ts

import type { Challenge } from "./challenge.types";
import type { Submission } from "./submission.types";
import type { User } from "./auth.types";

export type ProposalStatus = "pending" | "shortlisted" | "rejected";

export interface Proposal {
  id: string;
  challengeId: string;
  engineerId: string;

  proposalText: string;
  evaluation: Record<string, boolean> | null;
  ticked: number | null;
  total: number | null;
  percentage: number | null;
  decision: string | null;
  reason: string | null;

  status: ProposalStatus;
  createdAt: string;

  challenge?: Challenge;
  submission?: Submission;
  engineer?: {
    id: string;
    name: string;
    email?: string;
    githubUrl?: string | null;
  };
}
