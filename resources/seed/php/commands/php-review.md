# PHP Code Review

Perform a complete review of the PHP code modified in this session.

## Process

1. Identify the modified `.php` files via `git diff --name-only`
2. For each file, check:
   - `declare(strict_types=1)` present
   - Type hints on all parameters and return values
   - No use of `@` to suppress errors
   - Typed, specific exceptions
   - Tests exist for the new code
3. Run `make check` and report the full output
4. Report in this format:

```
VERDICT: APPROVED | APPROVED WITH RESERVATIONS | REJECTED
FILE: file.php
LINE: N — description of the issue
SUGGESTION: specific fix
```
