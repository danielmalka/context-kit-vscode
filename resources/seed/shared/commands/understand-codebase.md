# /understand-codebase (portable)

Build or refresh a codebase knowledge graph for architecture onboarding.

## When

- First session on an unfamiliar repo
- Before a large feature that spans modules
- After major structural refactors

## Runtime (preferred)

If Claude plugin `understand-anything` is installed:

```
/understand
/understand --full
/understand --language pt
```

Artifact: `.understand-anything/` (knowledge-graph.json + config).

## Portable fallback (no plugin)

1. Map top-level packages/dirs and entrypoints (`main`, `cmd/`, `app/`, `src/`).
2. List critical modules and their dependencies (1–2 hop).
3. Write `docs/architecture-map.md` in the **target project** (not vault dump):
   - System context
   - Major components + ownership
   - Data stores and external APIs
   - Build/test commands (`make check` / `make check-strict` if present)
4. Link that file from project README.

## Do not

- Commit huge generated graphs without .gitignore review
- Put full graph dumps in the Obsidian vault (hub summary only via vault-sync)
