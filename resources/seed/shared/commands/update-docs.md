# /update-docs

<!-- Portable copy for context-kit. Source: ecc:update-docs command. -->

Sync documentation from source-of-truth files — never invent behavior the code doesn't show.

## Sources of truth

| Source | Generates |
|--------|-----------|
| `package.json` / `Makefile` / `Cargo.toml` / `pyproject.toml` scripts | Available-commands reference |
| `.env.example` (or `.template`/`.sample`) | Environment variable documentation |
| `openapi.yaml` / route files | API endpoint reference |
| Source code exports | Public API documentation |
| `Dockerfile` / `docker-compose.yml` | Infrastructure setup docs |

## Steps

1. Read the scripts/commands file for the project's stack and extract each command with its real purpose (from the command itself, not guessed).
2. Read the env-example file and document each variable: required vs optional, expected format, valid values.
3. Update (or generate) `docs/CONTRIBUTING.md`: environment setup, available scripts, how to run/write tests, lint/format/pre-commit enforcement, PR checklist.
4. Update (or generate) `docs/RUNBOOK.md`: deployment steps, health-check endpoints, common issues and fixes, rollback procedure, escalation path.
5. Detect drift: find docs untouched in 90+ days and cross-reference against recent code changes in the area they describe; flag anything that looks stale instead of silently rewriting it.
6. Report a summary: what was updated, what was flagged as stale, what was skipped because no change was detected.

## Rules

- Single source of truth: generate from the real code/config, never manually author generated sections.
- Preserve hand-written prose — only touch the generated sections.
- Mark generated content so future runs know what's safe to regenerate.
- Don't create new doc files unless explicitly requested; prefer updating what exists.
