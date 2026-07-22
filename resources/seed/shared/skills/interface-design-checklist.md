---
name: interface-design-checklist
description: Portable UI/design checklist for hosts without the interface-design plugin — hierarchy, layout, tokens, a11y, evidence for review.
---

# interface-design-checklist (portable)

Lightweight portable checklist when the host has no `interface-design` plugin.

## When

UI, landing, component polish, design consistency, DESIGN.md / brand tokens.

## Runtime preferred

Claude plugins: `interface-design@interface-design` and/or `frontend-design@claude-plugins-official`.
On a host with the plugin installed, prefer `frontend-design`/`interface-design` directly — this checklist is the portable fallback for when the plugin isn't available.

## Portable checklist

1. **Purpose:** one primary user action per view.
2. **Hierarchy:** typography scale, spacing rhythm (4/8px), contrast (a11y).
3. **Layout:** mobile first; consistent max-width; avoid nested card soup.
4. **Components:** reuse existing system; name states (default/hover/disabled/error).
5. **Copy:** short labels; verbs for actions; no placeholder latin if shipping.
6. **Tokens:** if DESIGN.md / tokens exist, do not invent off-brand colors.
7. **Evidence:** before/after or screenshot notes for human review.

## Output

- Concrete file list to change
- Token/CSS variables touched
- Open questions for the human
