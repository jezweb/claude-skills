#!/bin/bash
# check-versions.sh
# Verify package versions for Cloudflare Browser Rendering skill

set -e

echo "Checking Cloudflare Browser Rendering package versions..."
echo ""

# Function to check package version
check_package() {
  local package=$1
  local current=$2

  echo "📦 $package"
  echo "   Current in skill: $current"

  if command -v npm &> /dev/null; then
    latest=$(npm view $package version 2>/dev/null || echo "N/A")
    echo "   Latest on npm: $latest"

    if [ "$current" != "$latest" ] && [ "$latest" != "N/A" ]; then
      echo "   ⚠️  Update available!"
    else
      echo "   ✅ Up to date"
    fi
  else
    echo "   ⚠️  npm not found, skipping latest version check"
  fi

  echo ""
}

echo "=== Core Packages ==="
echo ""

check_package "@cloudflare/puppeteer" "1.0.4"
check_package "@cloudflare/playwright" "1.0.0"

echo "=== Related Packages ==="
echo ""

check_package "wrangler" "4.43.0"
check_package "@cloudflare/workers-types" "4.20251014.0"

echo "=== Verification Complete ==="
echo ""
echo "To update a package version in this skill:"
echo "1. Update the version in SKILL.md"
echo "2. Update templates if API changes"
echo "3. Test all template files"
echo "4. Update 'Last Updated' date"
echo "5. Commit changes"
