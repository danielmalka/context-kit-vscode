import type { ActivitySession } from "./types";

/** Sessions considered "active" in the activity radar UI. */
export function isActiveSession(s: ActivitySession): boolean {
  return s.status === "running";
}

/**
 * @param onlyActive - when true (default UX), hide idle/done/unknown noise
 */
export function filterSessionsForDisplay(
  sessions: ActivitySession[],
  onlyActive: boolean,
): { visible: ActivitySession[]; hiddenCount: number } {
  if (!onlyActive) {
    return { visible: sessions, hiddenCount: 0 };
  }
  const visible = sessions.filter(isActiveSession);
  return { visible, hiddenCount: sessions.length - visible.length };
}
