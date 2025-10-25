#!/bin/bash

# Check @google/genai package version and warn about deprecated SDK
# Usage: ./scripts/check-versions.sh

echo "🔍 Checking Gemini API SDK versions..."
echo ""

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo "❌ No package.json found in current directory"
  exit 1
fi

# Check for deprecated SDK
if grep -q "@google/generative-ai" package.json; then
  echo "⚠️  WARNING: DEPRECATED SDK DETECTED!"
  echo ""
  echo "   Package: @google/generative-ai"
  echo "   Status: DEPRECATED (sunset Nov 30, 2025)"
  echo ""
  echo "   Action required:"
  echo "   1. npm uninstall @google/generative-ai"
  echo "   2. npm install @google/genai@1.27.0"
  echo "   3. Update imports (see sdk-migration-guide.md)"
  echo ""
fi

# Check for current SDK
if grep -q "@google/genai" package.json; then
  # Get installed version
  INSTALLED_VERSION=$(npm list @google/genai --depth=0 2>/dev/null | grep @google/genai | sed 's/.*@//' | sed 's/ .*//')
  RECOMMENDED_VERSION="1.27.0"

  echo "✅ Current SDK installed: @google/genai"
  echo "   Installed version: $INSTALLED_VERSION"
  echo "   Recommended version: $RECOMMENDED_VERSION"
  echo ""

  # Check if version matches recommendation
  if [ "$INSTALLED_VERSION" != "$RECOMMENDED_VERSION" ]; then
    echo "ℹ️  Consider updating to recommended version:"
    echo "   npm install @google/genai@$RECOMMENDED_VERSION"
    echo ""
  fi
else
  echo "❌ @google/genai not found in package.json"
  echo ""
  echo "   Install with:"
  echo "   npm install @google/genai@1.27.0"
  echo ""
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_NODE="18.0.0"

echo "Node.js version: $NODE_VERSION"
echo "Required: >= $REQUIRED_NODE"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary:"
echo ""
if grep -q "@google/generative-ai" package.json; then
  echo "❌ Migration needed: Remove deprecated SDK"
elif grep -q "@google/genai" package.json; then
  echo "✅ Using current SDK (@google/genai)"
else
  echo "❌ Gemini SDK not installed"
fi
echo ""
echo "For migration help, see:"
echo "  references/sdk-migration-guide.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
