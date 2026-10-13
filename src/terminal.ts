import * as vscode from "vscode";
import { resolveOpenCodeBinary } from "./binary";

export const TERMINAL_NAME = "opencode";

export interface TerminalManagerOptions {
  extensionUri: vscode.Uri;
}

export class TerminalManager {
  private extensionUri: vscode.Uri;

  constructor(options: TerminalManagerOptions) {
    this.extensionUri = options.extensionUri;
  }

  /**
   * Finds existing OpenCode terminal or launches a new one.
   */
  public async openTerminal(forceNew = false): Promise<vscode.Terminal | null> {
    if (!forceNew) {
      const existing = vscode.window.terminals.find((t) => t.name === TERMINAL_NAME);
      if (existing) {
        existing.show();
        return existing;
      }
    }

    return this.createOpenCodeTerminal();
  }

  /**
   * Spawns a new OpenCode v2 terminal.
   */
  public async createOpenCodeTerminal(): Promise<vscode.Terminal | null> {
    const binInfo = await resolveOpenCodeBinary();
    if (!binInfo) {
      const action = await vscode.window.showErrorMessage(
        "OpenCode: 'opencode' executable was not found on your system or ~/.opencode/bin/opencode.",
        "View Installation Guide",
        "Configure Path"
      );

      if (action === "View Installation Guide") {
        vscode.env.openExternal(vscode.Uri.parse("https://opencode.ai"));
      } else if (action === "Configure Path") {
        vscode.commands.executeCommand("workbench.action.openSettings", "opencode.executablePath");
      }
      return null;
    }

    const config = vscode.workspace.getConfiguration("opencode");
    const terminalLocation = config.get<string>("terminalLocation", "beside");
    const extraArgs = config.get<string[]>("extraArgs", []);

    const iconLight = vscode.Uri.joinPath(this.extensionUri, "images", "button-light.svg");
    const iconDark = vscode.Uri.joinPath(this.extensionUri, "images", "button-dark.svg");

    // Location: beside (split editor) or panel (bottom)
    const location: vscode.TerminalLocation | { viewColumn: vscode.ViewColumn; preserveFocus: boolean } =
      terminalLocation === "panel"
        ? vscode.TerminalLocation.Panel
        : { viewColumn: vscode.ViewColumn.Beside, preserveFocus: false };

    const terminal = vscode.window.createTerminal({
      name: TERMINAL_NAME,
      iconPath: {
        light: iconLight,
        dark: iconDark,
      },
      location,
      env: {
        OPENCODE_CALLER: "vscode",
      },
    });

    terminal.show();

    // In OpenCode v2, we invoke the executable directly without the deprecated --port flag.
    const launchCommand = this.buildLaunchCommand(binInfo, extraArgs);
    terminal.sendText(launchCommand);

    return terminal;
  }

  /**
   * Formats the CLI invocation command appropriately for the active shell (PowerShell, cmd, bash).
   */
  private buildLaunchCommand(binInfo: import("./binary").OpenCodeBinaryInfo, extraArgs: string[]): string {
    const argsString = extraArgs.length > 0 ? " " + extraArgs.join(" ") : "";
    const isWindows = process.platform === "win32";

    // If available directly in PATH, typing "opencode" is standard and works uniformly across all shells
    if (binInfo.fromPath) {
      return `opencode${argsString}`;
    }

    // When launching via full path, format appropriately for the shell
    const shell = (vscode.env.shell || "").toLowerCase();
    const isPowerShell =
      shell.includes("powershell") ||
      shell.includes("pwsh") ||
      (isWindows && !shell.includes("cmd") && !shell.includes("bash") && !shell.includes("sh") && !shell.includes("zsh"));

    if (isPowerShell) {
      // In PowerShell, quoted executable paths require the call operator (&)
      return `& "${binInfo.path}"${argsString}`;
    }

    return `"${binInfo.path}"${argsString}`;
  }

  /**
   * Returns relative file path reference, e.g. @src/index.ts#L10-20
   */
  public getActiveFileReference(): string | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return null;
    }

    const docUri = editor.document.uri;
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(docUri);
    if (!workspaceFolder) {
      return null;
    }

    const relativePath = vscode.workspace.asRelativePath(docUri, false).replace(/\\/g, "/");
    let ref = `@${relativePath}`;
    const selection = editor.selection;

    if (!selection.isEmpty) {
      const startLine = selection.start.line + 1;
      const endLine = selection.end.line + 1;
      ref += startLine === endLine ? `#L${startLine}` : `#L${startLine}-${endLine}`;
    }

    return ref;
  }

  /**
   * Inserts the active file reference into the current OpenCode terminal prompt.
   */
  public async addFilepathToTerminal(): Promise<void> {
    const ref = this.getActiveFileReference();
    if (!ref) {
      vscode.window.showInformationMessage("OpenCode: No active file or selection to reference.");
      return;
    }

    let terminal: vscode.Terminal | null | undefined = vscode.window.activeTerminal;
    if (!terminal || terminal.name !== TERMINAL_NAME) {
      // Find or open OpenCode terminal
      const found = vscode.window.terminals.find((t) => t.name === TERMINAL_NAME);
      if (found) {
        terminal = found;
      } else {
        terminal = await this.createOpenCodeTerminal();
        if (terminal) {
          setTimeout(() => {
            terminal?.sendText(ref, false);
          }, 1500);
          return;
        }
      }
    }

    if (terminal) {
      terminal.show();
      terminal.sendText(ref, false);
    }
  }

  /**
   * Sends the active selection directly into the OpenCode terminal.
   */
  public async sendSelectionToTerminal(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const selectionText = editor.document.getText(editor.selection);
    if (!selectionText || selectionText.trim() === "") {
      vscode.window.showInformationMessage("OpenCode: No text selected to send.");
      return;
    }

    let terminal: vscode.Terminal | null | undefined = vscode.window.activeTerminal;
    if (!terminal || terminal.name !== TERMINAL_NAME) {
      const found = vscode.window.terminals.find((t) => t.name === TERMINAL_NAME);
      if (found) {
        terminal = found;
      } else {
        terminal = await this.createOpenCodeTerminal();
        if (terminal) {
          setTimeout(() => {
            terminal?.sendText(selectionText, false);
          }, 1500);
          return;
        }
      }
    }

    if (terminal) {
      terminal.show();
      terminal.sendText(selectionText, false);
    }
  }
}
