# Fix

Fast path for bugs, small fixes, and quick adjustments. Skips the PRD/techspec/tasks chain but keeps every gate (per ADR-002: rigor scales through the workflow, artifacts scale with the change).

## When it applies

All of the following must be true:

- Touches ~3 files or fewer
- No schema, API contract, auth, or new-dependency changes
- Restores or adjusts existing behavior — does not add a feature

If any check fails — or the work grows past these limits mid-flight — STOP and route to the spec-driven chain (`/prd`, or `/tasks` directly for small well-understood features).

## Steps

1. Read the project's `AGENTS.md` and its guardrails (`projects/<name>/guardrails.md` if registered).
2. **Regression test first.** Reproduce the bug as a new test that fails before any fix is applied. If it cannot be captured in a test, say why in the final report — don't skip this silently.
3. Fix the root cause, not the symptom: grep every caller of what you change before editing. Iterate until the regression test goes green.
4. Run `make check-strict`. Fix failures — never suppress, skip, or weaken checks to pass.
5. Dispatch the QA reviewer (`agents/qa-reviewer.md`) as a subagent over the final diff. On NEEDS WORK, fix the blocking issues and return to step 4.
6. Report: diff summary, pasted gate output, reviewer verdict. This command ends at "ready for review" — the human commits.

## Rules

- No task board, no spec artifacts — the failing test is the spec.
- The regression test lands in the same commit as the fix — never split them across commits.
- Same gates as `/implement`: `make check-strict` output and an APPROVED verdict are non-negotiable.
- Adjacent problems found along the way become new `/fix` runs or board tasks, never scope creep.

## Debugger protocol (when the fix is not obvious)

Use when: root cause is unclear, or the same approach failed **3 times**.

### Phase A — Reproduce
- Minimal steps or failing test that fails **before** any new fix.
- Capture exact error, environment, and last known good.

### Phase B — Isolate
- Binary search: which module/layer breaks?
- One variable at a time; avoid multi-change thrashing.

### Phase C — Root cause
- State the cause in one sentence (not "maybe X").
- List evidence (stack, log line, test name).

### Phase D — Fix
- Smallest change that addresses the cause.
- Keep the regression test green; run `make check-strict`.

### Escalation
- After **3 full A–D loops** without a verified fix: stop and escalate to human (and/or re-open `/techspec` if design is wrong).
- Do not expand scope into a feature rewrite under `/fix`.

## Debug report (required when protocol was used)

```markdown
# Debug Report

## Symptom
## Reproduction (test or steps)
## Isolation notes
## Root cause
## Fix summary
## Evidence (`make check-strict` excerpt)
## Attempts (max 3) — what was tried and why it failed
```
