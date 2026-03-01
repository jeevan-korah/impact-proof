// src/api/proposals.api.ts

import { api } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { Proposal } from "@/types/proposal.types";

export interface ProposalEvalResult {
  proposalId: string;
  evaluation: Record<string, boolean>;
  ticked: number;
  total: number;
  percentage: number;
  decision: string;
  reason: string;
  status: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  keywords: string[];
}

export interface QuizGenerateResult {
  questions: QuizQuestion[];
  source: string;
  total: number;
}

/**
 * Submit a proposal as a .txt file upload (multipart/form-data).
 */
export async function createProposal(data: {
  challengeId: string;
  proposalFile: File;
}) {
  const formData = new FormData();
  formData.append("challengeId", data.challengeId);
  formData.append("proposalFile", data.proposalFile);

  const res = await api.post<ApiResponse<ProposalEvalResult>>(
    "/proposal",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return res.data.data;
}

/**
 * Generate quiz questions from the approved proposal + challenge description.
 */
export async function generateQuizQuestions(challengeId: string) {
  const res = await api.post<ApiResponse<QuizGenerateResult>>(
    "/proposal/quiz/generate",
    { challengeId },
  );

  return res.data.data;
}

export async function getProposalById(id: string) {
  const res = await api.get<ApiResponse<{ proposal: Proposal }>>(
    `/proposal/${id}`,
  );

  return res.data.data.proposal;
}

export async function getProposalStatus(id: string) {
  const res = await api.get<
    ApiResponse<{
      id: string;
      status: string;
      decision: string | null;
      percentage: number | null;
      ticked: number | null;
      total: number | null;
      reason: string | null;
    }>
  >(`/proposal/${id}/status`);

  return res.data.data;
}

export async function getMyProposals() {
  const res =
    await api.get<ApiResponse<{ proposals: Proposal[] }>>("/proposal/my");

  return res.data.data.proposals;
}

export async function getProposalsForChallenge(challengeId: string) {
  const res = await api.get<ApiResponse<{ proposals: Proposal[] }>>(
    `/proposal/challenge/${challengeId}`,
  );

  return res.data.data.proposals;
}
