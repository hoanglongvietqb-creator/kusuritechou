import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getMealHistory } from "@/lib/meal-stats";

export async function GET(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") === "month" ? "month" : "week";

  const history = await getMealHistory(authResult.userId, range);
  return NextResponse.json(history);
}
