import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { ensureLibraryFromSeed } from "../../src/library/ensure";
import { scanLibrary } from "../../src/library/scan";
import { planLibraryUpdate } from "../../src/library/seedUpdate";
import { contentHash } from "../../src/domain/hash";

describe("ensureLibraryFromSeed + scan", () => {
  let tmp: string;
  let seed: string;
  let lib: string;

  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ck-ext-"));
    seed = path.join(tmp, "seed");
    lib = path.join(tmp, "lib");
    fs.mkdirSync(path.join(seed, "shared", "skills"), { recursive: true });
    fs.mkdirSync(path.join(seed, "shared", "commands"), { recursive: true });
    fs.mkdirSync(path.join(seed, "agents"), { recursive: true });
    fs.mkdirSync(path.join(seed, "typescript", "prompts"), { recursive: true });
    fs.mkdirSync(path.join(seed, "typescript", "rules"), { recursive: true });
    fs.writeFileSync(
      path.join(seed, "shared", "skills", "demo.md"),
      "---\nname: demo\ndescription: d\n---\n\n# Demo\n",
    );
    fs.writeFileSync(path.join(seed, "shared", "commands", "fix.md"), "# fix\n\nDo fix\n");
    fs.writeFileSync(path.join(seed, "agents", "implementer.md"), "# impl\n");
    fs.writeFileSync(
      path.join(seed, "typescript", "prompts", "ts-refactor.md"),
      "# refactor\n\nRefactor it\n",
    );
    fs.writeFileSync(path.join(seed, "typescript", "rules", "patterns.md"), "# patterns\n");
    fs.writeFileSync(path.join(seed, "seed.json"), JSON.stringify({ seedVersion: "test-1" }));
  });

  after(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("installs nested skills and scans them", () => {
    ensureLibraryFromSeed(lib, seed);
    const skillPath = path.join(lib, "skills", "demo", "SKILL.md");
    assert.ok(fs.existsSync(skillPath));
    const assets = scanLibrary(lib);
    assert.ok(assets.some((a) => a.kind === "skill" && a.name === "demo"));
    assert.ok(assets.some((a) => a.kind === "command" && a.name === "fix"));
    assert.ok(assets.some((a) => a.kind === "agent" && a.name === "implementer"));
  });

  it("installs language prompts and leaves a fresh library up to date", () => {
    const promptPath = path.join(lib, "langs", "typescript", "prompts", "ts-refactor.md");
    assert.equal(fs.readFileSync(promptPath, "utf8"), "# refactor\n\nRefactor it\n");
    assert.ok(fs.existsSync(path.join(lib, "langs", "typescript", "rules", "patterns.md")));
    // A fresh install must not immediately advertise an update.
    const plan = planLibraryUpdate(lib, seed);
    assert.deepEqual(
      plan.missing.map((a) => a.libraryRel),
      [],
    );
    assert.equal(plan.needsUpdate, false);
  });

  it("does not overwrite dirty seed assets on reinstall", () => {
    const skillPath = path.join(lib, "skills", "demo", "SKILL.md");
    fs.writeFileSync(skillPath, "---\nname: demo\ndescription: edited\n---\n\n# Edited\n");
    ensureLibraryFromSeed(lib, seed);
    const body = fs.readFileSync(skillPath, "utf8");
    assert.ok(body.includes("Edited"));
    assert.notEqual(
      contentHash(body),
      contentHash("---\nname: demo\ndescription: d\n---\n\n# Demo\n"),
    );
  });
});
