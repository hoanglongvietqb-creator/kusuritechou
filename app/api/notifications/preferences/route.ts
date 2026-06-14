import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { getOrCreateNotificationPreferences } from "@/lib/notification-prefs";
import { db } from "@/lib/db";
import { notificationPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const patchSchema = z.object({
  emailReminders: z.boolean().optional(),
  pushReminders: z.boolean().optional(),
  preDoseEnabled: z.boolean().optional(),
  overdueEnabled: z.boolean().optional(),
  quietHoursStart: z.string().nullable().optional(),
  quietHoursEnd: z.string().nullable().optional(),
});

export async function GET() {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const prefs = await getOrCreateNotificationPreferences(authResult.userId);
  return NextResponse.json(prefs);
}

export async function PATCH(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力が無効です" }, { status: 400 });
  }

  await getOrCreateNotificationPreferences(authResult.userId);

  const [updated] = await db
    .update(notificationPreferences)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(notificationPreferences.userId, authResult.userId))
    .returning();

  return NextResponse.json(updated);
}
