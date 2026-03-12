import { eq, ilike } from "drizzle-orm";
import { db } from "../../../db";
import { documents, documentSections, documentChunks } from "../../../db/schema";
import { searchDocumentChunks } from "../../retrieval/search";
import { fullTextSearch } from "../../retrieval/full-text-search";
import type { SearchResult } from "@alexandria/shared";

function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return "No results found.";
  return results
    .map(
      (r, i) =>
        `[${i + 1}] "${r.documentTitle}" [p.${r.pageNumber}] (score: ${r.score.toFixed(3)})\n${r.content.slice(0, 500)}${r.content.length > 500 ? "..." : ""}`
    )
    .join("\n\n---\n\n");
}

export async function executeSearchLibrary(args: {
  query: string;
  top_k?: number;
  doc_filter?: string;
}): Promise<string> {
  const results = await searchDocumentChunks(args.query, {
    documentId: args.doc_filter,
    topK: args.top_k || 8,
  });
  return formatSearchResults(results);
}

export async function executeSearchDocument(args: {
  document_id: string;
  query: string;
  top_k?: number;
}): Promise<string> {
  const results = await searchDocumentChunks(args.query, {
    documentId: args.document_id,
    topK: args.top_k || 5,
  });
  return formatSearchResults(results);
}

export async function executeFullTextSearch(args: {
  query: string;
  document_id?: string;
}): Promise<string> {
  const results = await fullTextSearch(args.query, {
    documentId: args.document_id,
    topK: 10,
  });
  return formatSearchResults(results);
}

export async function executeReadSection(args: {
  document_id: string;
  heading: string;
}): Promise<string> {
  const sections = await db.query.documentSections.findMany({
    where: eq(documentSections.documentId, args.document_id),
  });

  // Find best matching section by heading (case-insensitive partial match)
  const match = sections.find(
    (s) => s.heading && s.heading.toLowerCase().includes(args.heading.toLowerCase())
  );

  if (!match) {
    const headings = sections
      .filter((s) => s.heading)
      .map((s) => s.heading)
      .join(", ");
    return `Section "${args.heading}" not found. Available sections: ${headings || "none (document may not have structured sections)"}`;
  }

  return `## ${match.heading}\n[p.${match.pageNumber}]\n\n${match.content}`;
}

export async function executeReadPages(args: {
  document_id: string;
  pages: number[];
}): Promise<string> {
  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, args.document_id),
    columns: { rawText: true, pageCount: true, title: true },
  });

  if (!doc || !doc.rawText) {
    return "Document not found or has no text content.";
  }

  // Estimate page boundaries by splitting text evenly
  const totalChars = doc.rawText.length;
  const charsPerPage = Math.ceil(totalChars / Math.max(doc.pageCount, 1));

  const pageTexts: string[] = [];
  for (const page of args.pages) {
    if (page < 1 || page > doc.pageCount) {
      pageTexts.push(`[p.${page}] Page out of range (document has ${doc.pageCount} pages).`);
      continue;
    }
    const start = (page - 1) * charsPerPage;
    const end = Math.min(page * charsPerPage, totalChars);
    const text = doc.rawText.slice(start, end);
    pageTexts.push(`[p.${page}]\n${text}`);
  }

  return `"${doc.title}"\n\n${pageTexts.join("\n\n---\n\n")}`;
}

export async function executeGetDocumentInfo(args: {
  document_id: string;
}): Promise<string> {
  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, args.document_id),
    columns: {
      id: true,
      title: true,
      authors: true,
      type: true,
      pageCount: true,
      language: true,
      processingStatus: true,
      uploadDate: true,
    },
  });

  if (!doc) return "Document not found.";

  return [
    `Title: ${doc.title}`,
    `Authors: ${doc.authors.length > 0 ? doc.authors.join(", ") : "Unknown"}`,
    `Type: ${doc.type}`,
    `Pages: ${doc.pageCount}`,
    `Language: ${doc.language}`,
    `Status: ${doc.processingStatus}`,
    `Uploaded: ${doc.uploadDate.toISOString().split("T")[0]}`,
  ].join("\n");
}

export async function executeRecallConversations(args: {
  document_id?: string;
  topic?: string;
}): Promise<string> {
  const { getConversationSummaries } = await import("../../memory/summary.service");
  const summaries = await getConversationSummaries(args.document_id);

  if (summaries.length === 0) {
    return "No conversation history available yet.";
  }

  // Filter by topic if provided
  let filtered = summaries;
  if (args.topic) {
    const topicLower = args.topic.toLowerCase();
    filtered = summaries.filter(
      (s) =>
        s.summary.toLowerCase().includes(topicLower) ||
        s.keyTopics.some((t) => t.toLowerCase().includes(topicLower))
    );
    if (filtered.length === 0) {
      return `No conversations found about "${args.topic}". Available topics: ${summaries.flatMap((s) => s.keyTopics).join(", ")}`;
    }
  }

  return filtered
    .map(
      (s, i) =>
        `[${i + 1}] ${s.summary}\nTopics: ${s.keyTopics.join(", ")}\nInsights: ${s.keyInsights.join("; ")}`
    )
    .join("\n\n---\n\n");
}

export async function executeCheckFamiliarity(args: {
  topic: string;
}): Promise<string> {
  const { getTopicFamiliarity } = await import("../../memory/familiarity.service");
  const familiarity = await getTopicFamiliarity(args.topic);

  if (!familiarity) {
    return `No familiarity data available for "${args.topic}". Assume intermediate level and adjust based on the user's questions.`;
  }

  return `Topic: ${familiarity.topic}\nFamiliarity: ${familiarity.level} (confidence: ${familiarity.confidence}%)`;
}
