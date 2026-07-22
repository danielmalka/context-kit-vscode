import * as fs from "node:fs";
import * as path from "node:path";
import type { CatalogAsset, AssetKind } from "../domain/types";
import { parseMarkdownAsset, kindFromRelativePath, nameFromPath } from "../domain/parseAsset";
import { isUserEdited, walkFiles } from "./ensure";

const KIND_ROOTS: { dir: string; kind: AssetKind }[] = [
  { dir: "skills", kind: "skill" },
  { dir: "commands", kind: "command" },
  { dir: "agents", kind: "agent" },
  { dir: "workflows", kind: "workflow" },
  { dir: "checklists", kind: "checklist" },
  { dir: "templates", kind: "template" },
  { dir: "prompts", kind: "prompt" },
  { dir: "rules", kind: "rule" },
];

function scanTree(
  root: string,
  scope: "library" | "workspace",
  libraryRootForMeta?: string,
): CatalogAsset[] {
  if (!fs.existsSync(root)) return [];
  const assets: CatalogAsset[] = [];

  for (const { dir, kind } of KIND_ROOTS) {
    const base = path.join(root, dir);
    if (!fs.existsSync(base)) continue;
    const files = walkFiles(base);
    for (const rel of files) {
      if (!/\.(md|rhai)$/i.test(rel)) continue;
      // skills: only SKILL.md
      if (kind === "skill" && !rel.replace(/\\/g, "/").endsWith("SKILL.md")) {
        continue;
      }
      const absolutePath = path.join(base, rel);
      const relativePath = path.posix.join(dir, rel.replace(/\\/g, "/"));
      const name = nameFromPath(absolutePath, kind);
      let title: string | undefined;
      let description: string | undefined;
      let frontmatter: Record<string, unknown> = {};
      try {
        const raw = fs.readFileSync(absolutePath, "utf8");
        if (absolutePath.endsWith(".md")) {
          const parsed = parseMarkdownAsset(raw, name);
          title = parsed.title;
          description = parsed.description;
          frontmatter = parsed.frontmatter;
        }
      } catch {
        // skip unreadable
        continue;
      }
      const userEdited =
        scope === "library" && libraryRootForMeta
          ? isUserEdited(libraryRootForMeta, kind, name, absolutePath)
          : undefined;
      assets.push({
        id: `${scope}:${kind}:${name}`,
        kind,
        name,
        title,
        description,
        absolutePath,
        relativePath,
        scope,
        userEdited,
        frontmatter,
      });
    }
  }

  // langs/* under library
  const langsRoot = path.join(root, "langs");
  if (fs.existsSync(langsRoot)) {
    for (const lang of fs.readdirSync(langsRoot)) {
      const langPath = path.join(langsRoot, lang);
      if (!fs.statSync(langPath).isDirectory()) continue;
      const nested = scanTree(langPath, scope, libraryRootForMeta);
      for (const a of nested) {
        a.id = `${scope}:lang:${lang}:${a.kind}:${a.name}`;
        a.name = `${lang}/${a.name}`;
        assets.push(a);
      }
    }
  }

  return assets;
}

export function scanLibrary(libraryRoot: string): CatalogAsset[] {
  return scanTree(libraryRoot, "library", libraryRoot).sort((a, b) => a.id.localeCompare(b.id));
}

export function scanWorkspaceHarness(workspaceRoot: string): CatalogAsset[] {
  const harness = path.join(workspaceRoot, ".harness");
  return scanTree(harness, "workspace").sort((a, b) => a.id.localeCompare(b.id));
}

export function scanAll(libraryRoot: string, workspaceRoot?: string): CatalogAsset[] {
  const lib = scanLibrary(libraryRoot);
  if (!workspaceRoot) return lib;
  return [...lib, ...scanWorkspaceHarness(workspaceRoot)];
}

// silence unused if tree-shaken differently
void kindFromRelativePath;
