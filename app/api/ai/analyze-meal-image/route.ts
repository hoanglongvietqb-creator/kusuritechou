import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { analyzeMealImage, isGeminiConfigured } from "@/lib/gemini";
import { checkPhotoRateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

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
    return NextResponse.json({ error: "画像は4MB以下にしてください" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mimeType = file.type || "image/jpeg";

  try {
    const result = await analyzeMealImage(base64, mimeType);
    return NextResponse.json(result);
  } catch (e) {
    console.error("analyze-meal-image", e);
    return NextResponse.json(
      { error: "画像の分析に失敗しました。しばらくして再試行してください。" },
      { status: 500 }
    );
  }
}
