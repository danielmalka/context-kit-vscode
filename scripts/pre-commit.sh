#!/bin/sh
# Pre-commit quality gate — Context Kit VS Code extension (TypeScript / node:test)
set -e

echo "=== Quality Gate: Pre-commit (context-kit-vscode) ==="

echo ""
echo "[1/5] secrets scan..."
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks protect --staged --no-banner
else
  pattern='AKIA[0-9A-Z]{16}|-----BEGIN[A-Z ]*PRIVATE KEY-----|api[_-]?key[[:space:]]*[:=]|[Bb]earer[[:space:]]+[A-Za-z0-9._-]{20,}|password[[:space:]]*=[[:space:]]*["'"'"']?[A-Za-z0-9]'
  found=0
  old_ifs=$IFS
  IFS='
'
  for f in $(git diff --cached --name-only --diff-filter=ACM); do
    match=$(git show ":$f" 2>/dev/null | grep -anEi "$pattern") || continue
    [ -z "$match" ] && continue
    found=1
    echo "$match" | while IFS= read -r hit; do
      echo "  BLOCKED: $f:${hit%%:*}"
    done
  done
  IFS=$old_ifs
  if [ "$found" -eq 1 ]; then
    echo "  Secret pattern detected in staged changes. Commit blocked."
    exit 1
  fi
fi
echo "  OK"

echo ""
echo "[2/5] eslint..."
npx eslint src
echo "  OK"

echo ""
echo "[3/5] tsc (type check)..."
npx tsc --noEmit
echo "  OK"

echo ""
echo "[4/5] tests (node:test)..."
node --import tsx --test tests/unit/*.test.ts
echo "  OK"

echo ""
echo "[5/5] npm audit (dependency vulnerabilities)..."
npm audit --audit-level=high
echo "  OK"

echo ""
echo "All quality checks passed."
