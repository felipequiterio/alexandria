import type {
  Document,
  UploadResponse,
  DocumentListResponse,
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
