import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import type { CatalogAsset, HarnessProfile, LanguageId, ProviderId } from "./domain/types";
import { ALL_PROVIDERS, SUPPORTED_LANGS } from "./domain/types";
import { assetRelativePath } from "./domain/paths";
import { isValidSlug, validateSkillMeta } from "./domain/validate";
import { ensureLibraryFromSeed, writeUserAssetMeta } from "./library/ensure";
import {
  applyCleanLibraryUpdate,
  applyLibraryUpdate,
  planLibraryUpdate,
} from "./library/seedUpdate";
import { scanAll } from "./library/scan";
import { factoryDefaultProfile, enabledProviders } from "./profile/defaults";
import { detectLanguageHints } from "./profile/detectLang";
import { parseProjectConfig, PROJECT_JSON_REL } from "./profile/projectJson";
import { applyHarness } from "./publish/applyHarness";
import {
  defaultSkillRoots,
  deployAssetToRuntime,
  type RuntimeTarget,
} from "./publish/deployRuntime";
import { CatalogTreeProvider } from "./ui/treeProvider";
import { openActivityMapPanel } from "./ui/activityPanel";
import { openCoveragePanel } from "./ui/coveragePanel";
import { openUpdateLibraryPanel } from "./ui/updatePanel";
import { openOrchestratorPanel } from "./ui/orchestratorPanel";
import { runLaunchPad } from "./ui/launchPad";
import { getOutput, log } from "./output";
import * as os from "node:os";

let libraryRoot = "";
let seedRoot = "";
let tree: CatalogTreeProvider;
let status: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext): void {
  libraryRoot = context.globalStorageUri.fsPath;
  seedRoot = path.join(context.extensionPath, "resources", "seed");

  fs.mkdirSync(libraryRoot, { recursive: true });

  try {
    if (fs.existsSync(path.join(seedRoot, "seed.json"))) {
      ensureLibraryFromSeed(libraryRoot, seedRoot);
      log(`Library ready at ${libraryRoot}`);
    } else {
      log(`No seed at ${seedRoot} — run npm run sync-seed before packaging.`);
      vscode.window.showWarningMessage(
        "Context Kit: package seed missing. Maintainer should run npm run sync-seed.",
      );
    }
  } catch (e) {
    log(`Seed install error: ${e instanceof Error ? e.message : String(e)}`);
  }

  ensureDefaultProfile(context);

  tree = new CatalogTreeProvider();
  context.subscriptions.push(vscode.window.registerTreeDataProvider("contextKit.catalog", tree));

  status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
  status.command = "contextKit.scan";
  context.subscriptions.push(status);

  const cmds: [string, (...args: never[]) => unknown][] = [
    ["contextKit.scan", () => scanAndRefresh()],
    ["contextKit.refreshTree", () => scanAndRefresh()],
    ["contextKit.openAsset", (asset: CatalogAsset) => openAsset(asset)],
    ["contextKit.newSkill", () => newSkill(context)],
    ["contextKit.newCommand", () => newCommand(context)],
    ["contextKit.editDefaults", () => editDefaults(context)],
    ["contextKit.applyHarness", () => runApplyHarness(context)],
    ["contextKit.showLibraryPath", () => showLibraryPath()],
    ["contextKit.reseedFromPackage", () => reseed(context)],
    ["contextKit.updateLibrary", () => updateLibrary(context)],
    ["contextKit.deployToRuntime", () => deployToRuntime(context)],
    ["contextKit.newWorkflow", () => newWorkflow(context)],
    ["contextKit.openActivityMap", () => openActivityMapPanel(context)],
    ["contextKit.openCoverage", () => openCoveragePanel(context, libraryRoot)],
    ["contextKit.launchPad", () => runLaunchPad(libraryRoot)],
    ["contextKit.openOrchestrator", () => openOrchestratorPanel(context, libraryRoot)],
  ];
  for (const [id, fn] of cmds) {
    context.subscriptions.push(vscode.commands.registerCommand(id, fn));
  }

  const scanOn = vscode.workspace
    .getConfiguration("contextKit")
    .get<boolean>("scanOnStartup", true);
  if (scanOn) {
    void scanAndRefresh();
  }

  getOutput().appendLine("Context Kit activated.");
}

export function deactivate(): void {
  /* noop */
}

