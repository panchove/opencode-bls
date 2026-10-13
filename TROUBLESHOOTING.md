# OpenCode BLS — Fault Analysis, Troubleshooting & Migration Guide

> **Document Identifier:** `DOC-BLS-TROUBLESHOOTING-001`  
> **Applicable Standard:** ISO/IEC/IEEE 26514:2018 Clause 9.3 (*Problem determination and recovery procedures*)  
> **Software Target:** OpenCode BLS Extension for Visual Studio Code & Antigravity IDE  
> **Extension Identifier:** `bls-ve.opencode-bls`  
> **Version:** `1.0.1` | **Release Date:** `2026-10-13` (ISO 8601)  
> **Status:** Approved / Production  

---

## 1. Scope & Diagnostic Objective

This document defines the technical fault analysis, root-cause diagnosis, error recovery procedures, and version migration specifications for **OpenCode BLS** (`bls-ve.opencode-bls`). 

It provides detailed technical documentation on resolving incompatibilities introduced by the legacy `sst-dev.opencode` extension, addressing operating system and shell quirks across Windows, macOS, and Linux, and ensuring reliable terminal session management.

---

## 2. Diagnostic Severity Classification

In accordance with ISO/IEC 25010 reliability criteria, issues documented herein are classified according to operational severity:

| Severity Level | Description                                     | Impact                                                                     |
|:---------------|:------------------------------------------------|:---------------------------------------------------------------------------|
| **Critical**   | Process termination or complete launch failure. | Prevents starting an interactive OpenCode session.                         |
| **Major**      | Shell or operating system incompatibility.      | CLI fails to run on specific shell configurations (e.g. PowerShell).       |
| **Minor**      | Graceful degradation or feature unavailability. | Feature restricted (e.g. Web UI on OpenCode v1) with informative guidance. |

---

## 3. Fault Catalog & Recovery Procedures

### 3.1 Fault Record ERR-CLI-001: Launch Crash with `unknown flag: --port`

* **Severity:** Critical
* **Affected Component:** Terminal launch command invocation (`src/terminal.ts`)

#### Symptoms
When initiating an OpenCode session from the editor, the integrated terminal immediately terminates with exit code 1 and logs:
```
unknown flag: --port
Usage: opencode [command]
```

#### Root Cause
The legacy extension (`sst-dev.opencode`) was hardcoded to spawn the CLI using:
```bash
opencode --port <random_assigned_port>
```
In OpenCode v2.x, the root-level `--port` flag was completely removed from the CLI interface. OpenCode v2 operates as an interactive TUI directly, delegating web and port handling to a separate daemon architecture (`opencode service`). Passing `--port` to the root command causes the CLI parser to reject the argument.

#### Resolution & Mitigation
* **Clean Execution**: OpenCode BLS invokes `opencode` cleanly without injecting legacy flags.
* **Configurable Extra Arguments**: When specialized flags are required, users can configure `"opencode.extraArgs": ["..."]` via `settings.json`.

#### Verification Procedure
1. Trigger `opencode.openTerminal` (`Ctrl+Esc` / `Cmd+Esc`).
2. Verify the terminal opens an interactive OpenCode TUI prompt without error messages.

---

### 3.2 Fault Record ERR-BIN-002: Binary Not Found in Editor `$PATH`

* **Severity:** Critical
* **Affected Component:** Binary resolver subsystem (`src/binary.ts`)

#### Symptoms
Triggering OpenCode displays the error notification:
```
OpenCode: 'opencode' executable was not found on your system or ~/.opencode/bin/opencode.
```
Or in the terminal buffer:
```
opencode: command not found
```

#### Root Cause
1. The official OpenCode installer installs the binary into `~/.opencode/bin/opencode`.
2. When desktop environments (macOS Finder/Dock, Linux Desktop Environments, Windows desktop shortcuts) launch GUI applications like VS Code, they spawn under a minimal non-interactive shell environment that does **not** source user shell profiles (`~/.bashrc`, `~/.zshrc`). As a result, user binary directories (`~/.opencode/bin`, `~/.local/bin`, `/opt/homebrew/bin`) are absent from `process.env.PATH`.

