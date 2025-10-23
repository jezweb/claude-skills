#!/bin/bash
# Enable AI Chat Interface
# This script uncomments all AI SDK UI patterns for chat

set -e

echo "💬 Enabling AI Chat Interface..."
echo ""

# Check if we're in a project directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found"
  echo "Run this script from your project root directory"
  exit 1
fi

# 1. Uncomment ChatInterface component
echo "1. Enabling ChatInterface component..."
if [ -f "src/components/ChatInterface.tsx" ]; then
  sed -i 's/\/\* AI CHAT START//' src/components/ChatInterface.tsx
  sed -i 's/AI CHAT END \*\///' src/components/ChatInterface.tsx
  echo "   ✓ ChatInterface.tsx enabled"
else
  echo "   ⚠️  src/components/ChatInterface.tsx not found (will be created)"
fi

# 2. Uncomment Chat page
echo "2. Enabling Chat page..."
if [ -f "src/pages/Chat.tsx" ]; then
  sed -i 's/\/\* AI CHAT START//' src/pages/Chat.tsx
  sed -i 's/AI CHAT END \*\///' src/pages/Chat.tsx
  echo "   ✓ Chat.tsx page enabled"
else
  echo "   ⚠️  src/pages/Chat.tsx not found (will be created)"
fi

# 3. Uncomment Chat route in App.tsx
echo "3. Enabling Chat route in App.tsx..."
if [ -f "src/App.tsx" ]; then
  sed -i 's/\/\* AI CHAT START//' src/App.tsx
  sed -i 's/AI CHAT END \*\///' src/App.tsx
  echo "   ✓ Chat route enabled in App.tsx"
else
  echo "   ⚠️  src/App.tsx not found"
fi

# 4. Uncomment AI SDK routes in backend
echo "4. Enabling AI SDK routes..."
if [ -f "backend/routes/ai-sdk.ts" ]; then
  # Uncomment OpenAI examples
  sed -i 's/\/\* OPENAI START//' backend/routes/ai-sdk.ts
  sed -i 's/OPENAI END \*\///' backend/routes/ai-sdk.ts
  # Uncomment Anthropic examples
  sed -i 's/\/\* ANTHROPIC START//' backend/routes/ai-sdk.ts
  sed -i 's/ANTHROPIC END \*\///' backend/routes/ai-sdk.ts
  echo "   ✓ AI SDK routes enabled"
else
  echo "   ⚠️  backend/routes/ai-sdk.ts not found (will be created)"
fi

echo ""
echo "📝 Setting up environment variables..."

# 5. Create .dev.vars if it doesn't exist
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
echo "🤖 AI Provider API Keys Setup (Optional)"
echo ""
echo "You can use Workers AI (free, no key needed) or add external providers:"
echo ""

# Prompt for OpenAI API key (optional)
read -p "Enter OpenAI API Key (optional, press Enter to skip): " OPENAI_KEY
if [ ! -z "$OPENAI_KEY" ]; then
  if grep -q "OPENAI_API_KEY" .dev.vars; then
    sed -i "s|^.*OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_KEY|" .dev.vars
  else
    echo "OPENAI_API_KEY=$OPENAI_KEY" >> .dev.vars
  fi
  echo "   ✓ Added OPENAI_API_KEY to .dev.vars"
fi

# Prompt for Anthropic API key (optional)
read -p "Enter Anthropic API Key (optional, press Enter to skip): " ANTHROPIC_KEY
if [ ! -z "$ANTHROPIC_KEY" ]; then
  if grep -q "ANTHROPIC_API_KEY" .dev.vars; then
    sed -i "s|^.*ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$ANTHROPIC_KEY|" .dev.vars
  else
    echo "ANTHROPIC_API_KEY=$ANTHROPIC_KEY" >> .dev.vars
  fi
  echo "   ✓ Added ANTHROPIC_API_KEY to .dev.vars"
fi

# Prompt for Google API key (optional)
read -p "Enter Google AI API Key (optional, press Enter to skip): " GOOGLE_KEY
if [ ! -z "$GOOGLE_KEY" ]; then
  if grep -q "GOOGLE_GENERATIVE_AI_API_KEY" .dev.vars; then
    sed -i "s|^.*GOOGLE_GENERATIVE_AI_API_KEY=.*|GOOGLE_GENERATIVE_AI_API_KEY=$GOOGLE_KEY|" .dev.vars
  else
    echo "GOOGLE_GENERATIVE_AI_API_KEY=$GOOGLE_KEY" >> .dev.vars
  fi
  echo "   ✓ Added GOOGLE_GENERATIVE_AI_API_KEY to .dev.vars"
fi

echo ""
echo "✅ AI Chat interface enabled!"
echo ""
echo "Next steps:"
echo "  1. Restart your dev server:"
echo "     npm run dev"
echo ""
echo "  2. Visit the chat page:"
echo "     http://localhost:5173/chat"
echo ""
echo "  3. Choose your AI provider:"
echo "     - Workers AI (free, no setup)"
echo "     - OpenAI GPT-4o (requires API key)"
echo "     - Anthropic Claude (requires API key)"
echo "     - Google Gemini (requires API key)"
echo ""
echo "See references/ai-sdk-guide.md for more information"
