import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  vector,
} from "drizzle-orm/pg-core";

export const documentTypeEnum = pgEnum("document_type", [
  "paper",
  "book",
  "article",
  "note",
  "other",
]);

export const processingStatusEnum = pgEnum("processing_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const sectionTypeEnum = pgEnum("section_type", [
  "title",
  "abstract",
  "heading",
  "paragraph",
  "reference_list",
  "table",
  "figure_caption",
  "footnote",
]);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  authors: jsonb("authors").$type<string[]>().notNull().default([]),
  type: documentTypeEnum("type").notNull().default("other"),
  sourceFilename: text("source_filename").notNull(),
  filePath: text("file_path").notNull(),
  fileHash: varchar("file_hash", { length: 64 }).notNull(),
  mimeType: varchar("mime_type", { length: 128 }).notNull(),
  pageCount: integer("page_count").notNull().default(0),
  language: varchar("language", { length: 10 }).notNull().default("en"),
  rawText: text("raw_text"),
  uploadDate: timestamp("upload_date", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  processingStatus: processingStatusEnum("processing_status").notNull().default("pending"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documentSections = pgTable("document_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  sectionType: sectionTypeEnum("section_type").notNull(),
  heading: text("heading"),
  content: text("content").notNull(),
  pageNumber: integer("page_number").notNull(),
  positionStart: integer("position_start").notNull(),
  positionEnd: integer("position_end").notNull(),
  depth: integer("depth").notNull().default(0),
  order: integer("order").notNull(),
});

export const documentChunks = pgTable("document_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  sectionId: uuid("section_id").references(() => documentSections.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  pageNumber: integer("page_number").notNull(),
  tokenCount: integer("token_count").notNull().default(0),
  embedding: vector("embedding", { dimensions: 1536 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
});
