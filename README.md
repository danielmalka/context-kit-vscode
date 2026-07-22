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

### From VSIX (current)

Until the extension is published to the Marketplace:

1. Download or build `context-kit-*.vsix` (see [Development](#development)).
2. In VS Code / Cursor: **Command Palette** → `Extensions: Install from VSIX…`
3. Select the file and reload if prompted.

### From Marketplace (planned)

1. Open Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Search for **Context Kit**.
3. Click **Install**.

## Quick start

1. Install and open any workspace folder.
2. Open the **Context Kit** activity bar icon (catalog).
3. Run **Context Kit: Scan Library** if the tree is empty.
4. Optionally **Context Kit: Edit Harness Defaults** (language + providers).
5. Run **Context Kit: Apply Harness to Workspace** on a project you want bootstrapped.

Typical defaults: **Claude + Grok + agents** enabled; other providers off until you opt in.

## Commands

| Command                                    | What it does                                                   |
| ------------------------------------------ | -------------------------------------------------------------- |
| `Context Kit: Scan Library`                | Rescan library / workspace and refresh the catalog             |
| `Context Kit: Refresh Catalog`             | Same as scan (toolbar)                                         |
| `Context Kit: New Skill`                   | Create a skill in the user library                             |
| `Context Kit: New Command`                 | Create a command playbook in the user library                  |
| `Context Kit: Edit Harness Defaults`       | Edit global apply defaults (language, providers, refresh mode) |
| `Context Kit: Apply Harness to Workspace`  | Deploy harness with dry-run; write `.context-kit/project.json` |
| `Context Kit: Show Library Path`           | Reveal the `globalStorage` library path                        |
| `Context Kit: Reseed Library from Package` | Refresh unmodified seed assets from the bundled pack           |

## Settings

| Setting                    | Type    | Default | Description                                                                                                               |
| -------------------------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| `contextKit.kitPath`       | string  | `""`    | Optional path to a local [context-kit](https://github.com/danielmalka/context-kit) clone (maintainer reseed / power-user) |
| `contextKit.scanOnStartup` | boolean | `true`  | Scan the user library when the extension activates                                                                        |

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

# Optional: refresh bundled seed from a local context-kit clone
# export CONTEXT_KIT_PATH=~/context-kit
npm run sync-seed

make check          # prettier + eslint + tsc + tests
npm run compile     # esbuild → dist/extension.js
```

- Press **F5** in VS Code with this folder open to launch an Extension Development Host.
- Package a VSIX:

```bash
npm run package
```

### Quality gate

| Command             | Purpose                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `make check`        | Format check, lint, type-check, unit tests                           |
| `make check-strict` | Above + architecture greps (e.g. no `vscode` import in `src/domain`) |
| `make compile`      | Bundle the extension                                                 |

Architecture rules for agents working on this repo live in `AGENTS.md`.

## Related

- [context-kit](https://github.com/danielmalka/context-kit) — portable harness assets and bootstrap used as the seed factory for this extension

## Changelog

See GitHub [Releases](https://github.com/danielmalka/context-kit-vscode/releases) (when published).

## License

License to be decided. All rights reserved until a `LICENSE` file is added to the repository.

## Links

- **Repository:** https://github.com/danielmalka/context-kit-vscode
- **Issues:** https://github.com/danielmalka/context-kit-vscode/issues
