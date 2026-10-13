# OpenCode BLS — User Documentation & Technical Specification

> **Document Identifier:** `DOC-BLS-README-001`  
> **Applicable Standard:** ISO/IEC/IEEE 26514:2018 (*Systems and software engineering — Requirements for designers and developers of user documentation*)  
> **Software Target:** OpenCode BLS Extension for Visual Studio Code & Antigravity IDE  
> **Extension Identifier:** `bls-ve.opencode-bls`  
> **Version:** `1.0.1` | **Release Date:** `2026-10-13` (ISO 8601)  
> **Status:** Approved / Production  

---

## 1. Scope & Purpose

This document provides user, operational, and reference documentation for **OpenCode BLS** (`bls-ve.opencode-bls`), an optimized Visual Studio Code extension engineered to seamlessly interface with the **OpenCode v2.x** and **OpenCode v1.x** AI agent CLI runtimes. 

This extension supersedes the legacy `sst-dev.opencode` client by eliminating obsolete command-line parameters (`--port`), adding multi-platform binary resolution, integrating OpenCode v2 background daemon services, and ensuring zero-friction cross-platform shell compatibility.

---

## 2. Target Audience & System Requirements

### 2.1 Target Audience
In accordance with ISO/IEC/IEEE 26514 Clause 7.3, this document is structured for:
* **Software Developers & AI Practitioners**: Integrating OpenCode directly into their daily coding workflow.
* **Extension Maintainers & Contributors**: Modifying, testing, or building the extension from source.
* **DevOps & System Administrators**: Deploying `.vsix` packages across team workstations.

### 2.2 System Prerequisites
* **Editor Platform**: Visual Studio Code `^1.90.0` or Antigravity IDE.
* **Runtime**: Node.js `^20.17.0` (for building/packaging).
* **OpenCode CLI**: OpenCode v2.x (recommended) or v1.x installed via official installer, Homebrew, or npm.
* **Supported Operating Systems**:
  * **Microsoft Windows**: Windows 10 / 11 (x64, ARM64) — PowerShell 5.1/7+, CMD, Git Bash.
  * **Apple macOS**: macOS 12+ (Apple Silicon M-series & Intel) — Zsh, Bash, Fish.
  * **Linux**: Ubuntu/Debian, Fedora, Arch, and compatible POSIX distributions — Bash, Zsh, Fish.

---

## 3. Normative & Informative References

This specification references the following international standards:

| Standard / Reference          | Title / Description                                                                                | Applicability                                              |
|:------------------------------|:---------------------------------------------------------------------------------------------------|:-----------------------------------------------------------|
| **ISO/IEC/IEEE 26514:2018**   | Systems and software engineering — Requirements for designers and developers of user documentation | Documentation structure, clarity, and fault recovery       |
| **ISO 8601**                  | Date and time representation (`YYYY-MM-DD`)                                                        | Release dates, logs, and changelog records                 |
| **ISO/IEC 25010:2011**        | Systems and software quality requirements and evaluation (SQuaRE) — Quality models                 | Usability, reliability, and portability evaluation         |
| **SemVer 2.0.0**              | Semantic Versioning Specification                                                                  | Software release, dependency, and compatibility management |
| **VS Code API Specification** | Visual Studio Code Extensibility Platform API (`@types/vscode ^1.90.0`)                            | Extension runtime lifecycle and terminal management        |

---

## 4. Terms, Definitions & Acronyms

| Term / Acronym          | Definition                                                                                                        |
|:------------------------|:------------------------------------------------------------------------------------------------------------------|
| **CLI**                 | *Command Line Interface*: The standalone terminal binary for OpenCode (`opencode`).                               |
| **TUI**                 | *Terminal User Interface*: The interactive text-based interface presented by OpenCode v2 inside the terminal.     |
| **Daemon / Service**    | Background headless process spawned by OpenCode v2 (`opencode service start`) exposing local HTTP/REST endpoints. |
| **PTY**                 | *Pseudoterminal*: The underlying terminal device emulation managed by VS Code for interactive processes.          |
| **VSIX**                | The standard packaging and distribution archive format for Visual Studio Code extensions.                         |
| **IPC**                 | *Inter-Process Communication*: Protocols enabling the extension to communicate with editor windows and terminals. |
| **Call Operator (`&`)** | PowerShell execution operator required to invoke strings or quoted paths as commands.                             |

