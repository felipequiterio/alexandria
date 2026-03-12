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
