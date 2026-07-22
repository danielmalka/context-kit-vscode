import * as vscode from "vscode";

let channel: vscode.OutputChannel | undefined;

export function getOutput(): vscode.OutputChannel {
  if (!channel) {
    channel = vscode.window.createOutputChannel("Context Kit");
  }
  return channel;
}

export function log(message: string): void {
  getOutput().appendLine(message);
}
