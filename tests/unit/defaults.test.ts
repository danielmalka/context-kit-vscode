import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { factoryDefaultProfile, enabledProviders } from "../../src/profile/defaults";

describe("factoryDefaultProfile", () => {
  it("enables claude grok agents only", () => {
    const p = factoryDefaultProfile();
    assert.deepEqual(enabledProviders(p).sort(), ["agents", "claude", "grok"]);
    assert.equal(p.language, "ask");
    assert.equal(p.providers.gemini, false);
  });
});
