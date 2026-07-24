import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import {
  NEW_ORCH_SENTINEL,
  ORCH_PRESETS_STATE_KEY,
  cloneSteps,
  deletePreset,
  findPreset,
  formatOrchestrationPlan,
  newStepId,
  normalizeCommands,
  parsePresetStore,
  planOrchestrationWaves,
  stepCommandsLabel,
  stepLaunchLine,
  upsertPreset,
  type OrchPreset,
  type OrchStep,
} from "../domain/orchestrator";
import type { LaunchCli } from "../domain/launchCommand";
import { escapeHtml, webviewBaseStyles } from "./webviewTheme";
import { getOutput, log } from "../output";

export function openOrchestratorPanel(context: vscode.ExtensionContext, libraryRoot: string): void {
  const commands = listLibraryCommands(libraryRoot);
  const panel = vscode.window.createWebviewPanel(
    "contextKit.orchestrator",
    "Context Kit — Orchestrator",
    vscode.ViewColumn.Active,
    { enableScripts: true, retainContextWhenHidden: true },
  );

  let steps: OrchStep[] = [];
  let presets: OrchPreset[] = parsePresetStore(context.globalState.get(ORCH_PRESETS_STATE_KEY));
  let selectedPresetId: string = NEW_ORCH_SENTINEL;
  /** Display name of the loaded preset (for Update). */
  let selectedPresetName = "";

  const persist = async () => {
    await context.globalState.update(ORCH_PRESETS_STATE_KEY, presets);
  };

  const paint = () => {
    panel.webview.html = buildHtml(commands, steps, presets, selectedPresetId, selectedPresetName);
  };
  paint();

  panel.webview.onDidReceiveMessage(
    async (raw: unknown) => {
      if (typeof raw !== "object" || raw === null) return;
      const msg = raw as Record<string, unknown>;
      if (msg.type === "add") {
        const cmdList = normalizeCommands([
          typeof msg.command1 === "string" ? msg.command1 : "",
          typeof msg.command2 === "string" ? msg.command2 : "",
          typeof msg.command3 === "string" ? msg.command3 : "",
        ]);
        if (!cmdList.length) {
          vscode.window.showWarningMessage("Pick at least one command for the step.");
          return;
        }
        const cli: LaunchCli = msg.cli === "grok" || msg.cli === "echo" ? msg.cli : "claude";
        const group = (typeof msg.group === "string" ? msg.group : "").trim() || undefined;
        const args = (typeof msg.args === "string" ? msg.args : "").trim() || undefined;
        steps.push({
          id: newStepId(),
          cli,
          commands: cmdList,
          args,
          parallelGroup: group,
        });
        paint();
        return;
      }
      if (msg.type === "remove" && typeof msg.id === "string") {
        steps = steps.filter((s) => s.id !== msg.id);
        paint();
        return;
      }
      if (msg.type === "clear") {
        steps = [];
        paint();
        return;
      }
      if (msg.type === "new") {
        selectedPresetId = NEW_ORCH_SENTINEL;
        selectedPresetName = "";
        steps = [];
        paint();
        return;
      }
      if (msg.type === "selectPreset" && typeof msg.id === "string") {
        if (msg.id === NEW_ORCH_SENTINEL) {
          selectedPresetId = NEW_ORCH_SENTINEL;
          selectedPresetName = "";
          steps = [];
          paint();
          return;
        }
        const p = findPreset(presets, msg.id);
        if (!p) {
          vscode.window.showWarningMessage("Saved orchestration not found.");
          paint();
          return;
        }
        selectedPresetId = p.id;
        selectedPresetName = p.name;
        steps = cloneSteps(p.steps);
        paint();
        return;
      }
      if (msg.type === "save") {
        if (!steps.length) {
          vscode.window.showWarningMessage("Add at least one step before saving.");
          return;
        }
        const name = await vscode.window.showInputBox({
          title: "Save orchestration",
          prompt: "Name for this pipeline (easy to find later)",
          placeHolder: "e.g. PRD → implement → review",
          value: selectedPresetName || "",
          validateInput: (v) => {
            const t = v.trim();
            if (!t) return "Name is required";
            if (t.length > 64) return "Max 64 characters";
            return null;
          },
        });
        if (name === undefined) return;
        const result = upsertPreset(presets, { name, steps });
        if (!result.ok) {
          vscode.window.showErrorMessage(result.error);
          return;
        }
        presets = result.presets;
        selectedPresetId = result.preset.id;
        selectedPresetName = result.preset.name;
        await persist();
        vscode.window.showInformationMessage(`Saved orchestration “${result.preset.name}”.`);
        paint();
        return;
      }
      if (msg.type === "update") {
        if (selectedPresetId === NEW_ORCH_SENTINEL) {
          vscode.window.showWarningMessage("Nothing to update — use Save for a new orchestration.");
          return;
        }
        if (!steps.length) {
          vscode.window.showWarningMessage("Add at least one step before updating.");
          return;
        }
        const existing = findPreset(presets, selectedPresetId);
        const name = existing?.name || selectedPresetName;
        const result = upsertPreset(presets, {
          id: selectedPresetId,
          name,
          steps,
        });
        if (!result.ok) {
          vscode.window.showErrorMessage(result.error);
          return;
        }
        presets = result.presets;
        selectedPresetId = result.preset.id;
        selectedPresetName = result.preset.name;
        await persist();
        vscode.window.showInformationMessage(`Updated orchestration “${result.preset.name}”.`);
        paint();
        return;
      }
      if (msg.type === "delete") {
        if (selectedPresetId === NEW_ORCH_SENTINEL) return;
        const existing = findPreset(presets, selectedPresetId);
        const label = existing?.name || "this orchestration";
        const confirm = await vscode.window.showWarningMessage(
          `Delete saved orchestration “${label}”?`,
          { modal: true },
          "Delete",
        );
        if (confirm !== "Delete") return;
        const result = deletePreset(presets, selectedPresetId);
        if (!result.ok) {
          vscode.window.showErrorMessage(result.error);
          return;
        }
        presets = result.presets;
        selectedPresetId = NEW_ORCH_SENTINEL;
        selectedPresetName = "";
        steps = [];
        await persist();
        vscode.window.showInformationMessage("Orchestration deleted.");
        paint();
        return;
      }
      if (msg.type === "run") {
        if (!steps.length) {
          vscode.window.showWarningMessage("Add at least one step.");
          return;
        }
        await runPipeline(steps);
      }
    },
    undefined,
    context.subscriptions,
  );
}