---

## 5. Architectural Overview & Key Capabilities

```
+-----------------------------------------------------------------+
| Visual Studio Code / IDE                                    |
|-------------------------------------------------------------|
| +---------------------+             +---------------------+ |
|                                                             |
|                                                             |
|                                                             |
| +---------------------+                                     |
|                                                             |
|                                                             |
| v                                   v                       |
| +---------------------------------------------------------+ |
|                                                             |
|                                                             |
|                                                             |
| +---------------------------------------------------------+ |
+-----------------------------------------------------------------+
                               |
                               v
+-----------------------------------------------------------------+
|               OpenCode v2 Daemon Service (Localhost)            |
|   http://127.0.0.1:49374 (Web Dashboard & Management API)       |
+-----------------------------------------------------------------+
```

1. **Native OpenCode v2 Execution**: Invokes OpenCode directly without legacy `--port` parameters that cause launch crashes.
2. **Multi-Tiered Binary Auto-Detection**: Searches in user settings, standard installer paths (`~/.opencode/bin`), Homebrew (`/opt/homebrew/bin`), system bin paths, and system `$PATH`.
3. **PowerShell & Windows First-Class Support**: Handles PowerShell quoted string execution via call operators (`&`), avoids npm extensionless bash wrappers, and prevents prompt text pollution.
4. **Daemon & Web Dashboard Integration**: Inspects `opencode service status` and opens the web dashboard in the browser with one click.
5. **Configurable Workspace Layout**: Supports side-by-side split editor (`beside`) and bottom terminal panel (`panel`).
6. **OpenCode v1 Backward Compatibility**: Automatically detects v1 binaries and provides graceful upgrade guidance for v2-exclusive features.

> For exhaustive technical fault analysis and migration history, see the [Troubleshooting & Migration Guide](TROUBLESHOOTING.md).

---

## 6. Command & Keybinding Reference

| Command Identifier                     | Windows / Linux Keybinding |  macOS Keybinding   | Operational Description                                                        |
|:---------------------------------------|:--------------------------:|:-------------------:|:-------------------------------------------------------------------------------|
| **`opencode.openTerminal`**            |        `Ctrl + Esc`        |     `Cmd + Esc`     | Opens or focuses the active OpenCode terminal session.                         |
| **`opencode.openNewTerminal`**         |    `Ctrl + Shift + Esc`    | `Cmd + Shift + Esc` | Forces creation of a new OpenCode terminal tab.                                |
| **`opencode.addFilepathToTerminal`**   |      `Ctrl + Alt + K`      |   `Cmd + Alt + K`   | Injects relative file and line reference (`@path/file.ts#L10-25`) into prompt. |
| **`opencode.sendSelectionToTerminal`** |      `Ctrl + Alt + L`      |   `Cmd + Alt + L`   | Pipes active editor code selection directly to the OpenCode session.           |
| **`opencode.openWebUI`**               |    *(Command Palette)*     | *(Command Palette)* | Queries service status and launches the v2 Web Dashboard in browser.           |
| **`opencode.startService`**            |    *(Command Palette)*     | *(Command Palette)* | Starts the OpenCode v2 background daemon service.                              |

---

## 7. Configuration Specification (`settings.json`)

Configure extension behavior via user or workspace settings (`settings.json`):

```json
{
  // Custom absolute path to the opencode executable. Leave empty for auto-detection.
  "opencode.executablePath": "",

  // Terminal location: "beside" (side-by-side split editor) or "panel" (bottom panel).
  "opencode.terminalLocation": "beside",

  // Additional CLI arguments passed when launching OpenCode (e.g. ["--auto"]).
  "opencode.extraArgs": [],

  // Explicit URL for the OpenCode v2 Web Dashboard. Auto-detected if empty.
  "opencode.webUrl": ""
}
```