function ensureDefaultProfile(context: vscode.ExtensionContext): void {
  const key = "harness.defaultProfile";
  if (!context.globalState.get(key)) {
    void context.globalState.update(key, factoryDefaultProfile());
  }
}

function getDefaultProfile(context: vscode.ExtensionContext): HarnessProfile {
  return (
    (context.globalState.get("harness.defaultProfile") as HarnessProfile | undefined) ??
    factoryDefaultProfile()
  );
}

async function scanAndRefresh(): Promise<CatalogAsset[]> {
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const assets = scanAll(libraryRoot, folder);
  tree.refresh(assets);
  const lib = assets.filter((a) => a.scope === "library");
  const skills = lib.filter((a) => a.kind === "skill").length;
  const commands = lib.filter((a) => a.kind === "command").length;
  status.text = `$(library) CK ${skills}s/${commands}c`;
  status.tooltip = `Context Kit library: ${lib.length} assets\n${libraryRoot}`;
  status.show();
  log(`Scan: ${assets.length} assets (library=${lib.length})`);
  return assets;
}

async function openAsset(asset?: CatalogAsset): Promise<void> {
  if (!asset?.absolutePath) return;
  const doc = await vscode.workspace.openTextDocument(asset.absolutePath);
  await vscode.window.showTextDocument(doc);
}

async function showLibraryPath(): Promise<void> {
  const choice = await vscode.window.showInformationMessage(
    `Library: ${libraryRoot}`,
    "Copy path",
    "Open folder",
  );
  if (choice === "Copy path") {
    await vscode.env.clipboard.writeText(libraryRoot);
  } else if (choice === "Open folder") {
    await vscode.commands.executeCommand("revealFileInOS", vscode.Uri.file(libraryRoot));
  }
}

async function reseed(context: vscode.ExtensionContext): Promise<void> {
  const ok = await vscode.window.showWarningMessage(
    "Reseed overwrites unmodified seed assets. User-created and edited assets are kept.",
    { modal: true },
    "Reseed",
  );
  if (ok !== "Reseed") return;
  const result = applyCleanLibraryUpdate(libraryRoot, seedRoot);
  log(
    `Reseed applied=${result.applied.length} dirtyLeft=${result.dirty.length} seed=${result.packageSeedVersion}`,
  );
  await scanAndRefresh();
  vscode.window.showInformationMessage(
    `Context Kit: reseeded clean assets (${result.applied.length} written, ${result.dirty.length} dirty skipped).`,
  );
  void context;
}

async function updateLibrary(context: vscode.ExtensionContext): Promise<void> {
  if (!fs.existsSync(path.join(seedRoot, "seed.json"))) {
    vscode.window.showErrorMessage("Context Kit: package seed missing.");
    return;
  }
  const plan = planLibraryUpdate(libraryRoot, seedRoot);
  log(
    `Update plan: package=${plan.packageSeedVersion} library=${plan.librarySeedVersion ?? "none"} ` +
      `missing=${plan.missing.length} clean=${plan.clean.length} dirty=${plan.dirty.length} user=${plan.userOwned.length}`,
  );

  if (!plan.needsUpdate && plan.dirty.length === 0) {
    vscode.window.showInformationMessage(
      `Context Kit: library already at seed ${plan.packageSeedVersion}.`,
    );
    return;
  }

  // No dirty items — apply clean/missing silently
  if (plan.dirty.length === 0) {
    const result = applyLibraryUpdate(libraryRoot, seedRoot, {});
    log(`Update done (clean only): applied=${result.applied.length}`);
    await scanAndRefresh();
    vscode.window.showInformationMessage(
      `Context Kit: library updated to seed ${result.librarySeedVersion}.`,
    );
    return;
  }

  openUpdateLibraryPanel(context, libraryRoot, seedRoot, async () => {
    await scanAndRefresh();
  });
  void context;
}

