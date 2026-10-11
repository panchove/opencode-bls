import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";
import { resolveOpenCodeBinary } from "./binary";

const execAsync = promisify(exec);

export class OpenCodeServiceManager {
  /**
   * Retrieves the current OpenCode v2 service URL (e.g. http://127.0.0.1:49374)
   */
  public async getServiceUrl(): Promise<string | null> {
    const config = vscode.workspace.getConfiguration("opencode");
    const configuredUrl = config.get<string>("webUrl", "").trim();
    if (configuredUrl) {
      return configuredUrl;
    }

    const binInfo = await resolveOpenCodeBinary();
    if (!binInfo) {
      return null;
    }

    try {
      const { stdout } = await execAsync(`"${binInfo.path}" service status`, { timeout: 3000 });
      const url = stdout.trim();
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
      }
    } catch {
      // Service might not be started
    }

    return null;
  }

  /**
   * Starts the background daemon service.
   */
  public async startService(): Promise<string | null> {
    const binInfo = await resolveOpenCodeBinary();
    if (!binInfo) {
      vscode.window.showErrorMessage("OpenCode: Executable not found.");
      return null;
    }

    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Starting OpenCode v2 service...",
        cancellable: false,
      },
      async () => {
        try {
          await execAsync(`"${binInfo.path}" service start`, { timeout: 7000 });
          const url = await this.getServiceUrl();
          vscode.window.showInformationMessage(`OpenCode service started successfully: ${url || "Active"}`);
          return url;
        } catch (err: any) {
          vscode.window.showErrorMessage(`Failed to start service: ${err?.message || err}`);
          return null;
        }
      }
    );
  }

  /**
   * Opens the Web UI dashboard for OpenCode v2.
   */
  public async openWebUI(): Promise<void> {
    let url = await this.getServiceUrl();

    if (!url) {
      const start = await vscode.window.showInformationMessage(
        "The OpenCode v2 service does not appear to be running. Would you like to start it?",
        "Start Service",
        "Cancel"
      );
      if (start === "Start Service") {
        url = await this.startService();
      }
    }

    if (url) {
      await vscode.env.openExternal(vscode.Uri.parse(url));
    }
  }
}
