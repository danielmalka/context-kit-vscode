#!/bin/sh
# Pre-commit quality gate — PHP
# Runs secrets scan, formatting check, static analysis, tests, and dependency audit.
# Exits non-zero if any check fails, blocking the commit.

set -e

echo "=== Quality Gate: Pre-commit (PHP) ==="

echo ""
echo "[1/5] secrets scan..."
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks protect --staged --no-banner
else
  pattern='AKIA[0-9A-Z]{16}|-----BEGIN[A-Z ]*PRIVATE KEY-----|api[_-]?key[[:space:]]*[:=]|[Bb]earer[[:space:]]+[A-Za-z0-9._-]{20,}|password[[:space:]]*=[[:space:]]*["'"'"']?[A-Za-z0-9]'
  found=0
  # --diff-filter=ACM excludes renames (only relevant if diff.renames is enabled)
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
    echo "  Bypass only via 'git commit --no-verify' if this is a false positive."
    exit 1
  fi
fi
echo "  OK"

echo ""
echo "[2/5] php-cs-fixer (dry-run)..."
docker compose exec -T app vendor/bin/php-cs-fixer fix --dry-run --diff
echo "  OK"

echo ""
echo "[3/5] phpstan..."
docker compose exec -T app vendor/bin/phpstan analyse --memory-limit=1G
echo "  OK"

echo ""
echo "[4/5] pest..."
docker compose exec -T app vendor/bin/pest
echo "  OK"

echo ""
echo "[5/5] composer audit (dependency vulnerabilities)..."
docker compose exec -T app composer audit
echo "  OK"

echo ""
echo "All quality checks passed."
