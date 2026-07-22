import * as fs from "node:fs";
import * as path from "node:path";
import type { HarnessProfile, ProviderId } from "../domain/types";
import { SUPPORTED_LANGS } from "../domain/types";
import { enabledProviders } from "../profile/defaults";
import { buildProjectConfig, PROJECT_JSON_REL } from "../profile/projectJson";
import { walkFiles } from "../library/ensure";

export interface ApplyResult {
  written: string[];
  skipped: string[];
  symlinks: string[];
  errors: string[];
}

export interface ApplyOptions {
  workspaceRoot: string;
  libraryRoot: string;
  seedRoot: string;
  profile: HarnessProfile;
  extensionVersion?: string;
  dryRun?: boolean;
}

function ensureDir(p: string, dry: boolean, written: string[]): void {
  if (!fs.existsSync(p)) {
    written.push(p + "/");
    if (!dry) fs.mkdirSync(p, { recursive: true });
  }
}

function writeFile(
  dest: string,
  content: string,
  dry: boolean,
  written: string[],
  skipped: string[],
  mode: HarnessProfile["options"]["refreshMode"],
): void {
  if (fs.existsSync(dest) && mode === "skip-existing") {
    skipped.push(dest);
    return;
  }
  written.push(dest);
  if (!dry) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content, "utf8");
  }
}

function copyFile(
  src: string,
  dest: string,
  dry: boolean,
  written: string[],
  skipped: string[],
  mode: HarnessProfile["options"]["refreshMode"],
): void {
  if (fs.existsSync(dest) && mode === "skip-existing") {
    skipped.push(dest);
    return;
  }
  // refresh-harness always overwrites kit-owned under .harness
  if (
    fs.existsSync(dest) &&
    mode === "refresh-harness" &&
    !dest.includes(`${path.sep}.harness${path.sep}`) &&
    !dest.replace(/\\/g, "/").includes("/.harness/")
  ) {
    skipped.push(dest);
    return;
  }
  written.push(dest);
  if (!dry) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function safeLinkDir(
  dest: string,
  relTarget: string,
  dry: boolean,
  symlinks: string[],
  skipped: string[],
  mode: HarnessProfile["options"]["refreshMode"],
): void {
  try {
    let st: fs.Stats | null = null;
    try {
      st = fs.lstatSync(dest);
    } catch {
      st = null;
    }

    if (st?.isSymbolicLink()) {
      const cur = fs.readlinkSync(dest);
      if (cur === relTarget) return;
      if (mode === "skip-existing") {
        skipped.push(dest);
        return;
      }
      if (!dry) fs.unlinkSync(dest);
    } else if (st) {
      // real file/dir — never delete without force
      if (mode !== "force") {
        skipped.push(`${dest} (real path, not symlink)`);
        return;
      }
      if (!dry) fs.rmSync(dest, { recursive: true, force: true });
    }

    symlinks.push(`${dest} -> ${relTarget}`);
    if (!dry) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.symlinkSync(relTarget, dest);
    }
  } catch (e) {
    skipped.push(`${dest} (${e instanceof Error ? e.message : String(e)})`);
  }
}

function providerInstructions(label: string): string {
  return `# ${label} Instructions — context-kit

This project is bootstrapped with Context Kit (VS Code extension).
Provider-neutral content lives in \`.harness/\`; this file is ${label}-specific glue only.

## Where things are

- \`AGENTS.md\` (repo root) — tactical conventions. Read this first when present.
- \`.harness/skills/*/SKILL.md\` — reusable skills.
- \`.harness/commands/*.md\` — command/playbook definitions.
- \`.harness/rules/*.md\`, \`.harness/checklists/*.md\` — language rules and gates.
- \`.context-kit/project.json\` — harness profile applied to this project.

## Conventions

- No emojis in documentation.
- Commits: Conventional Commits in English.
- Quality gate: \`make check\` / \`make check-strict\` when a Makefile is present.
`;
}

/**
 * Apply harness assets from library (+ seed lang verifications) into a workspace.
 */
