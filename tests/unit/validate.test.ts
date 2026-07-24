import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isValidSlug, validateSkillMeta } from "../../src/domain/validate";

describe("isValidSlug", () => {
  it("accepts good slugs", () => {
    assert.equal(isValidSlug("harness-mode"), true);
    assert.equal(isValidSlug("a1"), true);
  });
  it("accepts a single lowercase letter", () => {
    assert.equal(isValidSlug("a"), true);
  });
  it("accepts the maximum length of 64 chars", () => {
    assert.equal(isValidSlug("a" + "b".repeat(62) + "c"), true);
  });
  it("rejects bad slugs", () => {
    assert.equal(isValidSlug("Bad"), false);
    assert.equal(isValidSlug("-x"), false);
    assert.equal(isValidSlug(""), false);
  });
  it("rejects a slug ending in a hyphen", () => {
    assert.equal(isValidSlug("bad-"), false);
  });
  it("rejects a slug over 64 chars", () => {
    assert.equal(isValidSlug("a" + "b".repeat(63) + "c"), false);
  });
  it("rejects slugs with underscores or spaces", () => {
    assert.equal(isValidSlug("bad_name"), false);
    assert.equal(isValidSlug("bad name"), false);
  });
});

describe("validateSkillMeta", () => {
  it("errors without name", () => {
    const issues = validateSkillMeta({ name: "" });
    assert.ok(issues.some((i) => i.level === "error" && i.message === "name is required"));
  });
  it("errors when name is not a valid slug", () => {
    const issues = validateSkillMeta({ name: "Not A Slug" });
    assert.ok(
      issues.some((i) => i.level === "error" && i.message.startsWith("name must be a slug")),
    );
  });
  it("warns without description", () => {
    const issues = validateSkillMeta({ name: "ok-skill" });
    assert.ok(issues.some((i) => i.level === "warning"));
  });
  it("warns when description is only whitespace", () => {
    const issues = validateSkillMeta({ name: "ok-skill", description: "   " });
    assert.ok(issues.some((i) => i.level === "warning"));
  });
  it("returns no issues for a valid name and description", () => {
    const issues = validateSkillMeta({ name: "ok-skill", description: "does a thing" });
    assert.deepEqual(issues, []);
  });
});
