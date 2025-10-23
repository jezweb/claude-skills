# Installation and Setup Guide

**IMPORTANT**: This scaffold provides the complete project structure and configuration. For full implementations of components, routes, and patterns, use these companion skills:

1. **tailwind-v4-shadcn** - For UI components (Button, Card, Dialog, etc.)
2. **cloudflare-full-stack-integration** - For API routes, middleware, and integration patterns
3. **session-handoff-protocol** - For SCRATCHPAD.md and session management

## Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy this scaffold structure and ask Claude Code to:
#    "Use the tailwind-v4-shadcn skill to add UI components"
#    "Use the cloudflare-full-stack-integration skill to build API routes"

# 3. Initialize Cloudflare services
./scripts/init-services.sh

# 4. Start development
npm run dev
```

## What's Included vs. What to Add

### ✅ Included (Ready to Use)
- Complete project structure
- All configuration files (package.json, vite.config.ts, wrangler.jsonc)
- Planning docs structure
- Database schema
- Session handoff protocol (SCRATCHPAD.md)
- Helper scripts

### 📝 To Add with Skills
- **UI Components**: Use `tailwind-v4-shadcn` skill
  - "Add Button, Card, Dialog components from shadcn"

- **API Routes**: Use `cloudflare-full-stack-integration` skill
  - "Create API routes for D1, KV, R2, Workers AI"
  - "Add CORS and auth middleware"

- **Frontend Pages**: Build with shadcn components
  - Home page, Dashboard, etc.

## Why This Approach?

This scaffold focuses on:
1. ✅ **Project structure** - All directories and config
2. ✅ **Service configuration** - All Cloudflare services wired up
3. ✅ **Planning foundation** - Docs, SCRATCHPAD, CLAUDE.md

You add the actual implementation using our production-tested skills, which:
- Prevents code duplication
- Ensures you get latest patterns
- Allows customization per project
- Keeps the scaffold lightweight

## Recommended Workflow

```bash
# 1. Copy scaffold
cp -r scaffold/ my-project/
cd my-project/

# 2. Install and initialize
npm install
./scripts/init-services.sh

# 3. Ask Claude Code to add components
"Use tailwind-v4-shadcn skill to add Button, Card, and Dialog components"

# 4. Ask Claude Code to add API routes
"Use cloudflare-full-stack-integration skill to create D1 CRUD routes"

# 5. Build your features
# The foundation is ready, now build your application!
```

## Full Documentation

See `references/` directory for:
- quick-start-guide.md
- service-configuration.md
- ai-sdk-guide.md
- customization-guide.md
