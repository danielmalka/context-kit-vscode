.PHONY: check check-strict lint type-check test fmt fmt-check mutation arch-check

# Coverage floor enforced by check-strict. Projects may override:
#   make check-strict COVERAGE_MIN=90
COVERAGE_MIN ?= 80

# Default test runner is Vitest. Override for node:test projects, e.g.:
#   TEST_CMD='node --import tsx --test tests/unit/*.test.ts'
#   STRICT_TEST_CMD='node --import tsx --test --experimental-test-coverage tests/unit/*.test.ts'
TEST_CMD ?= npx vitest run
STRICT_TEST_CMD ?= npx vitest run --coverage --coverage.thresholds.lines=$(COVERAGE_MIN)

fmt:
	@npx --no-install prettier --version >/dev/null 2>&1 || { echo "prettier not installed. Install: npm install --save-dev prettier"; exit 1; }
	npx prettier --write .

fmt-check:
	@npx --no-install prettier --version >/dev/null 2>&1 || { echo "prettier not installed. Install: npm install --save-dev prettier"; exit 1; }
	npx prettier --check .

lint:
	@npx --no-install eslint --version >/dev/null 2>&1 || { echo "eslint not installed. Install: npm install --save-dev eslint typescript-eslint @eslint/js"; exit 1; }
	npx eslint src --ext .ts,.tsx

type-check:
	@npx --no-install tsc --version >/dev/null 2>&1 || { echo "typescript not installed. Install: npm install --save-dev typescript"; exit 1; }
	npx tsc --noEmit

test:
	$(TEST_CMD)

check: fmt-check lint type-check test

check-strict: fmt-check lint arch-check
	@npx --no-install tsc --version >/dev/null 2>&1 || { echo "typescript not installed. Install: npm install --save-dev typescript"; exit 1; }
	npx tsc --noEmit --strict
	$(STRICT_TEST_CMD)

# arch-check: architectural invariants as PATH-SCOPED greps. Content-only pattern files
# cannot express "X is forbidden IN dir Y", so write explicit greps per invariant, derived
# from the project's AGENTS.md. Example (uncomment and adapt):
#	@! grep -rnE "<forbidden-pattern>" <scoped-dir>/ --include='*.ts' || { echo "arch-check: <rule broken>"; exit 1; }
arch-check:
	@echo "arch-check: no invariants defined yet — add path-scoped greps here (see AGENTS.md)"

# Optional. Not part of check/check-strict — too slow for a gate.
mutation:
	@command -v stryker >/dev/null 2>&1 || npx --no-install stryker --version >/dev/null 2>&1 || { echo "Stryker not installed. Install: npm install --save-dev @stryker-mutator/core"; exit 1; }
	npx stryker run
