import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { nutritionArticles } from "@/lib/db/schema";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const [article] = await db
    .select()
    .from(nutritionArticles)
    .where(eq(nutritionArticles.slug, slug))
    .limit(1);

  if (!article) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }

  return NextResponse.json(article);
}
