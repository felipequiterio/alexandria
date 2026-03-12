import type { Document } from "./document";

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
