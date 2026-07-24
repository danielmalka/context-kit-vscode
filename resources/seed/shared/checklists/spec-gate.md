# Gate 1 — Checklist: PRD + Tech Spec Approved?

**Owner:** prd-creator + prd-reviewer + techspec-creator + techspec-reviewer
**Prerequisite for:** `/tasks`

All items must be checked before moving forward.

---

## PRD-{NNN}.md

- [ ] The problem being solved is described objectively
- [ ] The expected benefit is measurable (not "improve performance" but "reduce latency by X%")
- [ ] Alternatives considered are documented with a reason for rejection
- [ ] Main risks have been identified
- [ ] Scope is explicit: what is **in** and what is **out**

## PRD-{NNN}.md: acceptance criteria

- [ ] At least one EARS scenario per acceptance criterion (`WHEN ... THE SYSTEM SHALL ...`)
- [ ] Each criterion is measurable and verifiable by tests
- [ ] Critical edge cases are documented as scenarios
- [ ] Non-functional requirements (latency, availability, etc.) are specified where relevant

## TECHSPEC-{NNN}.md

- [ ] The technical approach is defined by techspec-creator
- [ ] Interfaces and contracts are documented (function/API signatures)
- [ ] External dependencies are listed
- [ ] Decisions taken have a stated justification (mini-ADRs where relevant)
- [ ] Component responsibility boundaries are clear

## Validation

- [ ] Acceptance criteria are confirmed testable
- [ ] No criterion is subjective or unverifiable by code

## Design direction (only if the feature touches a user-facing surface)

- [ ] `designer-ux` set the success mode (Persuade/Operate/Read/Experience) and the three dials
- [ ] `DESIGN.md` exists and covers the tokens/components this feature needs (any new token added there first)
- [ ] The PRD/techspec carries a short design-direction note (not implementation detail)

## Reviewer passes (mandatory)

- [ ] prd-reviewer ran the `improve` skill (recon mode) against the target codebase and verdict is APPROVED
- [ ] techspec-reviewer applied the `ponytail` ladder to every non-trivial design decision and verdict is APPROVED
- [ ] No reviewer finding with plausible production impact was left as a non-blocking suggestion (severity doctrine, `shared/skills/harness-reviewer.md`)

---

**Status:** [ ] Pending | [x] Approved | [!] Rejected — return to PRD/TECHSPEC

**Approved by:** [name]
**Date:** [yyyy-mm-dd]
**Notes:** [optional]
