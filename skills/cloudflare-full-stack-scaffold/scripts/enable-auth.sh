#!/bin/bash
# Enable Clerk Authentication
# This script uncomments all Clerk auth patterns in the scaffold

set -e

echo "🔐 Enabling Clerk Authentication..."
echo ""

# Check if we're in a project directory (has package.json)
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found"
  echo "Run this script from your project root directory"
  exit 1
fi

# 1. Uncomment api-client auth patterns
echo "1. Enabling auth in api-client.ts..."
if [ -f "src/lib/api-client.ts" ]; then
  # This will be implemented by removing /* */ comment blocks
  sed -i 's/\/\* CLERK AUTH START//' src/lib/api-client.ts
  sed -i 's/CLERK AUTH END \*\///' src/lib/api-client.ts
  echo "   ✓ api-client.ts auth enabled"
else
  echo "   ⚠️  src/lib/api-client.ts not found (will be created)"
fi

# 2. Uncomment ProtectedRoute component
echo "2. Enabling ProtectedRoute component..."
if [ -f "src/components/ProtectedRoute.tsx" ]; then
  sed -i 's/\/\* CLERK AUTH START//' src/components/ProtectedRoute.tsx
  sed -i 's/CLERK AUTH END \*\///' src/components/ProtectedRoute.tsx
  echo "   ✓ ProtectedRoute.tsx enabled"
else
  echo "   ⚠️  src/components/ProtectedRoute.tsx not found (will be created)"
fi

# 3. Uncomment backend auth middleware
echo "3. Enabling backend auth middleware..."
if [ -f "backend/middleware/auth.ts" ]; then
  sed -i 's/\/\* CLERK AUTH START//' backend/middleware/auth.ts
  sed -i 's/CLERK AUTH END \*\///' backend/middleware/auth.ts
  echo "   ✓ auth.ts middleware enabled"
else
  echo "   ⚠️  backend/middleware/auth.ts not found (will be created)"
fi

# 4. Uncomment ClerkProvider in App.tsx
echo "4. Enabling ClerkProvider in App.tsx..."
if [ -f "src/App.tsx" ]; then
  sed -i 's/\/\* CLERK AUTH START//' src/App.tsx
  sed -i 's/CLERK AUTH END \*\///' src/App.tsx
  echo "   ✓ ClerkProvider enabled in App.tsx"
else
  echo "   ⚠️  src/App.tsx not found"
fi

echo ""
echo "📝 Setting up environment variables..."

# 5. Create .env if it doesn't exist
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "   ✓ Created .env from .env.example"
  else
    touch .env
    echo "   ✓ Created .env"
  fi
fi

# 6. Create .dev.vars if it doesn't exist
if [ ! -f ".dev.vars" ]; then
  if [ -f ".dev.vars.example" ]; then
    cp .dev.vars.example .dev.vars
    echo "   ✓ Created .dev.vars from .dev.vars.example"
  else
    touch .dev.vars
    echo "   ✓ Created .dev.vars"
  fi
fi

echo ""
echo "🔑 Clerk API Keys Setup"
echo ""
echo "Get your keys from: https://dashboard.clerk.com"
echo ""

# Prompt for Clerk publishable key
read -p "Enter your Clerk Publishable Key (pk_test_xxx): " CLERK_PUB_KEY
if [ ! -z "$CLERK_PUB_KEY" ]; then
  # Add to .env (frontend)
  if grep -q "VITE_CLERK_PUBLISHABLE_KEY" .env; then
    sed -i "s|^.*VITE_CLERK_PUBLISHABLE_KEY=.*|VITE_CLERK_PUBLISHABLE_KEY=$CLERK_PUB_KEY|" .env
  else
    echo "VITE_CLERK_PUBLISHABLE_KEY=$CLERK_PUB_KEY" >> .env
  fi
  echo "   ✓ Added VITE_CLERK_PUBLISHABLE_KEY to .env"
fi

# Prompt for Clerk secret key
read -p "Enter your Clerk Secret Key (sk_test_xxx): " CLERK_SECRET_KEY
if [ ! -z "$CLERK_SECRET_KEY" ]; then
  # Add to .dev.vars (backend)
  if grep -q "CLERK_SECRET_KEY" .dev.vars; then
    sed -i "s|^.*CLERK_SECRET_KEY=.*|CLERK_SECRET_KEY=$CLERK_SECRET_KEY|" .dev.vars
  else
    echo "CLERK_SECRET_KEY=$CLERK_SECRET_KEY" >> .dev.vars
  fi
  echo "   ✓ Added CLERK_SECRET_KEY to .dev.vars"
fi

echo ""
echo "✅ Clerk authentication enabled!"
echo ""
echo "Next steps:"
echo "  1. Create a JWT template in Clerk Dashboard"
echo "     Name: cloudflare-worker"
echo "     Claims: email, firstName, lastName, userId"
echo ""
echo "  2. Restart your dev server:"
echo "     npm run dev"
echo ""
echo "  3. Test authentication by visiting your app"
echo ""
echo "See references/enabling-auth.md for detailed setup instructions"
