import { sql, eq, and } from "drizzle-orm";
import { db } from "../../db";
import { documentChunks, documentSections, documents } from "../../db/schema";
import type { SearchResult } from "@alexandria/shared";

interface FullTextSearchOptions {
  documentId?: string;
  topK?: number;
}

export async function fullTextSearch(
  query: string,
  options: FullTextSearchOptions = {}
): Promise<SearchResult[]> {
  const { documentId, topK = 10 } = options;

  // Convert query to tsquery format — plainto_tsquery handles natural language
  const conditions = [
    sql`to_tsvector('english', ${documentChunks.content}) @@ plainto_tsquery('english', ${query})`,
  ];

  if (documentId) {
    conditions.push(eq(documentChunks.documentId, documentId));
  }

  const results = await db
    .select({
      chunkId: documentChunks.id,
      content: documentChunks.content,
      pageNumber: documentChunks.pageNumber,
      score: sql<number>`ts_rank(to_tsvector('english', ${documentChunks.content}), plainto_tsquery('english', ${query}))`.as("score"),
      sectionHeading: documentSections.heading,
      documentId: documentChunks.documentId,
      documentTitle: documents.title,
    })
    .from(documentChunks)
    .leftJoin(documentSections, eq(documentChunks.sectionId, documentSections.id))
    .innerJoin(documents, eq(documentChunks.documentId, documents.id))
    .where(and(...conditions))
    .orderBy(sql`ts_rank(to_tsvector('english', ${documentChunks.content}), plainto_tsquery('english', ${query})) DESC`)
    .limit(topK);

  return results.map((r) => ({
    chunkId: r.chunkId,
    content: r.content,
    pageNumber: r.pageNumber,
    score: r.score,
    sectionHeading: r.sectionHeading,
    documentId: r.documentId,
    documentTitle: r.documentTitle,
  }));
}
