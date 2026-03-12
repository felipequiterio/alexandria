import { eq, desc, isNull } from "drizzle-orm";
import { db } from "../db";
import { conversations, messages, documents } from "../db/schema";
import { searchDocumentChunks } from "./retrieval/search";
import { getChatModel } from "./ai/provider";
import { buildSystemPrompt } from "./ai/prompts";
import { classifyQuery } from "./ai/router";
import { runAgentLoop, type AgentEvent } from "./ai/agent";
import { ATLAS_TOOLS } from "./ai/tools";
import { generateConversationSummary } from "./memory/summary.service";
import { streamSimple } from "@mariozechner/pi-ai";
import type {
  Conversation,
  Message,
  ConversationWithMessages,
} from "@alexandria/shared";

function rowToConversation(row: typeof conversations.$inferSelect): Conversation {
  return {
    id: row.id,
    documentId: row.documentId,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function rowToMessage(row: typeof messages.$inferSelect): Message {
  return {
    id: row.id,
    conversationId: row.conversationId,
    role: row.role,
    content: row.content,
    selectedText: row.selectedText,
    selectionLocation: row.selectionLocation,
    contextChunkIds: row.contextChunkIds,
    modelUsed: row.modelUsed,
    tokenUsage: row.tokenUsage,
    createdAt: row.createdAt.toISOString(),
  };
}

// Document-scoped conversation
export async function createConversation(documentId: string, title?: string): Promise<Conversation> {
  const [row] = await db
    .insert(conversations)
    .values({
      documentId,
      title: title || "New conversation",
    })
    .returning();
  return rowToConversation(row);
}

// Library-wide conversation (no documentId)
export async function createLibraryConversation(title?: string): Promise<Conversation> {
  const [row] = await db
    .insert(conversations)
    .values({
      documentId: null,
      title: title || "Library conversation",
    })
    .returning();
  return rowToConversation(row);
}

export async function listConversations(documentId: string): Promise<Conversation[]> {
  const rows = await db.query.conversations.findMany({
    where: eq(conversations.documentId, documentId),
    orderBy: [desc(conversations.updatedAt)],
  });
  return rows.map(rowToConversation);
}

export async function listLibraryConversations(): Promise<Conversation[]> {
  const rows = await db.query.conversations.findMany({
    where: isNull(conversations.documentId),
    orderBy: [desc(conversations.updatedAt)],
  });
  return rows.map(rowToConversation);
}

export async function getConversation(id: string): Promise<ConversationWithMessages | null> {
  const row = await db.query.conversations.findFirst({
    where: eq(conversations.id, id),
  });
  if (!row) return null;

  const msgs = await db.query.messages.findMany({
    where: eq(messages.conversationId, id),
    orderBy: (m, { asc }) => [asc(m.createdAt)],
  });

  return {
    ...rowToConversation(row),
    messages: msgs.map(rowToMessage),
  };
}

export async function deleteConversation(id: string): Promise<boolean> {
  const row = await db.query.conversations.findFirst({
    where: eq(conversations.id, id),
  });
  if (!row) return false;
  await db.delete(conversations).where(eq(conversations.id, id));
  return true;
}

interface SendMessageOptions {
  conversationId: string;
  content: string;
  selectedText?: string;
  selectionLocation?: { page: number; start: number; end: number };
}

export async function* sendMessage(
  options: SendMessageOptions
): AsyncGenerator<AgentEvent, void, unknown> {
  const { conversationId, content, selectedText, selectionLocation } = options;

  // Get conversation to find documentId
  const conv = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
  });
  if (!conv) throw new Error("Conversation not found");

  // Save user message
  const [userMsg] = await db
    .insert(messages)
    .values({
      conversationId,
      role: "user",
      content,
      selectedText: selectedText || null,
      selectionLocation: selectionLocation || null,
    })
    .returning();

  // Classify query
  const mode = classifyQuery(content, !!selectedText, conv.documentId);

  // Get document info if scoped
  let documentTitle: string | undefined;
  if (conv.documentId) {
    const doc = await db.query.documents.findFirst({
      where: eq(documents.id, conv.documentId),
      columns: { title: true },
    });
    documentTitle = doc?.title;
  }

  // Get conversation history
  const prevMessages = await db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: (m, { asc }) => [asc(m.createdAt)],
  });

  // Build pi-ai messages (excluding the just-inserted user message)
  const piMessages: any[] = [];
  for (const msg of prevMessages) {
    if (msg.id === userMsg.id) continue;
    if (msg.role === "user") {
      piMessages.push({
        role: "user" as const,
        content: msg.content,
        timestamp: msg.createdAt.getTime(),
      });
    } else {
      piMessages.push({
        role: "assistant" as const,
        content: [{ type: "text" as const, text: msg.content }],
        api: "",
        provider: "",
        model: "",
        usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
        stopReason: "stop" as const,
        timestamp: msg.createdAt.getTime(),
      });
    }
  }

  if (mode === "simple") {
    // Simple path: RAG retrieve → streamSimple
    yield* streamSimplePath({
      conversationId,
      content,
      selectedText,
      documentId: conv.documentId!,
      documentTitle,
      piMessages,
    });
  } else {
    // Agentic path: ReAct loop
    yield* streamAgenticPath({
      conversationId,
      content,
      selectedText,
      documentId: conv.documentId,
      documentTitle,
      piMessages,
    });
  }

  // Update conversation title from first message
  if (prevMessages.length === 0) {
    const title = content.slice(0, 80) + (content.length > 80 ? "..." : "");
    await db
      .update(conversations)
      .set({ title, updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
  } else {
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
  }

  // Trigger background summary generation every 5 new messages
  const totalMessages = prevMessages.length + 2; // +1 user +1 assistant
  if (totalMessages >= 4 && totalMessages % 4 === 0) {
    generateConversationSummary(conversationId).catch((err) => {
      console.error("Summary generation failed:", err);
    });
  }
}

async function* streamSimplePath(opts: {
  conversationId: string;
  content: string;
  selectedText?: string;
  documentId: string;
  documentTitle?: string;
  piMessages: any[];
}): AsyncGenerator<AgentEvent> {
  const { conversationId, content, selectedText, documentId, documentTitle, piMessages } = opts;

  // RAG: retrieve relevant chunks
  let contextChunkIds: string[] = [];
  let contextText = "";

  const searchQuery = selectedText ? `${selectedText}\n\n${content}` : content;
  const results = await searchDocumentChunks(searchQuery, {
    documentId,
    topK: 5,
  });

  if (results.length > 0) {
    contextChunkIds = results.map((r) => r.chunkId);
    contextText = results
      .map((r) => `[p.${r.pageNumber}] ${r.content}`)
      .join("\n\n---\n\n");
  }

  // Build prompt with context
  let userPrompt = "";
  if (selectedText) {
    userPrompt += `[Selected text from document]: "${selectedText}"\n\n`;
  }
  if (contextText) {
    userPrompt += `[Relevant passages from the document]:\n${contextText}\n\n`;
  }
  userPrompt += `[Reader's question]: ${content}`;

  piMessages.push({
    role: "user" as const,
    content: userPrompt,
    timestamp: Date.now(),
  });

  const systemPrompt = buildSystemPrompt({
    documentId,
    mode: "simple",
    documentTitle,
  });

  const model = getChatModel();
  const eventStream = streamSimple(model, {
    systemPrompt,
    messages: piMessages,
  }, {
    maxTokens: 2048,
  });

  let fullResponse = "";
  let usage: { prompt: number; completion: number } | null = null;
  let modelUsed: string | null = null;

  for await (const event of eventStream) {
    if (event.type === "text_delta") {
      fullResponse += event.delta;
      yield { type: "text_delta", content: event.delta };
    } else if (event.type === "done") {
      modelUsed = event.message.model;
      usage = {
        prompt: event.message.usage.input,
        completion: event.message.usage.output,
      };
    } else if (event.type === "error") {
      const errMsg = event.error.errorMessage || "An error occurred";
      yield { type: "error", message: errMsg };
      fullResponse += `\n\n[Error: ${errMsg}]`;
    }
  }

  // Save assistant message
  await db.insert(messages).values({
    conversationId,
    role: "assistant",
    content: fullResponse,
    contextChunkIds,
    modelUsed,
    tokenUsage: usage,
  });

  yield {
    type: "done",
    fullText: fullResponse,
    usage: usage || { prompt: 0, completion: 0 },
    model: modelUsed || "",
  };
}

async function* streamAgenticPath(opts: {
  conversationId: string;
  content: string;
  selectedText?: string;
  documentId: string | null;
  documentTitle?: string;
  piMessages: any[];
}): AsyncGenerator<AgentEvent> {
  const { conversationId, content, selectedText, documentId, documentTitle, piMessages } = opts;

  // Build library catalog for context
  const allDocs = await db.query.documents.findMany({
    columns: { id: true, title: true, authors: true, type: true, pageCount: true, processingStatus: true },
    orderBy: (d, { desc }) => [desc(d.uploadDate)],
    limit: 50,
  });

  const libraryCatalog = allDocs.length > 0
    ? allDocs.map((d) => {
        const authors = d.authors.length > 0 ? ` by ${d.authors.join(", ")}` : "";
        return `- "${d.title}"${authors} (${d.type}, ${d.pageCount} pages, ID: ${d.id}, status: ${d.processingStatus})`;
      }).join("\n")
    : undefined;

  // Build user message with any selection context
  let userPrompt = "";
  if (selectedText) {
    userPrompt += `[Selected text from document]: "${selectedText}"\n\n`;
  }
  if (documentId) {
    userPrompt += `[Current document ID: ${documentId}]\n`;
  }
  userPrompt += content;

  piMessages.push({
    role: "user" as const,
    content: userPrompt,
    timestamp: Date.now(),
  });

  const systemPrompt = buildSystemPrompt({
    documentId,
    mode: "agentic",
    documentTitle,
    libraryCatalog,
  });

  console.log(`[Atlas Agent] Starting agentic path. Mode: agentic, DocumentId: ${documentId}, Tools: ${ATLAS_TOOLS.length}, Library docs: ${allDocs.length}`);

  const agentStream = runAgentLoop({
    systemPrompt,
    messages: piMessages,
    maxTokens: 4096,
  });

  let fullResponse = "";
  let finalUsage: { prompt: number; completion: number } = { prompt: 0, completion: 0 };
  let finalModel = "";

  for await (const event of agentStream) {
    yield event;

    if (event.type === "text_delta") {
      fullResponse += event.content;
    } else if (event.type === "done") {
      fullResponse = event.fullText;
      finalUsage = event.usage;
      finalModel = event.model;
    }
  }

  // Save assistant message
  await db.insert(messages).values({
    conversationId,
    role: "assistant",
    content: fullResponse,
    contextChunkIds: [],
    modelUsed: finalModel || null,
    tokenUsage: finalUsage.prompt > 0 ? finalUsage : null,
  });
}
