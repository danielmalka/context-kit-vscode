import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildLaunchCommand } from "../../src/domain/launchCommand";

describe("buildLaunchCommand", () => {
  it("builds claude slash invocation", () => {
    assert.equal(buildLaunchCommand("claude", "prd"), 'claude "/prd"');
    assert.match(buildLaunchCommand("claude", "fix", 'auth "bug"'), /claude "\/fix/);
  });
  it("builds grok and echo", () => {
    assert.equal(buildLaunchCommand("grok", "implement"), 'grok "/implement"');
    assert.match(buildLaunchCommand("echo", "clean"), /Context Kit launch: \/clean/);
  });
});
