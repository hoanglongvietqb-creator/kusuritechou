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
