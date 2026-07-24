#!/usr/bin/env bash
# Sync portable context-kit assets into resources/seed for bundling.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KIT="${CONTEXT_KIT_PATH:-$HOME/context-kit}"
SEED="$ROOT/resources/seed"

# Human-authored seed semver. Bump it here, deliberately, before syncing:
#   MAJOR — asset removed/renamed or frontmatter schema change (breaks existing references)
#   MINOR — new assets
#   PATCH — content fixes only
# The build metadata (+YYYY.MM.DD.<shortsha>) is stamped below and is informational only.
SEED_SEMVER="1.5.0"

if [ ! -d "$KIT/shared" ]; then
  echo "Error: context-kit not found at $KIT (set CONTEXT_KIT_PATH)" >&2
  exit 1
fi

# The stamped SHA is provenance users rely on, so refuse to stamp anything unreachable
# from the kit's main branch. ALLOW_DIRTY_SEED=1 overrides for deliberate local testing.
# A non-git kit checkout has no SHA to stamp and no branch to check — it passes through
# unstamped, matching the `rev-parse` guard further down.
if git -C "$KIT" rev-parse --git-dir >/dev/null 2>&1; then
  KIT_BRANCH="$(git -C "$KIT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"
  KIT_DIRTY="$(git -C "$KIT" status --porcelain 2>/dev/null || echo "")"
  if [ -n "$KIT_DIRTY" ] || [ "$KIT_BRANCH" != "main" ]; then
    REASON=""
    [ -n "$KIT_DIRTY" ] && REASON="working tree is dirty"
    [ "$KIT_BRANCH" != "main" ] && REASON="${REASON:+$REASON; }on branch '$KIT_BRANCH', not 'main'"
    if [ "${ALLOW_DIRTY_SEED:-}" = "1" ]; then
      echo "*** WARNING: syncing seed from an unclean kit ($REASON)." >&2
      echo "*** The stamped SHA may be unreachable from main. Do NOT release this build. ***" >&2
    else
      echo "Error: refusing to sync seed from $KIT — $REASON." >&2
      echo "Commit and switch to main, or set ALLOW_DIRTY_SEED=1 for local testing." >&2
      exit 1
    fi
  fi
else
  echo "Note: $KIT is not a git checkout — syncing without a stamped SHA." >&2
fi

rm -rf "$SEED"
mkdir -p "$SEED/shared/skills" "$SEED/shared/commands" "$SEED/shared/checklists" \
  "$SEED/shared/templates" "$SEED/shared/prompts" "$SEED/agents"

copy_md_dir() {
  local src="$1" dest="$2"
  [ -d "$src" ] || return 0
  mkdir -p "$dest"
  find "$src" -maxdepth 1 -type f -name '*.md' -exec cp {} "$dest/" \;
}

copy_md_dir "$KIT/shared/skills" "$SEED/shared/skills"
copy_md_dir "$KIT/shared/commands" "$SEED/shared/commands"
copy_md_dir "$KIT/shared/checklists" "$SEED/shared/checklists"
copy_md_dir "$KIT/shared/templates" "$SEED/shared/templates"
copy_md_dir "$KIT/shared/prompts" "$SEED/shared/prompts"
copy_md_dir "$KIT/agents" "$SEED/agents"

for lang in go php python rust typescript; do
  if [ -d "$KIT/$lang" ]; then
    mkdir -p "$SEED/$lang"
    # <lang>/AGENTS.md is deliberately NOT copied: it is a README for the kit repo folder
    # (lists the folder contents, tells you to `cp` files by hand) — the very workflow this
    # extension replaces. The one that matters, <lang>/verifications/AGENTS.md, is copied
    # below and written to the workspace root by src/publish/applyHarness.ts.
    for sub in skills commands rules prompts verifications; do
      if [ -d "$KIT/$lang/$sub" ]; then
        mkdir -p "$SEED/$lang/$sub"
        # copy files (including hidden like .golangci.yml) but not dirs we don't need
        find "$KIT/$lang/$sub" -maxdepth 1 -type f -exec cp {} "$SEED/$lang/$sub/" \;
      fi
    done
  fi
done

# seed manifest
SKILL_N=$(find "$SEED/shared/skills" -type f -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
CMD_N=$(find "$SEED/shared/commands" -type f -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
AGENT_N=$(find "$SEED/agents" -type f -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
# MAJOR.MINOR.PATCH+YYYY.MM.DD.<shortsha>
VERSION="$SEED_SEMVER+$(date -u +%Y.%m.%d)"
if git -C "$KIT" rev-parse --short HEAD >/dev/null 2>&1; then
  VERSION="${VERSION}.$(git -C "$KIT" rev-parse --short HEAD)"
fi

cat > "$SEED/seed.json" <<EOF
{
  "seedVersion": "$VERSION",
  "source": "context-kit",
  "generatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "counts": {
    "skills": $SKILL_N,
    "commands": $CMD_N,
    "agents": $AGENT_N
  }
}
EOF

echo "Seed synced → $SEED (version $VERSION, skills=$SKILL_N commands=$CMD_N agents=$AGENT_N)"
