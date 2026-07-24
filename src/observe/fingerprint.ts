import type { ActivitySession } from "./types";

/** Stable fingerprint so live refresh can skip identical UI state. */
export function sessionsFingerprint(sessions: ActivitySession[]): string {
  return sessions
    .map(
      (s) =>
        `${s.id}|${String(s.lastActivityMs)}|${s.status}|${s.detail ?? ""}|${(s.children ?? [])
          .map((c) => `${c.id}:${String(c.lastActivityMs)}`)
          .join(",")}`,
    )
    .join(";");
}
