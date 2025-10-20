# Architecture Deep Dive

**Last Updated**: 2025-10-20

This document explains the architectural patterns used in Cloudflare Workers with Hono, Vite, and Static Assets.

---

## Table of Contents

1. [Export Patterns](#export-patterns)
2. [Routing Architecture](#routing-architecture)
3. [Static Assets Integration](#static-assets-integration)
4. [Bindings and Type Safety](#bindings-and-type-safety)
5. [Development vs Production](#development-vs-production)

---

## Export Patterns

### The Correct Pattern (ES Module Format)

```typescript
import { Hono } from 'hono'

const app = new Hono()

// Define routes...

// ✅ CORRECT: Export the Hono app directly
export default app
```

**Why this works:**
- Hono's app object already implements the `fetch` handler
- When Cloudflare calls your Worker, it automatically invokes `app.fetch()`
- This is the **ES Module Worker format** (modern, recommended)

### The Incorrect Pattern (Causes Errors)

```typescript
// ❌ WRONG: This causes "Cannot read properties of undefined (reading 'map')" error
export default {
  fetch: app.fetch
}
```

**Why this fails:**
- When using Vite's build tools with Hono, the `app.fetch` binding is lost
- The Vite bundler transforms the code in a way that breaks the `this` context
- Source: [honojs/hono #3955](https://github.com/honojs/hono/issues/3955)

### Module Worker Format (When You Need Multiple Handlers)

```typescript
import { Hono } from 'hono'

const app = new Hono()

// Define routes...

// ✅ CORRECT: Use Module Worker format for scheduled/tail handlers
export default {
  fetch: app.fetch,

  scheduled: async (event, env, ctx) => {
    // Cron job logic
    console.log('Cron triggered:', event.cron)
  },

  tail: async (events, env, ctx) => {
    // Tail handler logic
    console.log('Tail events:', events)
  }
}
```

**When to use this:**
- You need scheduled (cron) handlers
- You need tail handlers for log consumption
- You need queue consumers
- You need durable object handlers

**Important**: This is still ES Module format, not the deprecated Service Worker format.

### Deprecated Service Worker Format (Never Use)

```typescript
// ❌ DEPRECATED: Never use this format
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})
```

**Why never use this:**
- Deprecated since Cloudflare Workers v2
- Doesn't support modern features (D1, Vectorize, etc.)
- Not compatible with TypeScript types
- Not supported by Vite plugin

---

## Routing Architecture

### Request Flow

```
Incoming Request
    ↓
    ├─→ Worker checks run_worker_first patterns
    │   └─→ Matches /api/* → Worker handles it → Returns JSON
    │
    └─→ No match → Static Assets handler
        ├─→ File exists → Returns file
        └─→ File not found → SPA fallback → Returns index.html
```

### Configuration Required

In `wrangler.jsonc`:

```jsonc
{
  "assets": {
    "directory": "./public/",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]
  }
}
```

**Critical**: Without `run_worker_first`, the SPA fallback intercepts ALL requests, including API routes.

### Route Priority

1. **Worker routes** (if matched by `run_worker_first`)
   ```typescript
   app.get('/api/hello', (c) => c.json({ ... }))
   ```

2. **Static files** (if file exists in `public/`)
   ```
   public/styles.css → Served as-is
   public/logo.png → Served as-is
   ```

3. **SPA fallback** (if file doesn't exist)
   ```
   /unknown-route → Returns public/index.html
   ```

### Advanced Routing Patterns

#### Wildcard Routes

```typescript
// Match all API versions
app.get('/api/:version/users', (c) => {
  const version = c.req.param('version')
  return c.json({ version })
})

// Match nested routes
app.get('/api/users/:id/posts/:postId', (c) => {
  const { id, postId } = c.req.param()
  return c.json({ userId: id, postId })
})
```

#### Regex Routes

```typescript
// Match numeric IDs only
app.get('/api/users/:id{[0-9]+}', (c) => {
  const id = c.req.param('id')
  return c.json({ id: parseInt(id) })
})
```

#### Route Groups

```typescript
const api = new Hono()

api.get('/users', (c) => c.json({ users: [] }))
api.get('/posts', (c) => c.json({ posts: [] }))

app.route('/api', api)  // Mount at /api
```

---

## Static Assets Integration

### How Static Assets Work

1. **Upload**: When you deploy, Wrangler uploads `public/` to Cloudflare's asset store
2. **Binding**: Your Worker receives an `ASSETS` Fetcher binding
3. **Request**: Your Worker can forward requests to `ASSETS.fetch()`
4. **Cache**: Assets are cached at the edge automatically

### The Fallback Pattern

```typescript
// Handle all unmatched routes
app.all('*', (c) => {
  // Forward to Static Assets
  return c.env.ASSETS.fetch(c.req.raw)
})
```

**What this does:**
- Forwards request to Static Assets handler
- Static Assets checks if file exists
- If yes: Returns file
- If no: Returns `index.html` (SPA fallback)

### Custom 404 Handling

```typescript
app.all('*', async (c) => {
  const response = await c.env.ASSETS.fetch(c.req.raw)

  // If Static Assets returns 404, customize response
  if (response.status === 404) {
    return c.json({ error: 'Not Found' }, 404)
  }

  return response
})
```

### Asset Preprocessing

```typescript
app.all('*', async (c) => {
  const url = new URL(c.req.url)

  // Rewrite /old-path to /new-path
  if (url.pathname === '/old-path') {
    url.pathname = '/new-path'
  }

  // Create new request with modified URL
  const modifiedRequest = new Request(url, c.req.raw)
  return c.env.ASSETS.fetch(modifiedRequest)
})
```

---

## Bindings and Type Safety

### Defining Bindings

```typescript
type Bindings = {
  ASSETS: Fetcher               // Static Assets (always present)
  MY_KV: KVNamespace            // KV namespace
  DB: D1Database                // D1 database
  MY_BUCKET: R2Bucket           // R2 bucket
  MY_VAR: string                // Environment variable
}

const app = new Hono<{ Bindings: Bindings }>()
```

### Accessing Bindings

```typescript
app.get('/api/data', async (c) => {
  // Type-safe access to bindings
  const value = await c.env.MY_KV.get('key')
  const result = await c.env.DB.prepare('SELECT * FROM users').all()
  const object = await c.env.MY_BUCKET.get('file.txt')
  const variable = c.env.MY_VAR

  return c.json({ value, result, object, variable })
})
```

### Auto-Generated Types

Run `wrangler types` to generate `worker-configuration.d.ts`:

```typescript
// Auto-generated by Wrangler
interface Env {
  ASSETS: Fetcher
  MY_KV: KVNamespace
  DB: D1Database
  MY_BUCKET: R2Bucket
  MY_VAR: string
}
```

Then use:

```typescript
const app = new Hono<{ Bindings: Env }>()
```

---

## Development vs Production

### Local Development (wrangler dev)

```bash
npm run dev
```

**What happens:**
- Miniflare simulates Cloudflare's runtime locally
- Bindings are emulated (KV, D1, R2)
- HMR enabled via Vite plugin
- Runs on http://localhost:8787

**Configuration**:
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    cloudflare({
      persist: true,  // Persist data between restarts
    }),
  ],
})
```

### Production Deployment (wrangler deploy)

```bash
npm run deploy
```

**What happens:**
- Vite builds your code
- Wrangler uploads to Cloudflare
- Static Assets uploaded separately
- Worker deployed to edge network

**Build Output**:
```
dist/
├── index.js        # Your Worker code (bundled)
└── ...             # Other build artifacts
```

### Environment-Specific Configuration

```jsonc
// wrangler.jsonc
{
  "name": "my-worker",
  "env": {
    "staging": {
      "name": "my-worker-staging",
      "vars": { "ENV": "staging" },
      "kv_namespaces": [
        { "binding": "MY_KV", "id": "staging-kv-id" }
      ]
    },
    "production": {
      "name": "my-worker-production",
      "vars": { "ENV": "production" },
      "kv_namespaces": [
        { "binding": "MY_KV", "id": "production-kv-id" }
      ]
    }
  }
}
```

Deploy to specific environment:
```bash
wrangler deploy --env staging
wrangler deploy --env production
```

### Environment Detection in Code

```typescript
app.get('/api/info', (c) => {
  const isDev = c.req.url.includes('localhost')
  const env = c.env.ENV || 'development'

  return c.json({ isDev, env })
})
```

---

## Performance Considerations

### Cold Starts

Cloudflare Workers have **extremely fast cold starts** (~5ms):
- Code is distributed globally
- No containers to spin up
- Minimal initialization overhead

Keep your bundle small:
- Avoid large dependencies
- Use tree-shaking (Vite does this automatically)
- Lazy-load heavy modules

### CPU Time Limits

- **Free Plan**: 10ms CPU time per request
- **Paid Plan**: 50ms CPU time per request

**Tip**: Use asynchronous operations (KV, D1, R2) to avoid blocking CPU time.

### Memory Limits

- **128 MB** per Worker instance

**Tip**: Avoid loading large files into memory. Stream data when possible.

### Request Size Limits

- **Request Body**: 100 MB
- **Response Body**: No limit (can stream)

---

## Best Practices

### 1. Use Middleware for Common Logic

```typescript
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'

app.use('*', logger())
app.use('/api/*', cors())
```

### 2. Separate API and Static Routes

```typescript
const api = new Hono()

api.get('/users', ...)
api.get('/posts', ...)

app.route('/api', api)
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))
```

### 3. Handle Errors Gracefully

```typescript
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})
```

### 4. Use TypeScript

```typescript
// Define types for request/response
type User = {
  id: number
  name: string
}

app.get('/api/users/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const user: User = { id, name: 'Alice' }
  return c.json(user)
})
```

### 5. Validate Input

```typescript
import { z } from 'zod'

const schema = z.object({
  name: z.string(),
  email: z.string().email(),
})

app.post('/api/users', async (c) => {
  const body = await c.req.json()
  const validated = schema.parse(body)
  return c.json({ success: true, data: validated })
})
```

---

## Troubleshooting

### Issue: API routes return HTML

**Cause**: Missing `run_worker_first` configuration

**Fix**: Add to `wrangler.jsonc`:
```jsonc
{
  "assets": {
    "run_worker_first": ["/api/*"]
  }
}
```

### Issue: HMR crashes with "A hanging Promise was canceled"

**Cause**: Race condition in older Vite plugin versions

**Fix**: Update to latest:
```bash
npm install -D @cloudflare/vite-plugin@1.13.13
```

### Issue: Deployment fails with "Cannot read properties of undefined"

**Cause**: Incorrect export pattern

**Fix**: Use `export default app` (not `{ fetch: app.fetch }`)

---

**For more troubleshooting**, see `common-issues.md`.
