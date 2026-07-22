import { createHash } from "node:crypto";

/** Normalize line endings and trailing whitespace so WSL/Windows edits don't false-dirty. */
export function normalizeContent(content: string): string {
  return content.replace(/\r\n/g, "\n").replace(/\s+$/u, "") + "\n";
}

export function contentHash(content: string): string {
  return createHash("sha256").update(normalizeContent(content), "utf8").digest("hex");
}
