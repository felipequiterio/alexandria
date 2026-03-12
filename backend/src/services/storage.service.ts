import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { env } from "../lib/env";

const uploadDir = env.UPLOAD_DIR;

export async function ensureUploadDir(): Promise<void> {
  await mkdir(uploadDir, { recursive: true });
}

export function getFilePath(fileHash: string, originalName: string): string {
  const ext = originalName.split(".").pop() || "pdf";
  return join(uploadDir, `${fileHash}.${ext}`);
}

export async function storeFile(file: File, filePath: string): Promise<void> {
  await ensureUploadDir();
  const buffer = await file.arrayBuffer();
  await Bun.write(filePath, buffer);
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    const file = Bun.file(filePath);
    if (await file.exists()) {
      await import("node:fs/promises").then((fs) => fs.unlink(filePath));
    }
  } catch {
    // File already gone, ignore
  }
}

export async function readFileBuffer(filePath: string): Promise<Buffer> {
  const file = Bun.file(filePath);
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
