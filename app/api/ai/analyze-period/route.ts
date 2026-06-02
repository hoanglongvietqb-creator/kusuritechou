import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { generatePeriodReport } from "@/lib/ai-generate-report";
import { buildPeriodSummary } from "@/lib/period-summary";
import { isGeminiConfigured } from "@/lib/gemini";
import { db } from "@/lib/db";
import { aiPeriodReports } from "@/lib/db/schema";

const rangeSchema = z.enum(["week", "month"]);

function getRangeFromUrl(req: Request) {
  const { searchParams } = new URL(req.url);
  return searchParams.get("range") ?? "week";
}

export async function GET(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const parsed = rangeSchema.safeParse(getRangeFromUrl(req));
  if (!parsed.success) {
    return NextResponse.json({ error: "rangeは week または month" }, { status: 400 });
  }

  const summary = await buildPeriodSummary(authResult.userId, parsed.data);

  const cached = await db
    .select()
    .from(aiPeriodReports)
    .where(
      and(
        eq(aiPeriodReports.userId, authResult.userId),
        eq(aiPeriodReports.periodType, parsed.data),
        eq(aiPeriodReports.periodEndDate, summary.periodEndDate)
      )
    )
    .limit(1);

  return NextResponse.json({
    periodType: parsed.data,
    periodEndDate: summary.periodEndDate,
    result: cached[0]?.result ?? null,
    hasData:
      summary.hydration.days.some((d) => d.totalMl > 0) || summary.mealCount > 0,
    geminiConfigured: isGeminiConfigured(),
  });
}

export async function POST(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const body = await req.json().catch(() => ({}));
  const rangeParam =
    (body as { range?: string }).range ?? getRangeFromUrl(req);
  const force = (body as { force?: boolean }).force === true;

  const parsed = rangeSchema.safeParse(rangeParam);
  if (!parsed.success) {
    return NextResponse.json({ error: "rangeは week または month" }, { status: 400 });
  }

  const summary = await buildPeriodSummary(authResult.userId, parsed.data);

  if (!force) {
    const cached = await db
      .select()
      .from(aiPeriodReports)
      .where(
        and(
          eq(aiPeriodReports.userId, authResult.userId),
          eq(aiPeriodReports.periodType, parsed.data),
          eq(aiPeriodReports.periodEndDate, summary.periodEndDate)
        )
      )
      .limit(1);

    if (cached[0]) {
      return NextResponse.json({ cached: true, result: cached[0].result });
    }
  }

  if (!isGeminiConfigured()) {
    return NextResponse.json(
      {
        error:
          "AI機能は利用できません。Vercelの環境変数 GEMINI_API_KEY を設定してください。",
      },
      { status: 503 }
    );
  }

  try {
    const result = await generatePeriodReport(summary.text);

    const existing = await db
      .select({ id: aiPeriodReports.id })
      .from(aiPeriodReports)
      .where(
        and(
          eq(aiPeriodReports.userId, authResult.userId),
          eq(aiPeriodReports.periodType, parsed.data),
          eq(aiPeriodReports.periodEndDate, summary.periodEndDate)
        )
      )
      .limit(1);

    if (existing[0]) {
      await db
        .update(aiPeriodReports)
        .set({ result, createdAt: new Date() })
        .where(eq(aiPeriodReports.id, existing[0].id));
    } else {
      await db.insert(aiPeriodReports).values({
        userId: authResult.userId,
        periodType: parsed.data,
        periodEndDate: summary.periodEndDate,
        result,
      });
    }

    return NextResponse.json({ cached: false, result, periodType: parsed.data });
  } catch (e) {
    console.error("ai/analyze-period", e);
    return NextResponse.json(
      {
        error:
          "期間分析に失敗しました。GEMINI_API_KEY を確認するか、再試行してください。",
      },
      { status: 500 }
    );
  }
}
