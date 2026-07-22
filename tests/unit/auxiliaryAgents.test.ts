import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";

const seedAgents = path.join(process.cwd(), "resources", "seed", "agents");
const seedCommands = path.join(process.cwd(), "resources", "seed", "shared", "commands");

describe("auxiliary agents in seed", () => {
  for (const name of ["documentator", "security-checker", "cleaner"]) {
    it(`ships agents/${name}.md with frontmatter name`, () => {
      const p = path.join(seedAgents, `${name}.md`);
      assert.ok(fs.existsSync(p), `missing ${p}`);
      const body = fs.readFileSync(p, "utf8");
      assert.match(body, new RegExp(`^name:\\s*${name}\\s*$`, "m"));
      assert.match(body, /role:\s*auxiliary/);
      assert.match(body, /## How to invoke/);
    });
  }

  for (const name of ["document", "security-check", "clean"]) {
    it(`ships shared/commands/${name}.md`, () => {
      const p = path.join(seedCommands, `${name}.md`);
      assert.ok(fs.existsSync(p), `missing ${p}`);
      assert.ok(fs.readFileSync(p, "utf8").length > 50);
    });
  }

  it("documents content guide in docs/context-kit-content.md", () => {
    const p = path.join(process.cwd(), "docs", "context-kit-content.md");
    assert.ok(fs.existsSync(p));
    const body = fs.readFileSync(p, "utf8");
    assert.match(body, /documentator/);
    assert.match(body, /security-checker/);
    assert.match(body, /cleaner/);
  });
});
