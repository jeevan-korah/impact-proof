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

export async function createProposal(data: {
  challengeId: string;
  proposalText: string;
}) {
  const res = await api.post<ApiResponse<ProposalEvalResult>>(
    "/proposal",
    data,
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
