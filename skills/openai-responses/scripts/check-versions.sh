#!/bin/bash

# Check OpenAI SDK versions for Responses API compatibility
# Minimum version: openai@5.19.0

echo "=== OpenAI Responses API - Version Checker ==="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js and npm."
    exit 1
fi

# Check latest version
echo "Checking latest openai package version..."
LATEST_VERSION=$(npm view openai version 2>/dev/null)

if [ -z "$LATEST_VERSION" ]; then
    echo "❌ Could not fetch latest version. Check internet connection."
    exit 1
fi

echo "📦 Latest version: $LATEST_VERSION"
echo ""

# Check if package.json exists
if [ -f "package.json" ]; then
    echo "Checking installed version..."
    INSTALLED_VERSION=$(node -p "require('./package.json').dependencies?.openai || require('./package.json').devDependencies?.openai" 2>/dev/null)

    if [ ! -z "$INSTALLED_VERSION" ]; then
        # Remove ^ or ~ prefix
        INSTALLED_VERSION=$(echo $INSTALLED_VERSION | sed 's/[\^~]//g')
        echo "📦 Installed version: $INSTALLED_VERSION"

        # Compare versions (simple string comparison for major.minor.patch)
        REQUIRED_VERSION="5.19.0"

        # Extract major.minor.patch
        INSTALLED_MAJOR=$(echo $INSTALLED_VERSION | cut -d. -f1)
        INSTALLED_MINOR=$(echo $INSTALLED_VERSION | cut -d. -f2)
        INSTALLED_PATCH=$(echo $INSTALLED_VERSION | cut -d. -f3)

        REQUIRED_MAJOR=$(echo $REQUIRED_VERSION | cut -d. -f1)
        REQUIRED_MINOR=$(echo $REQUIRED_VERSION | cut -d. -f2)
        REQUIRED_PATCH=$(echo $REQUIRED_VERSION | cut -d. -f3)

        # Check compatibility
        if [ "$INSTALLED_MAJOR" -gt "$REQUIRED_MAJOR" ] || \
           ([ "$INSTALLED_MAJOR" -eq "$REQUIRED_MAJOR" ] && [ "$INSTALLED_MINOR" -gt "$REQUIRED_MINOR" ]) || \
           ([ "$INSTALLED_MAJOR" -eq "$REQUIRED_MAJOR" ] && [ "$INSTALLED_MINOR" -eq "$REQUIRED_MINOR" ] && [ "$INSTALLED_PATCH" -ge "$REQUIRED_PATCH" ]); then
            echo "✅ Version is compatible with Responses API (>= $REQUIRED_VERSION)"
        else
            echo "❌ Version is too old for Responses API"
            echo "   Required: >= $REQUIRED_VERSION"
            echo "   Installed: $INSTALLED_VERSION"
            echo ""
            echo "To upgrade: npm install openai@latest"
            exit 1
        fi
    else
        echo "⚠️  openai package not found in dependencies"
        echo ""
        echo "To install: npm install openai"
    fi
else
    echo "⚠️  No package.json found"
    echo ""
    echo "To install: npm install openai"
fi

echo ""
echo "=== Recommendations ==="
echo ""
echo "Minimum version for Responses API: openai@5.19.0"
echo "Latest stable version: openai@$LATEST_VERSION"
echo ""
echo "To install/upgrade:"
echo "  npm install openai@latest"
echo ""
echo "For Cloudflare Workers (no SDK needed):"
echo "  Use native fetch API"
echo ""
