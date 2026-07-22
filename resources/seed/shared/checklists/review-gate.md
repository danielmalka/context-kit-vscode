# Gate 4 — Checklist: Approved for Merge?

**Owner:** qa-reviewer
**Prerequisite for:** Merge

---

## Axis 1: Fidelity to the Plan

- [ ] The code implements all requirements from the task file
- [ ] No code outside the PRD/TECHSPEC scope was introduced
- [ ] No deviation from TECHSPEC-{NNN}.md without an approved decision
- [ ] Interfaces and contracts defined in the spec were respected

## Axis 2: Technical Quality

- [ ] Tests cover all scenarios from the PRD acceptance criteria
- [ ] No spec edge case is left without test coverage
- [ ] The code is readable: descriptive names, cohesive functions
- [ ] Error handling is present where needed
- [ ] No critical duplication that should have been abstracted
- [ ] Complex logic has an explanatory comment

## Axis 3: Language Rules

### Security (all languages)
- [ ] External inputs are validated and sanitized
- [ ] Database queries use parameters (no concatenation)
- [ ] Secrets/credentials are not hardcoded
- [ ] Errors don't expose sensitive information to the user

### Patterns (per project language)
- [ ] Language idioms are respected
- [ ] See `.claude/rules/patterns.md`

### Testing
- [ ] Language testing standards are followed
- [ ] See `.claude/rules/testing.md`

## Review Outcome

- [ ] Zero open BLOCKERs
- [ ] Zero open REQUIREDs
- [ ] No finding with plausible production impact was classified as SUGGESTION (severity doctrine, `shared/skills/harness-reviewer.md`) — doubts were escalated to the human, not downgraded
- [ ] Suggestions documented (issues created or accepted by the implementer)
- [ ] If there were 2 review cycles: an architectural decision was consulted

## Post-Approval

- [ ] The gate output (`make check`) is attached to the verdict
- [ ] TECHSPEC-{NNN}.md updated with decisions made during development
- [ ] Merge authorized

---

**Status:** [ ] Pending | [x] Approved | [!] Rejected — return to `/implement` (or `/techspec` if architectural)

**Approved by qa-reviewer:** [name]
**Date:** [yyyy-mm-dd]
**Review cycles:** [1 or 2]
**Notes:** [e.g. "2 BLOCKERs fixed in cycle 2 — SQL injection and missing input validation"]
