#!/bin/sh
# Pre-commit quality gate.
# Runs secrets scan, lint, vet, vulnerability check, and tests.
# Exits non-zero if any check fails, blocking the commit.

set -e

echo "=== Quality Gate: Pre-commit ==="

echo ""
echo "[1/6] secrets scan..."
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
echo "[2/6] gofumpt..."
gofumpt -w .
echo "  OK"

echo ""
echo "[3/6] go vet..."
go vet ./...
echo "  OK"

echo ""
echo "[4/6] golangci-lint..."
golangci-lint run ./...
echo "  OK"

echo ""
echo "[5/6] govulncheck..."
go run golang.org/x/vuln/cmd/govulncheck@latest ./...
echo "  OK"

echo ""
echo "[6/6] tests with coverage..."
go test ./... -count=1 -cover
echo "  OK"

echo ""
echo "All quality checks passed."