#### Resolution & Mitigation
* **Multi-Tiered Resolution Hierarchy**: OpenCode BLS scans candidates in prioritized sequence:
  1. User setting: `"opencode.executablePath"` (with tilde `~` home directory expansion).
  2. Standard installer path: `~/.opencode/bin/opencode`.
  3. Linux user local bin: `~/.local/bin/opencode`.
  4. macOS Apple Silicon Homebrew: `/opt/homebrew/bin/opencode`.
  5. Unix standard bin: `/usr/local/bin/opencode` and `/usr/bin/opencode`.
  6. Bun package bin: `~/.bun/bin/opencode`.
  7. System `$PATH` resolution via `which opencode` (Unix) / `where opencode` (Windows).
* **Actionable Recovery Notification**: If unresolvable, presents direct action buttons to view the official install guide or navigate to the executable path setting.

#### Verification Procedure
1. Launch VS Code from macOS Finder or desktop shortcut (non-terminal).
2. Execute `OpenCode: Open or Focus Terminal`. Verify the binary resolves without errors.

---

### 3.3 Fault Record ERR-WIN-003: Windows PowerShell Quoted Path Evaluation & npm Wrappers

* **Severity:** Major
* **Affected Component:** Windows shell dispatcher (`src/terminal.ts`) & binary resolver (`src/binary.ts`)

#### Symptoms
On Windows workstations running the default PowerShell terminal, launching OpenCode prints the file path as plain text without executing, followed by unrequested reference text:
```powershell
PS C:\desarrollos\opencode-bls> "C:\Users\username\AppData\Roaming\npm\opencode"
C:\Users\username\AppData\Roaming\npm\opencode
PS C:\desarrollos\opencode-bls> In @[CHANGELOG.md]
```

#### Root Cause
1. **PowerShell Quoted Path Evaluation**: Unlike `cmd.exe` or Unix shells, PowerShell treats `"path\to\binary"` as a string literal and echoes it to standard output. Executing a quoted binary in PowerShell requires the call operator (`& "path\to\binary"`).
2. **npm Windows Wrapper Structure**: When packages are installed globally via `npm install -g`, npm places an extensionless POSIX shell script (`opencode`) alongside Windows batch (`opencode.cmd`) and PowerShell (`opencode.ps1`) scripts in `%APPDATA%\npm`. Running `where opencode` returns the extensionless file first. Windows shells cannot execute extensionless POSIX scripts natively.
3. **Unsolicited Terminal Injection**: A legacy timer injected `In @...` into the terminal buffer regardless of launch success, dirtying the shell prompt.

#### Resolution & Mitigation
* **Native Invocation via `$PATH`**: If `opencode` is present in system `$PATH`, OpenCode BLS sends `opencode` directly without quotes, running uniformly across PowerShell, CMD, Git Bash, and Unix shells.
* **Dynamic Call Operator (`&`)**: When full paths are used in PowerShell (`vscode.env.shell`), the call operator is automatically prepended (`& "${binInfo.path}"`).
* **Extension Prioritization on Windows**: Candidate checks on Windows prioritize `.cmd`, `.exe`, and `.bat` files over extensionless wrapper scripts.
* **Clean Prompt Initialization**: Eliminated unsolicited startup text injection. Context reference insertion is delegated exclusively to the user-triggered command (`Ctrl+Alt+K`).

#### Verification Procedure
1. On Windows with PowerShell as default terminal, execute `OpenCode: Open or Focus Terminal`.
2. Confirm OpenCode launches immediately into the TUI prompt without echoing the string or printing unsolicited text.

---

### 3.4 Fault Record ERR-SRV-004: Daemon Service Status & Web UI Integration

* **Severity:** Minor
* **Affected Component:** Service manager subsystem (`src/service.ts`)

#### Symptoms
Users attempting to open the OpenCode v2 Web Dashboard were unable to discover the local port or verify whether the background daemon was active.

#### Root Cause
OpenCode v2 introduces a headless service daemon architecture (`opencode service start`) exposing local HTTP endpoints (e.g. `http://127.0.0.1:49374`). The legacy extension had no awareness of daemon lifecycle commands.

