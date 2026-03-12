import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { settings } from "../db/schema";

export const settingsRouter = new Hono();

// Get all settings
settingsRouter.get("/settings", async (c) => {
  const rows = await db.query.settings.findMany();
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return c.json({ settings: result });
});

// Update settings
settingsRouter.put("/settings", async (c) => {
  const body = await c.req.json();
  const entries = Object.entries(body) as [string, string][];

  for (const [key, value] of entries) {
    const existing = await db.query.settings.findFirst({
      where: eq(settings.key, key),
    });

    if (existing) {
      await db
        .update(settings)
        .set({ value: String(value), updatedAt: new Date() })
        .where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({ key, value: String(value) });
    }
  }

  return c.json({ message: "Settings updated" });
});
