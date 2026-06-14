import "server-only";
import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY?.trim();
}

export async function generateText(prompt: string, systemInstruction?: string) {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });
    const text = response.text ?? "";
    if (!text.trim()) {
      throw new Error("Empty response from Gemini");
    }
    return text;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Gemini API error";
    if (message.includes("API key") || message.includes("GEMINI")) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    throw new Error(`Gemini: ${message}`);
  }
}

export async function streamText(
  prompt: string,
  systemInstruction?: string
): Promise<AsyncIterable<string>> {
  const ai = getClient();
  const stream = await ai.models.generateContentStream({
    model: getGeminiModel(),
    contents: prompt,
    config: systemInstruction ? { systemInstruction } : undefined,
  });

  async function* chunks() {
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) yield text;
    }
  }

  return chunks();
}

export type MealImageAnalysis = {
  nameJa: string;
  calories: number;
  notes?: string;
};

const MEAL_VISION_SYSTEM = `あなたは栄養アシスタントです。食事の写真から日本語で推定してください。
JSONのみを返すこと:
{"nameJa": "料理名", "calories": 数値kcal, "notes": "分量の目安など短いメモ"}
caloriesは整数。不明な場合は一般的な1人前で推定。`;

export async function analyzeMealImage(
  base64: string,
  mimeType: string
): Promise<MealImageAnalysis> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64 } },
          {
            text: "この食事の名前（日本語）と推定カロリー（kcal）をJSONで返してください。",
          },
        ],
      },
    ],
    config: { systemInstruction: MEAL_VISION_SYSTEM },
  });

  const raw = response.text ?? "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid JSON from vision model");

  const parsed = JSON.parse(jsonMatch[0]) as MealImageAnalysis;
  if (!parsed.nameJa || !parsed.calories) {
    throw new Error("Invalid meal analysis shape");
  }
  return {
    nameJa: parsed.nameJa,
    calories: Math.round(parsed.calories),
    notes: parsed.notes,
  };
}
