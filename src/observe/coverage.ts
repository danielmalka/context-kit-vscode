import * as fs from "node:fs";
import * as path from "node:path";
import type { CatalogAsset } from "../domain/types";
import type { CoverageRow } from "./types";

export function buildCoverageMatrix(
  libraryAssets: CatalogAsset[],
  workspaceAssets: CatalogAsset[],
  runtimeSkillRoots: string[],
): CoverageRow[] {
  const wsByKey = new Map<string, CatalogAsset>();
  for (const a of workspaceAssets) {
    wsByKey.set(`${a.kind}:${a.name}`, a);
  }

  const rows: CoverageRow[] = [];
  const seen = new Set<string>();

  for (const a of libraryAssets) {
    const key = `${a.kind}:${a.name}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const ws = wsByKey.get(key);
    const runtimePaths: string[] = [];
    if (a.kind === "skill") {
      for (const root of runtimeSkillRoots) {
        const p = path.join(root, a.name, "SKILL.md");
        if (fs.existsSync(p)) runtimePaths.push(p);
      }
    }

    rows.push({
      name: a.name,
      kind: a.kind,
      inLibrary: true,
      inWorkspace: !!ws,
      inRuntime: runtimePaths.length > 0,
      libraryPath: a.absolutePath,
      workspacePath: ws?.absolutePath,
      runtimePaths,
    });
  }

  return rows.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
}

export function coverageSummary(rows: CoverageRow[]): {
  total: number;
  inWorkspace: number;
  inRuntime: number;
  libraryOnly: number;
} {
  return {
    total: rows.length,
    inWorkspace: rows.filter((r) => r.inWorkspace).length,
    inRuntime: rows.filter((r) => r.inRuntime).length,
    libraryOnly: rows.filter((r) => !r.inWorkspace && !r.inRuntime).length,
  };
}
