# Cloudflare Full-Stack Application

Production-ready full-stack application built with React, Cloudflare Workers, Hono, AI SDK, and all Cloudflare services.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Initialize Cloudflare services
npx wrangler d1 create my-app-db
npx wrangler kv:namespace create my-app-kv
npx wrangler r2 bucket create my-app-bucket
npx wrangler vectorize create my-app-index --dimensions=1536 --metric=cosine
npx wrangler queues create my-app-queue

# 3. Update wrangler.jsonc with the IDs from step 2

# 4. Create database tables
npx wrangler d1 execute my-app-db --local --file=schema.sql

# 5. Start development server
npm run dev
```

Visit: http://localhost:5173

## Project Structure

```
├── src/                    # Frontend (React + Vite + Tailwind v4)
│   ├── components/        # React components
│   │   └── ui/           # shadcn/ui components
│   ├── lib/              # Utilities (api-client, utils)
│   └── pages/            # Page components
│
├── backend/               # Backend (Hono + Cloudflare Workers)
│   ├── src/              # Worker entry point
│   ├── middleware/       # CORS, Auth
│   ├── routes/           # API routes
│   └── db/               # Database queries
│
├── docs/                  # Planning documentation
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_ENDPOINTS.md
│   ├── IMPLEMENTATION_PHASES.md
│   ├── UI_COMPONENTS.md
│   └── TESTING.md
│
├── migrations/            # D1 database migrations
├── schema.sql            # D1 schema definition
└── SCRATCHPAD.md         # Session handoff protocol
```

## Available Services

All Cloudflare services are pre-configured:

- ✅ **Workers AI** - AI model inference
- ✅ **D1 Database** - Serverless SQL
- ✅ **KV Storage** - Key-value store
- ✅ **R2 Storage** - Object storage (S3-compatible)
- ✅ **Vectorize** - Vector database for RAG
- ✅ **Queues** - Message queues

## AI SDK Integration

Three approaches to AI:

### 1. Direct Workers AI Binding (fastest, free)
```typescript
const result = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
  messages: [{ role: 'user', content: 'Hello' }]
})
```

### 2. AI SDK with Workers AI (portable)
```typescript
import { streamText } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'

const result = await streamText({
  model: workersai('@cf/meta/llama-3-8b-instruct'),
  messages: [{ role: 'user', content: 'Hello' }]
})
```

### 3. AI SDK with External Providers
```typescript
import { openai } from '@ai-sdk/openai'

const result = await streamText({
  model: openai('gpt-4o'),
  messages: [{ role: 'user', content: 'Hello' }]
})
```

## Optional Features

### Enable Authentication

```bash
# Uncomments all Clerk auth patterns
./scripts/enable-auth.sh
```

### Enable AI Chat Interface

```bash
# Uncomments ChatInterface component and Chat page
./scripts/enable-ai-chat.sh
```

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Cloudflare
npm run deploy

# Database operations
npm run d1:local          # Apply schema locally
npm run d1:remote         # Apply schema to production
npm run d1:migrate:local  # Run migrations locally
npm run d1:migrate:remote # Run migrations to production
```

## Environment Variables

Copy `.dev.vars.example` to `.dev.vars` and fill in your values:

```bash
cp .dev.vars.example .dev.vars
```

**Frontend** (create `.env`):
```bash
# VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

**Backend** (use `.dev.vars`):
```bash
# CLERK_SECRET_KEY=sk_test_xxx
# OPENAI_API_KEY=sk-xxx
```

## Deployment

```bash
# 1. Build
npm run build

# 2. Deploy
npx wrangler deploy

# 3. Apply database schema to production
npm run d1:remote

# 4. Set production secrets
npx wrangler secret put CLERK_SECRET_KEY
npx wrangler secret put OPENAI_API_KEY
```

## Documentation

- **Architecture**: `docs/ARCHITECTURE.md`
- **Database Schema**: `docs/DATABASE_SCHEMA.md`
- **API Endpoints**: `docs/API_ENDPOINTS.md`
- **Implementation Phases**: `docs/IMPLEMENTATION_PHASES.md`
- **Session Handoff**: `SCRATCHPAD.md`

## Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind v4, shadcn/ui
- **Backend**: Hono 4, Cloudflare Workers
- **AI**: AI SDK Core, AI SDK UI, Workers AI
- **Auth**: Clerk (optional)
- **Database**: D1 (SQL)
- **Storage**: KV, R2
- **Vector DB**: Vectorize
- **Queues**: Cloudflare Queues

## Support

For issues or questions, see the project documentation in `docs/`.
