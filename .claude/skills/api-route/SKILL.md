---
name: api-route
description: Create or modify a backend API route with proper typing, validation, and error handling
argument-hint: [route description, e.g. "POST /documents/upload"]
allowed-tools: Read, Edit, Write, Glob, Grep
---

# API Route Creation

You are creating or modifying a backend API route for the Alexandria project.

## Context

- Backend framework: Hono or Elysia running on Bun
- Routes live in: `backend/src/routes/`
- Database access: Drizzle ORM — schema in `backend/src/db/schema.ts`
- AI calls: pi-mono — configured in `backend/src/services/ai/`
- Shared types: `packages/shared/src/types/`

Read existing routes for conventions before creating new ones.

## Task

$ARGUMENTS

## Rules

1. Place the route in the appropriate file under `backend/src/routes/` (documents.ts, chat.ts, search.ts, graph.ts, citations.ts)
2. Use Zod for request validation
3. Return proper HTTP status codes and consistent error shapes
4. For streaming LLM responses, use SSE (Server-Sent Events) or WebSocket
5. Add the route to the main app router in `backend/src/index.ts`
6. If the route introduces new request/response types, add them to `packages/shared/src/types/`
7. Handle errors gracefully — never expose internal details to the client
8. For file uploads, validate file type and size before processing
9. For long-running operations (ingestion), enqueue to BullMQ and return a job ID
