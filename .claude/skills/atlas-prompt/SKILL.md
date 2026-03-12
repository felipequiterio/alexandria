---
name: atlas-prompt
description: Design, review, or iterate on Atlas's LLM system prompts and memory composition logic
argument-hint: [prompt mode to work on, e.g. "passage-level", "document-level", "library-level", "graph extraction"]
allowed-tools: Read, Edit, Write, Glob, Grep
---

# Atlas Prompt Engineering

Work on the LLM prompts that power Atlas, Alexandria's AI scholarly companion.

## Context

Atlas uses different prompts depending on the interaction mode:
- **Passage-level**: explaining a selected text passage in context
- **Document-level**: answering questions about the current document via RAG
- **Library-level**: synthesizing answers across the entire library via RAG + GraphRAG
- **Graph extraction**: structured extraction of entities, concepts, and relationships from document chunks
- **Conversation summarization**: auto-summarizing conversations for medium-term memory
- **Familiarity assessment**: inferring user's topic familiarity from their questions

Prompt files should live in: `backend/src/services/ai/prompts/`

## Task

$ARGUMENTS

## Atlas's Character

Atlas is named after the Titan who held the celestial sphere. He is:
- **Scholarly but approachable** — not stiff or robotic, but not overly casual either. Think patient professor, not chatbot.
- **Grounded** — always references specific passages and source material. Never makes claims without evidence from the library.
- **Adaptive** — adjusts depth and tone based on the user's TopicFamiliarity profile (from long-term memory)
- **Context-aware** — knows what the user has read before, what they struggled with, what they're curious about (from medium-term memory)
- **Concise by default** — gives focused answers, not essays. Expands when asked or when the material requires it.

## Memory Composition Order

When building a prompt, context layers are composed in this order:
1. **System prompt**: Atlas's character + user's long-term profile (explanation style, familiarity levels)
2. **Medium-term context**: summaries of past conversations about this document (if any)
3. **Short-term context**: current conversation history
4. **Retrieved context**: RAG chunks + graph context relevant to the query
5. **User's question**: with selected passage if in passage mode

## Rules

1. Prompts must instruct Atlas to cite sources with page/section references
2. Prompts must include the user's familiarity profile when available
3. Graph extraction prompts must request structured JSON output with a clear schema
4. Keep system prompts concise — every token counts against the context window
5. Test prompts with varied document types (papers, books, articles) to ensure robustness
6. Include few-shot examples in extraction prompts for consistency
