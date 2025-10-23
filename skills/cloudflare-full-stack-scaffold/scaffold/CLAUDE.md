# Project Instructions for Claude

**Project**: [Your Project Name]
**Type**: Full-Stack Cloudflare Application
**Tech Stack**: React 19 + Cloudflare Workers + Hono + AI SDK
**Status**: Active Development

---

## Current Work

See `SCRATCHPAD.md` for:
- Current phase and progress
- Next action when resuming
- Recent checkpoints

This project follows phased development. Planning docs in `docs/`.

---

## Tech Stack

**Frontend**:
- React 19.2 + Vite 7
- Tailwind v4 + shadcn/ui
- React Router 7
- TanStack Query (server state)
- React Hook Form + Zod (forms/validation)

**Backend**:
- Cloudflare Workers
- Hono 4 (web framework)
- TypeScript

**AI Integration**:
- AI SDK Core (`ai` package)
- AI SDK UI (`@ai-sdk/react`)
- Workers AI binding
- Multiple provider support (OpenAI, Anthropic, Gemini)

**Cloudflare Services**:
- D1 (SQL database)
- KV (key-value storage)
- R2 (object storage)
- Workers AI (inference)
- Vectorize (vector database)
- Queues (message queues)

**Authentication** (optional):
- Clerk

---

## Project Structure

```
├── src/               # Frontend (React)
├── backend/           # Backend (Hono Worker)
├── docs/              # Planning documentation
├── migrations/        # D1 migrations
├── schema.sql        # D1 schema
└── SCRATCHPAD.md     # Session handoff
```

---

## Key Architectural Patterns

### 1. Frontend-Backend Connection

The `@cloudflare/vite-plugin` runs the Worker on the **SAME port** as Vite:

```typescript
// ✅ CORRECT: Use relative URLs
fetch('/api/data')

// ❌ WRONG: Don't use absolute URLs or proxy
fetch('http://localhost:8787/api/data')
```

### 2. CORS Middleware Order

**CRITICAL**: CORS must be applied BEFORE routes:

```typescript
// ✅ CORRECT ORDER
app.use('/api/*', corsMiddleware)
app.post('/api/data', handler)

// ❌ WRONG - Will cause CORS errors
app.post('/api/data', handler)
app.use('/api/*', corsMiddleware)
```

### 3. Auth Loading States (when enabled)

Check `isLoaded` before making API calls:

```typescript
const { isLoaded, isSignedIn } = useSession()

useEffect(() => {
  if (!isLoaded) return  // Wait for auth
  fetch('/api/protected').then(/* ... */)
}, [isLoaded])
```

### 4. AI SDK Provider Switching

Change providers in one line:

```typescript
// Workers AI (free, Cloudflare)
const workersai = createWorkersAI({ binding: env.AI })
model: workersai('@cf/meta/llama-3-8b-instruct')

// OpenAI
model: openai('gpt-4o')

// Anthropic
model: anthropic('claude-sonnet-4-5')

// Google
model: google('gemini-2.5-flash')
```

---

## Environment Variables

**Frontend** (`.env`):
```bash
# VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

**Backend** (`.dev.vars`):
```bash
# CLERK_SECRET_KEY=sk_test_xxx
# OPENAI_API_KEY=sk-xxx
# ANTHROPIC_API_KEY=sk-ant-xxx
```

---

## Common Commands

```bash
# Development
npm run dev

# Build
npm run build

# Deploy
npm run deploy

# Database (local)
npm run d1:local
npm run d1:migrate:local

# Database (production)
npm run d1:remote
npm run d1:migrate:remote
```

---

## Planning Documents

- **Architecture**: `docs/ARCHITECTURE.md` - System design
- **Database**: `docs/DATABASE_SCHEMA.md` - D1 schema
- **API**: `docs/API_ENDPOINTS.md` - All routes
- **Phases**: `docs/IMPLEMENTATION_PHASES.md` - Build phases
- **UI**: `docs/UI_COMPONENTS.md` - Component hierarchy
- **Testing**: `docs/TESTING.md` - Test strategy

---

## Session Handoff Protocol

This project uses `SCRATCHPAD.md` for context bridging between sessions.

**Before ending session**:
1. Update SCRATCHPAD.md with current progress
2. Create git checkpoint commit
3. Update "Next Action" with concrete next step

**When resuming**:
1. Read SCRATCHPAD.md
2. Check "Next Action" in current phase
3. Start working

---

## Code Standards

- TypeScript with strict mode
- ES modules format
- Hono for backend routing
- shadcn/ui for UI components
- Zod for validation
- AI SDK for AI interactions

---

## Notes

[Add project-specific notes, decisions, and context here as the project develops]
