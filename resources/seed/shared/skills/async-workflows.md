---
name: async-workflows
description: Patterns for asynchronous agentic workflows with an explicit time and compute budget. For long Pro sessions, mass migrations, and sub-agent delegation.
---

# Async Workflows — Agentic Flows with a Reasoning Budget

## When to use asynchronous flows

Use asynchronous flows when:
- The task takes more than 30 minutes to run
- It involves more than 10 files
- It requires multiple independent iterations (e.g., migrating 50 endpoints)
- It can be parallelized into independent sub-tasks

Don't use them for: tasks that require frequent human decisions, critical-security tasks (always synchronous with review), tasks under 30 minutes.

---

## Reasoning Budget — explicit time and compute limit

Before any long session, define:

```
BUDGET:
  max_time: [X minutes]
  max_tasks: [N tasks]
  max_files: [M files modified]
  checkpoint_every: [K tasks]
```

**Example:**
```
BUDGET:
  max_time: 60 minutes
  max_tasks: 20 tasks
  max_files: 30 files
  checkpoint_every: 5 tasks
```

If the budget is reached before completion: **stop, report the state, wait for instructions**. Never extend the budget automatically.

---

## Flow patterns

### Pattern 1 — Sequential pipeline

For tasks with linear dependencies:

```
Task A → Task B → Task C → final verification
```

Rules:
- Each task has a verifiable done criterion
- Task B only starts after Task A passes `make check`
- Automatic freeze if any task fails

**Implementation:**
```
1. Run Task A
2. Run make check
3. If it fails → FREEZE (see freeze protocol)
4. If it passes → run Task B
5. Repeat
```

### Pattern 2 — Fan-out for independent tasks

For tasks with no dependency on each other:

```
              ┌─ Task A ─┐
Initial task ─┤─ Task B ─┼─ final verification
              └─ Task C ─┘
```

Rules:
- Tasks must be truly independent (different files)
- Final verification only happens after all tasks
- Any failure in final verification: identify which task caused it and fix only that one

### Pattern 3 — Loop with convergence

For discovery tasks (e.g., "find and fix all N issues"):

```
while (remaining_issues > 0 AND remaining_budget > 0):
    find next issue
    fix it
    verify
    update the issue list
```

Rules:
- Maximum iteration limit defined in the budget
- Checkpoint every K iterations
- If K iterations didn't reduce the issues: FREEZE and report

---

## Freeze protocol

When the quality gate fails during an asynchronous flow:

1. **Stop immediately** — don't move to the next task
2. **Identify** — which task caused the failure? Which file?
3. **Reduce scope** — can the failure be fixed in under 5 minutes?
   - Yes → fix it, run `make check`, resume
   - No → report to the developer with: the file that failed, the exact error, fix options
4. **Replay** — after fixing, rerun the task that failed (don't skip it)

**Never:**
- Move to the next task with an active failure
- Suppress errors to "unblock" the pipeline
- Modify the quality gate to let the failure pass

---

## Sub-agent delegation

When delegating to sub-agents:

**Minimum instruction for each sub-agent:**
```
TASK: [specific description]
FILES: [exact list of files to modify]
DONE CRITERION: [verifiable result]
BUDGET: [maximum time]
WHO TO NOTIFY: [agent or developer on completion]
```

**What not to delegate:**
- Decisions that require undocumented project context
- Critical-security tasks (auth, permissions, cryptography)
- Any task that could escalate permissions or access secrets

---

## Checkpoint and reporting

Every K tasks (as defined in the budget):

```
CHECKPOINT [number]:
  Tasks completed: [N of M]
  Files modified: [list]
  Time elapsed: [X minutes of Y]
  Issues found: [list or "none"]
  Next tasks: [list]
  Remaining budget: [percentage]
```

Report to the developer before continuing if:
- Budget > 80% consumed
- The current task looks much more complex than estimated
- An unexpected architecture decision is needed
