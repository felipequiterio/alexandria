---
name: component
description: Create a new React component following Alexandria's scholarly design system
argument-hint: [component name and description]
allowed-tools: Read, Edit, Write, Glob, Grep
---

# Component Creation

You are creating a React component for the Alexandria frontend.

## Context

- Framework: Next.js 15 (App Router) with TypeScript
- UI base: shadcn/ui + Tailwind CSS
- State: Zustand stores in `frontend/src/stores/`
- Components live in: `frontend/src/components/{domain}/`
- Domains: `library/`, `reader/`, `chat/`, `graph/`, `ui/`

Read PLAN.md section 6 (Design Vision) for the full design language.

## Task

$ARGUMENTS

## Design System Reference

**Color tokens** (use Tailwind classes mapped to CSS variables, not raw hex):
- Light mode ("The Archive"): warm parchment backgrounds, ink blue accents, gold highlights, warm charcoal text
- Dark mode ("The Observatory"): midnight blue-black backgrounds, celestial gold accents, parchment-toned text

**Typography**:
- Headings and Atlas responses: serif font (font-serif class)
- UI elements, labels, controls: sans-serif (font-sans / default)

**Component patterns**:
- Scrolls for documents (library view)
- Stars/constellation rendering for graph nodes (graph view)
- Split-pane layout for reader + chat
- Floating context bar for text selection actions
- Inline pill-shaped source references in chat messages

## Rules

1. Use shadcn/ui primitives as the base — customize styling on top, don't rewrite from scratch
2. Place in the correct domain folder under `frontend/src/components/`
3. Use TypeScript with proper prop interfaces
4. Keep components focused — one responsibility per component
5. Extract hooks to `frontend/src/hooks/` if logic is reusable
6. Use Zustand for state that crosses component boundaries
7. Respect the scholarly aesthetic — warm, calm, meaningful
8. Ensure dark mode support (Observatory theme) on every component
9. Add aria labels and keyboard navigation for accessibility
