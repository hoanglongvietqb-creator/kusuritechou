import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { userFoodItems } from "@/lib/db/schema";

export function normalizeMealName(name: string): string {
  return name.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
}

export async function upsertUserFoodItem(
  userId: string,
  nameJa: string,
  calories: number,
  kind: "food" | "drink" = "food"
) {
  const normalizedName = normalizeMealName(nameJa);

  const [existing] = await db
    .select()
    .from(userFoodItems)
    .where(
      and(
        eq(userFoodItems.userId, userId),
        or(
          eq(userFoodItems.normalizedName, normalizedName),
          eq(userFoodItems.nameJa, nameJa)
        )
      )
    )
    .limit(1);

  if (existing) {
    const avgCalories = Math.round((existing.calories + calories) / 2);
    const [updated] = await db
      .update(userFoodItems)
      .set({
        nameJa,
        normalizedName,
        calories: avgCalories,
      })
      .where(eq(userFoodItems.id, existing.id))
      .returning();
    return { item: updated, created: false };
  }

  const [created] = await db
    .insert(userFoodItems)
    .values({
      userId,
      nameJa,
      normalizedName,
      calories,
      kind,
    })
    .returning();

  return { item: created, created: true };
}
