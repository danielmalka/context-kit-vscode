import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { buildCoverageMatrix, coverageSummary } from "../../src/observe/coverage";
import type { CatalogAsset } from "../../src/domain/types";

function asset(
  partial: Pick<CatalogAsset, "name" | "kind" | "scope" | "absolutePath">,
): CatalogAsset {
  return {
    id: `${partial.scope}:${partial.kind}:${partial.name}`,
    relativePath: partial.name,
    frontmatter: {},
    ...partial,
  };
}

describe("coverage matrix", () => {
  let tmp: string;

  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ck-cov-"));
    fs.mkdirSync(path.join(tmp, "rt", "demo"), { recursive: true });
    fs.writeFileSync(path.join(tmp, "rt", "demo", "SKILL.md"), "# x\n");
  });

  after(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("marks workspace and runtime presence from real paths", () => {
    const lib: CatalogAsset[] = [
      asset({
        name: "demo",
        kind: "skill",
        scope: "library",
        absolutePath: path.join(tmp, "lib", "skills", "demo", "SKILL.md"),
      }),
      asset({
        name: "other",
        kind: "command",
        scope: "library",
        absolutePath: path.join(tmp, "lib", "commands", "other.md"),
      }),
    ];
    const ws: CatalogAsset[] = [
      asset({
        name: "demo",
        kind: "skill",
        scope: "workspace",
        absolutePath: path.join(tmp, "ws", "skills", "demo", "SKILL.md"),
      }),
    ];
    const rows = buildCoverageMatrix(lib, ws, [path.join(tmp, "rt")]);
    const demo = rows.find((r) => r.name === "demo")!;
    assert.equal(demo.inLibrary, true);
    assert.equal(demo.inWorkspace, true);
    assert.equal(demo.inRuntime, true);
    const other = rows.find((r) => r.name === "other")!;
    assert.equal(other.inWorkspace, false);
    assert.equal(other.inRuntime, false);
    const sum = coverageSummary(rows);
    assert.equal(sum.total, 2);
    assert.equal(sum.inWorkspace, 1);
    assert.equal(sum.inRuntime, 1);
  });
});
