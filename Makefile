.PHONY: check check-strict lint type-check test fmt fmt-check mutation arch-check compile sync-seed

COVERAGE_MIN ?= 80

# node:test (not Vitest)
TEST_CMD ?= node --import tsx --test tests/unit/*.test.ts
# check-strict measures line coverage over src/ only (the built-in "all files" row
# counts the test files themselves and reads ~8pts high). The custom reporter emits the
# `coverage: X% (floor N%)` line the QA gate requires and exits non-zero below COVERAGE_MIN.
STRICT_TEST_CMD ?= COVERAGE_MIN=$(COVERAGE_MIN) node --import tsx --experimental-test-coverage \
	--test-reporter=spec --test-reporter-destination=stdout \
	--test-reporter=./scripts/coverage-report.mjs --test-reporter-destination=stdout \
	--test tests/unit/*.test.ts

fmt:
	@npx --no-install prettier --version >/dev/null 2>&1 || { echo "prettier not installed. Install: npm install --save-dev prettier"; exit 1; }
	npx prettier --write "src/**/*.ts" "tests/**/*.ts" "*.md" "docs/**/*.md" "package.json" "esbuild.mjs" "eslint.config.js"

fmt-check:
	@npx --no-install prettier --version >/dev/null 2>&1 || { echo "prettier not installed. Install: npm install --save-dev prettier"; exit 1; }
	npx prettier --check "src/**/*.ts" "tests/**/*.ts" "*.md" "docs/**/*.md" "package.json" "esbuild.mjs" "eslint.config.js"

lint:
	@npx --no-install eslint --version >/dev/null 2>&1 || { echo "eslint not installed. Install: npm install --save-dev eslint typescript-eslint @eslint/js"; exit 1; }
	npx eslint src

type-check:
	@npx --no-install tsc --version >/dev/null 2>&1 || { echo "typescript not installed. Install: npm install --save-dev typescript"; exit 1; }
	npx tsc --noEmit

test:
	$(TEST_CMD)

compile:
	npm run compile

sync-seed:
	npm run sync-seed

check: fmt-check lint type-check test

check-strict: fmt-check lint arch-check type-check
	$(STRICT_TEST_CMD)

# path-scoped invariants from AGENTS.md / guardrails
arch-check:
	@! rg -n "from ['\"]vscode['\"]" src/domain --glob '*.ts' || { echo "arch-check: domain must not import vscode"; exit 1; }
	@! rg -n "\\bas any\\b" src --glob '*.ts' || { echo "arch-check: as any found (justify or remove)"; exit 1; }
	@echo "arch-check: ok"

mutation:
	@echo "mutation: not configured for this project yet"
