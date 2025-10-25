#!/bin/bash

# OpenAI Assistants API - Package Version Checker
# Verifies that the correct package versions are installed

set -e

echo "🔍 Checking OpenAI Assistants API package versions..."
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js and npm."
    exit 1
fi

# Check openai package
echo "📦 Checking openai package..."
INSTALLED_VERSION=$(npm list openai --depth=0 2>/dev/null | grep openai@ | sed 's/.*openai@//' | sed 's/ .*//' || echo "not installed")
REQUIRED_VERSION="6.7.0"

if [ "$INSTALLED_VERSION" = "not installed" ]; then
    echo "   ❌ openai package not installed"
    echo "   Run: npm install openai@${REQUIRED_VERSION}"
    exit 1
fi

# Compare versions
INSTALLED_MAJOR=$(echo $INSTALLED_VERSION | cut -d. -f1)
REQUIRED_MAJOR=$(echo $REQUIRED_VERSION | cut -d. -f1)

if [ "$INSTALLED_MAJOR" -lt "$REQUIRED_MAJOR" ]; then
    echo "   ⚠️  Installed: $INSTALLED_VERSION (outdated)"
    echo "   ✅ Required: ${REQUIRED_VERSION}+"
    echo "   Run: npm install openai@latest"
    exit 1
else
    echo "   ✅ Installed: $INSTALLED_VERSION"
fi

echo ""
echo "📋 Current package versions:"
npm list openai tsx typescript @types/node --depth=0 2>/dev/null || true

echo ""
echo "✅ All package versions are compatible!"
echo ""
echo "💡 To update to latest versions:"
echo "   npm install openai@latest tsx@latest typescript@latest @types/node@latest"
