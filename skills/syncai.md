# SyncAI - AI Configuration Sync Skill

Sync AI coding tool configurations across devices using GitHub as cloud storage.

## When to Use This Skill

- User wants to sync their AI tool configurations
- User mentions "sync", "backup", "restore" configs across devices
- User wants to migrate configs between AI tools (OpenCode, Kiro, Claude, etc.)
- User asks about config differences between local and cloud

## Available Commands

All commands are installed globally via `npm install -g syncai-cli`.

### Core Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `aiscan` | Scan installed AI tools | `aiscan` |
| `aidetect` | Detect current AI tool environment | `aidetect` |
| `aipush` | Push configs to GitHub | `aipush` or `aipush --all` |
| `aipull` | Pull configs from GitHub | `aipull` or `aipull --force` |
| `aistatus` | Show sync status | `aistatus` or `aist` |
| `aidiff` | Show file differences | `aidiff` |

### Setup Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `aiinit` | Initialize SyncAI with GitHub | `aiinit` or `aiinit --yes` |
| `aiauth` | Manage GitHub authorization | `aiauth status` / `aiauth login` |
| `aiconfig` | Manage SyncAI settings | `aiconfig get` / `aiconfig set <key> <value>` |

### Advanced Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `aiwatch` | Watch mode for auto-sync | `aiwatch` |
| `aimigrate` | Migrate configs between tools | `aimigrate opencode kiro` |
| `aibackup` | Create/manage backups | `aibackup create` / `aibackup list` |
| `aihistory` | View commit history | `aihistory` |
| `airollback` | Rollback to previous version | `airollback <commit>` |
| `aiplugin` | Manage tool plugins | `aiplugin list` / `aiplugin add <name>` |
| `aihelp` | Show help information | `aihelp` or `aihelp <command>` |

## Supported AI Tools

| Tool | Config Path | Status |
|------|-------------|--------|
| OpenCode | `~/.config/opencode/` | Auto-detected |
| Kiro CLI | `~/.kiro/` | Auto-detected |
| Gemini CLI | `~/.gemini/` | Auto-detected |
| Claude Code | `~/.claude/` | Auto-detected |
| Cursor | `~/.cursor/` | Auto-detected |
| Windsurf | `~/.windsurf/` | Auto-detected |
| Continue | `~/.continue/` | Auto-detected |
| Cody | `~/.sourcegraph/` | Auto-detected |

## Common Workflows

### First-time Setup
```bash
# 1. Initialize SyncAI (creates private GitHub repo)
aiinit --yes

# 2. Push current configs to cloud
aipush --all
```

### Daily Sync
```bash
# Check status
aistatus

# Pull latest from cloud
aipull

# Or push local changes
aipush
```

### Migrate Configs Between Tools
```bash
# Copy OpenCode skills to Kiro
aimigrate opencode kiro --only skills/

# Copy all configs
aimigrate opencode kiro
```

### Resolve Conflicts
```bash
# Force push (overwrite cloud)
aipush --force

# Force pull (overwrite local)
aipull --force
```

## Non-Interactive Mode

For automation, use `--yes` flag to skip prompts:
```bash
aiinit --yes
aipush --yes
aipull --yes --force
```

## Prerequisites

- Node.js >= 18.0.0
- GitHub CLI (`gh`) installed and authenticated

## Installation

```bash
npm install -g syncai-cli
```

## GitHub Repository

https://github.com/moonjoke001/syncai-cli
