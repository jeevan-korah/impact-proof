// src/types/proposal.types.ts

import { Challenge } from "./challenge.types";
import { Submission } from "./submission.types";
import { User } from "./auth.types";

export interface Proposal {
  id: string;
  challengeId: string;
  engineerId: string;

  diagnosis: string;
  approach: string;
  expectedImprovement: number;

  score: number | null;
  feedback: string | null;

  status: ProposalStatus;
  createdAt: string;

  challenge?: Challenge;
  submission?: Submission;
  engineer?: {
    id: string;
    name: string;
    githubUrl: string | null;
  };
}