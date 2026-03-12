# Alexandria — Project Instructions

## What is this project?
Alexandria is a personal AI-powered knowledge library for interactive, cumulative reading. It combines a reading assistant (Atlas), a vector knowledge base (RAG), and a knowledge graph explorer (GraphRAG/constellation view). See PLAN.md for the full vision and architecture.

## Tech Stack
- **Full TypeScript** end-to-end, **Bun** runtime everywhere
- **Frontend**: Next.js 15 (App Router), shadcn/ui, Tailwind CSS, Zustand, react-pdf
- **Backend**: Hono or Elysia on Bun, Drizzle ORM, BullMQ + Redis
- **Database**: PostgreSQL 16+ with pgvector extension
- **AI**: pi-mono for multi-provider LLM access
- **Constellation rendering**: 2D Canvas (D3.js or PixiJS), NOT Three.js
- **Monorepo**: Bun workspaces — `frontend/`, `backend/`, `packages/shared/`

## Conventions
- Use `bun` for all package management and script running (never npm/yarn/pnpm)
- Drizzle schema is the source of truth for DB — always update schema.ts first, then generate migrations with Drizzle Kit
- Shared types go in `packages/shared/src/types/`
- Backend routes go in `backend/src/routes/`
- Frontend components follow: `frontend/src/components/{domain}/ComponentName.tsx`
- Use shadcn/ui components as the base — customize for the scholarly theme on top
- The AI assistant is named **Atlas** in all user-facing text and code comments

## Design Language (see PLAN.md section 6 + reference images in `reference/`)
- Inspired by architectural renders of the Library of Alexandria — sandstone, mahogany, teal friezes, torchlight
- Light mode = "The Archive": sandy limestone bg, mahogany wood surfaces, **Mediterranean teal** primary accent, torchlight gold secondary, terracotta tertiary
- Dark mode = "The Observatory": deep indigo-black bg, celestial gold accent, constellation silver secondary, nebula rose tertiary
- Documents = scrolls in **mahogany cabinets with diamond-lattice fronts** (not generic cards/shelves)
- Knowledge graph = **constellation view** (stars + constellation lines on night sky, 2D canvas with glow effects)
- Architectural framing: column borders, teal frieze nav band, mosaic-hint floor patterns
- Serif typeface for headings and Atlas responses, sans-serif for UI elements
- Highlight colors: torchlight gold, Mediterranean teal, terracotta, frieze green
- No gratuitous animations — transitions carry spatial meaning (unrolling scrolls, looking up past the columns at sky)

## Atlas (AI Companion)
- **Agentic architecture**: ReAct loop via pi-mono's `maxSteps` + `tools` API. Atlas reasons, calls tools, observes results, and loops until he can answer.
- **Query routing**: simple questions (passage explanations) take a direct retrieve→answer path. Complex questions (cross-doc, graph traversal, citations) enter the agentic ReAct loop.
- **Tools**: search_library, search_document, full_text_search, read_section, read_pages, query_graph, get_node_neighborhood, find_path, get_citations, recall_conversations, check_familiarity, compare_passages
- **Three-layer memory**: short-term (conversation), medium-term (per-document), long-term (library-wide profile)
- **Guardrails**: max 8 steps per query, token budget, read-only tools during conversation, scope-aware tool restriction
- Always ground responses in source text with clickable references
- Adapt tone and depth based on user's TopicFamiliarity profile
