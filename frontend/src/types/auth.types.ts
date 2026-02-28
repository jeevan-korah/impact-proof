// src/types/auth.types.ts

export type Role = "engineer" | "company";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  githubUrl: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}