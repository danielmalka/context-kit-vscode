---
name: tool-design
description: Use when designing or reviewing tools for agents — new tool APIs, MCP servers, consolidating overlapping tools, or debugging agent misuse of a tool.
---

# Tool Design for Agents

Every tool is a contract between a deterministic system and a non-deterministic agent. Unlike human-facing APIs, the contract must be unambiguous from the description alone — the agent infers intent from it and generates calls that have to match the expected shape.

## Core principle: consolidation

If a human engineer can't say for certain which tool applies, an agent won't either. Prefer a few high-level, unambiguous tools over many narrow, overlapping ones. Consolidating an overlapping tool set into fewer general-purpose tools reliably improves agent accuracy — one real-world migration went from 17 tools to 2 and got better results.

Where possible, give the agent a primitive the model already understands deeply (filesystem, shell) instead of a bespoke wrapper tool. A single command-execution tool often beats ten custom tools built on top of it.

## Tool description is prompt engineering

Treat the description as the main lever over agent behavior, not documentation. Structure every description to answer, in this order:
- What does it do?
- When should it be used? (concrete trigger scenarios, not just a feature list)
- What inputs does it take, and in what format?
- What does it return?

```python
def get_customer(customer_id: str, format: str = "concise"):
    """
    Retrieve customer info by ID.

    Use when:
    - The user asks about a specific customer's details
    - You need customer context to make a decision
    - Verifying customer identity

    Args:
        customer_id: Format "CUST-######" (e.g. "CUST-000001")
        format: "concise" for key fields, "detailed" for the full record

    Returns:
        Customer object with the requested fields

    Errors:
        NOT_FOUND: customer_id not found
        INVALID_FORMAT: id must match CUST-######
    """
```

## Schema optimization

- Minimize required fields; give everything else a sensible default.
- Prefer enums over free-form strings wherever the value space is closed — it removes a whole class of malformed calls.
- Offer a response-format switch (concise vs. detailed) so the agent can trade completeness for token cost per call.
- Use fully-qualified names for MCP tools (`ServerName:tool_name`) to avoid namespace collisions across servers.

## Error messages built for recovery

Every error must say what went wrong and how to fix it — not just that it failed. An agent that gets `INVALID_FORMAT: id must match CUST-######` can retry correctly; one that gets `400 Bad Request` cannot.

## Return format built for consumption

Optimize for what the agent needs next, not for completeness. High signal, no dumps: return the fields the agent will act on, not the full underlying record, unless a verbose mode was explicitly requested.

## Guidelines

1. Write descriptions that answer what/when/inputs/returns.
2. Consolidate overlapping tools to remove ambiguity.
3. Offer concise vs. detailed response modes for token efficiency.
4. Design error messages for agent recovery, not just human debugging.
5. Keep naming conventions consistent across a tool set.
6. Cap tool count and namespace clearly when tools come from multiple sources.
7. Test designs against real agent interactions, not just unit tests.
8. Iterate from observed failure modes — feed real misuse back into the description.
9. Ask whether each tool actually expands what the model can do, or just adds friction.
10. Prefer general-purpose primitives over narrow, single-use wrappers.

## Pitfalls

- Vague descriptions that don't state when to use the tool.
- Cryptic parameter names with no format hints.
- No error-recovery guidance.
- Inconsistent naming across a tool family.
- Namespace collisions between MCP servers.
- Description rot — the tool's behavior drifts but the description doesn't.
- Over-consolidation into one tool that tries to do everything and loses clarity.
- Parameter explosion — a tool that accumulates optional flags until its contract is unreadable.
- Errors with no context, forcing the agent to guess at a fix.