export function applyHarness(opts: ApplyOptions): ApplyResult {
  const { workspaceRoot, libraryRoot, seedRoot, profile } = opts;
  const dry = !!opts.dryRun;
  const mode =
    profile.options.refreshMode === "force"
      ? "force"
      : profile.options.refreshMode === "refresh-harness"
        ? "refresh-harness"
        : "skip-existing";
  // For .harness kit assets prefer overwrite on refresh
  const harnessMode: HarnessProfile["options"]["refreshMode"] =
    mode === "skip-existing" ? "skip-existing" : "force";

  const written: string[] = [];
  const skipped: string[] = [];
  const symlinks: string[] = [];
  const errors: string[] = [];

  const harness = path.join(workspaceRoot, ".harness");
  ensureDir(harness, dry, written);

  // Copy shared library assets into .harness
  const copyKinds = [
    "skills",
    "commands",
    "agents",
    "checklists",
    "templates",
    "prompts",
    "rules",
  ] as const;
  for (const k of copyKinds) {
    const srcDir = path.join(libraryRoot, k);
    if (!fs.existsSync(srcDir)) continue;
    for (const rel of walkFiles(srcDir)) {
      const src = path.join(srcDir, rel);
      const dest = path.join(harness, k, rel);
      copyFile(src, dest, dry, written, skipped, harnessMode);
    }
  }

  // Language pack from seed
  const lang = profile.language;
  if (lang !== "none" && lang !== "ask" && SUPPORTED_LANGS.includes(lang)) {
    const langSeed = path.join(seedRoot, lang);
    if (fs.existsSync(langSeed)) {
      for (const sub of ["skills", "commands", "rules"] as const) {
        const d = path.join(langSeed, sub);
        if (!fs.existsSync(d)) continue;
        for (const f of fs.readdirSync(d)) {
          const src = path.join(d, f);
          if (!fs.statSync(src).isFile()) continue;
          if (sub === "skills" && f.endsWith(".md")) {
            const name = f.replace(/\.md$/i, "");
            const dest = path.join(harness, "skills", name, "SKILL.md");
            copyFile(src, dest, dry, written, skipped, harnessMode);
          } else {
            const dest = path.join(harness, sub, f);
            copyFile(src, dest, dry, written, skipped, harnessMode);
          }
        }
      }
      const ver = path.join(langSeed, "verifications");
      if (fs.existsSync(ver)) {
        for (const f of fs.readdirSync(ver)) {
          const src = path.join(ver, f);
          if (!fs.statSync(src).isFile()) continue;
          if (f === "AGENTS.md" && profile.options.writeAgentsMd) {
            copyFile(src, path.join(workspaceRoot, "AGENTS.md"), dry, written, skipped, mode);
          } else if (f === "github-actions-ci.yml" && profile.options.installCiIfMissing) {
            const dest = path.join(workspaceRoot, ".github", "workflows", "ci.yml");
            if (fs.existsSync(dest)) skipped.push(dest);
            else copyFile(src, dest, dry, written, skipped, mode);
          } else if (f === "pre-commit.sh" && profile.options.installPreCommit) {
            // best-effort: copy to .context-kit for user to install; hook path varies
            copyFile(
              src,
              path.join(workspaceRoot, ".context-kit", "pre-commit.sh"),
              dry,
              written,
              skipped,
              harnessMode,
            );
          } else if (
            profile.options.writeMakefile &&
            (f === "Makefile" ||
              f.endsWith(".yml") ||
              f.endsWith(".yaml") ||
              f.endsWith(".json") ||
              f.endsWith(".neon") ||
              f.endsWith(".toml") ||
              f.startsWith("."))
          ) {
            if (f === "AGENTS.md" || f === "pre-commit.sh" || f === "github-actions-ci.yml") {
              continue;
            }
            copyFile(src, path.join(workspaceRoot, f), dry, written, skipped, mode);
          }
        }
      }
    }

    // lang skills from library/langs
    const libLang = path.join(libraryRoot, "langs", lang);
    if (fs.existsSync(libLang)) {
      for (const rel of walkFiles(libLang)) {
        const src = path.join(libLang, rel);
        const dest = path.join(harness, rel);
        copyFile(src, dest, dry, written, skipped, harnessMode);
      }
    }
  }

  // .gitignore .harness
  const gi = path.join(workspaceRoot, ".gitignore");
  const giLine = ".harness/";
  if (fs.existsSync(gi)) {
    const cur = fs.readFileSync(gi, "utf8");
    if (!cur.split(/\r?\n/).some((l) => l.trim() === giLine || l.trim() === ".harness")) {
      written.push(`${gi} (append .harness/)`);
      if (!dry) {
        fs.appendFileSync(
          gi,
          "\n# context-kit harness — self-contained tooling, never versioned\n.harness/\n",
          "utf8",
        );
      }
    }
  } else {
    writeFile(
      gi,
      "# context-kit harness — self-contained tooling, never versioned\n.harness/\n",
      dry,
      written,
      skipped,
      mode,
    );
  }

  // Provider glue (selective)
  const providers = enabledProviders(profile);
  const providerSet = new Set<ProviderId>(providers);

  if (providerSet.has("claude")) {
    safeLinkDir(
      path.join(workspaceRoot, ".claude", "skills"),
      path.join("..", ".harness", "skills"),
      dry,
      symlinks,
      skipped,
      mode,
    );
    safeLinkDir(
      path.join(workspaceRoot, ".claude", "commands"),
      path.join("..", ".harness", "commands"),
      dry,
      symlinks,
      skipped,
      mode,
    );
    safeLinkDir(
      path.join(workspaceRoot, ".claude", "rules"),
      path.join("..", ".harness", "rules"),
      dry,
      symlinks,
      skipped,
      mode,
    );
    safeLinkDir(
      path.join(workspaceRoot, ".claude", "checklists"),
      path.join("..", ".harness", "checklists"),
      dry,
      symlinks,
      skipped,
      mode,
    );
    const napkin = path.join(workspaceRoot, ".claude", "napkin.md");
    if (!fs.existsSync(napkin)) {
      writeFile(
        napkin,
        `# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)

## Shell & Command Reliability

## Domain Behavior Guardrails

## User Directives
`,
        dry,
        written,
        skipped,
        mode,
      );
    } else {
      skipped.push(napkin + " (never overwrite)");
    }
  }

  if (providerSet.has("agents")) {
    safeLinkDir(
      path.join(workspaceRoot, ".agents", "skills"),
      path.join("..", ".harness", "skills"),
      dry,
      symlinks,
      skipped,
      mode,
    );
  }

  const instr: { on: boolean; dir: string; label: string }[] = [
    { on: providerSet.has("grok"), dir: ".grok", label: "Grok" },
    { on: providerSet.has("codex"), dir: ".codex", label: "Codex" },
    { on: providerSet.has("gemini"), dir: ".gemini", label: "Gemini" },
    { on: providerSet.has("devin"), dir: ".devin", label: "Devin" },
  ];
  for (const p of instr) {
    if (!p.on) continue;
    writeFile(
      path.join(workspaceRoot, p.dir, "instructions.md"),
      providerInstructions(p.label),
      dry,
      written,
      skipped,
      mode,
    );
  }

  if (providerSet.has("gemini")) {
    const cmdDir = path.join(harness, "commands");
    if (fs.existsSync(cmdDir)) {
      for (const f of fs.readdirSync(cmdDir)) {
        if (!f.endsWith(".md")) continue;
        const name = f.replace(/\.md$/i, "");
        const title = name;
        const toml = `description = "${title.replace(/"/g, "")}"
prompt = """
Follow the instructions in .harness/commands/${name}.md in this repository.
"""
`;
        writeFile(
          path.join(workspaceRoot, ".gemini", "commands", `${name}.toml`),
          toml,
          dry,
          written,
          skipped,
          harnessMode,
        );
      }
    }
  }

  // project.json always
  const projectCfg = buildProjectConfig(profile, opts.extensionVersion);
  writeFile(
    path.join(workspaceRoot, PROJECT_JSON_REL),
    JSON.stringify(projectCfg, null, 2) + "\n",
    dry,
    written,
    skipped,
    "force",
  );

  return { written, skipped, symlinks, errors };
}
