import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatOrchestrationPlan,
  planOrchestrationWaves,
  stepLaunchLine,
  type OrchStep,
} from "../../src/domain/orchestrator";

describe("orchestrator", () => {
  it("puts sequential steps in separate waves", () => {
    const steps: OrchStep[] = [
      { id: "1", cli: "claude", command: "prd" },
      { id: "2", cli: "claude", command: "techspec" },
    ];
    const waves = planOrchestrationWaves(steps);
    assert.equal(waves.length, 2);
    assert.equal(waves[0].steps[0].command, "prd");
  });

  it("groups consecutive parallelGroup into one wave", () => {
    const steps: OrchStep[] = [
      { id: "1", cli: "claude", command: "security-check", parallelGroup: "panel" },
      { id: "2", cli: "grok", command: "document", parallelGroup: "panel" },
      { id: "3", cli: "echo", command: "clean" },
    ];
    const waves = planOrchestrationWaves(steps);
    assert.equal(waves.length, 2);
    assert.equal(waves[0].steps.length, 2);
    assert.equal(waves[1].steps[0].command, "clean");
  });

  it("builds launch lines via stepLaunchLine", () => {
    assert.equal(
      stepLaunchLine({ id: "1", cli: "echo", command: "prd" }),
      'echo "Context Kit launch: /prd"',
    );
  });

  it("formats a readable plan", () => {
    const text = formatOrchestrationPlan([
      { id: "1", cli: "claude", command: "implement", args: "task 1" },
    ]);
    assert.match(text, /Wave 1/);
    assert.match(text, /implement/);
  });
});
