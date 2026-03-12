import { sql } from "drizzle-orm";
import { db } from "./index";

/**
 * Run custom indexes and migrations that drizzle-kit push doesn't handle.
 */
export async function runCustomMigrations(): Promise<void> {
  // GIN index for full-text search on document_chunks.content
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_chunks_fts
    ON document_chunks USING GIN (to_tsvector('english', content))
  `);

  console.log("Custom migrations applied");
}
