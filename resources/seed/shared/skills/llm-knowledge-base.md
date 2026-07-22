---
name: llm-knowledge-base
description: Use when building or maintaining a research knowledge base with LLMs — compiling raw sources into a markdown wiki, running Q&A against it, auditing integrity, or designing a knowledge capture workflow.
---

# LLM Knowledge Base

## Overview

LLM as compiler, not assistant. Raw sources go in; the LLM maintains the entire wiki — you never edit it directly. Every query and exploration adds up permanently.

```
raw/ (sources) → LLM compiles → wiki/ (.md) → Q&A → rich output → filed back → wiki grows
```

## Directory Structure

```
knowledge-base/
  raw/        # Source documents: articles, papers, repos, datasets, images
  wiki/       # LLM-maintained markdown articles (never edit manually)
  index/      # Auto-maintained summaries + backlinks (replaces RAG)
  outputs/    # Generated responses: .md, slides, images — filed back into wiki
```

## Core Patterns

### 1. Compilation

Instruct the LLM to incrementally compile `raw/` into `wiki/`:
- Summarize each source
- Extract concepts and write articles for them
- Link related articles with backlinks
- Maintain `index/INDEX.md` with one-line summaries of every article

**Key rule:** LLM writes all wiki content. Human only adds files to `raw/`.

### 2. Index as Lightweight RAG

Auto-maintain a flat index with brief summaries of every document. At ~100 articles / 400K words, the LLM reads the index first, then loads relevant articles — no vector DB needed.

```markdown
<!-- index/INDEX.md — maintained by LLM, never edit manually -->
- [transformer-attention.md](../wiki/transformer-attention.md) — Self-attention, multi-head variants, complexity
- [rlhf-overview.md](../wiki/rlhf-overview.md) — RLHF, reward modeling, PPO training loop
```

### 3. Q&A Workflow

Once the wiki reaches ~50 articles, run complex queries against it:

```
"Read index/INDEX.md, identify relevant articles for [question],
 read them, and write your answer to outputs/[topic].md"
```

### 4. Rich Output

Produce answers as artifacts, not terminal text:
- `.md` files for narrative answers
- Marp format (`---` slide dividers) for presentations
- Python/matplotlib for visualizations
- All viewable in Obsidian or any markdown reader

### 5. Feedback Loop

File valuable outputs back into the wiki:

```
outputs/my-query-result.md → wiki/derived/my-query-result.md
```

Each exploration enhances the knowledge base for future queries. Your curiosity compounds.

### 6. Health Checks

Run integrity audits periodically:

```
"Scan wiki/ for: inconsistent claims, missing data, broken backlinks,
 and recurring themes that deserve a new article. Write to outputs/health-check.md"
```

Use LLM suggestions for next questions to grow the wiki intentionally.

## When to Use

- Building a personal research knowledge base on any topic
- Managing a wiki that should grow with your queries over time
- Processing large batches of articles/papers into structured knowledge
- Any project where knowledge accumulation matters more than one-off answers

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Editing wiki files manually | Only add to `raw/` — let LLM recompile |
| Skipping the index file | Without `INDEX.md`, LLM can't navigate large wikis |
| Discarding outputs | File valuable outputs back into `wiki/derived/` |
| Jumping to RAG too early | Index + full reads works well up to ~500K words |
| Never running health checks | Wikis drift — audit integrity periodically |
| Asking for text answers | Always render to `.md` or a visual format |
