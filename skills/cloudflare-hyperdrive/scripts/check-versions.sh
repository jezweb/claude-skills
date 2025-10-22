#!/bin/bash
#
# Hyperdrive Package Version Checker
#
# Checks installed package versions against minimum requirements.
# Run this script to verify your dependencies are up to date.
#
# Usage:
#   ./scripts/check-versions.sh
#

set -e

echo "🔍 Checking Hyperdrive Package Versions"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo "❌ package.json not found in current directory"
  echo "   Run this script from your project root"
  exit 1
fi

# Function to check package version
check_package() {
  local package=$1
  local min_version=$2
  local installed_version

  if npm list "$package" &> /dev/null; then
    installed_version=$(npm list "$package" --depth=0 2>/dev/null | grep "$package@" | sed 's/.*@//' | cut -d' ' -f1)

    echo -n "  $package: "

    if [ -n "$installed_version" ]; then
      # Simple version comparison (works for most cases)
      if [[ "$installed_version" == "$min_version"* ]] || [[ "$installed_version" > "$min_version" ]]; then
        echo -e "${GREEN}✓${NC} $installed_version (>= $min_version required)"
      else
        echo -e "${RED}✗${NC} $installed_version (>= $min_version required)"
        echo -e "     ${YELLOW}Run: npm install $package@latest${NC}"
      fi
    else
      echo -e "${RED}✗${NC} Not found"
    fi
  else
    echo "  $package: ${YELLOW}Not installed${NC}"
  fi
}

# Check Wrangler
echo "Wrangler CLI:"
if command -v wrangler &> /dev/null; then
  wrangler_version=$(wrangler --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
  if [ -n "$wrangler_version" ]; then
    echo -e "  wrangler: ${GREEN}✓${NC} $wrangler_version (>= 3.11.0 required)"
  else
    echo -e "  wrangler: ${YELLOW}Unknown version${NC}"
  fi
else
  echo -e "  wrangler: ${RED}✗${NC} Not installed"
  echo -e "     ${YELLOW}Run: npm install -g wrangler${NC}"
fi

echo ""

# Check PostgreSQL drivers (if applicable)
echo "PostgreSQL Drivers (optional):"
check_package "pg" "8.13.0"
check_package "postgres" "3.4.5"

echo ""

# Check MySQL drivers (if applicable)
echo "MySQL Drivers (optional):"
check_package "mysql2" "3.13.0"

echo ""

# Check ORMs (if applicable)
echo "ORMs (optional):"
check_package "drizzle-orm" "0.0.0"  # Any version (always latest)
check_package "prisma" "0.0.0"        # Any version (always latest)
check_package "@prisma/client" "0.0.0"  # Any version (always latest)

echo ""

# Check required Workers packages
echo "Required Packages:"
check_package "@cloudflare/workers-types" "0.0.0"  # Any version

echo ""

# Check if nodejs_compat flag is set
echo "Configuration:"
if [ -f "wrangler.jsonc" ]; then
  if grep -q "nodejs_compat" wrangler.jsonc; then
    echo -e "  nodejs_compat flag: ${GREEN}✓${NC} Enabled"
  else
    echo -e "  nodejs_compat flag: ${RED}✗${NC} Not found"
    echo -e "     ${YELLOW}Add to wrangler.jsonc: \"compatibility_flags\": [\"nodejs_compat\"]${NC}"
  fi
else
  echo "  wrangler.jsonc: ${YELLOW}Not found${NC}"
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary:"
echo ""
echo "✅ = Installed and meets minimum version"
echo "❌ = Needs update or not installed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "For latest versions, run:"
echo "  npm update"
echo ""
