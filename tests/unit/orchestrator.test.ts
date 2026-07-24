import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_COMMANDS_PER_STEP,
  cloneSteps,
  deletePreset,
  formatOrchestrationPlan,
  normalizeCommands,
  normalizeStep,
  parsePresetStore,
  planOrchestrationWaves,
  stepCommandsLabel,
  stepLaunchLine,
  upsertPreset,
  validatePresetName,
  type OrchStep,
} from "../../src/domain/orchestrator";

describe("orchestrator", () => {
  it("puts sequential steps in separate waves", () => {
    const steps: OrchStep[] = [
      { id: "1", cli: "claude", commands: ["prd"] },
      { id: "2", cli: "claude", commands: ["techspec"] },
    ];
    const waves = planOrchestrationWaves(steps);
    assert.equal(waves.length, 2);
    assert.equal(waves[0].steps[0].commands[0], "prd");
  });

  it("groups consecutive parallelGroup into one wave", () => {
    const steps: OrchStep[] = [
      { id: "1", cli: "claude", commands: ["security-check"], parallelGroup: "panel" },
      { id: "2", cli: "grok", commands: ["document"], parallelGroup: "panel" },
      { id: "3", cli: "echo", commands: ["clean"] },
    ];
    const waves = planOrchestrationWaves(steps);
    assert.equal(waves.length, 2);
    assert.equal(waves[0].steps.length, 2);
    assert.equal(waves[1].steps[0].commands[0], "clean");
  });

  it("builds launch lines via stepLaunchLine", () => {
    assert.equal(
      stepLaunchLine({ id: "1", cli: "echo", commands: ["prd"] }),
      "echo 'Context Kit launch: /prd'",
    );
  });

  it("chains up to 3 commands with && (args on first only)", () => {
    const line = stepLaunchLine({
      id: "1",
      cli: "echo",
      commands: ["prd", "implement", "review"],
      args: "my brief",
    });
    assert.match(line, /\/prd my brief/);
    assert.match(line, /&&/);
    assert.match(line, /\/implement/);
    assert.match(line, /\/review/);
    // args attach to the first command only, never to the later ones
    assert.ok(line.includes("my brief"), "args must reach the line");
    assert.equal(line.indexOf("my brief"), line.lastIndexOf("my brief"), "args must appear once");
    assert.ok(line.indexOf("my brief") < line.indexOf("implement"));
  });

  it("caps commands at MAX_COMMANDS_PER_STEP", () => {
    assert.equal(MAX_COMMANDS_PER_STEP, 3);
    assert.deepEqual(normalizeCommands(["a", "b", "c", "d"]), ["a", "b", "c"]);
  });

  // Command names come from library filenames on disk and from presets persisted
  // in globalState, then land in a shell line — they are not trusted input.
  it("drops command names outside the slug charset", () => {
    const rejected = [
      "a$(id)",
      "a`id`",
      "a b",
      "a;id",
      "a&&id",
      "a|id",
      "a'b",
      'a"b',
      "a>b",
      "a\nb",
      "../etc/passwd",
      "$HOME",
      "",
      "/",
    ];
    for (const name of rejected) {
      assert.deepEqual(normalizeCommands([name]), [], `must reject ${JSON.stringify(name)}`);
    }
  });

  it("keeps legitimate slug forms", () => {
    assert.deepEqual(
      normalizeCommands(["prd", "/implement", "plugin:skill", "ts-review", "a_b", "v1.2"]),
      ["prd", "implement", "plugin:skill"],
    );
    assert.deepEqual(normalizeCommands(["ts-review", "a_b", "v1.2"]), ["ts-review", "a_b", "v1.2"]);
  });

  it("keeps a hostile name out of the generated shell line entirely", () => {
    const line = stepLaunchLine({ id: "1", cli: "claude", commands: ["a$(id)", "prd"] });
    assert.ok(!line.includes("$(id)"), "rejected name must not reach the shell line");
    assert.equal(line, "claude '/prd'");
  });

  it("normalizes legacy single command field", () => {
    const s = normalizeStep({ id: "x", cli: "claude", command: "/prd" });
    assert.deepEqual(s.commands, ["prd"]);
  });

  it("formats a readable plan with multi-command label", () => {
    const text = formatOrchestrationPlan([
      { id: "1", cli: "claude", commands: ["implement", "fix"], args: "task 1" },
    ]);
    assert.match(text, /Wave 1/);
    assert.match(text, /\/implement \+ \/fix/);
    assert.equal(stepCommandsLabel({ id: "1", cli: "claude", commands: ["a", "b"] }), "/a + /b");
  });

  it("validates preset names", () => {
    assert.equal(validatePresetName("  ").ok, false);
    assert.equal(validatePresetName("Ship it").ok, true);
    if (validatePresetName("Ship it").ok) {
      assert.equal(validatePresetName("Ship it").name, "Ship it");
    }
  });

  it("upserts named presets and rejects duplicate names", () => {
    const steps: OrchStep[] = [{ id: "1", cli: "claude", commands: ["prd"] }];
    const a = upsertPreset([], { name: "Flow A", steps }, "2026-01-01T00:00:00.000Z");
    assert.equal(a.ok, true);
    if (!a.ok) return;
    const b = upsertPreset(a.presets, { name: "flow a", steps });
    assert.equal(b.ok, false);
    const c = upsertPreset(a.presets, {
      id: a.preset.id,
      name: "Flow A",
      steps: [{ id: "1", cli: "echo", commands: ["prd", "implement"] }],
    });
    assert.equal(c.ok, true);
    if (!c.ok) return;
    assert.equal(c.preset.steps[0].commands.length, 2);
  });

  it("parses store and deletes by id", () => {
    const raw = {
      presets: [
        {
          id: "p1",
          name: "Legacy",
          steps: [{ id: "s1", cli: "claude", command: "prd" }],
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    };
    const list = parsePresetStore(raw);
    assert.equal(list.length, 1);
    assert.deepEqual(list[0].steps[0].commands, ["prd"]);
    const del = deletePreset(list, "p1");
    assert.equal(del.ok, true);
    if (del.ok) assert.equal(del.presets.length, 0);
  });

  it("cloneSteps assigns new ids", () => {
    const src: OrchStep[] = [{ id: "old", cli: "claude", commands: ["prd"] }];
    const cloned = cloneSteps(src);
    assert.equal(cloned[0].commands[0], "prd");
    assert.notEqual(cloned[0].id, "old");
  });
});
