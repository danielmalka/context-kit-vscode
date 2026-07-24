import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  librarySubdir,
  assetRelativePath,
  metaRelativePath,
  providerGlueHints,
} from "../../src/domain/paths";
import type { AssetKind, ProviderId } from "../../src/domain/types";

const ALL_KINDS: AssetKind[] = [
  "skill",
  "command",
  "agent",
  "workflow",
  "rule",
  "checklist",
  "template",
  "prompt",
];

describe("librarySubdir", () => {
  const cases: [AssetKind, string][] = [
    ["skill", "skills"],
    ["command", "commands"],
    ["agent", "agents"],
    ["workflow", "workflows"],
    ["rule", "rules"],
    ["checklist", "checklists"],
    ["template", "templates"],
    ["prompt", "prompts"],
  ];
  for (const [kind, expected] of cases) {
    it(`maps ${kind} to ${expected}`, () => {
      assert.equal(librarySubdir(kind), expected);
    });
  }

  it("covers every AssetKind", () => {
    assert.equal(cases.length, ALL_KINDS.length);
  });

  it("returns the unreachable value for an invalid kind (defensive exhaustiveness guard)", () => {
    // ponytail: casting past the type system to exercise the `never` default branch —
    // it exists purely to fail loudly if AssetKind grows a case librarySubdir forgets.
    const bogus = "bogus" as unknown as AssetKind;
    assert.equal(librarySubdir(bogus), "bogus");
  });
});

describe("assetRelativePath", () => {
  it("nests skills under a SKILL.md file", () => {
    assert.equal(assetRelativePath("skill", "graphify"), "skills/graphify/SKILL.md");
  });

  it("gives workflows a .rhai extension", () => {
    assert.equal(assetRelativePath("workflow", "release"), "workflows/release.rhai");
  });

  const flatCases: [AssetKind, string][] = [
    ["command", "commands/deploy.md"],
    ["agent", "agents/deploy.md"],
    ["rule", "rules/deploy.md"],
    ["checklist", "checklists/deploy.md"],
    ["template", "templates/deploy.md"],
    ["prompt", "prompts/deploy.md"],
  ];
  for (const [kind, expected] of flatCases) {
    it(`gives ${kind} a flat .md file`, () => {
      assert.equal(assetRelativePath(kind, "deploy"), expected);
    });
  }
});

describe("metaRelativePath", () => {
  for (const kind of ALL_KINDS) {
    it(`nests ${kind} meta under .meta/${librarySubdir(kind)}`, () => {
      assert.equal(metaRelativePath(kind, "widget"), `.meta/${librarySubdir(kind)}/widget.json`);
    });
  }
});

describe("providerGlueHints", () => {
  const cases: [ProviderId, string[]][] = [
    ["claude", [".claude/skills", ".claude/commands", ".claude/rules", ".claude/checklists"]],
    ["agents", [".agents/skills"]],
    ["grok", [".grok/instructions.md"]],
    ["codex", [".codex/instructions.md"]],
    ["gemini", [".gemini/instructions.md", ".gemini/commands/"]],
    ["devin", [".devin/instructions.md"]],
  ];
  for (const [provider, expected] of cases) {
    it(`returns glue hints for ${provider}`, () => {
      assert.deepEqual(providerGlueHints(provider), expected);
    });
  }

  it("covers every ProviderId", () => {
    const allProviders: ProviderId[] = ["claude", "grok", "agents", "codex", "gemini", "devin"];
    assert.equal(cases.length, allProviders.length);
  });

  it("returns the unreachable value for an invalid provider (defensive exhaustiveness guard)", () => {
    // ponytail: same defensive-branch rationale as librarySubdir above.
    const bogus = "bogus" as unknown as ProviderId;
    assert.equal(providerGlueHints(bogus), "bogus");
  });
});
