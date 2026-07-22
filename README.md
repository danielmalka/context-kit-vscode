# Context Kit

[![CI](https://github.com/danielmalka/context-kit-vscode/actions/workflows/ci.yml/badge.svg)](https://github.com/danielmalka/context-kit-vscode/actions/workflows/ci.yml)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.85.0-blue?logo=visualstudiocode)](https://code.visualstudio.com/)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen?logo=node.js)](https://nodejs.org/)

**Context Kit** is a VS Code / Cursor extension for managing **agent skills**, **slash-style commands**, **agent roles**, and a **multi-provider project harness** (Claude Code, Grok, Codex, Gemini, and related tools).

It gives you a single place in the editor to browse, create, and deploy the markdown playbooks your coding agents already understand — without turning the extension into another LLM runtime.

## Why

Agent tooling is powerful but fragmented: skills live under `~/.claude`, commands under another path, workflows under a third, and each project may need a different subset of providers. Context Kit:

- Ships a **portable seed** of reusable skills, commands, and agents
- Keeps an **editable user library** on first activate
- **Applies a harness** to a workspace with language packs and **only the providers you choose**
- Records project choices in versionable **`.context-kit/project.json`**

It does **not** replace Claude Code, Grok, or other CLIs. Those remain the runtimes; this extension prepares and organizes the context layer.

## Features

- **Seeded library** — On first activation, installs a portable asset pack into VS Code `globalStorage`
- **Catalog sidebar** — Tree view of skills, commands, agents (library + workspace `.harness`)
- **Create assets** — New Skill / New Command wizards with slug validation
- **Harness defaults** — Save preferred language and providers once
- **Apply Harness** — Dry-run + confirm; selective providers; language detection or `none` / ask
- **Project config** — Writes `.context-kit/project.json` for teams (commit this; keep `.harness/` local)
- **Quality gate** — `make check` / `make check-strict` for development (TypeScript, ESLint, Prettier, tests)

> Screenshots and a short demo GIF will land here as the UI stabilizes.

## Install

Install from a **VSIX** (Marketplace publication is not available yet):

1. Build `context-kit-*.vsix` (see [Development](#development)), or download a release asset when one is published on this repo.
2. In VS Code / Cursor: **Command Palette** → `Extensions: Install from VSIX…`
3. Select the file and reload if prompted.

## Quick start

1. Install and open any workspace folder.
2. Open the **Context Kit** activity bar icon (catalog).
3. Run **Context Kit: Scan Library** if the tree is empty.
4. Optionally **Context Kit: Edit Harness Defaults** (language + providers).
5. Run **Context Kit: Apply Harness to Workspace** on a project you want bootstrapped.

Typical defaults: **Claude + Grok + agents** enabled; other providers off until you opt in.

## How to use

### Day-to-day with the extension

1. **Browse** skills, commands, and agents in the **Context Kit** sidebar (library + workspace `.harness`).
2. **Create** assets with **New Skill**, **New Command**, or **New Workflow** (stored in your user library).
3. **Apply** the harness to a repo when you want `.harness/`, provider glue, and `.context-kit/project.json`.
4. **Update** the library when the extension ships a newer seed: **Update Library from Package Seed** (clean assets refresh automatically; edited seed assets get Skip / Replace / Keep-both).
5. **Optional:** **Deploy Skill to User Runtime** if a tool only reads `~/.claude/skills` (or Grok / `.agents`).
6. **Dream tools** (sidebar toolbar or Command Palette): **Activity Map**, **Coverage Map**, **Launch Pad**.

### Spec-driven development (in a harnessed project)

With the harness applied, coding agents follow the portable playbooks under `.harness/`:

| Route                                          | When                                    |
| ---------------------------------------------- | --------------------------------------- |
| `/prd` → `/techspec` → `/tasks` → `/implement` | Normal / complex features               |
| `/fix`                                         | Bugs and small, well-scoped changes     |
| `make check` / `make check-strict`             | Quality gate before calling work “done” |

### Auxiliary agents (optional)

Not part of the mandatory chain — use when useful:

| Agent                   | Purpose                                                                           | How                                                    |
| ----------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **documentator**        | Markdown docs + Mermaid/draw.io diagrams from code truth                          | Ask the agent to act as `documentator`, or `/document` |
| **security-checker**    | Diff-scoped security review; tech-debt tasks for non-blockers                     | `/security-check` after implement on sensitive work    |
| **cleaner** (faxineiro) | Dead code, stale docs, leftover samples — report first, delete only when approved | `/clean` at the end of a feature                       |

Full inventory of seed content (skills, commands, agents, layout, porting notes): **[docs/context-kit-content.md](docs/context-kit-content.md)**.

## Commands

| Command                                         | What it does                                                                              |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `Context Kit: Scan Library`                     | Rescan library / workspace and refresh the catalog                                        |
| `Context Kit: Refresh Catalog`                  | Same as scan (toolbar)                                                                    |
| `Context Kit: New Skill`                        | Create a skill in the user library                                                        |
| `Context Kit: New Command`                      | Create a command playbook in the user library                                             |
| `Context Kit: New Workflow (Grok Rhai stub)`    | Create a `.rhai` workflow stub under `workflows/`                                         |
| `Context Kit: Edit Harness Defaults`            | Edit global apply defaults (language, providers, refresh mode)                            |
| `Context Kit: Apply Harness to Workspace`       | Deploy harness with dry-run; write `.context-kit/project.json`                            |
| `Context Kit: Update Library from Package Seed` | Refresh clean seed assets; prompt Skip/Replace/Keep-both for edited ones                  |
| `Context Kit: Deploy Skill to User Runtime`     | Copy a library skill into `~/.claude/skills`, `~/.grok/skills`, and/or `~/.agents/skills` |
| `Context Kit: Show Library Path`                | Reveal the `globalStorage` library path                                                   |
| `Context Kit: Reseed Library from Package`      | Refresh unmodified seed assets (clean only)                                               |
| `Context Kit: Open Activity Map`                | Webview radar of recent Claude/Grok sessions (M0/M1)                                      |
| `Context Kit: Open Coverage Map`                | Library vs workspace `.harness` vs user runtime skills                                    |
| `Context Kit: Launch Pad`                       | Open a terminal and run a library slash command via claude/grok/echo                      |

## Settings

| Setting                     | Type    | Default | Description                                                                                             |
| --------------------------- | ------- | ------- | ------------------------------------------------------------------------------------------------------- |
| `contextKit.kitPath`        | string  | `""`    | Optional absolute path to a local asset-kit clone used only by maintainers to reseed `resources/seed`   |
| `contextKit.scanOnStartup`  | boolean | `true`  | Scan the user library when the extension activates                                                      |
| `contextKit.userSkillRoots` | object  | `{}`    | Optional overrides for runtime skill roots (`claude`, `grok`, `agents`); empty → defaults under `$HOME` |

## Requirements

- **VS Code** (or compatible host: Cursor, etc.) `^1.85.0`
- **OS:** Windows, macOS, or Linux (WSL supported; prefer opening the folder inside WSL for symlink-based provider glue)
- **Runtime for end users:** none beyond the editor (no separate Node install required to _use_ the extension)
- **Development:** Node.js 20+, npm

## Project layout (after Apply Harness)

| Path                                      | Committed?        | Role                                                 |
| ----------------------------------------- | ----------------- | ---------------------------------------------------- |
| `.context-kit/project.json`               | Yes (recommended) | Language, providers, options applied to this repo    |
| `.harness/`                               | No (gitignored)   | Skills, commands, agents, rules — local harness copy |
| Provider glue (e.g. `.claude/`, `.grok/`) | Usually no        | Symlinks / instructions for selected providers only  |

**User library (all workspaces):** VS Code `globalStorage` for publisher `danielmalka.context-kit`.

**Bundled seed (in the extension package):** `resources/seed/` — skills, commands, agents, and language packs.

## Development

```bash
git clone https://github.com/danielmalka/context-kit-vscode.git
cd context-kit-vscode
npm install

# Optional (maintainers): refresh bundled seed from a local asset-kit checkout
# export CONTEXT_KIT_PATH=/path/to/local/asset-kit
npm run sync-seed

make check          # prettier + eslint + tsc + tests
npm run compile     # esbuild → dist/extension.js
```

- Press **F5** in VS Code with this folder open to launch an Extension Development Host.
- Package a VSIX (`resources/seed/` is already in the repo; `sync-seed` is optional for maintainers):

```bash
npm install
npm run compile
npm run package
# → creates context-kit-0.1.0.vsix in the repo root
# Then: Command Palette → "Extensions: Install from VSIX…"
#
# Optional (maintainers with a local asset-kit clone):
# npm run package:reseed
```

### Quality gate

| Command             | Purpose                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `make check`        | Format check, lint, type-check, unit tests                           |
| `make check-strict` | Above + architecture greps (e.g. no `vscode` import in `src/domain`) |
| `make compile`      | Bundle the extension                                                 |
| `npm test`          | `node:test` suite under `tests/unit/`                                |

Architecture rules for agents working on this repo live in `AGENTS.md`. CI runs `make check-strict` on pull requests and `main` via `.github/workflows/ci.yml`.

## Documentation

| Doc                                                        | Audience                                             |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| [README.md](README.md) (this file)                         | Install, extension UI, develop, package              |
| [docs/context-kit-content.md](docs/context-kit-content.md) | Seed content, harness flow, every agent/command role |
| [AGENTS.md](AGENTS.md)                                     | Rules for agents working **on this extension repo**  |
| `resources/seed/agents/*.md`                               | Role playbooks shipped to users                      |

## Related

The portable **asset kit** that supplies the bundled seed (skills, commands, agents, language packs, and bootstrap semantics) will be published as its own open repository soon. Until then, this extension already ships a frozen seed under `resources/seed/` — no external clone is required to build, install, or use the extension.

## Changelog

See GitHub [Releases](https://github.com/danielmalka/context-kit-vscode/releases) when release notes are published.

## License

This project is licensed under the [MIT License](LICENSE).

## Links

- **Repository:** https://github.com/danielmalka/context-kit-vscode
- **Issues:** https://github.com/danielmalka/context-kit-vscode/issues
