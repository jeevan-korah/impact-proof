// src/api/profile.api.ts

import { api } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { PrivateProfileResponse } from "@/types/profile.types";
import type { Proposal } from "@/types/proposal.types";

export async function getMyProfile() {
  const res = await api.get<ApiResponse<PrivateProfileResponse>>("/profile/me");

  return res.data.data;
}

export async function getMyProposalHistory() {
  const res = await api.get<ApiResponse<{ proposals: Proposal[] }>>(
    "/profile/me/proposals",
  );

  return res.data.data.proposals;
}

export async function discoverEngineers(params?: any) {
  const res = await api.get<ApiResponse<{ engineers: any[]; pagination: any }>>(
    "/profile/discover",
    { params },
  );

  return res.data.data;
}

export async function getPublicProfile(engineerId: string) {
  const res = await api.get<ApiResponse<PrivateProfileResponse>>(
    `/profile/${engineerId}`,
  );

  return res.data.data;
}
