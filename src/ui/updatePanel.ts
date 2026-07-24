import * as vscode from "vscode";
import {
  applyLibraryUpdate,
  planLibraryUpdate,
  type DirtyResolution,
  type ClassifiedSeedAsset,
} from "../library/seedUpdate";
import { escapeHtml, webviewBaseStyles } from "./webviewTheme";

export function openUpdateLibraryPanel(
  context: vscode.ExtensionContext,
  libraryRoot: string,
  seedRoot: string,
  onDone: () => void | Promise<void>,
): void {
  const plan = planLibraryUpdate(libraryRoot, seedRoot);
  const panel = vscode.window.createWebviewPanel(
    "contextKit.updateLibrary",
    "Context Kit — Update library",
    vscode.ViewColumn.Active,
    { enableScripts: true, retainContextWhenHidden: true },
  );

  const dirty = plan.dirty;
  const choices = new Map<string, DirtyResolution>();
  for (const d of dirty) choices.set(d.name, "skip");

  const render = () => {
    const dirtyHtml = dirty.length
      ? dirty.map((d) => dirtyCard(d, choices.get(d.name) ?? "skip")).join("")
      : `<div class="empty">No dirty seed assets — clean updates only.</div>`;

    panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';"/>
<style>${webviewBaseStyles()}
.choice { display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
.choice label {
  display:flex; align-items:center; gap:4px;
  padding:4px 8px; border:1px solid var(--border); border-radius:4px; cursor:pointer;
}
.choice input { accent-color: var(--btn); }
.stat { font-variant-numeric: tabular-nums; }
</style>
</head>
<body>
  <h1>Update library from package seed</h1>
  <p class="sub">Package <code>${escapeHtml(plan.packageSeedVersion)}</code>
    · library <code>${escapeHtml(plan.librarySeedVersion ?? "none")}</code></p>
  <div class="row stat">
    <span class="badge">missing ${String(plan.missing.length)}</span>
    <span class="badge">clean ${String(plan.clean.length)}</span>
    <span class="badge">dirty ${String(plan.dirty.length)}</span>
    <span class="badge">user ${String(plan.userOwned.length)}</span>
  </div>
  <p class="sub">Clean and missing assets update automatically. Choose how to handle each <strong>edited</strong> seed asset.</p>
  <h2>Dirty assets</h2>
  ${dirtyHtml}
  <div class="row" style="margin-top:16px">
    <button id="apply">Apply update</button>
    <button class="secondary" id="cancel">Cancel</button>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    document.querySelectorAll('input[type=radio]').forEach(el => {
      el.addEventListener('change', () => {
        vscode.postMessage({ type: 'choice', name: el.name.replace(/^r-/, ''), value: el.value });
      });
    });
    document.getElementById('apply').addEventListener('click', () => vscode.postMessage({ type: 'apply' }));
    document.getElementById('cancel').addEventListener('click', () => vscode.postMessage({ type: 'cancel' }));
  </script>
</body>
</html>`;
  };

  render();

  panel.webview.onDidReceiveMessage(
    async (raw: unknown) => {
      if (typeof raw !== "object" || raw === null) return;
      const msg = raw as Record<string, unknown>;
      if (msg.type === "choice" && typeof msg.name === "string" && isDirtyResolution(msg.value)) {
        choices.set(msg.name, msg.value);
      }
      if (msg.type === "cancel") {
        panel.dispose();
        return;
      }
      if (msg.type === "apply") {
        const resMap: Record<string, DirtyResolution> = {};
        for (const [k, v] of choices) resMap[k] = v;
        const result = applyLibraryUpdate(libraryRoot, seedRoot, resMap);
        panel.dispose();
        vscode.window.showInformationMessage(
          `Context Kit: updated (applied ${String(result.applied.length)}, replaced ${String(result.replaced.length)}, keep-both ${String(result.keptBoth.length)}, skipped dirty ${String(result.skippedDirty.length)}).`,
        );
        await onDone();
      }
    },
    undefined,
    context.subscriptions,
  );
}

function isDirtyResolution(value: unknown): value is DirtyResolution {
  return value === "skip" || value === "replace" || value === "keep-both";
}

function dirtyCard(d: ClassifiedSeedAsset, selected: DirtyResolution): string {
  const opts: DirtyResolution[] = ["skip", "replace", "keep-both"];
  const labels: Record<DirtyResolution, string> = {
    skip: "Skip (keep mine)",
    replace: "Replace with seed",
    "keep-both": "Keep both (backup .user)",
  };
  const radios = opts
    .map(
      (o) =>
        `<label><input type="radio" name="r-${escapeHtml(d.name)}" value="${o}" ${
          o === selected ? "checked" : ""
        }/> ${labels[o]}</label>`,
    )
    .join("");
  return `<div class="card">
    <div class="card-title">${escapeHtml(d.name)} <span class="badge">${escapeHtml(d.kind)}</span></div>
    <div class="meta"><code>${escapeHtml(d.libraryRel)}</code></div>
    <div class="choice">${radios}</div>
  </div>`;
}
