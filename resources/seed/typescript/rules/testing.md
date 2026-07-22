# TypeScript — Testing

Mandatory testing standards for TypeScript projects in the SDD harness.

## Layout

```
tests/
  unit/           ← pure domain, no network, minimal fs (temp dirs OK)
  integration/    ← real fs layout, subprocess, or host seams
src/
  foo.ts
  foo.test.ts     ← optional co-located unit tests (Vitest style)
```

Either **co-located** `*.test.ts` next to sources or a top-level `tests/` tree is fine — pick one per project and stay consistent. This kit’s TypeScript Makefile defaults to **Vitest**; projects may use **node:test** if the Makefile `test` target is adjusted and documented in AGENTS.md.

## What to test

| Layer | Priority | How |
|-------|----------|-----|
| Domain pure functions (parse, hash, validate, path matrix) | Highest | Table-driven unit tests |
| Deploy / install / fs planners | High | Temp directories, assert tree |
| VS Code UI / commands | Medium | Thin wrappers; mock `vscode` or keep logic out of UI |
| Network | High when present | Mock fetch; contract tests optional |

## Style

```ts
import { describe, it } from "node:test"; // or vitest
import assert from "node:assert/strict";

describe("contentHash", () => {
  it("normalizes CRLF", () => {
    assert.equal(contentHash("a\r\nb"), contentHash("a\nb"));
  });
});
```

- Prefer **strict assert** / Vitest expect with clear failure messages.
- Name tests by behavior: `does not overwrite dirty seed assets`.
- Use table-driven cases for validators and parsers.
- No tests that only assert “not throws” without checking outcome.

## Coverage floor

- `make check-strict` enforces `COVERAGE_MIN` (default **80%** lines) when the runner supports coverage.
- Missing coverage tooling on a project is a BLOCKER for QA until measured or explicitly waived in AGENTS.md with a date and reason.
- Prefer covering domain modules first; UI glue can lag with a note.

## Forbidden

- Deleting or gutting tests to pass the gate
- Snapshot-only tests for security-sensitive logic
- Tests that depend on wall-clock flakiness without fake timers
- Hitting real external APIs in unit tests

## Gate

```bash
make check        # fmt + lint + type-check + test
make check-strict # + coverage floor + arch-check
```
