import * as fs from "node:fs";
import * as path from "node:path";
import { contentHash } from "../domain/hash";
import type { AssetKind, AssetMeta, LibraryManifest, SeedManifest } from "../domain/types";
import { mapSeedFileToLibraryRel, metaRelativePath } from "../domain/paths";
import { compareSeedVersions } from "../domain/seedVersion";
import { walkFiles } from "./ensure";

export { mapSeedFileToLibraryRel };

export type DirtyResolution = "skip" | "replace" | "keep-both";

export type ClassifiedStatus = "missing" | "clean" | "dirty" | "user";

export interface SeedMappedAsset {
  kind: AssetKind;
  name: string;
  libraryRel: string;
  seedRel: string;
  seedContent: string;
  seedHash: string;
}

export interface ClassifiedSeedAsset extends SeedMappedAsset {
  status: ClassifiedStatus;
  libraryAbs: string;
  meta?: AssetMeta | null;
}

export interface LibraryUpdatePlan {
  packageSeedVersion: string;
  librarySeedVersion: string | null;
  needsUpdate: boolean;
  missing: ClassifiedSeedAsset[];
  clean: ClassifiedSeedAsset[];
  dirty: ClassifiedSeedAsset[];
  userOwned: ClassifiedSeedAsset[];
}

export interface ApplyUpdateResult {
  applied: string[];
  skippedDirty: string[];
  replaced: string[];
  keptBoth: string[];
  librarySeedVersion: string;
}

