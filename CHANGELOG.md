# Changelog

All notable releases are packaged under `releases/context-kit-<version>.vsix`.

## Versioning

- **MAJOR** — breaking changes for extension users
- **MINOR** — new features, backward compatible
- **PATCH** — fixes / docs / packaging only

Bump `package.json` **before** `npm run package` when keeping a build in `releases/`.

## 1.5.1

### Fix — permanent update prompt after skipping a customized asset

Choosing **Skip** for a library asset you had edited during an update no longer leaves the
extension asking you to update forever. Previously, skipping a customized asset pinned the
recorded seed version to the old value, so every subsequent check still reported the package
seed as newer and re-offered the same update — a prompt you could never clear, because Skip is
a permanent choice.

The library manifest now records which package seed version you have acknowledged (applied,
replaced, or skipped) separately from the version your unedited assets were written from. Once
you act on an update, the prompt stays quiet until a genuinely newer package seed ships — at
which point your still-customized asset is offered again for reconsideration. Existing installs
are handled transparently: a manifest without the new field falls back to its recorded seed
version, so a newer package is still correctly seen as an update.

## 1.5.0

### Seed content — frontend/design track

The bundled seed moves to `1.5.0+2026.07.24.e0e7d6b` and now carries the frontend/design
assets, plus the language refactor prompts that the previous build synced but never shipped.

New assets:

- `shared/skills/frontend-maker.md` — build UI by success mode and design dials instead of a
  template default
- `shared/templates/DESIGN.md` — per-project design constitution (tokens, components, motion)
- `agents/designer-ux.md` — design direction at planning time, visual/UX critique at review time
- `agents/react-reviewer.md` — React/PWA/i18n code review with a binary verdict
- `typescript/rules/react-pwa.md` — React / PWA / i18n rules for the TypeScript pack

Extended assets (additive — a frontend/design axis, nothing removed):

- `shared/skills/harness-mode.md` — routes user-facing work through `designer-ux`
- `agents/prd-creator.md` — asks for a design-direction note on UI features
- `shared/checklists/review-gate.md` — Axis 4: design critique + React review for UI diffs
- `shared/checklists/spec-gate.md` — design direction (mode, dials, `DESIGN.md`) before build

Language prompts now present in the seed: `{go,php,python,typescript}/prompts/*-refactor.md`.

### Upgrading an existing install

- The extension offers **Update Library from Package Seed**. Assets you never edited are
  refreshed automatically; assets you edited are preserved and offered **Skip / Replace /
  Keep-both** so nothing you wrote is overwritten.
- Because edited assets are preserved, if you customized any of the four files this release
  changes — `shared/checklists/review-gate.md`, `shared/checklists/spec-gate.md`,
  `shared/skills/harness-mode.md` or `agents/prd-creator.md` — your version is kept and the new
  frontend axis will **not** appear in it until you choose Replace or Keep-both. For you it is
  opt-in.

### Seed versioning

`seedVersion` moves to `MAJOR.MINOR.PATCH+YYYY.MM.DD.<shortsha>` — a real ordered version
instead of a bare date stamp. See
[docs/context-kit-content.md](docs/context-kit-content.md#seed-version) for the scheme.
Libraries stamped with the older date-only value sort below every semver release, so they see
this build as an upgrade without any manual step.

### Fixes

- **Update Library compares seed versions by ordering, not string inequality.** Any
  difference used to count as "newer", so an older seed than the installed one was
  indistinguishable from an upgrade and could roll a library backwards. Downgrades are now
  rejected; at an equal version, missing or drifted clean assets are still repaired.
- **`<lang>/prompts/` is synced and mapped** to `langs/<lang>/prompts/*.md` in the library.
  `shared/prompts/` always worked; the language-scoped ones were dropped by the sync script
  and by the seed→library mapper, so a fresh install silently lost them and then reported an
  update it could not explain.

### Tooling

- **`npm run sync-seed` refuses to run on a dirty asset-kit checkout or off `main`.** The
  stamped short SHA is provenance users rely on; previously the script stamped whatever HEAD
  it found, so a feature-branch commit could ship inside a released seed. `ALLOW_DIRTY_SEED=1`
  overrides for local testing and warns that the build must not be released.

## 1.4.0

### Features

- **Orchestrator:** up to **3 slash commands per step** (same terminal, chained with `&&`)
- **Orchestrator:** **named saved pipelines** — select at top (default _New orchestration_), **Save** / **Update** / **Delete**, stored in extension `globalState`

### Security

- **Launch lines are now single-quoted** (`buildLaunchCommand`) — `$(…)`, backticks and `$VAR` in the args box no longer expand when a step runs
- **Command names are validated against a slug charset** (`normalizeCommands`) — names come from library filenames on disk and from persisted presets, so a file such as `a$(id).md` can no longer reach the shell

### Tooling

- **Quality gate:** `eslint.config.js` with `typescript-eslint` `strictTypeChecked`; the whole `src/` tree was brought to zero errors
- **Quality gate:** `check-strict` now measures line coverage over `src/` and enforces `COVERAGE_MIN` (80%) via `scripts/coverage-report.mjs`; currently **87.5%**

## 1.3.0

### Features

- **Activity map:** hide inactive sessions by default; toggle **Show inactive** / **Hide inactive**

## 1.2.0

### Features

- **Orchestrator (M4):** multi-CLI pipeline webview — sequential waves, parallel groups, confirm between waves

## 1.1.0

### Features

- **Activity map live tail (M2):** fs.watch + 3s poll, Live ON/OFF, fingerprint skip for unchanged UI

## 1.0.0

First stable line: core harness + dream polish (activity map M0/M1, coverage, launch pad, update webview). **No** live tail (M2) yet; **no** multi-CLI orchestrator (M4) yet.
