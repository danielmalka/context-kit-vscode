import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compareSeedVersions, parseSeedVersion } from "../../src/domain/seedVersion";

describe("compareSeedVersions", () => {
  const cases: Array<{ a: unknown; b: unknown; want: -1 | 0 | 1; why: string }> = [
    { a: "1.5.0", b: "1.5.0", want: 0, why: "equal" },
    { a: "1.5.0", b: "1.5.1", want: -1, why: "patch ordering" },
    { a: "1.5.1", b: "1.5.0", want: 1, why: "patch ordering reversed" },
    { a: "1.5.0", b: "1.6.0", want: -1, why: "minor ordering" },
    { a: "1.9.0", b: "2.0.0", want: -1, why: "major ordering" },
    { a: "2.0.0", b: "10.0.0", want: -1, why: "numeric, not lexicographic, major" },
    { a: "1.2.9", b: "1.2.10", want: -1, why: "numeric, not lexicographic, patch" },
    {
      a: "1.5.0+2026.07.24.4b60ba5",
      b: "1.5.0+2026.01.01.deadbee",
      want: 0,
      why: "build metadata ignored",
    },
    {
      a: "1.5.0+2026.01.01.deadbee",
      b: "1.6.0+2026.07.24.4b60ba5",
      want: -1,
      why: "semver decides, build metadata does not",
    },
    { a: "2026.07.22+e4d4cfe", b: "1.5.0", want: -1, why: "legacy date stamp is older" },
    { a: "1.5.0", b: "2026.07.22+e4d4cfe", want: 1, why: "legacy date stamp is older, reversed" },
    {
      a: "2026.11.22+e4d4cfe",
      b: "1.5.0",
      want: -1,
      why: "legacy date that parses as valid semver is still older",
    },
    {
      a: "2026.07.22+e4d4cfe",
      b: "2026.07.23+abc1234",
      want: 0,
      why: "two legacy values are both unknown",
    },
    { a: null, b: "1.5.0", want: -1, why: "missing library version is older" },
    { a: "1.5.0", b: undefined, want: 1, why: "missing incoming version is not an upgrade" },
    { a: "not-a-version", b: "1.5.0", want: -1, why: "garbage is older" },
    { a: "1.5", b: "1.5.0", want: -1, why: "truncated triple is unknown" },
    { a: 150, b: "1.5.0", want: -1, why: "non-string is unknown" },
    { a: "0.0.0-dev", b: "1.5.0", want: -1, why: "dev fallback is older" },
    { a: null, b: null, want: 0, why: "both unknown compare equal" },
  ];

  for (const { a, b, want, why } of cases) {
    it(`${JSON.stringify(a)} vs ${JSON.stringify(b)} → ${want} (${why})`, () => {
      assert.equal(compareSeedVersions(a, b), want);
    });
  }
});

describe("parseSeedVersion", () => {
  it("returns the triple for a stamped seed version", () => {
    assert.deepEqual(parseSeedVersion("1.5.0+2026.07.24.4b60ba5"), [1, 5, 0]);
  });

  it("tolerates surrounding whitespace", () => {
    assert.deepEqual(parseSeedVersion("  2.0.1  "), [2, 0, 1]);
  });

  it("rejects leading zeros so the legacy YYYY.MM.DD stamp never parses", () => {
    assert.equal(parseSeedVersion("2026.07.22+e4d4cfe"), null);
  });

  it("rejects a year-shaped major that would otherwise be valid semver", () => {
    assert.equal(parseSeedVersion("2026.11.22"), null);
    assert.deepEqual(parseSeedVersion("999.0.0"), [999, 0, 0]);
  });

  it("rejects malformed input without throwing", () => {
    for (const bad of ["", "v1.5.0", "1.5.0.1", "1..0", "abc", "-1.0.0", null, {}]) {
      assert.equal(parseSeedVersion(bad), null, JSON.stringify(bad));
    }
  });
});
