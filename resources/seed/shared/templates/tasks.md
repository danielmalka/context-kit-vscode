# TASKS-{NNN}: {Feature Title}

<!--
Template: Task Index (story-level view of the feature breakdown)
Output location: .harness/docs/features/{NNN}-{slug}/TASKS-{NNN}.md
Input: PRD-{NNN}.md + TECHSPEC-{NNN}.md
Individual tasks live in ./tasks/TASK-{NNN}-{XX}.md — this file is the index and status board.
-->

| Field | Value |
|-------|-------|
| Feature | {NNN}-{slug} |
| PRD | [PRD-{NNN}](./PRD-{NNN}.md) |
| Tech Spec | [TECHSPEC-{NNN}](./TECHSPEC-{NNN}.md) |
| Date | {YYYY-MM-DD} |

## Task Board

<!-- Tasks are topologically ordered: a task only lists dependencies that appear above it.
     Status values: TODO | IN_PROGRESS | DONE | BLOCKED -->

| ID | Title | Status | Depends on |
|----|-------|--------|-----------|
| [TASK-{NNN}-01](./tasks/TASK-{NNN}-01.md) | {title} | TODO | — |
| [TASK-{NNN}-02](./tasks/TASK-{NNN}-02.md) | {title} | TODO | TASK-{NNN}-01 |

## Phases

<!-- Optional grouping when the feature has natural stages (e.g. schema -> backend -> UI).
     Delete this section for small features. -->

### Phase 1: {name}

- TASK-{NNN}-01, TASK-{NNN}-02

## Rules

- One task = one PR-sized unit of work: independently implementable, testable, and reviewable.
- Update the Status column here whenever a task file's status changes. This board is the single source of progress truth.
- No circular dependencies. If two tasks depend on each other, they are one task.
- Discovered work mid-implementation becomes a NEW task here — never silently expand an existing one.
