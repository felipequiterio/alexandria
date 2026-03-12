import type {
  Document,
  UploadResponse,
  DocumentListResponse,
  Conversation,
  ConversationListResponse,
  ConversationResponse,
  Highlight,
  HighlightListResponse,
  SearchResponse,
  AgentEvent,
} from "@alexandria/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
  return res.json();
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  return fetchApi<UploadResponse>("/documents/upload", {
    method: "POST",
    body: form,
  });
}

export async function listDocuments(): Promise<DocumentListResponse> {
  return fetchApi<DocumentListResponse>("/documents");
}

export async function getDocument(id: string): Promise<Document> {
  return fetchApi<Document>(`/documents/${id}`);
}

export async function deleteDocument(id: string): Promise<void> {
  await fetchApi(`/documents/${id}`, { method: "DELETE" });
}

export function getDocumentFileUrl(id: string): string {
  return `${API_BASE}/documents/${id}/file`;
}

// Chat API

export async function createConversation(
  documentId: string,
  title?: string
): Promise<Conversation> {
  const res = await fetchApi<{ conversation: Conversation }>(
    `/documents/${documentId}/conversations`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }
  );
  return res.conversation;
}

export async function createLibraryConversation(
  title?: string
): Promise<Conversation> {
  const res = await fetchApi<{ conversation: Conversation }>(
    `/conversations`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }
  );
  return res.conversation;
}

export async function listConversations(
  documentId: string
): Promise<Conversation[]> {
  const res = await fetchApi<ConversationListResponse>(
    `/documents/${documentId}/conversations`
  );
  return res.conversations;
}

export async function listLibraryConversations(): Promise<Conversation[]> {
  const res = await fetchApi<ConversationListResponse>(`/conversations`);
  return res.conversations;
}

export async function getConversation(conversationId: string): Promise<ConversationResponse> {
  return fetchApi<ConversationResponse>(`/conversations/${conversationId}`);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  await fetchApi(`/conversations/${conversationId}`, { method: "DELETE" });
}

export async function* streamChatMessage(
  conversationId: string,
  content: string,
  options?: {
    selectedText?: string;
    selectionLocation?: { page: number; start: number; end: number };
  }
): AsyncGenerator<AgentEvent, void, unknown> {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content,
      selectedText: options?.selectedText,
      selectionLocation: options?.selectionLocation,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    let currentEvent = "";
    for (const line of lines) {
      if (line.startsWith("event:")) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        const data = line.slice(5).trim();
        if (!data) continue;
        try {
          const parsed = JSON.parse(data);
          switch (currentEvent) {
            case "delta":
              yield { type: "delta", content: parsed.content };
              break;
            case "sources":
              yield { type: "sources", passages: parsed.passages };
              break;
            case "tool_start":
              yield { type: "tool_start", toolName: parsed.toolName, args: parsed.args };
              break;
            case "tool_end":
              yield { type: "tool_end", toolName: parsed.toolName, resultPreview: parsed.resultPreview };
              break;
            case "status":
              yield { type: "status", message: parsed.message };
              break;
            case "done":
              yield { type: "done", status: parsed.status, usage: parsed.usage };
              break;
            case "error":
              yield { type: "error", error: parsed.error };
              break;
            default:
              // Legacy fallback: treat as delta if it has content
              if (parsed.content) {
                yield { type: "delta", content: parsed.content };
              }
              break;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }
}

// Search API

export async function searchLibrary(
  query: string,
  options?: { mode?: "vector" | "text" | "hybrid"; documentId?: string; topK?: number }
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query });
  if (options?.mode) params.set("mode", options.mode);
  if (options?.documentId) params.set("documentId", options.documentId);
  if (options?.topK) params.set("topK", String(options.topK));
  return fetchApi<SearchResponse>(`/search?${params}`);
}

// Highlights API

export async function createHighlight(data: {
  documentId: string;
  content: string;
  pageNumber: number;
  positionStart: number;
  positionEnd: number;
  color?: string;
  note?: string;
}): Promise<Highlight> {
  const res = await fetchApi<{ highlight: Highlight }>(
    `/documents/${data.documentId}/highlights`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  return res.highlight;
}

export async function listHighlights(documentId: string): Promise<Highlight[]> {
  const res = await fetchApi<HighlightListResponse>(
    `/documents/${documentId}/highlights`
  );
  return res.highlights;
}

export async function updateHighlight(
  id: string,
  data: { color?: string; note?: string }
): Promise<Highlight> {
  const res = await fetchApi<{ highlight: Highlight }>(`/highlights/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.highlight;
}

export async function deleteHighlight(id: string): Promise<void> {
  await fetchApi(`/highlights/${id}`, { method: "DELETE" });
}
