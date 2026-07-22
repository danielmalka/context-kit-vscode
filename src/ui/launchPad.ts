import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import { buildLaunchCommand, type LaunchCli } from "../domain/launchCommand";

export async function runLaunchPad(libraryRoot: string): Promise<void> {
  const cmdDir = path.join(libraryRoot, "commands");
  const names: string[] = [];
  if (fs.existsSync(cmdDir)) {
    for (const f of fs.readdirSync(cmdDir)) {
      if (f.endsWith(".md")) names.push(f.replace(/\.md$/i, ""));
    }
  }
  names.sort();
  if (!names.length) {
    vscode.window.showWarningMessage("Context Kit: no commands in library to launch.");
    return;
  }

  const pick = await vscode.window.showQuickPick(
    names.map((n) => ({ label: `/${n}`, name: n })),
    { title: "Launch pad — pick a command" },
  );
  if (!pick) return;

  const cliPick = await vscode.window.showQuickPick(
    [
      { label: "claude", description: "Claude Code CLI", cli: "claude" as LaunchCli },
      { label: "grok", description: "Grok Build CLI", cli: "grok" as LaunchCli },
      { label: "echo (dry)", description: "Print only — verify wiring", cli: "echo" as LaunchCli },
    ],
    { title: "Which CLI?" },
  );
  if (!cliPick) return;

  const extra = await vscode.window.showInputBox({
    prompt: "Optional arguments after the slash command",
    placeHolder: "e.g. fix flaky test in auth",
  });
  if (extra === undefined) return;

  const line = buildLaunchCommand(cliPick.cli, pick.name, extra);
  const term = vscode.window.createTerminal({
    name: `CK /${pick.name}`,
    cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
  });
  term.show();
  term.sendText(line, true);
  vscode.window.showInformationMessage(`Context Kit: launched in terminal — ${line}`);
}
