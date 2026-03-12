---
name: ingest-debug
description: Debug document ingestion pipeline issues — parsing, chunking, embedding, or graph extraction failures
argument-hint: [document ID or error description]
allowed-tools: Read, Glob, Grep, Bash(bun *), Bash(curl *), Bash(docker *)
---

# Ingestion Pipeline Debugger

Debug issues in Alexandria's document ingestion pipeline.

## Pipeline Stages

The ingestion pipeline runs in this order:
1. **Upload & Validate** — file storage, hash computation, Document record creation
2. **Parse & Extract** — PDF text extraction via pdf-parse/unpdf
3. **Structural Analysis** — section detection, reference parsing
4. **Chunking** — recursive text splitting respecting section boundaries
5. **Embedding** — vector generation via pi-mono
6. **Vector Indexing** — pgvector HNSW index update
7. **Graph Extraction** — LLM-based entity/relation extraction
8. **Cross-Document Linking** — node deduplication, citation resolution

## Task

$ARGUMENTS

## Debugging Steps

1. Check the Document record's `processing_status` and identify which stage failed
2. Check BullMQ job status for the document's processing job
3. Read the relevant service code in `backend/src/services/ingestion/`
4. Check logs for errors
5. For embedding issues: verify API keys and model availability
6. For graph extraction: check the LLM prompt and structured output parsing
7. For chunking issues: inspect the document's extracted text and section boundaries

## Common Issues
- PDF parsing failures: corrupted files, scanned PDFs without OCR, encrypted PDFs
- Embedding timeouts: large documents with too many chunks, API rate limits
- Graph extraction: malformed JSON from LLM, node deduplication conflicts
- pgvector: dimension mismatch between embedding model and column definition
