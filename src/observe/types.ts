export type ActivityProvider = "claude" | "grok" | "unknown";

export type ActivityStatus = "running" | "idle" | "done" | "error" | "unknown";

export interface ActivitySession {
  id: string;
  provider: ActivityProvider;
  label: string;
  workspace?: string;
  path: string;
  lastActivityMs: number;
  status: ActivityStatus;
  detail?: string;
  children?: ActivitySession[];
}

export interface CoverageRow {
  name: string;
  kind: string;
  inLibrary: boolean;
  inWorkspace: boolean;
  inRuntime: boolean;
  libraryPath?: string;
  workspacePath?: string;
  runtimePaths: string[];
}
