import { encodingForModel } from "js-tiktoken";

const enc = encodingForModel("gpt-4o-mini");

const TARGET_TOKENS = 600;
const MAX_TOKENS = 800;
const MIN_TOKENS = 100;
const OVERLAP_TOKENS = 100;

const SEPARATORS = ["\n\n", "\n", ". ", " "];

export interface RawChunk {
  content: string;
  chunkIndex: number;
  pageNumber: number;
  tokenCount: number;
}

function countTokens(text: string): number {
  return enc.encode(text).length;
}

function splitBySeparator(text: string, separator: string): string[] {
  const parts = text.split(separator);
  // Re-attach the separator to each part (except the last)
  return parts.map((part, i) =>
    i < parts.length - 1 ? part + separator : part
  ).filter((p) => p.trim().length > 0);
}

function recursiveSplit(text: string, separatorIndex: number): string[] {
  const tokens = countTokens(text);
  if (tokens <= MAX_TOKENS) return [text];

  const separator = SEPARATORS[separatorIndex];
  if (separatorIndex >= SEPARATORS.length - 1) {
    // Last resort: hard split by tokens
    return hardSplitByTokens(text);
  }

  const parts = splitBySeparator(text, separator);
  if (parts.length <= 1) {
    return recursiveSplit(text, separatorIndex + 1);
  }

  // Merge small parts together until they approach TARGET_TOKENS
  const merged: string[] = [];
  let current = "";
  for (const part of parts) {
    const combined = current + part;
    if (countTokens(combined) > MAX_TOKENS && current.trim()) {
      merged.push(current);
      current = part;
    } else {
      current = combined;
    }
  }
  if (current.trim()) merged.push(current);

  // Recursively split any still-too-large chunks
  const result: string[] = [];
  for (const chunk of merged) {
    if (countTokens(chunk) > MAX_TOKENS) {
      result.push(...recursiveSplit(chunk, separatorIndex + 1));
    } else {
      result.push(chunk);
    }
  }

  return result;
}

function hardSplitByTokens(text: string): string[] {
  const tokens = enc.encode(text);
  const result: string[] = [];
  for (let i = 0; i < tokens.length; i += TARGET_TOKENS) {
    const slice = tokens.slice(i, i + MAX_TOKENS);
    result.push(enc.decode(slice));
  }
  return result;
}

function addOverlap(chunks: string[]): string[] {
  if (chunks.length <= 1) return chunks;

  const result: string[] = [chunks[0]];
  for (let i = 1; i < chunks.length; i++) {
    const prevTokens = enc.encode(chunks[i - 1]);
    const overlapTokens = prevTokens.slice(-OVERLAP_TOKENS);
    const overlapText = enc.decode(overlapTokens);
    result.push(overlapText + chunks[i]);
  }
  return result;
}

/**
 * Estimate page number for a chunk based on character offset within the full text.
 * Assumes roughly equal text distribution per page.
 */
function estimatePageNumber(charOffset: number, totalChars: number, totalPages: number): number {
  if (totalChars === 0 || totalPages === 0) return 1;
  const ratio = charOffset / totalChars;
  return Math.min(Math.max(1, Math.ceil(ratio * totalPages)), totalPages);
}

export function chunkDocument(
  rawText: string,
  pageCount: number
): RawChunk[] {
  if (!rawText.trim()) return [];

  const segments = recursiveSplit(rawText, 0);
  const withOverlap = addOverlap(segments);

  // Track character offsets for page estimation
  let charOffset = 0;
  const chunks: RawChunk[] = [];

  for (let i = 0; i < withOverlap.length; i++) {
    const content = withOverlap[i].trim();
    if (!content) continue;

    const tokenCount = countTokens(content);
    if (tokenCount < MIN_TOKENS && withOverlap.length > 1) {
      // Skip very small trailing chunks
      charOffset += segments[i]?.length ?? 0;
      continue;
    }

    chunks.push({
      content,
      chunkIndex: chunks.length,
      pageNumber: estimatePageNumber(charOffset, rawText.length, pageCount),
      tokenCount,
    });

    // Advance by original segment length (not overlap-expanded length)
    charOffset += segments[i]?.length ?? 0;
  }

  return chunks;
}
