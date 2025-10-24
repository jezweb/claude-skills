#!/bin/bash

# Zustand Version Checker
# Verifies installed versions and compatibility
# Usage: ./scripts/check-versions.sh

set -e

echo "🐻 Zustand Version Checker"
echo "=========================="
echo ""

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo "❌ No package.json found in current directory"
  echo "   Run this script from your project root"
  exit 1
fi

# Function to get installed version
get_version() {
  local package=$1
  if [ -f "node_modules/$package/package.json" ]; then
    node -p "require('./node_modules/$package/package.json').version" 2>/dev/null || echo "not installed"
  else
    echo "not installed"
  fi
}

# Function to get latest version from npm
get_latest() {
  local package=$1
  npm view "$package" version 2>/dev/null || echo "unknown"
}

# Check Zustand
echo "📦 Zustand"
zustand_installed=$(get_version "zustand")
zustand_latest=$(get_latest "zustand")

if [ "$zustand_installed" = "not installed" ]; then
  echo "   Status: ❌ Not installed"
  echo "   Install: npm install zustand"
else
  echo "   Installed: $zustand_installed"
  echo "   Latest:    $zustand_latest"

  # Check if major version is 5
  major=$(echo "$zustand_installed" | cut -d'.' -f1)
  if [ "$major" -ge 5 ]; then
    echo "   Status: ✅ v5+ (recommended)"
  elif [ "$major" -eq 4 ]; then
    echo "   Status: ⚠️  v4 (upgrade recommended)"
    echo "   Migration: See references/migration-guide.md"
  else
    echo "   Status: ❌ v$major (unsupported)"
    echo "   Action: Upgrade to v5+"
  fi
fi

echo ""

# Check React
echo "📦 React"
react_installed=$(get_version "react")
react_latest=$(get_latest "react")

if [ "$react_installed" = "not installed" ]; then
  echo "   Status: ❌ Not installed"
else
  echo "   Installed: $react_installed"
  echo "   Latest:    $react_latest"

  # Check if version is 18+
  major=$(echo "$react_installed" | cut -d'.' -f1)
  if [ "$major" -ge 18 ]; then
    echo "   Status: ✅ v18+ (compatible)"
  else
    echo "   Status: ⚠️  v$major (Zustand works, but upgrade recommended)"
  fi
fi

echo ""

# Check TypeScript (optional)
echo "📦 TypeScript (optional)"
ts_installed=$(get_version "typescript")

if [ "$ts_installed" = "not installed" ]; then
  echo "   Status: ℹ️  Not installed (optional)"
else
  echo "   Installed: $ts_installed"

  # Check if version is 5+
  major=$(echo "$ts_installed" | cut -d'.' -f1)
  if [ "$major" -ge 5 ]; then
    echo "   Status: ✅ v5+ (recommended)"
  else
    echo "   Status: ⚠️  v$major (upgrade recommended for better types)"
  fi
fi

echo ""

# Check Next.js (if using persist)
if grep -q '"next"' package.json 2>/dev/null; then
  echo "📦 Next.js (detected)"
  next_installed=$(get_version "next")
  echo "   Installed: $next_installed"

  # Check if major version is 14+
  major=$(echo "$next_installed" | cut -d'.' -f1)
  if [ "$major" -ge 14 ]; then
    echo "   Status: ✅ v14+ (App Router supported)"
  elif [ "$major" -eq 13 ]; then
    echo "   Status: ✅ v13 (supported)"
  else
    echo "   Status: ⚠️  v$major (upgrade recommended)"
  fi

  echo "   Note: See references/nextjs-hydration.md for SSR setup"
  echo ""
fi

# Summary
echo "=========================="
echo "✅ Version check complete"
echo ""

if [ "$zustand_installed" = "not installed" ]; then
  echo "Next steps:"
  echo "  npm install zustand"
  echo "  See SKILL.md for setup instructions"
elif [ "$major" -lt 5 ]; then
  echo "Recommended upgrade:"
  echo "  npm install zustand@latest"
  echo "  See references/migration-guide.md for v4→v5 changes"
else
  echo "All versions compatible! 🎉"
  echo "See SKILL.md for usage patterns"
fi
