# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-19

### Added

- Initial release
- Support for 8 AI coding tools:
  - OpenCode
  - Kiro CLI
  - Gemini CLI
  - Claude Code
  - Cursor
  - Windsurf
  - Continue
  - Cody
- 15 CLI commands for configuration synchronization
- GitHub private repository as cloud storage
- Automatic sensitive data detection
- Tool-specific ignore patterns
- Automatic backup before pull operations
- Parent process detection for current AI tool
- Force push support for conflict resolution

### Commands

- `syncai` - Main unified command
- `aiinit` - Initialize SyncAI with GitHub
- `aidetect` - Detect current AI tool environment
- `aiscan` - Scan installed AI tools
- `aipush` - Push configs to GitHub
- `aipull` - Pull configs from GitHub
- `aistatus` / `aist` - Show sync status
- `aidiff` - Show file differences
- `aiconfig` - Manage SyncAI settings
- `aiauth` - Manage GitHub authorization
- `aibackup` - Create/manage backups
- `aihistory` - View commit history
- `airollback` - Rollback to previous version
- `aiplugin` - Manage tool plugins
- `aihelp` - Show help information
