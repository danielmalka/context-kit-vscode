.PHONY: check check-strict lint test fmt fmt-check mutation arch-check

# Coverage floor enforced by check-strict. Projects may override:
#   make check-strict COVERAGE_MIN=90
COVERAGE_MIN ?= 80

fmt:
	@command -v gofumpt >/dev/null 2>&1 || { echo "gofumpt not found. Install: go install mvdan.cc/gofumpt@latest"; exit 1; }
	gofumpt -w .

fmt-check:
	@command -v gofumpt >/dev/null 2>&1 || { echo "gofumpt not found. Install: go install mvdan.cc/gofumpt@latest"; exit 1; }
	@test -z "$$(gofumpt -l .)" || { echo "not gofumpt-formatted:"; gofumpt -l .; exit 1; }

lint:
	@command -v golangci-lint >/dev/null 2>&1 || { echo "golangci-lint not found. Install: https://golangci-lint.run/docs/welcome/install/"; exit 1; }
	golangci-lint run ./...

test:
	go test ./...

check: fmt-check lint test

check-strict: fmt-check lint arch-check
	go vet ./...
	go run golang.org/x/vuln/cmd/govulncheck@latest ./...
	go test -race -count=1 -coverprofile=coverage.out ./...
	@go tool cover -func=coverage.out | tail -1 | awk -v floor=$(COVERAGE_MIN) '{ pct=$$3+0; printf "coverage: %s (floor %s%%)\n", $$3, floor; if (pct < floor) { print "FAIL: coverage below floor"; exit 1 } }'

# arch-check: architectural invariants as PATH-SCOPED greps. Content-only pattern files
# cannot express "X is forbidden IN dir Y", so write explicit greps per invariant, derived
# from the project's AGENTS.md. Example (uncomment and adapt):
#	@! grep -rnE "<forbidden-pattern>" <scoped-dir>/ --include='*.go' || { echo "arch-check: <rule broken>"; exit 1; }
arch-check:
	@echo "arch-check: no invariants defined yet — add path-scoped greps here (see AGENTS.md)"

# Optional. Not part of check/check-strict — too slow for a gate.
mutation:
	@command -v gremlins >/dev/null 2>&1 || { echo "gremlins not installed. Install: go install github.com/go-gremlins/gremlins/cmd/gremlins@latest"; exit 1; }
	gremlins unleash
