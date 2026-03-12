import { eq } from "drizzle-orm";
import { db } from "../db";
import { documents } from "../db/schema";
import { storeFile, getFilePath, deleteFile, readFileBuffer } from "./storage.service";
import { parsePdf } from "./pdf-parser.service";
import { ingestionQueue } from "./ingestion/queue";
import type { Document } from "@alexandria/shared";

function hashFile(buffer: ArrayBuffer): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(new Uint8Array(buffer));
  return hasher.digest("hex");
}

function rowToDocument(row: typeof documents.$inferSelect): Document {
  return {
    id: row.id,
    title: row.title,
    authors: row.authors,
    type: row.type,
    sourceFilename: row.sourceFilename,
    filePath: row.filePath,
    fileHash: row.fileHash,
    mimeType: row.mimeType,
    pageCount: row.pageCount,
    language: row.language,
    rawText: row.rawText,
    uploadDate: row.uploadDate.toISOString(),
    processedAt: row.processedAt?.toISOString() ?? null,
    processingStatus: row.processingStatus,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function uploadDocument(file: File): Promise<Document> {
  const arrayBuffer = await file.arrayBuffer();
  const fileHash = hashFile(arrayBuffer);

  // Check for duplicate
  const existing = await db.query.documents.findFirst({
    where: eq(documents.fileHash, fileHash),
  });
  if (existing) {
    return rowToDocument(existing);
  }

  const filePath = getFilePath(fileHash, file.name);
  await storeFile(file, filePath);

  // Parse PDF
  const buffer = Buffer.from(arrayBuffer);
  const parsed = await parsePdf(buffer);

  // Extract authors from metadata
  const authors: string[] = [];
  if (parsed.metadata.author) {
    authors.push(...parsed.metadata.author.split(/[,;&]/).map((a) => a.trim()).filter(Boolean));
  }

  const title = parsed.metadata.title || file.name.replace(/\.pdf$/i, "");

  const [row] = await db
    .insert(documents)
    .values({
      title,
      authors,
      type: "other",
      sourceFilename: file.name,
      filePath,
      fileHash,
      mimeType: file.type || "application/pdf",
      pageCount: parsed.pageCount,
      rawText: parsed.text,
      processingStatus: "processing",
      metadata: parsed.metadata as Record<string, unknown>,
    })
    .returning();

  // Queue ingestion job via BullMQ
  await ingestionQueue.add(
    "process",
    { documentId: row.id, rawText: parsed.text, pageCount: parsed.pageCount },
    { attempts: 3, backoff: { type: "exponential", delay: 5000 } }
  );

  return rowToDocument(row);
}

export async function listDocuments(): Promise<Document[]> {
  const rows = await db.query.documents.findMany({
    orderBy: (docs, { desc }) => [desc(docs.uploadDate)],
  });
  return rows.map(rowToDocument);
}

export async function getDocument(id: string): Promise<Document | null> {
  const row = await db.query.documents.findFirst({
    where: eq(documents.id, id),
  });
  return row ? rowToDocument(row) : null;
}

export async function getDocumentFile(id: string): Promise<{ buffer: Buffer; filename: string } | null> {
  const row = await db.query.documents.findFirst({
    where: eq(documents.id, id),
  });
  if (!row) return null;

  const buffer = await readFileBuffer(row.filePath);
  return { buffer, filename: row.sourceFilename };
}

export async function updateDocument(
  id: string,
  updates: { title?: string; authors?: string[]; type?: string }
): Promise<Document | null> {
  const row = await db.query.documents.findFirst({ where: eq(documents.id, id) });
  if (!row) return null;

  const setValues: Record<string, any> = { updatedAt: new Date() };
  if (updates.title !== undefined) setValues.title = updates.title;
  if (updates.authors !== undefined) setValues.authors = updates.authors;
  if (updates.type !== undefined) setValues.type = updates.type;

  const [updated] = await db
    .update(documents)
    .set(setValues)
    .where(eq(documents.id, id))
    .returning();

  return rowToDocument(updated);
}

export async function getDocumentStatus(id: string): Promise<{ processingStatus: string; pageCount: number; chunkCount: number } | null> {
  const row = await db.query.documents.findFirst({
    where: eq(documents.id, id),
    columns: { processingStatus: true, pageCount: true },
  });
  if (!row) return null;

  const { documentChunks } = await import("../db/schema");
  const chunks = await db.query.documentChunks.findMany({
    where: eq(documentChunks.documentId, id),
    columns: { id: true },
  });

  return {
    processingStatus: row.processingStatus,
    pageCount: row.pageCount,
    chunkCount: chunks.length,
  };
}

export async function deleteDocument(id: string): Promise<boolean> {
  const row = await db.query.documents.findFirst({
    where: eq(documents.id, id),
  });
  if (!row) return false;

  await deleteFile(row.filePath);
  await db.delete(documents).where(eq(documents.id, id));
  return true;
}
