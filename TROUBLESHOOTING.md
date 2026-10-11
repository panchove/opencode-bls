# Troubleshooting & Migration Guide: OpenCode v1 to v2

This document details the critical technical issues identified in the legacy extension (`sst-dev.opencode`), why they fail with OpenCode v2.x, and how **OpenCode BLS** resolves each of them.

---

## 1. Crash on Launch: `unknown flag: --port`

### Symptoms
When attempting to launch OpenCode from the editor, the terminal immediately exits or throws an error:
```
unknown flag: --port
Usage: opencode [command]
```

### Root Cause
The legacy extension (`sst-dev.opencode`) was hardcoded to invoke the CLI using:
```bash
opencode --port <random_assigned_port>
```
In OpenCode v2.x, the `--port` flag at the root CLI command was deprecated and completely removed. OpenCode v2 runs as an interactive TUI directly or through a background daemon (`opencode service`). Passing `--port` to the root command causes the CLI parser to reject the argument and terminate with exit code 1.

### How OpenCode BLS Fixed It
- **Clean Execution**: OpenCode BLS invokes `opencode` directly without injecting invalid legacy flags.
- **Configurable Arguments**: If custom arguments are needed, users can configure `"opencode.extraArgs": ["..."]` in VS Code settings.

---

## 2. Binary Not Found in Editor `$PATH` (`~/.opencode/bin/opencode`)

### Symptoms
Clicking the OpenCode button or running `Ctrl+Esc` displays an error:
```
OpenCode: 'opencode' executable was not found on your system or ~/.opencode/bin/opencode.
```
Or in the terminal:
```
opencode: command not found
```

### Root Cause
1. The official OpenCode installer installs the binary into `~/.opencode/bin/opencode` by default.
2. When desktop environments (Linux DEs, macOS Finder, or desktop shortcuts) launch GUI applications like VS Code or Antigravity IDE, they often spawn with a minimal non-interactive shell environment that does **not** source `~/.bashrc` or `~/.zshrc`. As a result, `~/.opencode/bin` is absent from `process.env.PATH`.

### How OpenCode BLS Fixed It
- **Multi-tiered Resolution**: OpenCode BLS automatically scans the following locations in priority order:
  1. User custom setting: `"opencode.executablePath"` (with tilde expansion `~`).
  2. Standard installer path: `~/.opencode/bin/opencode`.
  3. User local bin: `~/.local/bin/opencode`.
  4. System bin paths: `/usr/local/bin/opencode` and `/usr/bin/opencode`.
  5. System `PATH` resolution via `which opencode` / `where opencode`.
- **Actionable Notification**: If not found anywhere, it provides one-click action buttons to either open the installation guide or jump directly to the setting to specify the binary path.

---

## 3. Background Daemon Service & Web Dashboard Integration

### Symptoms
Users wanting to interact with the new OpenCode v2 Web UI dashboard were unable to discover the local port or start the daemon from within the editor.

### Root Cause
OpenCode v2 introduces a headless service daemon (`opencode service start`) that exposes a web dashboard and API (e.g. `http://127.0.0.1:49374`). The legacy extension had no awareness of the daemon architecture.

### How OpenCode BLS Fixed It
- **Dedicated Service Manager**:
  - `opencode.startService`: Starts the OpenCode v2 daemon service directly from the Command Palette with progress notification.
  - `opencode.openWebUI`: Queries `opencode service status` to discover the live dashboard URL and opens it in your default browser. If the service is stopped, it prompts to start it with one click.
  - Configurable `"opencode.webUrl"` in settings for custom or remote server setups.

---

## 4. Line References and Code Selection Sharing

### Symptoms
Developers frequently need to reference specific code lines or send selected snippets to the AI terminal prompt without manual copy-pasting.

### How OpenCode BLS Solved It
- **`opencode.addFilepathToTerminal` (`Ctrl+Alt+K` / `Cmd+Alt+K`)**:
  - Converts active document and selection into standard OpenCode format: `@relative/path/to/file#L10-25`.
  - Automatically targets the active OpenCode terminal session.
- **`opencode.sendSelectionToTerminal` (`Ctrl+Alt+L` / `Cmd+Alt+L`)**:
  - Directly pipes the selected text into the terminal buffer.

---

## 5. Backward Compatibility with OpenCode v1.x

### Compatibility Matrix

| Feature | OpenCode v1.x | OpenCode v2.x | Behavior in OpenCode BLS |
|:---|:---:|:---:|:---|
| **Interactive Terminal (`Ctrl+Esc`)** | ✅ Supported | ✅ Supported | Runs `opencode` cleanly in the integrated terminal without deprecated flags |
| **Insert Reference (`@file#L...`)** | ✅ Supported | ✅ Supported | Fully compatible with prompt reference syntax |
| **Send Code Selection** | ✅ Supported | ✅ Supported | Directly pipes selected editor text to terminal |
| **Binary Auto-detection** | ✅ Supported | ✅ Supported | Scans `$PATH`, standard paths, and custom config |
| **Daemon Service (`opencode.startService`)** | ⚠️ v2-only | ✅ Supported | Graceful warning with one-click **"Upgrade Guide"** action |
| **Web Dashboard (`opencode.openWebUI`)** | ⚠️ v2-only | ✅ Supported | Graceful warning with one-click **"Upgrade Guide"** action |

### Graceful Fallback Strategy
Instead of failing with an OS or CLI command error when running on an OpenCode v1 installation, OpenCode BLS detects the major version via semver regex parsing (`v?(\d+)\.`). If a v1 binary is detected and the user triggers a v2-only service command, an informative dialog is presented:
> *"OpenCode Web UI requires OpenCode v2.x (detected v1.x). Please upgrade to use this feature."*
Along with a direct button to the official upgrade guide (`https://opencode.ai`).

