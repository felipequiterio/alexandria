# Alexandria — Development Plan

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Data Models](#4-data-models)
5. [System Components](#5-system-components)
6. [Design Vision & UI Language](#6-design-vision--ui-language)
7. [Feature Specifications](#7-feature-specifications)
8. [Development Phases](#8-development-phases)
9. [Additional Ideas](#9-additional-ideas)

---

## 1. Project Overview

Alexandria is a personal AI-powered knowledge library that transforms reading into an interactive, cumulative, and connected learning process. It combines three roles in one system:

- **Reading assistant** — an AI companion named **Atlas** helps understand difficult text in the moment through contextual interaction
- **Knowledge base** — stores and retrieves meaning across a growing document collection via vector retrieval (RAG)
- **Knowledge graph explorer** — reveals how ideas, sources, and concepts connect across everything the user has read via a graph layer (GraphRAG)

The core differentiator is that Alexandria is **reading-centered**: AI assistance is embedded directly into the reading experience, not accessed through a separate chat window. Every document ingested feeds both a semantic retrieval layer and a structured knowledge graph, enabling the system to grow smarter as the user reads more.

### Target Users

- Researchers and academics reading papers and technical literature
- Students studying complex material across multiple sources
- Autodidacts and lifelong learners building deep knowledge in specific domains
- Professionals who need to synthesize information from many documents

### Key Design Principles

- **Reading flow first**: AI interactions should never break the reading experience
- **Context is king**: every AI response must be grounded in the actual text, not generic knowledge
- **Cumulative intelligence**: the system should get more useful with every document added
- **Single environment**: no tab-switching between reader, notes, chat, and search — it's all one place
- **Scholarly identity**: the interface should feel like a curated personal archive, not a generic SaaS dashboard

---

## 2. Architecture Overview

Alexandria follows a modular monolith architecture with clear domain boundaries, designed as a full-stack web application with potential for desktop packaging later (via Electron/Tauri).

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (SPA)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Library  │  │  Reader  │  │   Chat   │  │  Knowledge │  │
│  │   View    │  │   View   │  │  Panel   │  │  Graph UI  │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST + WebSocket
┌──────────────────────┴──────────────────────────────────────┐
│                     Backend API Server                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Document  │  │   Chat   │  │  Search  │  │   Graph    │  │
│  │ Service   │  │ Service  │  │ Service  │  │  Service   │  │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └──────┬─────┘  │
│        │             │             │               │         │
│  ┌─────┴─────────────┴─────────────┴───────────────┴─────┐  │
│  │              Ingestion Pipeline                        │  │
│  │  Parse → Chunk → Embed → Index → Extract → Graph      │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │ PostgreSQL│  │ Vector Store │  │   Graph Database   │     │
│  │ (metadata,│  │  (pgvector)  │  │    (Neo4j or       │     │
│  │  users,   │  │              │  │    in-pg graph)    │     │
│  │  docs)    │  │              │  │                    │     │
│  └──────────┘  └──────────────┘  └────────────────────┘     │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │   File Storage   │  │   LLM Provider   │                  │
│  │  (local / S3)    │  │  (OpenAI /       │                  │
│  │                  │  │   Anthropic /    │                  │
│  │                  │  │   local)         │                  │
│  └──────────────────┘  └──────────────────┘                  │
└──────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

- **PostgreSQL as the primary database** with `pgvector` extension for vector storage. This avoids running a separate vector DB and simplifies ops. If scale demands it later, a dedicated vector store (Qdrant, Weaviate) can be swapped in.
- **Graph storage**: start with PostgreSQL using adjacency tables (nodes + edges) and recursive CTEs for traversal. If graph query complexity grows significantly, migrate to Neo4j. This keeps the initial stack simpler.
- **LLM provider abstraction**: support multiple providers (OpenAI, Anthropic, local models via Ollama) behind a unified interface. The user should be able to choose and configure their provider.
- **File storage**: local filesystem for self-hosted, with S3-compatible interface for cloud deployment.
- **Background processing**: document ingestion is async — uploads return immediately, processing happens in a job queue.

---

## 3. Technology Stack

### Frontend

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | **Next.js 15 (App Router)** | Full-stack React framework with SSR, API routes, and strong ecosystem |
| Language | **TypeScript** | Type safety across the full stack |
| Runtime | **Bun** | Fast JS runtime, package manager, and bundler in one |
| UI Components | **shadcn/ui + Tailwind CSS** | Composable, themeable components that can be customized for the scholarly aesthetic |
| PDF Rendering | **react-pdf (pdf.js)** | Mature PDF rendering with text layer for selection and annotation |
| Graph / Constellation | **HTML Canvas (D3.js + custom rendering)** or **PixiJS** | 2D rendering with glow/bloom effects for the night-sky constellation view (see rendering decision below) |
| State Management | **Zustand** | Lightweight, minimal boilerplate |
| Real-time | **WebSocket** (native or Socket.io) | For streaming LLM responses |

### Backend

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Runtime | **Bun** | Fast TypeScript-native runtime with built-in test runner, bundler, and HTTP server |
| Language | **TypeScript** | Unified language across the entire stack — shared types between frontend and backend |
| API Framework | **Hono** or **Elysia** | Lightweight, fast, TypeScript-first API frameworks optimized for Bun |
| Database | **PostgreSQL 16+** with **pgvector** | Relational + vector in one DB |
| ORM | **Drizzle ORM** | Type-safe, SQL-like query builder with excellent TypeScript inference and lightweight footprint |
| Migrations | **Drizzle Kit** | Schema-driven migrations that stay in sync with Drizzle schema definitions |
| AI / LLM | **pi-mono** | Unified AI interface for LLM calls, streaming, structured output, and multi-provider support |
| Job Queue | **BullMQ** | Async document processing with Redis-backed queue |
| PDF Parsing | **pdf-parse** or **unpdf** | Text + structure extraction from PDFs in JavaScript |
| Embeddings | **OpenAI text-embedding-3-small** (via pi-mono) | Vector generation |
| Graph Extraction | **LLM-based entity/relation extraction** (via pi-mono) | Using structured output from the LLM |
| Search | **pgvector** similarity search + full-text search | Hybrid retrieval |

#### Full TypeScript Stack

The entire project uses TypeScript end-to-end, with Bun as the runtime for both frontend and backend. This provides:

- **Shared types**: domain models, API contracts, and validation schemas can be shared between frontend and backend via a common `packages/shared` workspace package
- **Single language**: no context-switching between languages, one set of tooling and conventions
- **Drizzle ORM**: provides type-safe database access with a SQL-like API that maps closely to the actual queries, making it easy to reason about performance. Schema definitions in TypeScript double as the source of truth for migrations via Drizzle Kit.
- **pi-mono for AI**: provides a unified interface to interact with multiple LLM providers (OpenAI, Anthropic, local models), handling streaming, structured output, and tool use through a single API
- **Bun performance**: native TypeScript execution without a compile step, fast startup, built-in test runner

#### Constellation Rendering Decision: 2D with Effects (not Three.js)

The knowledge graph constellation view uses **2D Canvas rendering** (D3.js with custom canvas drawing, or PixiJS for WebGL-accelerated 2D) rather than Three.js / full 3D. Rationale:

- **Star maps are 2D projections.** Real constellation charts are flat — the metaphor doesn't require 3D depth. Looking up at the night sky is itself a 2D experience projected onto the dome of the sky.
- **Graphs need readable text.** Node labels, edge labels, search results, and detail panels all require crisp, accessible text. 3D environments make text rendering significantly harder (billboarding, depth sorting, resolution scaling). In 2D, text is native and sharp.
- **Interaction fidelity.** Clicking nodes, hovering for tooltips, dragging to pan, selecting regions — all of these are precise 2D interactions. Three.js requires raycasting for hit detection, which is less reliable and harder to debug.
- **Performance at scale.** A library with thousands of nodes needs efficient rendering. Canvas 2D or PixiJS (WebGL-accelerated 2D) can handle tens of thousands of sprites trivially. Three.js adds overhead for a scene graph, lighting, and camera math that provides no benefit here.
- **Bundle size.** Three.js adds ~150KB+ to the bundle. D3.js or PixiJS are lighter and already useful for other parts of the app.

**Achieving the night-sky atmosphere in 2D:**
- **Glow/bloom effect**: each star node is drawn as a small bright core with a radial gradient halo around it (Gaussian blur or pre-rendered glow sprites). This is cheap in Canvas/PixiJS.
- **Background depth**: 2-3 layered canvases with tiny static dots at different densities, moving at slightly different speeds on mouse/scroll (parallax). This gives the illusion of depth without 3D math.
- **Subtle grain/noise**: a CSS or Canvas noise texture overlay on the dark background prevents it from feeling flat.
- **Mouse-tracked ambient movement**: stars shift very slightly (1-3px) in response to mouse position, creating a gentle parallax. This is a CSS transform on the canvas, not a 3D camera.
- **Twinkle/pulse**: CSS or Canvas animation on individual star nodes — opacity or size oscillation on a slow random timer.

The result is visually indistinguishable from a 3D star field for the user, but far simpler to build, maintain, and keep performant.

### Infrastructure (Development)

| Tool | Purpose |
|------|---------|
| Docker Compose | Local development environment (PostgreSQL, Redis, etc.) |
| Drizzle Kit | Database migrations (schema push, generate, migrate) |
| Bun test | Backend testing (built-in test runner) |
| Vitest + Playwright | Frontend testing |

---

## 4. Data Models

### 4.1 Core Entities (PostgreSQL)

```
Document
├── id: UUID (PK)
├── title: string
├── authors: string[]
├── type: enum (paper, book, article, note, other)
├── source_filename: string
├── file_path: string (storage location)
├── file_hash: string (deduplication)
├── mime_type: string
├── page_count: int
├── language: string
├── upload_date: timestamp
├── processed_at: timestamp | null
├── processing_status: enum (pending, processing, completed, failed)
├── metadata: jsonb (flexible fields: DOI, ISBN, publisher, year, etc.)
└── created_at / updated_at: timestamps

DocumentSection
├── id: UUID (PK)
├── document_id: FK → Document
├── section_type: enum (title, abstract, heading, paragraph, reference_list, table, figure_caption, footnote)
├── heading: string | null
├── content: text
├── page_number: int
├── position_start: int (character offset in full text)
├── position_end: int
├── depth: int (heading level / nesting)
└── order: int (sequential position within document)

DocumentChunk
├── id: UUID (PK)
├── document_id: FK → Document
├── section_id: FK → DocumentSection | null
├── content: text
├── chunk_index: int
├── page_number: int
├── token_count: int
├── embedding: vector(1536) [pgvector]
└── metadata: jsonb (overlap info, structural context)

Conversation
├── id: UUID (PK)
├── document_id: FK → Document | null (null = library-wide chat)
├── title: string
├── created_at / updated_at: timestamps

Message
├── id: UUID (PK)
├── conversation_id: FK → Conversation
├── role: enum (user, assistant, system)
├── content: text
├── selected_text: text | null (the highlighted passage, if any)
├── selection_location: jsonb | null (page, offsets — to re-anchor in reader)
├── context_chunks: UUID[] (references to DocumentChunks used for RAG)
├── model_used: string
├── token_usage: jsonb (prompt_tokens, completion_tokens)
├── created_at: timestamp

Highlight
├── id: UUID (PK)
├── document_id: FK → Document
├── content: text (the highlighted text)
├── page_number: int
├── position_start: int
├── position_end: int
├── color: string
├── note: text | null (user annotation)
├── created_at: timestamp

Citation
├── id: UUID (PK)
├── source_document_id: FK → Document (the document containing the citation)
├── cited_title: string
├── cited_authors: string[]
├── cited_year: int | null
├── cited_doi: string | null
├── cited_identifier: string | null (any unique ID)
├── resolved_document_id: FK → Document | null (if the cited work is in the library)
├── raw_text: text (the citation as it appears in the source)
├── status: enum (detected, identified, resolved, in_library, unavailable)
└── created_at: timestamp
```

### 4.2 Knowledge Graph Entities (PostgreSQL adjacency or Neo4j)

```
GraphNode
├── id: UUID (PK)
├── type: enum (concept, entity, author, paper, book, topic, term, method, dataset, organization)
├── name: string
├── description: text | null
├── aliases: string[] (alternative names for the same concept)
├── source_document_ids: UUID[] (documents where this node was extracted from)
├── properties: jsonb (flexible attributes)
├── importance_score: float (how central this node is in the graph)
└── created_at / updated_at: timestamps

GraphEdge
├── id: UUID (PK)
├── source_node_id: FK → GraphNode
├── target_node_id: FK → GraphNode
├── relationship_type: enum (cites, discusses, defines, extends, contradicts, is_author_of, belongs_to_topic, uses_method, related_to, ...)
├── weight: float (strength/confidence of the relationship)
├── source_document_id: FK → Document (where this relationship was extracted from)
├── evidence: text | null (the passage that supports this edge)
├── properties: jsonb
└── created_at: timestamp
```

### 4.3 Atlas Memory Entities (PostgreSQL)

```
ConversationSummary
├── id: UUID (PK)
├── document_id: FK → Document
├── conversation_id: FK → Conversation
├── summary: text (auto-generated summary of the conversation)
├── key_topics: string[] (main concepts discussed)
├── key_insights: text[] (core takeaways from Atlas's answers)
├── questions_asked: text[] (user's questions, for pattern detection)
├── created_at: timestamp

TopicFamiliarity
├── id: UUID (PK)
├── topic: string (concept or topic name, linked to GraphNode where possible)
├── graph_node_id: FK → GraphNode | null
├── familiarity_level: enum (novice, beginner, intermediate, advanced, expert)
├── confidence: float (how confident the system is in this assessment)
├── evidence_document_ids: UUID[] (documents that informed this level)
├── evidence_conversation_ids: UUID[] (conversations that informed this level)
├── last_updated: timestamp
├── created_at: timestamp

UserInsight
├── id: UUID (PK)
├── type: enum (connection, interest, open_question, preference, correction)
├── content: text (the insight itself)
├── related_document_ids: UUID[] | null
├── related_graph_node_ids: UUID[] | null
├── source: enum (inferred, user_stated) (whether Atlas inferred this or the user explicitly said it)
├── active: boolean (can be dismissed/archived by user)
├── created_at / updated_at: timestamps

UserProfile
├── id: UUID (PK)
├── explanation_style: enum (concise, balanced, detailed)
├── formality: enum (casual, neutral, formal)
├── math_comfort: enum (avoid, basic, comfortable, prefer_formal)
├── use_analogies: boolean
├── reading_patterns: jsonb (aggregated stats: topics, frequency, depth)
├── created_at / updated_at: timestamps
```

### 4.4 Index: Relationships Between Layers

The power of Alexandria comes from connecting these layers:

- A **DocumentChunk** can be linked to **GraphNodes** it mentions (via a join table or jsonb references)
- A **Citation** can be resolved to a **GraphNode** of type `paper` or `book`
- A **Conversation/Message** can reference both **DocumentChunks** (RAG context) and **GraphNodes** (graph context)
- A **Highlight** can be associated with **GraphNodes** for the concepts it contains

---

## 5. System Components

### 5.1 Ingestion Pipeline

The ingestion pipeline is the most critical backend system. It transforms raw documents into searchable, queryable, graph-connected knowledge.

```
Upload → Parse → Structure → Chunk → Embed → Index → Extract Graph → Link
```

**Step 1: Upload & Validate**
- Accept PDF, EPUB, DOCX, Markdown, plain text
- Compute file hash for deduplication
- Store the raw file
- Create a `Document` record with `processing_status = pending`
- Enqueue the processing job

**Step 2: Parse & Extract Text**
- Use pdf-parse or unpdf to extract text
- Preserve page boundaries, paragraph breaks, and structural markers
- Extract metadata: title, authors, date, DOI (from PDF metadata fields and heuristics)
- Detect language

**Step 3: Structural Analysis**
- Identify document sections: abstract, introduction, headings, body paragraphs, references, footnotes
- Create `DocumentSection` records preserving hierarchy
- Parse the reference/bibliography section to extract individual citations → `Citation` records

**Step 4: Chunking**
- Chunk the text using a strategy that respects section boundaries
- Recommended: recursive character splitting with ~500-800 token chunks and ~100 token overlap
- Each chunk retains its section context and page number
- Create `DocumentChunk` records

**Step 5: Embedding**
- Generate embeddings for each chunk using the configured embedding model
- Store embeddings in the `embedding` column (pgvector)
- Batch processing for efficiency

**Step 6: Vector Indexing**
- pgvector handles indexing automatically via IVFFlat or HNSW index
- Ensure the index is built/updated after batch inserts

**Step 7: Graph Extraction**
- Send representative chunks (or the full text for shorter docs) to an LLM with a structured extraction prompt
- Extract: key concepts, entities, relationships, topics, methods mentioned
- Use structured output (JSON mode / function calling) for reliable extraction
- Create/update `GraphNode` and `GraphEdge` records
- Deduplicate nodes: merge "attention mechanism" and "Attention Mechanism" and "self-attention" via alias matching
- Link citations to graph nodes

**Step 8: Cross-Document Linking**
- After graph extraction, run a linking pass:
  - Match new nodes against existing nodes (fuzzy name matching + embedding similarity)
  - Resolve citations against documents already in the library
  - Create cross-document edges where concepts overlap

### 5.2 Retrieval System

The retrieval system supports multiple query strategies:

**Vector Search (RAG)**
- Given a query, embed it and find the top-k most similar chunks via pgvector
- Scope: single document, subset of documents, or entire library
- Return chunks with their document context and section info
- Support hybrid search: combine vector similarity with full-text search (PostgreSQL `tsvector`) for better precision

**Graph Search (GraphRAG)**
- Given a query, identify relevant graph nodes (via text matching or embedding similarity on node descriptions)
- Traverse the graph to find connected concepts, related documents, citation chains
- Use graph context to enhance RAG: retrieve chunks that discuss connected concepts, not just similar text
- Support multi-hop queries: "What foundational papers does this concept build on?"

**Hybrid Retrieval**
- For complex questions, combine both strategies:
  1. Vector search for directly relevant passages
  2. Graph traversal for conceptually related context
  3. Merge and rank results
  4. Feed the combined context to the LLM

### 5.3 Chat / LLM Orchestration

**Passage-Level Questions (Assisted Reading)**
- Input: selected text + surrounding context (±1-2 paragraphs) + user question
- Retrieval: optionally fetch related chunks from the same document for broader context
- Prompt construction: system prompt defining the assistant role + document context + selected passage + question
- Stream the response back via WebSocket

**Document-Level Chat**
- Input: user question + conversation history
- Retrieval: RAG search scoped to the current document
- Prompt construction: system prompt + retrieved chunks + conversation history + question
- Maintain conversation context across messages

**Library-Level Chat**
- Input: user question + conversation history
- Retrieval: RAG search across the entire library + graph search for connected concepts
- Prompt construction: system prompt + retrieved chunks + graph context + conversation history + question
- This is the most powerful mode — it can synthesize across all ingested knowledge

**Response Grounding**
- Every AI response should include references to the source chunks used
- The frontend should allow clicking on a reference to jump to that location in the reader
- This ensures transparency and allows the user to verify AI claims

### 5.4 Atlas Memory System

Atlas is not stateless. He remembers. The memory system gives Atlas three layers of recall, modeled after how human memory works: what just happened, what happened recently, and what has been learned over time. This is what makes Atlas feel like a persistent scholarly companion rather than a fresh chatbot on every interaction.

**Short-Term Memory (Conversation Context)**

This is the active working memory — what Atlas is thinking about right now.

- Scope: the current conversation session (a single chat thread)
- Contents: the full message history of the active conversation, the currently selected passage (if any), the document being read, and the most recently retrieved chunks
- Lifespan: exists only while the conversation is active. When the user starts a new conversation, short-term memory resets.
- Implementation: maintained in-memory on the server as part of the conversation state. The message history is sent as context to the LLM on each request (up to the context window limit). Recent messages are kept in full; older messages in the same conversation are summarized to fit within token limits.
- Purpose: Atlas tracks the thread of discussion. If the user asks a follow-up ("What about the second assumption?"), Atlas knows what was previously discussed without the user needing to repeat context.

**Medium-Term Memory (Session & Document Memory)**

This is what Atlas remembers across conversations about a specific document or reading session.

- Scope: per-document or per-reading-session, persists across multiple conversations
- Contents:
  - Summaries of past conversations about this document (auto-generated when a conversation ends)
  - Key questions the user asked and the core insights from Atlas's answers
  - User highlights and annotations on this document (these are explicit user memory)
  - The user's apparent level of understanding of this document's topics (inferred from the types of questions asked — basic vs. advanced)
  - Which sections the user has read, re-read, or struggled with
- Lifespan: persists as long as the document is in the library. Updated after each conversation.
- Storage: stored in the database as structured records linked to the document.
  - `ConversationSummary` table: document_id, summary text, key topics discussed, timestamp
  - `UserFamiliarity` table: document_id, topic/concept, familiarity_level (novice → intermediate → advanced), last_updated
- Purpose: when the user returns to a document days later and asks a question, Atlas can say "Last time we discussed this paper, you were working through the attention mechanism in Section 3 — would you like to continue from there?" Instead of starting cold, Atlas picks up where the user left off.

**Long-Term Memory (Library-Wide Knowledge)**

This is Atlas's accumulated understanding of the user as a reader and thinker across their entire library.

- Scope: global, spans all documents and all conversations
- Contents:
  - **Topic familiarity profile**: a map of concepts/topics and the user's estimated familiarity with each, built up across all documents and conversations. If the user has read five papers on transformer architectures, Atlas knows they don't need basic attention explanations anymore.
  - **Reading patterns**: what subjects the user gravitates toward, how deep they typically go, whether they prefer formal or intuitive explanations
  - **Concept connections the user has made**: when the user explicitly connects ideas across documents (e.g., "This is similar to what Paper X argued"), Atlas records these as user-validated connections in addition to the automatic graph
  - **Recurring questions and interests**: topics the user keeps returning to, open questions they haven't resolved
  - **Preferences**: explanation style (concise vs. detailed, formal vs. informal), preferred level of mathematical notation, whether they like analogies
- Lifespan: indefinite, grows over the lifetime of the library
- Storage:
  - `UserProfile` table: global preferences, reading style, explanation preferences
  - `TopicFamiliarity` table: concept/topic, familiarity_level, confidence, evidence (list of document_ids and conversation summaries that informed this), last_updated
  - `UserInsight` table: user-stated connections, recurring interests, open questions, timestamp
  - The knowledge graph itself serves as part of long-term memory — it is the structural memory of what the user has studied
- Purpose: Atlas adapts over time. A new user gets thorough, gentle explanations. A user who has read 50 ML papers gets concise, technical responses. Atlas can proactively say "This paper's approach is quite different from the methods you've seen in [Papers X, Y, Z] — the key departure is..." because he remembers the user's intellectual history.

**How the Three Layers Interact**

When Atlas receives a question, the memory layers are composed into context in this order:

1. **Long-term**: user profile and topic familiarity are loaded into the system prompt, shaping Atlas's tone, depth, and assumptions about what the user already knows
2. **Medium-term**: summaries of past conversations about this document (if any) are included as background context — "Previously discussed: ..."
3. **Short-term**: the full current conversation history provides immediate context
4. **Retrieval** (RAG + graph): relevant chunks and graph context are fetched and injected

This layered composition means Atlas's responses are simultaneously aware of the immediate question, the history with this document, and the user's broader intellectual profile.

**Memory Maintenance**

- Short-term → medium-term: when a conversation ends (or after a configurable idle timeout), Atlas auto-generates a summary and extracts key insights, updating the document's medium-term memory
- Medium-term → long-term: periodically (or triggered by significant events like finishing a document), the system aggregates medium-term signals to update the user's topic familiarity profile and long-term preferences
- Forgetting: old medium-term memories can be compressed or archived if they become stale (e.g., conversations from months ago about a document the user hasn't revisited). Long-term memory is pruned only if the user explicitly corrects it.
- User control: the user should be able to view and edit what Atlas remembers — see their familiarity profile, correct wrong assumptions, delete specific memories. This lives in Settings under an "Atlas Memory" section.

### 5.5 Atlas Agentic System

Atlas is not a simple retrieve-then-respond pipeline. For anything beyond basic passage explanations, he needs to **reason about what to do**, **act** by calling tools, **observe** the results, and **decide** whether he has enough information to answer — or whether he needs to keep searching. This is the agentic layer that makes Atlas an actual research companion, not just a RAG wrapper.

#### 5.5.1 Why an Agentic Architecture?

Consider the difference between these two questions:

- **Simple**: "What does this paragraph mean?" → Atlas needs only the selected text + surrounding context. A single retrieval step is enough. No agent loop needed.
- **Complex**: "How does this paper's use of attention differ from the original transformer paper, and are there any other documents in my library that take a similar approach?" → Atlas needs to: (1) understand the current passage, (2) find the original transformer paper in the library or graph, (3) retrieve the relevant sections from it, (4) search the graph for related methods, (5) retrieve passages from those documents, (6) synthesize a comparison. That's 4-5 tool calls with reasoning between each.

The simple case is handled by the direct retrieval paths described in section 5.3. The agentic system activates for queries that require **multi-step reasoning, cross-document navigation, or graph traversal**.

#### 5.5.2 The ReAct Loop

Atlas uses a **ReAct (Reasoning + Acting) loop** — the model alternates between thinking about what to do next and executing tool calls, observing results after each step.

```
User Question
     │
     ▼
┌─────────────────────────────────────────────┐
│  REASON: Atlas analyzes the question.       │
│  What information do I need? What do I      │
│  already have from context? What tools      │
│  should I use first?                        │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  ACT: Atlas calls one or more tools.        │
│  e.g., search_library("attention mechanism")│
│  or query_graph("transformer", depth=2)     │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  OBSERVE: Atlas receives tool results.      │
│  Chunks, graph nodes, document metadata.    │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  REASON: Do I have enough to answer?        │
│  Are the results relevant? Do I need to     │
│  search deeper, try a different query, or   │
│  look at a specific document section?       │
│                                             │
│  → If YES: synthesize final answer          │
│  → If NO: loop back to ACT                  │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
         Final Answer (streamed)
         with source references
```

The loop is bounded — Atlas has a configurable **maximum step count** (default: 8 tool calls per query) to prevent runaway loops. If the limit is reached, Atlas synthesizes the best answer from what it has and transparently tells the user what it couldn't find.

#### 5.5.3 Atlas's Tool Belt

Atlas has access to a set of tools that map to Alexandria's backend services. These are defined as structured tool schemas that the LLM can invoke via pi-mono's tool use API.

**Library Search Tools:**

| Tool | Purpose | Parameters |
|------|---------|------------|
| `search_library` | Semantic vector search across the entire library | `query: string, top_k?: number, doc_filter?: string[]` |
| `search_document` | Semantic vector search within a specific document | `document_id: string, query: string, top_k?: number` |
| `full_text_search` | Keyword / full-text search (PostgreSQL tsvector) | `query: string, scope?: "library" \| document_id` |

**Document Reading Tools:**

| Tool | Purpose | Parameters |
|------|---------|------------|
| `read_section` | Read a specific section of a document by heading or index | `document_id: string, section_id?: string, heading?: string` |
| `read_pages` | Read the text content of specific pages | `document_id: string, pages: number[]` |
| `get_document_info` | Get document metadata, table of contents, and processing status | `document_id: string` |
| `list_highlights` | Get the user's highlights and notes on a document | `document_id: string` |

**Knowledge Graph Tools:**

| Tool | Purpose | Parameters |
|------|---------|------------|
| `query_graph` | Find nodes and their connections by name, type, or relationship | `query: string, node_type?: string, depth?: number` |
| `get_node_neighborhood` | Get all nodes and edges within N hops of a specific node | `node_id: string, depth: number, edge_types?: string[]` |
| `find_path` | Find the shortest path between two concepts in the graph | `source: string, target: string, max_depth?: number` |
| `get_citations` | Get citations from a document, optionally filtered by resolution status | `document_id: string, status?: string` |

**Memory Tools:**

| Tool | Purpose | Parameters |
|------|---------|------------|
| `recall_conversations` | Retrieve summaries of past conversations about a document or topic | `document_id?: string, topic?: string` |
| `check_familiarity` | Check the user's familiarity level with a concept | `topic: string` |

**Utility Tools:**

| Tool | Purpose | Parameters |
|------|---------|------------|
| `compare_passages` | Retrieve passages from multiple documents for side-by-side analysis | `queries: {document_id: string, query: string}[]` |
| `resolve_citation` | Look up a citation reference and retrieve its metadata or library status | `citation_text: string` \| `doi: string` |

Each tool returns structured results that include source references (document ID, page numbers, section IDs, chunk IDs). Atlas uses these references to build the clickable `[p.12]` pills in the final response.

#### 5.5.4 Implementation with pi-mono

pi-mono provides the tool use / function calling interface that powers the ReAct loop. The implementation pattern:

```typescript
// Simplified architecture — actual implementation in backend/src/services/ai/agent.ts

import { generateText } from "pi-mono";

// 1. Define tools as pi-mono tool schemas
const atlasTools = {
  search_library: {
    description: "Search across the entire library for passages semantically similar to the query",
    parameters: z.object({
      query: z.string().describe("The search query"),
      top_k: z.number().optional().default(5),
      doc_filter: z.array(z.string()).optional(),
    }),
    execute: async ({ query, top_k, doc_filter }) => {
      // Calls the retrieval service (section 5.2)
      return retrievalService.vectorSearch(query, { top_k, documentIds: doc_filter });
    },
  },
  query_graph: {
    description: "Query the knowledge graph for concepts, entities, and their relationships",
    parameters: z.object({
      query: z.string(),
      node_type: z.string().optional(),
      depth: z.number().optional().default(1),
    }),
    execute: async ({ query, node_type, depth }) => {
      return graphService.queryNodes(query, { type: node_type, depth });
    },
  },
  // ... other tools
};

// 2. The ReAct loop — pi-mono handles this via maxSteps
const response = await generateText({
  model: selectedModel,             // configured via settings
  system: buildSystemPrompt(user),  // includes Atlas character + memory layers
  messages: conversationHistory,     // short-term memory
  tools: atlasTools,
  maxSteps: 8,                       // maximum ReAct iterations
  onStepFinish: ({ toolCalls, toolResults }) => {
    // Stream intermediate status to frontend
    // "Atlas is searching your library..."
    // "Atlas is exploring the knowledge graph..."
    streamStatus(toolCalls);
  },
});

// 3. Final response includes tool call trace for transparency
// Each tool result carries source refs → rendered as [p.12] pills
```

**Key pi-mono features used:**

- **`tools`**: define the tool schemas and their execute functions. pi-mono handles the serialization/deserialization of tool calls and results.
- **`maxSteps`**: the ReAct loop bound. pi-mono automatically loops: generate → tool call → execute → feed result back → generate again, until the model produces a final text response or the step limit is reached.
- **`onStepFinish`**: callback after each step, used to stream status updates to the frontend so the user sees what Atlas is doing ("Searching library...", "Reading Section 3 of Paper X...", "Traversing knowledge graph...").
- **Parallel tool calls**: pi-mono supports the model calling multiple tools in a single step. Atlas can search the library AND query the graph simultaneously when both are needed, reducing latency.
- **Structured output**: for graph extraction and other tasks where Atlas needs to produce structured data, pi-mono's structured output mode (JSON schema enforcement) ensures reliable parsing.

#### 5.5.5 Query Routing: Simple vs. Agentic

Not every question needs the full agentic loop. A routing layer decides which path to take:

```
User Question
     │
     ▼
┌──────────────────────────┐
│     Query Router          │
│                          │
│  Analyzes:               │
│  - Is a passage selected?│
│  - Question complexity   │
│  - Scope (passage/doc/   │
│    library)              │
│  - Keywords suggesting   │
│    multi-doc reasoning   │
└─────┬──────────┬─────────┘
      │          │
      ▼          ▼
 ┌─────────┐ ┌──────────────┐
 │ Simple   │ │   Agentic    │
 │ Path     │ │   Path       │
 │          │ │              │
 │ Single   │ │ ReAct loop   │
 │ retrieve │ │ with tools   │
 │ + answer │ │ (maxSteps=8) │
 └─────────┘ └──────────────┘
```

**Simple path** (no agent loop, lower latency):
- Passage-level questions with a selection ("What does this mean?")
- Direct definition requests ("Define X")
- Questions that only need the current document's context
- Implementation: single retrieval call → construct prompt → stream response

**Agentic path** (full ReAct loop):
- Cross-document questions ("Compare this with Paper X")
- Questions requiring graph traversal ("What are the foundational papers for this concept?")
- Questions involving citation chains ("What does the cited work by Smith et al. argue?")
- Synthesis questions ("Summarize everything I've read about attention mechanisms")
- Questions where the initial retrieval is insufficient (the model can decide mid-answer to search for more)

The router can be implemented as:
1. **Rule-based heuristics** (fast, deterministic): check for keywords like "compare", "across", "other papers", "cited", presence of a text selection, current scope setting
2. **LLM-based classification** (more accurate, adds one LLM call): a cheap/fast model classifies the query as simple or complex with a short prompt. This can run in parallel with the initial retrieval so it doesn't add latency.
3. **Hybrid**: start with heuristics, fall back to LLM classification for ambiguous cases

In practice, start with rule-based routing and upgrade to LLM classification if the heuristics prove too brittle.

#### 5.5.6 Streaming the Agent's Work

The user should never stare at a blank screen while Atlas thinks. The agentic loop produces natural status updates at each step:

- **Tool call initiated**: "Atlas is searching your library for 'attention mechanism'..."
- **Tool result received**: "Found 7 relevant passages across 3 documents."
- **Reasoning step**: "Atlas is now reading Section 3 of 'Attention Is All You Need'..."
- **Final synthesis**: the answer streams in word-by-word as usual

These status messages appear in the chat panel as a **compact, collapsible activity log** above Atlas's final response. The log uses small, muted text (secondary color, sans-serif) so it doesn't compete with the answer. It can be collapsed to just show the final answer, or expanded to see exactly what Atlas did — full transparency into the reasoning chain.

This is important for trust. The user can verify:
- Which documents Atlas consulted
- What graph paths Atlas traversed
- Whether Atlas missed something the user expected

If Atlas's answer seems wrong, the activity log helps the user understand *why* and ask a better follow-up.

#### 5.5.7 Agent Guardrails

- **Step limit**: configurable max steps (default 8). Prevents infinite loops. If reached, Atlas answers with what it has and notes what it couldn't complete.
- **Token budget**: each agent run has a max token budget across all steps (input + output). Prevents cost blowup on runaway reasoning.
- **Tool result truncation**: large search results are truncated to the top-k most relevant chunks. Atlas can request more if needed by refining the query.
- **No writes in the agent loop**: Atlas's tools during a conversation are **read-only**. He searches, reads, and traverses — he never modifies documents, the graph, or user data during a query. Write operations (updating memory, saving insights) happen asynchronously after the conversation, not during the ReAct loop.
- **Scope awareness**: in passage mode, Atlas's tools are restricted to the current document unless the query explicitly requires cross-document reasoning. This prevents unnecessary library-wide searches for simple questions.
- **Graceful degradation**: if a tool call fails (e.g., graph query timeout), Atlas notes the failure and attempts an alternative approach rather than crashing the loop.

### 5.6 Citation Resolution Service

- Parse citation text to extract: authors, title, year, DOI, arXiv ID
- Query external APIs to identify the work:
  - CrossRef (DOI lookup)
  - Semantic Scholar API (paper metadata + references)
  - OpenAlex (open scholarly metadata)
  - arXiv API (preprints)
- If the cited work is found:
  - Update the `Citation` record with resolved metadata
  - Optionally offer to download and add the paper to the library
  - Create a graph node for the cited work and link it

---

## 6. Design Vision & UI Language

Alexandria's interface is not decoration — it is meaning. Every visual decision should reinforce the feeling that the user is inside a personal scholarly archive: a place of quiet focus, accumulated wisdom, and intellectual exploration. The aesthetic draws directly from architectural renders of the ancient Library of Alexandria (see `reference/` folder) — the warm limestone columns, the rich mahogany scroll cabinets, the Mediterranean teal friezes, the golden torchlight, the mosaic floors — translated into a modern UI language. Not a literal recreation, but an atmosphere distilled from it. The goal is presence through material honesty: every color, texture, and shape should feel like it belongs to that world.

### 6.1 Design Principles

- **Calm over stimulation**: the interface should feel like entering a quiet study, not a dashboard. Low contrast, muted tones, generous whitespace. Nothing blinks, bounces, or demands attention unnecessarily.
- **Meaning in every element**: no decorative filler. If something looks like a scroll, it's because it represents a document. If the graph looks like a night sky, it's because knowledge is best explored the way you explore constellations — by looking up and tracing connections.
- **Warmth with depth**: the palette should feel lived-in and analog, even though the tool is digital. Think torchlit sandstone halls, aged scroll cabinets in dark wood, teal decorative bands, golden light spilling across mosaic floors. Not flat corporate grays.
- **Progressive revelation**: the interface should be simple on the surface and deep underneath. New users see a clean library of scrolls. Power users discover the constellation map, the citation lineage, the graph queries. Complexity is there, but it doesn't shout.
- **Reading-first hierarchy**: the document text is always the primary focus. Chat, annotations, and tools are secondary — present when needed, invisible when not.

### 6.2 Color Palette & Typography

**Primary Palette (Light Mode — "The Archive")**

Derived from the Library of Alexandria reference renders. The palette comes from real materials: sandstone, mahogany, teal ceramic, terracotta clay, torchlight gold.

- **Background**: warm sandy limestone (`#E8DFD0` range) — the color of the carved sandstone walls and columns in the renders. Not paper-white, not yellow — the warm, slightly pink-beige of sunlit Egyptian limestone.
- **Surface / cards / panels**: lighter sand (`#F0E9DC` range) — the color of the lighter column faces and upper walls where light hits directly. Used for elevated surfaces: cards, modals, the PDF page surface.
- **Shelf wood / structural elements**: rich mahogany brown (`#5C3A28` range) — from the dark wooden scroll cabinets in the renders. The lattice-patterned storage units are this exact color. Use for shelf backgrounds, sidebar frames, structural borders, and navigation elements that need weight.
- **Text primary**: deep umber (`#2A1F1A` range) — drawn from the darkest wood tones in the cabinets. Warm, near-black but never pure black. Ink on parchment.
- **Text secondary**: warm stone-gray (`#7A6E62` range) — the shadow color on the limestone columns. For secondary text, timestamps, metadata.
- **Accent primary — Mediterranean teal**: muted teal-blue (`#3D7A7A` range) — from the decorative frieze bands that run horizontally between floors in the renders. A distinctive, unexpected color in the warm palette. Use for links, active states, interactive elements, and the primary action color. This is the signature accent — it makes Alexandria feel specifically Alexandrian, not generically warm.
- **Accent secondary — torchlight gold**: warm amber-gold (`#C4943A` range) — from the torchlight and oil lamp glow in the renders. Use for highlights, starred/important items, the "recently read" glow on scrolls, and active navigation markers.
- **Accent tertiary — terracotta**: muted clay-red (`#A05B4A` range) — from the terracotta trim lines and molding accents visible between sections in the renders. Use for warnings, citation markers, deletion confirmations, and secondary highlights.
- **Accent quaternary — frieze green**: the greenery and Corinthian capitals (`#5A7A5A` range) — a muted sage green, drawn from the plants and column foliage in the renders. Use sparingly for success states, "completed" markers, and one of the highlight colors.
- **Borders / dividers**: warm taupe (`#C4B8A8` range) — the mortar color between stones. Subtle, never harsh.
- **Mosaic pattern**: the intricate geometric floor patterns from the renders can inspire subtle background patterns for specific areas — the library floor (beneath shelves), empty states, or the settings page. Implemented as very faint SVG patterns at low opacity, not as literal tile textures.

**Dark Mode — "The Observatory"**

The dark mode is a completely different environment — not the archive at night, but the sky above it. The transition from light to dark mode is conceptually stepping outside the library and looking upward. The colors shift from earth tones to celestial ones.

- **Background**: deep indigo-black (`#0B0E1A` range) — darker and cooler than the previous plan. The color of a moonless sky at high altitude. Pure enough to make stars pop, warm enough (via the indigo tint) to avoid feeling cold or clinical.
- **Surface / cards / panels**: dark navy-plum (`#161A2E` range) — a slightly warmer, more purple-shifted surface than pure dark blue. Panels and cards feel like they float against the night sky rather than sitting on it.
- **Text primary**: pale parchment-white (`#E4DDD0` range) — warm-shifted white that echoes the Archive's limestone. Text should feel like it belongs to the same world, just illuminated differently.
- **Text secondary**: muted lavender-gray (`#8A8599` range) — a cool secondary that works in the celestial context. For metadata, timestamps, dimmer labels.
- **Accent primary — celestial gold**: bright warm gold (`#D4A847` range) — the color of the brightest stars and of torchlight seen from a distance. Active elements, highlights, the user's focus.
- **Accent secondary — constellation silver**: pale steel-blue (`#7B9BBF` range) — the color of constellation lines, secondary links, edge connections, dimmer interactive elements.
- **Accent tertiary — nebula rose**: dusty pink-mauve (`#B07A8A` range) — for topic nodes in the constellation, notification badges, and warm highlights that need to stand out without competing with gold.
- **Star colors** (constellation-specific):
  - Concepts: warm white (`#F0EDE6`) — main-sequence star warmth
  - Papers/books: pale blue-white (`#C8D8F0`) — hot, bright source material
  - Authors: amber-gold (`#D4A847`) — matching the primary accent
  - Topics: soft rose (`#D4A0B0`) — matching nebula rose
  - Methods: ice-blue (`#A0C4E0`) — technical, precise
- **Glow effects**: star nodes use a radial gradient glow in their type color at ~20% opacity. The glow radius scales with importance.

The dark mode is not just "inverted light mode" — it is a distinct environment. The library is the archive (warm, grounded, daytime study). The dark mode is the observatory (looking up at knowledge from below, seeing the constellation of ideas). The knowledge graph view should default to dark mode because it is literally the night sky.

**Typography**
- **Headings**: a serif typeface with scholarly character — something like Playfair Display, Cormorant Garamond, or EB Garamond. These fonts carry the weight of printed books without being stuffy.
- **Body / UI**: a clean, highly legible sans-serif — Inter or IBM Plex Sans. Modern and functional for interface elements, controls, chat messages.
- **Document titles on scrolls**: the serif typeface, potentially at a slightly condensed weight, to evoke hand-lettered labels
- **Monospace (code/references)**: JetBrains Mono or IBM Plex Mono — for citations, DOIs, technical identifiers

### 6.3 The Scroll Shelf — Library Metaphor

The library view is where the metaphor is strongest. Documents are not cards in a grid — they are **scrolls in cabinets**.

The reference renders show a very specific storage design: **tall mahogany cabinets with diamond-lattice fronts**, organized in rows along the walls of the library, flanked by sandstone columns. This is the visual anchor for the library view. The scrolls don't sit exposed on open shelves — they rest inside structured wooden compartments, visible through the lattice pattern. This gives the library a sense of order, craftsmanship, and protection.

**The Scroll**
- Each document is represented as a scroll: a horizontal cylindrical shape with visible parchment rolled around it
- The scroll has a small **label tag** hanging from it (a hanging tag on a short cord, or a thin strip affixed to the scroll face), showing the paper title in the serif typeface. In the renders, scrolls have visible tags — this is historically accurate and functional.
- Scrolls have subtle visual variation: slightly different parchment tones (some more cream, some more tan), varying thickness based on page count, visible paper grain
- The scroll's **seal or ribbon** indicates document type through color:
  - Academic papers: teal ribbon (the Mediterranean teal accent — this makes papers feel distinctly "Alexandrian")
  - Books: gold ribbon (torchlight gold)
  - Articles: terracotta ribbon
  - Notes: a simple twine / no ribbon (personal, informal)
  - Imported references (unread): a faded / semi-transparent scroll (not yet fully "materialized" in the library — as if the scroll hasn't fully arrived yet)
- A subtle **warm glow** on scrolls that were recently read or have unread Atlas insights — like torchlight catching the edge of the parchment

**The Cabinet**

The primary organizational unit is the cabinet, not the shelf. Inspired directly by the renders:

- Cabinets are tall, rectangular, mahogany-brown containers with a **diamond-lattice pattern** on their front face — referencing the ornate wooden storage units visible in the reference images
- The lattice is rendered as a subtle CSS grid or SVG pattern overlaying the cabinet background. Through the lattice, the scrolls inside are visible — this gives the library depth and texture
- Each cabinet represents a **collection or topic**: "Machine Learning", "Philosophy", "To Read", etc.
- The cabinet has a **header bar** styled like the teal frieze band from the renders — a horizontal band in the Mediterranean teal accent with the collection name in a light serif typeface
- Cabinets are arranged in a grid or column layout. On wide screens, 2-3 cabinets per row. On narrow screens, single column.
- Within a cabinet, scrolls are arranged in rows (like the diamond compartments in the renders hold individual scrolls)

This is different from generic card grids because it has **material specificity** — the mahogany, the lattice, the teal band. It looks like a specific place, not a template.

**The Architectural Frame**

The library view borrows additional elements from the renders to create a sense of place:

- **Column framing**: the left and/or right edges of the viewport can feature a subtle sandstone column element — a vertical border with a Corinthian capital at the top. This is purely decorative framing, but it places the user "inside" the library. Implemented as a thin (~40-60px) side element with a very faint limestone texture or gradient. Optional / hideable.
- **Teal frieze header**: the top navigation area (or a decorative band just below it) uses the teal accent as a horizontal band, echoing the architectural frieze that separates floors in the renders. The main nav items (Library, Constellation, Atlas Chat, Settings) sit within or just below this band.
- **Floor hint**: the very bottom of the library view can have a subtle mosaic-inspired pattern or a warm gradient that suggests the geometric floor visible in the renders. Not literal — just a warmth at the bottom edge that anchors the cabinets visually.
- These architectural elements should be subtle and optional. They set the mood but must never interfere with functionality. They can be toggled off in settings for users who prefer a cleaner layout.

**Interaction**
- Hovering over a scroll gently "pulls" it forward through the lattice — a slight scale-up and shadow increase, showing a tooltip with: title, authors, date, reading progress
- Clicking a scroll opens it — transition animation of the scroll "unrolling" into the reader view (subtle, fast, ~300ms of the page unfurling from center)
- Drag-and-drop to rearrange scrolls or move between cabinets
- Right-click a scroll for context menu: open, move to cabinet, view in constellation, delete
- An **"Add scroll"** button styled as an empty slot in the cabinet — inviting, not hidden

**Empty State**
- When the library is empty, show a single empty cabinet with the lattice pattern visible but no scrolls inside. A gentle prompt centered in the cabinet: "Your archive awaits its first scroll." — with a drop zone. The column framing and frieze are still present, so the room feels real even before it's filled.

### 6.4 The Reader — The Scholar's Desk

Opening a document should feel like sitting down at one of the wooden study tables visible in the reference renders — scholars hunched over unrolled scrolls, studying by torchlight, surrounded by the architecture of the library. The reader is the working heart of Alexandria. The architectural frame recedes, the cabinet closes behind you, and the text fills the space.

**Layout**
- **Two-panel split**: the PDF occupies the main area (left or center, ~65-70% width), the chat panel sits to the right (~30-35% width)
- The chat panel is **collapsible** — the user can dismiss it to read in full-width focus mode, and recall it with a side-tab or keyboard shortcut
- The divider between PDF and chat is **draggable** for custom proportions
- A **thin top bar**: document title (serif font), page navigation, zoom, search-in-document, a button to toggle the chat panel
- A **minimal bottom bar**: current page / total pages, a subtle reading progress indicator (thin line or percentage)

**PDF Area**
- The PDF is rendered with a clean, parchment-tinted background — the page sits on a slightly darker surface in the mahogany-brown tone, like a scroll unrolled on a wooden desk. The contrast between the light page and the dark desk surface echoes the scroll-in-cabinet visual from the library.
- Continuous vertical scroll by default (page-by-page as an option)
- Text layer overlay for selection — invisible until the user clicks and drags
- Smooth zoom with pinch or ctrl+scroll

**Text Selection Flow**
This is the most important micro-interaction in the product — it must feel effortless.

1. User clicks and drags to select text in the PDF
2. A **floating context bar** appears near the selection (above or below, avoiding occlusion). It contains:
   - **"Ask"** — primary action, visually prominent. Opens (or focuses) the chat panel with the selected passage quoted as context. The user types their question below.
   - **"Highlight"** — secondary action. Saves the selection as a persistent highlight. A small color picker appears (4 colors drawn from the palette: torchlight gold, Mediterranean teal, terracotta, frieze green). Optional: a small text field for a note.
   - **"Define"** — tertiary action. Triggers an inline, lightweight response (a small popover, not the full chat) with a quick definition or explanation. Think dictionary lookup, not a conversation.
   - **"Find in Library"** — searches for semantically similar passages across all other documents. Results appear in the chat panel or a temporary overlay.
3. When "Ask" is triggered, the selected text appears in the chat panel as a **quoted block** (visually distinct, like a blockquote with a left border in gold or blue), and the cursor is placed in the input field below, ready for the user's question.
4. The selection remains highlighted in the PDF (with a temporary accent color) while the conversation about it is active.

**Highlights Layer**
- Saved highlights render as semi-transparent color overlays on the PDF text
- A small **annotation icon** appears in the margin next to highlighted passages (if the highlight has a note)
- Clicking a highlight in the PDF shows its note in a small popover, with options to edit or delete
- A collapsible **highlights sidebar** (left edge or overlay) lists all highlights for the document, grouped by page. Clicking one scrolls to it.

**Ambient Details**
- The reader area should feel focused and quiet — minimal chrome, generous margins around the PDF
- No competing visual elements when reading. The chat panel uses the lighter sand surface color to differentiate from the mahogany desk surface of the PDF area — a soft boundary, not a hard wall.
- The thin top bar can carry a subtle teal underline (the frieze motif), connecting it visually to the library's architecture even in the reader view
- Subtle transitions: scrolling is smooth, panels slide in/out, no jarring jumps

### 6.5 The Chat Panel — Atlas, The Scholarly Companion

The AI assistant in Alexandria is named **Atlas** — the Titan who held the celestial sphere on his shoulders. In Alexandria, Atlas holds the weight of the user's accumulated knowledge. He is not a generic chatbot; he is the scholar who has read everything in your library and remembers all of it. The name reinforces the product's mythology: Alexandria is the library, the constellation map is the sky Atlas holds, and Atlas himself is the guide who helps you navigate both.

The chat panel is not a separate app — it is a margin note system that happens to be powered by Atlas. It should feel like having a knowledgeable colleague sitting next to you while you read.

**Visual Design**
- Sits to the right of the PDF in the reader view, or accessible as a standalone page for library-wide conversations
- Background: slightly different tone from the PDF area — in light mode, a touch warmer or cooler to create subtle separation. In dark mode, a slightly lighter surface.
- Messages flow vertically. User messages are right-aligned (brief, clean). Assistant messages are left-aligned with more room to breathe.
- **Atlas's messages** use the serif typeface for body text — reinforcing that this is scholarly output, not chatbot chatter
- **Source references** in assistant messages appear as small, inline pill-shaped links (e.g., `[p.12]`, `[Section 3.2]`). Clicking one scrolls the PDF to that location and briefly pulses the referenced text. These are critical for trust and verification.
- **Quoted context**: when a message is about a selected passage, that passage appears at the top of the message as a blockquote with the page reference

**Modes & Scope**
- A small **scope indicator** at the top of the chat panel or near the input field shows the current context:
  - **Passage** — "Atlas is reading p.7 with you" — focused on a specific highlighted passage
  - **Document** — "Atlas is exploring [Document Title]" — searching across this document
  - **Library** — "Atlas is searching your library" — searching across everything
- The scope can be changed explicitly (a small toggle or dropdown) or implicitly (selecting text switches to passage mode, asking a general question without selection uses document mode)
- Switching scope is a calm transition — the indicator updates, perhaps a subtle background color shift, but no modal or disruptive UI change

**Input Area**
- A clean text input at the bottom with a send button
- The input expands vertically as the user types longer messages (up to a reasonable max)
- Keyboard shortcut: Enter to send, Shift+Enter for newline
- When a passage is selected, a small preview of the selected text appears above the input (dismissible)

**Conversation History**
- Each document accumulates conversations over time
- A small **history icon** or sidebar toggle reveals past conversations for this document, listed by date and topic/first message
- Library-wide conversations appear in a dedicated "Library Chat" section accessible from the main navigation

**Streaming & Feedback**
- Atlas's responses stream in word-by-word with a subtle typing indicator (a gentle pulsing dot, not a spinner)
- Source references appear as the response streams — they are clickable immediately
- If the response is long, it renders with proper markdown formatting (headings, lists, code blocks, LaTeX equations)

### 6.6 The Constellation Map — Knowledge Graph

This is the most visually distinctive feature of Alexandria. The knowledge graph is not a standard node-link diagram — it is a **night sky**. Concepts are stars. Relationships are constellation lines. Exploring your knowledge feels like stargazing.

**The Concept: "Looking Up"**

The metaphor is intentional. When the user is in the library, they are grounded — scrolls on shelves, a desk, a room. When they want to see the bigger picture, they **look up**. The transition from library to graph should feel like stepping outside and tilting your head toward the sky. The entire background becomes the deep midnight blue-black of the observatory dark mode. Stars appear. Constellations form.

This is not just visual flair — it carries meaning. The library is where you do the work. The sky is where you see the shape of what you've learned. It's the difference between reading a map and standing on a mountain.

**Visual Design**

- **Background**: deep, dark, gradient-rich — the color of a clear night sky. Subtle grain or noise texture to avoid feeling flat. Possibly a very faint radial gradient suggesting a horizon at the bottom edge.
- **Nodes as stars**: each node is a point of light. Small, bright, with a soft glow/bloom effect.
  - **Size** encodes importance: highly connected concepts are brighter, larger stars. Minor or peripheral nodes are dimmer, smaller points.
  - **Color** encodes type — but subtly, as real stars have color:
    - Concepts: warm white / pale yellow (like a main-sequence star)
    - Papers/books: cool blue-white (like a hot star — the source material)
    - Authors: soft amber/gold
    - Topics: pale rose/pink
    - Methods: ice blue
  - **Pulse/twinkle**: recently added or recently interacted-with nodes have a gentle pulse or brightness fluctuation — like a star that catches your eye
- **Edges as constellation lines**: thin, straight (or very slightly curved) lines connecting related nodes. Semi-transparent. The lines suggest structure without cluttering.
  - Edge **opacity** encodes strength: strong relationships are more visible, weak ones fade into the background
  - Edge **color** can subtly match the relationship type or remain a uniform silver-blue
  - When hovering over a node, its connected edges brighten and unrelated edges fade — the constellation this star belongs to becomes visible
- **Constellation clusters**: groups of highly interconnected concepts naturally form visual clusters — these are the constellations. They can optionally be given labels (the topic or theme they represent), rendered as faint text near the cluster center, like constellation names on a star map.

**Navigation & Interaction**

- **Zoom**: scroll to zoom in/out. Zooming in reveals more labels, more detail on nodes. Zooming out shows the full sky with only the brightest stars labeled.
- **Pan**: click and drag to move across the sky
- **Search**: a search bar (semi-transparent, floating, top of screen) lets the user type a concept. The sky smoothly pans and zooms to center on the matching star, which flashes briefly. Its constellation (connected neighbors) lights up.
- **Click a star**: opens a **detail panel** (slides in from the right, similar in position to the chat panel) showing:
  - Node name and type
  - Description (AI-synthesized from the passages that mention it)
  - List of documents where this concept appears, with page references
  - Connected nodes (neighbors in the graph), clickable
  - Option: "Ask Atlas about this concept" → opens a library-level chat pre-seeded with this concept as context
- **Click a constellation line**: shows the relationship type and the evidence (the passage that established this connection), with a link to the source document
- **Hover a star**: shows a small tooltip with the node name. Brightens its constellation.
- **Double-click a document-type star**: opens that document in the reader

**Semantic Zoom (Level of Detail)**

The sky should respond to zoom level intelligently:
- **Far out (overview)**: only the brightest stars (most important nodes) are visible and labeled. Constellation clusters are visible as groupings. This is the "what have I been studying?" view.
- **Medium distance**: more stars appear, constellation lines become visible, cluster labels show. This is the "how do my topics connect?" view.
- **Close up (detail)**: all nodes in the region are visible, edge labels appear, individual papers and authors become readable. This is the "deep dive into a specific area" view.

This mimics how a real night sky works — you see the brightest stars first, then more detail as your eyes adjust (or as you use a telescope).

**Transition into the Sky**

The transition from library view to constellation view should be memorable:
- Option A: the shelves fade downward (or the camera perspective tilts upward), and the dark sky with stars fades in from above — literally "looking up"
- Option B: the background darkens gradually, scrolls dissolve, and stars begin to appear in their positions — like lights going out in a room and the sky becoming visible
- The transition should be smooth (~500-800ms), not flashy. It's a change of perspective, not a special effect.

**Mini-Constellation in the Reader**

While reading a document in the reader view, a small, subtle element could show the "local constellation" for that document: a tiny star map in a corner or accessible via a button, showing just the nodes and connections extracted from the current document. Clicking it could expand into the full sky view, centered on this document's neighborhood.

### 6.7 Transitions & Spatial Metaphor

Alexandria's views should feel like moving through a physical space, not switching between disconnected screens.

**The Spatial Model**
- The **Library (cabinets)** is the ground floor — where you stand among the mahogany scroll cabinets, flanked by columns, under the teal frieze
- The **Reader (desk)** is sitting down at a study table — pulling a scroll from a cabinet and unrolling it on the wooden surface
- The **Constellation (sky)** is above — stepping outside the columns and looking up to see the map of everything

Navigation between these should reinforce this spatial relationship:
- Library → Reader: a scroll is pulled from the cabinet lattice and unrolls onto the desk (subtle zoom + unfurl animation)
- Reader → Library: the scroll rolls back up, the view pulls back to the cabinets
- Library → Constellation: the columns and cabinets recede downward (or the perspective tilts upward past the frieze and arched ceiling), and the dark sky with stars fades in from above — literally walking out of the library and looking up
- Constellation → Library: stars fade, the column framing and cabinets rise back into view
- Reader → Constellation: the document's local star cluster is centered, the rest of the sky populates around it
- Constellation → Reader: clicking a document star "descends" back to the desk with that scroll open

These transitions should all be optional to skip (for users who prefer instant navigation), but enabled by default. They are fast (under 1 second) and non-blocking — the target view begins loading immediately.

### 6.8 Iconography & Micro-Details

- **Icons** should feel hand-drawn or engraved — slightly organic line weights, not perfectly geometric. Think Greco-Egyptian carved relief style: the kind of simplified pictographs you'd see etched into stone or stamped into a wax seal. The reference renders show statues, carved capitals, and relief decorations — icons should feel like they belong in that world.
- **Atlas's avatar**: a small icon or monogram representing Atlas — perhaps a simplified figure holding a sphere, or a stylized "A" with a celestial arc above it. This appears next to Atlas's messages in the chat and in the navigation when Atlas has insights to share.
- **Loading states**: instead of spinners, use contextual animations:
  - Document processing: a scroll slowly unrolling
  - AI thinking (Atlas): a small oil lamp flame flickering — drawn from the torch/lamp lighting visible in the reference renders. The scholar's flame while Atlas thinks.
  - Graph building: stars slowly appearing one by one
  - Ingestion progress: a gentle animation of a scroll being placed into a cabinet slot
- **Empty states** should feel inviting, not sterile. An empty cabinet still has its lattice and wood grain. An empty sky still has the gradient and perhaps one or two very faint stars (placeholder/tutorial nodes).
- **Sounds** (optional, off by default): very subtle ambient sounds could enhance the atmosphere — a faint page-turning rustle when scrolling through a document, a soft chime when a star is clicked in the constellation. This is a stretch goal and must be toggleable.

### 6.9 Responsive Considerations

- **Desktop-first**: Alexandria is primarily a desktop reading environment. The full two-panel reader + chat layout requires a reasonable screen width (1280px+).
- **Tablet**: the chat panel becomes an overlay/drawer rather than side-by-side. The constellation view works well with touch (pinch to zoom, drag to pan).
- **Mobile**: a simplified view — library as a vertical scroll list (compact scroll representations), reader is full-width with chat as a bottom sheet. The constellation view adapts to the smaller screen but retains its visual identity.

---

## 7. Feature Specifications

### 7.1 Library View

The main landing page. The user's personal archive of scrolls.

**Layout & Interaction:**
- Scroll-in-cabinet layout as described in the design vision (section 6.3)
- Cabinets organized by user-defined collections, topics, or smart filters
- Filter by: type (paper, book, article, note), topic, author, date added, processing status
- Sort by: date added, title, last read, relevance
- Search bar: full-text search across titles, authors, and content — styled as a subtle floating element over the frieze band, not a dominant toolbar
- Upload area: drag-and-drop anywhere on the library view, or a dedicated "Add scroll" button styled as an empty cabinet slot. Dropped files animate into a new scroll materializing inside a cabinet.
- Visual status indicators: processing scrolls have a subtle shimmer (as if the ink is still drying). Failed processing shows a faint terracotta seal mark.
- Batch operations: select multiple scrolls (shift+click or lasso) for tagging, moving between cabinets, or deletion

**Navigation:**
- A top navigation band styled as the teal frieze, with entries for: Library, Constellation, Atlas Chat, Settings
- The "Constellation" entry sits at the top-right of the frieze (or is represented as a stars icon at the very top of the screen), reinforcing the "look up" metaphor — the sky is always above
- An Atlas icon in the navigation indicates when Atlas has new insights or suggestions from recent reading

### 7.2 Reader View

The core reading interface. Described in detail in the design vision (section 6.4).

**PDF Rendering:**
- Render PDF pages with text layer overlay (for selection)
- Support zoom, scroll, page jump
- Continuous vertical scroll by default, page-by-page as option
- Keyboard shortcuts: arrow keys for page navigation, +/- for zoom, Esc to close chat panel, / for search

**Text Selection & Interaction:**
- Selection flow as described in section 6.4 (floating context bar with Ask, Highlight, Define, Find in Library)
- Selected text anchoring: selections persist visually while a related conversation is active

**Highlights & Annotations:**
- Persistent highlights visible on the document in palette colors (torchlight gold, Mediterranean teal, terracotta, frieze green)
- Annotation margin indicators for highlights with notes
- Collapsible highlights sidebar listing all highlights grouped by page
- Export highlights as Markdown or JSON

**Table of Contents:**
- Extracted from document structure during ingestion
- Displayed in a collapsible left sidebar or dropdown
- Click to jump to section

### 7.3 Chat Panel (Atlas)

Atlas, the AI companion. Described in detail in the design vision (section 6.5).

**Modes:**
- **Passage mode**: triggered by selecting text and choosing "Ask". Context = selection + surrounding paragraphs.
- **Document mode**: general questions about the current document. Context = RAG over the document.
- **Library mode**: questions across the entire library. Context = RAG over all documents + graph.

**Key behaviors:**
- Source references as clickable inline pills that scroll the PDF
- Streaming responses with markdown rendering (including LaTeX)
- Conversation persistence per document
- Context scope indicator with smooth mode transitions

### 7.4 Knowledge Graph View (Constellation)

The night sky visualization. Described in detail in the design vision (section 6.6).

**Core features:**
- Star nodes with size/brightness encoding importance
- Constellation-line edges with opacity encoding strength
- Semantic zoom with progressive level of detail
- Search with pan-and-zoom to target star
- Click-to-inspect detail panel
- Cluster labels for topic constellations
- Smooth spatial transition from library view

**Exploration Features:**
- Filter by: node type, document source, relationship type
- "Ego network" view: isolate everything connected to a specific star within N hops
- Timeline mode: animate how the sky grew over time as documents were added
- Cluster detection: automatically identify and label constellation groups

**Statistics (accessible from constellation view):**
- Most connected concepts (brightest stars)
- Most cited papers in the library
- Topic distribution across constellations
- Reading activity over time

### 7.5 Citation Explorer

A dedicated view (or panel within the reader) for working with references.

- List all citations from the current document
- Show resolution status: detected → identified → resolved → in library
- For resolved citations: show metadata (title, authors, year, venue)
- "Add to library" button for resolved citations that can be downloaded — the new scroll appears on the shelf with a "new" indicator
- "Reading queue" shelf: a special shelf in the library for documents queued from citations
- Visual citation sub-graph: within the constellation, highlight the citation lineage of the current document (which stars it cites, which cite it)

### 7.6 Settings & Configuration

- **LLM Provider**: select provider (OpenAI, Anthropic, local/Ollama), enter API keys, choose model
- **Embedding Model**: select embedding model, configure dimensions
- **Ingestion Settings**: chunk size, overlap, graph extraction depth
- **Storage**: file storage location, database connection
- **Appearance**: theme (light/dark/auto), animation speed (full/reduced/none), font size in reader, sounds (on/off)
- **Export**: export library metadata, highlights, graph data

---

## 8. Development Phases

### Phase 1: Foundation (Weeks 1-3)

**Goal:** Runnable application with basic document upload and reading.

- [ ] Project scaffolding
  - Set up Bun monorepo with workspaces (`frontend/`, `backend/`, `packages/shared/`)
  - Initialize Next.js frontend with TypeScript, Tailwind, shadcn/ui (using Bun)
  - Initialize backend with Hono/Elysia, TypeScript, and Bun
  - Set up Docker Compose with PostgreSQL (+ pgvector extension) and Redis
  - Configure Drizzle ORM with schema definitions and Drizzle Kit for migrations
  - Create shared types package for domain models and API contracts

- [ ] Database schema
  - Define Drizzle schema for: Document, DocumentSection, DocumentChunk
  - Generate and run initial migrations with Drizzle Kit
  - Configure pgvector extension and embedding column

- [ ] File upload & storage
  - Upload endpoint (Hono/Elysia): accept PDF files, validate, store on disk
  - Create Document record with Drizzle
  - Frontend: upload UI with drag-and-drop

- [ ] Basic PDF parsing
  - Integrate pdf-parse/unpdf for text extraction
  - Extract basic metadata (title, page count)
  - Store raw text and page boundaries

- [ ] Library view (basic)
  - Grid of uploaded documents with title, type, date
  - Upload button/area
  - Document status indicators

- [ ] Reader view (basic)
  - PDF rendering with react-pdf
  - Page navigation, zoom, scroll
  - Text selection (no AI interaction yet)

### Phase 2: AI-Assisted Reading (Weeks 4-6)

**Goal:** The core reading experience — highlight text and ask questions with AI.

- [ ] Chunking pipeline
  - Implement recursive text chunking with section awareness
  - Create DocumentChunk records with positional metadata

- [ ] Embedding pipeline
  - Integrate embedding model via pi-mono (OpenAI text-embedding-3-small or alternatives)
  - Generate and store embeddings for all chunks
  - Build pgvector HNSW index

- [ ] LLM integration with pi-mono
  - Configure pi-mono with desired providers (OpenAI, Anthropic, local)
  - Set up streaming support for chat completions
  - Configure structured output (JSON mode) for graph extraction tasks
  - Define Atlas tool schemas (search_document, read_section, read_pages)

- [ ] Passage-level Q&A (simple path — no agent loop)
  - Frontend: text selection → "Ask about this" → chat panel opens
  - Backend: receive selected text + surrounding context + question
  - Construct prompt with context and send to LLM
  - Stream response back to frontend
  - Display response in chat panel

- [ ] Document-level chat (simple path with single retrieval)
  - RAG retrieval scoped to current document
  - Conversation persistence (Conversation + Message models)
  - Conversation history in chat panel
  - Source chunk references in responses (clickable [p.N] pills)

- [ ] Atlas short-term memory
  - Conversation context management (message history within token limits)
  - Automatic summarization of older messages when conversation grows long
  - Selected passage tracking within active conversation

- [ ] Highlights
  - Save highlights with optional notes
  - Render highlights on PDF pages
  - Highlight management sidebar

### Phase 3: Library Intelligence (Weeks 7-9)

**Goal:** Cross-document search and library-level AI chat.

- [ ] Full ingestion pipeline
  - Async job queue (BullMQ) for document processing
  - Complete pipeline: parse → structure → chunk → embed → index
  - Progress tracking and error handling
  - Support for additional formats: EPUB, DOCX, Markdown

- [ ] Cross-document RAG
  - Library-wide vector search
  - Hybrid search: combine vector similarity with PostgreSQL full-text search
  - Result ranking and deduplication across documents

- [ ] Atlas agentic system (ReAct loop)
  - Implement the ReAct agent loop using pi-mono's `maxSteps` and `tools` API
  - Define and implement all library search tools: `search_library`, `search_document`, `full_text_search`
  - Define and implement document reading tools: `read_section`, `read_pages`, `get_document_info`
  - Define and implement memory tools: `recall_conversations`, `check_familiarity`
  - Define and implement utility tools: `compare_passages`
  - Query router: rule-based heuristic to classify simple vs. agentic path
  - Step limit and token budget guardrails
  - Streaming status updates during agent loop ("Atlas is searching...", "Atlas is reading...")

- [ ] Library-level chat (agentic path)
  - Chat mode that uses the ReAct agent to search across all documents
  - Source references spanning multiple documents with clickable pills
  - "Find related" feature: select text → find similar passages across the library
  - Activity log UI: collapsible trace showing what Atlas did (tools called, docs consulted)

- [ ] Atlas medium-term memory
  - Auto-generate conversation summaries when a conversation ends or goes idle
  - Create ConversationSummary records with key topics and insights
  - Track user familiarity per document (which sections read, questions asked)
  - Include past conversation summaries as context when user returns to a document

- [ ] Enhanced library view
  - Filtering and sorting
  - Search across document titles and content
  - Document metadata editing
  - Reading progress tracking

- [ ] Settings page
  - LLM provider configuration
  - API key management (encrypted storage)
  - Basic ingestion settings

### Phase 4: Knowledge Graph (Weeks 10-13)

**Goal:** Build and explore the knowledge graph.

- [ ] Graph data model
  - Define GraphNode and GraphEdge Drizzle schemas and run migrations
  - Define relationship types and node types
  - Node deduplication logic (fuzzy matching + embedding similarity)

- [ ] Graph extraction pipeline
  - LLM-based entity and relationship extraction from document chunks
  - Structured output parsing (JSON mode)
  - Extraction prompt engineering: concepts, entities, relationships, topics
  - Batch extraction for large documents
  - Incremental extraction (process new docs, merge into existing graph)

- [ ] Cross-document linking
  - Match new nodes against existing graph
  - Merge duplicate/equivalent concepts
  - Create cross-document edges

- [ ] Graph-enhanced retrieval (GraphRAG)
  - Query → identify relevant nodes → traverse graph → retrieve connected chunks
  - Hybrid retrieval combining vector + graph results
  - Multi-hop reasoning through the graph

- [ ] Extend Atlas agent with graph tools
  - Add `query_graph`, `get_node_neighborhood`, `find_path` tools to Atlas's tool belt
  - Add `get_citations`, `resolve_citation` tools
  - Update query router to detect graph-requiring questions (citation chains, concept comparisons, "foundational papers" queries)
  - Upgrade agent to support parallel tool calls (search library + query graph simultaneously)

- [ ] Knowledge graph visualization (Constellation)
  - 2D Canvas rendering with glow/bloom effects (D3.js + custom canvas or PixiJS)
  - Star nodes with size/brightness encoding, constellation-line edges
  - Parallax background layers for depth illusion
  - Semantic zoom with progressive detail levels
  - Node filtering by type
  - Search and focus on specific concepts
  - Click-through to source documents
  - Ego network view
  - Transition animation from library view ("looking up")

- [ ] Knowledge dashboard
  - Top concepts (brightest stars), most-cited papers, topic distribution
  - Reading statistics

- [ ] Atlas long-term memory
  - TopicFamiliarity system: aggregate user understanding across documents and conversations
  - UserProfile: track explanation preferences (concise/detailed, formal/informal, math comfort)
  - UserInsight records: capture user-stated connections and recurring interests
  - Memory aggregation pipeline: medium-term → long-term promotion logic
  - Inject long-term profile into system prompts for adaptive responses
  - Settings UI: "Atlas Memory" section where users can view, edit, and delete what Atlas remembers

### Phase 5: Citations & References (Weeks 14-16)

**Goal:** Active citation handling and reference expansion.

- [ ] Citation extraction
  - Parse reference sections from papers
  - Create Citation records with extracted metadata
  - Display citations in reader sidebar

- [ ] Citation resolution
  - Integrate external APIs: CrossRef, Semantic Scholar, OpenAlex, arXiv
  - Resolve citations to external metadata
  - Match citations against documents already in the library

- [ ] Citation actions
  - "Add to library" for resolved citations with available PDFs
  - Reading queue for papers to read later
  - Citation status tracking in UI

- [ ] Citation graph
  - Visual citation network showing how library documents cite each other
  - Integrate citation edges into the main knowledge graph

### Phase 6: Polish & Advanced Features (Weeks 17-20)

**Goal:** Refine the experience, add power-user features, prepare for real use.

- [ ] Scholarly UI theme
  - Implement the archival visual identity (color palette, typography, textures)
  - Shelf-based library layout
  - Document type visual differentiation
  - Dark mode with warm tones
  - Smooth animations and transitions

- [ ] Reading experience improvements
  - Continuous scroll mode
  - Reading position persistence (remember where the user left off)
  - Table of contents sidebar (from extracted sections)
  - In-document search with highlight
  - Keyboard shortcuts for navigation and common actions

- [ ] Export & portability
  - Export highlights and notes as Markdown
  - Export knowledge graph as JSON or GraphML
  - Export conversation histories

- [ ] Performance optimization
  - Lazy loading for large libraries
  - Chunk embedding caching
  - Query result caching
  - Optimized graph queries
  - Frontend bundle optimization

- [ ] Testing & reliability
  - Backend unit tests for all services
  - Integration tests for the ingestion pipeline
  - Frontend component tests
  - E2E tests for critical flows (upload → read → ask → get answer)

---

## 9. Additional Ideas

These are features and enhancements beyond the core vision that could add significant value to Alexandria. They are organized by theme and could be incorporated into later development phases or treated as stretch goals.

### 9.1 Reading Experience

- **Reading sessions & focus mode**: track reading sessions with time spent per document. A focus mode that hides distractions and tracks reading progress. Weekly/monthly reading summaries.

- **Spaced repetition integration**: when the user highlights a concept or asks a question, offer to create a flashcard. Use spaced repetition scheduling (SM-2 algorithm) to surface review prompts. "What did you learn from [Paper X] last week?" style nudges.

- **Comparative reading mode**: open two documents side by side. Ask the AI to compare their arguments, methods, or conclusions. Useful for literature reviews and studying competing approaches.

- **Document summarization levels**: auto-generate summaries at multiple levels — one-sentence, one-paragraph, one-page. Store these as part of document metadata for quick library browsing and recall.

### 9.2 Knowledge & Discovery

- **Concept timeline**: for any concept node in the graph, show a timeline of how it appears across documents ordered chronologically. Track how ideas evolve over time in the user's reading history.

- **"You should read" recommendations**: based on the user's graph and reading patterns, suggest documents (from their unread queue or from external sources) that would fill gaps or extend their understanding.

- **Automated literature review drafts**: given a topic or set of concepts, generate a structured summary of what the library contains about it: key papers, consensus views, disagreements, open questions.

- **Concept definitions from context**: build a personal glossary. For each concept node, synthesize a definition from all the passages in the library that discuss it. The definition evolves as more material is added.

- **Weekly knowledge digest**: a periodic report showing new connections discovered, concepts that have grown in the graph, and suggestions for what to revisit.

### 9.3 Collaboration & Sharing

- **Shared libraries**: allow multiple users to contribute to a shared library (e.g., a research group reading the same set of papers). Each user has their own highlights and notes, but the knowledge graph is shared.

- **Public concept maps**: export and share interactive knowledge maps for specific topics. Useful for educational content or research group onboarding.

- **Annotation discussions**: allow comments on highlights, similar to Google Docs. Useful for reading groups or advisor-student interactions.

### 9.4 Integrations

- **Zotero / Mendeley import**: import existing reference libraries with metadata, tags, and collections. Map their structure into Alexandria's library.

- **Browser extension**: clip web articles, blog posts, or online papers directly into Alexandria. Parse and ingest them like any other document.

- **Obsidian / Notion export**: export the knowledge graph and notes in formats compatible with popular note-taking tools. Bidirectional sync as a stretch goal.

- **arXiv / Semantic Scholar direct import**: paste a paper URL or DOI → Alexandria fetches, downloads, and ingests the paper automatically.

### 9.5 AI Enhancements

- **Adaptive explanation depth**: the AI adjusts its explanation complexity based on user behavior. If the user keeps asking follow-ups on basic concepts, simplify. If they ask advanced questions, go deeper. Track per-topic familiarity.

- **Socratic mode**: instead of directly explaining, the AI asks guiding questions to help the user work through understanding themselves. Toggle-able per conversation.

- **Multi-model routing**: route simple questions (definitions, summaries) to faster/cheaper models and complex questions (analysis, comparison, synthesis) to more capable models. Automatic or user-configured.

- **Voice interaction**: read aloud AI explanations or allow voice questions while reading. Useful for accessibility and for when reading on tablets.

### 9.6 Technical Enhancements

- **Local-first / offline support**: package Alexandria as a desktop app (Tauri/Electron) that runs entirely locally. Use local embedding models (via Ollama) and local LLMs for privacy-sensitive use cases.

- **Plugin system**: allow community extensions for new document formats, new LLM providers, new graph visualizations, or custom ingestion steps.

- **Version-aware documents**: track document versions (e.g., arXiv v1 vs v2) and show diffs. Update the knowledge graph when a newer version is ingested.

- **OCR pipeline**: for scanned PDFs or image-heavy documents, integrate OCR (Tesseract or cloud OCR) as part of the ingestion pipeline.

- **Multi-language support**: detect document language and use appropriate embedding models. Translate passages on demand. Cross-language concept linking in the graph.

---

## Appendix: Project Structure (Proposed)

```
alexandria/
├── packages/
│   └── shared/                  # Shared types and utilities
│       ├── src/
│       │   ├── types/           # Domain models, API contracts
│       │   │   ├── document.ts
│       │   │   ├── chat.ts
│       │   │   ├── graph.ts
│       │   │   └── index.ts
│       │   └── validation/      # Shared Zod schemas
│       ├── package.json
│       └── tsconfig.json
│
├── frontend/                    # Next.js application (Bun)
│   ├── src/
│   │   ├── app/                 # App Router pages
│   │   │   ├── page.tsx         # Library view (home)
│   │   │   ├── read/[id]/       # Reader view
│   │   │   ├── graph/           # Knowledge graph view
│   │   │   ├── settings/        # Settings
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── library/         # Library view components
│   │   │   ├── reader/          # PDF reader components
│   │   │   ├── chat/            # Chat panel components
│   │   │   ├── graph/           # Graph visualization components
│   │   │   └── ui/              # Shared UI (shadcn)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utilities, API client
│   │   └── stores/              # Zustand stores
│   ├── public/
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/                     # Hono/Elysia API server (Bun)
│   ├── src/
│   │   ├── index.ts             # App entry point
│   │   ├── routes/
│   │   │   ├── documents.ts
│   │   │   ├── chat.ts
│   │   │   ├── search.ts
│   │   │   ├── graph.ts
│   │   │   └── citations.ts
│   │   ├── db/
│   │   │   ├── schema.ts        # Drizzle schema definitions (source of truth)
│   │   │   ├── index.ts         # Drizzle client and connection
│   │   │   └── migrations/      # Generated by Drizzle Kit
│   │   ├── services/
│   │   │   ├── ingestion/       # Ingestion pipeline
│   │   │   │   ├── parser.ts
│   │   │   │   ├── chunker.ts
│   │   │   │   ├── embedder.ts
│   │   │   │   └── graph-extractor.ts
│   │   │   ├── retrieval/       # RAG + GraphRAG
│   │   │   ├── ai/              # pi-mono configuration and helpers
│   │   │   ├── citations/       # Citation resolution
│   │   │   └── graph/           # Graph operations
│   │   ├── config/
│   │   │   └── index.ts         # Environment and app configuration
│   │   └── workers/
│   │       └── tasks.ts         # BullMQ worker definitions
│   ├── drizzle.config.ts        # Drizzle Kit configuration
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml           # PostgreSQL, Redis, etc.
├── bun.workspace.ts             # Bun workspace configuration
├── .env.example
├── PLAN.md                      # This file
└── README.md
```
