#!/bin/bash
# Setup a new project from the scaffold

set -e

if [ -z "$1" ]; then
  echo "Usage: ./setup-project.sh <project-name>"
  exit 1
fi

PROJECT_NAME=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCAFFOLD_DIR="$(dirname "$SCRIPT_DIR")/scaffold"

echo "Creating new project: $PROJECT_NAME"

# Copy scaffold
cp -r "$SCAFFOLD_DIR" "../$PROJECT_NAME"
cd "../$PROJECT_NAME"

# Update project name in package.json
sed -i "s/cloudflare-full-stack-app/$PROJECT_NAME/g" package.json
sed -i "s/cloudflare-full-stack-app/$PROJECT_NAME/g" wrangler.jsonc

# Update dates in planning docs
TODAY=$(date +%Y-%m-%d)
sed -i "s/\[YYYY-MM-DD\]/$TODAY/g" SCRATCHPAD.md
sed -i "s/\[Your Project Name\]/$PROJECT_NAME/g" SCRATCHPAD.md
sed -i "s/\[Your Project Name\]/$PROJECT_NAME/g" CLAUDE.md

# Initialize git
git init
git add .
git commit -m "Initial commit from cloudflare-full-stack-scaffold"

echo "✓ Project created: $PROJECT_NAME"
echo ""
echo "Next steps:"
echo "  cd $PROJECT_NAME"
echo "  npm install"
echo "  ./scripts/init-services.sh"
echo "  npm run dev"
