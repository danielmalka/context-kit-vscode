import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { filterSessionsForDisplay, isActiveSession } from "../../src/observe/filterSessions";
import type { ActivitySession } from "../../src/observe/types";

function s(status: ActivitySession["status"], id: string): ActivitySession {
  return {
    id,
    provider: "claude",
    label: id,
    path: "/x",
    lastActivityMs: 1,
    status,
  };
}

describe("filterSessionsForDisplay", () => {
  it("treats only running as active", () => {
    assert.equal(isActiveSession(s("running", "a")), true);
    assert.equal(isActiveSession(s("idle", "b")), false);
    assert.equal(isActiveSession(s("done", "c")), false);
  });

  it("hides non-running by default filter", () => {
    const all = [s("running", "a"), s("idle", "b"), s("done", "c")];
    const { visible, hiddenCount } = filterSessionsForDisplay(all, true);
    assert.equal(visible.length, 1);
    assert.equal(visible[0].id, "a");
    assert.equal(hiddenCount, 2);
  });

  it("shows all when onlyActive is false", () => {
    const all = [s("running", "a"), s("idle", "b")];
    const { visible, hiddenCount } = filterSessionsForDisplay(all, false);
    assert.equal(visible.length, 2);
    assert.equal(hiddenCount, 0);
  });
});
