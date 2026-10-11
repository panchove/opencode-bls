# OpenCode BLS (VS Code Extension)

An optimized Visual Studio Code extension to interact seamlessly with **OpenCode v2.x**, designed to replace the original `sst-dev.opencode` extension (which relied on the `--port` flag that is now deprecated and incompatible with version 2).

---

## 🚀 Why this extension?

The original SST extension (`sst-dev.opencode`) was built for OpenCode v1 and launched the CLI with:
```bash
opencode --port <random_port>
```
In **OpenCode v2.x**:
- The `--port` flag at the root level no longer exists and causes launch failures (`unknown flag: --port`).
- OpenCode v2 uses a background service architecture (`opencode service`) alongside direct interactive TUI sessions.
- The binary is often installed in `~/.opencode/bin/opencode` and is not always included in the GUI editor's `$PATH`.

**OpenCode BLS** solves these issues:
1. **100% Compatible with OpenCode v2.x**: Launches the CLI natively without invalid flags.
2. **Smart Binary Resolution**: Automatically detects the executable in your `$PATH`, `~/.opencode/bin/opencode`, `~/.local/bin/opencode`, or via a custom configured path.
3. **Preserves familiar shortcuts and workflows** (`Ctrl+Esc`, `@file#L...` line reference insertion, selection sending, etc.).
4. **OpenCode v2 Web UI Integration**: Directly open the OpenCode v2 Web Dashboard from VS Code.
5. **Configurable Terminal Location**: Choose between opening side-by-side (`beside`) or in the bottom panel (`panel`).
6. **Backward Compatible with OpenCode v1.x**: Core terminal workflow and context piping work seamlessly across both v1 and v2, with graceful upgrade guidance for v2-exclusive features.

> For full technical details and debugging, see the [Troubleshooting & Migration Guide](TROUBLESHOOTING.md).

---

## ⌨️ Keybindings and Commands

| Command                                | Windows / Linux      | macOS               | Description                                                                        |
|:---------------------------------------|:---------------------|:--------------------|:-----------------------------------------------------------------------------------|
| **`opencode.openTerminal`**            | `Ctrl + Esc`         | `Cmd + Esc`         | Open or focus the active OpenCode terminal                                         |
| **`opencode.openNewTerminal`**         | `Ctrl + Shift + Esc` | `Cmd + Shift + Esc` | Open a new OpenCode terminal tab                                                   |
| **`opencode.addFilepathToTerminal`**   | `Ctrl + Alt + K`     | `Cmd + Alt + K`     | Insert active file and line selection reference (`@file#L10-20`) into the terminal |
| **`opencode.sendSelectionToTerminal`** | `Ctrl + Alt + L`     | `Cmd + Alt + L`     | Send selected code directly to the OpenCode terminal                               |
| **`opencode.openWebUI`**               | *(Command Palette)*  | *(Command Palette)* | Open the OpenCode v2 Web UI Dashboard                                              |
| **`opencode.startService`**            | *(Command Palette)*  | *(Command Palette)* | Start the OpenCode v2 background daemon service                                    |

Additionally:
- **Editor Title Bar Button**: Quick action button to launch OpenCode right next to your editor.
- **Status Bar Item**: Displays OpenCode status and detected version in the bottom status bar.

---

## ⚙️ Configuration (`settings.json`)

Customize the extension behavior in your VS Code settings:

```json
{
  // Custom path to the opencode binary (optional, if not in PATH or ~/.opencode/bin)
  "opencode.executablePath": "",

  // Terminal location: "beside" (side-by-side split editor) or "panel" (bottom panel)
  "opencode.terminalLocation": "beside",

  // Extra CLI arguments to pass when starting the terminal (e.g. ["--auto"])
  "opencode.extraArgs": [],

  // Web service URL if using a remote server or custom fixed port
  "opencode.webUrl": ""
}
```

---

## 🛠️ Development & Testing

### 1. Run in development (F5)
1. Open this repository in VS Code / Antigravity IDE.
2. Press **`F5`** (or run the `Launch Extension (F5)` task).
3. A new Extension Development Host window will launch with the extension running.

### 2. Build the `.vsix` package
To build an installable package:
```bash
npm run build:vsix
```
This will generate `opencode-bls-1.0.0.vsix` in the project root.

### 3. Install the extension in your environment (Antigravity IDE / VS Code)

**If using Antigravity IDE:**
```bash
antigravity-ide --install-extension opencode-bls-1.0.0.vsix
```

**If using standard VS Code:**
```bash
code --install-extension opencode-bls-1.0.0.vsix
```

Or via GUI:
- Open the **Extensions** view (`Ctrl+Shift+X`).
- Click the `...` menu in the top-right corner.
- Select **"Install from VSIX..."** and choose `opencode-bls-1.0.0.vsix`.
- Reload window (`Ctrl+Shift+P` -> `Developer: Reload Window`).

---

## 📁 Project Structure

```
opencode-bls/
├── src/
│   ├── extension.ts     # Extension entry point, command registration & status bar
│   ├── terminal.ts      # Terminal management & @file#L... reference passing
│   ├── binary.ts        # Detection and validation of the opencode v2 executable
│   └── service.ts       # OpenCode v2 daemon service & Web UI integration
├── images/              # Icons for light/dark themes and navigation button
├── .vscode/
│   ├── launch.json      # F5 debugging configuration
│   └── tasks.json       # Background build task (esbuild)
├── esbuild.js           # Fast bundling configuration
├── package.json         # Extension manifest
└── tsconfig.json        # TypeScript configuration
```

---

## 👤 Author

**Francisco Prado** (Venezuela 🇻🇪)
- GitHub: [@panchove](https://github.com/panchove)
- Email: [fpradove@gmail.com](mailto:fpradove@gmail.com)

