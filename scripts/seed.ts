import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { foodPresets } from "../lib/db/schema";

const PRESETS = [
  { nameJa: "コムタム焼き豚", calories: 650, category: "主食" },
  { nameJa: "フォー牛", calories: 450, category: "主食" },
  { nameJa: "バインミー", calories: 380, category: "主食" },
  { nameJa: "ブン cha", calories: 520, category: "主食" },
  { nameJa: "ヨーグルト", calories: 120, category: "軽食" },
  { nameJa: "サラダ", calories: 80, category: "野菜" },
  { nameJa: "春巻き", calories: 180, category: "軽食" },
  { nameJa: "ゴイクン", calories: 90, category: "野菜" },
  { nameJa: "バンフーコング", calories: 480, category: "主食" },
  { nameJa: "カオマンガイ", calories: 550, category: "主食" },
  { nameJa: "チao tom", calories: 200, category: "軽食" },
  { nameJa: "コーヒー牛乳", calories: 90, category: "飲料" },
  { nameJa: "スムージー", calories: 150, category: "飲料" },
  { nameJa: "白米（茶碗1杯）", calories: 250, category: "主食" },
  { nameJa: "味噌汁", calories: 40, category: "汁物" },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");

  const client = postgres(url, { prepare: false });
  const db = drizzle(client);

  console.log("Seeding food presets...");
  const existing = await db.select({ id: foodPresets.id }).from(foodPresets).limit(1);
  if (existing.length === 0) {
    await db.insert(foodPresets).values(PRESETS);
  } else {
    console.log("Presets already exist, skipping.");
  }

  console.log("Done.");
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
