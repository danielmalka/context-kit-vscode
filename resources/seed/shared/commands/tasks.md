# Tasks

Break an approved PRD + Tech Spec into a dependency-ordered set of PR-sized tasks.

## Input

A feature number (e.g. `003`) or the path to its feature folder.

## Steps

1. Read the templates: `shared/templates/tasks.md` and `shared/templates/task.md`
2. Assume the role: `agents/task-planner.md`
3. Read `PRD-{NNN}.md` and `TECHSPEC-{NNN}.md` in full.
4. Decompose the work:
   - One task = one PR-sized unit: independently implementable, testable, reviewable in one agent session.
   - Micro-steps become subtask checklist items (~15-minute verifiable units, per `shared/skills/agentic-engineering.md`) inside the task file — never separate files.
   - Order tasks topologically by dependency. No cycles.
5. Create `TASKS-{NNN}.md` (index/status board) and one `tasks/TASK-{NNN}-{XX}.md` per task, following the templates.
6. For each task, fill the Context section with the minimal set of files and spec sections the implementing agent must read — the task must be executable without reading the whole feature folder.
7. Copy the relevant EARS acceptance criteria from the PRD into each task. Every PRD criterion must land in at least one task.
8. Present the board to the user for approval before any implementation starts.

## Rules

- Task granularity target: a few files touched, one reviewable diff. If a task needs more than ~5 files or one session, split it.
- The index board (`TASKS-{NNN}.md`) is the single source of progress truth — status changes are mirrored there.
- Work discovered later becomes a new task in the board, never a silent expansion of an existing one.
