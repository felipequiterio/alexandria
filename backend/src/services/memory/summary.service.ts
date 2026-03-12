import { eq } from "drizzle-orm";
import { db } from "../../db";
import { messages, conversations, conversationSummaries } from "../../db/schema";
import { getChatModel } from "../ai/provider";
import { streamSimple } from "@mariozechner/pi-ai";

const SUMMARY_PROMPT = `Summarize this conversation between a reader and their AI reading companion (Atlas). Extract:
1. A brief summary (2-3 sentences)
2. Key topics discussed (as a JSON array of strings)
3. Key insights or conclusions reached (as a JSON array of strings)
4. Questions the reader asked (as a JSON array of strings)

Respond in this exact JSON format:
{
  "summary": "...",
  "keyTopics": ["..."],
  "keyInsights": ["..."],
  "questionsAsked": ["..."]
}`;

export async function generateConversationSummary(conversationId: string): Promise<void> {
  const conv = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
  });
  if (!conv) return;

  const msgs = await db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: (m, { asc }) => [asc(m.createdAt)],
  });

  if (msgs.length < 2) return; // Need at least 1 exchange

  // Build conversation text for summarization
  const convText = msgs
    .map((m) => `${m.role === "user" ? "Reader" : "Atlas"}: ${m.content.slice(0, 500)}`)
    .join("\n\n");

  const model = getChatModel();
  const eventStream = streamSimple(model, {
    systemPrompt: SUMMARY_PROMPT,
    messages: [{ role: "user" as const, content: convText, timestamp: Date.now() }],
  }, {
    maxTokens: 1024,
  });

  let response = "";
  for await (const event of eventStream) {
    if (event.type === "text_delta") {
      response += event.delta;
    }
  }

  // Parse the JSON response
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const parsed = JSON.parse(jsonMatch[0]);

    // Upsert: delete existing summary for this conversation, insert new one
    await db.delete(conversationSummaries)
      .where(eq(conversationSummaries.conversationId, conversationId));

    await db.insert(conversationSummaries).values({
      documentId: conv.documentId,
      conversationId,
      summary: parsed.summary || "",
      keyTopics: parsed.keyTopics || [],
      keyInsights: parsed.keyInsights || [],
      questionsAsked: parsed.questionsAsked || [],
    });
  } catch {
    console.error("Failed to parse conversation summary response");
  }
}

export async function getConversationSummaries(documentId?: string): Promise<
  Array<{ summary: string; keyTopics: string[]; keyInsights: string[] }>
> {
  const condition = documentId
    ? eq(conversationSummaries.documentId, documentId)
    : undefined;

  const rows = await db.query.conversationSummaries.findMany({
    where: condition,
    orderBy: (s, { desc }) => [desc(s.createdAt)],
    limit: 10,
  });

  return rows.map((r) => ({
    summary: r.summary,
    keyTopics: r.keyTopics,
    keyInsights: r.keyInsights,
  }));
}
