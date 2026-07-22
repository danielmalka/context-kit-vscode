---
name: agentic-engineering
description: Framework for structured agentic development. Defines how to break work into verifiable units, route models by complexity, and ensure each task is independently validatable.
---

# Agentic Engineering

## Golden rule

Every task must be completable in 15 minutes and have a clear, verifiable done criterion defined before starting.

If you can't state "how to know it's done" in one sentence, the task is too big. Break it down.

---

## Anatomy of a well-formed task

```
TASK: [verb + specific object]
CONTEXT: [affected files, relevant interfaces]
DONE CRITERION: [what make check will validate + what the human will verify]
ESTIMATE: [≤15min]
DEPENDENCIES: [tasks that must be complete beforehand]
```

**Well-formed example:**
```
TASK: Add max-size validation to the POST /uploads endpoint
CONTEXT: src/handlers/upload.go, pkg/validation/rules.go
DONE CRITERION: go test ./... passes, input >10MB returns 413, valid input returns 200
ESTIMATE: 10min
DEPENDENCIES: none
```

**Poorly-formed example:**
```
TASK: Implement the upload system
(No done criterion, no scope, probably takes hours)
```

---

## Model routing by complexity

Before starting any task, classify it:

| Task type | Model | Examples |
|-------------|--------|---------|
| Boilerplate and formatting | Haiku | Generate a struct, rename a variable, format a file |
| Standard implementation | Sonnet | HTTP handler, SQL query, unit test, refactor |
| Complex business logic | Sonnet | Algorithm with multiple edge cases, API integration |
| Architecture and irreversible decisions | Opus | Public API design, database structure, auth system |
| Critical security | Opus | Auth, permissions, cryptography, external input validation |

**Rule of thumb:** if the task involves something hard to undo or affects many other modules → Opus. If it's localized implementation with a clear spec → Sonnet. If it's mechanical → Haiku.

---

## Execution sequence

For each task:

1. **Define** the done criterion before writing code
2. **Write evals** for system behavior (see `eval-harness`)
3. **Write tests** for code behavior (TDD)
4. **Implement** the minimum needed to pass the tests
5. **Validate** with `make check`
6. **Verify** with the inferential sensor (see `harness-reviewer`)

Never skip step 1. Never start step 4 without step 3.

---

## Context management between tasks

When starting a new session or after 3+ tasks:
- Read the project's `AGENTS.md` to re-anchor
- Check `ARCHITECTURE.md` if it exists (see `context-engineering`)
- Consult the previous session's `session-memory.md` if it exists

Don't assume the previous session's context is available.

---

## When the agent gets stuck

If a task is taking more than 15 minutes or `make check` fails repeatedly:

1. **Stop** — don't keep piling up patches
2. **Audit** — what exactly is failing?
3. **Reduce scope** — can the task be made smaller?
4. **Replay** — restart the task with more explicit criteria

Patch loop without an audit → Complexity Spiral. Always prefer starting over with a clearer spec over continuing to stack fixes.

---

## Anti-patterns to avoid

- Task with no done criterion → don't start
- More than 3 files modified in a task → break it down
- Test deleted or skipped to make the check pass → revert (see `plankton-quality`)
- Task that depends on the result of another incomplete task → wait
- Implementation before tests → revert and follow TDD
