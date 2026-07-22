import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { contentHash, normalizeContent } from "../../src/domain/hash";

describe("contentHash", () => {
  it("normalizes CRLF and trailing space", () => {
    const a = contentHash("hello\r\nworld  ");
    const b = contentHash("hello\nworld");
    assert.equal(a, b);
  });

  it("changes when body changes", () => {
    assert.notEqual(contentHash("a"), contentHash("b"));
  });
});

describe("normalizeContent", () => {
  it("ends with single newline", () => {
    assert.equal(normalizeContent("x"), "x\n");
  });
});
