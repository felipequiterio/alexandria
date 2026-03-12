import { Type } from "@sinclair/typebox";
import type { Tool } from "@mariozechner/pi-ai";

export const searchLibraryTool: Tool = {
  name: "search_library",
  description:
    "Search across ALL documents in the library using semantic vector search. Use this when the user asks about topics that may span multiple documents, or when you need to find relevant information library-wide.",
  parameters: Type.Object({
    query: Type.String({ description: "The search query" }),
    top_k: Type.Optional(Type.Number({ description: "Number of results (default 8)", minimum: 1, maximum: 20 })),
    doc_filter: Type.Optional(Type.String({ description: "Optional document ID to restrict search to" })),
  }),
};

export const searchDocumentTool: Tool = {
  name: "search_document",
  description:
    "Search within a specific document using semantic vector search. Use this when the user's question is about the current document or a specific known document.",
  parameters: Type.Object({
    document_id: Type.String({ description: "The document ID to search within" }),
    query: Type.String({ description: "The search query" }),
    top_k: Type.Optional(Type.Number({ description: "Number of results (default 5)", minimum: 1, maximum: 20 })),
  }),
};

export const fullTextSearchTool: Tool = {
  name: "full_text_search",
  description:
    "Exact keyword/phrase search across documents using PostgreSQL full-text search. Use this when looking for specific terms, names, or exact phrases that semantic search might miss.",
  parameters: Type.Object({
    query: Type.String({ description: "The keyword or phrase to search for" }),
    document_id: Type.Optional(Type.String({ description: "Optional document ID to restrict search to" })),
  }),
};

export const readSectionTool: Tool = {
  name: "read_section",
  description:
    "Read a specific section of a document by heading name. Use this to get the full text of a section when you need more context than search snippets provide.",
  parameters: Type.Object({
    document_id: Type.String({ description: "The document ID" }),
    heading: Type.String({ description: "The section heading to find and read" }),
  }),
};

export const readPagesTool: Tool = {
  name: "read_pages",
  description:
    "Read specific pages from a document. Use this when you need the full content of particular pages, e.g. when the user references specific page numbers.",
  parameters: Type.Object({
    document_id: Type.String({ description: "The document ID" }),
    pages: Type.Array(Type.Number({ description: "Page number" }), { description: "Array of page numbers to read", minItems: 1, maxItems: 5 }),
  }),
};

export const getDocumentInfoTool: Tool = {
  name: "get_document_info",
  description:
    "Get metadata about a document: title, authors, type, page count, processing status. Use this to understand what a document is about before searching it.",
  parameters: Type.Object({
    document_id: Type.String({ description: "The document ID" }),
  }),
};

export const recallConversationsTool: Tool = {
  name: "recall_conversations",
  description:
    "Recall summaries of past conversations the user has had, optionally filtered by document or topic. Use this to reference prior discussions and provide continuity.",
  parameters: Type.Object({
    document_id: Type.Optional(Type.String({ description: "Optional document ID to filter by" })),
    topic: Type.Optional(Type.String({ description: "Optional topic to search for in conversation summaries" })),
  }),
};

export const checkFamiliarityTool: Tool = {
  name: "check_familiarity",
  description:
    "Check the user's estimated familiarity level with a topic based on past interactions. Returns familiarity level (novice to expert) to help calibrate response depth.",
  parameters: Type.Object({
    topic: Type.String({ description: "The topic to check familiarity with" }),
  }),
};

export const ATLAS_TOOLS: Tool[] = [
  searchLibraryTool,
  searchDocumentTool,
  fullTextSearchTool,
  readSectionTool,
  readPagesTool,
  getDocumentInfoTool,
  recallConversationsTool,
  checkFamiliarityTool,
];
