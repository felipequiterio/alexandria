import { eq, asc } from "drizzle-orm";
import { db } from "../db";
import { highlights } from "../db/schema";
import type { Highlight } from "@alexandria/shared";

function rowToHighlight(row: typeof highlights.$inferSelect): Highlight {
  return {
    id: row.id,
    documentId: row.documentId,
    content: row.content,
    pageNumber: row.pageNumber,
    positionStart: row.positionStart,
    positionEnd: row.positionEnd,
    color: row.color,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createHighlight(data: {
  documentId: string;
  content: string;
  pageNumber: number;
  positionStart: number;
  positionEnd: number;
  color?: "teal" | "gold" | "terracotta" | "green";
  note?: string;
}): Promise<Highlight> {
  const [row] = await db
    .insert(highlights)
    .values({
      documentId: data.documentId,
      content: data.content,
      pageNumber: data.pageNumber,
      positionStart: data.positionStart,
      positionEnd: data.positionEnd,
      color: data.color || "teal",
      note: data.note || null,
    })
    .returning();
  return rowToHighlight(row);
}

export async function listHighlights(documentId: string): Promise<Highlight[]> {
  const rows = await db.query.highlights.findMany({
    where: eq(highlights.documentId, documentId),
    orderBy: [asc(highlights.pageNumber), asc(highlights.positionStart)],
  });
  return rows.map(rowToHighlight);
}

export async function updateHighlight(
  id: string,
  data: { color?: "teal" | "gold" | "terracotta" | "green"; note?: string }
): Promise<Highlight | null> {
  const existing = await db.query.highlights.findFirst({
    where: eq(highlights.id, id),
  });
  if (!existing) return null;

  const [row] = await db
    .update(highlights)
    .set(data)
    .where(eq(highlights.id, id))
    .returning();
  return rowToHighlight(row);
}

export async function deleteHighlight(id: string): Promise<boolean> {
  const existing = await db.query.highlights.findFirst({
    where: eq(highlights.id, id),
  });
  if (!existing) return false;
  await db.delete(highlights).where(eq(highlights.id, id));
  return true;
}
