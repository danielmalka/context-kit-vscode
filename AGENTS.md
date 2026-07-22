# AGENTS.md — context-kit-extension

## Stack

TypeScript + Node.js 20 / VS Code Extension API (esbuild bundle)

## Available skills

Harness skills live in `.harness/skills/` (linked from `.claude/skills/`).
Language rules: `.harness/rules/{patterns,security,testing}.md`.
Guardrails: `.harness/guardrails.md`.
Product plan: `docs/MASTERPLAN.md`.

## Verification commands (sensors)

- `make check` — fmt-check + lint + type-check + test (mandatory before any commit)
- `make check-strict` — + arch-check + coverage floor when available
- `make compile` — esbuild bundle → `dist/extension.js`
- `npm run sync-seed` — refresh `resources/seed` from `~/context-kit`

This project uses **node:test** + tsx (not Vitest). Overrides are in the Makefile (`TEST_CMD`).

## Architecture invariants (the agent NEVER violates)

1. `src/domain/**` does not import `vscode` (or other host UI APIs)
2. No `any` without a justifying comment; no `var`
3. No secrets in source or default settings
4. User-controlled paths resolve under library root, workspace root, or configured kit path
5. Apply/update must not overwrite dirty seed library assets without the update/diff flow
6. Selective providers: do not create glue for disabled providers

## Conventions

- Commits: Conventional Commits in English
- Tests: `tests/unit/*.test.ts` via node:test
- Domain pure; `vscode` only in `extension.ts` and `ui/**` (and thin publish if needed)
- Seed pipeline: `scripts/sync-seed-from-kit.sh`

## Mutation testing (optional)

Not configured yet.

## Workflow

Route implementation through the harness (`harness-mode` skill):

| Request                       | Route                                          |
| ----------------------------- | ---------------------------------------------- |
| Bug / small fix               | `/fix`                                         |
| Small well-understood feature | `/tasks` then `/implement`                     |
| Complex feature               | `/prd` → `/techspec` → `/tasks` → `/implement` |
| Continue board                | `/next`                                        |

- Never commit — the human reviews and commits (unless project rules explicitly allow autonomous commit off main).
- Never report done without `make check` (and `make check-strict` for merge-ready work).

## What NOT to do

- Do not add dependencies without asking
- Do not reimplement agent runtimes (Claude/Grok CLIs)
- Do not use `any` / `var` without justification
- Do not force-overwrite `.claude/napkin.md`
