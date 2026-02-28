// src/types/submission.types.ts

import { Challenge } from "./challenge.types";
import { Proposal } from "./proposal.types";

export interface Submission {
  id: string;
  proposalId: string;
  challengeId: string;
  engineerId: string;

  repoUrl: string;

  achievedValue: number | null;
  improvementDelta: number | null;
  constraintsPassed: boolean | null;
  passed: boolean | null;

  codeFingerprint: string | null;
  similarityScore: number | null;
  integrityFlag: boolean;

  status: SubmissionStatus;
  createdAt: string;

  challenge?: Challenge;
  proposal?: Proposal;
  impactRecord?: ImpactRecord;
}