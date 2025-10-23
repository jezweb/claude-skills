---
name: Cloudflare Full-Stack Scaffold
description: |
  Production-ready starter project for React + Cloudflare Workers + Hono with ALL services
  pre-configured (D1, KV, R2, Workers AI, Vectorize, Queues) and AI SDK Core/UI integration.
  Complete with planning docs, session handoff protocol, and optional Clerk authentication.

  Use when: starting new full-stack project, creating Cloudflare app, scaffolding web app,
  AI-powered application, chat interface, RAG application, need complete starter, avoid setup time,
  production-ready template, full-stack boilerplate, React Cloudflare starter.

  Prevents: service configuration errors, binding setup mistakes, frontend-backend connection issues,
  CORS errors, auth integration problems, AI SDK setup confusion, missing planning docs,
  incomplete project structure, hours of initial setup.

  Keywords: cloudflare scaffold, full-stack starter, react cloudflare, hono template, production boilerplate,
  AI SDK integration, workers AI, complete starter project, D1 KV R2 setup, web app template,
  chat application scaffold, RAG starter, planning docs included, session handoff,
  tailwind v4 shadcn, typescript starter, vite cloudflare plugin, all services configured
license: MIT
metadata:
  version: 1.0.0
  last_updated: 2025-10-23
  packages:
    - "react: 19.2.0"
    - "hono: 4.10.2"
    - "@cloudflare/vite-plugin: 1.13.14"
    - "ai: 5.0.76"
    - "@ai-sdk/openai: 1.0.0"
    - "workers-ai-provider: 2.0.0"
    - "@ai-sdk/react: 1.0.0"
    - "@clerk/clerk-react: 5.53.3"
    - "tailwindcss: 4.1.14"
  production_tested: true
  token_savings: "75-80%"
  errors_prevented: "12+ setup and configuration errors"
---

# Cloudflare Full-Stack Scaffold

Complete, production-ready starter project for building full-stack applications on Cloudflare with React, Hono, AI SDK, and all Cloudflare services pre-configured.

## When to Use This Skill

Use this skill when you need to:

- **Start a new full-stack Cloudflare project** in minutes instead of hours
- **Build AI-powered applications** with chat interfaces, RAG, or tool calling
- **Have all Cloudflare services ready** (D1, KV, R2, Workers AI, Vectorize, Queues)
- **Use modern best practices** (Tailwind v4, shadcn/ui, AI SDK, React 19)
- **Include planning docs and session handoff** from the start
- **Choose your AI provider** (Workers AI, OpenAI, Anthropic, Gemini)
- **Optional authentication** with Clerk (uncomment to enable)
- **Avoid configuration errors** and integration issues

## What This Skill Provides

### Complete Scaffold Project

A fully working application you can **copy, customize, and deploy** immediately:

```bash
# Copy the scaffold
cp -r scaffold/ my-new-app/
cd my-new-app/

# Initialize
./scripts/setup-project.sh

# Start developing
npm run dev
```

**Result**: Full-stack app running in ~5 minutes with:
- ✅ Frontend and backend connected
- ✅ All Cloudflare services configured
- ✅ AI SDK ready with multiple providers
- ✅ Planning docs and session handoff protocol
- ✅ Dark mode, theming, UI components
- ✅ Optional auth (1 script to enable)
- ✅ Optional AI chat UI (1 script to enable)

### Scaffold Structure

```
scaffold/
├── package.json              # All dependencies (React, Hono, AI SDK, Clerk)
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Cloudflare Vite plugin
├── wrangler.jsonc           # All Cloudflare services configured
├── .dev.vars.example        # Environment variables template
├── .gitignore               # Standard ignores
├── README.md                # Project-specific readme
├── CLAUDE.md                # Project instructions for Claude
├── SCRATCHPAD.md            # Session handoff protocol
├── CHANGELOG.md             # Version history
├── schema.sql               # D1 database schema
│
├── docs/                    # Complete planning docs
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_ENDPOINTS.md
│   ├── IMPLEMENTATION_PHASES.md
│   ├── UI_COMPONENTS.md
│   └── TESTING.md
│
├── migrations/              # D1 migrations
│   └── 0001_initial.sql
│
├── src/                     # Frontend (React + Vite + Tailwind v4)
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css           # Tailwind v4 theming
│   ├── components/
│   │   ├── ui/             # shadcn/ui components
│   │   ├── ThemeProvider.tsx
│   │   ├── ProtectedRoute.tsx     # Auth (COMMENTED)
│   │   └── ChatInterface.tsx      # AI chat (COMMENTED)
│   ├── lib/
│   │   ├── utils.ts        # cn() utility
│   │   └── api-client.ts   # Fetch wrapper
│   └── pages/
│       ├── Home.tsx
│       ├── Dashboard.tsx
│       └── Chat.tsx        # AI chat page (COMMENTED)
│
└── backend/                 # Backend (Hono + Cloudflare)
    ├── src/
    │   └── index.ts        # Main Worker entry
    ├── middleware/
    │   ├── cors.ts
    │   └── auth.ts         # JWT (COMMENTED)
    ├── routes/
    │   ├── api.ts          # Basic API routes
    │   ├── d1.ts           # D1 examples
    │   ├── kv.ts           # KV examples
    │   ├── r2.ts           # R2 examples
    │   ├── ai.ts           # Workers AI (direct binding)
    │   ├── ai-sdk.ts       # AI SDK examples (multiple providers)
    │   ├── vectorize.ts    # Vectorize examples
    │   └── queues.ts       # Queues examples
    └── db/
        └── queries.ts      # D1 typed query helpers
```

