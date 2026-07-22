#!/usr/bin/env node
/**
 * Package extension VSIX into releases/ with versioned filename.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const version = pkg.version;
const name = pkg.name;
const outDir = path.join(root, "releases");
fs.mkdirSync(outDir, { recursive: true });

const outFile = path.join(outDir, `${name}-${version}.vsix`);
const r = spawnSync(
  "npx",
  ["--yes", "@vscode/vsce", "package", "--no-dependencies", "--out", outFile],
  { cwd: root, stdio: "inherit", shell: process.platform === "win32" },
);
if (r.status !== 0) process.exit(r.status ?? 1);

const rootCopy = path.join(root, `${name}-${version}.vsix`);
fs.copyFileSync(outFile, rootCopy);
console.log(`\nPackaged:\n  ${outFile}\n  ${rootCopy} (root copy, gitignored)`);
