---
name: model-routing
description: Model routing by complexity and cost. Defines which model to use for each task type, with explicit criteria and token-optimization strategies.
---

# Model Routing — FinOps for Agentic Development

## The context

The cost of using AI models is real and growing. The era of generous subsidies is ending — every token has a cost. Using Opus to format code or Haiku for architecture decisions are opposite mistakes: one wastes money, the other wastes quality.

---

## Routing table

| Task type | Model | Reason |
|-------------|--------|-------|
| Formatting, renaming, boilerplate generation | **Haiku** | Mechanical task, no complex reasoning |
| Simple CRUD, unit tests for existing code | **Haiku** | Well-defined pattern, low risk |
| Feature implementation with a clear spec | **Sonnet** | Reasoning required, not critical |
| Refactoring with behavior change | **Sonnet** | Broad context, multiple trade-offs |
| Debugging a non-obvious problem | **Sonnet** | Investigation, but usually solvable |
| Public API design or database schema | **Opus** | Irreversible decision with broad impact |
| Authentication or authorization system | **Opus** | Security-critical, errors are costly |
| Architecture for a new module or service | **Opus** | Long-term structural decision |
| In-depth security review | **Opus** | Requires sophisticated adversarial reasoning |
| Analysis of complex legacy code | **Opus** | Dense, ambiguous context |

### Quick decision criterion

```
Is the task irreversible or does it impact many modules?
  Yes → Opus
  No →
    Does the task require reasoning about multiple trade-offs?
      Yes → Sonnet
      No → Haiku
```

---

## Token optimization

### What you include in context increases cost

Every file read, every instruction, every history message consumes tokens. Strategies to reduce it:

**Minimum necessary context:**
- Include only the files that will be modified or consulted
- For mechanical tasks (Haiku): only the target file
- For implementation tasks (Sonnet): target file + relevant interfaces
- For architecture decisions (Opus): AGENTS.md + ARCHITECTURE.md + interface files

**Don't re-read files already in context:**
- If a file was read in this session, don't ask to read it again
- Keep a reference to the content already available

**Batch related operations:**
- Group tasks that use the same files in the same session
- Avoid switching between very different contexts unnecessarily

---

## Open-source models as an alternative

For Haiku-tier (mechanical) tasks, consider open-source models specialized in code when available locally:

| Model | Strength | Recommended use |
|--------|-------|-----------------|
| DeepSeek Coder | Code completion, mechanical refactoring | Boilerplate, renames |
| CodeLlama | Code generation with local context | Simple unit tests |
| Qwen2.5-Coder | Fast completion | IDE autocomplete |

**Criterion for using open-source:** the task is deterministic, doesn't involve domain reasoning, and the result is immediately verifiable by a linter or test.

**Never use open-source for:** architecture decisions, security code, vulnerability analysis.

---

## Routing checklist

Before starting any agent session:

- [ ] What is the task type? (mechanical / implementation / architecture / security)
- [ ] Which model is appropriate?
- [ ] Which files are strictly necessary in context?
- [ ] Can this task be broken down to use a cheaper model for part of it?
