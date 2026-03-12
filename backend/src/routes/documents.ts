import { Hono } from "hono";
import {
  uploadDocument,
  listDocuments,
  getDocument,
  getDocumentFile,
  deleteDocument,
  getDocumentStatus,
  updateDocument,
} from "../services/document.service";
import { ingestionQueue } from "../services/ingestion/queue";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { documents, documentChunks } from "../db/schema";

export const documentsRouter = new Hono();

// Upload a PDF
documentsRouter.post("/upload", async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"];

  if (!(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }

  if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
    return c.json({ error: "Only PDF files are supported" }, 400);
  }

  try {
    const document = await uploadDocument(file);
    return c.json({ document, message: "Document uploaded successfully" }, 201);
  } catch (error) {
    console.error("Upload failed:", error);
    return c.json({ error: "Upload failed", details: String(error) }, 500);
  }
});

// List all documents
documentsRouter.get("/", async (c) => {
  const docs = await listDocuments();
  return c.json({ documents: docs, total: docs.length });
});

// Get single document
documentsRouter.get("/:id", async (c) => {
  const doc = await getDocument(c.req.param("id"));
  if (!doc) return c.json({ error: "Document not found" }, 404);
  return c.json(doc);
});

// Update document metadata
documentsRouter.patch("/:id", async (c) => {
  const body = await c.req.json();
  const updated = await updateDocument(c.req.param("id"), body);
  if (!updated) return c.json({ error: "Document not found" }, 404);
  return c.json(updated);
});

// Get document processing status
documentsRouter.get("/:id/status", async (c) => {
  const status = await getDocumentStatus(c.req.param("id"));
  if (!status) return c.json({ error: "Document not found" }, 404);
  return c.json(status);
});

// Re-process a document (re-chunk and re-embed)
documentsRouter.post("/:id/reprocess", async (c) => {
  const id = c.req.param("id");
  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, id),
    columns: { id: true, rawText: true, pageCount: true },
  });
  if (!doc) return c.json({ error: "Document not found" }, 404);
  if (!doc.rawText) return c.json({ error: "Document has no text content" }, 400);

  // Delete existing chunks
  await db.delete(documentChunks).where(eq(documentChunks.documentId, id));

  // Reset status and queue re-processing
  await db.update(documents).set({ processingStatus: "pending" }).where(eq(documents.id, id));
  await ingestionQueue.add(
    "process",
    { documentId: id, rawText: doc.rawText, pageCount: doc.pageCount },
    { attempts: 3, backoff: { type: "exponential", delay: 5000 } }
  );

  return c.json({ message: "Document queued for re-processing" });
});

// Serve PDF file
documentsRouter.get("/:id/file", async (c) => {
  const result = await getDocumentFile(c.req.param("id"));
  if (!result) return c.json({ error: "Document not found" }, 404);

  return new Response(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${result.filename}"`,
    },
  });
});

// Delete document
documentsRouter.delete("/:id", async (c) => {
  const deleted = await deleteDocument(c.req.param("id"));
  if (!deleted) return c.json({ error: "Document not found" }, 404);
  return c.json({ message: "Document deleted" });
});
