import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  scanClaudeSessions,
  scanGrokSessions,
  scanAllSessions,
} from "../../src/observe/scanSessions";

describe("scanSessions", () => {
  let tmp: string;

  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ck-sess-"));
    // Grok layout
    const gws = path.join(tmp, "grok", "%2Fhome%2Fdemo%2Fapp");
    const gsid = path.join(gws, "019f-session-id");
    fs.mkdirSync(gsid, { recursive: true });
    fs.writeFileSync(
      path.join(gsid, "events.jsonl"),
      JSON.stringify({ type: "phase", title: "Review" }) + "\n",
    );
    fs.writeFileSync(path.join(gsid, "summary.json"), JSON.stringify({ title: "demo review" }));

    // Claude layout
    const cproj = path.join(tmp, "claude", "-home-demo-app");
    const csid = "abc123session";
    fs.mkdirSync(cproj, { recursive: true });
    fs.writeFileSync(path.join(cproj, `${csid}.jsonl`), '{"type":"msg"}\n');
    fs.mkdirSync(path.join(cproj, csid, "subagents"), { recursive: true });
    fs.writeFileSync(path.join(cproj, csid, "subagents", "agent-reviewer.jsonl"), '{"ok":true}\n');
  });

  after(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("finds grok sessions with workspace decode", () => {
    const sessions = scanGrokSessions(path.join(tmp, "grok"), Date.now());
    assert.ok(sessions.length >= 1);
    assert.equal(sessions[0].provider, "grok");
    assert.ok(sessions[0].workspace?.includes("home"));
    assert.ok(sessions[0].detail?.includes("demo") || sessions[0].children?.length);
  });

  it("finds claude sessions with subagents", () => {
    const sessions = scanClaudeSessions(path.join(tmp, "claude"), Date.now());
    assert.ok(sessions.length >= 1);
    const withKids = sessions.find((s) => s.children && s.children.length > 0);
    assert.ok(withKids, "expected subagent child");
    assert.equal(withKids!.provider, "claude");
  });

  it("scanAllSessions merges and limits", () => {
    const all = scanAllSessions({
      grokSessionsRoot: path.join(tmp, "grok"),
      claudeProjectsRoot: path.join(tmp, "claude"),
      limit: 10,
    });
    assert.ok(all.some((s) => s.provider === "grok"));
    assert.ok(all.some((s) => s.provider === "claude"));
  });
});

/** Set an explicit mtime so status assertions never depend on the wall clock. */
function touch(p: string, ms: number): void {
  const d = new Date(ms);
  fs.utimesSync(p, d, d);
}

