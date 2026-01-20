# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-19

### Added

- Initial release with full feature set
- Support for 8 AI coding tools:
  - OpenCode (`~/.config/opencode/`)
  - Kiro CLI (`~/.kiro/`)
  - Gemini CLI (`~/.gemini/`)
  - Claude Code (`~/.claude/`)
  - Cursor (`~/.cursor/`)
  - Windsurf (`~/.windsurf/`)
  - Continue (`~/.continue/`)
  - Cody (`~/.sourcegraph/`)

### CLI Commands (18 total)

| Command | Description |
|---------|-------------|
| `syncai` | Main unified command |
| `aiinit` | Initialize SyncAI with GitHub |
| `aidetect` | Detect current AI tool environment |
| `aiscan` | Scan installed AI tools |
| `aipush` | Push configs to GitHub |
| `aipull` | Pull configs from GitHub |
| `aistatus` / `aist` | Show sync status |
| `aidiff` | Show file differences |
| `aiconfig` | Manage SyncAI settings |
| `aiauth` | Manage GitHub authorization |
| `aibackup` | Create/manage backups |
| `aihistory` | View commit history |
| `airollback` | Rollback to previous version |
| `aiplugin` | Manage tool plugins |
| `aiwatch` | Watch mode for auto-sync |
| `aimigrate` | Migrate configs between tools |
| `aihelp` | Show help information |

### Features

- GitHub private repository as cloud storage
- Automatic sensitive data detection (API keys, tokens, passwords)
- Tool-specific ignore patterns (like .gitignore)
- Automatic backup before pull operations
- Parent process detection for current AI tool
- Force push support for conflict resolution
- Interactive conflict resolution
- Watch mode for automatic synchronization
- Configuration migration between AI tools
- 41 unit tests with 100% pass rate
- GitHub Actions CI/CD for testing and publishing
