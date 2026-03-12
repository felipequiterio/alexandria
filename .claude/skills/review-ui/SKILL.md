---
name: review-ui
description: Review UI code for adherence to Alexandria's scholarly design vision and consistency
argument-hint: [file path or component name to review]
allowed-tools: Read, Glob, Grep
---

# UI Design Review

Review the specified UI code against Alexandria's design vision. You are a design reviewer, not a coder — your job is to identify issues and suggest improvements, not to make changes.

## Design Vision Reference

Read PLAN.md section 6 for the full design language. Key checkpoints:

### Color & Theme
- [ ] Uses CSS variable tokens, not hardcoded hex values
- [ ] Light mode follows "The Archive" palette: sandy limestone bg, mahogany surfaces, Mediterranean teal primary accent, torchlight gold secondary, terracotta tertiary, frieze green quaternary
- [ ] Dark mode follows "The Observatory" palette: deep indigo-black bg, celestial gold primary, constellation silver secondary, nebula rose tertiary
- [ ] Dark mode is not just inverted light mode — it is a distinct celestial environment
- [ ] No pure black (#000) or pure white (#FFF) — warm-shifted throughout
- [ ] Colors match reference renders in `reference/` folder — sandstone, mahogany, teal frieze bands

### Typography
- [ ] Headings use serif typeface (Cormorant Garamond / EB Garamond / Playfair Display)
- [ ] Atlas's messages use serif typeface for body text
- [ ] UI controls and labels use sans-serif (Inter / IBM Plex Sans)
- [ ] Document titles on scroll labels use serif

### Metaphor Consistency
- [ ] Documents represented as scrolls in mahogany cabinets with diamond-lattice fronts — not generic cards
- [ ] Cabinets have teal frieze header bands for collection names
- [ ] Graph nodes rendered as stars with glow (constellation view), not circles
- [ ] Architectural framing present where appropriate (column borders, frieze nav band)
- [ ] Transitions carry spatial meaning (unroll from cabinet, look up past columns at sky, descend back)
- [ ] No gratuitous animation — every motion has a purpose

### Atmosphere
- [ ] Interface feels like entering the Library of Alexandria — warm sandstone, rich wood, torchlight
- [ ] Generous whitespace and breathing room
- [ ] Progressive revelation — simple surface, depth underneath
- [ ] Reading content is always the primary visual focus
- [ ] Reader desk surface uses mahogany tone, PDF page uses parchment tone

### Interaction
- [ ] Text selection flow: select → floating bar → Ask/Highlight/Define/Find
- [ ] Chat source references are clickable inline pills
- [ ] Scope indicator shows Passage/Document/Library mode clearly
- [ ] Highlights use palette colors (torchlight gold, Mediterranean teal, terracotta, frieze green)
- [ ] Atlas thinking indicator is an oil lamp flame, not a spinner

## Task

Review: $ARGUMENTS

Provide a structured report with:
1. **Passes** — what follows the design vision correctly
2. **Issues** — specific violations with line references
3. **Suggestions** — improvements that would strengthen the scholarly feel
