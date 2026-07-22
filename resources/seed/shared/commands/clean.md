# /clean

Assume the **cleaner** agent role (faxineiro) — see `agents/cleaner.md` or `.harness/agents/cleaner.md`.

## Input

Scope: feature paths, “this PR”, or whole repo. Default mode: **report-only**.

## Steps

1. Read the cleaner agent file and follow it fully.
2. Produce a cleanup report with SAFE_DELETE / LIKELY_DEAD / DOC_ONLY and evidence.
3. Do **not** delete until the user approves the SAFE_DELETE list.
4. After approval, apply and run the project quality gate.

## Notes

Auxiliary command — best at the **end** of a feature flow, after tests pass.
