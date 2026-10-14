# OpenCode BLS — Agent Quickstart Guide

Every line in this file answers: "Would an agent likely miss this without help?"

## Critical Commands

| Action | Command |
|--------|---------|
| Compile TypeScript | `npm run compile` |
| Type-check only | `npm run check-types` |
| Watch (TS + esbuild) | `npm run watch` |
| Package VSIX | `npm run build:vsix` |
| Publish VSIX | `npm run package && npx @vscode/vsce package` |

## Extension Commands (Cmd/Palette)

| Command | Keybinding (Win/Lin) | Keybinding (macOS) |
|---------|---------------------|-------------------|
| Open/Focus Terminal | `Ctrl+Esc` | `Cmd+Esc` |
| Open New Terminal | `Ctrl+Shift+Esc` | `Cmd+Shift+Esc` |
| Add File Ref (`@path#L...`) | `Ctrl+Alt+K` | `Cmd+Alt+K` |
| Send Selection to Terminal | `Ctrl+Alt+L` (selection) | `Cmd+Alt+L` (selection) |
| Open Web UI (v2 Dashboard) | Command Palette | Command Palette |
| Start Service Daemon | Command Palette | Command Palette |

**⚠️ Critical**: Never pass `--port` to `opencode`. OpenCode v2 removed it entirely; the CLI rejects it with `unknown flag: --port`. Use `opencode.extraArgs` in settings.json for custom flags.

## Binary Resolution

The extension searches for `opencode` in this priority:

1. **User setting** `"opencode.executablePath"` (with `~` expansion)
2. **Standard installer**: `~/.opencode/bin/opencode` (`.exe`/`.cmd` on Windows)
3. **User local bin**: `~/.local/bin/opencode`
4. **macOS Apple Silicon**: `/opt/homebrew/bin/opencode`
5. **macOS/Linux**: `/usr/local/bin/opencode`, `/usr/bin/opencode`
6. **Bun**: `~/.bun/bin/opencode`
7. **System PATH** (`where opencode` on Windows, `which opencode` on POSIX)

If binary is not found, use "Configure Path" from the error prompt or set `"opencode.executablePath"` in settings.

## PowerShell on Windows

- If `opencode` is on `$PATH`, invoke directly as `opencode` (works across PowerShell, CMD, Git Bash).
- If using a **full path** in settings, the extension auto-prepends the call operator (`&`). Do not add `&` manually when the extension handles it.

## macOS Apple Silicon

- VS Code launched from Finder/Dock may miss `/opt/homebrew/bin` in `$PATH`. The extension probes this path automatically; if unresolved, set `"opencode.executablePath"` in settings.json.

## Service Daemon (Web UI)

- `opencode.startService` — starts the v2 background daemon (`opencode service start`). Shows a progress notification.
- `opencode.openWebUI` — queries `opencode service status`, opens the dashboard in-browser. If the daemon is not running, prompts to start it.
- Both are **v2-only**: running against an OpenCode v1 binary shows a warning with an "Upgrade Guide" button.

**⚠️ Verification**: Run `opencode.openTerminal`, then `opencode.openWebUI`. If v1 is detected, the upgrade guide action is available.

## Key Files (navigation)

| File | Purpose |
|------|---------|
| `src/extension.ts` | Entry point, command registration & status bar |
| `src/terminal.ts` | Terminal lifecycle, shell execution, `@file` references |
| `src/binary.ts` | Cross-platform binary resolution & SemVer validation |
| `src/service.ts` | Daemon service & Web UI integration |
| `tsconfig.json` | TypeScript compiler options |
| `esbuild.js` | Production bundler configuration |
| `.vscode/tasks.json` | Watch build task |
| `.vscode/launch.json` | F5 debug launch config |

## Tips & Reminders

- **Reference files**: `Ctrl+Alt+K` normalizes paths with forward slashes (`/`) and generates `@relative/path#L10-25`.
- **Send selection**: `Ctrl+Alt+L` (or `Cmd+Alt+K`) pipes editor text directly into the OpenCode terminal.
- **Prompt cleanliness**: The terminal opens without unsolicited injected text. Reference insertion is exclusively user-triggered (`Ctrl+Alt+K`).
- **v1 vs v2**: If you invoke Web UI or daemon features against OpenCode v1, you'll get an informative notification with a one-click upgrade guide to https://opencode.ai.