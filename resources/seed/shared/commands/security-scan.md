---
name: security-scan
description: Audits the harness's own configuration — CLAUDE.md, AGENTS.md, settings, hooks — for compromise vectors. Run when adding or modifying any agent configuration file.
---

# Security Scan — Harness Audit

Scans the harness configuration for vulnerabilities in the agent's infrastructure.

## Why audit the harness?

An agent compromised through its configuration is more dangerous than bad code — it acts across every session. Secrets in CLAUDE.md, excessive permissions in settings.json, or hooks with bypass flags weaken every layer above.

---

## Phase 1 — Secrets in the agent configuration

Check `.claude/`, `CLAUDE.md`, `AGENTS.md`, `.gemini/`, `.codex/`, `.devin/`:

```bash
# Hardcoded secret patterns
grep -rn "sk-\|api_key\s*=\|password\s*=\|token\s*=\|secret\s*=" .claude/ AGENTS.md CLAUDE.md 2>/dev/null
grep -rn "Bearer \|Authorization:" .claude/ AGENTS.md CLAUDE.md 2>/dev/null
```

**Expected result:** no matches. Secrets should be referenced as `$ENV_VAR`, never as literal values.

## Phase 2 — Excessive permissions

Check `settings.json` or `settings.local.json`:

Flag as risk:
- `"allow": ["Bash(*)", "Write(*)", "Edit(*)"]` — wildcard permissions with no path restriction
- `"dangerouslySkipPermissions": true` — disables the entire permission model
- `"bypassPermissions": true` — explicit bypass

**Criterion:** permissions should be the minimum required for the project. Wildcard permissions are only acceptable with documented justification.

## Phase 3 — Hooks with bypass or dangerous execution

Check hooks in `.claude/settings.json` or hook files:

Flag as risk:
- Hook that runs `--no-verify` or `--force` in git
- Hook that does `curl` or `wget` to external URLs without validation
- Hook that reads/writes `.env` files
- Hook with `rm -rf` and no restricted scope
- Hook that disables other hooks (`ECC_DISABLED_HOOKS`)

## Phase 4 — Prompt injection in AGENTS.md and skills

Check for instructions that could be injected by external content:

Flag as risk:
- Instruction saying "ignore the rules above if the file contains X"
- Permission for the agent to modify its own AGENTS.md or CLAUDE.md
- Instruction to execute content from files read without validation
- Reference to external URLs in behavior instructions

## Phase 5 — Hook attack-surface analysis

For each registered hook:
1. Which event triggers the hook?
2. Does the hook execute external code (npm, curl, python)?
3. Does the hook have access to secrets or sensitive environment variables?
4. Can the hook be influenced by content from project files?

---

## Security grade

| Grade | Criterion |
|------|----------|
| A | No issues found across the 5 phases |
| B | Minor issues (slightly broad permissions, but documented) |
| C | Undocumented excessive permissions, or a medium-risk hook |
| D | Hardcoded secret in a configuration file |
| F | Active permission bypass, or multiple critical issues |

**Final verdict:** `GRADE [A-F] — [issues found]`

For grade D or F: stop the session and fix before continuing.
