# Changelog

All notable releases are packaged under `releases/context-kit-<version>.vsix`.

## Versioning

- **MAJOR** — breaking changes for extension users
- **MINOR** — new features, backward compatible
- **PATCH** — fixes / docs / packaging only

Bump `package.json` **before** `npm run package` when keeping a build in `releases/`.

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
