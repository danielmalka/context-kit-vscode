.PHONY: check check-strict stan test fmt fmt-check mutation arch-check

EXEC = docker compose exec -T app

# Coverage floor enforced by check-strict. Projects may override:
#   make check-strict COVERAGE_MIN=90
COVERAGE_MIN ?= 80

fmt:
	$(EXEC) vendor/bin/php-cs-fixer fix

fmt-check:
	@$(EXEC) test -x vendor/bin/php-cs-fixer || { echo "php-cs-fixer not installed. Install: composer install"; exit 1; }
	$(EXEC) vendor/bin/php-cs-fixer fix --dry-run --diff

stan:
	@$(EXEC) test -x vendor/bin/phpstan || { echo "phpstan not installed. Install: composer install"; exit 1; }
	$(EXEC) vendor/bin/phpstan analyse --memory-limit=1G

test:
	$(EXEC) vendor/bin/pest

check: fmt-check stan test

check-strict: fmt-check arch-check
	@$(EXEC) test -x vendor/bin/phpstan || { echo "phpstan not installed. Install: composer install"; exit 1; }
	$(EXEC) vendor/bin/phpstan analyse --level=max --memory-limit=1G
	# coverage floor: kit default 80 via COVERAGE_MIN; projects may override
	$(EXEC) vendor/bin/pest --coverage --min=$(COVERAGE_MIN)

# arch-check: architectural invariants as PATH-SCOPED greps. Content-only pattern files
# cannot express "X is forbidden IN dir Y", so write explicit greps per invariant, derived
# from the project's AGENTS.md. Example (uncomment and adapt):
#	@! grep -rnE "<forbidden-pattern>" <scoped-dir>/ --include='*.php' || { echo "arch-check: <rule broken>"; exit 1; }
arch-check:
	@echo "arch-check: no invariants defined yet — add path-scoped greps here (see AGENTS.md)"

# Optional. Not part of check/check-strict — too slow for a gate.
mutation:
	@$(EXEC) test -x vendor/bin/infection || { echo "infection not installed. Install: composer require --dev infection/infection"; exit 1; }
	$(EXEC) vendor/bin/infection
