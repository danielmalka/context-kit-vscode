import matter from "gray-matter";
import type { AssetKind } from "./types";

export interface ParsedAsset {
  name: string;
  title?: string;
  description?: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

export function parseMarkdownAsset(raw: string, fallbackName: string): ParsedAsset {
  const { data, content } = matter(raw);
  const fm = data as Record<string, unknown>;
  const name = typeof fm.name === "string" && fm.name.trim() ? fm.name.trim() : fallbackName;
  const description = typeof fm.description === "string" ? fm.description.trim() : undefined;

  let title: string | undefined;
  const heading = content.match(/^#\s+(.+)$/m);
  if (heading) {
    title = heading[1].trim();
  } else if (typeof fm.title === "string") {
    title = fm.title;
  }

  return {
    name,
    title,
    description,
    frontmatter: fm,
    body: content,
  };
}

export function kindFromRelativePath(rel: string): AssetKind | null {
  const n = rel.replace(/\\/g, "/");
  if (n.includes("/skills/") || n.startsWith("skills/")) return "skill";
  if (n.includes("/commands/") || n.startsWith("commands/")) return "command";
  if (n.includes("/agents/") || n.startsWith("agents/")) return "agent";
  if (n.includes("/workflows/") || n.startsWith("workflows/")) return "workflow";
  if (n.includes("/rules/") || n.startsWith("rules/")) return "rule";
  if (n.includes("/checklists/") || n.startsWith("checklists/")) return "checklist";
  if (n.includes("/templates/") || n.startsWith("templates/")) return "template";
  if (n.includes("/prompts/") || n.startsWith("prompts/")) return "prompt";
  return null;
}

export function nameFromPath(filePath: string, kind: AssetKind): string {
  const base = filePath.replace(/\\/g, "/").split("/").pop() ?? "unnamed";
  if (kind === "skill" && base === "SKILL.md") {
    const parts = filePath.replace(/\\/g, "/").split("/");
    return parts[parts.length - 2] ?? "unnamed";
  }
  return base.replace(/\.md$/i, "").replace(/\.rhai$/i, "");
}