function listLibraryCommands(libraryRoot: string): string[] {
  const dir = path.join(libraryRoot, "commands");
  if (!fs.existsSync(dir)) {
    return ["prd", "implement", "fix", "document", "security-check", "clean"];
  }
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/i, ""))
    .sort();
}

async function runPipeline(steps: OrchStep[]): Promise<void> {
  const waves = planOrchestrationWaves(steps);
  const planText = formatOrchestrationPlan(steps);
  getOutput().show(true);
  log("=== Orchestrator ===");
  log(planText);

  const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const confirm = await vscode.window.showInformationMessage(
    `Run ${String(steps.length)} step(s) in ${String(waves.length)} wave(s)?`,
    { modal: true, detail: planText },
    "Run",
  );
  if (confirm !== "Run") return;

  for (let wi = 0; wi < waves.length; wi++) {
    const wave = waves[wi];
    log(
      `--- Wave ${String(wi + 1)}/${String(waves.length)} (${wave.steps.length > 1 ? "parallel" : "seq"}) ---`,
    );
    if (wave.steps.length === 1) {
      const s = wave.steps[0];
      const line = stepLaunchLine(s);
      const term = vscode.window.createTerminal({
        name: `CK orch ${stepCommandsLabel(s)}`.slice(0, 48),
        cwd,
      });
      term.show(wi === 0);
      term.sendText(line, true);
      log(`  terminal: ${line}`);
    } else {
      for (const s of wave.steps) {
        const line = stepLaunchLine(s);
        const term = vscode.window.createTerminal({
          name: `CK orch ${stepCommandsLabel(s)}`.slice(0, 48),
          cwd,
        });
        term.show(false);
        term.sendText(line, true);
        log(`  parallel terminal: ${line}`);
      }
    }
    if (wi < waves.length - 1) {
      const next = await vscode.window.showInformationMessage(
        `Wave ${String(wi + 1)} launched. Continue to wave ${String(wi + 2)}?`,
        "Continue",
        "Stop",
      );
      if (next !== "Continue") {
        log("Orchestrator stopped by user between waves.");
        return;
      }
    }
  }
  vscode.window.showInformationMessage("Context Kit: orchestration waves launched.");
}

function cmdSelectHtml(commands: string[], id: string, required: boolean): string {
  const empty = required ? "" : `<option value="">— optional —</option>`;
  const opts = commands
    .map((c) => `<option value="${escapeHtml(c)}">/${escapeHtml(c)}</option>`)
    .join("");
  return `<select id="${escapeHtml(id)}">${empty}${opts}</select>`;
}

