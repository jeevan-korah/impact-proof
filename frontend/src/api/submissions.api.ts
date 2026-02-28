// src/api/submissions.api.ts

import { api } from "@/lib/axios";
import { ApiResponse } from "@/types/api.types";
import { Submission } from "@/types/submission.types";

export async function createSubmission(data: {
  challengeId: string;
  repoUrl: string;
}) {
  const res = await api.post<
    ApiResponse<{ submissionId: string; status: string }>
  >("/submissions", data);

  return res.data.data;
}

export async function getSubmissionById(id: string) {
  const res = await api.get<
    ApiResponse<{ submission: Submission }>
  >(`/submissions/${id}`);

  return res.data.data.submission;
}

export async function getSubmissionStatus(id: string) {
  const res = await api.get<
    ApiResponse<{
      id: string;
      status: string;
      passed: boolean | null;
      achievedValue: number | null;
      improvementDelta: number | null;
      constraintsPassed: boolean | null;
      integrityFlag: boolean;
    }>
  >(`/submissions/${id}/status`);

  return res.data.data;
}

export async function getMySubmissions() {
  const res = await api.get<
    ApiResponse<{ submissions: Submission[] }>
  >("/submissions/my");

  return res.data.data.submissions;
}