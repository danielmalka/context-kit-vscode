# Prompt: PHP Refactor

Use this prompt when requesting a PHP code refactor:

---

Refactor the following PHP code following these guidelines:

1. **Types:** Add `declare(strict_types=1)` if missing. Add type hints on all parameters and return values.
2. **Classes:** Mark as `final` if there is no inheritance. Use `readonly` on immutable properties.
3. **Exceptions:** Replace generic `\Exception` with domain-specific exceptions.
4. **Enums:** Convert string constants with a finite set of values to `enum`.
5. **Tests:** After refactoring, the existing Pest tests must keep passing.

Do not add new functionality. Only improve the internal structure.

Show the diff and run `make check` when finished.
