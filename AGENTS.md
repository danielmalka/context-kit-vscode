# AGENTS.md — context-kit-extension

## Stack

TypeScript + Node.js 20 / VS Code Extension API (esbuild bundle)

## Available skills

Harness skills live in `.harness/skills/` (linked from `.claude/skills/`).
Language rules: `.harness/rules/{patterns,security,testing}.md`.
Guardrails: `.harness/guardrails.md`.
Product plan: `docs/MASTERPLAN.md`.

## Verification commands (sensors)

- `make check` — fmt-check + lint + type-check + test (mandatory before any commit)
- `make check-strict` — + arch-check + coverage floor (`COVERAGE_MIN`, default 80% lines)
- `make compile` — esbuild bundle → `dist/extension.js`
- `npm run sync-seed` — refresh `resources/seed` from `~/context-kit`

This project uses **node:test** + tsx (not Vitest). Overrides are in the Makefile (`TEST_CMD`).

### Coverage scope (measured, not waived)

`check-strict` reports line coverage via `scripts/coverage-report.mjs`, a node:test reporter
that emits the `coverage: X% (floor N%)` line the QA gate requires and exits non-zero below
`COVERAGE_MIN`. Two scope decisions are deliberate and must stay documented here:

- **Only `src/` counts.** Node's built-in "all files" row includes the test files, which score
  themselves ~100% and inflate the total by roughly 8 points.
- **`src/extension.ts` and `src/ui/**` are out of scope.** They import `vscode`, which cannot
  load under `node:test`, so they never appear in the report at all — they are absent from both
  numerator and denominator, not silently counted as covered. This is the "UI glue can lag with
  a note" allowance in `.harness/rules/testing.md`; keep host-dependent code thin and push logic
  down into `src/domain/**`, which is held to the full floor.

Node here is v20 — `--test-coverage-lines` / `--test-coverage-exclude` are Node 22+, which is why
the floor is enforced by the custom reporter rather than by a flag.

**Keep `COVERAGE_MIN` well below the measured value.** Node 20's experimental V8 coverage under
the tsx loader jitters by ~0.2pt between identical runs (measured 87.28–87.48% over 10 runs; not
wall-clock, and `--test-concurrency=1` does not fix it). A floor set near the measured number will
flake. Note also that pure-type lines — multi-line inline type signatures, interface bodies — are
erased before runtime and can never be marked hit, so files like `src/domain/types.ts` cap far
below 100% no matter how many tests exist.

## Architecture invariants (the agent NEVER violates)

1. `src/domain/**` does not import `vscode` (or other host UI APIs)
2. No `any` without a justifying comment; no `var`
3. No secrets in source or default settings
4. User-controlled paths resolve under library root, workspace root, or configured kit path
5. Apply/update must not overwrite dirty seed library assets without the update/diff flow
6. Selective providers: do not create glue for disabled providers

## Conventions

- Commits: Conventional Commits in English
- Tests: `tests/unit/*.test.ts` via node:test
- Domain pure; `vscode` only in `extension.ts` and `ui/**` (and thin publish if needed)
- Seed pipeline: `scripts/sync-seed-from-kit.sh`

## Seed versioning

`resources/seed/seed.json` carries `seedVersion` in the form
`MAJOR.MINOR.PATCH+YYYY.MM.DD.<shortsha>` (e.g. `1.5.0+2026.07.24.4b60ba5`).

- **The semver part is authored by hand.** It lives in `SEED_SEMVER` at the top of
  `scripts/sync-seed-from-kit.sh` and is the only thing a maintainer edits. Bump it
  **before** running `npm run sync-seed`.
- **The build metadata after `+` is provenance only** — sync date plus the kit's short SHA,
  stamped by the script. `src/domain/seedVersion.ts` ignores everything after the triple, so
  a re-sync of identical content never reads as an upgrade.

| Bump  | When                                                           |
| ----- | -------------------------------------------------------------- |
| MAJOR | An asset was removed or renamed, or frontmatter schema changed |
| MINOR | New assets, nothing removed                                    |
| PATCH | Content fixes only                                             |

`planLibraryUpdate` compares versions with `compareSeedVersions`, not string inequality.
That distinction is the point: before it, any difference triggered "update", so shipping an
older seed than the one already installed was indistinguishable from an upgrade and would
silently roll a user's library backwards. Now a strictly older incoming seed is never an
update; at an equal version, missing or drifted clean assets still trigger a repair pass.

Legacy stamps (`2026.07.22+e4d4cfe`) and anything unparseable are "unknown" and sort older
than every real version — including a year-shaped major, which is why `parseSeedVersion`
rejects `major >= 1000`. Installs in the field carrying a legacy value therefore still see
the next release as an upgrade.

### Sync guards

`sync-seed-from-kit.sh` refuses to run when the kit checkout is dirty or not on `main`, and
exits 1. Users read the stamped SHA as provenance; without the guard the script stamped
whatever HEAD it found, so a feature-branch SHA — unreachable from `main` — could ship inside
a released seed. `ALLOW_DIRTY_SEED=1` overrides it for local testing and prints a warning
that the build must not be released. A kit path that is not a git checkout has no branch and
no SHA to stamp, so it syncs unstamped with a note rather than tripping the branch guard.

### What is and is not synced

`<lang>/prompts/` is synced and mapped (`langs/<lang>/prompts/*.md` in the library).
`shared/prompts/` always worked; only the language-scoped ones were dropped, and in three
places at once — the script's copy list plus two near-identical copies of the seed→library
mapper. There is now exactly one mapper, `mapSeedFileToLibraryRel` in `src/domain/paths.ts`,
used by both the initial install (`src/library/ensure.ts`) and the update flow
(`src/library/seedUpdate.ts`, which re-exports it). Change the seed layout in that one place.

`<lang>/AGENTS.md` is **deliberately not synced.** Do not "fix" this: it is a README for the
kit repo's own folder, documenting a manual `cp` workflow that this extension exists to
replace. The template that matters is `<lang>/verifications/AGENTS.md`, which is already
shipped and written to the workspace root by `src/publish/applyHarness.ts` when
`options.writeAgentsMd` is set.

## Mutation testing (optional)

Not configured yet.

## Workflow

Route implementation through the harness (`harness-mode` skill):

| Request                       | Route                                          |
| ----------------------------- | ---------------------------------------------- |
| Bug / small fix               | `/fix`                                         |
| Small well-understood feature | `/tasks` then `/implement`                     |
| Complex feature               | `/prd` → `/techspec` → `/tasks` → `/implement` |
| Continue board                | `/next`                                        |

- Never commit — the human reviews and commits (unless project rules explicitly allow autonomous commit off main).
- Never report done without `make check` (and `make check-strict` for merge-ready work).

## What NOT to do

- Do not add dependencies without asking
- Do not reimplement agent runtimes (Claude/Grok CLIs)
- Do not use `any` / `var` without justification
- Do not force-overwrite `.claude/napkin.md`
