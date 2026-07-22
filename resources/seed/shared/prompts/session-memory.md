---
name: session-memory
description: Dated memory.md template to anchor what was done, decisions made, and errors found in the session. Compact format so it doesn't blow up the token budget.
---

# Session Memory — Template

Use this template to create or update the `session-memory.md` file at the project root at the end of every significant session.

**Rule:** be concise. The goal is to create anchors for the next session, not a complete diary. If an entry takes more than 3 lines, it's too big.

---

## Template

```markdown
# Session Memory — [Project Name]

## [YYYY-MM-DD] — [session title in 5 words]

### What was done
- [task 1 completed — file modified]
- [task 2 completed — file modified]

### Decisions made
- [decision]: [reason in one sentence]
- [decision]: [reason in one sentence]

### Errors found (don't repeat)
- [error or hallucination that occurred]: [how it was fixed]

### Current state
- [what's working]
- [what's pending for the next session]

### Next step
[one sentence on where to continue]

---
```

---

## How to use it in practice

### When starting a session
```
1. Check whether session-memory.md exists at the project root
2. If it exists: read it BEFORE anything else
3. Internally confirm the recorded "next step"
4. Check whether the current state is still valid (files may have changed)
```

### When ending a session
```
1. Create or update session-memory.md with the template above
2. Be surgical — only what's useful for resuming
3. The whole file shouldn't exceed 60 lines
4. If it does: consolidate older entries into a 2-3 line summary
```

### When the file grows large
Once past 60 lines, consolidate the oldest entries:

```markdown
## Consolidated history (up to [date])
[2-3 lines summarizing the permanent architectural decisions from older sessions]
```

Always keep intact: the most recent session and any decisions that still affect current work.

---

## Filled-in example

```markdown
# Session Memory — payments-api

## 2026-06-20 — stripe webhook implementation

### What was done
- Created POST /webhooks/stripe handler in src/handlers/webhook.go
- Added Stripe signature validation in pkg/stripe/signature.go
- Tests in pkg/stripe/signature_test.go (7 cases, including invalid token)

### Decisions made
- Use the webhook secret via env var STRIPE_WEBHOOK_SECRET (not hardcoded)
- Return 200 for unknown events (Stripe recommends not returning an error)

### Errors found (don't repeat)
- Tried using `stripe.ConstructEvent` without passing the raw body — validation fails. Needs the body as []byte before JSON parsing.

### Current state
- Webhook receives and validates payment_intent.succeeded events
- Pending: process the payment_intent.payment_failed event

### Next step
Implement the handler for payment_intent.payment_failed in src/handlers/webhook.go line 87
```