async function newSkill(context: vscode.ExtensionContext): Promise<void> {
  const name = await vscode.window.showInputBox({
    prompt: "Skill name (slug)",
    validateInput: (v) =>
      isValidSlug(v.trim()) ? undefined : "Use lowercase slug (a-z, 0-9, hyphens)",
  });
  if (!name) return;
  const description = await vscode.window.showInputBox({
    prompt: "Description (triggers / when to use)",
    placeHolder: "Use when the user asks to…",
  });
  const issues = validateSkillMeta({ name, description });
  const errors = issues.filter((i) => i.level === "error");
  if (errors.length) {
    vscode.window.showErrorMessage(errors.map((e) => e.message).join("; "));
    return;
  }
  const rel = assetRelativePath("skill", name);
  const abs = path.join(libraryRoot, rel);
  if (fs.existsSync(abs)) {
    vscode.window.showErrorMessage(`Skill already exists: ${name}`);
    return;
  }
  const body = `---
name: ${name}
description: ${description ?? ""}
---

# ${name}

## When to use

## Steps

1. 
`;
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, body, "utf8");
  writeUserAssetMeta(libraryRoot, "skill", name, rel, body);
  await scanAndRefresh();
  await openAsset({
    id: `library:skill:${name}`,
    kind: "skill",
    name,
    absolutePath: abs,
    relativePath: rel,
    scope: "library",
    frontmatter: {},
  });
  void context;
}

async function newCommand(context: vscode.ExtensionContext): Promise<void> {
  const name = await vscode.window.showInputBox({
    prompt: "Command name (slug, without slash)",
    validateInput: (v) =>
      isValidSlug(v.trim()) ? undefined : "Use lowercase slug (a-z, 0-9, hyphens)",
  });
  if (!name) return;
  const rel = assetRelativePath("command", name);
  const abs = path.join(libraryRoot, rel);
  if (fs.existsSync(abs)) {
    vscode.window.showErrorMessage(`Command already exists: ${name}`);
    return;
  }
  const body = `# ${name}

## Input

## Steps

1. 
`;
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, body, "utf8");
  writeUserAssetMeta(libraryRoot, "command", name, rel, body);
  await scanAndRefresh();
  await openAsset({
    id: `library:command:${name}`,
    kind: "command",
    name,
    absolutePath: abs,
    relativePath: rel,
    scope: "library",
    frontmatter: {},
  });
  void context;
}

async function newWorkflow(context: vscode.ExtensionContext): Promise<void> {
  const name = await vscode.window.showInputBox({
    prompt: "Workflow name (slug)",
    validateInput: (v) =>
      isValidSlug(v.trim()) ? undefined : "Use lowercase slug (a-z, 0-9, hyphens)",
  });
  if (!name) return;
  const rel = assetRelativePath("workflow", name);
  const abs = path.join(libraryRoot, rel);
  if (fs.existsSync(abs)) {
    vscode.window.showErrorMessage(`Workflow already exists: ${name}`);
    return;
  }
  const body = `// ${name} — Grok workflow stub (edit with /create-workflow guidance)
let meta = #{
    name: "${name}",
    description: "TODO",
};
phase("Main");
complete(#{ ok: true });
`;
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, body, "utf8");
  writeUserAssetMeta(libraryRoot, "workflow", name, rel, body);
  await scanAndRefresh();
  await openAsset({
    id: `library:workflow:${name}`,
    kind: "workflow",
    name,
    absolutePath: abs,
    relativePath: rel,
    scope: "library",
    frontmatter: {},
  });
  void context;
}

function resolveUserSkillRoots(): Partial<Record<RuntimeTarget, string>> {
  const defaults = defaultSkillRoots(os.homedir());
  const cfg = vscode.workspace
    .getConfiguration("contextKit")
    .get<Record<string, string>>("userSkillRoots", {});
  return {
    claude: cfg.claude?.trim() || defaults.claude,
    grok: cfg.grok?.trim() || defaults.grok,
    agents: cfg.agents?.trim() || defaults.agents,
  };
}

