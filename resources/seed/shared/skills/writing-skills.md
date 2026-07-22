---
name: writing-skills
description: Use when creating a new skill or command for this kit, editing an existing one, or deciding whether a skill is worth keeping — covers frontmatter format, tool-agnostic phrasing, and the retire-if-unused rule.
---

# writing-skills

<!-- Portable mirror for context-kit. Source: ~/.claude/plugins/cache/claude-plugins-official/superpowers/6.1.1/skills/writing-skills/SKILL.md + this kit's own conventions. -->

## Overview

A skill is a reference guide for a proven technique, not a narrative about how you once solved something. Writing one is TDD applied to documentation: know the failure a skill should prevent before you write it, and verify the skill actually prevents it before you commit it.

## Kit-specific rules (non-negotiable)

- **Frontmatter is mandatory** — `name` (kebab-case, matches filename) + `description`, opening line 1 of the file. No other frontmatter fields needed for kit skills.
- **Description starts with "Use when..."** and states triggering conditions/symptoms only — never summarizes the skill's steps. A description that leaks the workflow becomes a shortcut agents follow instead of reading the body.
- **Tool-agnostic.** Skills in this kit must read identically whether the runtime is Claude Code, Codex, or Gemini. No `mcp__claude-flow__*` calls, no vendor CLI names baked into the happy path — describe the technique, let the agent pick its own tools (`gh`, `git`, `grep`, etc. are fine; they're universal).
- **No emojis.**
- **Condense, don't copy.** When mirroring an external skill (a plugin, another agent's skills dir), strip the tool-specific scaffolding (swarm topologies, dashboards, CLI flags for tools that don't exist here) and keep only the technique. A 1000-line source should usually compress to well under 150 lines.
- **Mirrors carry a source comment** right after the frontmatter/title: `<!-- Portable mirror for context-kit. Source: <path>. -->`

## When to create vs skip

Create when the technique wasn't obvious, applies across projects, and isn't already automatable (if a linter/hook can enforce it, do that instead of writing prose about it). Skip for one-off fixes, project-specific conventions (those go in the project's own docs), or anything a stdlib/existing skill already covers — check `shared/skills/*.md` before writing a new one.

## Structure

```markdown
---
name: skill-name
description: Use when [specific trigger].
---

# skill-name

## Overview
One or two sentences: what is this, core principle.

## When
Bullets: symptoms/situations that mean this applies. When NOT to use, if non-obvious.

## Pattern / Steps
The technique itself. Inline code for anything under ~50 lines; link a separate file only for heavy reference or a reusable script.

## Common mistakes
Table: mistake -> fix.
```

## Testing before commit

Before a skill lands in the kit, try it on one real case — not a hypothetical. If following the skill produces the right outcome, ship it. If it doesn't, the skill has a gap; fix the gap, don't just add a caveat.

## Retire, don't accumulate

A skill that contributes nothing across two retrospective cycles gets deleted, not archived "just in case." A lean harness beats a comprehensive one nobody reads — an unused skill is a tax on every future context load, not neutral clutter.

## Common mistakes

| Mistake | Fix |
|---|---|
| Description summarizes the workflow | Rewrite as pure trigger condition |
| Copying a 1000-line vendor skill verbatim | Extract the technique, drop the CLI/product branding |
| Skill baked to one tool's syntax | Rephrase around the underlying operation (diff, grep, test run) |
| Never tested against a real task | Run it once for real before committing |
| Skill nobody has invoked in months | Delete it |
