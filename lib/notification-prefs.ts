import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notificationPreferences } from "@/lib/db/schema";

export async function getOrCreateNotificationPreferences(userId: string) {
  const [existing] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(notificationPreferences)
    .values({ userId })
    .returning();

  return created;
}
