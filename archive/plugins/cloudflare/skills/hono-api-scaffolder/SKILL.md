---
name: hono-api-scaffolder
description: "Scaffold Hono API routes for Cloudflare Workers. Produces route files, middleware, typed bindings, Zod validation, error handling, and API_ENDPOINTS.md documentation. Use after a project is set up with cloudflare-worker-builder or vite-flare-starter, when you need to add API routes, create endpoints, or generate API documentation."
compatibility: claude-code-only
---

# Hono API Scaffolder

Add structured API routes to an existing Cloudflare Workers project. This skill runs AFTER the project shell exists (via cloudflare-worker-builder or vite-flare-starter) and produces route files, middleware, and endpoint documentation.

## Workflow

### Step 1: Gather Endpoints

Determine what the API needs. Either ask the user or infer from the project description. Group endpoints by resource:

```
Users:    GET /api/users, GET /api/users/:id, POST /api/users, PUT /api/users/:id, DELETE /api/users/:id
Posts:    GET /api/posts, GET /api/posts/:id, POST /api/posts, PUT /api/posts/:id
Auth:     POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
```

### Step 2: Create Route Files

One file per resource group. Use the template from [assets/route-template.ts](assets/route-template.ts):

```typescript
// src/routes/users.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../types'

const app = new Hono<{ Bindings: Env }>()

// GET /api/users
app.get('/', async (c) => {
  const db = c.env.DB
  const { results } = await db.prepare('SELECT * FROM users').all()
  return c.json({ users: results })
})

// GET /api/users/:id
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
  if (!user) return c.json({ error: 'Not found' }, 404)
  return c.json({ user })
})

// POST /api/users
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

app.post('/', zValidator('json', createUserSchema), async (c) => {
  const body = c.req.valid('json')
  // ... insert logic
  return c.json({ user }, 201)
})

export default app
```

### Step 3: Add Middleware

Based on project needs, add from [assets/middleware-template.ts](assets/middleware-template.ts):

**Auth middleware** — protect routes requiring authentication:
```typescript
import { createMiddleware } from 'hono/factory'
import type { Env } from '../types'

export const requireAuth = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  // Validate token...
  await next()
})
```

**CORS** — use Hono's built-in:
```typescript
import { cors } from 'hono/cors'
app.use('/api/*', cors({ origin: ['https://example.com'] }))
```

### Step 4: Wire Routes

Mount all route groups in the main entry point:

```typescript
// src/index.ts
import { Hono } from 'hono'
import type { Env } from './types'
import users from './routes/users'
import posts from './routes/posts'
import auth from './routes/auth'
import { errorHandler } from './middleware/error-handler'

const app = new Hono<{ Bindings: Env }>()

// Global error handler
app.onError(errorHandler)

// Mount routes
app.route('/api/users', users)
app.route('/api/posts', posts)
app.route('/api/auth', auth)

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }))

export default app
```

### Step 5: Create Types

```typescript
// src/types.ts
export interface Env {
  DB: D1Database
  KV: KVNamespace      // if needed
  R2: R2Bucket         // if needed
  API_SECRET: string   // secrets
}
```

### Step 6: Generate API_ENDPOINTS.md

Document all endpoints. See [references/endpoint-docs-template.md](references/endpoint-docs-template.md) for the format:

```markdown
## POST /api/users
Create a new user.
- **Auth**: Required (Bearer token)
- **Body**: `{ name: string, email: string }`
- **Response 201**: `{ user: User }`
- **Response 400**: `{ error: string, details: ZodError }`
```

## Key Patterns

### Zod Validation

Always validate request bodies with `@hono/zod-validator`:

```typescript
import { zValidator } from '@hono/zod-validator'
app.post('/', zValidator('json', schema), async (c) => {
  const body = c.req.valid('json')  // fully typed
})
```

Install: `pnpm add @hono/zod-validator zod`

### Error Handling

Use the standard error handler from [assets/error-handler.ts](assets/error-handler.ts):

```typescript
export const errorHandler = (err: Error, c: Context) => {
  console.error(err)
  return c.json({ error: err.message }, 500)
}
```

**API routes must return JSON errors, not redirects.** `fetch()` follows redirects silently, then the client tries to parse HTML as JSON.

### RPC Type Safety

For end-to-end type safety between Worker and client:

```typescript
// Worker: export the app type
export type AppType = typeof app

// Client: use hc (Hono Client)
import { hc } from 'hono/client'
import type { AppType } from '../worker/src/index'

const client = hc<AppType>('https://api.example.com')
const res = await client.api.users.$get()  // fully typed
```

### Route Groups vs Single File

| Project size | Structure |
|-------------|-----------|
| < 10 endpoints | Single `index.ts` with all routes |
| 10-30 endpoints | Route files per resource (`routes/users.ts`) |
| 30+ endpoints | Route files + shared middleware + typed context |

## Reference Files

| When | Read |
|------|------|
| Hono patterns, middleware, RPC | [references/hono-patterns.md](references/hono-patterns.md) |
| API_ENDPOINTS.md format | [references/endpoint-docs-template.md](references/endpoint-docs-template.md) |

## Assets

| File | Purpose |
|------|---------|
| [assets/route-template.ts](assets/route-template.ts) | Starter route file with CRUD + Zod |
| [assets/middleware-template.ts](assets/middleware-template.ts) | Auth middleware template |
| [assets/error-handler.ts](assets/error-handler.ts) | Standard JSON error handler |