async function deployToRuntime(context: vscode.ExtensionContext): Promise<void> {
  const skillsDir = path.join(libraryRoot, "skills");
  if (!fs.existsSync(skillsDir)) {
    vscode.window.showWarningMessage("Context Kit: no skills in library yet.");
    return;
  }
  const names = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((n) => fs.existsSync(path.join(skillsDir, n, "SKILL.md")));
  if (!names.length) {
    vscode.window.showWarningMessage("Context Kit: no skill folders with SKILL.md found.");
    return;
  }
  const skill = await vscode.window.showQuickPick(names, {
    title: "Deploy skill to user runtime",
  });
  if (!skill) return;

  const roots = resolveUserSkillRoots();
  const targetItems = (Object.entries(roots) as [RuntimeTarget, string | undefined][]).map(
    ([id, root]) => ({
      label: id,
      description: root ?? "",
      picked: id === "claude" || id === "grok",
    }),
  );
  const picked = await vscode.window.showQuickPick(targetItems, {
    title: "Target runtimes",
    canPickMany: true,
  });
  if (!picked?.length) return;

  const targets: Partial<Record<RuntimeTarget, string>> = {};
  for (const p of picked) {
    const root = roots[p.label as RuntimeTarget];
    if (root) targets[p.label as RuntimeTarget] = root;
  }

  const dry = await vscode.window.showQuickPick(
    [
      { label: "Deploy", dryRun: false },
      { label: "Dry-run only", dryRun: true },
    ],
    { title: "Confirm" },
  );
  if (!dry) return;

  const result = deployAssetToRuntime({
    libraryRoot,
    kind: "skill",
    name: skill,
    targets,
    dryRun: dry.dryRun,
  });
  getOutput().show(true);
  log(
    `Deploy ${skill}: written=${result.written.length} skipped=${result.skipped.length} errors=${result.errors.length}`,
  );
  result.written.forEach((w) => log(`  W ${w}`));
  result.errors.forEach((e) => log(`  E ${e}`));
  if (result.errors.length) {
    vscode.window.showErrorMessage(`Context Kit: deploy had ${result.errors.length} error(s).`);
  } else {
    vscode.window.showInformationMessage(
      dry.dryRun
        ? `Dry-run: would write ${result.written.length} path(s).`
        : `Deployed ${skill} to ${result.written.length} path(s).`,
    );
  }
  void context;
}

async function editDefaults(context: vscode.ExtensionContext): Promise<void> {
  const profile = await customizeProfile(
    getDefaultProfile(context),
    "Edit default harness profile",
  );
  if (!profile) return;
  profile.name = "default";
  await context.globalState.update("harness.defaultProfile", profile);
  vscode.window.showInformationMessage(
    `Defaults saved: lang=${profile.language}, providers=${enabledProviders(profile).join(",")}`,
  );
}

async function customizeProfile(
  base: HarnessProfile,
  title: string,
): Promise<HarnessProfile | undefined> {
  const langPick = await vscode.window.showQuickPick(
    [
      ...SUPPORTED_LANGS.map((l) => ({ label: l, description: "language pack" })),
      { label: "none", description: "shared only, no language pack" },
      { label: "ask", description: "always ask on apply" },
    ],
    { title: `${title} — language`, placeHolder: `current: ${base.language}` },
  );
  if (!langPick) return undefined;

  const providerItems = ALL_PROVIDERS.map((p) => ({
    label: p,
    picked: base.providers[p],
  }));
  const picked = await vscode.window.showQuickPick(providerItems, {
    title: `${title} — providers`,
    canPickMany: true,
  });
  if (!picked) return undefined;

  const providers = {} as Record<ProviderId, boolean>;
  for (const p of ALL_PROVIDERS) {
    providers[p] = picked.some((x) => x.label === p);
  }

  const refresh = await vscode.window.showQuickPick(
    [
      { label: "skip-existing", description: "Do not overwrite existing root files" },
      { label: "refresh-harness", description: "Refresh .harness assets" },
      { label: "force", description: "Overwrite more aggressively" },
    ],
    { title: "Refresh mode" },
  );
  if (!refresh) return undefined;

  return {
    version: 1,
    name: base.name,
    language: langPick.label as LanguageId,
    providers,
    options: {
      ...base.options,
      writeMakefile: langPick.label !== "none",
      refreshMode: refresh.label as HarnessProfile["options"]["refreshMode"],
    },
    projectRegistryName: base.projectRegistryName,
  };
}

