---
name: drizzle-schema
description: Create or modify Drizzle ORM schema definitions and generate migrations
argument-hint: [table-name or description of change]
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(bun *)
---

# Drizzle Schema Management

You are working on the Alexandria project's database schema using Drizzle ORM with PostgreSQL + pgvector.

## Context

Read the current schema:
- Schema file: `backend/src/db/schema.ts`
- Drizzle config: `backend/drizzle.config.ts`
- Reference the data models in `PLAN.md` (sections 4.1, 4.2, 4.3) for the canonical model definitions

## Task

$ARGUMENTS

## Rules

1. Always modify `backend/src/db/schema.ts` — this is the single source of truth
2. Use Drizzle's PostgreSQL column types (`pgTable`, `uuid`, `text`, `timestamp`, `jsonb`, `vector`, etc.)
3. For pgvector columns, use the custom vector type or the `pgvector` extension helper
4. Define proper relations using Drizzle's `relations()` helper
5. Use enums via `pgEnum()` for type-safe enum columns
6. After schema changes, run: `bun run drizzle-kit generate` to create the migration
7. Then run: `bun run drizzle-kit migrate` to apply it
8. Export all tables and relations from `schema.ts`
9. If creating shared types, also update `packages/shared/src/types/` with the corresponding TypeScript interfaces
