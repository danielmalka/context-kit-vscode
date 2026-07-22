# Gate 3 — Checklist: Code Ready for Review?

**Owner:** implementer
**Prerequisite for:** qa-reviewer

---

## TDD — Cycle Respected

- [ ] All tests were written **before** the implementation (red first)
- [ ] Tests were failing for the right reason (not a syntax error)
- [ ] All tests defined in the TASK-{NNN}-{XX}.md are passing (green)
- [ ] No test was modified just to make the code pass

## Test Coverage

- [ ] `make check-strict` passed the global coverage floor (80% flat, `COVERAGE_MIN`) — this is a hard gate, not optional
- [ ] Business logic: ≥ 90% coverage (review judgment on new/changed code — the tool only checks the global floor, not per layer)
- [ ] Handlers/Controllers: ≥ 80% (review judgment, same caveat)
- [ ] Utilities: ≥ 70% (review judgment, same caveat)
- [ ] Edge cases from the spec have tests covering them

## Implementation Completeness

- [ ] All subtasks in the task file were implemented
- [ ] Each subtask has its corresponding atomic commit
- [ ] No unintentional TODOs or placeholders were left behind
- [ ] Subtasks marked "parallel" were all completed

## Repository Health

- [ ] The branch is up to date with the base (main/develop)
- [ ] No pre-existing test was broken
- [ ] Commits follow the project's standard format (Conventional Commits)
- [ ] No debug files or unintentional console.log/fmt.Println left behind

## Pre-QA Audit

- [ ] `improve` skill run in `branch` mode, scoped to the diff
- [ ] Every `introduced` finding was fixed, or explicitly accepted as out-of-scope with a reason noted in the task file

## Escalation

- [ ] If the Debugger protocol was triggered: the report is documented
- [ ] If escalated to an architectural decision: it's recorded in TECHSPEC-{NNN}.md
- [ ] No subtask is left in an unresolved failed state

---

**Status:** [ ] Pending | [x] Approved | [!] Rejected — return to `/implement`

**Approved by implementer:** [name]
**Date:** [yyyy-mm-dd]
**Notes:** [e.g. "Subtask 2 required a design escalation — decision recorded in TECHSPEC-{NNN}.md"]
