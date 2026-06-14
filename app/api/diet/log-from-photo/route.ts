import { NextResponse } from "next/server";
import { and, eq, gte, lt } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { mealLogs } from "@/lib/db/schema";
import { analyzeMealImage, isGeminiConfigured } from "@/lib/gemini";
import { upsertUserFoodItem } from "@/lib/meal-master";
import { checkPhotoRateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 4 * 1024 * 1024;

const jsonSchema = z.object({
  nameJa: z.string().min(1).max(100),
  calories: z.number().int().positive().max(10000),
});

function getTodayBounds() {
  const dateStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Tokyo",
  });
  const start = new Date(`${dateStr}T00:00:00+09:00`);
  const end = new Date(`${dateStr}T23:59:59.999+09:00`);
  return { start, end };
}

async function logFromAnalysis(
  userId: string,
  nameJa: string,
  calories: number
) {
  const { item: masterItem, created: createdMaster } = await upsertUserFoodItem(
    userId,
    nameJa,
    calories
  );

  const [log] = await db
    .insert(mealLogs)
    .values({
      userId,
      name: nameJa,
      calories,
      userFoodItemId: masterItem.id,
      source: "photo",
      loggedAt: new Date(),
    })
    .returning();

  const { start, end } = getTodayBounds();
  const todayLogs = await db
    .select()
    .from(mealLogs)
    .where(
      and(
        eq(mealLogs.userId, userId),
        gte(mealLogs.loggedAt, start),
        lt(mealLogs.loggedAt, end)
      )
    );

  const todayTotal = todayLogs.reduce((s, l) => s + l.calories, 0);

  return { log, masterItem, createdMaster, todayTotal };
}

export async function POST(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const rate = checkPhotoRateLimit(authResult.userId);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "1時間あたりの写真分析上限に達しました" },
        { status: 429 }
      );
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: "AI機能は利用できません（APIキー未設定）" },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "画像が必要です" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "画像は4MB以下にしてください" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    try {
      const analysis = await analyzeMealImage(base64, mimeType);
      const result = await logFromAnalysis(
        authResult.userId,
        analysis.nameJa,
        analysis.calories
      );
      return NextResponse.json({ analysis, ...result }, { status: 201 });
    } catch (e) {
      console.error("log-from-photo", e);
      return NextResponse.json(
        { error: "画像の分析に失敗しました。しばらくして再試行してください。" },
        { status: 500 }
      );
    }
  }

  const body = await req.json();
  const parsed = jsonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力が無効です" }, { status: 400 });
  }

  const result = await logFromAnalysis(
    authResult.userId,
    parsed.data.nameJa,
    parsed.data.calories
  );
  return NextResponse.json(result, { status: 201 });
}
