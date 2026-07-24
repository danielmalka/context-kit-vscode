export type AssetKind =
  "skill" | "command" | "agent" | "workflow" | "rule" | "checklist" | "template" | "prompt";

export type AssetOrigin = "seed" | "user";

export type LanguageId = "go" | "php" | "python" | "rust" | "typescript" | "none" | "ask";

export type ProviderId = "claude" | "grok" | "agents" | "codex" | "gemini" | "devin";

export const ALL_PROVIDERS: ProviderId[] = ["claude", "grok", "agents", "codex", "gemini", "devin"];

export const SUPPORTED_LANGS: Exclude<LanguageId, "none" | "ask">[] = [
  "go",
  "php",
  "python",
  "rust",
  "typescript",
];

export interface AssetMeta {
  name: string;
  kind: AssetKind;
  origin: AssetOrigin;
  seedVersion?: string;
  contentHash: string;
  seedHashWhenInstalled: string;
  relativePath: string;
}

export interface CatalogAsset {
  id: string;
  kind: AssetKind;
  name: string;
  title?: string;
  description?: string;
  absolutePath: string;
  relativePath: string;
  scope: "library" | "workspace";
  origin?: AssetOrigin;
  userEdited?: boolean;
  frontmatter: Record<string, unknown>;
}

export interface HarnessProfile {
  version: 1;
  name: string;
  language: LanguageId;
  providers: Record<ProviderId, boolean>;
  options: {
    installPreCommit: boolean;
    installCiIfMissing: boolean;
    writeAgentsMd: boolean;
    writeMakefile: boolean;
    refreshMode: "skip-existing" | "refresh-harness" | "force";
  };
  projectRegistryName?: string;
}

export interface SeedManifest {
  seedVersion: string;
  source?: string;
  generatedAt?: string;
  counts?: Record<string, number>;
}

export interface LibraryManifest {
  seedVersion: string;
  installedAt: string;
  lastUpdatedAt?: string;
  /**
   * Highest package seed version the user has seen and acted on (applied, replaced, or
   * deliberately skipped). Drives the update prompt so a skipped dirty asset stops the nag
   * until a newer package arrives. Optional: legacy manifests fall back to `seedVersion`.
   */
  acknowledgedSeedVersion?: string;
}
