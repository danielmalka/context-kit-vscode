# Prompt: Go Refactoring

Use this prompt when requesting a Go code refactor:

---

Refactor the following Go code following these guidelines:

1. **Errors:** All errors must be handled and wrapped with `fmt.Errorf("context: %w", err)`
2. **Interfaces:** Extract minimal interfaces for external dependencies (1-3 methods)
3. **Functions:** Each function should do one thing. Extract private helpers if needed
4. **Concurrency:** If there are goroutines, add context.Context for cancellation
5. **Tests:** After refactoring, existing tests should still pass without modification

Do not add new functionality. Only improve the internal structure.

Show the diff and run `make check` when done.
