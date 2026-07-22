---
name: context-engineering
description: Prevents Context Rot and Lost-in-the-Middle in long sessions. Defines how to maintain and use the project's architecture guide to anchor the agent without relying on MCP or external plugins.
---

# Context Engineering — Long-Context Anchoring

## The problem

In long sessions, agents lose coherence. Symptoms:
- Contradicting decisions made 10 messages ago
- "Forgetting" that a function was already implemented and reimplementing it differently
- Mixing conventions from different projects
- Proposing solutions that violate already-defined architecture

This is **Context Rot** — and it worsens with session length.

**Lost-in-the-Middle** is the more dangerous variant: the agent ignores information in the middle of very long contexts, paying attention only to the beginning and the end.

---

## Solution: ARCHITECTURE.md as an anchor

Every project should have an `ARCHITECTURE.md` at the root. The agent should consult it at the start of any session and after any pause.

### Minimum structure of ARCHITECTURE.md

```markdown
# Architecture — [Project Name]
_Last updated: [date]_

## Overview
[1-2 paragraphs on what the system does and its main structure]

## Bounded Contexts / Main modules
[list with the responsibility of each module]

## Architectural decisions (summarized ADRs)
| Decision | Reason | Date |
|---------|--------|------|
| [what was decided] | [why] | [when] |

## System invariants
[rules that must never be violated by the agent]

## Code conventions
[conventions specific to this project beyond AGENTS.md]

## What not to do
[decisions that were discarded and why — prevents the agent from proposing them again]
```

---

## Anchoring protocol

### Start of session
1. Read the project's root `AGENTS.md`
2. Read `ARCHITECTURE.md` if it exists
3. Read the previous session's `session-memory.md` if it exists
4. Confirm internally: "What is this project's context? What are the invariants?"

### After every 5 tasks or when context seems uncertain
1. Re-read the "Invariants" and "What not to do" sections of ARCHITECTURE.md
2. Check whether the latest tasks are consistent with the recorded decisions
3. If there's a divergence: flag it before continuing

### At the end of the session
Update `ARCHITECTURE.md` if:
- A new architectural decision was made
- An invariant was added or modified
- A new convention was established

And create/update `session-memory.md` (see the `session-memory` prompt).

---

## Context usage rules

### What to include in the agent's context
- The project's AGENTS.md (always)
- ARCHITECTURE.md (always)
- Only the files directly relevant to the current task
- The previous session's session-memory.md

### What NOT to include
- Entire configuration files that won't be modified
- Long conversation history about other features
- Complete external API documentation (include only the relevant excerpt)

### When the context gets too long
Signs: the agent starts contradicting earlier decisions, ignores AGENTS.md constraints.

Action: create a new context with:
1. AGENTS.md
2. ARCHITECTURE.md
3. session-memory.md updated with a summary of the previous session
4. Only the current task's files

Don't try to "summarize" a long context into a single message — that propagates Lost-in-the-Middle.

---

## No MCP? No problem.

This protocol works entirely with files in the repository. It requires no claude-flow, plugins, or MCP. `ARCHITECTURE.md` and `session-memory.md` are the persistent memory — any agent in any environment can consult them.
