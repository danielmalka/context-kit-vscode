# ADR

Record an Architecture Decision Record — the mandatory first step for architectural
change and for a new project's initial architecture (see the `harness-mode` router's
Gate 0 and `docs/adr/ADR-001`).

## When an ADR is required (not optional)

- **A newly created project, before its first feature.** ADR-001 records the initial
  architecture. `/prd` for feature `001` does not start until an accepted ADR-001 exists.
- **Any architectural change:** a new runtime dependency, a schema or persisted-data
  contract, a public API/interface contract, a bounded-context boundary, an auth/security
  model, or a choice costly to reverse.

Decisions that die with a single feature stay as mini-ADRs in that feature's techspec —
do NOT open a full ADR for them.

## Input

A description of the decision to record (or "initial architecture" for a new project's ADR-001).

## Steps

1. Read the template: `shared/templates/adr.md`
2. Determine the ADR number: list `docs/adr/` in the target project and take the next
   sequential number (zero-padded, e.g. `002`). If the folder does not exist, start at
   `001` and create it.
3. Read the project's context before writing: `AGENTS.md`, existing records in `docs/adr/`,
   and any techspec mini-ADRs this decision promotes.
4. Draft the ADR to `docs/adr/ADR-{NNN}-{slug}.md` following the template. Slug is short
   kebab-case. Status starts at **Proposed**.
5. Dispatch the ADR reviewer (`agents/adr-reviewer.md`) as a subagent over the draft — never
   review your own ADR. It mandatorily runs the `improve` skill (recon mode,
   `shared/skills/improve.md`) against the target codebase to check the decision is grounded
   and does not contradict an existing ADR or the real code. On NEEDS REVISION, fix the
   blocking findings and return to step 4.
6. Present the ADR to the human. Only the human moves Status to **Accepted**. The spec chain
   (`/prd`) for the affected work starts on an accepted ADR.

## Rules

- One decision per ADR. Costly-to-reverse and architectural only — YAGNI on everything else.
- Options Considered must list real alternatives with honest pros/cons, or it is a note, not
  a decision.
- Consequences must state the downside taken on, not only the upside.
- Never mark an ADR Accepted yourself — that status change is the human's call.
