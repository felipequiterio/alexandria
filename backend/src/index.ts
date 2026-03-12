import { Hono } from "hono";
import { cors } from "hono/cors";
import { documentsRouter } from "./routes/documents";
import { env } from "./lib/env";

const app = new Hono();

app.use("/*", cors({
  origin: "http://localhost:3000",
  allowMethods: ["GET", "POST", "PUT", "DELETE"],
}));

app.route("/api/documents", documentsRouter);

app.get("/api/health", (c) => c.json({ status: "ok" }));

console.log(`Alexandria backend running on port ${env.PORT}`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
