import type { Document } from "./document";
import type { Conversation, Message } from "./conversation";
import type { Highlight } from "./highlight";

export interface UploadResponse {
  document: Document;
  message: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}

export interface ConversationListResponse {
  conversations: Conversation[];
}

export interface ConversationResponse {
  conversation: Conversation;
  messages: Message[];
}

export interface HighlightListResponse {
  highlights: Highlight[];
}

export interface SearchResult {
  chunkId: string;
  content: string;
  pageNumber: number;
  score: number;
  sectionHeading: string | null;
}
