// src/api/challenges.api.ts

import { api } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { Challenge } from "@/types/challenge.types";

export async function getChallenges(params?: any) {
  const res = await api.get<ApiResponse<{ challenges: Challenge[] }>>(
    "/challenges",
    { params },
  );

  return res.data.data.challenges;
}

export async function getChallengeById(id: string) {
  const res = await api.get<
    ApiResponse<{ challenge: Challenge; engineerProgress: any }>
  >(`/challenges/${id}`);

  return res.data.data;
}

export async function createChallenge(data: any) {
  const res = await api.post<ApiResponse<{ challenge: Challenge }>>(
    "/challenges",
    data,
  );

  return res.data.data.challenge;
}

export async function updateChallengeStatus(
  id: string,
  status: "open" | "closed",
) {
  const res = await api.patch<ApiResponse<{ challenge: Challenge }>>(
    `/challenges/${id}/status`,
    { status },
  );

  return res.data.data.challenge;
}

export async function getLeaderboard(id: string) {
  const res = await api.get<
    ApiResponse<{ challenge: any; leaderboard: any[] }>
  >(`/challenges/${id}/leaderboard`);

  return res.data.data;
}
