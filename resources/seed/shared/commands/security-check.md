# /security-check

Assume the **security-checker** agent role (see `agents/security-checker.md` or `.harness/agents/security-checker.md`).

## Input

Feature id, PR/diff scope, or paths to review (default: current branch vs main).

## Steps

1. Read the security-checker agent file and follow it fully.
2. Review only the scoped change unless a full audit is requested.
3. Emit the structured report with severities and evidence.
4. Propose tech-debt tasks for non-blocking issues; never defer BLOCKERs.

## Notes

Auxiliary command — recommended after `/implement`, before merge on sensitive surfaces.
