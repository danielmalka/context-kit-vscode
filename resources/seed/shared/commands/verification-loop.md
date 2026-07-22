---
name: verification-loop
description: Final pre-PR gate. Runs build, types, lint, tests, security scan, and diff review in sequence. Blocks if any phase fails.
---

# Verification Loop — Pre-PR Gate

Run before opening any Pull Request or merging. Each phase must pass before moving to the next.

---

## Phase 1 — Build

Verify the project compiles without errors.

**Go:** `go build ./...`
**PHP:** `docker compose exec -T app php -l src/` (or equivalent)
**Python:** `uv run python -m py_compile $(find . -name "*.py" -not -path "./.venv/*")`
**TypeScript:** `npx tsc --noEmit`

**Pass criterion:** output with no errors. Warnings are acceptable, errors are not.

---

## Phase 2 — Type check

**Go:** `go vet ./...`
**PHP:** `docker compose exec -T app vendor/bin/phpstan analyse --level=8`
**Python:** `uv run mypy .`
**TypeScript:** `npx tsc --noEmit --strict`

**Pass criterion:** zero type errors. Suppressing type errors with `// @ts-ignore` or `# type: ignore` invalidates this phase.

---

## Phase 3 — Lint

Run the linter configured for the language:

**Go:** `golangci-lint run ./...`
**PHP:** `vendor/bin/php-cs-fixer fix --dry-run --diff`
**Python:** `uv run ruff check . && uv run ruff format --check .`
**TypeScript:** `npx eslint src`

**Pass criterion:** zero violations that aren't documented false positives.

---

## Phase 4 — Tests

**Go:** `go test -race -count=1 ./...`
**PHP:** `docker compose exec -T app vendor/bin/pest`
**Python:** `uv run pytest`
**TypeScript:** `npx vitest run`

**Pass criterion:** all tests pass. Skipping tests (`.skip`, `xit`, `t.Skip()`) requires documented justification.

---

## Phase 5 — Security scan

Search for known security patterns:

```bash
# Hardcoded secrets
grep -rn "sk-\|api_key\s*=\|password\s*=\|Bearer " . \
  --include="*.go" --include="*.php" --include="*.py" --include="*.ts" \
  --exclude-dir=".git" --exclude-dir="node_modules" --exclude-dir=".venv"

# Console.logs with data (TypeScript)
grep -rn "console\.log.*user\|console\.log.*token\|console\.log.*password" . --include="*.ts"

# Debug statements (Python)
grep -rn "print(.*password\|print(.*token\|print(.*secret" . --include="*.py"
```

Additionally: run `make check`, which includes a dependency audit if configured.

**Pass criterion:** no unjustified matches.

---

## Phase 6 — Diff review

Review the full diff before opening the PR:

```bash
git diff main...HEAD
```

Check:
- [ ] No debug or temporary files included
- [ ] No `.env` or secret file included
- [ ] Scope of changes matches the task (no unrelated changes)
- [ ] Commit messages follow Conventional Commits

---

## Final verdict

After all 6 phases:

- `READY`: all phases passed → open the PR
- `NOT READY`: [phase that failed] — fix and rerun from the failed phase

Don't skip phases. Don't open a PR with any phase failing.

If a failure only shows up after merge (in production), prefer reverting to the last known-good state over fixing under pressure on top of what already broke — then reopen the gate from scratch on the fix.
