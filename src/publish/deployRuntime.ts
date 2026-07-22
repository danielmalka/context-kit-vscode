import * as fs from "node:fs";
import * as path from "node:path";
import type { AssetKind } from "../domain/types";
import { assetRelativePath } from "../domain/paths";

export type RuntimeTarget = "claude" | "grok" | "agents";

export interface DeployRequest {
  /** Absolute path to user library root. */
  libraryRoot: string;
  kind: AssetKind;
  name: string;
  /** Absolute roots per target (e.g. ~/.claude/skills). Only listed targets are written. */
  targets: Partial<Record<RuntimeTarget, string>>;
  dryRun?: boolean;
}

export interface DeployResult {
  written: string[];
  skipped: string[];
  errors: string[];
}

/**
 * Resolve which relative path to write under a runtime skills/commands root.
 * Claude/Grok skills expect `{name}/SKILL.md`; commands are flat `{name}.md`.
 */
export function runtimeRelativePath(kind: AssetKind, name: string): string {
  if (kind === "skill") {
    return path.posix.join(name, "SKILL.md");
  }
  if (kind === "command") {
    return `${name}.md`;
  }
  if (kind === "workflow") {
    return `${name}.rhai`;
  }
  // agents and others: flat markdown under target root
  return `${name}.md`;
}

export function librarySourcePath(libraryRoot: string, kind: AssetKind, name: string): string {
  return path.join(libraryRoot, assetRelativePath(kind, name));
}

/**
 * Copy one library asset into the given user-runtime roots.
 * Pure fs helper — no vscode dependency.
 */
export function deployAssetToRuntime(req: DeployRequest): DeployResult {
  const written: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];
  const src = librarySourcePath(req.libraryRoot, req.kind, req.name);

  if (!fs.existsSync(src)) {
    errors.push(`source missing: ${src}`);
    return { written, skipped, errors };
  }

  const rel = runtimeRelativePath(req.kind, req.name);
  const content = fs.readFileSync(src);

  for (const [target, root] of Object.entries(req.targets) as [
    RuntimeTarget,
    string | undefined,
  ][]) {
    if (!root) {
      skipped.push(`${target} (no root)`);
      continue;
    }
    // Only skills map cleanly into skill roots for claude/grok/agents defaults.
    if (
      (target === "claude" || target === "grok" || target === "agents") &&
      req.kind !== "skill" &&
      req.kind !== "command" &&
      req.kind !== "workflow"
    ) {
      skipped.push(`${target} (kind ${req.kind} not supported)`);
      continue;
    }
    const dest = path.join(root, rel);
    try {
      if (req.dryRun) {
        written.push(dest);
        continue;
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, content);
      written.push(dest);
    } catch (e) {
      errors.push(`${dest}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { written, skipped, errors };
}

/** Default skill roots under a home directory (testable via homeDir inject). */
export function defaultSkillRoots(homeDir: string): Record<RuntimeTarget, string> {
  return {
    claude: path.join(homeDir, ".claude", "skills"),
    grok: path.join(homeDir, ".grok", "skills"),
    agents: path.join(homeDir, ".agents", "skills"),
  };
}
