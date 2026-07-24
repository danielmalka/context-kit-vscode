# Prompt: TypeScript Refactoring

Use this prompt when requesting a refactor of TypeScript code:

---

Refactor the following TypeScript code following these guidelines:

1. **Types:** Remove all `any`. Replace with specific types or `unknown`.
2. **Async:** Convert `.then()` chains to `async/await` with `try/catch`.
3. **Const:** Replace unnecessary `var` and `let` with `const`.
4. **Readonly:** Add `readonly` on arrays and objects that should not change.
5. **Tests:** After refactoring, the existing Vitest tests must keep passing.

Do not add new functionality. Only improve the internal structure.

Show the diff and run `make check` when done.
