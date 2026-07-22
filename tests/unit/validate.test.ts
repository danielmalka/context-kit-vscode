import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isValidSlug, validateSkillMeta } from "../../src/domain/validate";

describe("isValidSlug", () => {
  it("accepts good slugs", () => {
    assert.equal(isValidSlug("harness-mode"), true);
    assert.equal(isValidSlug("a1"), true);
  });
  it("rejects bad slugs", () => {
    assert.equal(isValidSlug("Bad"), false);
    assert.equal(isValidSlug("-x"), false);
    assert.equal(isValidSlug(""), false);
  });
});

describe("validateSkillMeta", () => {
  it("errors without name", () => {
    const issues = validateSkillMeta({ name: "" });
    assert.ok(issues.some((i) => i.level === "error"));
  });
  it("warns without description", () => {
    const issues = validateSkillMeta({ name: "ok-skill" });
    assert.ok(issues.some((i) => i.level === "warning"));
  });
});
