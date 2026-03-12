export type MessageRole = "user" | "assistant";

export interface Conversation {
  id: string;
  documentId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  selectedText: string | null;
  selectionLocation: { page: number; start: number; end: number } | null;
  contextChunkIds: string[];
  modelUsed: string | null;
  tokenUsage: { prompt: number; completion: number } | null;
  createdAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// Agent activity types for frontend display
export interface AgentActivityItem {
  toolName: string;
  args?: Record<string, any>;
  resultPreview?: string;
  status: "running" | "completed";
}

/** A passage retrieved by RAG that Atlas used to answer. */
export interface SourcePassage {
  content: string;
  pageNumber: number;
}

export type AgentEvent =
  | { type: "delta"; content: string }
  | { type: "sources"; passages: SourcePassage[] }
  | { type: "tool_start"; toolName: string; args: Record<string, any> }
  | { type: "tool_end"; toolName: string; resultPreview: string }
  | { type: "status"; message: string }
  | { type: "done"; status: string; usage?: { prompt: number; completion: number } }
  | { type: "error"; error: string };
