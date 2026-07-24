import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { buildLaunchCommand, type LaunchCli } from "../../src/domain/launchCommand";

describe("buildLaunchCommand", () => {
  it("builds claude slash invocation", () => {
    assert.equal(buildLaunchCommand("claude", "prd"), "claude '/prd'");
  });
  it("strips a leading slash from the command name", () => {
    assert.equal(buildLaunchCommand("claude", "/prd"), "claude '/prd'");
  });
  it("builds grok and echo", () => {
    assert.equal(buildLaunchCommand("grok", "implement"), "grok '/implement'");
    assert.equal(buildLaunchCommand("echo", "clean"), "echo 'Context Kit launch: /clean'");
  });
  it("appends trimmed extra args for claude", () => {
    assert.equal(buildLaunchCommand("claude", "fix", "  auth bug  "), "claude '/fix auth bug'");
  });
  it("appends trimmed extra args for grok", () => {
    assert.equal(buildLaunchCommand("grok", "review", "  pr 12  "), "grok '/review pr 12'");
  });
  it("appends extra args for echo", () => {
    assert.equal(
      buildLaunchCommand("echo", "clean", "note x"),
      "echo 'Context Kit launch: /clean note x'",
    );
  });
  it("omits the trailing space for echo with no extra args", () => {
    assert.equal(buildLaunchCommand("echo", "clean"), "echo 'Context Kit launch: /clean'");
  });
  it("treats whitespace-only extra args as absent", () => {
    assert.equal(buildLaunchCommand("claude", "prd", "   "), "claude '/prd'");
    assert.equal(buildLaunchCommand("echo", "prd", "   "), "echo 'Context Kit launch: /prd'");
  });

  // The args box is free text and command names come from filenames on disk;
  // both reach a shell. Single quotes must neutralize every expansion.
  describe("shell quoting", () => {
    it("leaves double quotes untouched (single-quote wrapping needs no escape)", () => {
      assert.equal(buildLaunchCommand("claude", "fix", 'auth "bug"'), `claude '/fix auth "bug"'`);
      assert.equal(buildLaunchCommand("grok", "fix", 'auth "bug"'), `grok '/fix auth "bug"'`);
    });
    it("neutralizes command substitution, backticks and variable expansion", () => {
      assert.equal(
        buildLaunchCommand("claude", "fix", "$(rm -rf /) `whoami` $HOME"),
        "claude '/fix $(rm -rf /) `whoami` $HOME'",
      );
    });
    it("escapes a single quote embedded in extra args", () => {
      assert.equal(
        buildLaunchCommand("claude", "fix", "it's broken"),
        "claude '/fix it'\\''s broken'",
      );
    });
    it("escapes a single-quote-based attempt to break out of the quoting", () => {
      assert.equal(
        buildLaunchCommand("claude", "fix", "'; id; '"),
        `claude '/fix '\\''; id; '\\'''`,
      );
    });
    it("quotes a hostile command name (names come from filenames on disk)", () => {
      assert.equal(buildLaunchCommand("claude", "a$(id)"), "claude '/a$(id)'");
      assert.equal(buildLaunchCommand("grok", "/x`id`"), "grok '/x`id`'");
    });

    // The definitive check: hand the generated line to a real shell and confirm the
    // payload comes back as literal text rather than having been executed.
    it("survives a real shell without executing the payload", () => {
      const payloads = ["$(id)", "`id`", "$HOME", "x; id", "x && id", "it's", "'; id; '"];
      for (const payload of payloads) {
        const line = buildLaunchCommand("echo", "clean", payload);
        const out = execFileSync("/bin/sh", ["-c", line], { encoding: "utf8" }).trimEnd();
        assert.equal(
          out,
          `Context Kit launch: /clean ${payload}`,
          `payload ${JSON.stringify(payload)} must reach the shell verbatim`,
        );
      }
    });
  });

  it("returns the unreachable value for an invalid CLI (defensive exhaustiveness guard)", () => {
    // ponytail: casting past the type system to exercise the `never` default branch —
    // it exists purely to fail loudly if LaunchCli grows a case the switch forgets.
    const bogus = "bogus" as unknown as LaunchCli;
    assert.equal(buildLaunchCommand(bogus, "prd"), bogus);
  });
});
