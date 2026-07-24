# DESIGN.md — <project name>

> Design constitution for this project. Single source of truth for every UI decision.
> `frontend-maker` (build) and `designer-ux` (shape + critique) read this file before touching UI.
> If a token or rule is not here, it does not exist — add it here first, then use it.
>
> Generate the first version with `frontend-maker` in `document` mode (reverse-engineers the tokens
> already in the code) or by filling this template. Keep it current: a change to the visual world
> lands here in the same PR.

---

## 1. Direction & Mode

**Brief in one sentence:** <e.g. "B2B SaaS dashboard for logistics operators, dense and native-feeling.">

**Mode** (pick one — it sets what "good" means):

| Mode | For | Success is | Priority |
|------|-----|-----------|----------|
| Persuade | landing, marketing, pricing | visitor decides and acts | earn attention; real imagery |
| Operate | apps, dashboards, editors, admin | visitor completes the task | scanability, consistency, native expectations |
| Read | docs, articles, guides, help | visitor understands | structure for comprehension |
| Experience | portfolios, galleries, showcases | the artifact leads | the interface recedes |

**This project:** `<Operate>`

**Dials** (1–10, inferred from the brief — not user-editable defaults):

- `DESIGN_VARIANCE` = `<4>` — 1 = strict grid, 10 = asymmetric/artsy.
- `MOTION_INTENSITY` = `<3>` — 1 = static, 10 = choreographed/scroll-driven.
- `VISUAL_DENSITY` = `<6>` — 1 = gallery air, 10 = cockpit data.

**Signature:** <the one memorable element that carries the brand. Spend boldness here; keep the rest quiet.>

---

## 2. Color — one accent per page

Tokens (OKLCH). One accent color for the whole page; keep accent chroma modest (roughly C ≤ 0.15) unless brand-justified.

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `oklch(...)` | ground surface |
| `--surface` | `oklch(...)` | raised surface / cards |
| `--text` | `oklch(...)` | body text |
| `--text-muted` | `oklch(...)` | secondary text |
| `--accent` | `oklch(...)` | the single brand/CTA accent |
| `--border` | `oklch(...)` | hairlines, dividers |
| `--success` / `--warning` / `--danger` | `oklch(...)` | state only, never decoration |

Rules: no second accent mid-page; state colors mean state, not style; dark mode is a first-class
variant (define both, don't ship light-only for consumer work).

---

## 3. Typography

| Role | Family | Weight / scale |
|------|--------|----------------|
| Display | `<Geist / Outfit / Cabinet Grotesk / Satoshi>` | used sparingly, characterful |
| Body / UI | `<...>` | 400 base |
| Mono | `<SFMono, Roboto Mono, Consolas>` | code / data |

Scale: `<eyebrow / body / title / headline / display>` — list the rem values.

Rules: **serif only if the brand names it or the mode is genuinely editorial/luxury/heritage** —
never as a default. Body on dark: line-height 1.6–1.8, measure 65–75ch. Italic words with `y g j p q`
need extra leading and descender room.

---

## 4. Spacing, radius, material

- **Spacing rhythm:** 4/8px scale. List the steps you use.
- **Radius scale:** one scale, applied consistently (`<sm / md / lg>`).
- **Elevation:** hairline-first; shadows only where depth communicates hierarchy. No glass unless brand.
- **Layout:** mobile-first; one consistent max-width; avoid nested card soup.

---

## 5. Component vocabulary (reuse-first)

Reach for existing primitives before inventing a class. List the project's canonical components and
their named states:

- `Button` — default / hover / focus / disabled / loading
- `<Card / Input / Tabs / ...>` — states...

If the project uses an official design system (Fluent, Material, Carbon, Primer, shadcn/ui…), name it
here. **One system per project** — do not mix.

---

## 6. Motion

Intensity band from the dial. Motion must be motivated (hierarchy, feedback, state transition — not
"it looked cool"). Animate `transform`/`opacity` only. `prefers-reduced-motion` is always respected; above `MOTION_INTENSITY > 3`, high-intensity choreography must degrade to simple fades, not merely shorten.

---

## 7. Accessibility floor (non-negotiable)

- Contrast WCAG AA (4.5:1 text, 3:1 large/UI).
- Visible keyboard focus on every interactive element.
- Touch targets ≥ 44×44px.
- Labels on inputs and icon-only controls; reduced motion respected.

---

## 8. Do / Do Not

**Do:** derive choices from this project's world; spend boldness on the signature; keep the rest quiet;
use real images; ship both themes.

**Do Not (anti-slop bans):**
- No em-dash (`—`/`–`) as a separator anywhere on the page. Hyphen and minus only.
- No AI-purple button glow / neon gradient unless the brief asks.
- No default serif; no `Fraunces`/`Instrument Serif` reflex.
- No second accent mid-page; no color fluctuation within a page.
- No eyebrow label above every section (max ~one per 3 sections).
- No zigzag image/text alternation beyond 2 consecutive sections.
- No fake product previews built from `<div>` rectangles — real screenshots/images or omit.
- No filler verbs (Elevate, Seamless, Unleash), no "Jane Doe" placeholders, no scroll cues.
