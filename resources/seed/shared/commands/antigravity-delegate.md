# /antigravity (portable)

Delegate large-context review or long investigation to Google Antigravity CLI (`agy`).

## When

- Second opinion on non-trivial diff/refactor
- Repo-wide / multi-file investigation
- Adversarial review before ship
- Long-running background task while host continues

## Prerequisites

1. `agy` installed and on PATH
2. One-time OAuth: `agy --print 'hi'` or host equivalent (`$antigravity setup`)
3. Runtime Claude may use plugin `antigravity@antigravity`; this doc works without the plugin

## Verbs (map to host)

| Verb | Intent |
|------|--------|
| review | Review current git diff (or base ref) |
| rescue | Investigate / propose fix for a problem statement |
| task | Generic long-running delegation |
| status | Job table |
| result | Print completed job output |
| cancel | Stop job |

## How (generic host)

```bash
# review uncommitted / branch diff
agy --print "Review this git diff for correctness, risks, and missing tests:
$(git diff)"

# rescue / investigate
agy --print "Investigate and propose a fix: <problem statement>"
```

Prefer background job tracking if the host plugin is available; otherwise foreground `--print` is fine.

## Do not

- Use for one-line edits
- Paste secrets into the prompt
- Treat agy output as mergeable without human review
