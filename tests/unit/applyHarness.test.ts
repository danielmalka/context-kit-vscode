import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { ensureLibraryFromSeed } from "../../src/library/ensure";
import { factoryDefaultProfile } from "../../src/profile/defaults";
import { applyHarness } from "../../src/publish/applyHarness";
import { PROJECT_JSON_REL } from "../../src/profile/projectJson";
import type { HarnessProfile, LanguageId, ProviderId } from "../../src/domain/types";
import { ALL_PROVIDERS, SUPPORTED_LANGS } from "../../src/domain/types";

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

// ---------------------------------------------------------------------------
// Hand-built library/seed fixtures — full branch coverage for applyHarness.
// ---------------------------------------------------------------------------

const LIBRARY_ASSETS: Record<string, string> = {
  "skills/demo/SKILL.md": "# demo skill\n",
  "commands/prd.md": "# prd command\n",
  "commands/tasks.md": "# tasks command\n",
  "commands/notes.txt": "not a command\n",
  "agents/reviewer.md": "# reviewer agent\n",
  "checklists/pre-release.md": "# checklist\n",
  "templates/adr.md": "# template\n",
  "prompts/kickoff.md": "# prompt\n",
  "rules/base.md": "# base rules\n",
};

/** Files placed under seed/<lang>/verifications, keyed by file name. */
const VERIFICATION_FILES: Record<string, string> = {
  "AGENTS.md": "# AGENTS from seed\n",
  Makefile: "check:\n\techo seed\n",
  "github-actions-ci.yml": "name: ci\n",
  "pre-commit.sh": "#!/bin/sh\necho seed\n",
  "config.json": '{"seed":true}\n',
  "extra.toml": "seed = true\n",
  "quality.neon": "parameters:\n",
  "ci2.yaml": "name: ci2\n",
  ".editorconfig": "root = true\n",
  "notes.txt": "not copied to the workspace root\n",
};

