import { eq, isNull, and } from "drizzle-orm";
import { db } from "../../db";
import { documentChunks } from "../../db/schema";
import { getOpenAIClient } from "../ai/provider";
import { env } from "../../lib/env";

const BATCH_SIZE = 100;

export async function embedChunks(documentId: string): Promise<void> {
  const openai = getOpenAIClient();

  // Fetch all chunks without embeddings for this document
  const chunks = await db.query.documentChunks.findMany({
    where: and(
      eq(documentChunks.documentId, documentId),
      isNull(documentChunks.embedding),
    ),
    orderBy: (c, { asc }) => [asc(c.chunkIndex)],
  });

  if (chunks.length === 0) return;

  // Process in batches
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => c.content);

    const response = await openai.embeddings.create({
      model: env.AI_EMBEDDING_MODEL,
      input: texts,
    });

    // Update each chunk with its embedding
    for (let j = 0; j < batch.length; j++) {
      const embedding = response.data[j].embedding;
      await db
        .update(documentChunks)
        .set({ embedding })
        .where(eq(documentChunks.id, batch[j].id));
    }
  }
}
