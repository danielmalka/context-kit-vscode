# /document

Assume the **documentator** agent role (see `agents/documentator.md` or `.harness/agents/documentator.md`).

## Input

A feature name, path list, or “update docs for what just shipped”.

## Steps

1. Read the documentator agent file and follow it fully.
2. Prefer updating existing Markdown under the project; add Mermaid diagrams by default; use draw.io under `docs/diagrams/` only when needed.
3. Do not invent behavior — ground every claim in code or config.
4. Summarize files changed and remaining gaps.

## Notes

Auxiliary command — not part of the mandatory `/prd` → `/implement` chain.