async function runApplyHarness(context: vscode.ExtensionContext): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!folder) {
    vscode.window.showErrorMessage("Open a workspace folder first.");
    return;
  }

  const defaults = getDefaultProfile(context);
  const existingPath = path.join(folder, PROJECT_JSON_REL);
  let fromProject: HarnessProfile | undefined;
  if (fs.existsSync(existingPath)) {
    const parsed = parseProjectConfig(fs.readFileSync(existingPath, "utf8"));
    fromProject = parsed?.profile;
  }

  const hints = detectLanguageHints(folder);
  const mode = await vscode.window.showQuickPick(
    [
      {
        label: "Use my defaults",
        description: `lang=${defaults.language} · ${enabledProviders(defaults).join(",")}`,
      },
      {
        label: "Customize from defaults…",
        description: "Edit language, providers, options",
      },
      ...(fromProject
        ? [
            {
              label: "Reuse .context-kit/project.json",
              description: `lang=${fromProject.language} · ${enabledProviders(fromProject).join(",")}`,
            },
          ]
        : []),
      {
        label: "Edit defaults…",
        description: "Change global defaults first",
      },
    ],
    {
      title: `Apply harness to ${path.basename(folder)}`,
      placeHolder: hints.length ? `Detected: ${hints.join(", ")}` : "No language hints detected",
    },
  );
  if (!mode) return;

  if (mode.label === "Edit defaults…") {
    await editDefaults(context);
    return runApplyHarness(context);
  }

  let profile: HarnessProfile;
  if (mode.label === "Use my defaults") {
    profile = {
      ...defaults,
      providers: { ...defaults.providers },
      options: { ...defaults.options },
    };
  } else if (mode.label.startsWith("Reuse")) {
    profile = {
      ...fromProject!,
      providers: { ...fromProject!.providers },
      options: { ...fromProject!.options },
    };
  } else {
    const customized = await customizeProfile(defaults, "Apply harness");
    if (!customized) return;
    profile = customized;
    const save = await vscode.window.showQuickPick(
      [
        { label: "No", description: "Only this apply" },
        { label: "Yes", description: "Save as my new defaults" },
      ],
      { title: "Save these choices as defaults?" },
    );
    if (save?.label === "Yes") {
      profile.name = "default";
      await context.globalState.update("harness.defaultProfile", profile);
    }
  }

  // resolve language ask
  if (profile.language === "ask") {
    const pick = await vscode.window.showQuickPick(
      [
        ...hints.map((h) => ({ label: h, description: "detected" })),
        ...SUPPORTED_LANGS.filter((l) => !hints.includes(l)).map((l) => ({
          label: l,
          description: "language pack",
        })),
        { label: "none", description: "shared only" },
      ],
      { title: "Select project language" },
    );
    if (!pick) return;
    profile.language = pick.label as LanguageId;
    profile.options.writeMakefile = profile.language !== "none";
  }

  // dry-run first
  const dry = applyHarness({
    workspaceRoot: folder,
    libraryRoot,
    seedRoot,
    profile,
    extensionVersion: context.extension.packageJSON.version,
    dryRun: true,
  });

  const summary = [
    `Providers: ${enabledProviders(profile).join(", ") || "(none)"}`,
    `Language: ${profile.language}`,
    `Would write: ${dry.written.length}`,
    `Symlinks: ${dry.symlinks.length}`,
    `Skip: ${dry.skipped.length}`,
  ].join("\n");

  const confirm = await vscode.window.showInformationMessage(
    `Apply harness?\n\n${summary}`,
    { modal: true },
    "Apply",
    "Show dry-run details",
  );
  if (confirm === "Show dry-run details") {
    getOutput().show(true);
    log("--- dry-run written ---");
    dry.written.forEach((w) => log(`  W ${w}`));
    log("--- symlinks ---");
    dry.symlinks.forEach((s) => log(`  L ${s}`));
    log("--- skipped ---");
    dry.skipped.forEach((s) => log(`  S ${s}`));
    const again = await vscode.window.showInformationMessage("Apply now?", "Apply", "Cancel");
    if (again !== "Apply") return;
  } else if (confirm !== "Apply") {
    return;
  }

  const result = applyHarness({
    workspaceRoot: folder,
    libraryRoot,
    seedRoot,
    profile,
    extensionVersion: context.extension.packageJSON.version,
    dryRun: false,
  });

  getOutput().show(true);
  log(`=== Apply harness → ${folder} ===`);
  log(
    `written=${result.written.length} symlinks=${result.symlinks.length} skipped=${result.skipped.length}`,
  );
  result.errors.forEach((e) => log(`ERROR ${e}`));
  await scanAndRefresh();
  vscode.window.showInformationMessage(
    `Context Kit applied: ${result.written.length} writes, ${result.symlinks.length} links. See Output.`,
  );
}
