.PHONY: check check-strict format fmt-check fix mutation arch-check

# Coverage floor enforced by check-strict. Projects may override:
#   make check-strict COVERAGE_MIN=90
COVERAGE_MIN ?= 80

fmt-check:
	@command -v uv >/dev/null 2>&1 || { echo "uv not found. Install: https://docs.astral.sh/uv/getting-started/installation/"; exit 1; }
	@uv run ruff --version >/dev/null 2>&1 || { echo "ruff not installed. Install: uv add --dev ruff"; exit 1; }
	uv run ruff format --check .

check: fmt-check
	uv run ruff check .
	uv run pytest

check-strict: check arch-check
	@uv run mypy --version >/dev/null 2>&1 || { echo "mypy not installed. Install: uv add --dev mypy"; exit 1; }
	uv run mypy .
	@uv run pytest --cov --help >/dev/null 2>&1 || { echo "pytest-cov not installed. Install: uv add --dev pytest-cov"; exit 1; }
	uv run pytest --cov --cov-report=term-missing --cov-fail-under=$(COVERAGE_MIN)

# arch-check: architectural invariants as PATH-SCOPED greps. Content-only pattern files
# cannot express "X is forbidden IN dir Y", so write explicit greps per invariant, derived
# from the project's AGENTS.md. Example (uncomment and adapt):
#	@! grep -rnE "<forbidden-pattern>" <scoped-dir>/ --include='*.py' || { echo "arch-check: <rule broken>"; exit 1; }
arch-check:
	@echo "arch-check: no invariants defined yet — add path-scoped greps here (see AGENTS.md)"

format:
	@command -v uv >/dev/null 2>&1 || { echo "uv not found. Install: https://docs.astral.sh/uv/getting-started/installation/"; exit 1; }
	@uv run ruff --version >/dev/null 2>&1 || { echo "ruff not installed. Install: uv add --dev ruff"; exit 1; }
	uv run ruff format .

fix:
	@command -v uv >/dev/null 2>&1 || { echo "uv not found. Install: https://docs.astral.sh/uv/getting-started/installation/"; exit 1; }
	@uv run ruff --version >/dev/null 2>&1 || { echo "ruff not installed. Install: uv add --dev ruff"; exit 1; }
	uv run ruff check --fix .
	uv run ruff format .

# Optional. Not part of check/check-strict — too slow for a gate.
mutation:
	@uv run python -c "import mutmut" >/dev/null 2>&1 || { echo "mutmut not installed. Install: uv add --dev mutmut"; exit 1; }
	uv run mutmut run
