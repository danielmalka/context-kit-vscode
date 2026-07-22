# Next

Pick the next actionable task on a feature's board and execute `/implement` on it — replaces the manual "what's next" ritual.

## Input

A feature number (e.g. `001`). If omitted, use the single feature under `.harness/docs/features/` with open (non-DONE) tasks; if more than one qualifies, ask which.

## Steps

1. Read the feature's `TASKS-{NNN}.md` board.
2. If a task is IN_PROGRESS, select it — resume, do not start a new one.
3. Else select the first TODO task (board order) whose dependencies are all DONE.
4. If no task qualifies:
   - All tasks DONE → report completion and suggest closing the feature.
   - Remaining TODO tasks are blocked → list each blocked task and its unmet dependencies. Implement nothing.
5. Announce the selected task in one line (ID + title).
6. Execute `shared/commands/implement.md` on it.

## Rules

- Never pick a task out of dependency order, even if a later TODO task looks easier.
- One task per invocation — same as `/implement`.
- Cross-feature selection is out of scope: pick within one feature only.
- This command ends at "ready for review", same as `/implement`.
