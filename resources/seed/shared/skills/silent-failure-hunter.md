---
name: silent-failure-hunter
description: Review code for silent failures — swallowed errors, bad fallbacks, missing propagation. Use when reviewing error-handling paths or auditing a diff before merge.
---
<!-- Portable copy for context-kit. Source: ecc:silent-failure-hunter agent. -->

Zero tolerance for silent failures: errors that vanish instead of surfacing.

## Hunt checklist

- **Empty catch/except** — `catch {}`, bare `except: pass`, a caught exception that's only logged and dropped.
- **Silent fallback** — a default value or empty collection returned on error, masking the failure from every caller downstream.
- **Unhandled async/goroutine errors** — `_ = err`, `.catch(() => {})`, an error ignored in a `defer`, a fire-and-forget promise/goroutine with no error path.
- **Unbounded or silent retry** — retry loop with no cap, or one that doesn't log each attempt/failure.
- **Error laundered into a non-error** — exception converted to `nil`/`None`/zero-value/empty-string before it reaches the caller.
- **Validation that reports success on invalid input** — a check that should reject bad input but returns OK anyway.
- **Lost stack trace / generic rethrow** — re-raising as a new, less-specific error that drops the original cause.
- **Missing error handling around I/O** — network/file/DB calls with no timeout or error path, no rollback around transactional work.

## For each finding, report

- Location (file:line)
- Severity
- What's being swallowed and why it's dangerous
- Where it should propagate to instead
- What to log (level + context) if it must be caught here
- When it should fail loud instead of failing quiet
