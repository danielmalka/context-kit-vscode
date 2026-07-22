# Go Code Review

Perform a full review of the Go code modified in this session.

## Process

1. Identify the modified `.go` files via `git diff --name-only`
2. For each file, check:
   - Errors handled explicitly (no `_ = err`)
   - Errors wrapped with context (`fmt.Errorf("...: %w", err)`)
   - Interfaces properly small (1-3 methods)
   - Goroutines with cancellation context
   - Tests exist for the new code
3. Run `make check` and report the full output
4. Report in this format:

```
VERDICT: APPROVED | APPROVED WITH RESERVATIONS | REJECTED
FILE: file.go
LINE: N — description of the issue
SUGGESTION: specific fix
```
