import { eq, ilike } from "drizzle-orm";
import { db } from "../../db";
import { topicFamiliarity } from "../../db/schema";

export async function getTopicFamiliarity(topic: string): Promise<{
  topic: string;
  level: string;
  confidence: number;
} | null> {
  // Try exact match first, then fuzzy
  let row = await db.query.topicFamiliarity.findFirst({
    where: eq(topicFamiliarity.topic, topic.toLowerCase()),
  });

  if (!row) {
    row = await db.query.topicFamiliarity.findFirst({
      where: ilike(topicFamiliarity.topic, `%${topic}%`),
    });
  }

  if (!row) return null;

  return {
    topic: row.topic,
    level: row.familiarityLevel,
    confidence: row.confidence,
  };
}

export async function updateTopicFamiliarity(data: {
  topic: string;
  familiarityLevel: "novice" | "beginner" | "intermediate" | "advanced" | "expert";
  confidence: number;
  evidenceDocumentId?: string;
  evidenceConversationId?: string;
}): Promise<void> {
  const existing = await db.query.topicFamiliarity.findFirst({
    where: eq(topicFamiliarity.topic, data.topic.toLowerCase()),
  });

  if (existing) {
    const docIds = existing.evidenceDocumentIds;
    const convIds = existing.evidenceConversationIds;
    if (data.evidenceDocumentId && !docIds.includes(data.evidenceDocumentId)) {
      docIds.push(data.evidenceDocumentId);
    }
    if (data.evidenceConversationId && !convIds.includes(data.evidenceConversationId)) {
      convIds.push(data.evidenceConversationId);
    }

    await db
      .update(topicFamiliarity)
      .set({
        familiarityLevel: data.familiarityLevel,
        confidence: data.confidence,
        evidenceDocumentIds: docIds,
        evidenceConversationIds: convIds,
        lastUpdated: new Date(),
      })
      .where(eq(topicFamiliarity.id, existing.id));
  } else {
    await db.insert(topicFamiliarity).values({
      topic: data.topic.toLowerCase(),
      familiarityLevel: data.familiarityLevel,
      confidence: data.confidence,
      evidenceDocumentIds: data.evidenceDocumentId ? [data.evidenceDocumentId] : [],
      evidenceConversationIds: data.evidenceConversationId ? [data.evidenceConversationId] : [],
    });
  }
}
