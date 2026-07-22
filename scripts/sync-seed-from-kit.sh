#!/usr/bin/env bash
# Sync portable context-kit assets into resources/seed for bundling.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KIT="${CONTEXT_KIT_PATH:-$HOME/context-kit}"
SEED="$ROOT/resources/seed"

if [ ! -d "$KIT/shared" ]; then
  echo "Error: context-kit not found at $KIT (set CONTEXT_KIT_PATH)" >&2
  exit 1
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
    for sub in skills commands rules verifications; do
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
VERSION="$(date -u +%Y.%m.%d)"
if [ -f "$KIT/package.json" ]; then
  :
fi
# prefer git describe if available
if git -C "$KIT" rev-parse --short HEAD >/dev/null 2>&1; then
  GIT_SHA="$(git -C "$KIT" rev-parse --short HEAD)"
  VERSION="${VERSION}+${GIT_SHA}"
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
