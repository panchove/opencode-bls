import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface OpenCodeBinaryInfo {
  path: string;
  version?: string;
  isV2: boolean;
  fromPath: boolean;
}

/**
 * Searches for the OpenCode executable on the system.
 * Checks user configuration first, then PATH, and standard install locations like ~/.opencode/bin/opencode.
 */
export async function resolveOpenCodeBinary(): Promise<OpenCodeBinaryInfo | null> {
  const config = vscode.workspace.getConfiguration("opencode");
  const configuredPath = config.get<string>("executablePath", "").trim();
  const isWindows = process.platform === "win32";

  // 1. Configured path
  if (configuredPath) {
    let resolvedConfigPath = expandHome(configuredPath);
    if (!fs.existsSync(resolvedConfigPath) && isWindows) {
      if (fs.existsSync(resolvedConfigPath + ".cmd")) {
        resolvedConfigPath += ".cmd";
      } else if (fs.existsSync(resolvedConfigPath + ".exe")) {
        resolvedConfigPath += ".exe";
      }
    }
    if (fs.existsSync(resolvedConfigPath)) {
      return getBinaryDetails(resolvedConfigPath, false);
    }
    vscode.window.showWarningMessage(
      `OpenCode: Configured path "${configuredPath}" does not exist. Searching standard locations...`
    );
  }

  // 2. Standard ~/.opencode/bin/opencode location (primary location for OpenCode v2 installer)
  const home = os.homedir();
  const candidatePaths = isWindows
    ? [
        path.join(home, ".opencode", "bin", "opencode.exe"),
        path.join(home, ".opencode", "bin", "opencode.cmd"),
        path.join(home, ".opencode", "bin", "opencode"),
        path.join(home, "AppData", "Roaming", "npm", "opencode.cmd"),
        path.join(home, ".local", "bin", "opencode.exe"),
        path.join(home, ".local", "bin", "opencode.cmd"),
        path.join(home, ".local", "bin", "opencode"),
      ]
    : [
        path.join(home, ".opencode", "bin", "opencode"),
        path.join(home, ".local", "bin", "opencode"),
        "/opt/homebrew/bin/opencode",
        "/usr/local/bin/opencode",
        "/usr/bin/opencode",
        path.join(home, ".bun", "bin", "opencode"),
      ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return getBinaryDetails(candidate, false);
    }
  }

  // 3. System PATH check
  try {
    const whichCmd = isWindows ? "where opencode" : "which opencode";
    const { stdout } = await execAsync(whichCmd);
    const lines = stdout
      .trim()
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    let chosenPath: string | undefined;

    if (isWindows) {
      // In Windows, npm generates both an extensionless bash script and .cmd / .exe files in PATH.
      // We must prefer .cmd, .exe, or .bat over the extensionless bash script.
      chosenPath = lines.find((l) => /\.(exe|cmd|bat)$/i.test(l));
      if (!chosenPath && lines.length > 0) {
        const first = lines[0];
        if (fs.existsSync(`${first}.cmd`)) {
          chosenPath = `${first}.cmd`;
        } else if (fs.existsSync(`${first}.exe`)) {
          chosenPath = `${first}.exe`;
        } else {
          chosenPath = first;
        }
      }
    } else {
      chosenPath = lines[0];
    }

    if (chosenPath && fs.existsSync(chosenPath)) {
      return getBinaryDetails(chosenPath, true);
    }
  } catch {
    // Not found in PATH
  }

  return null;
}

function expandHome(filepath: string): string {
  if (filepath.startsWith("~")) {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}

async function getBinaryDetails(binPath: string, fromPath = false): Promise<OpenCodeBinaryInfo> {
  let versionStr: string | undefined;
  let isV2 = true;

  try {
    const { stdout } = await execAsync(`"${binPath}" --version`, { timeout: 3000 });
    versionStr = stdout.trim();
    if (versionStr) {
      const match = versionStr.match(/v?(\d+)\./);
      if (match) {
        isV2 = parseInt(match[1], 10) >= 2;
      } else {
        isV2 = versionStr.includes("2.");
      }
    }
  } catch {
    // Fallback default
  }

  return {
    path: binPath,
    version: versionStr,
    isV2,
    fromPath,
  };
}
