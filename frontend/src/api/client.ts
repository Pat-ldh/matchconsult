import type { AnalyzeRequest, AnalyzeResponse } from "../types";

const BASE = "/api";

export async function analyzeMission(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  const res = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? res.statusText);
  }
  return res.json();
}

export async function checkHealth(): Promise<{ cvs_loaded: number; model_ready: boolean }> {
  const res = await fetch(`${BASE}/health`);
  return res.json();
}
