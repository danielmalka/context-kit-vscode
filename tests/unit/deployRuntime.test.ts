import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  defaultSkillRoots,
  deployAssetToRuntime,
  librarySourcePath,
  runtimeRelativePath,
} from "../../src/publish/deployRuntime";

describe("deployRuntime", () => {
  let tmp: string;
  let lib: string;
  let home: string;

  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ck-deploy-"));
    lib = path.join(tmp, "lib");
    home = path.join(tmp, "home");
    const skill = path.join(lib, "skills", "demo", "SKILL.md");
    fs.mkdirSync(path.dirname(skill), { recursive: true });
    fs.writeFileSync(skill, "---\nname: demo\n---\n\n# Demo\n");
    const wf = path.join(lib, "workflows", "review.rhai");
    fs.mkdirSync(path.dirname(wf), { recursive: true });
    fs.writeFileSync(wf, "// review workflow\n");
  });

  after(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("runtimeRelativePath for skills is nested SKILL.md", () => {
    assert.equal(runtimeRelativePath("skill", "demo"), "demo/SKILL.md");
  });

  it("librarySourcePath points at real library file", () => {
    const p = librarySourcePath(lib, "skill", "demo");
    assert.ok(fs.existsSync(p));
  });

  it("deploys skill into claude and grok skill roots", () => {
    const roots = defaultSkillRoots(home);
    const result = deployAssetToRuntime({
      libraryRoot: lib,
      kind: "skill",
      name: "demo",
      targets: { claude: roots.claude, grok: roots.grok },
    });
    assert.equal(result.errors.length, 0);
    assert.ok(result.written.some((w) => w.endsWith(path.join("demo", "SKILL.md"))));
    assert.ok(fs.existsSync(path.join(roots.claude, "demo", "SKILL.md")));
    assert.ok(fs.existsSync(path.join(roots.grok, "demo", "SKILL.md")));
    const body = fs.readFileSync(path.join(roots.claude, "demo", "SKILL.md"), "utf8");
    assert.ok(body.includes("# Demo"));
  });

  it("dryRun does not write files", () => {
    const destRoot = path.join(tmp, "dry");
    const result = deployAssetToRuntime({
      libraryRoot: lib,
      kind: "skill",
      name: "demo",
      targets: { agents: destRoot },
      dryRun: true,
    });
    assert.ok(result.written.length >= 1);
    assert.equal(fs.existsSync(path.join(destRoot, "demo", "SKILL.md")), false);
  });

  it("errors when source skill is missing", () => {
    const result = deployAssetToRuntime({
      libraryRoot: lib,
      kind: "skill",
      name: "nope",
      targets: { claude: path.join(tmp, "x") },
    });
    assert.ok(result.errors.length > 0);
  });
});
