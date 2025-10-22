#!/bin/bash
#
# Hyperdrive Local Development Setup Helper
#
# This script helps set up environment variables for local development
# with Hyperdrive. Use this to avoid committing credentials to wrangler.jsonc.
#
# Usage:
#   ./local-dev-setup.sh
#   source .env.local  # Load variables into current shell
#   npm run dev        # Start wrangler dev
#

set -e

echo "🚀 Hyperdrive Local Development Setup"
echo ""

# Get binding name from wrangler.jsonc
BINDING_NAME=$(grep -A 2 '"hyperdrive"' wrangler.jsonc | grep '"binding"' | cut -d'"' -f4 | head -1)

if [ -z "$BINDING_NAME" ]; then
  echo "❌ Could not find Hyperdrive binding in wrangler.jsonc"
  echo "   Please ensure you have a hyperdrive configuration with a binding."
  exit 1
fi

echo "Found Hyperdrive binding: $BINDING_NAME"
echo ""

# Ask for database details
echo "Enter your local database connection details:"
echo ""

read -p "Database type (postgres/mysql): " DB_TYPE
read -p "Host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

if [ "$DB_TYPE" = "postgres" ]; then
  read -p "Port (default: 5432): " DB_PORT
  DB_PORT=${DB_PORT:-5432}
else
  read -p "Port (default: 3306): " DB_PORT
  DB_PORT=${DB_PORT:-3306}
fi

read -p "Database name: " DB_NAME
read -p "Username: " DB_USER
read -sp "Password: " DB_PASSWORD
echo ""

# Build connection string
if [ "$DB_TYPE" = "postgres" ]; then
  CONNECTION_STRING="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
else
  CONNECTION_STRING="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

# Create .env.local file
ENV_VAR_NAME="CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_${BINDING_NAME}"

cat > .env.local <<EOF
# Hyperdrive Local Development Environment Variables
# Generated on: $(date)
#
# Load these variables before running wrangler dev:
#   source .env.local
#   npm run dev
#
# DO NOT commit this file to version control!

export ${ENV_VAR_NAME}="${CONNECTION_STRING}"
EOF

# Add to .gitignore
if ! grep -q ".env.local" .gitignore 2>/dev/null; then
  echo ".env.local" >> .gitignore
  echo "✅ Added .env.local to .gitignore"
fi

echo ""
echo "✅ Created .env.local with environment variable:"
echo "   ${ENV_VAR_NAME}"
echo ""
echo "Next steps:"
echo "1. Load the environment variable:"
echo "   source .env.local"
echo ""
echo "2. Start local development server:"
echo "   npx wrangler dev"
echo ""
echo "3. Your Worker will connect to:"
echo "   ${DB_TYPE}://${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo ""
