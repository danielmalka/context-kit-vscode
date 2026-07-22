import * as fs from "node:fs";
import * as path from "node:path";
import type { ActivityProvider, ActivitySession, ActivityStatus } from "./types";

function mtimeMs(p: string): number {
  try {
    return fs.statSync(p).mtimeMs;
  } catch {
    return 0;
  }
}

function decodeGrokWorkspace(encoded: string): string {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

function statusFromAge(ageMs: number): ActivityStatus {
  if (ageMs < 2 * 60 * 1000) return "running";
  if (ageMs < 30 * 60 * 1000) return "idle";
  return "done";
}

/** Scan Grok session directories under ~/.grok/sessions (or custom root). */
export function scanGrokSessions(sessionsRoot: string, nowMs = Date.now()): ActivitySession[] {
  if (!fs.existsSync(sessionsRoot)) return [];
  const out: ActivitySession[] = [];

  for (const wsEnc of fs.readdirSync(sessionsRoot)) {
    const wsPath = path.join(sessionsRoot, wsEnc);
    if (!fs.statSync(wsPath).isDirectory()) continue;
    if (wsEnc.endsWith(".sqlite") || wsEnc.startsWith(".")) continue;

    for (const sid of fs.readdirSync(wsPath)) {
      const sessionPath = path.join(wsPath, sid);
      let st: fs.Stats;
      try {
        st = fs.statSync(sessionPath);
      } catch {
        continue;
      }
      if (!st.isDirectory()) continue;

      let last = st.mtimeMs;
      for (const f of ["events.jsonl", "chat_history.jsonl", "updates.jsonl", "summary.json"]) {
        const fp = path.join(sessionPath, f);
        if (fs.existsSync(fp)) last = Math.max(last, mtimeMs(fp));
      }

      let detail: string | undefined;
      const summaryPath = path.join(sessionPath, "summary.json");
      if (fs.existsSync(summaryPath)) {
        try {
          const s = JSON.parse(fs.readFileSync(summaryPath, "utf8")) as { title?: string };
          if (s.title) detail = s.title;
        } catch {
          /* ignore */
        }
      }

      const phases: string[] = [];
      const eventsPath = path.join(sessionPath, "events.jsonl");
      if (fs.existsSync(eventsPath)) {
        try {
          const lines = fs
            .readFileSync(eventsPath, "utf8")
            .split(/\r?\n/)
            .filter(Boolean)
            .slice(-30);
          for (const line of lines) {
            const ev = JSON.parse(line) as { type?: string; title?: string; phase?: string };
            if (ev.type === "phase" || ev.phase) phases.push(String(ev.title ?? ev.phase));
          }
        } catch {
          /* ignore partial jsonl */
        }
      }

      const children: ActivitySession[] = phases.slice(-5).map((p, i) => ({
        id: `${sid}:phase:${i}`,
        provider: "grok" as ActivityProvider,
        label: p,
        path: sessionPath,
        lastActivityMs: last,
        status: "unknown" as ActivityStatus,
      }));

      out.push({
        id: `grok:${wsEnc}:${sid}`,
        provider: "grok",
        label: sid.slice(0, 8) + "…",
        workspace: decodeGrokWorkspace(wsEnc),
        path: sessionPath,
        lastActivityMs: last,
        status: statusFromAge(nowMs - last),
        detail: detail ?? (phases.length ? `phases: ${phases.slice(-3).join(" → ")}` : undefined),
        children: children.length ? children : undefined,
      });
    }
  }

  return out.sort((a, b) => b.lastActivityMs - a.lastActivityMs);
}

/** Scan Claude Code project session jsonl / subagent folders. */
export function scanClaudeSessions(projectsRoot: string, nowMs = Date.now()): ActivitySession[] {
  if (!fs.existsSync(projectsRoot)) return [];
  const out: ActivitySession[] = [];

  for (const proj of fs.readdirSync(projectsRoot)) {
    const projPath = path.join(projectsRoot, proj);
    if (!fs.statSync(projPath).isDirectory()) continue;

    for (const ent of fs.readdirSync(projPath)) {
      const full = path.join(projPath, ent);
      let st: fs.Stats;
      try {
        st = fs.statSync(full);
      } catch {
        continue;
      }

      // session folder with subagents
      if (st.isDirectory()) {
        const subDir = path.join(full, "subagents");
        const children: ActivitySession[] = [];
        let last = st.mtimeMs;
        if (fs.existsSync(subDir)) {
          for (const sa of fs.readdirSync(subDir)) {
            if (!sa.endsWith(".jsonl")) continue;
            const saPath = path.join(subDir, sa);
            const saM = mtimeMs(saPath);
            last = Math.max(last, saM);
            children.push({
              id: `claude:${proj}:${ent}:${sa}`,
              provider: "claude",
              label: sa.replace(/\.jsonl$/, "").slice(0, 24),
              path: saPath,
              lastActivityMs: saM,
              status: statusFromAge(nowMs - saM),
            });
          }
        }
        const sessionJsonl = full + ".jsonl";
        if (fs.existsSync(sessionJsonl)) last = Math.max(last, mtimeMs(sessionJsonl));

        out.push({
          id: `claude:${proj}:${ent}`,
          provider: "claude",
          label: ent.slice(0, 8) + "…",
          workspace: proj.replace(/^-/, "").replace(/-/g, "/"),
          path: full,
          lastActivityMs: last,
          status: statusFromAge(nowMs - last),
          detail: children.length ? `${children.length} subagent(s)` : undefined,
          children: children.length ? children : undefined,
        });
        continue;
      }

      // top-level session jsonl without folder
      if (st.isFile() && ent.endsWith(".jsonl") && !ent.includes("agent-")) {
        const id = ent.replace(/\.jsonl$/, "");
        const folderTwin = path.join(projPath, id);
        if (fs.existsSync(folderTwin) && fs.statSync(folderTwin).isDirectory()) continue;
        const last = st.mtimeMs;
        out.push({
          id: `claude:${proj}:${id}`,
          provider: "claude",
          label: id.slice(0, 8) + "…",
          workspace: proj.replace(/^-/, "").replace(/-/g, "/"),
          path: full,
          lastActivityMs: last,
          status: statusFromAge(nowMs - last),
        });
      }
    }
  }

  return out.sort((a, b) => b.lastActivityMs - a.lastActivityMs);
}

export function scanAllSessions(opts: {
  grokSessionsRoot?: string;
  claudeProjectsRoot?: string;
  nowMs?: number;
  limit?: number;
}): ActivitySession[] {
  const now = opts.nowMs ?? Date.now();
  const limit = opts.limit ?? 40;
  const all = [
    ...(opts.grokSessionsRoot ? scanGrokSessions(opts.grokSessionsRoot, now) : []),
    ...(opts.claudeProjectsRoot ? scanClaudeSessions(opts.claudeProjectsRoot, now) : []),
  ].sort((a, b) => b.lastActivityMs - a.lastActivityMs);
  return all.slice(0, limit);
}
