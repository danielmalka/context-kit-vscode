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
  mapSeedFileToLibraryRel,
  readSeedVersion,
  readLibrarySeedVersion,
} from "../../src/library/seedUpdate";
import { contentHash } from "../../src/domain/hash";
import { metaRelativePath } from "../../src/domain/paths";
import type { AssetMeta } from "../../src/domain/types";

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
    assert.ok(result.applied.includes("skills/demo/SKILL.md"));
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

  it("reinstalls a seed asset the user deleted", () => {
    const skillPath = path.join(lib, "skills", "demo", "SKILL.md");
    fs.rmSync(skillPath);
    const plan = planLibraryUpdate(lib, seedV2);
    assert.ok(
      plan.missing.some((m) => m.name === "demo"),
      "deleted asset must be classified missing",
    );
    assert.equal(plan.needsUpdate, true);
    const r = applyCleanLibraryUpdate(lib, seedV2, plan);
    assert.ok(r.applied.includes("skills/demo/SKILL.md"));
    assert.equal(contentHash(fs.readFileSync(skillPath, "utf8")), contentHash(skillV2));
  });

  it("never touches an asset whose meta marks it user-owned", () => {
    const skillPath = path.join(lib, "skills", "demo", "SKILL.md");
    const mine = "---\nname: demo\ndescription: mine\n---\n\n# Mine\n";
    fs.writeFileSync(skillPath, mine);
    const metaPath = path.join(lib, metaRelativePath("skill", "demo"));
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8")) as AssetMeta;
    fs.writeFileSync(metaPath, JSON.stringify({ ...meta, origin: "user" }, null, 2));

    const plan = planLibraryUpdate(lib, seedV2);
    assert.deepEqual(
      plan.userOwned.map((u) => u.name),
      ["demo"],
    );
    assert.ok(!plan.dirty.some((d) => d.name === "demo"));

    applyLibraryUpdate(lib, seedV2, { demo: "replace" });
    assert.equal(fs.readFileSync(skillPath, "utf8"), mine);
  });

  it("refreshes meta seedVersion without rewriting an unchanged clean asset", () => {
    const metaPath = path.join(lib, metaRelativePath("skill", "demo"));
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8")) as AssetMeta;
    fs.writeFileSync(metaPath, JSON.stringify({ ...meta, seedVersion: "0.9.0" }, null, 2));
    const before = fs.readFileSync(path.join(lib, "skills", "demo", "SKILL.md"), "utf8");

    const r = applyCleanLibraryUpdate(lib, seedV1);

    assert.deepEqual(r.applied, [], "identical seed content must not be rewritten");
    assert.equal(fs.readFileSync(path.join(lib, "skills", "demo", "SKILL.md"), "utf8"), before);
    const after = JSON.parse(fs.readFileSync(metaPath, "utf8")) as AssetMeta;
    assert.equal(after.seedVersion, "1.0.0");
    assert.equal(after.seedHashWhenInstalled, meta.seedHashWhenInstalled);
  });

  it("reports needsUpdate false when the library already matches the seed", () => {
    const plan = planLibraryUpdate(lib, seedV1);
    assert.equal(plan.librarySeedVersion, "1.0.0");
    assert.equal(plan.packageSeedVersion, "1.0.0");
    assert.deepEqual(plan.missing, []);
    assert.equal(plan.needsUpdate, false);
  });

  it("does not treat a lower incoming seed version as an update", () => {
    // library is at 2.0.0 after applying seedV2; seedV1 (1.0.0) must not look like an upgrade
    applyLibraryUpdate(lib, seedV2);
    assert.equal(readLibrarySeedVersion(lib), "2.0.0");
    assert.equal(planLibraryUpdate(lib, seedV1).needsUpdate, false);
  });

  it("treats a legacy library seed version as older so the install still upgrades", () => {
    fs.writeFileSync(
      path.join(lib, "library.json"),
      JSON.stringify({ seedVersion: "2026.07.22+e4d4cfe" }),
    );
    const plan = planLibraryUpdate(lib, seedV1);
    assert.equal(plan.librarySeedVersion, "2026.07.22+e4d4cfe");
    assert.deepEqual(plan.missing, [], "assets are present — only the version differs");
    assert.equal(plan.needsUpdate, true);
  });

  it("rejects resolving an asset that is not dirty", () => {
    const mapped = listSeedMappedAssets(seedV1).find((a) => a.name === "demo")!;
    const clean = classifySeedAsset(lib, mapped);
    assert.equal(clean.status, "clean");
    assert.throws(() => resolveDirtyAsset(lib, clean, "replace", "1.0.0"), /expected dirty, got/);
  });

  it("accepts a dirty resolution keyed by library relative path", () => {
    const skillPath = path.join(lib, "skills", "demo", "SKILL.md");
    fs.writeFileSync(skillPath, "edited\n");
    const r = applyLibraryUpdate(lib, seedV2, { "skills/demo/SKILL.md": "replace" });
    assert.deepEqual(r.replaced, ["skills/demo/SKILL.md"]);
    assert.equal(contentHash(fs.readFileSync(skillPath, "utf8")), contentHash(skillV2));
  });

  it("bumps the library seed version only once no dirty asset remains", () => {
    const skillPath = path.join(lib, "skills", "demo", "SKILL.md");
    fs.writeFileSync(skillPath, "edited\n");

    const skipped = applyLibraryUpdate(lib, seedV2, {});
    assert.deepEqual(skipped.skippedDirty, ["skills/demo/SKILL.md"]);
    assert.equal(skipped.librarySeedVersion, "1.0.0", "unresolved dirty asset pins the version");
    assert.equal(readLibrarySeedVersion(lib), "1.0.0");

    const resolved = applyLibraryUpdate(lib, seedV2, { demo: "replace" });
    assert.deepEqual(resolved.skippedDirty, []);
    assert.equal(resolved.librarySeedVersion, "2.0.0");
    assert.equal(planLibraryUpdate(lib, seedV2).needsUpdate, false);
  });
});

