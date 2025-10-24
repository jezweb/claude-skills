#!/bin/bash

##
# TinaCMS Version Checker
#
# Checks if you're using current versions of TinaCMS packages
#
# Usage:
#   ./scripts/check-versions.sh
#
# Last Updated: 2025-10-24
##

set -e

echo "🔍 Checking TinaCMS package versions..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Expected versions (update these when new versions released)
EXPECTED_TINACMS="2.9.0"
EXPECTED_CLI="1.11.0"
EXPECTED_REACT="19.0.0"

# Function to get installed version
get_installed_version() {
  local package=$1
  if [ -f "package.json" ]; then
    node -e "try { const pkg = require('./package.json'); console.log(pkg.dependencies['$package'] || pkg.devDependencies['$package'] || 'not-installed'); } catch(e) { console.log('not-installed'); }" 2>/dev/null
  else
    echo "no-package-json"
  fi
}

# Function to get latest version from npm
get_latest_version() {
  local package=$1
  npm view "$package" version 2>/dev/null || echo "unknown"
}

# Function to compare versions
check_version() {
  local package=$1
  local expected=$2
  local installed=$(get_installed_version "$package")
  local latest=$(get_latest_version "$package")

  echo "📦 $package"
  echo "   Expected: $expected"
  echo "   Installed: $installed"
  echo "   Latest: $latest"

  if [ "$installed" = "not-installed" ]; then
    echo -e "   ${RED}❌ NOT INSTALLED${NC}"
  elif [ "$installed" = "no-package-json" ]; then
    echo -e "   ${YELLOW}⚠️  No package.json found${NC}"
  elif [ "$installed" = "^$expected" ] || [ "$installed" = "~$expected" ] || [ "$installed" = "$expected" ]; then
    echo -e "   ${GREEN}✅ Current version${NC}"
  else
    echo -e "   ${YELLOW}⚠️  Version mismatch - consider upgrading${NC}"
  fi
  echo ""
}

# Check if we're in a project directory
if [ ! -f "package.json" ]; then
  echo -e "${YELLOW}⚠️  No package.json found in current directory${NC}"
  echo "Run this script from your project root."
  echo ""
fi

# Check versions
check_version "tinacms" "$EXPECTED_TINACMS"
check_version "@tinacms/cli" "$EXPECTED_CLI"
check_version "react" "$EXPECTED_REACT"
check_version "react-dom" "$EXPECTED_REACT"

echo "✅ Version check complete!"
echo ""
echo "To upgrade:"
echo "  npm install tinacms@latest @tinacms/cli@latest"
echo "  npm install react@latest react-dom@latest"
echo ""
echo "To check latest versions manually:"
echo "  npm view tinacms version"
echo "  npm view @tinacms/cli version"
echo ""
