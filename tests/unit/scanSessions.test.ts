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
