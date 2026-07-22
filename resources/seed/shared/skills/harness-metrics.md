---
name: harness-metrics
description: Record flow-health metrics at the END of every delivered task. Trigger: task delivered (QA APPROVED and, when applicable, human review done), or when the user says "close the session" or "record the metrics".
---

# Harness Metrics

The old model measured human review time. It's dead — reviewing how long a human spent
tells you nothing about the system. The new model measures the health of the delivery
FLOW itself, one line per TASK, to find which stage of the pipeline needs to get more
resilient.

At the end of each delivered task, append ONE line to the project's `metrics/metrics.csv`:

```
data,projeto,task,tempo_total_min,retornos_qa,retornos_revisor,debitos_gerados,desvios_plano,observacao
```

- **data**: delivery date (YYYY-MM-DD)
- **projeto**: project name
- **task**: task ID (e.g. `TASK-001-02`) or `fix-<slug>` for /fix runs
- **tempo_total_min**: from task start to approved delivery — the full iteration
  (including QA back-and-forth), not human clock time
- **retornos_qa**: how many times the qa-reviewer returned NEEDS WORK before APPROVED
- **retornos_revisor**: how many times the human reviewer (Daniel) sent it back after QA
  already approved it — ask the human, this one the agent cannot see on its own
- **debitos_gerados**: count of new technical debts logged during the task (list the IDs
  in observacao)
- **desvios_plano**: count of deviations from the plan (scope/approach changes vs. what
  TASKS/TECHSPEC said; detail in observacao)
- **observacao**: free text — debt IDs, deviation detail, anything notable

Fill the line autonomously at the end of the task. Estimate-and-flag when unsure: append
"estimado" to observacao for any column you couldn't verify directly (e.g. retornos_revisor
in an autonomous run with no human available — the human corrects it later).

## How to read the columns

- **retornos_qa alto** -> the implementation gate is weak (agent ships things QA keeps
  bouncing; tighten /implement or the pre-QA checklist).
- **retornos_revisor alto** -> QA isn't catching what the human catches; calibrate the
  qa-reviewer against what Daniel flags.
- **debitos_gerados alto** -> structural rush; the team is cutting corners under time
  pressure, not a one-off.
- **desvios_plano alto** -> the spec is weak; improve `/prd` / `/techspec` so plans hold up
  during implementation.

Read these as trends across tasks, not single-line verdicts — one bad line is noise,
a rising column across several tasks is signal.

**NEVER record**: lines of code, number of PRs, tokens — volume metrics are forbidden.
