import * as fs from "node:fs";
import * as path from "node:path";
import type { LanguageId } from "../domain/types";
import { SUPPORTED_LANGS } from "../domain/types";

const HINTS: { file: string; lang: Exclude<LanguageId, "none" | "ask"> }[] = [
  { file: "go.mod", lang: "go" },
  { file: "composer.json", lang: "php" },
  { file: "pyproject.toml", lang: "python" },
  { file: "requirements.txt", lang: "python" },
  { file: "Cargo.toml", lang: "rust" },
  { file: "package.json", lang: "typescript" },
  { file: "tsconfig.json", lang: "typescript" },
];

/** Best-effort language hints from workspace root files. */
export function detectLanguageHints(workspaceRoot: string): Exclude<LanguageId, "none" | "ask">[] {
  const found = new Set<Exclude<LanguageId, "none" | "ask">>();
  for (const h of HINTS) {
    if (fs.existsSync(path.join(workspaceRoot, h.file))) {
      found.add(h.lang);
    }
  }
  // Prefer explicit order of SUPPORTED_LANGS for stability
  return SUPPORTED_LANGS.filter((l) => found.has(l));
}
