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
        "OpenCode: No se encontró el ejecutable 'opencode' en el sistema ni en ~/.opencode/bin/opencode.",
        "Ver Guía de Instalación",
        "Configurar Ruta"
      );

      if (action === "Ver Guía de Instalación") {
        vscode.env.openExternal(vscode.Uri.parse("https://opencode.ai"));
      } else if (action === "Configurar Ruta") {
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
    const argsString = extraArgs.length > 0 ? " " + extraArgs.join(" ") : "";
    const launchCommand = `"${binInfo.path}"${argsString}`;
    terminal.sendText(launchCommand);

    // If an editor has an active file or selection, optionally provide quick context
    const ref = this.getActiveFileReference();
    if (ref) {
      // Small pause to allow TUI prompt to initialize before sending file reference
      setTimeout(() => {
        terminal.sendText(`In ${ref}`, false);
      }, 1200);
    }

    return terminal;
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

    let ref = `@${vscode.workspace.asRelativePath(docUri, false)}`;
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
      vscode.window.showInformationMessage("OpenCode: No hay un archivo o selección activa para referenciar.");
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
      vscode.window.showInformationMessage("OpenCode: No hay texto seleccionado para enviar.");
      return;
    }

    let terminal: vscode.Terminal | null | undefined = vscode.window.activeTerminal;
    if (!terminal || terminal.name !== TERMINAL_NAME) {
      terminal = await this.openTerminal();
    }

    if (terminal) {
      terminal.show();
      terminal.sendText(selectionText, false);
    }
  }
}
