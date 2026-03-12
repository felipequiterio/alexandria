import { sql, eq, and } from "drizzle-orm";
import { db } from "../../db";
import { documentChunks, documentSections, documents } from "../../db/schema";
import { getOpenAIClient } from "../ai/provider";
import { env } from "../../lib/env";
import type { SearchResult } from "@alexandria/shared";

interface SearchOptions {
  documentId?: string;
  topK?: number;
  threshold?: number;
}

export async function embedQuery(query: string): Promise<number[]> {
  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: env.AI_EMBEDDING_MODEL,
    input: query,
  });
  return response.data[0].embedding;
}

export async function searchDocumentChunks(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { documentId, topK = 5, threshold = 0.3 } = options;

  const queryEmbedding = await embedQuery(query);
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

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
      documentId: documentChunks.documentId,
      documentTitle: documents.title,
    })
    .from(documentChunks)
    .leftJoin(documentSections, eq(documentChunks.sectionId, documentSections.id))
    .innerJoin(documents, eq(documentChunks.documentId, documents.id))
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
      documentId: r.documentId,
      documentTitle: r.documentTitle,
    }));
}
