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
}

/**
 * Searches for the OpenCode executable on the system.
 * Checks user configuration first, then PATH, and standard install locations like ~/.opencode/bin/opencode.
 */
export async function resolveOpenCodeBinary(): Promise<OpenCodeBinaryInfo | null> {
  const config = vscode.workspace.getConfiguration("opencode");
  const configuredPath = config.get<string>("executablePath", "").trim();

  // 1. Configured path
  if (configuredPath) {
    const resolvedConfigPath = expandHome(configuredPath);
    if (fs.existsSync(resolvedConfigPath)) {
      return getBinaryDetails(resolvedConfigPath);
    }
    vscode.window.showWarningMessage(
      `OpenCode: Configured path "${configuredPath}" does not exist. Searching standard locations...`
    );
  }

  // 2. Standard ~/.opencode/bin/opencode location (primary location for OpenCode v2 installer)
  const home = os.homedir();
  const candidatePaths = [
    path.join(home, ".opencode", "bin", "opencode"),
    path.join(home, ".local", "bin", "opencode"),
    "/usr/local/bin/opencode",
    "/usr/bin/opencode",
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return getBinaryDetails(candidate);
    }
  }

  // 3. System PATH check
  try {
    const isWindows = process.platform === "win32";
    const whichCmd = isWindows ? "where opencode" : "which opencode";
    const { stdout } = await execAsync(whichCmd);
    const firstLine = stdout.trim().split(/\r?\n/)[0];
    if (firstLine && fs.existsSync(firstLine)) {
      return getBinaryDetails(firstLine);
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

async function getBinaryDetails(binPath: string): Promise<OpenCodeBinaryInfo> {
  let versionStr: string | undefined;
  let isV2 = true;

  try {
    const { stdout } = await execAsync(`"${binPath}" --version`, { timeout: 3000 });
    versionStr = stdout.trim();
    if (versionStr) {
      isV2 = versionStr.includes("v2.") || versionStr.includes("2.");
    }
  } catch {
    // Fallback default
  }

  return {
    path: binPath,
    version: versionStr,
    isV2,
  };
}
