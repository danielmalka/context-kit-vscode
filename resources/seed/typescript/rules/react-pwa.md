# React / PWA / i18n — Rules

Mandatory rules for the Take Control front-end. Treat violations as BLOCKER at review gates.
Enforcement note: the *mechanical* checks live in the versioned `eslint.config.js`
(react-hooks, jsx-a11y, boundaries). This file is the reviewer's judgment layer.

## React

- Follow the Rules of Hooks; complete `useEffect` dependency arrays (no eslint-disable without a one-line justification).
- No business/domain logic inside components or hooks — components only dispatch use cases, observe state, present results (per the architecture guide's layer direction).
- Keys on lists must be stable IDs, never array index for reorderable data.
- Prefer derived state over duplicated state; avoid `useEffect` for pure computation.
- Memoize (`useMemo`/`useCallback`) only with a measured reason, not reflexively.

## Layer boundaries (also enforced by eslint-plugin-boundaries)

- `domain/` imports nothing from React, IndexedDB, browser APIs, or infra.
- `application/` imports domain only.
- `interface/` (components, pages, presenters) imports application + domain.
- `infrastructure/` implements ports defined by inner layers.
- Deep relative imports crossing layers (`../../../`) are a smell — use path aliases (`@planning/*`, `@shared/*`).

## PWA / Service Worker (from Phase 4 on)

- Service Worker update strategy is `prompt`, never silent `autoUpdate` — auto-reload mid-edit loses offline state.
- Precache must include everything needed offline (incl. i18n bundles if statically imported).
- Manifest requires 192px, 512px, and a **maskable** icon whose art sits within the ~80% central safe zone.
- Never register the SW in dev — only preview/prod.

## i18n (from Phase 3 on)

- No user-facing string hardcoded in the UI — every label goes through a translation key.
- Always use i18next `count` for plurals (de/fr/pt differ) — never concatenate strings.
- One single map `i18n locale → date-fns locale`; date/number formatting respects the active locale.
- Key parity across the 5 locales (pt-BR, en, de, es, fr) is checked in CI — a missing key is a BLOCKER.
- Test layout with `de` (~30% longer) besides pt-BR.
- Domain stays language-agnostic — translation keys/formatting live in the interface layer only.
