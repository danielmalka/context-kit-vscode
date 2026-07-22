import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import {
  formatOrchestrationPlan,
  newStepId,
  planOrchestrationWaves,
  stepLaunchLine,
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

  const paint = () => {
    panel.webview.html = buildHtml(commands, steps);
  };
  paint();

  panel.webview.onDidReceiveMessage(
    async (msg) => {
      if (msg?.type === "add") {
        const cmd = String(msg.command || commands[0] || "prd");
        const cli = (msg.cli || "claude") as LaunchCli;
        const group = String(msg.group || "").trim() || undefined;
        const args = String(msg.args || "").trim() || undefined;
        steps.push({
          id: newStepId(),
          cli,
          command: cmd.replace(/^\//, ""),
          args,
          parallelGroup: group,
        });
        paint();
        return;
      }
      if (msg?.type === "remove" && typeof msg.id === "string") {
        steps = steps.filter((s) => s.id !== msg.id);
        paint();
        return;
      }
      if (msg?.type === "clear") {
        steps = [];
        paint();
        return;
      }
      if (msg?.type === "run") {
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
    `Run ${steps.length} step(s) in ${waves.length} wave(s)?`,
    { modal: true, detail: planText },
    "Run",
  );
  if (confirm !== "Run") return;

  for (let wi = 0; wi < waves.length; wi++) {
    const wave = waves[wi];
    log(`--- Wave ${wi + 1}/${waves.length} (${wave.steps.length > 1 ? "parallel" : "seq"}) ---`);
    if (wave.steps.length === 1) {
      const s = wave.steps[0];
      const line = stepLaunchLine(s);
      const term = vscode.window.createTerminal({
        name: `CK orch /${s.command}`,
        cwd,
      });
      term.show(wi === 0);
      term.sendText(line, true);
      log(`  terminal: ${line}`);
    } else {
      for (const s of wave.steps) {
        const line = stepLaunchLine(s);
        const term = vscode.window.createTerminal({
          name: `CK orch /${s.command}`,
          cwd,
        });
        term.show(false);
        term.sendText(line, true);
        log(`  parallel terminal: ${line}`);
      }
    }
    if (wi < waves.length - 1) {
      const next = await vscode.window.showInformationMessage(
        `Wave ${wi + 1} launched. Continue to wave ${wi + 2}?`,
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

function buildHtml(commands: string[], steps: OrchStep[]): string {
  const cmdOpts = commands
    .map((c) => `<option value="${escapeHtml(c)}">/${escapeHtml(c)}</option>`)
    .join("");
  const waves = planOrchestrationWaves(steps);
  const stepsHtml = steps.length
    ? steps
        .map(
          (s, i) => `<div class="card">
        <div class="card-title">#${i + 1}
          <span class="badge">${escapeHtml(s.cli)}</span>
          /${escapeHtml(s.command)}
          ${s.parallelGroup ? `<span class="badge">∥ ${escapeHtml(s.parallelGroup)}</span>` : ""}
        </div>
        <div class="meta">${s.args ? escapeHtml(s.args) : "—"}</div>
        <div class="actions"><button class="secondary rm" data-id="${escapeHtml(s.id)}">Remove</button></div>
      </div>`,
        )
        .join("")
    : `<div class="empty">No steps yet. Add slash commands below. Same parallel group name = same wave.</div>`;

  const planPreview = escapeHtml(formatOrchestrationPlan(steps));

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
pre.plan {
  background: color-mix(in srgb, var(--bg) 88%, var(--fg));
  border: 1px solid var(--border); border-radius: 8px;
  padding: 10px 12px; font-size: 0.82rem; overflow: auto;
}
</style>
</head>
<body>
  <h1>Orchestrator</h1>
  <p class="sub">Multi-CLI pipeline: sequential waves, optional parallel groups.
    Opens one terminal per step (parallel steps = multiple terminals).
    You confirm between waves. Not a full agent runtime — it only launches CLIs with slash commands.</p>

  <h2>Add step</h2>
  <div class="form">
    <label class="field">Command
      <select id="command">${cmdOpts}</select>
    </label>
    <label class="field">CLI
      <select id="cli">
        <option value="claude">claude</option>
        <option value="grok">grok</option>
        <option value="echo">echo (dry)</option>
      </select>
    </label>
    <label class="field full">Args (optional)
      <input id="args" placeholder="brief for /prd …"/>
    </label>
    <label class="field full">Parallel group (optional — same name runs together)
      <input id="group" placeholder="e.g. review-panel"/>
    </label>
  </div>
  <div class="row">
    <button id="add">Add step</button>
    <button class="secondary" id="clear">Clear all</button>
    <button id="run">Run pipeline</button>
  </div>

  <h2>Steps (${steps.length}) · waves (${waves.length})</h2>
  ${stepsHtml}
  <h2>Plan</h2>
  <pre class="plan">${planPreview || "(empty)"}</pre>

  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('add').addEventListener('click', () => {
      vscode.postMessage({
        type: 'add',
        command: document.getElementById('command').value,
        cli: document.getElementById('cli').value,
        args: document.getElementById('args').value,
        group: document.getElementById('group').value,
      });
    });
    document.getElementById('clear').addEventListener('click', () => vscode.postMessage({ type: 'clear' }));
    document.getElementById('run').addEventListener('click', () => vscode.postMessage({ type: 'run' }));
    document.querySelectorAll('.rm').forEach(btn => {
      btn.addEventListener('click', () => vscode.postMessage({ type: 'remove', id: btn.getAttribute('data-id') }));
    });
  </script>
</body>
</html>`;
}
