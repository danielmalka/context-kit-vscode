import type { HarnessProfile, ProviderId } from "../domain/types";
import { ALL_PROVIDERS } from "../domain/types";

export function factoryDefaultProfile(): HarnessProfile {
  const providers = {} as Record<ProviderId, boolean>;
  for (const p of ALL_PROVIDERS) {
    providers[p] = p === "claude" || p === "grok" || p === "agents";
  }
  return {
    version: 1,
    name: "default",
    language: "ask",
    providers,
    options: {
      installPreCommit: true,
      installCiIfMissing: true,
      writeAgentsMd: true,
      writeMakefile: true,
      refreshMode: "skip-existing",
    },
  };
}

export function enabledProviders(profile: HarnessProfile): ProviderId[] {
  return ALL_PROVIDERS.filter((p) => profile.providers[p]);
}
