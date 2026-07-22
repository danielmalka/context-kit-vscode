import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { ensureLibraryFromSeed } from "../../src/library/ensure";
import { factoryDefaultProfile } from "../../src/profile/defaults";
import { applyHarness } from "../../src/publish/applyHarness";
import { PROJECT_JSON_REL } from "../../src/profile/projectJson";

describe("applyHarness", () => {
  let tmp: string;
  let seed: string;
  let lib: string;
  let ws: string;

  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ck-apply-"));
    seed = path.join(tmp, "seed");
    lib = path.join(tmp, "lib");
    ws = path.join(tmp, "ws");
    fs.mkdirSync(path.join(seed, "shared", "skills"), { recursive: true });
    fs.mkdirSync(path.join(seed, "shared", "commands"), { recursive: true });
    fs.mkdirSync(ws, { recursive: true });
    fs.writeFileSync(
      path.join(seed, "shared", "skills", "demo.md"),
      "---\nname: demo\ndescription: d\n---\n\n# Demo\n",
    );
    fs.writeFileSync(path.join(seed, "shared", "commands", "prd.md"), "# prd\n");
    fs.writeFileSync(path.join(seed, "seed.json"), JSON.stringify({ seedVersion: "t1" }));
    ensureLibraryFromSeed(lib, seed);
  });

  after(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("writes .harness, project.json, and only selected providers", () => {
    const profile = factoryDefaultProfile();
    profile.language = "none";
    profile.providers.gemini = false;
    profile.providers.codex = false;
    profile.providers.devin = false;

    const result = applyHarness({
      workspaceRoot: ws,
      libraryRoot: lib,
      seedRoot: seed,
      profile,
      dryRun: false,
    });

    assert.ok(result.written.length > 0);
    assert.ok(fs.existsSync(path.join(ws, ".harness", "skills", "demo", "SKILL.md")));
    assert.ok(fs.existsSync(path.join(ws, PROJECT_JSON_REL)));
    assert.ok(
      fs.existsSync(path.join(ws, ".claude", "skills")) ||
        result.symlinks.some((s) => s.includes(".claude")),
    );
    assert.equal(fs.existsSync(path.join(ws, ".gemini")), false);
    assert.equal(fs.existsSync(path.join(ws, ".codex")), false);

    const pj = JSON.parse(fs.readFileSync(path.join(ws, PROJECT_JSON_REL), "utf8"));
    assert.equal(pj.profile.language, "none");
    assert.equal(pj.profile.providers.claude, true);
  });
});
