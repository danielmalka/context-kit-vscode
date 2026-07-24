# Prompt: Python Refactoring

Use this prompt when requesting a refactor of Python code:

---

Refactor the following Python code following these guidelines:

1. **Types:** Add type hints to all functions. Fix mypy warnings.
2. **Structures:** Convert fixed-structure dicts to `@dataclass` or `pydantic.BaseModel`.
3. **Exceptions:** Replace `except Exception: pass` with specific handling.
4. **Constants:** Convert magic strings to `enum.Enum`.
5. **Tests:** After refactoring, the existing pytest tests must keep passing.

Do not add new functionality. Only improve the internal structure.

Show the diff and run `make check` when done.