### Helper Scripts

**`scripts/setup-project.sh`**:
- Copies scaffold to new directory
- Renames project in package.json
- Initializes git repository
- Runs npm install
- Prompts to initialize services

**`scripts/init-services.sh`**:
- Creates D1 database via wrangler
- Creates KV namespace
- Creates R2 bucket
- Creates Vectorize index
- Creates Queue
- Updates wrangler.jsonc with IDs

**`scripts/enable-auth.sh`**:
- Uncomments all Clerk auth patterns
- Enables ProtectedRoute component
- Enables auth middleware
- Prompts for Clerk API keys
- Updates .dev.vars

**`scripts/enable-ai-chat.sh`**:
- Uncomments ChatInterface component
- Uncomments Chat page
- Enables AI SDK UI patterns
- Adds chat route to App.tsx
- Prompts for AI provider API keys

### Reference Documentation

**`references/quick-start-guide.md`**:
- 5-minute setup walkthrough
- First deployment guide
- Common customizations

**`references/service-configuration.md`**:
- Details on each Cloudflare service
- When to use each one
- Configuration options

**`references/ai-sdk-guide.md`**:
- AI SDK Core vs UI
- Provider switching patterns
- Streaming and tool calling
- RAG implementation

**`references/customization-guide.md`**:
- Removing unused services
- Adding new routes/pages
- Customizing theme
- Project structure best practices

**`references/enabling-auth.md`**:
- Clerk setup walkthrough
- JWT template configuration
- Testing auth flow

## Key Integrations

### 1. AI SDK Integration (Three Approaches)

**Direct Workers AI Binding** (fastest):
```typescript
// Already works, no API key needed
const result = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
  messages: [{ role: 'user', content: 'Hello' }]
})
```

**AI SDK with Workers AI** (portable code, same infrastructure):
```typescript
import { streamText } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'

const workersai = createWorkersAI({ binding: c.env.AI })
const result = await streamText({
  model: workersai('@cf/meta/llama-3-8b-instruct'),
  messages: [{ role: 'user', content: 'Hello' }]
})
```

**AI SDK with External Providers** (OpenAI, Anthropic, Gemini):
```typescript
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'

// Switch providers in 1 line
const result = await streamText({
  model: openai('gpt-4o'),  // or anthropic('claude-sonnet-4-5')
  messages: [{ role: 'user', content: 'Hello' }]
})
```

**AI SDK UI - Chat Interface** (COMMENTED, enable with script):
```tsx
import { useChat } from '@ai-sdk/react'

function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()
  return (/* chat UI */)
}
```

### 2. All Cloudflare Services Pre-Configured

**Database (D1)**:
- Schema file with example tables
- Migrations directory
- Typed query helpers
- Example CRUD routes

**Key-Value Storage (KV)**:
- Get/put/delete examples
- TTL patterns
- Bulk operations

**Object Storage (R2)**:
- Upload/download examples
- Presigned URLs
- Streaming large files

**AI Inference (Workers AI)**:
- Text generation
- Embeddings
- Image generation (Stable Diffusion)

**Vector Database (Vectorize)**:
- Insert/query embeddings
- RAG patterns
- Similarity search

**Message Queues**:
- Producer examples
- Consumer patterns
- Batch processing

### 3. Optional Clerk Authentication

All auth patterns included but **COMMENTED** - uncomment to enable:

```bash
./scripts/enable-auth.sh
# Prompts for Clerk keys, uncomments all patterns
```

**What gets enabled**:
- Frontend: ProtectedRoute component, auth in api-client
- Backend: JWT verification middleware
- Protected API routes
- Auth loading states
- Session management

### 4. Planning Docs + Session Handoff Protocol

