.PHONY: check check-strict test mutation arch-check

# Coverage floor enforced by check-strict. Projects may override:
#   make check-strict COVERAGE_MIN=90
COVERAGE_MIN ?= 80

check:
	@command -v cargo >/dev/null 2>&1 || { echo "cargo not found. Install: https://rustup.rs"; exit 1; }
	@cargo fmt --version >/dev/null 2>&1 || { echo "rustfmt not found. Install: rustup component add rustfmt"; exit 1; }
	@cargo clippy --version >/dev/null 2>&1 || { echo "clippy not found. Install: rustup component add clippy"; exit 1; }
	cargo fmt --all -- --check
	cargo clippy --all-targets -- -D warnings
	cargo test --all

check-strict: check arch-check
	cargo clippy --all-targets --all-features -- -D warnings -W clippy::pedantic
	cargo audit || echo "cargo-audit not installed; run: cargo install cargo-audit"
	@command -v cargo-llvm-cov >/dev/null 2>&1 || { echo "cargo-llvm-cov not found. Install: cargo install cargo-llvm-cov"; exit 1; }
	cargo llvm-cov --all --fail-under-lines $(COVERAGE_MIN)

# arch-check: architectural invariants as PATH-SCOPED greps. Content-only pattern files
# cannot express "X is forbidden IN dir Y", so write explicit greps per invariant, derived
# from the project's AGENTS.md. Example (uncomment and adapt):
#	@! grep -rnE "<forbidden-pattern>" <scoped-dir>/ --include='*.rs' || { echo "arch-check: <rule broken>"; exit 1; }
arch-check:
	@echo "arch-check: no invariants defined yet — add path-scoped greps here (see AGENTS.md)"

test:
	cargo test --all

# Optional. Not part of check/check-strict — too slow for a gate.
mutation:
	@command -v cargo-mutants >/dev/null 2>&1 || { echo "cargo-mutants not found. Install: cargo install cargo-mutants"; exit 1; }
	cargo mutants --no-shuffle -j 2
