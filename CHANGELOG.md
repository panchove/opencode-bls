# Changelog — OpenCode BLS

> **Document Identifier:** `DOC-BLS-CHANGELOG-001`  
> **Applicable Standards:** ISO 8601 (*Date and time format YYYY-MM-DD*), SemVer 2.0.0, Keep a Changelog  
> **Extension Identifier:** `bls.opencode-bls`  

All notable changes to the **OpenCode BLS** extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-10-13

### Fixed
- **Windows Terminal CLI Execution**: Fixed an issue in PowerShell where quoted binary paths were evaluated as string literals rather than executed with the call operator (`&`). When `opencode` is available in `PATH`, it is now invoked directly across all shells.
- **Windows Binary Resolution**: Prioritized Windows executable extensions (`.cmd`, `.exe`, `.bat`) over extensionless POSIX shell wrapper scripts in `%APPDATA%\npm`.
- **Unsolicited Terminal Input**: Removed unsolicited automatic `In @...` context injection on terminal launch that polluted the command prompt.
- **Path Separators**: Normalized relative file paths with forward slashes (`/`) for cross-platform OpenCode `@file` reference syntax.

## [1.0.0] - 2026-10-11

### Added
- **Native OpenCode v2.x Support**: Direct CLI execution without legacy `--port` parameters.
- **Smart Binary Auto-Detection**: Searches in `$PATH`, `~/.opencode/bin/opencode`, `~/.local/bin/opencode`, `/usr/local/bin`, and `/usr/bin`.
- **OpenCode v2 Daemon & Web Dashboard Integration**:
  - `opencode.startService`: Starts the OpenCode v2 background daemon.
  - `opencode.openWebUI`: Queries `opencode service status` and opens the web dashboard in the browser.
- **OpenCode v1.x Backward Compatibility**:
  - Full compatibility with OpenCode v1 for interactive terminal sessions, file reference insertion (`@file#L...`), and text selection piping.
  - Semver-based version detection (`v?(\d+)\.`).
  - Graceful notifications guiding v1 users to the official OpenCode v2 upgrade guide when triggering v2-only service features.
- **Editor Integration**:
  - Title bar action icon to launch or focus OpenCode alongside your code.
  - Status bar item showing detected OpenCode version and status.
  - Context menu actions for file reference insertion and code selection sharing.
- **Documentation**:
  - Full technical migration and debugging guide in [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
