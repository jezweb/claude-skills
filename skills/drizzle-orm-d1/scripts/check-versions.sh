#!/bin/bash

# Check Drizzle ORM package versions
# Compares installed versions with latest from npm

echo "Checking Drizzle ORM package versions..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

check_package() {
    local package=$1
    local installed=$(npm list $package --depth=0 2>/dev/null | grep $package | sed 's/.*@//' | sed 's/ .*//')
    local latest=$(npm view $package version 2>/dev/null)

    if [ -z "$installed" ]; then
        echo -e "${RED}✗${NC} $package: Not installed"
        return
    fi

    if [ "$installed" = "$latest" ]; then
        echo -e "${GREEN}✓${NC} $package: $installed (latest)"
    else
        echo -e "${YELLOW}!${NC} $package: $installed (latest: $latest)"
    fi
}

# Core packages
check_package "drizzle-orm"
check_package "drizzle-kit"

# Optional packages
echo ""
echo "Optional packages:"
check_package "@cloudflare/workers-types"
check_package "wrangler"
check_package "better-sqlite3"

echo ""
echo "Done!"
