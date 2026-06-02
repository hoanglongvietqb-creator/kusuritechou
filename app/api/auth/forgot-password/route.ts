import { NextResponse } from "next/server";
import { z } from "zod";
import { checkForgotRateLimit } from "@/lib/auth-rate-limit";
import { isEmailConfigured, sendPasswordResetEmail } from "@/lib/email";
import {
  createPasswordResetToken,
  findUserByEmail,
} from "@/lib/password-reset";

const schema = z.object({
  email: z.string().email(),
});

const SUCCESS_MSG = "メールを送信しました。受信トレイをご確認ください。";

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力が無効です" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    if (!checkForgotRateLimit(`${ip}:${email}`)) {
      return NextResponse.json(
        { error: "リクエストが多すぎます。しばらくして再試行してください。" },
        { status: 429 }
      );
    }

    if (!isEmailConfigured()) {
      console.error("SMTP not configured");
      return NextResponse.json(
        { error: "メール送信機能は現在利用できません" },
        { status: 503 }
      );
    }

    const user = await findUserByEmail(email);
    if (user?.passwordHash) {
      const token = await createPasswordResetToken(user.id);
      await sendPasswordResetEmail(user.email, token);
    }

    return NextResponse.json({ message: SUCCESS_MSG });
  } catch (e) {
    console.error("forgot-password", e);
    return NextResponse.json(
      { error: "送信に失敗しました。しばらくして再試行してください。" },
      { status: 500 }
    );
  }
}
