import * as vscode from "vscode";
import { TerminalManager } from "./terminal";
import { OpenCodeServiceManager } from "./service";
import { resolveOpenCodeBinary } from "./binary";

export function activate(context: vscode.ExtensionContext) {
  const terminalManager = new TerminalManager({ extensionUri: context.extensionUri });
  const serviceManager = new OpenCodeServiceManager();

  // 1. Command: Open/Focus OpenCode Terminal
  const openTerminalCmd = vscode.commands.registerCommand("opencode.openTerminal", async () => {
    await terminalManager.openTerminal(false);
  });

  // 2. Command: Open New OpenCode Terminal
  const openNewTerminalCmd = vscode.commands.registerCommand("opencode.openNewTerminal", async () => {
    await terminalManager.openTerminal(true);
  });

  // 3. Command: Add File & Line Reference (@path#L...)
  const addFilepathCmd = vscode.commands.registerCommand("opencode.addFilepathToTerminal", async () => {
    await terminalManager.addFilepathToTerminal();
  });

  // 4. Command: Send Selection to Terminal
  const sendSelectionCmd = vscode.commands.registerCommand("opencode.sendSelectionToTerminal", async () => {
    await terminalManager.sendSelectionToTerminal();
  });

  // 5. Command: Open Web UI
  const openWebUICmd = vscode.commands.registerCommand("opencode.openWebUI", async () => {
    await serviceManager.openWebUI();
  });

  // 6. Command: Start Service Daemon
  const startServiceCmd = vscode.commands.registerCommand("opencode.startService", async () => {
    await serviceManager.startService();
  });

  // Status Bar Item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = "opencode.openTerminal";
  statusBarItem.text = "$(terminal) OpenCode";
  statusBarItem.tooltip = "Abrir terminal de OpenCode v2 (Ctrl+Esc / Cmd+Esc)";
  statusBarItem.show();

  context.subscriptions.push(
    openTerminalCmd,
    openNewTerminalCmd,
    addFilepathCmd,
    sendSelectionCmd,
    openWebUICmd,
    startServiceCmd,
    statusBarItem
  );

  // Proactive check in background (non-blocking)
  resolveOpenCodeBinary().then((binInfo) => {
    if (binInfo?.version) {
      statusBarItem.tooltip = `OpenCode ${binInfo.version} listo (${binInfo.path})`;
    }
  });
}

export function deactivate() {}
