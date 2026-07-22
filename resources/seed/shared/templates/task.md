# TASK-{NNN}-{XX}: {Task Title}

<!--
Template: Individual Task (PR-sized, self-contained context for one agent session)
Output location: .harness/docs/features/{NNN}-{slug}/tasks/TASK-{NNN}-{XX}.md
Sizing: the whole task fits in one focused agent session and produces one reviewable diff.
Subtasks are ~15-minute verifiable units (see shared/skills/agentic-engineering.md) — checklist items, not separate files.
-->

| Field | Value |
|-------|-------|
| Feature | {NNN}-{slug} |
| Task | TASK-{NNN}-{XX} |
| Status | TODO \| IN_PROGRESS \| DONE \| BLOCKED |
| Depends on | {TASK-{NNN}-{YY} or —} |

## Objective

<!-- One paragraph. What exists after this task that did not exist before. -->

## Context

<!-- Everything the implementing agent must read BEFORE writing code. Keep it minimal but sufficient —
     this section is what makes the task self-contained. -->

- Read: [PRD-{NNN}](../PRD-{NNN}.md) — section {X}
- Read: [TECHSPEC-{NNN}](../TECHSPEC-{NNN}.md) — section {X}
- Read: `{path/to/relevant/source/file}`
- Project guardrails: `{path or "none"}`

## Subtasks

<!-- ~15-minute verifiable units. Each checkbox must be independently checkable as done/not-done. -->

- [ ] {step 1}
- [ ] {step 2}
- [ ] {step 3}

## Acceptance Criteria

<!-- EARS notation, pass/fail. These are what the reviewer and verifier judge against. -->

1. WHEN {condition} THE SYSTEM SHALL {behavior}
2. WHEN {condition} THE SYSTEM SHALL {behavior}

## Verification

<!-- Done = evidence, not claims. -->

- [ ] `make check` passes — output pasted below before marking DONE
- [ ] New behavior covered by tests (test behavior, not implementation)

```text
{paste make check output here}
```

## Out of Scope

<!-- What this task deliberately does NOT touch, even if tempting. -->

- {item}
