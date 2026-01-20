#!/bin/bash
# SyncAI Skills Installer
# Installs syncai skill to supported AI tools

SKILL_SOURCE="$(dirname "$0")/syncai.md"

# Target directories
OPENCODE_SKILLS="$HOME/.config/opencode/skills"
KIRO_STEERING="$HOME/.kiro/steering"
CLAUDE_DIR="$HOME/.claude"
GEMINI_DIR="$HOME/.gemini"

echo "🚀 Installing SyncAI skill..."

# OpenCode
if [ -d "$HOME/.config/opencode" ]; then
  mkdir -p "$OPENCODE_SKILLS"
  cp "$SKILL_SOURCE" "$OPENCODE_SKILLS/syncai.md"
  echo "✓ Installed to OpenCode: $OPENCODE_SKILLS/syncai.md"
fi

# Kiro CLI
if [ -d "$HOME/.kiro" ]; then
  mkdir -p "$KIRO_STEERING"
  cp "$SKILL_SOURCE" "$KIRO_STEERING/syncai.md"
  echo "✓ Installed to Kiro CLI: $KIRO_STEERING/syncai.md"
fi

# Claude Code
if [ -d "$CLAUDE_DIR" ]; then
  cp "$SKILL_SOURCE" "$CLAUDE_DIR/SYNCAI.md"
  echo "✓ Installed to Claude Code: $CLAUDE_DIR/SYNCAI.md"
fi

# Gemini CLI
if [ -d "$GEMINI_DIR" ]; then
  cp "$SKILL_SOURCE" "$GEMINI_DIR/SYNCAI.md"
  echo "✓ Installed to Gemini CLI: $GEMINI_DIR/SYNCAI.md"
fi

echo ""
echo "✅ SyncAI skill installed successfully!"
echo ""
echo "Usage: Ask your AI assistant to 'sync my configs' or 'check sync status'"
