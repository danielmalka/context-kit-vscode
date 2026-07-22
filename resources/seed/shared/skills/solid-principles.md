---
name: solid-principles
description: SOLID principles with practical examples. Apply when designing classes, interfaces, or modules.
version: 1.0.0
---

# SOLID Principles

## Single Responsibility Principle (SRP)
A class should have only one reason to change. Extract each responsibility into its own type.

**AI prompt tip:** "Refactor this class to follow SRP. Extract each responsibility into its own type."

## Open/Closed Principle (OCP)
Software entities should be open for extension but closed for modification. Use interfaces to add behavior without changing existing code.

**AI prompt tip:** "Design this module to be open for extension. Use interfaces so new implementations don't require modifying existing code."

## Liskov Substitution Principle (LSP)
Objects of a superclass should be replaceable with objects of a subclass without affecting correctness. Subtypes must honor the contract of the base type.

**AI prompt tip:** "Check if these types satisfy LSP. Are there any cases where a subtype would break the caller's expectations?"

## Interface Segregation Principle (ISP)
Clients should not depend on interfaces they don't use. Split large interfaces into smaller, more specific ones.

**AI prompt tip:** "Split this large interface into smaller interfaces following ISP. Each interface should represent a single capability."

## Dependency Inversion Principle (DIP)
High-level modules should not depend on low-level modules. Both should depend on abstractions.

**AI prompt tip:** "Apply DIP to this module. Define interfaces for dependencies and wire them via constructor injection."

## Applying SOLID with AI

- Include the relevant SOLID principle in your prompt when asking for implementations.
- Review generated code for SRP and ISP violations — these are the most common AI-generated issues.
- Refactor step by step: "Extract this class following SRP." Then: "Apply DIP to the extracted classes."
- After applying SOLID principles, run existing tests. A correct refactoring should not change observable behavior.
- Know when to stop: SOLID is a guide, not a rigid rule. Over-applying creates unnecessary complexity (YAGNI violation).
