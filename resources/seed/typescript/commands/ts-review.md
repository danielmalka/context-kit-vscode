# TypeScript Code Review

Perform a complete review of the TypeScript code modified in this session.

## Process

1. Identify the modified `.ts/.tsx` files via `git diff --name-only`
2. For each file, check:
   - No use of `any` without justification
   - No `// @ts-ignore` without justification
   - No `var`
   - Async/await with error handling
   - Tests exist for the new code
3. Run `make check` and report the full output
4. Report in this format:

```
VERDICT: APPROVED | APPROVED WITH RESERVATIONS | REJECTED
FILE: file.ts
LINE: N — description of the issue
SUGGESTION: specific fix
```
