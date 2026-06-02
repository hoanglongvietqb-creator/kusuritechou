import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  deleteResetToken,
  findUserByResetToken,
} from "@/lib/password-reset";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力が無効です" }, { status: 400 });
    }

    const match = await findUserByResetToken(parsed.data.token);
    if (!match) {
      return NextResponse.json(
        { error: "リンクが無効または期限切れです" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, match.userId));

    await deleteResetToken(match.tokenId);

    return NextResponse.json({ message: "パスワードを更新しました" });
  } catch (e) {
    console.error("reset-password", e);
    return NextResponse.json(
      { error: "更新に失敗しました" },
      { status: 500 }
    );
  }
}
