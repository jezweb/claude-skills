#!/bin/bash
# Analyze Next.js Worker bundle size to debug worker size limit errors

set -e

echo "📊 Analyzing Worker bundle size..."
echo ""

# Check if we're in a Next.js project
if [ ! -f "package.json" ]; then
    echo "❌ Error: No package.json found. Run this script from your Next.js project root."
    exit 1
fi

# Check if @opennextjs/cloudflare is installed
if ! grep -q "@opennextjs/cloudflare" package.json; then
    echo "❌ Error: @opennextjs/cloudflare is not installed."
    echo "Run: npm install --save-dev @opennextjs/cloudflare"
    exit 1
fi

# Build the project
echo "🔨 Building Next.js project with OpenNext adapter..."
npx opennextjs-cloudflare build

# Check if build succeeded
if [ ! -d ".open-next" ]; then
    echo "❌ Error: Build failed - .open-next directory not found"
    exit 1
fi

# Navigate to build output
cd .open-next/server-functions/default

echo ""
echo "✅ Build complete!"
echo ""
echo "📁 Build output location:"
echo "   .open-next/server-functions/default/"
echo ""

# Check if handler exists
if [ ! -f "handler.mjs" ]; then
    echo "❌ Error: handler.mjs not found in build output"
    exit 1
fi

# Get file sizes
HANDLER_SIZE=$(stat -f%z "handler.mjs" 2>/dev/null || stat -c%s "handler.mjs" 2>/dev/null || echo "unknown")
HANDLER_SIZE_MB=$(echo "scale=2; $HANDLER_SIZE / 1048576" | bc 2>/dev/null || echo "unknown")

echo "📦 Worker Bundle Size:"
echo "   handler.mjs: $HANDLER_SIZE bytes (~${HANDLER_SIZE_MB} MiB uncompressed)"
echo ""
echo "📏 Cloudflare Worker Size Limits:"
echo "   Free plan:  3 MiB (gzip-compressed)"
echo "   Paid plan: 10 MiB (gzip-compressed)"
echo ""

# Check for bundle metadata
if [ -f "handler.mjs.meta.json" ]; then
    echo "📊 Bundle Metadata:"
    echo "   File: handler.mjs.meta.json"
    echo ""
    echo "To analyze bundle composition:"
    echo "  1. Open handler.mjs.meta.json in ESBuild Bundle Analyzer"
    echo "  2. Identify large dependencies"
    echo "  3. Consider:"
    echo "     - Removing unused dependencies"
    echo "     - Using dynamic imports for code splitting"
    echo "     - Externalizing large packages if possible"
    echo ""
else
    echo "⚠️  Bundle metadata (handler.mjs.meta.json) not found"
    echo ""
fi

# List all files in build output
echo "📂 Build Output Contents:"
ls -lh
echo ""

# Check for common large dependencies
echo "🔍 Checking for common large dependencies..."
if [ -f "handler.mjs" ]; then
    # Check for common problematic imports (this is a simple check)
    LARGE_DEPS=()

    if grep -q "prisma" handler.mjs 2>/dev/null; then
        LARGE_DEPS+=("@prisma/client")
    fi

    if grep -q "aws-sdk" handler.mjs 2>/dev/null; then
        LARGE_DEPS+=("aws-sdk")
    fi

    if grep -q "firebase" handler.mjs 2>/dev/null; then
        LARGE_DEPS+=("firebase")
    fi

    if grep -q "graphql" handler.mjs 2>/dev/null; then
        LARGE_DEPS+=("graphql")
    fi

    if [ ${#LARGE_DEPS[@]} -gt 0 ]; then
        echo "⚠️  Found potentially large dependencies:"
        for dep in "${LARGE_DEPS[@]}"; do
            echo "   - $dep"
        done
        echo ""
        echo "Consider:"
        echo "  - Using lighter alternatives"
        echo "  - Dynamic imports to reduce initial bundle"
        echo "  - Moving heavy operations to separate Workers"
        echo ""
    else
        echo "✅ No obviously large dependencies detected"
        echo ""
    fi
fi

echo "💡 Tips to Reduce Bundle Size:"
echo "  1. Remove unused dependencies from package.json"
echo "  2. Use dynamic imports: const module = await import('heavy-module')"
echo "  3. Split large features into separate routes/pages"
echo "  4. Check for duplicate dependencies (npm dedupe)"
echo "  5. Consider using lighter alternatives for heavy packages"
echo "  6. Review handler.mjs.meta.json for detailed breakdown"
echo ""
echo "📖 More info:"
echo "   https://opennext.js.org/cloudflare/troubleshooting#worker-size-limits"
echo ""
