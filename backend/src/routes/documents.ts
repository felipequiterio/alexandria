import { Hono } from "hono";
import {
  uploadDocument,
  listDocuments,
  getDocument,
  getDocumentFile,
  deleteDocument,
} from "../services/document.service";

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
