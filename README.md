# SyncAI 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

**SyncAI** is a powerful Node.js CLI tool designed to synchronize your AI coding assistant configurations across multiple tools and devices. It uses a private GitHub repository as secure cloud storage, ensuring your personalized settings, custom prompts, and tool configurations are always in sync.

## 🌟 Features

- **Multi-Tool Support**: Synchronize configurations for OpenCode, Kiro CLI, Gemini CLI, Claude Code, Cursor, Windsurf, Continue, and Cody.
- **Secure Cloud Storage**: Uses a private GitHub repository (`syai`) for synchronization.
- **Sensitive Data Detection**: Automatically detects and warns about potential secrets (API keys, tokens, passwords) before pushing.
- **Automatic Backups**: Creates a backup of your local configurations before performing destructive pull operations.
- **Tool-Specific Ignore**: Supports custom ignore patterns for each tool, similar to `.gitignore`.
- **Environment Detection**: Automatically identifies which AI tool you are currently using via parent process detection.
- **Conflict Resolution**: Interactive prompts to help you resolve configuration conflicts.

## 🛠 Supported AI Tools

| AI Tool | Configuration Path |
|---------|--------------------| 
| **OpenCode** | `~/.config/opencode/` |
| **Kiro CLI** | `~/.kiro/` |
| **Gemini CLI** | `~/.gemini/` |
| **Claude Code** | `~/.claude/` |
| **Cursor** | `~/.cursor/` |
| **Windsurf** | `~/.windsurf/` |
| **Continue** | `~/.continue/` |
| **Cody** | `~/.sourcegraph/` |

## 📋 Prerequisites

- **Node.js**: Version 18.0.0 or higher.
- **GitHub CLI (gh)**: Installed and authenticated (`gh auth login`).

## 🚀 Installation

Install SyncAI globally on your machine:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/syncai.git

# Enter the directory
cd syncai

# Install dependencies
npm install

# Link the command globally
npm link
```

## 📖 Usage

SyncAI provides a unified `syncai` command as well as short aliases for common tasks.

### Main Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `syncai` | - | Main unified command entry point. |
| `aiinit` | - | Initialize GitHub repo and scan for installed AI tools. |
| `aidetect` | - | Detect the current AI tool environment. |
| `aiscan` | - | Manually scan for installed AI tools. |
| `aipush` | - | Push local configurations to your private GitHub repo. |
| `aipull` | - | Pull configurations from the cloud to your local machine. |
| `aistatus` | `aist` | Show differences between local and cloud configurations. |
| `aidiff` | - | Show detailed file-level differences. |
| `aiconfig` | - | Manage SyncAI internal settings. |
| `aiauth` | - | Manage GitHub authorization status. |
| `aibackup` | - | Manually create or manage configuration backups. |
| `aihistory` | - | View the synchronization history (git commit log). |
| `airollback` | - | Roll back to a previous version of your configurations. |
| `aiplugin` | - | Manage custom tool plugins. |
| `aiwatch` | - | Watch for config changes and auto-sync. |
| `aimigrate` | - | Migrate configurations between AI tools. |
| `aihelp` | - | Show detailed help information. |

### Common Workflows

#### 1. First-time Setup
Initialize SyncAI and connect it to your GitHub account.
```bash
aiinit
```

#### 2. Synchronize Current Tool
Push your current tool's configuration to the cloud.
```bash
aipush
```

#### 3. Sync All Tools on a New Machine
Pull all stored configurations to a new setup.
```bash
aipull --all
```

#### 4. Check Sync Status
Compare your local state with the cloud.
```bash
aistatus --all
```

#### 5. View File Differences
```bash
aidiff
```

#### 6. Force Pull (Skip Conflict Resolution)
```bash
aipull --force
```

#### 7. Non-Interactive Pull
```bash
aipull --no-interactive
```

#### 8. Watch Mode (Auto-Sync)
Monitor your config files and automatically sync when changes are detected.
```bash
aiwatch --all
aiwatch --interval=10  # Check every 10 seconds
```

#### 9. Migrate Configs Between Tools
Copy your configurations from one AI tool to another.
```bash
aimigrate
```

## ⚙️ Configuration

SyncAI stores its own configuration in `~/.config/syncai/`. You can manage these settings using the `aiconfig` command.

### Ignore Rules
You can define ignore patterns in your sync repository to prevent certain files from being synchronized.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by the SyncAI Team.
