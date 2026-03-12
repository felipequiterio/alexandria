---
name: check-plan
description: Check current implementation progress against PLAN.md and report what's done, in progress, and remaining
allowed-tools: Read, Glob, Grep, Bash(git log *)
---

# Plan Progress Check

Audit the current codebase against the development plan in PLAN.md.

## Process

1. Read PLAN.md, focusing on section 8 (Development Phases) — the task checklists
2. Scan the codebase to determine what has actually been implemented:
   - Check for project scaffolding (package.json files, docker-compose, config files)
   - Check for database schema (Drizzle schema definitions, migrations)
   - Check for API routes (backend/src/routes/)
   - Check for frontend pages and components
   - Check for services (ingestion, retrieval, AI, graph)
   - Check for tests
3. Cross-reference against each checklist item in the plan

## Output

Produce a progress report with:

### Completed
Items from the plan that are fully implemented, with file references.

### In Progress
Items that are partially done — describe what exists and what's missing.

### Not Started
Items that have no implementation yet.

### Phase Summary
For each phase (1-6), give a percentage estimate and highlight blockers.

### Drift
Note any implemented code that doesn't match the plan — features not in the plan, or deviations from planned architecture. This isn't necessarily bad, but should be tracked.
