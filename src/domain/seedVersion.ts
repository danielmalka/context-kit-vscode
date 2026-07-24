/**
 * Seed version ordering.
 *
 * Format: `MAJOR.MINOR.PATCH+YYYY.MM.DD.<shortsha>` (e.g. `1.5.0+2026.07.24.4b60ba5`).
 * The semver part is authored by a human in `scripts/sync-seed-from-kit.sh`; the build
 * metadata after `+` is provenance only and never affects ordering.
 *
 * Anything that is not a plain semver triple — the legacy `YYYY.MM.DD+sha` stamp, garbage,
 * a missing field — is "unknown" and sorts older than every real version, so installs in
 * the field carrying a legacy value still see the next release as an upgrade.
 */

const SEED_VERSION_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:[-+].*)?$/;

/** Parsed `[major, minor, patch]`, or null when the value is legacy/garbage/missing. */
export function parseSeedVersion(raw: unknown): readonly [number, number, number] | null {
  if (typeof raw !== "string") return null;
  const m = SEED_VERSION_RE.exec(raw.trim());
  if (!m) return null;
  const parsed = [Number(m[1]), Number(m[2]), Number(m[3])] as const;
  // A year-shaped major is the legacy YYYY.MM.DD stamp (2026.11.22 is valid semver by
  // accident), not a seed semver. Treat it as unknown so it never outranks a real release.
  if (parsed[0] >= 1000) return null;
  return parsed;
}

/** -1 if `a` is older than `b`, 1 if newer, 0 if equal or both unknown. */
export function compareSeedVersions(a: unknown, b: unknown): -1 | 0 | 1 {
  const pa = parseSeedVersion(a);
  const pb = parseSeedVersion(b);
  if (!pa || !pb) return pa ? 1 : pb ? -1 : 0;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  }
  return 0;
}
