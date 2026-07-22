---
name: superpowers-workflow
description: Use when starting creative/implementation work, writing a multi-step plan, executing that plan, debugging any failure, or closing out a finished branch — the full brainstorm-to-merge development cycle.
---

<!-- Portable mirror for context-kit. Source: claude-plugins-official/superpowers 6.1.1 (skills: brainstorming, writing-plans, executing-plans, test-driven-development, systematic-debugging, finishing-a-development-branch). -->

# Superpowers Workflow

A five-phase cycle for building anything non-trivial. Each phase gates the next — don't skip ahead because the task "looks simple"; simple tasks are where unexamined assumptions cause the most rework.

## 1. Brainstorm before creating anything

Before writing code, scaffolding a project, or touching config: understand intent through dialogue, not assumption.

- Explore project context first (files, docs, recent commits).
- Ask clarifying questions one at a time — purpose, constraints, success criteria. Prefer multiple choice.
- Propose 2-3 approaches with trade-offs and a recommendation.
- Present the design in sections scaled to complexity, get approval per section.
- Write the design to a spec doc; self-review for placeholders, contradictions, ambiguity, scope before asking the user to review it.
- If the request bundles multiple independent subsystems, decompose into sub-projects first — each gets its own spec/plan/implementation cycle.

## 2. Plan with bite-sized tasks

Turn the approved spec into a plan an executor with zero context can follow.

- Map file structure first: one clear responsibility per file, decomposition decisions locked in before tasks are drawn.
- Each task is the smallest unit worth its own test cycle and review gate.
- Each step inside a task is one action (2-5 min): write the failing test → run it, confirm it fails → implement the minimal code → run it, confirm it passes → commit.
- No placeholders ("TBD", "handle edge cases", "similar to Task N") — every step has real file paths, real code, real commands with expected output.
- Self-review the finished plan against the spec for coverage, placeholders, and signature consistency across tasks.

## 3. Execute task by task

- Load the plan, review it critically, raise concerns before starting.
- Per task: mark in progress → follow every step exactly → run its verification → mark complete.
- Checkpoint for review between tasks rather than batching silently through all of them.
- Stop and ask when blocked (missing dependency, unclear instruction, repeated verification failure) — don't guess through it.

## 4. TDD — never code before the test

**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.** Wrote code first? Delete it, start over — don't keep it "as reference."

Red → Green → Refactor:
1. Write one minimal test for one behavior. Give it a name that describes the behavior.
2. Run it. Confirm it fails, and fails for the right reason (missing feature, not a typo).
3. Write the simplest code that passes it — no extra options, no "while I'm here" generalization.
4. Run it. Confirm it passes and nothing else broke.
5. Refactor only with tests green; don't add behavior during refactor.

A bug fix is a failing test that reproduces the bug, then the minimal fix — never a fix without a regression test.

## 5. Debug systematically — root cause, not symptom

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.** This applies especially under time pressure, when a fix "seems obvious," or after a previous fix didn't work.

1. **Root cause investigation**: read the full error/stack trace, reproduce it reliably, check recent changes, and for multi-component systems add instrumentation at each boundary to see where it actually breaks.
2. **Pattern analysis**: find working examples of the same pattern elsewhere in the codebase, diff against the broken case, list every difference.
3. **Hypothesis and test**: state one hypothesis explicitly, make the smallest change that tests it, verify before moving on — never stack fixes.
4. **Implementation**: write a failing test reproducing the bug, fix the root cause with one change, verify. If 3+ fix attempts fail, stop guessing and question the architecture instead of trying a 4th patch.

## Closing a branch

Once all tasks are done and tests pass:

1. Verify the full test suite is green — never present options with failing tests.
2. Detect the workspace (normal repo vs. worktree vs. detached HEAD) to know which menu and cleanup path apply.
3. Present exactly the available options (merge locally / push + PR / keep as-is / discard) — no open-ended "what next?".
4. Execute the chosen option; only clean up the workspace for merge or discard, never for PR or keep-as-is.
5. Discard requires a typed confirmation before anything is deleted.

## Mapping to context-kit flow

| Superpowers phase | context-kit equivalent |
|---|---|
| Brainstorm + write plan | `/prd`, `/techspec`, `/tasks` |
| Execute plan (one task, checkpointed) | `/implement` — one task per invocation, gated by `make check-strict` + QA reviewer verdict |
| Debug a failure | `shared/commands/fix.md` — failing test first, root cause, same gates as `/implement` |
| Close out the branch | quality gate green + QA reviewer APPROVED verdict, per this repo's commit protocol |
