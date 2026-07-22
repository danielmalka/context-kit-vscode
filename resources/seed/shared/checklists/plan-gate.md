# Gate 2 — Checklist: Task Board Approved?

**Owner:** task-planner
**Prerequisite for:** `/implement`

---

## Consistency with PRD/TECHSPEC

- [ ] TASKS-{NNN}.md references the correct PRD-{NNN}/TECHSPEC-{NNN}
- [ ] Each task maps to at least one PRD acceptance criterion
- [ ] No task implements anything outside the approved criteria
- [ ] The board covers **all** acceptance criteria from the PRD

## Task Quality

- [ ] Each task is atomic: a single purpose, implementable in one agent session
- [ ] Each task's Context section is sufficient for the implementer without re-reading the whole feature folder
- [ ] Each task has a verifiable completion criterion
- [ ] No task is bigger than "one PR-sized diff" (~5 files or fewer)

## Dependencies and Parallelism

- [ ] Dependencies between tasks are explicit (`Depends on: TASK-{NNN}-{XX}`)
- [ ] Tasks that can run in parallel are identified
- [ ] No circular dependency between tasks
- [ ] External dependencies (libs, services) are listed at the top of the board

## Test Coverage Planning

- [ ] Each task lists the test names it will produce (red-first, not yet written)
- [ ] Listed tests cover the corresponding PRD/TECHSPEC scenario
- [ ] Critical edge cases have tests defined
- [ ] Minimum coverage criteria are defined per code type

---

**Status:** [ ] Pending | [x] Approved | [!] Rejected — return to `/tasks`

**Approved by:** [name]
**Date:** [yyyy-mm-dd]
**Notes:** [optional — e.g. "TASK-003 split into 03a and 03b"]
