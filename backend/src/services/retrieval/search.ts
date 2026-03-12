import { sql, eq, and } from "drizzle-orm";
import { db } from "../../db";
import { documentChunks, documentSections } from "../../db/schema";
import { getOpenAIClient } from "../ai/provider";
import type { SearchResult } from "@alexandria/shared";

const EMBEDDING_MODEL = "openai/text-embedding-3-small";

interface SearchOptions {
  documentId?: string;
  topK?: number;
  threshold?: number;
}

export async function searchDocumentChunks(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { documentId, topK = 5, threshold = 0.3 } = options;

  const openai = getOpenAIClient();

  // Embed the query
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  });
  const queryEmbedding = response.data[0].embedding;
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  // Build the query with cosine similarity
  const conditions = [
    sql`${documentChunks.embedding} IS NOT NULL`,
  ];

  if (documentId) {
    conditions.push(eq(documentChunks.documentId, documentId));
  }

  const results = await db
    .select({
      chunkId: documentChunks.id,
      content: documentChunks.content,
      pageNumber: documentChunks.pageNumber,
      score: sql<number>`1 - (${documentChunks.embedding} <=> ${embeddingStr}::vector)`.as("score"),
      sectionHeading: documentSections.heading,
    })
    .from(documentChunks)
    .leftJoin(documentSections, eq(documentChunks.sectionId, documentSections.id))
    .where(and(...conditions))
    .orderBy(sql`${documentChunks.embedding} <=> ${embeddingStr}::vector`)
    .limit(topK);

  return results
    .filter((r) => r.score >= threshold)
    .map((r) => ({
      chunkId: r.chunkId,
      content: r.content,
      pageNumber: r.pageNumber,
      score: r.score,
      sectionHeading: r.sectionHeading,
    }));
}
