import { getModel } from "@mariozechner/pi-ai";
import OpenAI from "openai";
import { env } from "../../lib/env";

// OpenAI-compatible client via OpenRouter for embeddings
export function getOpenAIClient(): OpenAI {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is required — set it in .env");
  }
  return new OpenAI({
    apiKey: env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });
}

// pi-ai model for chat via OpenRouter
export function getChatModel() {
  return getModel("openrouter", env.AI_CHAT_MODEL as any);
}
