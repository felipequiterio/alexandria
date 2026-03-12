import { z } from "zod";

export const DocumentType = z.enum(["paper", "book", "article", "note", "other"]);
export type DocumentType = z.infer<typeof DocumentType>;

export const ProcessingStatus = z.enum(["pending", "processing", "completed", "failed"]);
export type ProcessingStatus = z.infer<typeof ProcessingStatus>;

export const SectionType = z.enum([
  "title",
  "abstract",
  "heading",
  "paragraph",
  "reference_list",
  "table",
  "figure_caption",
  "footnote",
]);
export type SectionType = z.infer<typeof SectionType>;

export interface Document {
  id: string;
  title: string;
  authors: string[];
  type: DocumentType;
  sourceFilename: string;
  filePath: string;
  fileHash: string;
  mimeType: string;
  pageCount: number;
  language: string;
  rawText: string | null;
  uploadDate: string;
  processedAt: string | null;
  processingStatus: ProcessingStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSection {
  id: string;
  documentId: string;
  sectionType: SectionType;
  heading: string | null;
  content: string;
  pageNumber: number;
  positionStart: number;
  positionEnd: number;
  depth: number;
  order: number;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  sectionId: string | null;
  content: string;
  chunkIndex: number;
  pageNumber: number;
  tokenCount: number;
  metadata: Record<string, unknown>;
}
