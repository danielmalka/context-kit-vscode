---
name: ddd-agentic
description: Domain-Driven Design as a cognitive guardrail for AI agents. Defines how to identify, respect, and use Bounded Contexts as firewalls the agent doesn't cross without explicit authorization.
---

# Agentic DDD — Bounded Contexts as Cognitive Firewalls

## The problem

AI agents tend to integrate directly between modules because it's the shortest path. DDD exists to impose architectural boundaries that protect the system's coherence. Without these explicit boundaries, AI accelerates the creation of architectural chaos.

---

## Step 1 — Check whether Bounded Contexts are defined

Before any implementation task, check the project's `AGENTS.md`:

**What to look for:**
- An "Architecture" or "Domains" section with defined bounded contexts
- A list of modules and their responsibilities
- Rules about which modules can communicate

**If the contexts are defined in AGENTS.md:**
→ Follow them strictly. Don't cross boundaries. Don't create direct dependencies between contexts. See Boundary Rules below.

**If the contexts are NOT defined:**
→ Run Step 2 before any implementation.

---

## Step 2 — Identify existing bounded contexts (when undefined)

Analyze the project structure and propose the contexts:

1. **Map existing modules:** list domain folders, packages, namespaces
2. **Identify responsibilities:** what does each module know and do?
3. **Identify the ubiquitous language:** what terms are used consistently within each module?
4. **Detect violations:** are there dependencies between modules that should be separate contexts?

**Proposal format:**
```
BOUNDED CONTEXT: [name]
RESPONSIBILITY: [what this context knows and does]
UBIQUITOUS LANGUAGE: [key terms used internally]
EXTERNAL INTERFACES: [how other contexts communicate with this one]
ISOLATION RULE: [what must not leak outside]
```

**Ask the developer:** "I've identified the following bounded contexts [list]. Does this reflect how the domain is organized? Any adjustments before I continue?"

Don't proceed with implementation until receiving confirmation.

---

## Boundary rules (always apply)

### 1. Never a direct dependency between contexts
```
BAD:  UserService imports OrderRepository directly
GOOD: UserService calls OrderService via an interface/event
```

### 2. Never share entities between contexts
```
BAD:  the Orders context uses the User entity from the Authentication context
GOOD: the Orders context has its own "buyer" concept with the fields it needs
```

### 3. Anti-Corruption Layer for external integrations
```
BAD:  data from the external API used directly in domain models
GOOD: an adapter that translates the external model into the internal model before it enters the domain
```

### 4. Domain events for communication between contexts
```
BAD:  the Payment context calls the Notification context directly
GOOD: the Payment context emits a "payment_confirmed" event, Notification listens
```

### 5. Ubiquitous language respected within the context
If AGENTS.md defines that "customer" in the Sales context is different from "user" in the Auth context, use the correct terms in each context. Never mix terminology between contexts in the code.

---

## Checklist before implementing

- [ ] Bounded Contexts verified or proposed and confirmed
- [ ] Is the task within a single context?
- [ ] If the task crosses contexts: is there a defined interface/event/ACL?
- [ ] Will the implementation create a direct dependency between contexts?
- [ ] Do the terms used in the code follow the context's ubiquitous language?

If any answer indicates a violation → discuss with the developer before implementing.
