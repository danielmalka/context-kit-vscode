# Python Code Review

Perform a complete review of the Python code modified in this session.

## Process

1. Identify the modified `.py` files via `git diff --name-only`
2. For each file, check:
   - Type hints on public functions
   - No `except Exception: pass`
   - No `type: ignore` without justification
   - No mutable default arguments
   - Tests exist for the new code
3. Run `make check` and report the full output
4. Report in this format:

```
VERDICT: APPROVED | APPROVED WITH RESERVATIONS | REJECTED
FILE: file.py
LINE: N — description of the issue
SUGGESTION: specific fix
```
