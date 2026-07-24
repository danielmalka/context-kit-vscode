# Changelog

All notable releases are packaged under `releases/context-kit-<version>.vsix`.

## Versioning

- **MAJOR** — breaking changes for extension users
- **MINOR** — new features, backward compatible
- **PATCH** — fixes / docs / packaging only

Bump `package.json` **before** `npm run package` when keeping a build in `releases/`.

## Unreleased

### Seed versioning

`seedVersion` moves to `MAJOR.MINOR.PATCH+YYYY.MM.DD.<shortsha>` — a real ordered version
instead of a bare date stamp. See
[docs/context-kit-content.md](docs/context-kit-content.md#seed-version) for the scheme.
This build changes the mechanism only; the bundled seed content is unchanged.

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

### Planned (not in this build)

The frontend/design seed track — `frontend-maker`, `DESIGN.md`, `designer-ux`,
`react-reviewer`, `typescript/rules/react-pwa.md` and the `<lang>/prompts/*-refactor.md`
set — exists upstream in the asset kit but is not bundled here yet. It ships with the
release that runs the seed sync.

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
