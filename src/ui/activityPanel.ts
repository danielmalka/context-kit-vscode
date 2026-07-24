import * as vscode from "vscode";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs";
import { scanAllSessions } from "../observe/scanSessions";
import { sessionsFingerprint } from "../observe/fingerprint";
import { filterSessionsForDisplay } from "../observe/filterSessions";
import type { ActivitySession } from "../observe/types";
import { escapeHtml, webviewBaseStyles } from "./webviewTheme";

function formatAge(ms: number, now: number): string {
  const sec = Math.max(0, Math.floor((now - ms) / 1000));
  if (sec < 60) return `${String(sec)}s ago`;
  if (sec < 3600) return `${String(Math.floor(sec / 60))}m ago`;
  if (sec < 86400) return `${String(Math.floor(sec / 3600))}h ago`;
  return `${String(Math.floor(sec / 86400))}d ago`;
}

function renderSessions(
  sessions: ActivitySession[],
  now: number,
  onlyActive: boolean,
  hiddenCount: number,
): string {
  if (!sessions.length) {
    if (onlyActive && hiddenCount > 0) {
      return `<div class="empty">No <strong>active</strong> sessions right now.<br/>
        <span class="meta">${String(hiddenCount)} inactive hidden — use “Show inactive” to list them.</span></div>`;
    }
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

  /** Live tail (auto re-scan). */
  let live = true;
  /** Hide idle/done sessions by default. */
  let onlyActive = true;
  let lastFp = "";
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  const watchers: fs.FSWatcher[] = [];

  const home = os.homedir();
  const grokRoot = path.join(home, ".grok", "sessions");
  const claudeRoot = path.join(home, ".claude", "projects");

  const paint = (force = false) => {
    const now = Date.now();
    const all = scanAllSessions({
      grokSessionsRoot: grokRoot,
      claudeProjectsRoot: claudeRoot,
      nowMs: now,
      limit: 80,
    });
    const fp = sessionsFingerprint(all) + `|oa:${String(onlyActive)}`;
    if (!force && fp === lastFp) {
      const { visible, hiddenCount } = filterSessionsForDisplay(all, onlyActive);
      panel.webview.postMessage({
        type: "tick",
        at: now,
        count: visible.length,
        total: all.length,
        hidden: hiddenCount,
        live,
        onlyActive,
      });
      return;
    }
    lastFp = fp;
    const { visible, hiddenCount } = filterSessionsForDisplay(all, onlyActive);
    panel.webview.html = buildHtml(visible, now, live, onlyActive, all.length, hiddenCount);
  };

  const debounced = debounce(() => {
    paint(false);
  }, 400);

  const startWatch = () => {
    stopWatch();
    for (const dir of [grokRoot, claudeRoot]) {
      if (!fs.existsSync(dir)) continue;
      try {
        const w = fs.watch(dir, { recursive: true }, () => {
          if (live) debounced();
        });
        watchers.push(w);
      } catch {
        /* recursive watch may be unsupported */
      }
    }
    pollTimer = setInterval(() => {
      if (live) paint(false);
    }, 3000);
  };

  const stopWatch = () => {
    for (const w of watchers) {
      try {
        w.close();
      } catch {
        /* ignore */
      }
    }
    watchers.length = 0;
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = undefined;
    }
  };

  paint(true);
  startWatch();

  panel.webview.onDidReceiveMessage(
    (raw: unknown) => {
      if (typeof raw !== "object" || raw === null) return;
      const msg = raw as Record<string, unknown>;
      if (msg.type === "refresh") paint(true);
      if (msg.type === "live") {
        live = Boolean(msg.value);
        if (live) startWatch();
        else stopWatch();
        paint(true);
      }
      if (msg.type === "onlyActive") {
        onlyActive = Boolean(msg.value);
        paint(true);
      }
    },
    undefined,
    context.subscriptions,
  );

  panel.onDidDispose(() => {
    stopWatch();
  });
}

function debounce(fn: () => void, ms: number): () => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return () => {
    if (t) clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}

function buildHtml(
  sessions: ActivitySession[],
  now: number,
  live: boolean,
  onlyActive: boolean,
  total: number,
  hiddenCount: number,
): string {
  const meta =
    onlyActive && hiddenCount > 0
      ? `${String(sessions.length)} active · ${String(hiddenCount)} inactive hidden · ${new Date(now).toLocaleString()}`
      : `${String(total)} session(s) · ${new Date(now).toLocaleString()}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';"/>
<style>${webviewBaseStyles()}
.live-dot {
  display:inline-block; width:8px; height:8px; border-radius:50%;
  background: var(--muted); margin-right:6px; vertical-align: middle;
}
.live-dot.on { background: var(--ok); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ok) 25%, transparent); }
</style>
</head>
<body>
  <h1>Agent activity</h1>
  <p class="sub">Radar of Claude Code and Grok sessions (read-only).
    By default only <strong>active</strong> (recently busy) sessions are listed.
    <strong>Live tail</strong> re-scans when files change (and every 3s).</p>
  <div class="row">
    <button id="refresh">Refresh now</button>
    <button id="live" class="secondary">
      <span class="live-dot ${live ? "on" : ""}" id="livedot"></span>
      Live: <span id="livelabel">${live ? "ON" : "OFF"}</span>
    </button>
    <button id="filter" class="secondary">
      ${onlyActive ? "Show inactive" : "Hide inactive"}
    </button>
    <span class="meta" id="meta">${escapeHtml(meta)}</span>
  </div>
  <div id="list">${renderSessions(sessions, now, onlyActive, hiddenCount)}</div>
  <script>
    const vscode = acquireVsCodeApi();
    let live = ${live ? "true" : "false"};
    let onlyActive = ${onlyActive ? "true" : "false"};
    document.getElementById('refresh').addEventListener('click', () => vscode.postMessage({ type: 'refresh' }));
    document.getElementById('live').addEventListener('click', () => {
      live = !live;
      vscode.postMessage({ type: 'live', value: live });
    });
    document.getElementById('filter').addEventListener('click', () => {
      onlyActive = !onlyActive;
      vscode.postMessage({ type: 'onlyActive', value: onlyActive });
    });
    window.addEventListener('message', (e) => {
      const m = e.data;
      if (m && m.type === 'tick') {
        const el = document.getElementById('meta');
        if (!el) return;
        if (m.onlyActive && m.hidden > 0) {
          el.textContent = m.count + ' active · ' + m.hidden + ' inactive hidden · '
            + new Date(m.at).toLocaleString() + (m.live ? ' · live' : '');
        } else {
          el.textContent = m.total + ' session(s) · ' + new Date(m.at).toLocaleString()
            + (m.live ? ' · live' : '');
        }
      }
    });
  </script>
</body>
</html>`;
}
