import type {
  Document,
  UploadResponse,
  DocumentListResponse,
  Conversation,
  ConversationListResponse,
  ConversationResponse,
  Highlight,
  HighlightListResponse,
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

export async function listConversations(
  documentId: string
): Promise<Conversation[]> {
  const res = await fetchApi<ConversationListResponse>(
    `/documents/${documentId}/conversations`
  );
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
): AsyncGenerator<string, void, unknown> {
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

    for (const line of lines) {
      if (line.startsWith("data:")) {
        const data = line.slice(5).trim();
        if (!data) continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            yield parsed.content;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }
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
