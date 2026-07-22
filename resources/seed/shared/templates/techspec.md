# TECHSPEC-{NNN}: {Feature Title}

<!--
Template: Technical Specification
Output location: .harness/docs/features/{NNN}-{slug}/TECHSPEC-{NNN}.md
Input: PRD-{NNN}.md (must exist and be Approved before this spec is written)
Scope: HOW. Bridges the PRD to implementation. Every section must trace back to a PRD requirement.
-->

| Field | Value |
|-------|-------|
| Feature | {NNN}-{slug} |
| PRD | [PRD-{NNN}](./PRD-{NNN}.md) |
| Status | Draft \| In Review \| Approved |
| Date | {YYYY-MM-DD} |
| Author | {name} |

## 1. Approach Overview

<!-- 3-5 sentences: the chosen approach and why, in plain language. -->

## 2. Architecture

<!-- Mermaid diagram is mandatory (flowchart or sequence). Show how the pieces interact. -->

```mermaid
flowchart TD
    A[{component}] --> B[{component}]
```

## 3. Affected Components & Files

| Component / File | Change | Reason |
|------------------|--------|--------|
| `{path}` | create \| modify \| delete | {why} |

## 4. Data Model Changes

<!-- Schema migrations, new tables/columns, index changes. "None" is a valid answer — say it explicitly. -->

## 5. API Contracts

<!-- New or changed endpoints. Follow the project's API design standards.
     Include: method, path, request/response shape, status codes, error format. "None" is valid. -->

## 6. Technical Decisions

<!-- Mini-ADRs. For decisions big enough to outlive this feature, promote to docs/adr/ instead. -->

| # | Decision | Alternatives considered | Rationale |
|---|----------|------------------------|-----------|
| 1 | {decision} | {alt A, alt B} | {why} |

## 7. Security Considerations

<!-- Mandatory if the feature touches auth, external input, or sensitive data:
     run shared/prompts/threat-model.md (STRIDE) and summarize findings here. -->

## 8. Test Strategy

<!-- What proves this works: unit / integration / e2e boundaries, edge cases from the PRD's EARS criteria.
     Every acceptance criterion in the PRD must map to at least one test. -->

## 9. Rollout & Migration

<!-- Feature flags, migration order, rollback plan. "Deploy normally" is valid for small features. -->

## 10. Open Questions

| # | Question | Blocking? |
|---|----------|-----------|
| 1 | {question} | yes/no |