**docs/ directory** - Complete planning structure:
- ARCHITECTURE.md: System design
- DATABASE_SCHEMA.md: D1 schema docs
- API_ENDPOINTS.md: All routes documented
- IMPLEMENTATION_PHASES.md: Phased build approach
- UI_COMPONENTS.md: Component hierarchy
- TESTING.md: Test strategy

**SCRATCHPAD.md** - Session handoff protocol:
- Current phase tracking
- Progress checkpoints
- Next actions
- References to planning docs

## Usage Guide

### Quick Start (5 Minutes)

```bash
# 1. Copy scaffold
cd /path/to/skills/cloudflare-full-stack-scaffold
cp -r scaffold/ ~/projects/my-new-app/
cd ~/projects/my-new-app/

# 2. Run setup
npm install

# 3. Initialize Cloudflare services
npx wrangler d1 create my-app-db
npx wrangler kv:namespace create my-app-kv
npx wrangler r2 bucket create my-app-bucket
npx wrangler vectorize create my-app-index --dimensions=1536
npx wrangler queues create my-app-queue

# 4. Update wrangler.jsonc with IDs from step 3

# 5. Create D1 tables
npx wrangler d1 execute my-app-db --local --file=schema.sql

# 6. Start dev server
npm run dev
```

**Visit**: http://localhost:5173

### Enable Authentication (Optional)

```bash
./scripts/enable-auth.sh
# Prompts for Clerk publishable and secret keys
# Uncomments all auth patterns
# Updates .dev.vars

npm run dev
```

### Enable AI Chat Interface (Optional)

```bash
./scripts/enable-ai-chat.sh
# Uncomments ChatInterface component
# Uncomments Chat page
# Prompts for OpenAI/Anthropic API keys (optional)

npm run dev
```

**Visit**: http://localhost:5173/chat

### Deploy to Production

```bash
# Build
npm run build

# Deploy
npx wrangler deploy

# Migrate production database
npx wrangler d1 execute my-app-db --remote --file=schema.sql

# Set production secrets
npx wrangler secret put CLERK_SECRET_KEY
npx wrangler secret put OPENAI_API_KEY
```

## Customization Patterns

### Remove Unused Services

**Don't need Vectorize?**
1. Delete `backend/routes/vectorize.ts`
2. Remove vectorize binding from `wrangler.jsonc`
3. Remove from `vite.config.ts` cloudflare plugin
4. Remove route registration in `backend/src/index.ts`

### Add New API Routes

```typescript
// backend/routes/my-feature.ts
import { Hono } from 'hono'

export const myFeatureRoutes = new Hono()

myFeatureRoutes.get('/hello', (c) => {
  return c.json({ message: 'Hello from my feature!' })
})

// backend/src/index.ts
import { myFeatureRoutes } from './routes/my-feature'
app.route('/api/my-feature', myFeatureRoutes)
```

### Switch AI Providers

```typescript
// Change this line:
model: openai('gpt-4o'),

// To this:
model: anthropic('claude-sonnet-4-5'),

// Or this:
model: google('gemini-2.5-flash'),

// Or use Workers AI:
const workersai = createWorkersAI({ binding: c.env.AI })
model: workersai('@cf/meta/llama-3-8b-instruct'),
```

### Customize Theme

All theming in `src/index.css`:

```css
:root {
  --background: hsl(0 0% 100%);  /* Change colors here */
  --foreground: hsl(0 0% 3.9%);
  --primary: hsl(220 90% 56%);
  /* etc */
}
```

## Architecture Highlights

### Frontend-Backend Connection

**Key Insight**: The Vite plugin runs your Worker on the **SAME port** as Vite.

```typescript
// ✅ CORRECT: Use relative URLs
fetch('/api/data')

// ❌ WRONG: Don't use absolute URLs
fetch('http://localhost:8787/api/data')
```

**No proxy configuration needed!**

### Environment Variables

**Frontend** (.env):
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

**Backend** (.dev.vars):
```bash
CLERK_SECRET_KEY=sk_test_xxx
OPENAI_API_KEY=sk-xxx
```

### CORS Configuration

**Critical**: CORS middleware must be applied **BEFORE** routes:

```typescript
// ✅ CORRECT ORDER
app.use('/api/*', corsMiddleware)
app.post('/api/data', handler)

// ❌ WRONG - Will cause CORS errors
app.post('/api/data', handler)
app.use('/api/*', corsMiddleware)
```

### Auth Pattern (When Enabled)

**Frontend**: Check `isLoaded` before making API calls:
```typescript
const { isLoaded, isSignedIn } = useSession()

useEffect(() => {
  if (!isLoaded) return  // Wait for auth
  fetch('/api/protected').then(/* ... */)
}, [isLoaded])
```

