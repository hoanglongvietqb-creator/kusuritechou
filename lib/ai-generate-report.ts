import "server-only";
import { generateText, isGeminiConfigured } from "@/lib/gemini";
import { parseAiReportJson } from "@/lib/ai-parse";
import type { AiPeriodReportResult, AiReportResult } from "@/lib/db/schema";

const DAILY_SYSTEM = `あなたは栄養・服薬アドバイザーです。日本語で回答し、JSONのみを返してください。
形式:
{
  "supplements": [{"title": "...", "detail": "..."}],
  "limits": [{"title": "...", "detail": "..."}],
  "medicationSafety": [{"title": "...", "detail": "..."}]
}
各配列は2〜4項目。医学的診断はせず、一般的な参考情報として述べること。`;

const PERIOD_SYSTEM = `あなたは栄養・服薬アドバイザーです。日本語で回答し、JSONのみを返してください。
形式:
{
  "supplements": [{"title": "...", "detail": "..."}],
  "limits": [{"title": "...", "detail": "..."}],
  "medicationSafety": [{"title": "...", "detail": "..."}],
  "hydrationInsights": [{"title": "...", "detail": "..."}],
  "dietInsights": [{"title": "...", "detail": "..."}]
}
各配列は2〜4項目。水分・食事の傾向を hydrationInsights / dietInsights に含めること。医学的診断はしないこと。`;

async function generateWithRetry(
  dataText: string,
  system: string,
  isPeriod: boolean
): Promise<AiReportResult> {
  const prompt = isPeriod
    ? `以下の期間健康データを分析してください:\n\n${dataText}`
    : `以下の本日の健康データを分析してください:\n\n${dataText}`;

  try {
    const raw = await generateText(prompt, system);
    return parseAiReportJson(raw);
  } catch {
    const raw = await generateText(
      `${prompt}\n\n重要: 有効なJSONオブジェクトのみを出力してください。説明文は不要です。`,
      `${system}\n必ずJSONのみを返すこと。`
    );
    return parseAiReportJson(raw);
  }
}

export async function generateDailyReport(
  dataText: string
): Promise<AiReportResult> {
  if (!isGeminiConfigured()) {
    throw new Error("GEMINI_NOT_CONFIGURED");
  }
  return generateWithRetry(dataText, DAILY_SYSTEM, false);
}

export async function generatePeriodReport(
  dataText: string
): Promise<AiPeriodReportResult> {
  if (!isGeminiConfigured()) {
    throw new Error("GEMINI_NOT_CONFIGURED");
  }
  const result = await generateWithRetry(dataText, PERIOD_SYSTEM, true);
  return result as AiPeriodReportResult;
}
