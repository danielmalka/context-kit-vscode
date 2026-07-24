export type LaunchCli = "claude" | "grok" | "echo";

/**
 * Build a shell one-liner to invoke a slash-style command for a given CLI.
 * Pure helper — no vscode dependency.
 */
/**
 * Wrap a value in single quotes for POSIX sh. Single quotes suppress every
 * expansion, so `$(…)`, backticks and `$VAR` stay literal; the only character
 * needing care is the quote itself.
 */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function buildLaunchCommand(cli: LaunchCli, slashName: string, extraArgs = ""): string {
  const cmd = slashName.replace(/^\//, "");
  const extra = extraArgs.trim();
  const payload = extra ? `/${cmd} ${extra}` : `/${cmd}`;
  switch (cli) {
    case "claude":
      return `claude ${shellQuote(payload)}`;
    case "grok":
      return `grok ${shellQuote(payload)}`;
    case "echo":
      return `echo ${shellQuote(`Context Kit launch: ${payload}`)}`;
    default: {
      const _x: never = cli;
      return _x;
    }
  }
}
