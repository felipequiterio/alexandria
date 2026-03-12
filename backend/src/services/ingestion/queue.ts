import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { documents, documentChunks } from "../../db/schema";
import { chunkDocument } from "./chunker";
import { embedChunks } from "./embedder";
import { env } from "../../lib/env";

const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const ingestionQueue = new Queue("ingestion", { connection });

interface IngestionJobData {
  documentId: string;
  rawText: string;
  pageCount: number;
}

async function processIngestion(job: Job<IngestionJobData>): Promise<void> {
  const { documentId, rawText, pageCount } = job.data;

  await db
    .update(documents)
    .set({ processingStatus: "processing" })
    .where(eq(documents.id, documentId));

  const chunks = chunkDocument(rawText, pageCount);

  if (chunks.length > 0) {
    await db.insert(documentChunks).values(
      chunks.map((c) => ({
        documentId,
        content: c.content,
        chunkIndex: c.chunkIndex,
        pageNumber: c.pageNumber,
        tokenCount: c.tokenCount,
      }))
    );

    await embedChunks(documentId);
  }

  await db
    .update(documents)
    .set({ processingStatus: "completed", processedAt: new Date() })
    .where(eq(documents.id, documentId));
}

export function startIngestionWorker(): Worker<IngestionJobData> {
  const worker = new Worker<IngestionJobData>("ingestion", processIngestion, {
    connection,
    concurrency: 1,
  });

  worker.on("completed", (job) => {
    console.log(`Ingestion completed for document ${job.data.documentId}`);
  });

  worker.on("failed", async (job, err) => {
    if (!job) return;
    console.error(`Ingestion failed for document ${job.data.documentId}:`, err);
    try {
      await db
        .update(documents)
        .set({ processingStatus: "failed" })
        .where(eq(documents.id, job.data.documentId));
    } catch (dbErr) {
      console.error("Failed to update document status:", dbErr);
    }
  });

  console.log("Ingestion worker started");
  return worker;
}
