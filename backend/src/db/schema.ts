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

export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
]);

export const highlightColorEnum = pgEnum("highlight_color", [
  "teal",
  "gold",
  "terracotta",
  "green",
]);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("New conversation"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  selectedText: text("selected_text"),
  selectionLocation: jsonb("selection_location").$type<{ page: number; start: number; end: number } | null>(),
  contextChunkIds: jsonb("context_chunk_ids").$type<string[]>().notNull().default([]),
  modelUsed: text("model_used"),
  tokenUsage: jsonb("token_usage").$type<{ prompt: number; completion: number } | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const familiarityLevelEnum = pgEnum("familiarity_level", [
  "novice",
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);

export const conversationSummaries = pgTable("conversation_summaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  keyTopics: jsonb("key_topics").$type<string[]>().notNull().default([]),
  keyInsights: jsonb("key_insights").$type<string[]>().notNull().default([]),
  questionsAsked: jsonb("questions_asked").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const topicFamiliarity = pgTable("topic_familiarity", {
  id: uuid("id").primaryKey().defaultRandom(),
  topic: text("topic").notNull(),
  familiarityLevel: familiarityLevelEnum("familiarity_level").notNull().default("intermediate"),
  confidence: integer("confidence").notNull().default(50),
  evidenceDocumentIds: jsonb("evidence_document_ids").$type<string[]>().notNull().default([]),
  evidenceConversationIds: jsonb("evidence_conversation_ids").$type<string[]>().notNull().default([]),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const highlights = pgTable("highlights", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  pageNumber: integer("page_number").notNull(),
  positionStart: integer("position_start").notNull(),
  positionEnd: integer("position_end").notNull(),
  color: highlightColorEnum("color").notNull().default("teal"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
