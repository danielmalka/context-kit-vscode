# Tech Spec

Generate a Technical Specification from an approved PRD.

## Input

A feature number (e.g. `003`) or the path to its PRD.

## Steps

1. Read the template: `shared/templates/techspec.md`
2. Assume the role: `agents/techspec-creator.md`
3. Read `PRD-{NNN}.md` in full. If the PRD has blocking open questions, STOP and resolve them with the user first.
4. Explore the actual codebase before writing: affected modules, existing patterns, current schema, API conventions. The spec must reflect the code as it is, not as imagined.
5. Write `TECHSPEC-{NNN}.md` in the same feature folder, following the template:
   - Mermaid diagram is mandatory (flowchart or sequence).
   - Every affected file listed with the reason for the change.
   - Technical decisions recorded as mini-ADRs (decision, alternatives, rationale). Decisions that outlive the feature are promoted to `docs/adr/`.
6. If the feature touches auth, external input, or sensitive data: run `shared/prompts/threat-model.md` (STRIDE) and summarize the findings in the Security section.
7. Map every EARS acceptance criterion from the PRD to at least one planned test in the Test Strategy section.
8. Dispatch the tech spec reviewer (`agents/techspec-reviewer.md`) as a subagent over the draft — the techspec-creator never reviews its own work. It mandatorily applies the `ponytail` skill (`shared/skills/ponytail.md`) to every non-trivial design decision before giving a verdict. On NEEDS REVISION, fix the blocking findings and return to step 5.
9. Present the spec to the user for approval only once the tech spec reviewer's verdict is `APPROVED`. Task breakdown only starts on an approved spec.

## Rules

- Every section must trace back to a PRD requirement — no gold-plating.
- "None" is a valid and explicit answer for data model, API, and rollout sections. Silence is not.
- Do not restate the PRD; reference it.
