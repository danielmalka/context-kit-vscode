export type LaunchCli = "claude" | "grok" | "echo";

/**
 * Build a shell one-liner to invoke a slash-style command for a given CLI.
 * Pure helper — no vscode dependency.
 */
export function buildLaunchCommand(cli: LaunchCli, slashName: string, extraArgs = ""): string {
  const cmd = slashName.replace(/^\//, "");
  const extra = extraArgs.trim();
  switch (cli) {
    case "claude":
      return extra ? `claude "/${cmd} ${extra.replace(/"/g, '\\"')}"` : `claude "/${cmd}"`;
    case "grok":
      return extra ? `grok "/${cmd} ${extra.replace(/"/g, '\\"')}"` : `grok "/${cmd}"`;
    case "echo":
      return `echo "Context Kit launch: /${cmd}${extra ? " " + extra : ""}"`;
    default: {
      const _x: never = cli;
      return _x;
    }
  }
}
