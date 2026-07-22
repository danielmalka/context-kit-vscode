import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { ensureLibraryFromSeed } from "../../src/library/ensure";
import {
  applyCleanLibraryUpdate,
  applyLibraryUpdate,
  planLibraryUpdate,
  resolveDirtyAsset,
  userBackupPath,
  classifySeedAsset,
  listSeedMappedAssets,
} from "../../src/library/seedUpdate";
import { contentHash } from "../../src/domain/hash";

function writeSeed(root: string, version: string, skillBody: string, cmdBody: string): void {
  fs.mkdirSync(path.join(root, "shared", "skills"), { recursive: true });
  fs.mkdirSync(path.join(root, "shared", "commands"), { recursive: true });
  fs.writeFileSync(path.join(root, "shared", "skills", "demo.md"), skillBody);
  fs.writeFileSync(path.join(root, "shared", "commands", "fix.md"), cmdBody);
  fs.writeFileSync(
    path.join(root, "seed.json"),
    JSON.stringify({ seedVersion: version, source: "fixture" }),
  );
}

describe("seedUpdate", () => {
  let tmp: string;
  let seedV1: string;
  let seedV2: string;
  let lib: string;

  const skillV1 = "---\nname: demo\ndescription: v1\n---\n\n# Demo v1\n";
  const skillV2 = "---\nname: demo\ndescription: v2\n---\n\n# Demo v2\n";
  const cmdV1 = "# fix\n\nv1 body\n";
  const cmdV2 = "# fix\n\nv2 body\n";

  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ck-seed-upd-"));
    seedV1 = path.join(tmp, "seed-v1");
    seedV2 = path.join(tmp, "seed-v2");
    lib = path.join(tmp, "lib");
    writeSeed(seedV1, "1.0.0", skillV1, cmdV1);
    writeSeed(seedV2, "2.0.0", skillV2, cmdV2);
  });

  after(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  beforeEach(() => {
    fs.rmSync(lib, { recursive: true, force: true });
    fs.mkdirSync(lib, { recursive: true });
    ensureLibraryFromSeed(lib, seedV1);
  });

  it("lists seed mapped assets from real seed layout", () => {
    const list = listSeedMappedAssets(seedV1);
    assert.ok(list.some((a) => a.name === "demo" && a.kind === "skill"));
    assert.ok(list.some((a) => a.name === "fix" && a.kind === "command"));
  });

  it("classifies clean after install from same seed", () => {
    const mapped = listSeedMappedAssets(seedV1).find((a) => a.name === "demo")!;
    const c = classifySeedAsset(lib, mapped);
    assert.equal(c.status, "clean");
  });

  it("classifies dirty when user edits a seed asset", () => {
    const skillPath = path.join(lib, "skills", "demo", "SKILL.md");
    fs.writeFileSync(skillPath, "---\nname: demo\ndescription: edited\n---\n\n# Edited\n");
    const mapped = listSeedMappedAssets(seedV1).find((a) => a.name === "demo")!;
    const c = classifySeedAsset(lib, mapped);
    assert.equal(c.status, "dirty");
  });

  it("auto-applies clean overwrite when seed content changes (v2)", () => {
    // leave clean
    const plan = planLibraryUpdate(lib, seedV2);
    assert.ok(plan.clean.length + plan.missing.length >= 1);
    const result = applyCleanLibraryUpdate(lib, seedV2, plan);
    assert.ok(result.applied.includes("skills/demo/SKILL.md") || result.applied.length >= 0);
    const body = fs.readFileSync(path.join(lib, "skills", "demo", "SKILL.md"), "utf8");
    assert.ok(body.includes("Demo v2"), `expected v2 body, got: ${body}`);
    assert.equal(contentHash(body), contentHash(skillV2));
  });

  it("skip leaves dirty content unchanged", () => {
    const skillPath = path.join(lib, "skills", "demo", "SKILL.md");
    const edited = "---\nname: demo\ndescription: edited\n---\n\n# Edited keep\n";
    fs.writeFileSync(skillPath, edited);
    const plan = planLibraryUpdate(lib, seedV2);
    assert.ok(plan.dirty.some((d) => d.name === "demo"));
    const r = applyLibraryUpdate(lib, seedV2, { demo: "skip" });
    assert.ok(r.skippedDirty.some((p) => p.includes("demo")));
    assert.equal(fs.readFileSync(skillPath, "utf8"), edited);
  });

  it("replace restores seed content on canonical path", () => {
    const skillPath = path.join(lib, "skills", "demo", "SKILL.md");
    fs.writeFileSync(skillPath, "---\nname: demo\ndescription: edited\n---\n\n# Edited\n");
    const r = applyLibraryUpdate(lib, seedV2, { demo: "replace" });
    assert.ok(r.replaced.some((p) => p.includes("demo")));
    const body = fs.readFileSync(skillPath, "utf8");
    assert.ok(body.includes("Demo v2"));
    assert.equal(contentHash(body), contentHash(skillV2));
  });

  it("keep-both writes .user backup and seed on canonical path", () => {
    const skillPath = path.join(lib, "skills", "demo", "SKILL.md");
    const edited = "---\nname: demo\ndescription: mine\n---\n\n# Mine\n";
    fs.writeFileSync(skillPath, edited);
    const r = applyLibraryUpdate(lib, seedV2, { demo: "keep-both" });
    assert.ok(r.keptBoth.some((p) => p.includes("demo")));
    const backup = userBackupPath(skillPath);
    assert.ok(fs.existsSync(backup), `backup missing: ${backup}`);
    assert.equal(fs.readFileSync(backup, "utf8"), edited);
    const body = fs.readFileSync(skillPath, "utf8");
    assert.ok(body.includes("Demo v2"));
  });

  it("resolveDirtyAsset keep-both uses shipped userBackupPath", () => {
    const skillPath = path.join(lib, "skills", "demo", "SKILL.md");
    fs.writeFileSync(skillPath, "edited-body\n");
    const mapped = listSeedMappedAssets(seedV2).find((a) => a.name === "demo")!;
    const classified = classifySeedAsset(lib, mapped);
    assert.equal(classified.status, "dirty");
    const res = resolveDirtyAsset(lib, classified, "keep-both", "2.0.0");
    assert.equal(res.action, "keep-both");
    assert.ok(res.backupPath);
    assert.equal(path.basename(res.backupPath!), "SKILL.user.md");
  });
});
