# AGENTS.md — [Project Name]

## Stack
Python 3.12+ with uv

## Available skills
Harness skills live in `.claude/skills/`. Read the relevant `SKILL.md` before implementing.

## Verification commands (sensors)
- `make check` — ruff lint + format check (mandatory before any commit)
- `make check-strict` — ruff + mypy + pytest
- `make mutation` — mutation testing (optional, see below)
- `make arch-check` — forbidden-dependency scan; runs automatically inside `check-strict`.
  Write path-scoped forbidden-dependency greps directly in the Makefile arch-check target,
  derived from the bounded contexts below. Empty target = no invariants defined yet.

## Architecture invariants (the agent NEVER violates)
1. [e.g.: business logic does not depend directly on the web framework]
2. [e.g.: no print() in production code — use logging]
3. [e.g.: type hints mandatory on all public functions]

## Conventions
- Commits: Conventional Commits in English
- Tests: pytest, in tests/
- Package manager: uv

## Mutation testing (optional)
`make mutation` runs mutmut. Run it before releases or after big refactors — not per commit, it's
too slow for a gate. Read the score as a test-quality signal (are the existing tests strong enough
to catch injected faults?), not as a merge gate.

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
- Do not use `type: ignore` without a comment
- Do not use `except Exception: pass`
