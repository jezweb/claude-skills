#!/usr/bin/env bash

# check-versions.sh - Check if skill dependencies are up-to-date
# Usage: ./scripts/check-versions.sh [skill-name]
#
# If skill-name is provided, checks that skill only
# Otherwise, checks all skills
#
# Exit code: Always 0 (info only, no failures)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_DIR="$REPO_ROOT/skills"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Dependency Version Checker${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Function to check a single package.json file
check_package_json() {
    local file="$1"
    local skill_name="$2"
    local warnings=0

    echo -e "${BLUE}Checking: $skill_name${NC}"

    # Extract dependencies
    local deps=$(cat "$file" | grep -A 999 '"dependencies"' | grep -B 999 '}' | head -n -1 | tail -n +2 || true)
    local devDeps=$(cat "$file" | grep -A 999 '"devDependencies"' | grep -B 999 '}' | head -n -1 | tail -n +2 || true)

    # Combine all deps
    local all_deps="$deps"$'\n'"$devDeps"

    # Check each dependency
    while IFS= read -r line; do
        if [[ $line =~ \"([^\"]+)\":[[:space:]]*\"([^^~]*)([0-9]+\.[0-9]+\.[0-9]+) ]]; then
            local pkg="${BASH_MATCHES[1]}"
            local current="${BASH_MATCHES[3]}"

            # Skip @types and internal packages
            if [[ $pkg == @types/* ]] || [[ $pkg == file:* ]]; then
                continue
            fi

            # Get latest version from npm (with timeout)
            local latest=$(timeout 5 npm view "$pkg" version 2>/dev/null || echo "error")

            if [ "$latest" == "error" ]; then
                echo -e "  ${YELLOW}⚠${NC}  $pkg@$current (couldn't fetch latest)"
                continue
            fi

            # Compare versions (simple string comparison)
            if [ "$current" != "$latest" ]; then
                echo -e "  ${YELLOW}⚠${NC}  $pkg@$current → $latest available"
                ((warnings++))
            else
                echo -e "  ${GREEN}✓${NC}  $pkg@$current (up-to-date)"
            fi
        fi
    done <<< "$all_deps"

    if [ $warnings -eq 0 ]; then
        echo -e "${GREEN}  All dependencies up-to-date!${NC}"
    else
        echo -e "${YELLOW}  $warnings update(s) available${NC}"
    fi

    echo ""
    return 0
}

# Check if specific skill provided
if [ -n "$1" ]; then
    SKILL_NAME="$1"
    SKILL_DIR="$SKILLS_DIR/$SKILL_NAME"

    if [ ! -d "$SKILL_DIR" ]; then
        echo -e "${RED}Error: Skill '$SKILL_NAME' not found${NC}"
        echo ""
        echo "Available skills:"
        ls -1 "$SKILLS_DIR" 2>/dev/null || echo "  (none found)"
        exit 0  # Still exit 0 (info only)
    fi

    # Check for package.json in templates
    if [ -f "$SKILL_DIR/templates/package.json" ]; then
        check_package_json "$SKILL_DIR/templates/package.json" "$SKILL_NAME"
    elif [ -f "$SKILL_DIR/package.json" ]; then
        check_package_json "$SKILL_DIR/package.json" "$SKILL_NAME"
    else
        echo -e "${YELLOW}No package.json found for $SKILL_NAME${NC}"
        echo ""
    fi

    exit 0
fi

# Check all skills
TOTAL_SKILLS=0
SKILLS_WITH_DEPS=0

for skill_dir in "$SKILLS_DIR"/*/ ; do
    if [ ! -d "$skill_dir" ]; then
        continue
    fi

    skill_name=$(basename "$skill_dir")
    ((TOTAL_SKILLS++))

    # Look for package.json in templates/ or root
    if [ -f "$skill_dir/templates/package.json" ]; then
        check_package_json "$skill_dir/templates/package.json" "$skill_name"
        ((SKILLS_WITH_DEPS++))
    elif [ -f "$skill_dir/package.json" ]; then
        check_package_json "$skill_dir/package.json" "$skill_name"
        ((SKILLS_WITH_DEPS++))
    fi
done

# Summary
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo "Total skills: $TOTAL_SKILLS"
echo "Skills with dependencies: $SKILLS_WITH_DEPS"
echo ""
echo -e "${GREEN}ℹ${NC}  This is informational only - no automatic updates performed"
echo -e "${GREEN}ℹ${NC}  Review warnings and update skills manually as needed"
echo ""

# Always exit 0 (informational only, never fail builds)
exit 0
