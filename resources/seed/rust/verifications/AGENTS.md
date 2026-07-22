# AGENTS.md — [Project Name]

## Stack
Rust (edition 2021+), stable toolchain

## Available skills
Harness skills live in `.claude/skills/`. Read the relevant `SKILL.md` before implementing.

## Verification commands (sensors)
- `make check` — fmt-check + clippy + test (mandatory before any commit)
- `make check-strict` — check + clippy pedantic (all features) + cargo audit
- `make arch-check` — forbidden-dependency scan; runs automatically inside `check-strict`.
  Write path-scoped forbidden-dependency greps directly in the Makefile arch-check target,
  derived from the bounded contexts below. Empty target = no invariants defined yet.

## Architecture invariants (the agent NEVER violates)
1. [e.g.: handlers never touch the database directly — always via a repository trait]
2. [e.g.: errors always typed with `thiserror` (libs) or wrapped with `anyhow::Context` (bins)]
3. [e.g.: no logging of personal data]

## Conventions
- Commits: Conventional Commits in English
- Tests: `cargo test --all`, unit tests in `#[cfg(test)] mod tests` alongside the code, integration tests in `tests/`
- Public API: document with `///` doc comments; run `cargo doc` to catch broken links

## Workflow

Route every implementation request through the harness before touching code
(routing rules: the `harness-mode` skill in `.claude/skills/`):

| Request | Route |
|---------|-------|
| Bug, small fix, quick adjustment (~3 files or fewer, no schema/API/auth/dependency change) | `/fix` |
| Small, well-understood feature | `/tasks` directly, then `/implement` |
| Complex or ambiguous feature | `/prd` -> `/techspec` -> `/tasks` -> `/implement` |
| Continuing a feature that already has a board | `/next` |

- Never commit — the human reviews the diff and commits.
- Never report a task as done without pasted `make check-strict` output and an APPROVED verdict from the QA reviewer.

## What NOT to do
- Do not add dependencies (`thiserror`, `anyhow`, etc.) without asking
- Do not create abstractions for a single use case (YAGNI)
- Do not use `unwrap()` / `expect()` outside tests or examples
- Do not add `unsafe` without a `// SAFETY:` comment justifying the invariant
