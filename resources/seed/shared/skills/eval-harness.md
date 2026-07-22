---
name: eval-harness
description: Eval-Driven Development (EDD) — defines the system's expected behavior BEFORE writing code. For new features, especially on security-critical paths.
---

# Eval Harness — Eval-Driven Development

## The problem EDD solves

Unit tests validate the code's behavior. Evals validate the system's behavior.
A passing test doesn't guarantee the system does what the product needs — evals do.

With AI generating code, the risk increases: the model has the same blind spots when writing and when reviewing. Defining evals beforehand forces the expected behavior to be specified independently of the implementation.

---

## When to use EDD

Use it BEFORE implementing any feature that:
- Authenticates or authorizes (rejection behavior matters as much as acceptance)
- Validates input data (edge cases are what matters)
- Integrates with an external system (the interface contract must be specified)
- Has security-critical behavior

---

## Step 1 — Define evals before the code

For each capability of the feature, write:

```
EVAL: [descriptive name]
INPUT: [exact input]
EXPECTED OUTPUT: [expected output or behavior]
GRADER: code-based | model-based
THRESHOLD: pass@3≥90% | pass^3=100%
```

**Example — authentication:**
```
EVAL: auth-rejects-expired-token
INPUT: JWT with exp=1 hour in the past
EXPECTED OUTPUT: HTTP 401 with body {"error": "token_expired"}
GRADER: code-based (assert status == 401 and body.error == "token_expired")
THRESHOLD: pass^3=100% (security-critical path)

EVAL: auth-accepts-valid-token
INPUT: valid JWT with correct claims
EXPECTED OUTPUT: HTTP 200 with authenticated user data
GRADER: code-based
THRESHOLD: pass@3≥90%
```

---

## Step 2 — Types of evals

### Capability evals
Verify whether the system can do X.
- Threshold: `pass@3 ≥ 90%` — 3 independent attempts, at least 90% passing
- For: product features, integrations, normal flows

### Regression evals
Verify that a change didn't break Y.
- Threshold: `pass^3 = 100%` — 3 consecutive attempts, all passing
- For: security-critical paths, system invariants

The threshold can vary by environment (e.g., production requires `pass^3=100%` where staging accepts `pass@3≥90%`) — no auto-rollback automation is needed to apply this, just declare the per-environment threshold in the eval itself.

---

## Step 3 — Types of graders

### Code-based (deterministic)
```python
def grade(output):
    assert output.status_code == 401
    assert output.json()["error"] == "token_expired"
    return "pass"
```
Use for: responses with a defined structure, status codes, presence/absence of fields.

### Model-based (LLM-as-judge)
```
Prompt to the model: "Does the output below satisfy criterion [X]? Answer PASS or FAIL with justification."
```
Use for: error message quality, response completeness, compliance with the ubiquitous language.

---

## Step 4 — Relationship with unit tests

| | Evals | Unit tests |
|---|-------|-----------------|
| **Verifies** | System behavior | Code behavior |
| **When** | Before implementing | After implementing (TDD) |
| **Grader** | Code-based or model-based | Deterministic assertions |
| **Failure indicates** | Specification not met | Regression in the code |
| **Threshold** | pass@3 or pass^3 | 100% deterministic |

**Both coexist.** Evals ensure the system does what the product needs. Tests ensure the code does what the system specifies.

---

## EDD checklist

Before implementing any feature:

- [ ] Capability evals written for the happy path
- [ ] Capability evals written for the main error flows
- [ ] Regression evals written for security-critical paths
- [ ] Threshold defined per eval (pass@3 or pass^3)
- [ ] Grader defined per eval (code-based or model-based)
- [ ] Evals can run independently of the implementation

Only then: implement.