function buildHtml(
  commands: string[],
  steps: OrchStep[],
  presets: OrchPreset[],
  selectedPresetId: string,
  selectedPresetName: string,
): string {
  const isNew = selectedPresetId === NEW_ORCH_SENTINEL;
  const presetOpts = [
    `<option value="${NEW_ORCH_SENTINEL}"${isNew ? " selected" : ""}>New orchestration</option>`,
    ...presets.map(
      (p) =>
        `<option value="${escapeHtml(p.id)}"${p.id === selectedPresetId ? " selected" : ""}>${escapeHtml(p.name)}</option>`,
    ),
  ].join("");

  const waves = planOrchestrationWaves(steps);
  const stepsHtml = steps.length
    ? steps
        .map(
          (s, i) => `<div class="card">
        <div class="card-title">#${String(i + 1)}
          <span class="badge">${escapeHtml(s.cli)}</span>
          ${escapeHtml(stepCommandsLabel(s))}
          ${s.parallelGroup ? `<span class="badge">∥ ${escapeHtml(s.parallelGroup)}</span>` : ""}
        </div>
        <div class="meta">${s.args ? escapeHtml(s.args) : "—"}</div>
        <div class="actions"><button class="secondary rm" data-id="${escapeHtml(s.id)}">Remove</button></div>
      </div>`,
        )
        .join("")
    : `<div class="empty">No steps yet. Add slash commands below (up to 3 per step). Same parallel group name = same wave.</div>`;

  const planPreview = escapeHtml(formatOrchestrationPlan(steps));
  const saveBtn = isNew
    ? `<button id="save" ${steps.length ? "" : "disabled"}>Save</button>`
    : `<button id="update" ${steps.length ? "" : "disabled"}>Update</button>
       <button class="secondary" id="delete">Delete</button>`;
  const loadedHint = isNew
    ? "Unsaved draft"
    : `Editing: <strong>${escapeHtml(selectedPresetName || "preset")}</strong>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';"/>
<style>${webviewBaseStyles()}
label.field { display:flex; flex-direction:column; gap:4px; font-size:0.85rem; color: var(--muted); }
input, select {
  background: var(--input-bg); color: var(--input-fg);
  border: 1px solid var(--border); border-radius: 4px; padding: 6px 8px; font: inherit;
}
.form { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
.form .full { grid-column: 1 / -1; }
.form.cmds { grid-template-columns: 1fr 1fr 1fr; }
pre.plan {
  background: color-mix(in srgb, var(--bg) 88%, var(--fg));
  border: 1px solid var(--border); border-radius: 8px;
  padding: 10px 12px; font-size: 0.82rem; overflow: auto;
}
.toolbar {
  display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-end;
  margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid var(--border);
}
.toolbar .grow { flex: 1 1 200px; min-width: 160px; }
.hint { font-size: 0.82rem; color: var(--muted); margin: 0 0 12px; }
.empty { color: var(--muted); font-size: 0.9rem; padding: 8px 0; }
</style>
</head>
<body>
  <h1>Orchestrator</h1>
  <p class="sub">Multi-CLI pipeline: sequential waves, optional parallel groups.
    Each step can run up to 3 slash commands in one terminal (chained with <code>&amp;&amp;</code>).
    You confirm between waves. Saved orchestrations live in extension storage (named, not hashes).</p>

  <div class="toolbar">
    <label class="field grow">Saved orchestration
      <select id="preset">${presetOpts}</select>
    </label>
    <button class="secondary" id="new">New orchestration</button>
    ${saveBtn}
  </div>
  <p class="hint">${loadedHint}</p>

  <h2>Add step</h2>
  <div class="form cmds">
    <label class="field">Command 1
      ${cmdSelectHtml(commands, "command1", true)}
    </label>
    <label class="field">Command 2
      ${cmdSelectHtml(commands, "command2", false)}
    </label>
    <label class="field">Command 3
      ${cmdSelectHtml(commands, "command3", false)}
    </label>
  </div>
  <div class="form">
    <label class="field">CLI
      <select id="cli">
        <option value="claude">claude</option>
        <option value="grok">grok</option>
        <option value="echo">echo (dry)</option>
      </select>
    </label>
    <label class="field">Args (optional, first command only)
      <input id="args" placeholder="brief for /prd …"/>
    </label>
    <label class="field full">Parallel group (optional — same name runs together)
      <input id="group" placeholder="e.g. review-panel"/>
    </label>
  </div>
  <div class="row">
    <button id="add">Add step</button>
    <button class="secondary" id="clear">Clear steps</button>
    <button id="run">Run pipeline</button>
  </div>

  <h2>Steps (${String(steps.length)}) · waves (${String(waves.length)})</h2>
  ${stepsHtml}
  <h2>Plan</h2>
  <pre class="plan">${planPreview || "(empty)"}</pre>

  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('add').addEventListener('click', () => {
      vscode.postMessage({
        type: 'add',
        command1: document.getElementById('command1').value,
        command2: document.getElementById('command2').value,
        command3: document.getElementById('command3').value,
        cli: document.getElementById('cli').value,
        args: document.getElementById('args').value,
        group: document.getElementById('group').value,
      });
    });
    document.getElementById('clear').addEventListener('click', () => vscode.postMessage({ type: 'clear' }));
    document.getElementById('run').addEventListener('click', () => vscode.postMessage({ type: 'run' }));
    document.getElementById('new').addEventListener('click', () => vscode.postMessage({ type: 'new' }));
    document.getElementById('preset').addEventListener('change', (e) => {
      vscode.postMessage({ type: 'selectPreset', id: e.target.value });
    });
    const saveEl = document.getElementById('save');
    if (saveEl) saveEl.addEventListener('click', () => vscode.postMessage({ type: 'save' }));
    const updateEl = document.getElementById('update');
    if (updateEl) updateEl.addEventListener('click', () => vscode.postMessage({ type: 'update' }));
    const deleteEl = document.getElementById('delete');
    if (deleteEl) deleteEl.addEventListener('click', () => vscode.postMessage({ type: 'delete' }));
    document.querySelectorAll('.rm').forEach(btn => {
      btn.addEventListener('click', () => vscode.postMessage({ type: 'remove', id: btn.getAttribute('data-id') }));
    });
  </script>
</body>
</html>`;
}