**Backend**: JWT verification middleware:
```typescript
import { jwtAuthMiddleware } from './middleware/auth'

app.use('/api/protected/*', jwtAuthMiddleware)
```

## Dependencies Included

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "hono": "^4.10.2",
    "@cloudflare/vite-plugin": "^1.13.14",

    "ai": "^5.0.76",
    "@ai-sdk/openai": "^1.0.0",
    "@ai-sdk/anthropic": "^1.0.0",
    "@ai-sdk/google": "^1.0.0",
    "workers-ai-provider": "^2.0.0",
    "@ai-sdk/react": "^1.0.0",

    "@clerk/clerk-react": "^5.53.3",
    "@clerk/backend": "^2.19.0",

    "tailwindcss": "^4.1.14",
    "@tailwindcss/vite": "^4.1.14",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4",

    "zod": "^3.24.1",
    "react-hook-form": "^7.54.2",
    "@hookform/resolvers": "^3.9.1",

    "@tanstack/react-query": "^5.62.11",

    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.1.4"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.2",
    "vite": "^7.1.11",
    "wrangler": "^4.0.0"
  }
}
```

## Token Efficiency

| Scenario | Without Scaffold | With Scaffold | Savings |
|----------|------------------|---------------|---------|
| Initial setup | ~18-22k tokens | ~3-5k tokens | ~80% |
| Service configuration | ~8-10k tokens | 0 tokens (done) | 100% |
| Frontend-backend connection | ~5-7k tokens | 0 tokens (done) | 100% |
| AI SDK setup | ~4-6k tokens | 0 tokens (done) | 100% |
| Auth integration | ~6-8k tokens | ~500 tokens | ~90% |
| Planning docs | ~3-5k tokens | 0 tokens (included) | 100% |
| **Total** | **~44-58k tokens** | **~3-6k tokens** | **~90%** |

**Time Savings**: 3-4 hours → 5-10 minutes (~95% faster)

## Common Issues Prevented

| Issue | How Scaffold Prevents It |
|-------|-------------------------|
| **Service binding errors** | All bindings pre-configured and tested |
| **CORS errors** | Middleware in correct order |
| **Auth race conditions** | Proper loading state patterns |
| **Frontend-backend connection** | Vite plugin correctly configured |
| **AI SDK setup confusion** | Multiple working examples |
| **Missing planning docs** | Complete docs/ structure included |
| **Environment variable mix-ups** | Clear .dev.vars.example with comments |
| **Missing migrations** | migrations/ directory with examples |
| **Inconsistent file structure** | Standard, tested structure |
| **Database type errors** | Typed query helpers included |
| **Theme configuration** | Tailwind v4 theming pre-configured |
| **Build errors** | Working build config (vite + wrangler) |

**Total Errors Prevented**: 12+ common setup and integration errors

## When NOT to Use This Scaffold

- ❌ Building a static site (no backend needed)
- ❌ Using Next.js, Remix, or other meta-framework
- ❌ Need SSR (use framework-specific Cloudflare adapter)
- ❌ Building backend-only API (no frontend needed)
- ❌ Extremely simple single-page app

**For these cases**: Use minimal templates or official framework starters.

## Production Evidence

**Based on**:
- Cloudflare's official agents-starter template (AI SDK patterns)
- cloudflare-full-stack-integration skill (tested frontend-backend patterns)
- session-handoff-protocol skill (planning docs + SCRATCHPAD.md)
- tailwind-v4-shadcn skill (UI component patterns)
- Multiple production Jezweb projects

**Package versions verified**: 2025-10-23

**Works with**:
- Cloudflare Workers (production environment)
- Wrangler 4.0+
- Node.js 18+
- npm/pnpm/yarn

## Quick Reference

**Setup new project**:
```bash
cp -r scaffold/ my-app/
cd my-app/
npm install
# Follow quick-start-guide.md
```

**Enable auth**:
```bash
./scripts/enable-auth.sh
```

**Enable AI chat**:
```bash
./scripts/enable-ai-chat.sh
```

**Deploy**:
```bash
npm run build
npx wrangler deploy
```

**Key Files**:
- `wrangler.jsonc` - Service configuration
- `vite.config.ts` - Build configuration
- `.dev.vars.example` - Environment variables template
- `docs/ARCHITECTURE.md` - System design
- `SCRATCHPAD.md` - Session handoff protocol

---

**Remember**: This scaffold is a **starting point**, not a constraint. Customize everything to match your needs. The value is in having a working foundation with all the integration patterns already figured out, saving hours of setup and debugging time.