---

## 8. Operating Procedures (Task Workflows)

### Procedure 8.1: Running in Development Mode
1. Open the repository root in VS Code or Antigravity IDE.
2. Press **`F5`** (or execute the `Launch Extension (F5)` task).
3. An **Extension Development Host** window opens with the live extension loaded.

### Procedure 8.2: Packaging into Installable VSIX
To package the extension into an installable `.vsix` file:
```bash
npm run build:vsix
```
*Expected Result*: Generates `opencode-bls-1.0.1.vsix` in the workspace root.

### Procedure 8.3: Installing into Editor Environments
* **Antigravity IDE**:
  ```bash
  antigravity-ide --install-extension opencode-bls-1.0.1.vsix
  ```
* **Visual Studio Code**:
  ```bash
  code --install-extension opencode-bls-1.0.1.vsix
  ```
* **Graphical Interface**:
  1. Open the **Extensions** view (`Ctrl+Shift+X` / `Cmd+Shift+X`).
  2. Click the `...` (More Actions) menu in the top right.
  3. Select **Install from VSIX...** and select `opencode-bls-1.0.1.vsix`.
  4. Reload window (`Ctrl+Shift+P` -> `Developer: Reload Window`).

---

## 9. Cross-Platform & Shell Architecture Considerations

### 9.1 Windows & PowerShell Environments
* **Quoted Path Execution**: When invoking executable paths with spaces in PowerShell, quoting the path (`"C:\path\to\opencode.cmd"`) treats it as a string literal and prints it to stdout instead of running it. OpenCode BLS automatically invokes `opencode` directly when present in `$PATH`, and prepends the call operator (`&`) for custom paths in PowerShell.
* **npm Wrapper Resolution**: On Windows, npm creates three files in `%APPDATA%\npm`: an extensionless POSIX shell script, a `.cmd` batch file, and a `.ps1` script. OpenCode BLS prioritizes `.cmd` and `.exe` binaries over extensionless shell scripts.
* **Prompt Cleanliness**: Terminal startup does not inject unrequested text strings, avoiding syntax errors and dirty command prompts.

### 9.2 macOS & Linux Environments
* **Apple Silicon Homebrew**: On macOS M-series chips, Homebrew installs to `/opt/homebrew/bin`. When launching GUI editors from macOS Finder or Dock, terminal rc files are not sourced, leaving `/opt/homebrew/bin` absent from GUI `$PATH`. OpenCode BLS explicitly probes `/opt/homebrew/bin` and user locations (`~/.opencode/bin`, `~/.local/bin`, `~/.bun/bin`).
* **Path Separator Normalization**: Relative file references sent to the terminal are normalized with forward slashes (`/`), conforming to OpenCode CLI parsing standards on all platforms.

---

## 10. Repository File Structure

```
opencode-bls/
├── src/
│   ├── extension.ts     # Extension entry point, command registration & status bar item
│   ├── terminal.ts      # Terminal lifecycle, shell execution & @file reference insertion
│   ├── binary.ts        # Cross-platform binary resolution & SemVer validation
│   └── service.ts       # OpenCode v2 daemon service & Web UI integration
├── images/              # Light and dark theme vector action icons
├── .vscode/             # Development launch tasks and F5 configuration
├── esbuild.js           # Production bundler configuration
├── CHANGELOG.md         # ISO 8601 & Keep a Changelog revision history
├── TROUBLESHOOTING.md   # Fault recovery & migration guide (ISO/IEC/IEEE 26514)
├── package.json         # Extension manifest (bls-ve.opencode-bls)
└── tsconfig.json        # TypeScript compiler options
```

---

## 11. Maintenance & Authorship

* **Author:** Francisco Prado (BLS Venezuela 🇻🇪)
* **Publisher Identifier:** `bls-ve`
* **GitHub Repository:** [https://github.com/panchove/opencode-bls](https://github.com/panchove/opencode-bls)
* **Email:** [fpradove@gmail.com](mailto:fpradove@gmail.com)
* **License:** MIT License
