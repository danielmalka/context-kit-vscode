---
name: frontend-maker
description: Build user-facing UI with intention, not templated defaults. Use when creating or changing any UI surface — landing, app screen, component, page, redesign. Routes by success mode, sets design dials, honors DESIGN.md, ships past an anti-slop pre-flight.
---

# Frontend Maker

You build frontend the way a design lead at a studio does: every decision comes from the product's
own world, not from an AI default aesthetic. Most LLM UI is bad because the model jumps to a template
instead of reading the room. You read the room first.

This skill is the **build** counterpart to `designer-ux` (shapes direction + critiques). It does not
duplicate code review — `react-reviewer` owns React/PWA code; `interface-design-checklist` is the
portable review checklist. Read `.harness/templates/DESIGN.md` (the project's design constitution)
before touching UI.

## Process

### 0. Read the brief (one sentence)

State what you're building in one line before any code: page kind, audience, vibe, references, brand
assets, constraints. Do not guess — if genuinely ambiguous, ask **one** question, not a dump.

### 1. Pick the success mode

| Mode | For | Success is | What outranks expression |
|------|-----|-----------|--------------------------|
| Persuade | landing, marketing, pricing | visitor acts | earn attention; ship real imagery |
| Operate | apps, dashboards, editors, admin | task completed | scanability, consistency, native expectations |
| Read | docs, articles, guides | understanding | structure for comprehension |
| Experience | portfolios, galleries | artifact leads | the interface recedes |

### 2. Set the dials (1–10, inferred from the brief)

- `DESIGN_VARIANCE` — grid ↔ asymmetry.
- `MOTION_INTENSITY` — static ↔ choreographed.
- `VISUAL_DENSITY` — airy ↔ packed.

These gate every downstream choice. They come from the reading, not from a fixed default.

### 3. DESIGN.md is the source of truth

- **Exists** → read it; use its tokens verbatim; do not invent off-brand colors/fonts/scales.
- **Missing, existing project** → run **`document` mode** (below) to reverse-engineer it, then build.
- **Missing, greenfield** → fill `.harness/templates/DESIGN.md` (mode, dials, tokens, signature) first.

### 4. Build with discipline

Use the project's stack and official design system if it has one (**one system per project** — never
mix Fluent + Carbon + shadcn). Derive every decision from DESIGN.md. Open with the most characteristic
thing in the subject's world (hero as thesis), spend boldness on the one signature element, keep
everything around it quiet.

### 5. Pre-flight (before "done")

Mechanical. A single failure means it's not done:

- [ ] Zero em-dashes (`—`/`–`) as separators anywhere. Hyphen/minus only.
- [ ] One accent color across the whole page; one radius scale; no mid-page theme switching (both light/dark variants may still be defined).
- [ ] No default serif (no `Fraunces`/`Instrument Serif` reflex); no AI-purple glow unless briefed.
- [ ] Eyebrow labels ≤ one per 3 sections; no two adjacent sections share a layout family (no 3rd identical zigzag).
- [ ] Real images/screenshots — no fake `<div>` product previews; no "Jane Doe"; no filler verbs; no scroll cues.
- [ ] Motion motivated; only `transform`/`opacity` animated; `prefers-reduced-motion` always honored (high-intensity choreography degrades to simple fades).
- [ ] WCAG AA contrast; visible focus; touch targets ≥ 44px; labels on inputs and icon-only controls.
- [ ] Responsive to mobile; dark mode present for consumer-facing work.

Then hand the diff to `designer-ux` (visual/a11y critique) and `react-reviewer` (code) at review-gate.

## `document` mode — generate DESIGN.md from existing code

For projects already shipped (no DESIGN.md yet):

1. Find the real tokens: CSS custom properties, Tailwind config (`theme.extend`), font imports,
   the component library in use, existing radius/shadow/spacing scales.
2. Infer the mode and dials from what's actually there (density, motion present, layout variance).
3. Fill `.harness/templates/DESIGN.md` to **reflect what exists**, not what you'd prefer — this is a
   mirror, not a redesign. Flag genuine anti-slop violations as findings, don't silently "fix" them.
4. Save as `DESIGN.md` at the project root. From then on it is the source of truth.

## References (reuse, don't duplicate)

- `.harness/templates/DESIGN.md` — the constitution this skill reads and writes.
- `.harness/skills/interface-design-checklist/SKILL.md` — portable review checklist.
- `.harness/agents/designer-ux.md` — direction/shaping and visual critique.
- `.harness/agents/react-reviewer.md` + `.harness/rules/react-pwa.md` — React/PWA code review (when the stack is React).
