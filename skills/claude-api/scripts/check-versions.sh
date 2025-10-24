#!/bin/bash

# Check Claude API package versions
# Usage: ./scripts/check-versions.sh

echo "=== Claude API Package Version Checker ==="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

# Check @anthropic-ai/sdk
echo "Checking @anthropic-ai/sdk..."
CURRENT_VERSION=$(npm view @anthropic-ai/sdk version 2>/dev/null)

if [ -z "$CURRENT_VERSION" ]; then
    echo -e "${RED}Error: Could not fetch version info${NC}"
else
    echo -e "${GREEN}Latest version: $CURRENT_VERSION${NC}"

    # Expected version from skill
    EXPECTED="0.67.0"

    if [ "$CURRENT_VERSION" != "$EXPECTED" ]; then
        echo -e "${YELLOW}Note: Skill was verified with version $EXPECTED${NC}"
        echo -e "${YELLOW}Latest version is $CURRENT_VERSION${NC}"
        echo ""
        echo "To update skill documentation, run:"
        echo "  npm view @anthropic-ai/sdk version"
    else
        echo -e "${GREEN}✓ Version matches skill documentation${NC}"
    fi
fi

echo ""

# Check other related packages
echo "Checking optional dependencies..."
echo ""

packages=("zod" "@types/node" "typescript")

for package in "${packages[@]}"; do
    echo "- $package:"
    VERSION=$(npm view $package version 2>/dev/null)
    if [ -z "$VERSION" ]; then
        echo -e "  ${YELLOW}Could not fetch version${NC}"
    else
        echo -e "  ${GREEN}Latest: $VERSION${NC}"
    fi
done

echo ""

# Check if package.json exists locally
if [ -f "package.json" ]; then
    echo "Checking local package.json..."
    echo ""

    if command -v jq &> /dev/null; then
        # Use jq if available
        ANTHROPIC_VERSION=$(jq -r '.dependencies."@anthropic-ai/sdk"' package.json 2>/dev/null)

        if [ "$ANTHROPIC_VERSION" != "null" ] && [ ! -z "$ANTHROPIC_VERSION" ]; then
            echo "@anthropic-ai/sdk: $ANTHROPIC_VERSION"
        fi
    else
        # Fallback to grep
        grep -E '"@anthropic-ai/sdk"' package.json
    fi

    echo ""
fi

# Check for breaking changes
echo "=== Checking for breaking changes ==="
echo ""
echo "Official changelog:"
echo "https://github.com/anthropics/anthropic-sdk-typescript/releases"
echo ""

# Check npm for recent updates
echo "Recent versions:"
npm view @anthropic-ai/sdk versions --json | tail -10

echo ""
echo "=== Version Check Complete ==="
echo ""
echo "To update your local installation:"
echo "  npm install @anthropic-ai/sdk@latest"
echo ""
echo "To check what would be installed:"
echo "  npm outdated"
