import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { conversations, messages } from "../db/schema";
import { searchDocumentChunks } from "./retrieval/search";
import { getChatModel } from "./ai/provider";
import { ATLAS_SYSTEM_PROMPT } from "./ai/prompts";
import { streamSimple } from "@mariozechner/pi-ai";
import type {
  Conversation,
  Message,
  ConversationWithMessages,
} from "@alexandria/shared";
import type { AssistantMessageEvent, UserMessage as PiUserMessage } from "@mariozechner/pi-ai";

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

export async function listConversations(documentId: string): Promise<Conversation[]> {
  const rows = await db.query.conversations.findMany({
    where: eq(conversations.documentId, documentId),
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
): AsyncGenerator<string, void, unknown> {
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

  // RAG: retrieve relevant chunks
  let contextChunkIds: string[] = [];
  let contextText = "";

  if (conv.documentId) {
    const searchQuery = selectedText ? `${selectedText}\n\n${content}` : content;
    const results = await searchDocumentChunks(searchQuery, {
      documentId: conv.documentId,
      topK: 5,
    });

    if (results.length > 0) {
      contextChunkIds = results.map((r) => r.chunkId);
      contextText = results
        .map((r) => `[p.${r.pageNumber}] ${r.content}`)
        .join("\n\n---\n\n");
    }
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

  // Get conversation history for context
  const prevMessages = await db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: (m, { asc }) => [asc(m.createdAt)],
  });

  // Build pi-ai messages (excluding the just-inserted user message since we build it with context)
  const piMessages: any[] = [];
  for (const msg of prevMessages) {
    if (msg.id === userMsg.id) continue; // Skip current, we rebuild it with context
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

  // Add current user message with context
  piMessages.push({
    role: "user" as const,
    content: userPrompt,
    timestamp: Date.now(),
  });

  // Stream response from pi-ai
  const model = getChatModel();
  const eventStream = streamSimple(model, {
    systemPrompt: ATLAS_SYSTEM_PROMPT,
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
      yield event.delta;
    } else if (event.type === "done") {
      modelUsed = event.message.model;
      usage = {
        prompt: event.message.usage.input,
        completion: event.message.usage.output,
      };
    } else if (event.type === "error") {
      const errMsg = event.error.errorMessage || "An error occurred";
      yield `\n\n[Error: ${errMsg}]`;
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
}
