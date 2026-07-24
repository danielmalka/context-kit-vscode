import * as vscode from "vscode";
import * as path from "node:path";
import * as os from "node:os";
import { scanLibrary, scanWorkspaceHarness } from "../library/scan";
import { buildCoverageMatrix, coverageSummary } from "../observe/coverage";
import { defaultSkillRoots } from "../publish/deployRuntime";
import { escapeHtml, webviewBaseStyles } from "./webviewTheme";

export function openCoveragePanel(context: vscode.ExtensionContext, libraryRoot: string): void {
  const panel = vscode.window.createWebviewPanel(
    "contextKit.coverage",
    "Context Kit — Coverage",
    vscode.ViewColumn.Beside,
    { enableScripts: true },
  );

  const paint = () => {
    const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const lib = scanLibrary(libraryRoot);
    const ws = folder ? scanWorkspaceHarness(folder) : [];
    const roots = defaultSkillRoots(os.homedir());
    const runtimeRoots = [roots.claude, roots.grok, roots.agents];
    const rows = buildCoverageMatrix(lib, ws, runtimeRoots);
    const sum = coverageSummary(rows);

    const body = rows
      .slice(0, 200)
      .map(
        (r) => `<tr>
        <td><span class="badge">${escapeHtml(r.kind)}</span> ${escapeHtml(r.name)}</td>
        <td><span class="dot ${r.inLibrary ? "yes" : "no"}"></span>${r.inLibrary ? "yes" : "—"}</td>
        <td><span class="dot ${r.inWorkspace ? "yes" : "no"}"></span>${r.inWorkspace ? "yes" : "—"}</td>
        <td><span class="dot ${r.inRuntime ? "yes" : "no"}"></span>${r.inRuntime ? "yes" : "—"}</td>
      </tr>`,
      )
      .join("");

    panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';"/>
<style>${webviewBaseStyles()}</style>
</head>
<body>
  <h1>Coverage map</h1>
  <p class="sub">Library assets vs workspace <code>.harness</code> and user runtime skill roots.
    Workspace: ${folder ? `<code>${escapeHtml(folder)}</code>` : "<em>none open</em>"}</p>
  <div class="row">
    <span class="badge">library ${String(sum.total)}</span>
    <span class="badge">in workspace ${String(sum.inWorkspace)}</span>
    <span class="badge">in runtime ${String(sum.inRuntime)}</span>
    <span class="badge">library-only ${String(sum.libraryOnly)}</span>
    <button id="refresh" class="secondary">Refresh</button>
  </div>
  <table>
    <thead><tr><th>Asset</th><th>Library</th><th>Workspace</th><th>Runtime</th></tr></thead>
    <tbody>${body || `<tr><td colspan="4" class="empty">No library assets</td></tr>`}</tbody>
  </table>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('refresh').addEventListener('click', () => vscode.postMessage({ type: 'refresh' }));
  </script>
</body>
</html>`;
  };

  paint();
  panel.webview.onDidReceiveMessage(
    (raw: unknown) => {
      if (typeof raw !== "object" || raw === null) return;
      const m = raw as Record<string, unknown>;
      if (m.type === "refresh") paint();
    },
    undefined,
    context.subscriptions,
  );
  void path;
}
