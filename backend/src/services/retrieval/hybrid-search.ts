import { searchDocumentChunks } from "./search";
import { fullTextSearch } from "./full-text-search";
import type { SearchResult } from "@alexandria/shared";

interface HybridSearchOptions {
  documentId?: string;
  topK?: number;
  mode?: "vector" | "text" | "hybrid";
}

/**
 * Reciprocal Rank Fusion: score = Σ 1/(k + rank_i)
 * k=60 is the standard constant from the RRF paper.
 */
function reciprocalRankFusion(
  resultSets: SearchResult[][],
  topK: number,
  k = 60
): SearchResult[] {
  const scoreMap = new Map<string, { score: number; result: SearchResult }>();

  for (const results of resultSets) {
    for (let rank = 0; rank < results.length; rank++) {
      const r = results[rank];
      const rrfScore = 1 / (k + rank + 1);
      const existing = scoreMap.get(r.chunkId);
      if (existing) {
        existing.score += rrfScore;
      } else {
        scoreMap.set(r.chunkId, { score: rrfScore, result: r });
      }
    }
  }

  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((entry) => ({ ...entry.result, score: entry.score }));
}

export async function hybridSearch(
  query: string,
  options: HybridSearchOptions = {}
): Promise<SearchResult[]> {
  const { documentId, topK = 10, mode = "hybrid" } = options;

  if (mode === "vector") {
    return searchDocumentChunks(query, { documentId, topK });
  }

  if (mode === "text") {
    return fullTextSearch(query, { documentId, topK });
  }

  // Hybrid: run both in parallel, merge with RRF
  const [vectorResults, textResults] = await Promise.all([
    searchDocumentChunks(query, { documentId, topK: topK * 2 }),
    fullTextSearch(query, { documentId, topK: topK * 2 }),
  ]);

  return reciprocalRankFusion([vectorResults, textResults], topK);
}
