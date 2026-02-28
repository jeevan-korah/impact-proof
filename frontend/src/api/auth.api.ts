// src/api/auth.api.ts

import { api } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { AuthResponse } from "@/types/auth.types";

export async function login(data: { email: string; password: string }) {
  const res = await api.post<ApiResponse<AuthResponse>>("/auth/login", data);

  return res.data.data;
}

export async function register(data: {
  email: string;
  password: string;
  name: string;
  role: "engineer" | "company";
  githubUrl?: string;
}) {
  const res = await api.post<ApiResponse<AuthResponse>>("/auth/register", data);

  return res.data.data;
}

export async function getMe() {
  const res = await api.get<ApiResponse<{ user: any }>>("/auth/me");

  return res.data.data.user;
}
