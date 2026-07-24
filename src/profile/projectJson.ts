import type { HarnessProfile } from "../domain/types";

export const PROJECT_JSON_REL = ".context-kit/project.json";

export interface ProjectConfigFile {
  version: 1;
  profile: HarnessProfile;
  appliedAt: string;
  extensionVersion?: string;
}

export function buildProjectConfig(
  profile: HarnessProfile,
  extensionVersion?: string,
): ProjectConfigFile {
  return {
    version: 1,
    profile,
    appliedAt: new Date().toISOString(),
    extensionVersion,
  };
}

export function parseProjectConfig(raw: string): ProjectConfigFile | null {
  try {
    const data = JSON.parse(raw) as Partial<ProjectConfigFile> | null;
    if (data?.version !== 1 || !data.profile) return null;
    return data as ProjectConfigFile;
  } catch {
    return null;
  }
}
