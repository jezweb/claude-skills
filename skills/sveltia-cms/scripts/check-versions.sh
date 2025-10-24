#!/usr/bin/env bash

# Check Sveltia CMS version and compatibility

set -e

echo "🔍 Checking Sveltia CMS versions..."
echo ""

# Check npm package version
echo "📦 Latest npm package:"
npm view @sveltia/cms version

echo ""
echo "📅 Last published:"
npm view @sveltia/cms time.modified

echo ""
echo "🏷️  Current skill version: 0.113.3"
echo ""

# Check if newer version available
CURRENT="0.113.3"
LATEST=$(npm view @sveltia/cms version)

if [ "$CURRENT" != "$LATEST" ]; then
  echo "⚠️  WARNING: Newer version available ($LATEST)"
  echo "   Consider updating skill metadata"
else
  echo "✅ Skill is up to date"
fi

echo ""
