export type HighlightColor = "teal" | "gold" | "terracotta" | "green";

export interface Highlight {
  id: string;
  documentId: string;
  content: string;
  pageNumber: number;
  positionStart: number;
  positionEnd: number;
  color: HighlightColor;
  note: string | null;
  createdAt: string;
}
