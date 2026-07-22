---
name: pair-programming
description: Use when working interactively with a human on a single change — choosing a driver/navigator role, running continuous review and tests as you go, or deciding when to switch roles or modes (debug, TDD, mentor).
---

# pair-programming

<!-- Portable mirror for context-kit. Source: ~/.claude/skills/pair-programming/SKILL.md. -->

## Overview

Pair programming is a collaboration mode, not a tool. Two roles trade off: the driver writes, the navigator reviews and steers. Which one the agent plays should be explicit and named up front, and the mode should match the task.

## Modes — pick one, name it

- **Driver**: agent writes code, human gives strategic direction and catches issues in review. Good for: implementing familiar features, quick iteration.
- **Navigator**: human writes/directs, agent reviews and suggests. Good for: learning a new pattern together, careful review of sensitive code.
- **Switch**: roles alternate at agreed points (natural task boundaries, not arbitrary timers). Good for: long sessions, balanced knowledge transfer.
- **TDD**: red (failing test) -> green (minimal fix) -> refactor, repeat. Use for any new feature or bugfix — see the kit's `superpowers:test-driven-development` skill for the full cycle.
- **Debug**: reproduce -> isolate -> fix -> regression test. Don't guess at fixes before reproducing.
- **Mentor**: slower pace, explain reasoning at each step, teach the pattern rather than just applying it.

State the mode at the start of a session so both sides know who owns which decisions.

## Continuous verification

Whichever mode: run the test suite and linter after each meaningful change, not just at the end. Treat a failing test or lint error as a stop condition — fix before continuing, don't accumulate red across multiple changes. Review security-sensitive and public-interface changes more carefully than internal refactors.

## Handing off between roles

When switching driver/navigator, summarize the current state (what changed, what's next, any open question) before the swap — don't rely on implicit context carrying over.

## Common mistakes

| Mistake | Fix |
|---|---|
| No mode named, roles ambiguous | State driver/navigator/switch explicitly before starting |
| Tests only run at the end | Run after each change; fix red immediately |
| Fixing a bug before reproducing it | Reproduce first (see debug mode above) |
| Switching roles with no handoff summary | State what changed and what's next before swapping |
