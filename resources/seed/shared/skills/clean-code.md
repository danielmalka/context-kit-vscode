---
name: clean-code
description: Clean Code principles and AI-assisted development best practices. Apply when writing or reviewing any code.
version: 1.0.0
---

# Clean Code Practice

Apply these principles to all code you write or modify. When working with AI-assisted development, these rules become even more important because generated code often violates them silently.

## Naming

- Use **meaningful, pronounceable, searchable** names. `getUserById` not `getUsr`.
- **One word per concept**. Don't mix `fetch`, `get`, and `retrieve` for the same operation.
- Class/struct names: **noun** (`Customer`, `OrderRepository`). Method names: **verb** (`calculateTotal`, `sendNotification`).
- Avoid abbreviations unless universally understood (`URL`, `HTTP`).

## Functions

- **Small**. A function should do one thing and do it well. If you need "and" to describe it, split it.
- **Single level of abstraction** per function.
- **Few parameters**. Zero is ideal, one is good, two is acceptable. Three or more needs justification.
- **No side effects** that aren't obvious from the name.
- **Command/Query separation**. A function should either do something (command) or answer something (query), never both.

## Error Handling

- **Be explicit**. Don't return null/nil for errors.
- **Provide context**. When wrapping errors, include what was being attempted.
- **Don't swallow errors**. An empty catch block or `_ = err` needs a comment explaining why.

## Testing

- **Tests are documentation**. A test should make it obvious what the code does and what edge cases it handles.
- **Test names describe the scenario**. `TestUserService_CreateUser_DuplicateEmail_ReturnsConflict` not `test1`.
- **No logic in tests**. Tests should be straightforward: setup, execute, assert.
- **Fast and isolated**. Tests should not depend on order, external services, or shared state.

## AI-Assisted Development

- **Review every line of AI-generated code**. You are responsible. The AI suggests, you decide.
- **Verify against the spec**. AI often adds features you didn't ask for (YAGNI violation).
- **Iterate in small steps**. Generate one function, review, then generate the next.
- **Use the harness verification loop**. After AI generates code, run tests, lint, and review before accepting.

## Design Principles

- **DRY**: Every piece of knowledge should have a single, unambiguous representation.
- **YAGNI**: Don't build abstractions for future use cases.
- **KISS**: Prefer simple solutions. Complexity is a cost you pay every time someone reads the code.
- **Single Responsibility**: Every module, class, and function should have one reason to change.

## Code Review Checklist

- [ ] Names are clear and consistent with project conventions
- [ ] Functions are small and focused (under ~30 lines in most languages)
- [ ] No dead code, commented-out blocks, or TODO without ticket reference
- [ ] Error handling is explicit and contextual
- [ ] Tests exist and are readable
- [ ] No YAGNI violations
