# AGENTS.md — [Project Name]

## Stack
PHP 8.3 + [Laravel 11 | Slim | Symfony] (Docker — service: app)

## Available skills
Harness skills live in `.claude/skills/`. Read the relevant `SKILL.md` before implementing.

## Verification commands (sensors)
- `make check` — fmt-check + stan + test (mandatory before any commit)
- `make check-strict` — fmt-check + stan max + test with coverage
- `make mutation` — mutation testing (optional, see below)
- `make arch-check` — forbidden-dependency scan; runs automatically inside `check-strict`.
  Write path-scoped forbidden-dependency greps directly in the Makefile arch-check target,
  derived from the bounded contexts below. Empty target = no invariants defined yet.

## Architecture invariants (the agent NEVER violates)
1. [e.g.: controllers contain no business logic — always via Service/UseCase]
2. [e.g.: no direct database access outside the Repository]
3. [e.g.: no logging of personal data]

## Conventions
- Commits: Conventional Commits in English
- Tests: Pest, in tests/, organized by feature
- Typing: strict_types=1 in every PHP file

## Mutation testing (optional)
`make mutation` runs Infection. Run it before releases or after big refactors — not per commit,
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
- Do not use @ to suppress errors
- Do not use `mixed` without justification