describe("scanGrokSessions edge cases", () => {
  const NOW = 1_700_000_000_000;
  let root: string;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "ck-grok-edge-"));

    // Entries at the sessions root that must be ignored.
    fs.writeFileSync(path.join(root, "stray.txt"), "not a workspace");
    fs.mkdirSync(path.join(root, "index.sqlite"));
    fs.mkdirSync(path.join(root, ".cache"));

    // Workspace with malformed on-disk JSON in every parsed file.
    const bad = path.join(root, "%2Fhome%2Fdemo%2Fbad");
    const badSid = path.join(bad, "sess-malformed");
    fs.mkdirSync(badSid, { recursive: true });
    fs.writeFileSync(path.join(badSid, "summary.json"), "{not json");
    fs.writeFileSync(path.join(badSid, "events.jsonl"), "{broken\n{alsobroken\n");
    fs.writeFileSync(path.join(bad, "loose-file.txt"), "ignored");
    fs.symlinkSync(path.join(bad, "missing-target"), path.join(bad, "dangling"));
    touch(path.join(badSid, "summary.json"), NOW);
    touch(path.join(badSid, "events.jsonl"), NOW);
    touch(badSid, NOW);

    // Workspace name that is not valid percent-encoding.
    const rawWs = path.join(root, "%E0%A4%A");
    fs.mkdirSync(path.join(rawWs, "sess-raw"), { recursive: true });
    touch(path.join(rawWs, "sess-raw"), NOW - 10 * 60 * 1000);

    // Three sessions with explicit ages to pin every status branch.
    const ages = path.join(root, "%2Fhome%2Fdemo%2Fages");
    for (const name of ["fresh", "stale", "old"]) {
      fs.mkdirSync(path.join(ages, name), { recursive: true });
    }
    for (const [name, ms] of [
      ["fresh", NOW],
      ["stale", NOW - 10 * 60 * 1000],
      ["old", NOW - 60 * 60 * 1000],
    ] as const) {
      touch(path.join(ages, name), ms);
    }
  });

  after(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("ignores files, sqlite dirs and dot-dirs at the sessions root", () => {
    const sessions = scanGrokSessions(root, NOW);
    const workspaces = new Set(sessions.map((s) => s.workspace));
    assert.ok(!workspaces.has("index.sqlite"));
    assert.ok(!workspaces.has(".cache"));
    assert.ok(!workspaces.has("stray.txt"));
  });

  it("keeps a session whose summary.json and events.jsonl are malformed", () => {
    const s = scanGrokSessions(root, NOW).find((x) => x.path.endsWith("sess-malformed"));
    assert.ok(s, "malformed session should still be listed");
    assert.equal(s.detail, undefined, "no title/phases can be derived from garbage");
    assert.equal(s.children, undefined);
    assert.equal(s.lastActivityMs, NOW);
  });

  it("skips non-directories and dangling symlinks inside a workspace", () => {
    const inBad = scanGrokSessions(root, NOW).filter((s) => s.workspace === "/home/demo/bad");
    assert.deepEqual(
      inBad.map((s) => path.basename(s.path)),
      ["sess-malformed"],
    );
  });

  it("falls back to the raw workspace name when it is not valid percent-encoding", () => {
    const s = scanGrokSessions(root, NOW).find((x) => path.basename(x.path) === "sess-raw");
    assert.ok(s);
    assert.equal(s.workspace, "%E0%A4%A");
  });

  it("maps session age to running / idle / done", () => {
    const byName = new Map(
      scanGrokSessions(root, NOW).map((s) => [path.basename(s.path), s.status]),
    );
    assert.equal(byName.get("fresh"), "running");
    assert.equal(byName.get("stale"), "idle");
    assert.equal(byName.get("old"), "done");
  });

  it("returns sessions sorted by most recent activity first", () => {
    const sessions = scanGrokSessions(root, NOW);
    const times = sessions.map((s) => s.lastActivityMs);
    assert.deepEqual(
      times,
      [...times].sort((a, b) => b - a),
    );
  });

  it("returns an empty list for a missing sessions root", () => {
    assert.deepEqual(scanGrokSessions(path.join(root, "nope"), NOW), []);
  });
});

