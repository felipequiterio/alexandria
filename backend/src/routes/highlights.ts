import { Hono } from "hono";
import {
  createHighlight,
  listHighlights,
  updateHighlight,
  deleteHighlight,
} from "../services/highlight.service";

export const highlightsRouter = new Hono();

// Create highlight for a document
highlightsRouter.post("/documents/:docId/highlights", async (c) => {
  const docId = c.req.param("docId");
  const body = await c.req.json();

  const { content, pageNumber, positionStart, positionEnd, color, note } = body;
  if (!content || pageNumber == null || positionStart == null || positionEnd == null) {
    return c.json({ error: "content, pageNumber, positionStart, and positionEnd are required" }, 400);
  }

  const highlight = await createHighlight({
    documentId: docId,
    content,
    pageNumber,
    positionStart,
    positionEnd,
    color,
    note,
  });
  return c.json({ highlight }, 201);
});

// List highlights for a document
highlightsRouter.get("/documents/:docId/highlights", async (c) => {
  const docId = c.req.param("docId");
  const highlights = await listHighlights(docId);
  return c.json({ highlights });
});

// Update a highlight
highlightsRouter.patch("/highlights/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const highlight = await updateHighlight(id, body);
  if (!highlight) {
    return c.json({ error: "Highlight not found" }, 404);
  }
  return c.json({ highlight });
});

// Delete a highlight
highlightsRouter.delete("/highlights/:id", async (c) => {
  const id = c.req.param("id");
  const deleted = await deleteHighlight(id);
  if (!deleted) {
    return c.json({ error: "Highlight not found" }, 404);
  }
  return c.json({ message: "Highlight deleted" });
});
