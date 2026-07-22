import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseMarkdownAsset, nameFromPath } from "../../src/domain/parseAsset";

describe("parseMarkdownAsset", () => {
  it("reads frontmatter name and description", () => {
    const raw = `---
name: harness-mode
description: Use at start
---

# Harness Mode

Body
`;
    const p = parseMarkdownAsset(raw, "fallback");
    assert.equal(p.name, "harness-mode");
    assert.equal(p.description, "Use at start");
    assert.equal(p.title, "Harness Mode");
  });
});

describe("nameFromPath", () => {
  it("uses parent dir for SKILL.md", () => {
    assert.equal(nameFromPath("/lib/skills/foo/SKILL.md", "skill"), "foo");
  });
});
