import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { foodPresets, nutritionArticles } from "../lib/db/schema";

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

const ARTICLES = [
  {
    slug: "water-basics",
    titleJa: "1日の水分摂取の目安",
    tags: ["水分", "基礎"],
    bodyMd:
      "成人はおおむね1.5〜2リットル/日が目安です。暑い日や運動時は増やしましょう。こまめな少量摂取がおすすめです。",
  },
  {
    slug: "med-with-food",
    titleJa: "服薬と食事のタイミング",
    tags: ["服薬", "食事"],
    bodyMd:
      "食前・食後・空腹時など薬によって適切なタイミングが異なります。お薬の説明書や薬剤師の指示に従い、同じ時間帯を心がけましょう。",
  },
  {
    slug: "office-lunch",
    titleJa: "デスクワーク向けの昼食",
    tags: ["食事", "オフィス"],
    bodyMd:
      "座り仕事が多い方は、野菜とたんぱく質を意識し、過度に油っこい食事を避けると午後の集中力維持に役立ちます。",
  },
  {
    slug: "calorie-balance",
    titleJa: "カロリーバランスの基本",
    tags: ["カロリー", "基礎"],
    bodyMd:
      "摂取カロリーと消費カロリーのバランスが体重維持の鍵です。極端な制限は避け、記録を続けることが大切です。",
  },
  {
    slug: "protein-intake",
    titleJa: "たんぱく質を意識する",
    tags: ["栄養", "食事"],
    bodyMd:
      "各食事にたんぱく質源（卵、魚、豆類、肉など）を少しずつ含めると、満腹感と筋肉の維持に役立ちます。",
  },
  {
    slug: "snack-tips",
    titleJa: "間食の選び方",
    tags: ["軽食", "カロリー"],
    bodyMd:
      "ナッツ、ヨーグルト、フルーツなど栄養密度の高い間食を選び、砂糖の多い菓子類は量を控えめに。",
  },
  {
    slug: "hydration-signs",
    titleJa: "脱水のサイン",
    tags: ["水分", "健康"],
    bodyMd:
      "口の渇き、尿の色が濃い、疲労感などは脱水のサインかもしれません。予防的にこまめに水分を取りましょう。",
  },
  {
    slug: "breakfast-importance",
    titleJa: "朝食を軽くでも",
    tags: ["食事", "朝"],
    bodyMd:
      "朝食を抜くと昼に過食しやすくなることがあります。時間がない日はバナナやヨーグルトなど手軽な選択肢も有効です。",
  },
  {
    slug: "fiber-vegetables",
    titleJa: "野菜と食物繊維",
    tags: ["野菜", "栄養"],
    bodyMd:
      "食物繊維は腸の調子を整え、満腹感にも寄与します。サラダやスープ、温野菜を毎日の食事に加えましょう。",
  },
  {
    slug: "caffeine-water",
    titleJa: "カフェインと水分",
    tags: ["飲料", "水分"],
    bodyMd:
      "コーヒーやお茶も水分補給になりますが、カフェインの利尿作用に注意。水や麦茶とのバランスがおすすめです。",
  },
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

  console.log("Seeding nutrition articles...");
  const existingArticles = await db
    .select({ id: nutritionArticles.id })
    .from(nutritionArticles)
    .limit(1);
  if (existingArticles.length === 0) {
    await db.insert(nutritionArticles).values(ARTICLES);
  } else {
    console.log("Articles already exist, skipping.");
  }

  console.log("Done.");
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