function writeFixture(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

function onlyProvider(id: ProviderId): Record<ProviderId, boolean> {
  const out = {} as Record<ProviderId, boolean>;
  for (const p of ALL_PROVIDERS) out[p] = p === id;
  return out;
}

describe("applyHarness — branches", () => {
  let tmp: string;
  let seed: string;
  let emptySeed: string;
  let lib: string;
  let wsCounter = 0;

  function newWorkspace(): string {
    const ws = path.join(tmp, `ws-${++wsCounter}`);
    fs.mkdirSync(ws, { recursive: true });
    return ws;
  }

  function profileFor(
    language: LanguageId,
    options: Partial<HarnessProfile["options"]> = {},
    providers?: Record<ProviderId, boolean>,
  ): HarnessProfile {
    const p = factoryDefaultProfile();
    p.language = language;
    p.options = { ...p.options, ...options };
    if (providers) p.providers = providers;
    return p;
  }

  function run(
    ws: string,
    profile: HarnessProfile,
    extra: { dryRun?: boolean; seedRoot?: string; extensionVersion?: string } = {},
  ) {
    return applyHarness({
      workspaceRoot: ws,
      libraryRoot: lib,
      seedRoot: extra.seedRoot ?? seed,
      profile,
      dryRun: extra.dryRun,
      extensionVersion: extra.extensionVersion,
    });
  }

  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ck-apply-br-"));
    seed = path.join(tmp, "seed");
    emptySeed = path.join(tmp, "seed-empty");
    lib = path.join(tmp, "lib");

    fs.mkdirSync(emptySeed, { recursive: true });
    for (const [rel, content] of Object.entries(LIBRARY_ASSETS)) {
      writeFixture(path.join(lib, rel), content);
    }

    for (const lang of SUPPORTED_LANGS) {
      writeFixture(
        path.join(lib, "langs", lang, "skills", `${lang}-dev`, "SKILL.md"),
        `# ${lang}\n`,
      );
      writeFixture(
        path.join(lib, "langs", lang, "rules", `${lang}-lib.md`),
        `# ${lang} lib rules\n`,
      );

      writeFixture(path.join(seed, lang, "skills", `${lang}-seed.md`), `# ${lang} seed skill\n`);
      writeFixture(path.join(seed, lang, "skills", "notes.txt"), "raw skill asset\n");
      writeFixture(path.join(seed, lang, "commands", `${lang}-cmd.md`), `# ${lang} cmd\n`);
      writeFixture(path.join(seed, lang, "rules", `${lang}-style.md`), `# ${lang} style\n`);
      for (const [name, content] of Object.entries(VERIFICATION_FILES)) {
        writeFixture(path.join(seed, lang, "verifications", name), content);
      }
      // a directory inside verifications must be ignored, not copied
      fs.mkdirSync(path.join(seed, lang, "verifications", "nested"), { recursive: true });
    }
  });

  after(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("copies every library asset kind into .harness", () => {
    const ws = newWorkspace();
    const result = run(ws, profileFor("none"));

    for (const rel of Object.keys(LIBRARY_ASSETS)) {
      assert.equal(
        fs.readFileSync(path.join(ws, ".harness", rel), "utf8"),
        LIBRARY_ASSETS[rel],
        `missing .harness/${rel}`,
      );
    }
    assert.deepEqual(result.errors, []);
  });

  it("writes nothing to disk on dryRun but still reports the planned paths", () => {
    const ws = newWorkspace();
    const result = run(ws, profileFor("typescript"), { dryRun: true });

    assert.deepEqual(fs.readdirSync(ws), []);
    assert.ok(result.written.includes(path.join(ws, PROJECT_JSON_REL)));
    assert.ok(result.written.includes(path.join(ws, ".harness", "commands", "prd.md")));
    assert.ok(result.symlinks.some((s) => s.startsWith(path.join(ws, ".claude", "skills"))));
  });

  it("records extensionVersion and the full profile in project.json", () => {
    const ws = newWorkspace();
    run(ws, profileFor("go"), { extensionVersion: "9.9.9" });

    const pj = JSON.parse(fs.readFileSync(path.join(ws, PROJECT_JSON_REL), "utf8"));
    assert.equal(pj.version, 1);
    assert.equal(pj.extensionVersion, "9.9.9");
    assert.equal(pj.profile.language, "go");
    assert.ok(typeof pj.appliedAt === "string" && pj.appliedAt.length > 0);
  });

  it("rewrites project.json even when it already exists and mode is skip-existing", () => {
    const ws = newWorkspace();
    writeFixture(path.join(ws, PROJECT_JSON_REL), "{}\n");

    const result = run(ws, profileFor("none", { refreshMode: "skip-existing" }));

    assert.ok(result.written.includes(path.join(ws, PROJECT_JSON_REL)));
    const pj = JSON.parse(fs.readFileSync(path.join(ws, PROJECT_JSON_REL), "utf8"));
    assert.equal(pj.profile.language, "none");
  });

  describe("refreshMode matrix", () => {
    const cases: {
      mode: HarnessProfile["options"]["refreshMode"];
      harnessRefreshed: boolean;
      rootRefreshed: boolean;
    }[] = [
      { mode: "skip-existing", harnessRefreshed: false, rootRefreshed: false },
      { mode: "refresh-harness", harnessRefreshed: true, rootRefreshed: false },
      { mode: "force", harnessRefreshed: true, rootRefreshed: true },
    ];

    for (const c of cases) {
      it(`${c.mode}: harness asset ${c.harnessRefreshed ? "overwritten" : "kept"}, root file ${
        c.rootRefreshed ? "overwritten" : "kept"
      }`, () => {
        const ws = newWorkspace();
        const harnessFile = path.join(ws, ".harness", "commands", "prd.md");
        const rootFile = path.join(ws, "AGENTS.md");
        writeFixture(harnessFile, "STALE HARNESS\n");
        writeFixture(rootFile, "STALE AGENTS\n");

        const result = run(ws, profileFor("typescript", { refreshMode: c.mode }));

        assert.equal(
          fs.readFileSync(harnessFile, "utf8"),
          c.harnessRefreshed ? LIBRARY_ASSETS["commands/prd.md"] : "STALE HARNESS\n",
        );
        assert.equal(
          fs.readFileSync(rootFile, "utf8"),
          c.rootRefreshed ? VERIFICATION_FILES["AGENTS.md"] : "STALE AGENTS\n",
        );
        assert.equal(result.skipped.includes(harnessFile), !c.harnessRefreshed);
        assert.equal(result.skipped.includes(rootFile), !c.rootRefreshed);
      });
    }
  });

  describe("language packs", () => {
    for (const lang of SUPPORTED_LANGS) {
      it(`installs the ${lang} seed pack and library lang assets`, () => {
        const ws = newWorkspace();
        run(ws, profileFor(lang));

        const h = path.join(ws, ".harness");
        assert.equal(
          fs.readFileSync(path.join(h, "skills", `${lang}-seed`, "SKILL.md"), "utf8"),
          `# ${lang} seed skill\n`,
        );
        assert.equal(
          fs.readFileSync(path.join(h, "skills", "notes.txt"), "utf8"),
          "raw skill asset\n",
        );
        assert.equal(
          fs.readFileSync(path.join(h, "commands", `${lang}-cmd.md`), "utf8"),
          `# ${lang} cmd\n`,
        );
        assert.equal(
          fs.readFileSync(path.join(h, "rules", `${lang}-style.md`), "utf8"),
          `# ${lang} style\n`,
        );
        assert.equal(
          fs.readFileSync(path.join(h, "skills", `${lang}-dev`, "SKILL.md"), "utf8"),
          `# ${lang}\n`,
        );
        assert.equal(
          fs.readFileSync(path.join(h, "rules", `${lang}-lib.md`), "utf8"),
          `# ${lang} lib rules\n`,
        );
      });
    }

    for (const lang of ["none", "ask"] as const) {
      it(`installs no language pack for "${lang}"`, () => {
        const ws = newWorkspace();
        run(ws, profileFor(lang));

        assert.equal(fs.existsSync(path.join(ws, "AGENTS.md")), false);
        assert.equal(fs.existsSync(path.join(ws, "Makefile")), false);
        assert.equal(fs.existsSync(path.join(ws, ".harness", "skills", "go-seed")), false);
        assert.ok(fs.existsSync(path.join(ws, ".harness", "skills", "demo", "SKILL.md")));
      });
    }

    it("tolerates a supported language with no seed or library pack on disk", () => {
      const ws = newWorkspace();
      const result = run(ws, profileFor("rust"), { seedRoot: emptySeed });

      assert.equal(fs.existsSync(path.join(ws, "AGENTS.md")), false);
      assert.ok(fs.existsSync(path.join(ws, ".harness", "skills", "rust-dev", "SKILL.md")));
      assert.deepEqual(result.errors, []);
    });
  });

  describe("verification options", () => {
    it("copies AGENTS.md, Makefile, config files and pre-commit when all options are on", () => {
      const ws = newWorkspace();
      run(ws, profileFor("python"));

      for (const name of [
        "Makefile",
        "config.json",
        "extra.toml",
        "quality.neon",
        "ci2.yaml",
        ".editorconfig",
      ]) {
        assert.equal(
          fs.readFileSync(path.join(ws, name), "utf8"),
          VERIFICATION_FILES[name],
          `missing ${name}`,
        );
      }
      assert.equal(
        fs.readFileSync(path.join(ws, "AGENTS.md"), "utf8"),
        VERIFICATION_FILES["AGENTS.md"],
      );
      assert.equal(
        fs.readFileSync(path.join(ws, ".github", "workflows", "ci.yml"), "utf8"),
        VERIFICATION_FILES["github-actions-ci.yml"],
      );
      assert.equal(
        fs.readFileSync(path.join(ws, ".context-kit", "pre-commit.sh"), "utf8"),
        VERIFICATION_FILES["pre-commit.sh"],
      );
      // files with no recognised extension stay out of the workspace root
      assert.equal(fs.existsSync(path.join(ws, "notes.txt")), false);
      assert.equal(fs.existsSync(path.join(ws, "nested")), false);
    });

    it("skips AGENTS.md, Makefile, CI and pre-commit when every option is off", () => {
      const ws = newWorkspace();
      run(
        ws,
        profileFor("python", {
          writeAgentsMd: false,
          writeMakefile: false,
          installCiIfMissing: false,
          installPreCommit: false,
        }),
      );

      assert.equal(fs.existsSync(path.join(ws, "AGENTS.md")), false);
      assert.equal(fs.existsSync(path.join(ws, "Makefile")), false);
      assert.equal(fs.existsSync(path.join(ws, "config.json")), false);
      assert.equal(fs.existsSync(path.join(ws, ".github")), false);
      assert.equal(fs.existsSync(path.join(ws, ".context-kit", "pre-commit.sh")), false);
      // the language pack itself is still installed
      assert.ok(fs.existsSync(path.join(ws, ".harness", "skills", "python-seed", "SKILL.md")));
    });

    it("never copies github-actions-ci.yml to the root when CI install is off", () => {
      const ws = newWorkspace();
      run(ws, profileFor("php", { installCiIfMissing: false, writeMakefile: true }));

      assert.equal(fs.existsSync(path.join(ws, "github-actions-ci.yml")), false);
      assert.equal(fs.existsSync(path.join(ws, ".github", "workflows", "ci.yml")), false);
      assert.ok(fs.existsSync(path.join(ws, "Makefile")));
    });

    it("does not overwrite an existing CI workflow even with refreshMode force", () => {
      const ws = newWorkspace();
      const ci = path.join(ws, ".github", "workflows", "ci.yml");
      writeFixture(ci, "name: existing\n");

      const result = run(ws, profileFor("go", { refreshMode: "force" }));

      assert.equal(fs.readFileSync(ci, "utf8"), "name: existing\n");
      assert.ok(result.skipped.includes(ci));
    });
  });

  describe(".gitignore handling", () => {
    it("creates .gitignore with the .harness/ entry when absent", () => {
      const ws = newWorkspace();
      run(ws, profileFor("none"));

      const content = fs.readFileSync(path.join(ws, ".gitignore"), "utf8");
      assert.ok(content.includes(".harness/"));
    });

    it("appends .harness/ to an existing .gitignore that lacks it", () => {
      const ws = newWorkspace();
      const gi = path.join(ws, ".gitignore");
      writeFixture(gi, "node_modules\n");

      const result = run(ws, profileFor("none"));

      const content = fs.readFileSync(gi, "utf8");
      assert.ok(content.startsWith("node_modules\n"));
      assert.ok(content.includes("\n.harness/\n"));
      assert.ok(result.written.includes(`${gi} (append .harness/)`));
    });

    it("leaves .gitignore untouched when .harness is already ignored", () => {
      const ws = newWorkspace();
      const gi = path.join(ws, ".gitignore");
      writeFixture(gi, "node_modules\n.harness\n");

      const result = run(ws, profileFor("none"));

      assert.equal(fs.readFileSync(gi, "utf8"), "node_modules\n.harness\n");
      assert.equal(
        result.written.some((w) => w.includes("append .harness/")),
        false,
      );
    });
  });

  describe("provider matrix", () => {
    const otherDirs = [".claude", ".agents", ".grok", ".codex", ".gemini", ".devin"];

    const cases: { id: ProviderId; assert: (ws: string) => void }[] = [
      {
        id: "claude",
        assert: (ws) => {
          for (const kind of ["skills", "commands", "rules", "checklists"]) {
            assert.equal(
              fs.readlinkSync(path.join(ws, ".claude", kind)),
              path.join("..", ".harness", kind),
            );
          }
          const napkin = fs.readFileSync(path.join(ws, ".claude", "napkin.md"), "utf8");
          assert.ok(napkin.startsWith("# Napkin Runbook"));
          assert.ok(napkin.includes("## User Directives"));
        },
      },
      {
        id: "agents",
        assert: (ws) => {
          assert.equal(
            fs.readlinkSync(path.join(ws, ".agents", "skills")),
            path.join("..", ".harness", "skills"),
          );
        },
      },
      {
        id: "grok",
        assert: (ws) => {
          const md = fs.readFileSync(path.join(ws, ".grok", "instructions.md"), "utf8");
          assert.ok(md.startsWith("# Grok Instructions — context-kit"));
          assert.ok(md.includes("this file is Grok-specific glue only"));
        },
      },
      {
        id: "codex",
        assert: (ws) => {
          const md = fs.readFileSync(path.join(ws, ".codex", "instructions.md"), "utf8");
          assert.ok(md.startsWith("# Codex Instructions — context-kit"));
        },
      },
      {
        id: "devin",
        assert: (ws) => {
          const md = fs.readFileSync(path.join(ws, ".devin", "instructions.md"), "utf8");
          assert.ok(md.startsWith("# Devin Instructions — context-kit"));
        },
      },
      {
        id: "gemini",
        assert: (ws) => {
          const md = fs.readFileSync(path.join(ws, ".gemini", "instructions.md"), "utf8");
          assert.ok(md.startsWith("# Gemini Instructions — context-kit"));
          const toml = fs.readFileSync(path.join(ws, ".gemini", "commands", "prd.toml"), "utf8");
          assert.equal(
            toml,
            'description = "prd"\nprompt = """\n' +
              "Follow the instructions in .harness/commands/prd.md in this repository.\n" +
              '"""\n',
          );
          assert.ok(fs.existsSync(path.join(ws, ".gemini", "commands", "tasks.toml")));
          // non-markdown files in .harness/commands produce no TOML
          assert.equal(fs.existsSync(path.join(ws, ".gemini", "commands", "notes.toml")), false);
        },
      },
    ];

    for (const c of cases) {
      it(`wires up only the ${c.id} provider when it is the sole one enabled`, () => {
        const ws = newWorkspace();
        run(ws, profileFor("none", {}, onlyProvider(c.id)));

        c.assert(ws);
        for (const dir of otherDirs) {
          if (dir === `.${c.id}` || (c.id === "claude" && dir === ".claude")) continue;
          assert.equal(fs.existsSync(path.join(ws, dir)), false, `${dir} should not exist`);
        }
      });
    }

    it("keeps an existing napkin.md untouched", () => {
      const ws = newWorkspace();
      const napkin = path.join(ws, ".claude", "napkin.md");
      writeFixture(napkin, "MY NOTES\n");

      const result = run(ws, profileFor("none", { refreshMode: "force" }, onlyProvider("claude")));

      assert.equal(fs.readFileSync(napkin, "utf8"), "MY NOTES\n");
      assert.ok(result.skipped.includes(`${napkin} (never overwrite)`));
    });

    it("skips an existing provider instructions file in skip-existing mode", () => {
      const ws = newWorkspace();
      const instr = path.join(ws, ".grok", "instructions.md");
      writeFixture(instr, "MINE\n");

      const result = run(
        ws,
        profileFor("none", { refreshMode: "skip-existing" }, onlyProvider("grok")),
      );

      assert.equal(fs.readFileSync(instr, "utf8"), "MINE\n");
      assert.ok(result.skipped.includes(instr));
    });

    it("overwrites an existing provider instructions file in force mode", () => {
      const ws = newWorkspace();
      const instr = path.join(ws, ".codex", "instructions.md");
      writeFixture(instr, "MINE\n");

      run(ws, profileFor("none", { refreshMode: "force" }, onlyProvider("codex")));

      assert.ok(fs.readFileSync(instr, "utf8").startsWith("# Codex Instructions — context-kit"));
    });
  });

  describe("symlink safety", () => {
    it("leaves an already correct symlink alone on a second apply", () => {
      const ws = newWorkspace();
      run(ws, profileFor("none", {}, onlyProvider("agents")));
      const second = run(ws, profileFor("none", {}, onlyProvider("agents")));

      assert.deepEqual(second.symlinks, []);
      assert.equal(
        fs.readlinkSync(path.join(ws, ".agents", "skills")),
        path.join("..", ".harness", "skills"),
      );
    });

    it("skips a symlink pointing elsewhere in skip-existing mode", () => {
      const ws = newWorkspace();
      const dest = path.join(ws, ".agents", "skills");
      fs.mkdirSync(path.join(ws, ".agents"), { recursive: true });
      fs.symlinkSync("somewhere-else", dest);

      const result = run(
        ws,
        profileFor("none", { refreshMode: "skip-existing" }, onlyProvider("agents")),
      );

      assert.ok(result.skipped.includes(dest));
      assert.equal(fs.readlinkSync(dest), "somewhere-else");
    });

    it("repoints a stale symlink in force mode", () => {
      const ws = newWorkspace();
      const dest = path.join(ws, ".agents", "skills");
      fs.mkdirSync(path.join(ws, ".agents"), { recursive: true });
      fs.symlinkSync("somewhere-else", dest);

      run(ws, profileFor("none", { refreshMode: "force" }, onlyProvider("agents")));

      assert.equal(fs.readlinkSync(dest), path.join("..", ".harness", "skills"));
    });

    it("never deletes a real directory unless refreshMode is force", () => {
      const ws = newWorkspace();
      const dest = path.join(ws, ".agents", "skills");
      writeFixture(path.join(dest, "mine.md"), "user content\n");

      const result = run(
        ws,
        profileFor("none", { refreshMode: "refresh-harness" }, onlyProvider("agents")),
      );

      assert.ok(result.skipped.includes(`${dest} (real path, not symlink)`));
      assert.equal(fs.readFileSync(path.join(dest, "mine.md"), "utf8"), "user content\n");
      assert.equal(fs.lstatSync(dest).isSymbolicLink(), false);
    });

    it("replaces a real directory with a symlink in force mode", () => {
      const ws = newWorkspace();
      const dest = path.join(ws, ".agents", "skills");
      writeFixture(path.join(dest, "mine.md"), "user content\n");

      run(ws, profileFor("none", { refreshMode: "force" }, onlyProvider("agents")));

      assert.equal(fs.lstatSync(dest).isSymbolicLink(), true);
      assert.equal(fs.readlinkSync(dest), path.join("..", ".harness", "skills"));
    });

    it("plans a symlink without touching the filesystem on dryRun", () => {
      const ws = newWorkspace();
      const dest = path.join(ws, ".agents", "skills");

      const result = run(ws, profileFor("none", {}, onlyProvider("agents")), { dryRun: true });

      assert.ok(result.symlinks.includes(`${dest} -> ${path.join("..", ".harness", "skills")}`));
      assert.equal(fs.existsSync(path.join(ws, ".agents")), false);
    });

    it("reports the failure as skipped when the symlink parent is a regular file", () => {
      const ws = newWorkspace();
      writeFixture(path.join(ws, ".agents"), "this is a file, not a directory\n");

      const result = run(ws, profileFor("none", {}, onlyProvider("agents")));

      const entry = result.skipped.find((s) => s.startsWith(path.join(ws, ".agents", "skills")));
      assert.ok(
        entry,
        `expected a skipped entry for the symlink, got ${JSON.stringify(result.skipped)}`,
      );
      assert.match(entry, /ENOTDIR|EEXIST|ENOENT/);
      assert.equal(fs.statSync(path.join(ws, ".agents")).isFile(), true);
    });
  });
});
