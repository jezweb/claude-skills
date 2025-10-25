#!/bin/bash
# Check OpenAI npm package versions
# Compares installed version with latest available

echo "Checking OpenAI API package versions..."
echo ""

packages=(
  "openai"
)

for package in "${packages[@]}"; do
  echo "📦 $package"
  installed=$(npm list $package --depth=0 2>/dev/null | grep $package | awk '{print $2}' | sed 's/@//')
  latest=$(npm view $package version 2>/dev/null)

  if [ -z "$installed" ]; then
    echo "   Installed: NOT INSTALLED"
  else
    echo "   Installed: $installed"
  fi

  echo "   Latest:    $latest"

  if [ "$installed" != "$latest" ] && [ -n "$installed" ]; then
    echo "   ⚠️  Update available!"
  fi

  echo ""
done

echo "To update: npm install openai@latest"
