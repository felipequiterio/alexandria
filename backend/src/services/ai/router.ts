const AGENTIC_KEYWORDS = [
  "compare",
  "across",
  "other papers",
  "other documents",
  "other books",
  "library",
  "find similar",
  "how does this relate",
  "cited",
  "citation",
  "reference",
  "contrast with",
  "similar to",
  "different from",
  "what have i read",
  "all my documents",
  "everything i",
  "summarize my",
  "related to",
];

export type QueryMode = "simple" | "agentic";

export function classifyQuery(
  content: string,
  hasSelection: boolean,
  documentId: string | null
): QueryMode {
  // Library-wide conversations are always agentic
  if (!documentId) return "agentic";

  const lower = content.toLowerCase();

  // Check for agentic keywords
  for (const keyword of AGENTIC_KEYWORDS) {
    if (lower.includes(keyword)) return "agentic";
  }

  // Short question with selection and no cross-doc intent → simple RAG
  if (hasSelection && content.length < 200) return "simple";

  // Longer questions or multi-part questions → agentic
  if (content.includes("?") && content.split("?").length > 2) return "agentic";

  // Default: simple for single-document context
  return "simple";
}
