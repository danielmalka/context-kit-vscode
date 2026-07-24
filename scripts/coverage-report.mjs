/**
 * node:test custom reporter — emits the gate's coverage line for src/ only.
 *
 * The built-in "all files" row counts the test files themselves (always ~100%),
 * which inflates the number. This reports line coverage over src/**\/*.ts,
 * weighted by real line counts, and fails the gate below COVERAGE_MIN.
 */
import path from "node:path";

const FLOOR = Number(process.env.COVERAGE_MIN ?? "80");
const ROOT = process.cwd();

export default async function* coverageReporter(source) {
  let measured = false;

  for await (const event of source) {
    if (event.type !== "test:coverage") continue;
    measured = true;

    let total = 0;
    let covered = 0;
    for (const file of event.data.summary.files) {
      const rel = path.relative(ROOT, file.path);
      if (!rel.startsWith(`src${path.sep}`)) continue;
      total += file.totalLineCount;
      covered += file.coveredLineCount;
    }

    const pct = total === 0 ? 0 : (covered / total) * 100;
    yield `coverage: ${pct.toFixed(2)}% (floor ${FLOOR}%)\n`;

    if (total === 0) {
      yield `coverage: no src/ files instrumented — refusing to pass an unmeasured gate\n`;
      process.exitCode = 1;
    } else if (pct < FLOOR) {
      yield `coverage: BELOW FLOOR (${covered}/${total} lines)\n`;
      process.exitCode = 1;
    }
  }

  // No coverage event at all means the run was not instrumented (someone dropped
  // --experimental-test-coverage). Failing here keeps the gate from silently
  // reverting to "green but unmeasured".
  if (!measured) {
    yield `coverage: no coverage data — is --experimental-test-coverage still set?\n`;
    process.exitCode = 1;
  }
}
