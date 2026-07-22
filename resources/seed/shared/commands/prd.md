# PRD

Generate a Product Requirements Document for a feature, following the spec-driven workflow (see `docs/adr/ADR-001-adopt-spec-driven-workflow.md`).

## Input

A feature description from the user — anything from one sentence to a full brief.

## Steps

1. Read the template: `shared/templates/prd.md`
2. Assume the role: `agents/prd-creator.md`
3. Determine the feature number: list `.harness/docs/features/` in the target project and take the next sequential number (zero-padded, e.g. `004`). If the folder does not exist, start at `001` and create it.
   - **Gate 0 (new project):** if this is feature `001`, an accepted `ADR-001` recording the initial architecture must already exist in `docs/adr/` (harness-mode Gate 0, `shared/checklists/adr-gate.md`). If it does not, STOP and run `/adr` before writing the PRD.
4. Read the project's context before writing: the repo's `AGENTS.md`, its guardrails (if registered in `projects/<name>/guardrails.md`), and any existing features that overlap.
5. If the feature description leaves goals, users, or scope ambiguous: ASK the user. Never invent requirements. Unresolved points go to the Open Questions section.

## Socratic check (before writing the PRD)

If the user brief is thin, ask only what is still unknown. Prefer a short list over an interview.

### Problem & outcome
- What user/job-to-be-done fails today?
- What does "done" look like in one sentence?
- How will we know it worked (signal, not vanity metric)?

### Scope
- Who is in/out of scope for v1?
- What must **not** change (non-goals candidates)?
- Hard deadline or event coupling?

### Acceptance
- List candidate EARS lines: `WHEN … THE SYSTEM SHALL …`
- What is explicitly deferred?

### Risks & constraints
- Auth, data, money, PII, multi-tenant?
- Backward compatibility / migrations?
- Dependencies on other systems?

Unresolved items → **Open Questions** in the PRD — never invent answers.

6. Write the PRD to `.harness/docs/features/{NNN}-{slug}/PRD-{NNN}.md` following the template. Slug is short kebab-case (2-4 words).
7. Self-review before delivering: remove any implementation detail (frameworks, schemas, file names) — those belong to the tech spec. Remove any vanity/business metric the feature does not exist to move.
8. Dispatch the PRD reviewer (`agents/prd-reviewer.md`) as a subagent over the draft — the prd-creator never reviews its own work. It mandatorily runs the `improve` skill (recon mode, `shared/skills/improve.md`) against the target codebase before giving a verdict. On NEEDS REVISION, fix the blocking findings and return to step 6.
9. Present the PRD to the user for approval only once the PRD reviewer's verdict is `APPROVED`. The tech spec phase only starts on an approved PRD.

## Rules

- WHAT and WHY only. No HOW.
- Every acceptance criterion in EARS notation (`WHEN ... THE SYSTEM SHALL ...`) and pass/fail verifiable.
- Non-goals section is mandatory — it is the main defense against scope creep.
- Open questions are left open and flagged, never answered by assumption.
