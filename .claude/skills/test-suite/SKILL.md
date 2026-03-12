---
name: test-suite
description: Create or run tests for Alexandria backend services or frontend components
argument-hint: [what to test, e.g. "ingestion chunker", "document upload route", "ScrollCard component"]
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(bun *)
---

# Test Suite

Create or run tests for Alexandria.

## Context

- **Backend tests**: use Bun's built-in test runner (`bun test`). Tests live in `backend/tests/` mirroring the source structure.
- **Frontend component tests**: use Vitest + React Testing Library. Tests live alongside components as `ComponentName.test.tsx`.
- **E2E tests**: use Playwright. Tests live in `frontend/e2e/`.

## Task

$ARGUMENTS

## Rules

### Backend Tests
1. Place tests in `backend/tests/` matching the source path (e.g., `services/ingestion/chunker.test.ts`)
2. Use `bun:test` imports (`describe`, `it`, `expect`)
3. For database tests, use a test database or mock Drizzle queries
4. For AI/LLM tests, mock pi-mono responses — never call real APIs in tests
5. Test the ingestion pipeline stages independently and as integration

### Frontend Tests
1. Place component tests next to the component file
2. Test user interactions, not implementation details
3. For the constellation/graph view, test data transformations, not canvas rendering
4. Mock API calls with MSW or manual mocks
5. Test both light mode (Archive) and dark mode (Observatory) for visual components

### E2E Tests
1. Cover critical flows: upload → process → read → ask → get answer
2. Test text selection → floating bar → Ask flow
3. Test navigation: library → reader → constellation transitions
4. Use Playwright's built-in assertions and locators

### Running
- Backend: `cd backend && bun test`
- Frontend unit: `cd frontend && bun run test`
- E2E: `cd frontend && bun run test:e2e`
