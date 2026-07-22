import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { scanLibrary } from "../../src/library/scan";

describe("workflow scan", () => {
  let tmp: string;

  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ck-wf-"));
    const wf = path.join(tmp, "workflows", "review-changes.rhai");
    fs.mkdirSync(path.dirname(wf), { recursive: true });
    fs.writeFileSync(wf, 'let meta = #{ name: "review-changes" };\n');
  });

  after(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("scanLibrary includes workflow .rhai assets", () => {
    const assets = scanLibrary(tmp);
    const wf = assets.find((a) => a.kind === "workflow" && a.name === "review-changes");
    assert.ok(wf, `workflows not found in ${JSON.stringify(assets.map((a) => a.id))}`);
    assert.ok(wf.absolutePath.endsWith(".rhai"));
    assert.equal(wf.scope, "library");
  });
});
