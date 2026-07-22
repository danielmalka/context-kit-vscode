# AGENTS.md — [Project Name]

## Stack
Go 1.22+

## Available skills
Harness skills live in `.claude/skills/`. Read the relevant `SKILL.md` before implementing.

## Verification commands (sensors)
- `make check` — fmt-check + lint + test (mandatory before any commit)
- `make check-strict` — fmt-check + lint + vet + race detector + coverage
- `make mutation` — mutation testing (optional, see below)
- `make arch-check` — forbidden-dependency scan; runs automatically inside `check-strict`.
  Write path-scoped forbidden-dependency greps directly in the Makefile arch-check target,
  derived from the bounded contexts below. Empty target = no invariants defined yet.

## Architecture invariants (the agent NEVER violates)
1. [e.g.: handlers never access the database directly — always via repository]
2. [e.g.: errors always wrapped with context: fmt.Errorf("op: %w", err)]
3. [e.g.: no logging of personal data]

## Conventions
- Commits: Conventional Commits in English
- Tests: go test, test file alongside the code (*_test.go)
- Interfaces: defined in the consumer package, not the producer

## Mutation testing (optional)
`make mutation` runs gremlins. Run it before releases or after big refactors — not per commit,
it's too slow for a gate. Read the score as a test-quality signal (are the existing tests strong
enough to catch injected faults?), not as a merge gate.

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
- Do not add dependencies without asking
- Do not create abstractions for a single use case (YAGNI)
- Do not ignore errors with `_` without a justifying comment
- Do not use `panic()` outside main() or init()