describe("seedUpdate seed mapping and manifests", () => {
  let tmp: string;

  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ck-seed-map-"));
  });

  after(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("maps every supported seed layout to its library path", () => {
    assert.deepEqual(mapSeedFileToLibraryRel("shared/skills/demo.md"), {
      kind: "skill",
      name: "demo",
      rel: "skills/demo/SKILL.md",
    });
    assert.deepEqual(mapSeedFileToLibraryRel("shared/checklists/pre-flight.md"), {
      kind: "checklist",
      name: "pre-flight",
      rel: "checklists/pre-flight.md",
    });
    assert.deepEqual(mapSeedFileToLibraryRel("shared/templates/adr.md"), {
      kind: "template",
      name: "adr",
      rel: "templates/adr.md",
    });
    assert.deepEqual(mapSeedFileToLibraryRel("shared/prompts/tone.md"), {
      kind: "prompt",
      name: "tone",
      rel: "prompts/tone.md",
    });
    assert.deepEqual(mapSeedFileToLibraryRel("agents/reviewer.md"), {
      kind: "agent",
      name: "reviewer",
      rel: "agents/reviewer.md",
    });
    assert.deepEqual(mapSeedFileToLibraryRel("typescript/skills/tdd.md"), {
      kind: "skill",
      name: "typescript/tdd",
      rel: "langs/typescript/skills/tdd/SKILL.md",
    });
    assert.deepEqual(mapSeedFileToLibraryRel("go/rules/errors.md"), {
      kind: "rule",
      name: "go/errors",
      rel: "langs/go/rules/errors.md",
    });
    assert.deepEqual(mapSeedFileToLibraryRel("typescript/prompts/ts-refactor.md"), {
      kind: "prompt",
      name: "typescript/ts-refactor",
      rel: "langs/typescript/prompts/ts-refactor.md",
    });
    assert.deepEqual(mapSeedFileToLibraryRel("go/prompts/go-refactor.md"), {
      kind: "prompt",
      name: "go/go-refactor",
      rel: "langs/go/prompts/go-refactor.md",
    });
    assert.deepEqual(mapSeedFileToLibraryRel("rust\\commands\\bench.md"), {
      kind: "command",
      name: "rust/bench",
      rel: "langs/rust/commands/bench.md",
    });
  });

  it("returns null for paths outside the seed layout", () => {
    for (const rel of [
      "README.md",
      "shared/notes/x.md",
      "shared/skills/nested/x.md",
      "shared/skills/x.txt",
      "agents/team/x.md",
      "java/skills/x.md",
      "typescript/docs/x.md",
    ]) {
      assert.equal(mapSeedFileToLibraryRel(rel), null, rel);
    }
  });

  it("collects agent and lang-pack assets and ignores unmappable files", () => {
    const seed = path.join(tmp, "seed-full");
    fs.mkdirSync(path.join(seed, "agents"), { recursive: true });
    fs.mkdirSync(path.join(seed, "typescript", "rules"), { recursive: true });
    fs.mkdirSync(path.join(seed, "docs"), { recursive: true });
    fs.writeFileSync(path.join(seed, "agents", "reviewer.md"), "# reviewer\n");
    fs.writeFileSync(path.join(seed, "typescript", "rules", "errors.md"), "# ts errors\n");
    fs.writeFileSync(path.join(seed, "docs", "guide.md"), "# ignored\n");
    fs.writeFileSync(path.join(seed, "seed.json"), JSON.stringify({ seedVersion: "3.1.0" }));

    const list = listSeedMappedAssets(seed);
    assert.deepEqual(
      list.map((a) => a.libraryRel).sort(),
      ["agents/reviewer.md", "langs/typescript/rules/errors.md"],
      "seed.json and unmappable files are excluded",
    );
    const agent = list.find((a) => a.kind === "agent")!;
    assert.equal(agent.seedContent, "# reviewer\n");
    assert.equal(agent.seedHash, contentHash("# reviewer\n"));
    assert.equal(readSeedVersion(seed), "3.1.0");
  });

  it("falls back to a dev seed version when seed.json is absent or unparseable", () => {
    const empty = path.join(tmp, "seed-empty");
    fs.mkdirSync(empty, { recursive: true });
    assert.equal(readSeedVersion(empty), "0.0.0-dev");

    const broken = path.join(tmp, "seed-broken");
    fs.mkdirSync(broken, { recursive: true });
    fs.writeFileSync(path.join(broken, "seed.json"), "{ not json");
    assert.equal(readSeedVersion(broken), "0.0.0-dev");

    fs.writeFileSync(path.join(broken, "seed.json"), JSON.stringify({ source: "x" }));
    assert.equal(readSeedVersion(broken), "0.0.0-dev");
  });

  it("reports a null library seed version when library.json is missing or unparseable", () => {
    const libRoot = path.join(tmp, "lib-none");
    fs.mkdirSync(libRoot, { recursive: true });
    assert.equal(readLibrarySeedVersion(libRoot), null);

    fs.writeFileSync(path.join(libRoot, "library.json"), "{ not json");
    assert.equal(readLibrarySeedVersion(libRoot), null);
  });

  it("installs into an empty library and records seed provenance", () => {
    const seed = path.join(tmp, "seed-fresh");
    fs.mkdirSync(path.join(seed, "shared", "skills"), { recursive: true });
    const body = "---\nname: fresh\n---\n\n# Fresh\n";
    fs.writeFileSync(path.join(seed, "shared", "skills", "fresh.md"), body);
    fs.writeFileSync(path.join(seed, "seed.json"), JSON.stringify({ seedVersion: "4.0.0" }));

    const libRoot = path.join(tmp, "lib-fresh");
    fs.mkdirSync(libRoot, { recursive: true });

    const plan = planLibraryUpdate(libRoot, seed);
    assert.equal(plan.librarySeedVersion, null);
    assert.equal(plan.needsUpdate, true);
    assert.deepEqual(
      plan.missing.map((m) => m.libraryRel),
      ["skills/fresh/SKILL.md"],
    );

    const r = applyLibraryUpdate(libRoot, seed);
    assert.deepEqual(r.applied, ["skills/fresh/SKILL.md"]);
    assert.equal(r.librarySeedVersion, "4.0.0");
    assert.equal(fs.readFileSync(path.join(libRoot, "skills", "fresh", "SKILL.md"), "utf8"), body);

    const meta = JSON.parse(
      fs.readFileSync(path.join(libRoot, metaRelativePath("skill", "fresh")), "utf8"),
    ) as AssetMeta;
    assert.deepEqual(meta, {
      name: "fresh",
      kind: "skill",
      origin: "seed",
      seedVersion: "4.0.0",
      contentHash: contentHash(body),
      seedHashWhenInstalled: contentHash(body),
      relativePath: "skills/fresh/SKILL.md",
    });
  });

  it("writes lang-pack meta with a slash-free file name", () => {
    const seed = path.join(tmp, "seed-lang");
    fs.mkdirSync(path.join(seed, "go", "rules"), { recursive: true });
    fs.writeFileSync(path.join(seed, "go", "rules", "errors.md"), "# go errors\n");
    fs.writeFileSync(path.join(seed, "seed.json"), JSON.stringify({ seedVersion: "5.0.0" }));

    const libRoot = path.join(tmp, "lib-lang");
    fs.mkdirSync(libRoot, { recursive: true });
    const r = applyLibraryUpdate(libRoot, seed);

    assert.deepEqual(r.applied, ["langs/go/rules/errors.md"]);
    const metaPath = path.join(libRoot, metaRelativePath("rule", "go__errors"));
    assert.ok(fs.existsSync(metaPath), `expected flattened meta at ${metaPath}`);
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8")) as AssetMeta;
    assert.equal(meta.name, "go/errors");
    assert.equal(meta.relativePath, "langs/go/rules/errors.md");
    assert.equal(classifySeedAsset(libRoot, listSeedMappedAssets(seed)[0]).status, "clean");
  });

  it("derives .user backup paths for extension-less and dotted names", () => {
    assert.equal(
      userBackupPath(path.join("a", "b", "SKILL.md")),
      path.join("a", "b", "SKILL.user.md"),
    );
    assert.equal(userBackupPath(path.join("a", "NOTES")), path.join("a", "NOTES.user"));
    assert.equal(
      userBackupPath(path.join("a", "rules.core.md")),
      path.join("a", "rules.core.user.md"),
    );
  });
});
