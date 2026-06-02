import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { foodPresets, userFoodItems } from "@/lib/db/schema";

export async function GET() {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const [globalPresets, customItems] = await Promise.all([
    db.select().from(foodPresets).orderBy(foodPresets.nameJa),
    db
      .select()
      .from(userFoodItems)
      .where(eq(userFoodItems.userId, authResult.userId))
      .orderBy(userFoodItems.nameJa),
  ]);

  const merged = [
    ...globalPresets.map((p) => ({
      id: p.id,
      nameJa: p.nameJa,
      calories: p.calories,
      category: p.category,
      kind: "food" as const,
      isCustom: false,
    })),
    ...customItems.map((p) => ({
      id: p.id,
      nameJa: p.nameJa,
      calories: p.calories,
      category: p.kind === "drink" ? "飲み物" : "自分のメニュー",
      kind: p.kind,
      isCustom: true,
    })),
  ];

  return NextResponse.json(merged);
}
