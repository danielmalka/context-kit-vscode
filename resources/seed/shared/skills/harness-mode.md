---
name: harness-mode
description: Use at the START of every development session, before touching code. Routes the request to the right workflow entry point (fast path or spec-driven chain). Trigger: any request to implement, fix, refactor, or build a feature.
---

# Harness Mode — Router

There is a single pipeline (ADR-002). Rigor is constant — `make check-strict` and the QA reviewer always run. What scales with the change is the amount of spec artifacts.

## Gate 0 — Architecture Decision (before any route)

Before choosing a spec route, check whether this work needs a recorded decision first:

- **Newly created project, no feature yet** → an accepted **ADR-001 recording the initial
  architecture** is required BEFORE the first `/prd`. No ADR-001 → run `/adr`
  (`shared/commands/adr.md`) first.
- **Architectural change** (a new runtime dependency, a schema/persisted-data contract, a public
  API/interface contract, a bounded-context boundary, an auth/security model, or a
  costly-to-reverse choice) → record the decision with `/adr` before the spec chain.

Gate: `shared/checklists/adr-gate.md`. Feature-local decisions that die with the feature need no
ADR — they stay as techspec mini-ADRs. Do not gate an ordinary feature on an ADR.

## Frontend check (before routing, for UI work)

If the request ships or changes a **user-facing surface** (a page, screen, component, or visual/UX
change) → the `designer-ux` agent joins the cycle:

- It **shapes** direction during planning (success mode + dials) and owns `DESIGN.md` — the source of
  truth for tokens. Missing `DESIGN.md` on an existing project → generate it with `frontend-maker`
  `document` mode before building.
- Its **design critique** pass is required at `review-gate` for the diff, alongside the code reviewer
  (`react-reviewer` for React/PWA).

Ask once at planning only if it's genuinely ambiguous whether the work touches UI. Backend-only work
does not pull in the designer.

## Routing

Infer from the request; ask only if genuinely ambiguous.

| Request | Route |
|---------|-------|
| Bug, small fix, quick adjustment (~3 files or fewer, no schema/API/auth/dependency change) | `shared/commands/fix.md` |
| Small, well-understood feature (spec would restate the obvious) | `shared/commands/tasks.md` directly, then `/implement` |
| Complex or ambiguous feature | Full chain: `/prd` → `/techspec` → `/tasks` → `/implement` |
| Continuing an already-boarded feature | `shared/commands/next.md` |

Announce the route chosen and why, in one line. If work outgrows the route mid-flight (more files, new dependency, schema change), STOP and re-route upward.

## Artifact scaling (exceptions)

Rigor of gates is constant (`make check-strict` + QA). Artifacts scale:

| Situation | Artifacts | Notes |
|-----------|-----------|--------|
| **Hotfix / bug** | `/fix` only | Failing test is the spec. No PRD. |
| **Trivial feature** (obvious, <~1 day, no schema/API/auth) | May start at `/tasks` (skip PRD/techspec) | Still human-approved task board; if scope grows → stop and run `/prd`. |
| **Normal / complex feature** | Full `/prd` → `/techspec` → `/tasks` → `/implement` | Default. |
| **Emergency production hotfix** | `/fix` + mandatory regression test + QA | Post-hoc note in harness-card or issue within 48h; if architecture changed, open techspec after. |

Never use "trivial" or "hotfix" to skip `make check-strict` or QA reviewer.

## Inviolable rules

- Never declare "done" without `make check-strict` output pasted in the response.
- Never skip the QA reviewer verdict (`agents/qa-reviewer.md`).
- Never measure success by volume of generated code.
- Diffs reverted by the user = harness problem; record it in metrics.csv.
- The human reviews and commits. Every route ends at "ready for review".
