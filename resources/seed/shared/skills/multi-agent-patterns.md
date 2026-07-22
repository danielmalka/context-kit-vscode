---
name: multi-agent-patterns
description: Use when designing a multi-agent system, choosing between supervisor/peer-to-peer/hierarchical patterns, coordinating sub-agents or handoffs, or deciding whether a task actually needs more than one agent.
---

# Multi-Agent Patterns

Multi-agent architectures split work across multiple model instances, each with its own context window. Done well, this unlocks work beyond a single agent's context limits. Done poorly, coordination overhead cancels the benefit. The core insight: sub-agents exist primarily to isolate context, not to role-play an org chart.

## When to use multiple agents

- A single agent's context window can't hold everything the task needs.
- The task decomposes into genuinely independent, parallelizable subtasks.
- Different subtasks need different tool sets or system prompts.
- Multiple domains need to be handled at once.

## When NOT to use multiple agents

If the task fits comfortably in one context window, don't split it. Multi-agent runs cost roughly an order of magnitude more tokens than a single agent with tools (single agent ~4x a plain chat baseline; multi-agent coordination ~15x). Splitting adds real overhead — token cost, coordination latency, failure surface — so only pay for it when isolation is the actual bottleneck, not because it feels more sophisticated.

## Context isolation is the primary benefit

Each agent should operate in a clean context, free of accumulated noise from other subtasks — this is what prevents the "telephone game" problem, where information degrades every time it's re-summarized by an intermediary. Choose isolation mechanisms deliberately:

- **Full context handoff** — the sub-agent gets the planner's entire context.
- **Instruction passing** — the sub-agent gets only a constructed instruction, nothing else.
- **Filesystem-mediated memory** — agents read/write shared persistent storage instead of passing everything through messages.

## Architectural patterns

Pick based on coordination needs, not organizational metaphors.

**Supervisor / orchestrator**
```
User query -> Supervisor -> [Specialist, Specialist, Specialist] -> Aggregation -> Final output
```
Use for centralized control when tasks decompose cleanly and a human needs oversight. Watch for the telephone-game failure: a supervisor that paraphrases a sub-agent's answer loses fidelity on every pass. Fix it with a pass-through path (e.g. a `forward_message` tool) that lets a sub-agent's answer reach the user or caller verbatim instead of being re-synthesized.

**Peer-to-peer / swarm**
```python
def transfer_to_agent_b():
    return agent_b  # handoff via function return
```
Use for flexible exploration when rigid up-front planning would be counterproductive.

**Hierarchical**
```
Strategy layer (goal-setting) -> Planning layer (task decomposition) -> Execution layer (atomic tasks)
```
Use for large-scale work needing layered abstraction.

## Coordination protocols

- Make handoffs explicit: one owner per artifact, a defined input/output contract at each boundary.
- Validate a sub-agent's output before passing it downstream — don't assume silent success.
- Avoid plain majority voting for consensus; weight votes by demonstrated confidence or expertise, or have agents critique each other's outputs.
- Watch for sycophancy convergence — agents agreeing with each other rather than being correct.

## Failure handling

- **Timeout or null result** — treat as a failure signal, not as "nothing to report"; never silently proceed as if the sub-agent succeeded.
- **Retry with judgment** — retry only when the failure looks transient; a bad decomposition or wrong tool call won't fix itself on retry.
- **Supervisor bottleneck** — beyond ~3-5 workers, the supervisor spends more tokens processing summaries than the parallelism saves. Cap workers per supervisor in that range.
- **Error cascades** — add a validation checkpoint between agent stages so one bad output doesn't propagate silently through the whole chain.
- **Divergence** — set clear objective boundaries so parallel agents don't drift into contradicting work.

## Guidelines

1. Design for context isolation as the primary benefit, not role-play.
2. Choose the pattern from coordination needs, not org-chart metaphors.
3. Use explicit handoff protocols with defined state passing.
4. Use weighted voting or critique protocols for consensus, not simple majority.
5. Watch for supervisor bottlenecks; checkpoint and validate outputs before passing them on.
6. Set lifetime/iteration limits to prevent infinite loops.
7. Test failure scenarios explicitly — don't only test the happy path.

## Pitfalls

- Supervisor bottleneck at scale — 5+ workers means more tokens spent summarizing than parallelism saves.
- Underestimating token cost — multi-agent runs cost roughly 15x a single-agent baseline.
- Sycophancy-driven consensus — agents converge on agreeable answers, not correct ones.
- Agent proliferation — diminishing returns past 3-5 agents.
- Telephone-game message passing — use shared persistent storage instead of relayed summaries.
- Error cascades — missing validation checkpoints between agents.
- Over-decomposition — splitting tasks that don't actually benefit from separate contexts.
- No shared state — building multi-agent flows without persistent storage in place first.
