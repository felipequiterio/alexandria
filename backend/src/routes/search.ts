import { Hono } from "hono";
import { hybridSearch } from "../services/retrieval/hybrid-search";

export const searchRouter = new Hono();

searchRouter.get("/search", async (c) => {
  const q = c.req.query("q");
  if (!q) {
    return c.json({ error: "Query parameter 'q' is required" }, 400);
  }

  const mode = (c.req.query("mode") || "hybrid") as "vector" | "text" | "hybrid";
  const documentId = c.req.query("documentId") || undefined;
  const topK = parseInt(c.req.query("topK") || "10", 10);

  const results = await hybridSearch(q, { documentId, topK, mode });

  return c.json({ results, total: results.length, mode });
});
