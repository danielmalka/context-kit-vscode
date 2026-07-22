import * as vscode from "vscode";
import * as path from "node:path";
import * as os from "node:os";
import { scanAllSessions } from "../observe/scanSessions";
import type { ActivitySession } from "../observe/types";
import { escapeHtml, webviewBaseStyles } from "./webviewTheme";

function formatAge(ms: number, now: number): string {
  const sec = Math.max(0, Math.floor((now - ms) / 1000));
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function renderSessions(sessions: ActivitySession[], now: number): string {
  if (!sessions.length) {
    return `<div class="empty">No Claude/Grok sessions found under default homes.<br/>
      <span class="meta">Checked ~/.claude/projects and ~/.grok/sessions</span></div>`;
  }
  return sessions
    .map((s) => {
      const kids =
        s.children
          ?.map(
            (c) =>
              `<div class="meta" style="margin-left:12px">↳ ${escapeHtml(c.label)} · ${formatAge(c.lastActivityMs, now)}</div>`,
          )
          .join("") ?? "";
      return `<div class="card">
        <div class="card-title">
          <span class="badge ${s.status === "running" ? "running" : ""}">${escapeHtml(s.provider)}</span>
          <span class="badge">${escapeHtml(s.status)}</span>
          ${escapeHtml(s.label)}
        </div>
        <div class="meta">${s.workspace ? escapeHtml(s.workspace) : "—"}</div>
        <div class="meta">${formatAge(s.lastActivityMs, now)}${s.detail ? " · " + escapeHtml(s.detail) : ""}</div>
        <div class="meta"><code>${escapeHtml(s.path)}</code></div>
        ${kids}
      </div>`;
    })
    .join("");
}

export function openActivityMapPanel(context: vscode.ExtensionContext): void {
  const panel = vscode.window.createWebviewPanel(
    "contextKit.activityMap",
    "Context Kit — Activity",
    vscode.ViewColumn.Beside,
    { enableScripts: true, retainContextWhenHidden: true },
  );

  const refresh = () => {
    const home = os.homedir();
    const now = Date.now();
    const sessions = scanAllSessions({
      grokSessionsRoot: path.join(home, ".grok", "sessions"),
      claudeProjectsRoot: path.join(home, ".claude", "projects"),
      nowMs: now,
      limit: 50,
    });
    panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';"/>
<style>${webviewBaseStyles()}</style>
</head>
<body>
  <h1>Agent activity</h1>
  <p class="sub">Radar of recent Claude Code and Grok sessions on this machine (read-only). Not a live debugger — refresh to re-scan.</p>
  <div class="row">
    <button id="refresh">Refresh</button>
    <span class="meta">${sessions.length} session(s) · ${new Date(now).toLocaleString()}</span>
  </div>
  ${renderSessions(sessions, now)}
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('refresh').addEventListener('click', () => vscode.postMessage({ type: 'refresh' }));
  </script>
</body>
</html>`;
  };

  refresh();
  panel.webview.onDidReceiveMessage(
    (msg) => {
      if (msg?.type === "refresh") refresh();
    },
    undefined,
    context.subscriptions,
  );
}
