#!/usr/bin/env bash

# install-skill.sh - Symlink a skill from dev to production
# Usage: ./scripts/install-skill.sh <skill-name>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the skill name from argument
SKILL_NAME="$1"

if [ -z "$SKILL_NAME" ]; then
    echo -e "${RED}Error: Skill name required${NC}"
    echo "Usage: ./scripts/install-skill.sh <skill-name>"
    echo ""
    echo "Example: ./scripts/install-skill.sh cloudflare-react-full-stack"
    exit 1
fi

# Paths
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_SOURCE="$REPO_ROOT/skills/$SKILL_NAME"
SKILL_TARGET="$HOME/.claude/skills/$SKILL_NAME"

# Verify source skill exists
if [ ! -d "$SKILL_SOURCE" ]; then
    echo -e "${RED}Error: Skill not found at $SKILL_SOURCE${NC}"
    echo ""
    echo "Available skills:"
    ls -1 "$REPO_ROOT/skills/" 2>/dev/null || echo "  (none found)"
    exit 1
fi

# Verify required files exist
if [ ! -f "$SKILL_SOURCE/README.md" ]; then
    echo -e "${YELLOW}Warning: $SKILL_NAME is missing README.md${NC}"
fi

if [ ! -f "$SKILL_SOURCE/SKILL.md" ]; then
    echo -e "${YELLOW}Warning: $SKILL_NAME is missing SKILL.md${NC}"
fi

# Create ~/.claude/skills/ directory if it doesn't exist
mkdir -p "$HOME/.claude/skills"

# Remove existing symlink or directory
if [ -L "$SKILL_TARGET" ]; then
    echo -e "${YELLOW}Removing existing symlink...${NC}"
    rm "$SKILL_TARGET"
elif [ -d "$SKILL_TARGET" ]; then
    echo -e "${YELLOW}Warning: $SKILL_TARGET exists and is not a symlink${NC}"
    read -p "Replace with symlink? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$SKILL_TARGET"
    else
        echo -e "${RED}Installation cancelled${NC}"
        exit 1
    fi
fi

# Create symlink
echo -e "${GREEN}Creating symlink...${NC}"
ln -s "$SKILL_SOURCE" "$SKILL_TARGET"

# Verify symlink
if [ -L "$SKILL_TARGET" ]; then
    echo -e "${GREEN}✓ Skill installed successfully!${NC}"
    echo ""
    echo "Source:  $SKILL_SOURCE"
    echo "Target:  $SKILL_TARGET"
    echo ""
    echo -e "${GREEN}Claude Code will now auto-discover this skill.${NC}"
else
    echo -e "${RED}Error: Failed to create symlink${NC}"
    exit 1
fi
