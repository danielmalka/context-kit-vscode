---
name: anti-slop
description: Detects and prevents erosion of AI-generated code — duplication, recurring code smells, iterative patches without refactoring. Use when reviewing agent-generated code and when detecting a Complexity Spiral.
---

# Anti-Slop — Fighting Code Erosion

"Slop" is AI-generated code that looks correct but erodes the system's quality over time. It's the result of iterative patches without refactoring, subtle duplication, and code smells the agent repeats systematically.

---

## Most common slop patterns in AI-generated code

### 1. Generic exception handling
```go
// Slop — catches everything, handles nothing
if err != nil {
    log.Println(err)
    return
}

// Correct — specific handling and proper propagation
if err != nil {
    return fmt.Errorf("fetching user %d: %w", id, err)
}
```

```python
# Slop
except Exception as e:
    print(e)

# Correct
except DatabaseConnectionError as e:
    raise ServiceUnavailableError("database unavailable") from e
```

### 2. Unused variables or names with no semantics
```typescript
// Slop
const data = await fetchUser(id)
const result = process(data)
// `data` is never used again under this name

// Correct
const user = await fetchUser(id)
const processedUser = normalizeUser(user)
```

### 3. Copy-paste logic with minimal variation
When the agent copies a block and changes only 1-2 values, it's slop. The fix is to extract the abstraction:
```
BAD:  findUserById(id) and findUserByEmail(email) with 90% duplicated code
GOOD: findUser(criteria: UserCriteria) with a single query point
```

### 4. Comments that describe the obvious
```python
# Slop
# Increment the counter
counter += 1

# Useful (when the why isn't obvious)
# Offset of 1 because the protocol uses base-1 indices
counter += 1
```

### 5. Iterative patches without refactoring (Complexity Spiral)

Warning sign: a function that has already been modified 3+ times with patches instead of a rewrite.

```
Iteration 1: simple function, 10 lines
Iteration 2: patch with an if for a special case, 18 lines
Iteration 3: patch with another if for an edge case, 28 lines
Iteration 4: patch for a bug introduced by the previous patch, 35 lines
```

When you detect this pattern: **stop and refactor**. The cost of refactoring now is lower than the cost of one more patch.

---

## Detection protocol

When reviewing agent-generated code, check:

**Duplication:**
```bash
# Identify duplicated blocks (Go)
grep -rn "func.*Handler" . --include="*.go" | wc -l
# If too high for the project's size, investigate

# Python: duplicated patterns
grep -rn "except Exception" . --include="*.py"
```

**Cyclomatic complexity:**
- Go: `gocyclo` (installed via golangci-lint with `cyclop`)
- Python: `ruff` with rule `C901`
- TypeScript: `eslint` with the `complexity` rule
- PHP: `phpstan` + `phpmd`

If a function exceeds complexity 10 → candidate for refactoring.

**Long functions:**
- Go: function > 40 lines → investigate
- Python: function > 30 lines → investigate
- TypeScript: function > 30 lines → investigate
- PHP: function > 40 lines → investigate

---

## Anti-slop refactoring protocol

When you detect slop:

1. **Don't add more patches** — stop
2. **Identify the root** — what should be an abstraction but isn't?
3. **Write the test first** — the current behavior must be preserved
4. **Refactor** — extract the abstraction, eliminate duplication
5. **Validate** — `make check` passes with the same tests
6. **Record** — in `session-memory.md`, the slop pattern found, so it isn't repeated

---

## When the agent produces slop systematically

If the same type of slop keeps appearing across sessions:

1. Add a lint rule that detects the pattern (if possible)
2. Add it to the project's `AGENTS.md` as an explicit anti-pattern
3. Record it in `ARCHITECTURE.md` under "What not to do"

The goal is to push the problem down the pyramid: from "I notice it in review" → to "the lint blocks it".
