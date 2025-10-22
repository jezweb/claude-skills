#!/bin/bash

# Check Versions Script for Cloudflare Durable Objects Skill
# Verifies that package versions are current

echo "Checking package versions for cloudflare-durable-objects skill..."
echo ""

# Check wrangler
echo "📦 wrangler:"
npm view wrangler version
echo ""

# Check @cloudflare/workers-types
echo "📦 @cloudflare/workers-types:"
npm view @cloudflare/workers-types version
echo ""

# Check TypeScript
echo "📦 typescript:"
npm view typescript version
echo ""

echo "✅ Version check complete"
echo ""
echo "Update templates/package.json if newer versions are available."