describe("scanClaudeSessions edge cases", () => {
  const NOW = 1_700_000_000_000;
  let root: string;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "ck-claude-edge-"));
    fs.writeFileSync(path.join(root, "not-a-project.txt"), "ignored");

    const proj = path.join(root, "-home-demo-app");
    fs.mkdirSync(proj, { recursive: true });

    // Bare session jsonl with no folder twin.
    fs.writeFileSync(path.join(proj, "solo-session.jsonl"), '{"type":"msg"}\n');
    touch(path.join(proj, "solo-session.jsonl"), NOW - 10 * 60 * 1000);

    // Files that must never become sessions.
    fs.writeFileSync(path.join(proj, "agent-helper.jsonl"), "{}\n");
    fs.writeFileSync(path.join(proj, "notes.md"), "ignored");
    fs.symlinkSync(path.join(proj, "missing-target"), path.join(proj, "dangling"));

    // Session folder without a subagents dir.
    fs.mkdirSync(path.join(proj, "plain-folder"));
    touch(path.join(proj, "plain-folder"), NOW - 60 * 60 * 1000);

    // Session folder whose subagents dir holds a non-jsonl file.
    const kids = path.join(proj, "with-kids");
    fs.mkdirSync(path.join(kids, "subagents"), { recursive: true });
    fs.writeFileSync(path.join(kids, "subagents", "README.md"), "ignored");
    fs.writeFileSync(path.join(kids, "subagents", "agent-a.jsonl"), "{}\n");
    fs.symlinkSync(
      path.join(kids, "subagents", "missing-target"),
      path.join(kids, "subagents", "agent-dangling.jsonl"),
    );
    fs.writeFileSync(path.join(proj, "with-kids.jsonl"), "{}\n");
    touch(path.join(kids, "subagents", "agent-a.jsonl"), NOW);
    touch(path.join(proj, "with-kids.jsonl"), NOW);
    touch(kids, NOW - 60 * 60 * 1000);
  });

  after(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("lists a bare session jsonl that has no folder twin", () => {
    const s = scanClaudeSessions(root, NOW).find((x) => x.id.endsWith("solo-session"));
    assert.ok(s, "expected the folder-less jsonl session");
    assert.equal(s.workspace, "home/demo/app");
    assert.equal(s.lastActivityMs, NOW - 10 * 60 * 1000);
    assert.equal(s.status, "idle");
    assert.equal(s.children, undefined);
  });

  it("ignores agent-* jsonl, non-jsonl files, dangling symlinks and root files", () => {
    const ids = scanClaudeSessions(root, NOW).map((s) => s.id);
    assert.ok(!ids.some((id) => id.includes("agent-helper")));
    assert.ok(!ids.some((id) => id.includes("notes")));
    assert.ok(!ids.some((id) => id.includes("dangling")));
    assert.ok(!ids.some((id) => id.includes("not-a-project")));
  });

  it("reports a folder session without subagents as childless", () => {
    const s = scanClaudeSessions(root, NOW).find((x) => x.id.endsWith("plain-folder"));
    assert.ok(s);
    assert.equal(s.children, undefined);
    assert.equal(s.detail, undefined);
    assert.equal(s.status, "done");
  });

  it("counts only jsonl subagents and lifts session activity to the newest child", () => {
    const s = scanClaudeSessions(root, NOW).find((x) => x.id.endsWith(":with-kids"));
    assert.ok(s);
    assert.deepEqual(
      s.children?.map((c) => c.label),
      ["agent-a", "agent-dangling"],
      "README.md is not a subagent",
    );
    assert.equal(s.detail, "2 subagent(s)");
    // unreadable child still listed, with a zero timestamp instead of a crash
    assert.equal(s.children?.[1].lastActivityMs, 0);
    assert.equal(s.children?.[1].status, "done");
    assert.equal(s.lastActivityMs, NOW, "folder mtime is older than its subagent jsonl");
    assert.equal(s.status, "running");
  });

  it("returns an empty list for a missing projects root", () => {
    assert.deepEqual(scanClaudeSessions(path.join(root, "nope"), NOW), []);
  });
});

describe("scanAllSessions", () => {
  const NOW = 1_700_000_000_000;
  let root: string;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "ck-all-sess-"));
    const ws = path.join(root, "grok", "%2Fhome%2Fdemo%2Fapp");
    fs.mkdirSync(path.join(ws, "newer"), { recursive: true });
    fs.mkdirSync(path.join(ws, "older"), { recursive: true });
    touch(path.join(ws, "newer"), NOW);
    touch(path.join(ws, "older"), NOW - 60 * 60 * 1000);

    const proj = path.join(root, "claude", "-home-demo-app");
    fs.mkdirSync(proj, { recursive: true });
    fs.writeFileSync(path.join(proj, "mid.jsonl"), "{}\n");
    touch(path.join(proj, "mid.jsonl"), NOW - 10 * 60 * 1000);
  });

  after(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("returns nothing when no root is configured", () => {
    assert.deepEqual(scanAllSessions({}), []);
  });

  it("scans only the roots that are provided", () => {
    const grokOnly = scanAllSessions({ grokSessionsRoot: path.join(root, "grok"), nowMs: NOW });
    assert.ok(grokOnly.every((s) => s.provider === "grok"));
    assert.equal(grokOnly.length, 2);

    const claudeOnly = scanAllSessions({
      claudeProjectsRoot: path.join(root, "claude"),
      nowMs: NOW,
    });
    assert.deepEqual(
      claudeOnly.map((s) => s.provider),
      ["claude"],
    );
  });

  it("orders providers together by activity and truncates to the limit", () => {
    const all = scanAllSessions({
      grokSessionsRoot: path.join(root, "grok"),
      claudeProjectsRoot: path.join(root, "claude"),
      nowMs: NOW,
    });
    assert.deepEqual(
      all.map((s) => s.lastActivityMs),
      [NOW, NOW - 10 * 60 * 1000, NOW - 60 * 60 * 1000],
    );

    const capped = scanAllSessions({
      grokSessionsRoot: path.join(root, "grok"),
      claudeProjectsRoot: path.join(root, "claude"),
      nowMs: NOW,
      limit: 2,
    });
    assert.deepEqual(
      capped.map((s) => s.lastActivityMs),
      [NOW, NOW - 10 * 60 * 1000],
    );
  });
});
