# Implement

Execute a single task from a feature's task board, end to end, with verification.

## Input

A task ID (e.g. `TASK-003-02`) or the path to its task file.

## Steps

1. Read the task file. If its status is BLOCKED or a dependency is not DONE, STOP and report.
2. Branch guardrail: run `git rev-parse --abbrev-ref HEAD`. If the result is `main`/`master`
   (case-insensitive), `HEAD` (detached), or the command fails, create and switch to a new working
   branch — `git checkout -b <type>/<task-slug>`, `<type>` from the Conventional Commits type list in
   `~/.claude/CLAUDE.md`, `<task-slug>` derived from the TASK-NNN-XX id or the feature slug — before
   doing anything else. Then set the task status to IN_PROGRESS (task file + `TASKS-{NNN}.md` board).
3. Assume the implementer role: `agents/implementer.md`. Read everything listed in the task's Context section before writing any code.
4. Work through the Subtasks checklist in order, test-first: write the test that captures the acceptance criterion, then the code that makes it pass. Check off each subtask as it is completed.
5. Run `make check-strict`. Fix failures — never suppress, skip, or weaken checks to pass (see `shared/skills/plankton-quality.md`).
6. Paste the passing output into the task file's Verification section, including the `coverage: X% (floor N%)` line — carry that line into the final report and, if a PR is opened, into the PR body too.
7. Run the `improve` skill (`shared/skills/improve.md`) in `branch` mode, scoped to the diff since the merge-base with the default branch. Tag every finding `introduced` or `pre-existing`. Fix `introduced` findings, or note in the task file exactly why one is explicitly accepted as out of scope — never carry an unaddressed `introduced` finding silently into QA.
8. Dispatch the QA reviewer (`agents/qa-reviewer.md`) as a subagent over the final diff — the implementer never reviews its own work. Give it the task description, the diff, the pasted gate output, and the improve findings from step 7 (fixed/accepted). On NEEDS WORK, fix the blocking issues and return to step 5.
9. Decide whether to commit autonomously:
   - If `make check-strict` (step 5) is not green: report the failing gate to the user and STOP. No
     commit.
   - Else if the QA reviewer's verdict (step 8) is not the literal `APPROVED` (e.g. `NEEDS WORK`):
     return to step 5 to fix, re-run the gate, and STOP here. No commit yet.
   - Else (gate green AND verdict APPROVED): run `git rev-parse --abbrev-ref HEAD` again — the branch
     may have changed mid-session. If the result is `main`/`master` (case-insensitive), `HEAD`
     (detached), or the command fails: set the task status to DONE (task file + board), report the
     diff summary and verification evidence, and ask the user to explicitly confirm the commit/push
     (current behavior, preserved as the fallback).
   - Otherwise (branch is a working branch, not main/master/detached): draft the commit message
     (Conventional Commits, English, per `~/.claude/CLAUDE.md`'s "Committing changes with git"
     protocol — parallel `git status`/`diff`/`log`, heredoc message, `git add` scoped to the task's
     files, never `-A`/`.`), then run `git commit` — never `--no-verify`, never `--amend` unless
     explicitly asked. If the commit fails (e.g. a pre-commit hook), fix the issue and create a NEW
     commit — never `--amend` after a hook failure, never skip hooks. Once the commit succeeds, run
     `git push` to the current working/feature branch — no additional confirmation. Set the task
     status to DONE (task file + board) and report the commit hash, push result, and diff summary to
     the user.

## Rules

- One task per invocation. Do not batch tasks — each produces one reviewable diff.
- Stay inside the task's Out of Scope boundaries. Tempting adjacent fixes become new tasks on the board.
- Never declare DONE without pasted `make check-strict` output and an APPROVED verdict from the QA reviewer.
- The human always reviews the diff. When the branch guardrail blocks autonomy (main/master/detached
  HEAD), this command ends at "ready for review, not merged" and waits for explicit confirmation. When
  all three signals line up (gate green, QA APPROVED, working branch), this command may end with the
  commit and push already done — the human still reviews the diff, but after the fact, on the remote
  branch.
