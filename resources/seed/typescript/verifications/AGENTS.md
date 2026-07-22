# AGENTS.md — [Project Name]

## Stack
TypeScript + Node.js 20+ / [library | CLI | API | Next.js | VS Code extension]

## Available skills
Harness skills live in `.harness/skills/` (also linked from `.claude/skills/`).
Read the relevant `SKILL.md` before implementing. Language rules: `.harness/rules/`.

## Verification commands (sensors)
- `make check` — fmt-check + lint + type-check + test (mandatory before any commit)
- `make check-strict` — fmt-check + lint + arch-check + type-check strict + test with coverage
- `make mutation` — mutation testing (optional, Stryker)
- `make arch-check` — path-scoped forbidden-dependency greps (see Makefile)

Default test runner in the kit Makefile is **Vitest**. Override with `TEST_CMD` /
`STRICT_TEST_CMD` in the project Makefile if you use `node:test` (document it here).

## Architecture invariants (the agent NEVER violates)
1. [e.g.: domain/ does not import from UI or HTTP frameworks / vscode]
2. [e.g.: no `any` without a justifying comment]
3. [e.g.: no secrets in source; no console.log in library production paths]
4. [e.g.: user-controlled paths are resolved under an allowed root]

## Conventions
- Commits: Conventional Commits in English
- Tests: Vitest (default) or node:test if documented; prefer tests for domain logic
- Types: strict TypeScript; validate at system boundaries
- Imports: consistent with project module setting (NodeNext ESM or bundler CJS)

## Mutation testing (optional)
`make mutation` runs Stryker. Run before releases or after big refactors — not per commit.

## Workflow

Route every implementation request through the harness before touching code
(routing rules: the `harness-mode` skill):

| Request | Route |
|---------|-------|
| Bug, small fix, quick adjustment (~3 files or fewer, no schema/API/auth/dependency change) | `/fix` |
| Small, well-understood feature | `/tasks` directly, then `/implement` |
| Complex or ambiguous feature | `/prd` -> `/techspec` -> `/tasks` -> `/implement` |
| Continuing a feature that already has a board | `/next` |

- Never commit — the human reviews the diff and commits.
- Never report a task as done without pasted `make check-strict` output and an APPROVED verdict from the QA reviewer.

## What NOT to do
- Do not add dependencies without asking
- Do not create abstractions for a single use case (YAGNI)
- Do not use `any` without justification
- Do not use `var`
- Do not skip path validation when writing under library/workspace roots
