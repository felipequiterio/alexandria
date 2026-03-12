import { eq } from "drizzle-orm";
import { db } from "../db";
import { documents, documentChunks } from "../db/schema";
import { storeFile, getFilePath, deleteFile, readFileBuffer } from "./storage.service";
import { parsePdf } from "./pdf-parser.service";
import { chunkDocument } from "./ingestion/chunker";
import { embedChunks } from "./ingestion/embedder";
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

  // Chunk and embed in the background (don't block upload response)
  chunkAndEmbed(row.id, parsed.text, parsed.pageCount).catch((err) => {
    console.error(`Chunking/embedding failed for document ${row.id}:`, err);
  });

  return rowToDocument(row);
}

async function chunkAndEmbed(documentId: string, rawText: string, pageCount: number): Promise<void> {
  try {
    const chunks = chunkDocument(rawText, pageCount);

    if (chunks.length > 0) {
      await db.insert(documentChunks).values(
        chunks.map((c) => ({
          documentId,
          content: c.content,
          chunkIndex: c.chunkIndex,
          pageNumber: c.pageNumber,
          tokenCount: c.tokenCount,
        }))
      );

      // Embed chunks (updates rows in-place)
      await embedChunks(documentId);
    }

    await db
      .update(documents)
      .set({ processingStatus: "completed", processedAt: new Date() })
      .where(eq(documents.id, documentId));
  } catch (err) {
    await db
      .update(documents)
      .set({ processingStatus: "failed" })
      .where(eq(documents.id, documentId));
    throw err;
  }
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

export async function deleteDocument(id: string): Promise<boolean> {
  const row = await db.query.documents.findFirst({
    where: eq(documents.id, id),
  });
  if (!row) return false;

  await deleteFile(row.filePath);
  await db.delete(documents).where(eq(documents.id, id));
  return true;
}