#### Resolution & Mitigation
* **`opencode.startService`**: Starts the OpenCode v2 daemon via progress notification dialog.
* **`opencode.openWebUI`**: Queries `opencode service status` to obtain the live endpoint URL and opens it in the default system browser. If stopped, prompts to start it with one click.
* **Configurable Web URL**: Supports `"opencode.webUrl"` in settings for remote or fixed-port deployments.

#### Verification Procedure
1. Execute `OpenCode: Open Web UI (v2 Dashboard)` from Command Palette.
2. Confirm the dashboard launches in the browser, or prompts to start the daemon if inactive.

---

### 3.5 Fault Record ERR-REF-005: Context Reference Insertion & Selection Piping

* **Severity:** Minor
* **Affected Component:** Reference generator (`src/terminal.ts`)

#### Symptoms
Users need to reference active editor files and lines without manually copying paths into the prompt.

#### Resolution & Mitigation
* **`opencode.addFilepathToTerminal` (`Ctrl+Alt+K` / `Cmd+Alt+K`)**:
  - Converts active document and selection into standard OpenCode reference syntax: `@relative/path/to/file#L10-25`.
  - Normalizes path separators to forward slashes (`/`) across all platforms.
  - If the terminal was newly opened, includes a 1.5s initialization delay to allow the TUI to be ready for input.
* **`opencode.sendSelectionToTerminal` (`Ctrl+Alt+L` / `Cmd+Alt+L`)**:
  - Directly pipes the selected text into the active OpenCode terminal session.

---

## 4. Backward Compatibility Specification (OpenCode v1.x)

### 4.1 Compatibility Matrix (ISO/IEC 25010)

| Feature                                      | OpenCode v1.x | OpenCode v2.x | Operational Behavior in OpenCode BLS                                         |
|:---------------------------------------------|:-------------:|:-------------:|:-----------------------------------------------------------------------------|
| **Interactive Terminal (`Ctrl+Esc`)**        |  ✅ Supported  |  ✅ Supported  | Runs `opencode` cleanly in terminal without deprecated `--port` flags.       |
| **Insert Reference (`@file#L...`)**          |  ✅ Supported  |  ✅ Supported  | Fully compatible with prompt reference syntax and normalized `/` separators. |
| **Send Code Selection**                      |  ✅ Supported  |  ✅ Supported  | Directly pipes selected editor text to terminal buffer.                      |
| **Binary Auto-detection**                    |  ✅ Supported  |  ✅ Supported  | Scans settings, standard directories, Homebrew, and system `$PATH`.          |
| **Daemon Service (`opencode.startService`)** |   ⚠️ v2-only   |  ✅ Supported  | Displays informative notification with one-click **"Upgrade Guide"** action. |
| **Web Dashboard (`opencode.openWebUI`)**     |   ⚠️ v2-only   |  ✅ Supported  | Displays informative notification with one-click **"Upgrade Guide"** action. |

### 4.2 Graceful Fallback Strategy
Instead of failing with shell errors when run against an OpenCode v1 installation, OpenCode BLS inspects the major version via SemVer regular expression parsing (`v?(\d+)\.`). If a v1 binary is detected and the user invokes a v2-exclusive service feature, an informative dialog is presented:
> *"OpenCode Web UI requires OpenCode v2.x (detected v1.x). Please upgrade to use this feature."*  
Accompanied by a direct button to the official upgrade guide (`https://opencode.ai`).

---

## 5. Verification & Audit Checklist

Use this checklist to verify compliance across environments:

* [x] **Windows (PowerShell)**: `opencode` launches cleanly without call operator string echo.
* [x] **Windows (CMD)**: `opencode` launches cleanly without syntax errors.
* [x] **macOS (Apple Silicon)**: Detects `/opt/homebrew/bin/opencode` when opened from Finder/Dock.
* [x] **macOS (Intel)**: Detects `/usr/local/bin/opencode`.
* [x] **Linux (POSIX)**: Detects `~/.opencode/bin` and `~/.local/bin` using `which opencode`.
* [x] **Keybindings**: `Cmd` mappings verified on macOS; `Ctrl` mappings verified on Windows/Linux.
* [x] **Reference Paths**: Output formatted with forward slashes (`@src/index.ts#L10-20`).
* [x] **Prompt Cleanliness**: Terminal opens without unsolicited injected text strings.
