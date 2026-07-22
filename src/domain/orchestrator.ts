import { buildLaunchCommand, type LaunchCli } from "./launchCommand";

export interface OrchStep {
  id: string;
  cli: LaunchCli;
  /** Slash command name without leading slash */
  command: string;
  args?: string;
  /**
   * Steps sharing the same parallelGroup run in the same wave (concurrent terminals).
   * Empty/undefined = sequential singleton wave.
   */
  parallelGroup?: string;
}

export interface OrchWave {
  groupKey: string;
  steps: OrchStep[];
}

/**
 * Collapse ordered steps into waves. Consecutive steps with the same non-empty
 * parallelGroup form one wave; steps without a group are their own wave.
 */
export function planOrchestrationWaves(steps: OrchStep[]): OrchWave[] {
  const waves: OrchWave[] = [];
  let i = 0;
  while (i < steps.length) {
    const s = steps[i];
    const g = s.parallelGroup?.trim();
    if (!g) {
      waves.push({ groupKey: `seq:${s.id}`, steps: [s] });
      i += 1;
      continue;
    }
    const batch: OrchStep[] = [s];
    i += 1;
    while (i < steps.length && steps[i].parallelGroup?.trim() === g) {
      batch.push(steps[i]);
      i += 1;
    }
    waves.push({ groupKey: g, steps: batch });
  }
  return waves;
}

/** Shell line for one step (used when spawning a terminal). */
export function stepLaunchLine(step: OrchStep): string {
  return buildLaunchCommand(step.cli, step.command, step.args ?? "");
}

/**
 * Human-readable plan for the Output channel / webview.
 */
export function formatOrchestrationPlan(steps: OrchStep[]): string {
  const waves = planOrchestrationWaves(steps);
  const lines: string[] = [`Pipeline: ${steps.length} step(s), ${waves.length} wave(s)`];
  waves.forEach((w, wi) => {
    const mode = w.steps.length > 1 ? "parallel" : "sequential";
    lines.push(`Wave ${wi + 1} (${mode}, group=${w.groupKey}):`);
    for (const s of w.steps) {
      lines.push(`  - [${s.cli}] /${s.command}${s.args ? " " + s.args : ""}`);
    }
  });
  return lines.join("\n");
}

export function newStepId(): string {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
