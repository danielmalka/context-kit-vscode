import * as fs from "node:fs";
import * as path from "node:path";
import { contentHash } from "../domain/hash";
import type { AssetKind, AssetMeta, LibraryManifest, SeedManifest } from "../domain/types";
import { assetRelativePath, metaRelativePath } from "../domain/paths";
import { kindFromRelativePath, nameFromPath } from "../domain/parseAsset";

export interface LibraryPaths {
  root: string;
  seedVersion: string;
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

/**
 * Map seed layout (flat shared/skills/foo.md) → library nested skills/foo/SKILL.md
 */
function mapSeedFileToLibraryRel(
  seedRel: string,
): { kind: AssetKind; name: string; rel: string } | null {
  const n = seedRel.replace(/\\/g, "/");
  // shared/skills/name.md
  let m = n.match(/^shared\/(skills|commands|checklists|templates|prompts)\/([^/]+)\.md$/i);
  if (m) {
    const folder = m[1].toLowerCase();
    const base = m[2];
    const kindMap: Partial<Record<string, AssetKind>> = {
      skills: "skill",
      commands: "command",
      checklists: "checklist",
      templates: "template",
      prompts: "prompt",
    };
    const kind = kindMap[folder];
    if (!kind) return null;
    return { kind, name: base, rel: assetRelativePath(kind, base) };
  }
  // agents/name.md
  m = n.match(/^agents\/([^/]+)\.md$/i);
  if (m) {
    return { kind: "agent", name: m[1], rel: assetRelativePath("agent", m[1]) };
  }
  // lang packs: go/skills/foo.md → still skill but we only put shared in library for now;
  // lang-specific live under library/langs/{lang}/...
  m = n.match(/^(go|php|python|rust|typescript)\/(skills|commands|rules)\/([^/]+)\.md$/i);
  if (m) {
    const lang = m[1];
    const folder = m[2].toLowerCase();
    const base = m[3];
    const kindMap: Partial<Record<string, AssetKind>> = {
      skills: "skill",
      commands: "command",
      rules: "rule",
    };
    const kind = kindMap[folder];
    if (!kind) return null;
    const rel = path.posix.join("langs", lang, assetRelativePath(kind, base));
    return { kind, name: `${lang}/${base}`, rel };
  }
  return null;
}

function walkFiles(dir: string, base = dir): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...walkFiles(full, base));
    } else if (ent.isFile()) {
      out.push(path.relative(base, full));
    }
  }
  return out;
}

export function ensureLibraryFromSeed(
  libraryRoot: string,
  seedRoot: string,
  opts: { forceReseedClean?: boolean } = {},
): LibraryPaths {
  fs.mkdirSync(libraryRoot, { recursive: true });
  const seedManifestPath = path.join(seedRoot, "seed.json");
  const seedManifest = (readJson(seedManifestPath) as SeedManifest | null) ?? {
    seedVersion: "0.0.0-dev",
  };
  const libManifestPath = path.join(libraryRoot, "library.json");
  const existing = readJson(libManifestPath) as LibraryManifest | null;

  // Always reconcile seed assets: never overwrite dirty/user; fill missing; refresh clean.
  installSeedAssets(libraryRoot, seedRoot, seedManifest.seedVersion, {
    onlyMissingOrClean: !opts.forceReseedClean,
    forceAllSeed: !!opts.forceReseedClean,
  });
  const now = new Date().toISOString();
  writeJson(libManifestPath, {
    seedVersion: seedManifest.seedVersion,
    installedAt: existing?.installedAt ?? now,
    lastUpdatedAt: now,
  } satisfies LibraryManifest);

  return { root: libraryRoot, seedVersion: seedManifest.seedVersion };
}

function installSeedAssets(
  libraryRoot: string,
  seedRoot: string,
  seedVersion: string,
  mode: { onlyMissingOrClean: boolean; forceAllSeed: boolean },
): void {
  const files = walkFiles(seedRoot).filter((f) => f !== "seed.json");
  for (const seedRel of files) {
    const mapped = mapSeedFileToLibraryRel(seedRel);
    if (!mapped) continue;
    const src = path.join(seedRoot, seedRel);
    const dest = path.join(libraryRoot, mapped.rel);
    const metaPath = path.join(
      libraryRoot,
      metaRelativePath(mapped.kind, safeMetaName(mapped.name)),
    );
    const raw = fs.readFileSync(src, "utf8");
    const hash = contentHash(raw);

    if (fs.existsSync(dest) && mode.onlyMissingOrClean && !mode.forceAllSeed) {
      const meta = readJson(metaPath) as AssetMeta | null;
      const current = contentHash(fs.readFileSync(dest, "utf8"));
      const dirty = !meta || meta.origin === "user" || current !== meta.seedHashWhenInstalled;
      if (dirty) continue;
      // clean seed asset — refresh content + meta
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, raw, "utf8");
    const meta: AssetMeta = {
      name: mapped.name,
      kind: mapped.kind,
      origin: "seed",
      seedVersion,
      contentHash: hash,
      seedHashWhenInstalled: hash,
      relativePath: mapped.rel,
    };
    writeJson(metaPath, meta);
  }
}

function safeMetaName(name: string): string {
  return name.replace(/\//g, "__");
}

export function writeUserAssetMeta(
  libraryRoot: string,
  kind: AssetKind,
  name: string,
  relativePath: string,
  fileContent: string,
): void {
  const hash = contentHash(fileContent);
  const meta: AssetMeta = {
    name,
    kind,
    origin: "user",
    contentHash: hash,
    seedHashWhenInstalled: hash,
    relativePath,
  };
  writeJson(path.join(libraryRoot, metaRelativePath(kind, safeMetaName(name))), meta);
}

export function readAssetMeta(
  libraryRoot: string,
  kind: AssetKind,
  name: string,
): AssetMeta | null {
  return readJson(
    path.join(libraryRoot, metaRelativePath(kind, safeMetaName(name))),
  ) as AssetMeta | null;
}

export function isUserEdited(
  libraryRoot: string,
  kind: AssetKind,
  name: string,
  absolutePath: string,
): boolean {
  if (!fs.existsSync(absolutePath)) return false;
  const meta = readAssetMeta(libraryRoot, kind, name);
  if (!meta) return true;
  if (meta.origin === "user") return true;
  const current = contentHash(fs.readFileSync(absolutePath, "utf8"));
  return current !== meta.seedHashWhenInstalled;
}

// re-export helpers used by scan
export { kindFromRelativePath, nameFromPath, walkFiles };
