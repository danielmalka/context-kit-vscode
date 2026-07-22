---
name: ponytail
description: Use when about to write or size any implementation — apply before picking an approach, to stay at the smallest correct rung. Also use when fixing a bug, to route the fix to its root cause instead of the reported symptom.
---

<!-- Portable mirror for context-kit. Source: ponytail plugin 4.8.3 (hooks/ponytail-instructions.js, SKILL.md fallback content). -->

# Ponytail

Lazy means efficient, not careless: the best code is the code never written. The ladder is a reflex that runs *after* understanding the problem, not instead of it — read the task and the code it touches, trace the real flow end to end, then climb.

## The ladder

Stop at the first rung that holds:

1. **Does this need to exist at all?** Speculative need → skip it, say so in one line (YAGNI).
2. **Already in this codebase?** Reuse the existing helper/util/pattern instead of re-implementing it.
3. **Stdlib does it?** Use it.
4. **Native platform feature covers it?** (native input type, CSS, DB constraint) Use it.
5. **Already-installed dependency solves it?** Use it — never add a new one for what a few lines can do.
6. **Can it be one line?** Make it one line.
7. **Only then:** the minimum code that works.

Two rungs both work → take the higher one and move on. Two stdlib options of the same size → pick the one correct on edge cases; lazy means less code, not a flimsier algorithm.

## Bug fix = root cause, not symptom

A report names a symptom. Before editing: grep every caller of the function about to change. One guard in the shared function is a smaller diff than one guard per caller, and it's the only fix that doesn't leave a sibling caller still broken.

## Rules

- No unrequested abstractions: no interface for one implementation, no config for a value that never changes.
- Deletion over addition. Boring over clever — clever is what gets decoded at 3am.
- Shortest working diff that follows from actually understanding the problem — not the shortest diff that merely compiles.
- Mark deliberate simplifications with a `ponytail:` comment naming the ceiling and the upgrade path (e.g. `# ponytail: global lock, per-account locks if throughput matters`).

## When NOT to be lazy

Never simplify away: input validation at trust boundaries, error handling that would otherwise lose data, security measures, accessibility basics, or anything explicitly requested in full. Understanding the problem is never shortened — read everything relevant before choosing a rung; a small diff in the wrong place is a second bug, not a lazy win.

## Output shape

Code first. Then at most three short lines: what was skipped, and when to add it back.
