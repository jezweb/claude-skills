#!/usr/bin/env bash

# install-all.sh - Install all skills from dev to production
# Usage: ./scripts/install-all.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_DIR="$REPO_ROOT/skills"
INSTALL_SCRIPT="$REPO_ROOT/scripts/install-skill.sh"

# Make install script executable
chmod +x "$INSTALL_SCRIPT"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Claude Skills - Install All${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Count skills
SKILL_COUNT=$(find "$SKILLS_DIR" -maxdepth 1 -type d ! -path "$SKILLS_DIR" | wc -l)

if [ "$SKILL_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}No skills found in $SKILLS_DIR${NC}"
    exit 0
fi

echo -e "${GREEN}Found $SKILL_COUNT skill(s) to install${NC}"
echo ""

# Install each skill
SUCCESS_COUNT=0
FAIL_COUNT=0

for skill_dir in "$SKILLS_DIR"/*/ ; do
    if [ -d "$skill_dir" ]; then
        skill_name=$(basename "$skill_dir")

        echo -e "${BLUE}Installing: $skill_name${NC}"

        if "$INSTALL_SCRIPT" "$skill_name"; then
            ((SUCCESS_COUNT++))
            echo ""
        else
            ((FAIL_COUNT++))
            echo -e "${RED}Failed to install: $skill_name${NC}"
            echo ""
        fi
    fi
done

# Summary
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Installation Summary${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "${GREEN}✓ Installed: $SUCCESS_COUNT${NC}"

if [ "$FAIL_COUNT" -gt 0 ]; then
    echo -e "${RED}✗ Failed: $FAIL_COUNT${NC}"
fi

echo ""

if [ "$SUCCESS_COUNT" -gt 0 ]; then
    echo -e "${GREEN}All skills are now symlinked to ~/.claude/skills/${NC}"
    echo -e "${GREEN}Claude Code will auto-discover them!${NC}"
fi

# Exit with error if any failed
if [ "$FAIL_COUNT" -gt 0 ]; then
    exit 1
fi
