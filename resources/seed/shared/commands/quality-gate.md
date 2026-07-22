# Quality Gate

Run the project's quality gate and fix all failures before committing.

## Steps

1. Run `make check` and capture the full output
2. If any check fails:
   - Fix lint errors: address each linter warning
   - Fix test failures: do not suppress or skip tests
   - Fix vet/type errors: never use `// nolint` without justification
3. Re-run `make check` until it passes with zero errors
4. Report the passing output in your response

## Rules

- Never declare a task complete if `make check` fails
- Never skip tests or suppress linter warnings to make the gate pass
- If a check reveals a deeper problem, address the root cause
