import * as path from "node:path";
import type { AssetKind, ProviderId } from "./types";

export function librarySubdir(kind: AssetKind): string {
  switch (kind) {
    case "skill":
      return "skills";
    case "command":
      return "commands";
    case "agent":
      return "agents";
    case "workflow":
      return "workflows";
    case "rule":
      return "rules";
    case "checklist":
      return "checklists";
    case "template":
      return "templates";
    case "prompt":
      return "prompts";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

/** Canonical relative path inside library / .harness for an asset. */
export function assetRelativePath(kind: AssetKind, name: string): string {
  const sub = librarySubdir(kind);
  if (kind === "skill") {
    return path.posix.join(sub, name, "SKILL.md");
  }
  if (kind === "workflow") {
    return path.posix.join(sub, `${name}.rhai`);
  }
  return path.posix.join(sub, `${name}.md`);
}

export function metaRelativePath(kind: AssetKind, name: string): string {
  return path.posix.join(".meta", librarySubdir(kind), `${name}.json`);
}

export function providerGlueHints(provider: ProviderId): string[] {
  switch (provider) {
    case "claude":
      return [".claude/skills", ".claude/commands", ".claude/rules", ".claude/checklists"];
    case "agents":
      return [".agents/skills"];
    case "grok":
      return [".grok/instructions.md"];
    case "codex":
      return [".codex/instructions.md"];
    case "gemini":
      return [".gemini/instructions.md", ".gemini/commands/"];
    case "devin":
      return [".devin/instructions.md"];
    default: {
      const _e: never = provider;
      return _e;
    }
  }
}
