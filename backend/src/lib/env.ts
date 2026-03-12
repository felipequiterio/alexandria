import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("postgres://alexandria:alexandria@localhost:5433/alexandria"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  UPLOAD_DIR: z.string().default("./uploads"),
  PORT: z.coerce.number().default(3001),
  OPENROUTER_API_KEY: z.string().optional(),
  AI_CHAT_MODEL: z.string().default("google/gemini-2.5-flash"),
  AI_EMBEDDING_MODEL: z.string().default("openai/text-embedding-3-small"),
});

export const env = envSchema.parse(process.env);
