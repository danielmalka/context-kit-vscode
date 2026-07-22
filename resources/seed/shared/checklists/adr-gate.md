# Gate 0 — Checklist: Architecture Decision Recorded?

**Owner:** `/adr` + adr-reviewer
**Prerequisite for:** the first feature of a new project (`/prd` 001), and any feature whose
work is an architectural change.

Applies ONLY to architectural change (a new runtime dependency, a schema/persisted-data
contract, a public API/interface contract, a bounded-context boundary, an auth/security model,
or a costly-to-reverse choice) and to a newly created project before its first feature.
Feature-local decisions need no ADR — they live as techspec mini-ADRs.

---

## ADR-{NNN}.md

- [ ] Exactly one decision, stated in active voice
- [ ] Context states the forces at play without pre-announcing the choice
- [ ] Options Considered lists real alternatives with honest pros/cons; the chosen one is marked
- [ ] Consequences state the downside taken on, not only the upside
- [ ] The decision is genuinely architectural and costly-to-reverse (not feature-local trivia)

## New-project precondition

- [ ] For a newly created project, an accepted ADR-001 records the initial architecture and
      exists before `/prd` runs for feature 001

## Reviewer pass (mandatory)

- [ ] adr-reviewer ran the `improve` skill (recon mode) against the target codebase and verdict
      is APPROVED

---

**Status:** [ ] Pending | [ ] Approved | [ ] Rejected — return to `/adr`

**Accepted by:** [human]
**Date:** [yyyy-mm-dd]
**Notes:** [optional]
