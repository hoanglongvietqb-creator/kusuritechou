import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力が無効です" }, { status: 400 });
    }

    const { email, password, name } = parsed.data;

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "このメールは既に登録されています" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.insert(users).values({
      email,
      passwordHash,
      name: name ?? email.split("@")[0],
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
  }
}
