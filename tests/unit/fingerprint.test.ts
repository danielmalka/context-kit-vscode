import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sessionsFingerprint } from "../../src/observe/fingerprint";
import type { ActivitySession } from "../../src/observe/types";

describe("sessionsFingerprint", () => {
  it("changes when lastActivity changes", () => {
    const a: ActivitySession[] = [
      {
        id: "1",
        provider: "grok",
        label: "x",
        path: "/tmp",
        lastActivityMs: 1,
        status: "idle",
      },
    ];
    const b = [{ ...a[0], lastActivityMs: 2 }];
    assert.notEqual(sessionsFingerprint(a), sessionsFingerprint(b));
  });
});
