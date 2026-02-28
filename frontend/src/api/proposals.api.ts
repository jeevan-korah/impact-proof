// src/api/proposals.api.ts

import { api } from "@/lib/axios";
import { ApiResponse } from "@/types/api.types";
import { Proposal } from "@/types/proposal.types";

export async function createProposal(data: {
  challengeId: string;
  diagnosis: string;
  approach: string;
  expectedImprovement: number;
}) {
  const res = await api.post<
    ApiResponse<{ proposalId: string; status: string }>
  >("/proposals", data);

  return res.data.data;
}

export async function getProposalById(id: string) {
  const res = await api.get<
    ApiResponse<{ proposal: Proposal }>
  >(`/proposals/${id}`);

  return res.data.data.proposal;
}

export async function getProposalStatus(id: string) {
  const res = await api.get<
    ApiResponse<{
      id: string;
      status: string;
      score: number | null;
      feedback: string | null;
    }>
  >(`/proposals/${id}/status`);

  return res.data.data;
}

export async function getMyProposals() {
  const res = await api.get<
    ApiResponse<{ proposals: Proposal[] }>
  >("/proposals/my");

  return res.data.data.proposals;
}

export async function getProposalsForChallenge(
  challengeId: string
) {
  const res = await api.get<
    ApiResponse<{ challenge: any; proposals: Proposal[]; stats: any }>
  >(`/proposals/challenge/${challengeId}`);

  return res.data.data;
}