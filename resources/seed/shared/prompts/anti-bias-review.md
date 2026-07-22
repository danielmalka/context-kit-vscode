---
name: anti-bias-review
description: Code review guide against Automation Bias and the Anchoring Effect when reviewing AI-generated code. Use when reviewing any agent-generated diff.
---

# Anti-Bias Review — Code Review Without Automation Bias

## The cognitive problem

When reviewing AI-generated code, the developer faces two biases:

**Automation Bias:** the tendency to trust automated systems excessively. The AI's code looks "official" and the reviewer approves without critical analysis.

**Anchoring Effect:** the first suggestion seen anchors the thinking. Even when there's a problem, the reviewer tends to adjust around the proposed solution instead of considering alternatives.

The result: plausible but incorrect code that passes review. This is the highest risk in AI-assisted development — not the obviously wrong code, but the code that looks right.

---

## Anti-bias review protocol

### Step 1 — Read the diff BEFORE reading the AI's description

```
git diff main...HEAD
```

Read the diff first, without the AI's context. Form an opinion about what the code does. Mentally identify where the sensitive points are.

Only then read the description or context the agent provided.

### Step 2 — Formulate an independent hypothesis

Before reviewing the AI's solution, answer:
- "If I were implementing this myself, how would I do it?"
- "What are the edge cases I should check?"
- "What invariants does the system have that this change must respect?"

This creates an independent anchor for comparison.

### Step 3 — Review as if it were a junior's code

Treat the AI's code like that of a competent but domain-inexperienced junior developer:
- It may be syntactically correct but semantically wrong
- It may not know the system's implicit invariants
- It may have implemented the happy path and forgotten the edge cases

**Questions to ask for each block:**
- [ ] What happens if the input is null/empty/zero?
- [ ] What happens if the external call fails?
- [ ] Does this respect business rules I know but the agent might not?
- [ ] Does this violate any system invariant?

### Step 4 — Check the edge cases explicitly

Don't trust that the tests cover the edge cases. Check:

```
For each modified function:
1. What's the behavior with the minimum valid input?
2. What's the behavior with the maximum valid input?
3. What's the behavior with invalid input?
4. What's the behavior when an external dependency fails?
5. What's the behavior under concurrency (if applicable)?
```

### Step 5 — Delegate the mechanical, focus on the semantic

The AI is good at: formatting, naming, structure, boilerplate.
The human should focus on: business logic, invariants, security, architecture decisions.

**Don't spend time reviewing:**
- Indentation and formatting (the linter guarantees it)
- Local variable naming (if readable, it's fine)
- Import structure (the linter guarantees it)

**Spend time reviewing:**
- Authorization and authentication logic
- Error handling and failure cases
- Database queries and mutations
- Integration with external systems
- External input validation
- Anything irreversible (delete, send email, charge)

---

## Warning signs during review

If you notice any of these thoughts, stop and restart the review:

- "Looks right" → verify explicitly, don't trust the impression
- "The AI wouldn't get this wrong" → subtler errors are the most common
- "The tests pass, so it's correct" → tests test what was implemented, not what should have been implemented
- "I'll approve it and see if a bug shows up" → go back to Step 3

---

## Managing review fatigue

In long sessions, review quality drops. Strategies:

**Continuous review limit:** don't review more than 200 lines of diff without a break.

**Risk-based prioritization:**
```
Priority 1 (always review with maximum attention):
- Auth, permissions, external input validation
- Database queries with DELETE/UPDATE without a specific WHERE
- Calls to external systems (emails, payments, notifications)

Priority 2 (review with normal attention):
- Core business logic
- Error handling

Priority 3 (review quickly):
- Internal refactors with no behavior change
- Test additions
- Documentation
```

**When fatigue is high:** review only Priority 1. Schedule Priority 2 and 3 for the next session.
