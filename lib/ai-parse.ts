import type { AiReportResult } from "@/lib/db/schema";

export function parseJsonFromModel<T>(raw: string): T {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid JSON from model");
  }
  return JSON.parse(jsonMatch[0]) as T;
}

export function parseAiReportJson(raw: string): AiReportResult {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid JSON from model");
  }
  const result = JSON.parse(jsonMatch[0]) as AiReportResult;
  if (
    !Array.isArray(result.supplements) ||
    !Array.isArray(result.limits) ||
    !Array.isArray(result.medicationSafety)
  ) {
    throw new Error("Invalid report shape");
  }
  return result;
}