function readJson(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function safeMetaName(name: string): string {
  return name.replace(/\//g, "__");
}

export function listSeedMappedAssets(seedRoot: string): SeedMappedAsset[] {
  const out: SeedMappedAsset[] = [];
  for (const seedRel of walkFiles(seedRoot)) {
    if (seedRel === "seed.json" || seedRel.endsWith(`${path.sep}seed.json`)) continue;
    const mapped = mapSeedFileToLibraryRel(seedRel.replace(/\\/g, "/"));
    if (!mapped) continue;
    const abs = path.join(seedRoot, seedRel);
    const seedContent = fs.readFileSync(abs, "utf8");
    out.push({
      kind: mapped.kind,
      name: mapped.name,
      libraryRel: mapped.rel,
      seedRel: seedRel.replace(/\\/g, "/"),
      seedContent,
      seedHash: contentHash(seedContent),
    });
  }
  return out;
}

export function readSeedVersion(seedRoot: string): string {
  const m = readJson(path.join(seedRoot, "seed.json")) as SeedManifest | null;
  return m?.seedVersion ?? "0.0.0-dev";
}

export function readLibrarySeedVersion(libraryRoot: string): string | null {
  const m = readJson(path.join(libraryRoot, "library.json")) as LibraryManifest | null;
  return m?.seedVersion ?? null;
}

/**
 * Package seed version the user last acknowledged. Falls back to `seedVersion` for legacy
 * manifests (every install in the field predates this field), then null when unknown.
 */
export function readAcknowledgedSeedVersion(libraryRoot: string): string | null {
  const m = readJson(path.join(libraryRoot, "library.json")) as LibraryManifest | null;
  return m?.acknowledgedSeedVersion ?? m?.seedVersion ?? null;
}

export function classifySeedAsset(
  libraryRoot: string,
  asset: SeedMappedAsset,
): ClassifiedSeedAsset {
  const libraryAbs = path.join(libraryRoot, asset.libraryRel);
  const metaPath = path.join(libraryRoot, metaRelativePath(asset.kind, safeMetaName(asset.name)));
  const meta = readJson(metaPath) as AssetMeta | null;

  if (!fs.existsSync(libraryAbs)) {
    return { ...asset, status: "missing", libraryAbs, meta };
  }
  if (meta?.origin === "user") {
    return { ...asset, status: "user", libraryAbs, meta };
  }
  const current = contentHash(fs.readFileSync(libraryAbs, "utf8"));
  if (!meta || current !== meta.seedHashWhenInstalled) {
    return { ...asset, status: "dirty", libraryAbs, meta };
  }
  return { ...asset, status: "clean", libraryAbs, meta };
}

export function planLibraryUpdate(libraryRoot: string, seedRoot: string): LibraryUpdatePlan {
  const packageSeedVersion = readSeedVersion(seedRoot);
  const librarySeedVersion = readLibrarySeedVersion(libraryRoot);
  const mapped = listSeedMappedAssets(seedRoot);
  const missing: ClassifiedSeedAsset[] = [];
  const clean: ClassifiedSeedAsset[] = [];
  const dirty: ClassifiedSeedAsset[] = [];
  const userOwned: ClassifiedSeedAsset[] = [];

  for (const a of mapped) {
    const c = classifySeedAsset(libraryRoot, a);
    switch (c.status) {
      case "missing":
        missing.push(c);
        break;
      case "clean":
        clean.push(c);
        break;
      case "dirty":
        dirty.push(c);
        break;
      case "user":
        userOwned.push(c);
        break;
      default: {
        const _x: never = c.status;
        void _x;
      }
    }
  }

  // A strictly older incoming seed is a downgrade, never an update — whatever its contents say.
  // At the same version, missing or drifted assets still warrant a repair pass. The comparison
  // runs against the *acknowledged* version, not the installed one: skipping a dirty asset
  // acknowledges the current package without bumping seedVersion, and must stop the nag.
  const versionCmp = compareSeedVersions(
    readAcknowledgedSeedVersion(libraryRoot),
    packageSeedVersion,
  );
  const needsUpdate =
    versionCmp < 0 ||
    (versionCmp === 0 &&
      (missing.length > 0 || clean.some((c) => c.seedHash !== c.meta?.contentHash)));

  return {
    packageSeedVersion,
    librarySeedVersion,
    needsUpdate,
    missing,
    clean,
    dirty,
    userOwned,
  };
}

function writeSeedAsset(libraryRoot: string, asset: SeedMappedAsset, seedVersion: string): void {
  const dest = path.join(libraryRoot, asset.libraryRel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, asset.seedContent, "utf8");
  const meta: AssetMeta = {
    name: asset.name,
    kind: asset.kind,
    origin: "seed",
    seedVersion,
    contentHash: asset.seedHash,
    seedHashWhenInstalled: asset.seedHash,
    relativePath: asset.libraryRel,
  };
  writeJson(path.join(libraryRoot, metaRelativePath(asset.kind, safeMetaName(asset.name))), meta);
}

/** Apply missing + clean seed assets; leave dirty/user untouched. */
export function applyCleanLibraryUpdate(
  libraryRoot: string,
  seedRoot: string,
  plan?: LibraryUpdatePlan,
): { applied: string[]; dirty: ClassifiedSeedAsset[]; packageSeedVersion: string } {
  const p = plan ?? planLibraryUpdate(libraryRoot, seedRoot);
  const applied: string[] = [];
  for (const a of [...p.missing, ...p.clean]) {
    // Only rewrite clean if seed content differs from installed hash (new seed body)
    if (a.status === "clean" && a.meta && a.seedHash === a.meta.seedHashWhenInstalled) {
      // same content — still refresh meta seedVersion
      const metaPath = path.join(libraryRoot, metaRelativePath(a.kind, safeMetaName(a.name)));
      const meta = { ...a.meta, seedVersion: p.packageSeedVersion };
      writeJson(metaPath, meta);
      continue;
    }
    writeSeedAsset(libraryRoot, a, p.packageSeedVersion);
    applied.push(a.libraryRel);
  }
  bumpLibraryManifest(libraryRoot, p.packageSeedVersion, p.dirty.length === 0);
  return { applied, dirty: p.dirty, packageSeedVersion: p.packageSeedVersion };
}

function bumpLibraryManifest(libraryRoot: string, seedVersion: string, setVersion: boolean): void {
  const libManifestPath = path.join(libraryRoot, "library.json");
  const existing = readJson(libManifestPath) as LibraryManifest | null;
  const now = new Date().toISOString();
  writeJson(libManifestPath, {
    seedVersion: setVersion ? seedVersion : (existing?.seedVersion ?? seedVersion),
    // Always acknowledge the package the user just acted on, even when a skipped dirty asset
    // pins seedVersion to the old value — otherwise the update prompt would never clear.
    acknowledgedSeedVersion: seedVersion,
    installedAt: existing?.installedAt ?? now,
    lastUpdatedAt: now,
  } satisfies LibraryManifest);
}

/** Path for user backup: insert `.user` before final extension. */
export function userBackupPath(libraryAbs: string): string {
  const dir = path.dirname(libraryAbs);
  const base = path.basename(libraryAbs);
  const ext = path.extname(base);
  const stem = ext ? base.slice(0, -ext.length) : base;
  return path.join(dir, `${stem}.user${ext}`);
}

export function resolveDirtyAsset(
  libraryRoot: string,
  asset: ClassifiedSeedAsset,
  resolution: DirtyResolution,
  packageSeedVersion: string,
): { action: DirtyResolution; backupPath?: string } {
  if (asset.status !== "dirty") {
    throw new Error(`resolveDirtyAsset: expected dirty, got ${asset.status} for ${asset.name}`);
  }
  if (resolution === "skip") {
    return { action: "skip" };
  }
  if (resolution === "replace") {
    writeSeedAsset(libraryRoot, asset, packageSeedVersion);
    return { action: "replace" };
  }
  // keep-both
  const backup = userBackupPath(asset.libraryAbs);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(asset.libraryAbs, backup);
  writeSeedAsset(libraryRoot, asset, packageSeedVersion);
  return { action: "keep-both", backupPath: backup };
}

/**
 * Full update: apply clean/missing, then resolve each dirty asset with the given map
 * (name → resolution). Unlisted dirty assets are skipped.
 */
export function applyLibraryUpdate(
  libraryRoot: string,
  seedRoot: string,
  dirtyResolutions: Partial<Record<string, DirtyResolution>> = {},
): ApplyUpdateResult {
  const plan = planLibraryUpdate(libraryRoot, seedRoot);
  const { applied, dirty, packageSeedVersion } = applyCleanLibraryUpdate(
    libraryRoot,
    seedRoot,
    plan,
  );
  const skippedDirty: string[] = [];
  const replaced: string[] = [];
  const keptBoth: string[] = [];

  for (const d of dirty) {
    const res = dirtyResolutions[d.name] ?? dirtyResolutions[d.libraryRel] ?? "skip";
    const result = resolveDirtyAsset(libraryRoot, d, res, packageSeedVersion);
    if (result.action === "skip") skippedDirty.push(d.libraryRel);
    else if (result.action === "replace") replaced.push(d.libraryRel);
    else keptBoth.push(d.libraryRel);
  }

  // After dirty resolved, if none remain dirty (all replace/keep-both or none), bump version
  const after = planLibraryUpdate(libraryRoot, seedRoot);
  const allDirtyHandled = after.dirty.length === 0;
  bumpLibraryManifest(libraryRoot, packageSeedVersion, allDirtyHandled);

  return {
    applied,
    skippedDirty,
    replaced,
    keptBoth,
    librarySeedVersion: readLibrarySeedVersion(libraryRoot) ?? packageSeedVersion,
  };
}
