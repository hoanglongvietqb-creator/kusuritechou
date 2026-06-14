import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { getVapidPublicKey } from "@/lib/push";

export async function GET() {
  return NextResponse.json({
    publicKey: getVapidPublicKey(),
  });
}

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力が無効です" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, parsed.data.endpoint))
    .limit(1);

  if (existing[0]) {
    const [updated] = await db
      .update(pushSubscriptions)
      .set({
        userId: authResult.userId,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
      })
      .where(eq(pushSubscriptions.id, existing[0].id))
      .returning();
    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(pushSubscriptions)
    .values({
      userId: authResult.userId,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const body = await req.json().catch(() => ({}));
  const endpoint = (body as { endpoint?: string }).endpoint;

  if (endpoint) {
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
  } else {
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, authResult.userId));
  }

  return NextResponse.json({ ok: true });
}
