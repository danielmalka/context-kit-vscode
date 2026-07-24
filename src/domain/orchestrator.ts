import { buildLaunchCommand, type LaunchCli } from "./launchCommand";

/** Hard cap for commands inside a single orchestration step. */
export const MAX_COMMANDS_PER_STEP = 3;

/** globalState key for saved orchestration presets. */
export const ORCH_PRESETS_STATE_KEY = "orchestrator.presets";

/** Select value for an unsaved empty pipeline. */
export const NEW_ORCH_SENTINEL = "__new__";

export interface OrchStep {
  id: string;
  cli: LaunchCli;
  /**
   * 1–3 slash command names without leading slash.
   * Legacy single `command` is normalized via {@link normalizeStep}.
   */
  commands: string[];
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

/** Named, reusable pipeline definition. */
export interface OrchPreset {
  id: string;
  name: string;
  steps: OrchStep[];
  updatedAt: string;
}

/** Collapse ordered steps into waves. Consecutive steps with the same non-empty
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

/**
 * Command names end up in a shell line, and they originate from library
 * filenames on disk and from presets persisted in globalState — neither is
 * trusted input. Anything outside this charset is dropped, not escaped.
 * Colon is allowed for the `plugin:skill` form.
 */
const COMMAND_NAME_RE = /^[A-Za-z0-9._:-]+$/;

/** Normalize and cap command list (1–3, no leading slash, no empties, slug-only). */
export function normalizeCommands(raw: readonly string[] | undefined): string[] {
  if (!raw?.length) return [];
  return raw
    .map((c) => c.replace(/^\//, "").trim())
    .filter((c) => COMMAND_NAME_RE.test(c))
    .slice(0, MAX_COMMANDS_PER_STEP);
}

/**
 * Accepts current shape (`commands`) or legacy single `command`.
 * Returns a clean step with 1–3 commands (may be empty if invalid).
 */
export function normalizeStep(
  raw: Partial<OrchStep> & { command?: string; id?: string; cli?: LaunchCli },
): OrchStep {
  const fromLegacy = raw.command ? [raw.command] : [];
  const commands = normalizeCommands(raw.commands?.length ? raw.commands : fromLegacy);
  return {
    id: raw.id || newStepId(),
    cli: raw.cli === "grok" || raw.cli === "echo" || raw.cli === "claude" ? raw.cli : "claude",
    commands,
    args: raw.args?.trim() || undefined,
    parallelGroup: raw.parallelGroup?.trim() || undefined,
  };
}

export function stepCommandsLabel(step: OrchStep): string {
  const cmds = normalizeCommands(step.commands);
  return cmds.length ? cmds.map((c) => `/${c}`).join(" + ") : "(empty)";
}

/**
 * Shell line for one step. Multiple commands run sequentially in the same
 * terminal via `&&` (args apply only to the first command).
 */
export function stepLaunchLine(step: OrchStep): string {
  const cmds = normalizeCommands(step.commands);
  if (!cmds.length) {
    return 'echo "Context Kit: empty orchestration step"';
  }
  return cmds
    .map((c, i) => buildLaunchCommand(step.cli, c, i === 0 ? (step.args ?? "") : ""))
    .join(" && ");
}

/**
 * Human-readable plan for the Output channel / webview.
 */
export function formatOrchestrationPlan(steps: OrchStep[]): string {
  const waves = planOrchestrationWaves(steps);
  const lines: string[] = [
    `Pipeline: ${String(steps.length)} step(s), ${String(waves.length)} wave(s)`,
  ];
  waves.forEach((w, wi) => {
    const mode = w.steps.length > 1 ? "parallel" : "sequential";
    lines.push(`Wave ${String(wi + 1)} (${mode}, group=${w.groupKey}):`);
    for (const s of w.steps) {
      const label = stepCommandsLabel(s);
      lines.push(`  - [${s.cli}] ${label}${s.args ? `  args="${s.args}"` : ""}`);
    }
  });
  return lines.join("\n");
}

export function newStepId(): string {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function newPresetId(): string {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Trim + length bounds for display names (not opaque hashes). */
export function validatePresetName(
  name: string,
): { ok: true; name: string } | { ok: false; error: string } {
  const n = name.trim().replace(/\s+/g, " ");
  if (!n) return { ok: false, error: "Name is required." };
  if (n.length > 64) return { ok: false, error: "Name must be at most 64 characters." };
  if (n === "New orchestration" || n === NEW_ORCH_SENTINEL) {
    return { ok: false, error: "Choose a different name." };
  }
  return { ok: true, name: n };
}

export function parsePresetStore(raw: unknown): OrchPreset[] {
  if (!raw || typeof raw !== "object") return [];
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { presets?: unknown }).presets)
      ? (raw as { presets: unknown[] }).presets
      : [];
  const out: OrchPreset[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name.trim() : "";
    const id = typeof o.id === "string" && o.id ? o.id : newPresetId();
    if (!name) continue;
    const stepsRaw = Array.isArray(o.steps) ? o.steps : [];
    const steps = stepsRaw
      .map((s) => normalizeStep((s ?? {}) as Partial<OrchStep> & { command?: string }))
      .filter((s) => s.commands.length > 0);
    out.push({
      id,
      name,
      steps,
      updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : new Date(0).toISOString(),
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export function findPreset(presets: OrchPreset[], id: string): OrchPreset | undefined {
  return presets.find((p) => p.id === id);
}

/**
 * Create or replace a named preset. Names are unique (case-insensitive).
 * Pass `id` to update an existing row; omit to insert.
 */
export function upsertPreset(
  presets: OrchPreset[],
  input: { id?: string; name: string; steps: OrchStep[] },
  now = new Date().toISOString(),
): { ok: true; presets: OrchPreset[]; preset: OrchPreset } | { ok: false; error: string } {
  const vn = validatePresetName(input.name);
  if (!vn.ok) return { ok: false, error: vn.error };

  const steps = input.steps.map((s) => normalizeStep(s)).filter((s) => s.commands.length > 0);
  if (!steps.length) {
    return { ok: false, error: "Add at least one step with a command before saving." };
  }

  const nameTaken = presets.some(
    (p) => p.name.toLowerCase() === vn.name.toLowerCase() && p.id !== input.id,
  );
  if (nameTaken) {
    return { ok: false, error: `A preset named "${vn.name}" already exists.` };
  }

  if (input.id) {
    const idx = presets.findIndex((p) => p.id === input.id);
    if (idx < 0) {
      return { ok: false, error: "Preset not found." };
    }
    const preset: OrchPreset = {
      id: input.id,
      name: vn.name,
      steps,
      updatedAt: now,
    };
    const next = [...presets];
    next[idx] = preset;
    return {
      ok: true,
      presets: next.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
      preset,
    };
  }

  const preset: OrchPreset = {
    id: newPresetId(),
    name: vn.name,
    steps,
    updatedAt: now,
  };
  return {
    ok: true,
    presets: [...presets, preset].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    ),
    preset,
  };
}

export function deletePreset(
  presets: OrchPreset[],
  id: string,
): { ok: true; presets: OrchPreset[] } | { ok: false; error: string } {
  if (!id || id === NEW_ORCH_SENTINEL) {
    return { ok: false, error: "Nothing to delete." };
  }
  const next = presets.filter((p) => p.id !== id);
  if (next.length === presets.length) {
    return { ok: false, error: "Preset not found." };
  }
  return { ok: true, presets: next };
}

/** Clone steps with fresh ids (when loading a preset into the editor). */
export function cloneSteps(steps: OrchStep[]): OrchStep[] {
  return steps.map((s) =>
    normalizeStep({
      ...s,
      id: newStepId(),
      commands: [...normalizeCommands(s.commands)],
    }),
  );
}
