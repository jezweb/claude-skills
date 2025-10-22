#!/bin/bash
# Check installed AI SDK UI package versions against latest
# Usage: ./scripts/check-versions.sh

echo "==================================="
echo " AI SDK UI - Version Checker"
echo "==================================="
echo ""

packages=(
  "ai"
  "@ai-sdk/openai"
  "@ai-sdk/anthropic"
  "@ai-sdk/google"
  "react"
  "react-dom"
  "next"
  "zod"
)

echo "Checking package versions..."
echo ""

for package in "${packages[@]}"; do
  echo "📦 $package"

  # Get installed version
  installed=$(npm list "$package" --depth=0 2>/dev/null | grep "$package" | awk -F@ '{print $NF}')

  if [ -z "$installed" ]; then
    echo "   ❌ Not installed"
  else
    echo "   ✅ Installed: $installed"
  fi

  # Get latest version
  latest=$(npm view "$package" version 2>/dev/null)

  if [ -z "$latest" ]; then
    echo "   ⚠️  Could not fetch latest version"
  else
    echo "   📌 Latest:    $latest"

    # Compare versions
    if [ "$installed" = "$latest" ]; then
      echo "   ✨ Up to date!"
    elif [ -n "$installed" ]; then
      echo "   ⬆️  Update available"
    fi
  fi

  echo ""
done

echo "==================================="
echo " Recommended Versions (AI SDK v5)"
echo "==================================="
echo ""
echo "ai: ^5.0.76"
echo "@ai-sdk/openai: ^2.0.53"
echo "@ai-sdk/anthropic: ^2.0.0"
echo "@ai-sdk/google: ^2.0.0"
echo "react: ^18.2.0"
echo "react-dom: ^18.2.0"
echo "next: ^14.0.0"
echo "zod: ^3.23.8"
echo ""
echo "To update all packages:"
echo "npm install ai@latest @ai-sdk/openai@latest @ai-sdk/anthropic@latest @ai-sdk/google@latest react@latest react-dom@latest next@latest zod@latest"
echo ""
