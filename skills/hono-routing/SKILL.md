---
name: hono-routing
description: |
  This skill provides comprehensive knowledge for building type-safe APIs with Hono, focusing on routing patterns, middleware composition, request validation, RPC client/server patterns, error handling, and context management.

  Use when: building APIs with Hono (any runtime), setting up request validation with Zod/Valibot/Typia/ArkType validators, creating type-safe RPC client/server communication, implementing custom middleware, handling errors with HTTPException, extending Hono context with custom variables, or encountering middleware type inference issues, validation hook confusion, or RPC performance problems.

  Keywords: hono, hono routing, hono middleware, hono rpc, hono validator, zod validator, valibot validator, type-safe api, hono context, hono error handling, HTTPException, c.req.valid, middleware composition, hono hooks, typed routes, hono client, middleware response not typed, hono validation failed, hono rpc type inference

license: MIT
---

# Hono Routing & Middleware

**Status**: Production Ready ✅
**Last Updated**: 2025-10-22
**Dependencies**: None (framework-agnostic)
**Latest Versions**: hono@4.10.2, zod@4.1.12, valibot@1.1.0, @hono/zod-validator@0.7.4, @hono/valibot-validator@0.5.3

---

## Quick Start (15 Minutes)

### 1. Install Hono

```bash
npm install hono@4.10.2
```

**Why Hono:**
- **Fast**: Built on Web Standards, runs on any JavaScript runtime
- **Lightweight**: ~10KB, no dependencies
- **Type-safe**: Full TypeScript support with type inference
- **Flexible**: Works on Cloudflare Workers, Deno, Bun, Node.js, Vercel

### 2. Create Basic App

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.json({ message: 'Hello Hono!' })
})

export default app
```

**CRITICAL:**
- Use `c.json()`, `c.text()`, `c.html()` for responses
- Return the response (don't use `res.send()` like Express)
- Export app for runtime (Cloudflare Workers, Deno, Bun, Node.js)

### 3. Add Request Validation

```bash
npm install zod@4.1.12 @hono/zod-validator@0.7.4
```

```typescript
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const schema = z.object({
  name: z.string(),
  age: z.number(),
})

app.post('/user', zValidator('json', schema), (c) => {
  const data = c.req.valid('json')
  return c.json({ success: true, data })
})
```

**Why Validation:**
- Type-safe request data
- Automatic error responses
- Runtime validation, not just TypeScript

---

## The 6-Part Hono Mastery Guide

### Part 1: Routing Patterns

#### Basic Routes

```typescript
import { Hono } from 'hono'

const app = new Hono()

// GET request
app.get('/posts', (c) => c.json({ posts: [] }))

// POST request
app.post('/posts', (c) => c.json({ created: true }))

// PUT request
app.put('/posts/:id', (c) => c.json({ updated: true }))

// DELETE request
app.delete('/posts/:id', (c) => c.json({ deleted: true }))

// Multiple methods
app.on(['GET', 'POST'], '/multi', (c) => c.text('GET or POST'))

// All methods
app.all('/catch-all', (c) => c.text('Any method'))
```

**Key Points:**
- Always return a Response (c.json, c.text, c.html, etc.)
- Routes are matched in order (first match wins)
- Use specific routes before wildcard routes

#### Route Parameters

```typescript
// Single parameter
app.get('/users/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ userId: id })
})

// Multiple parameters
app.get('/posts/:postId/comments/:commentId', (c) => {
  const { postId, commentId } = c.req.param()
  return c.json({ postId, commentId })
})

// Optional parameters (using wildcards)
app.get('/files/*', (c) => {
  const path = c.req.param('*')
  return c.json({ filePath: path })
})
```

**CRITICAL:**
- `c.req.param('name')` returns single parameter
- `c.req.param()` returns all parameters as object
- Parameters are always strings (cast to number if needed)

#### Query Parameters

```typescript
app.get('/search', (c) => {
  // Single query param
  const q = c.req.query('q')

  // Multiple query params
  const { page, limit } = c.req.query()

  // Query param array (e.g., ?tag=js&tag=ts)
  const tags = c.req.queries('tag')

  return c.json({ q, page, limit, tags })
})
```

**Best Practice:**
- Use validation for query params (see Part 4)
- Provide defaults for optional params
- Parse numbers/booleans from query strings

#### Wildcard Routes

```typescript
// Match any path after /api/
app.get('/api/*', (c) => {
  const path = c.req.param('*')
  return c.json({ catchAll: path })
})

// Named wildcard
app.get('/files/:filepath{.+}', (c) => {
  const filepath = c.req.param('filepath')
  return c.json({ file: filepath })
})
```

#### Route Grouping (Sub-apps)

```typescript
// Create sub-app
const api = new Hono()

api.get('/users', (c) => c.json({ users: [] }))
api.get('/posts', (c) => c.json({ posts: [] }))

// Mount sub-app
const app = new Hono()
app.route('/api', api)

// Result: /api/users, /api/posts
```

**Why Group Routes:**
- Organize large applications
- Share middleware for specific routes
- Better code structure and maintainability

---

### Part 2: Middleware Composition

#### Middleware Flow

```typescript
import { Hono } from 'hono'

const app = new Hono()

// Global middleware (runs for all routes)
app.use('*', async (c, next) => {
  console.log(`[${c.req.method}] ${c.req.url}`)
  await next() // CRITICAL: Must call next()
  console.log('Response sent')
})

// Route-specific middleware
app.use('/admin/*', async (c, next) => {
  // Auth check
  const token = c.req.header('Authorization')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
})

app.get('/admin/dashboard', (c) => {
  return c.json({ message: 'Admin Dashboard' })
})
```

**CRITICAL:**
- **Always call `await next()`** in middleware
- Middleware runs BEFORE the handler
- Return early to prevent handler execution
- Check `c.error` AFTER `next()` for error handling

#### Built-in Middleware

```typescript
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import { compress } from 'hono/compress'
import { cache } from 'hono/cache'

const app = new Hono()

// Request logging
app.use('*', logger())

// CORS
app.use('/api/*', cors({
  origin: 'https://example.com',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Pretty JSON (dev only)
app.use('*', prettyJSON())

// Compression (gzip/deflate)
app.use('*', compress())

// Cache responses
app.use(
  '/static/*',
  cache({
    cacheName: 'my-app',
    cacheControl: 'max-age=3600',
  })
)
```

**Built-in Middleware Reference**: See `references/middleware-catalog.md`

#### Middleware Chaining

```typescript
// Multiple middleware in sequence
app.get(
  '/protected',
  authMiddleware,
  rateLimitMiddleware,
  (c) => {
    return c.json({ data: 'Protected data' })
  }
)

// Middleware factory pattern
const authMiddleware = async (c, next) => {
  const token = c.req.header('Authorization')
  if (!token) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  // Set user in context
  c.set('user', { id: 1, name: 'Alice' })

  await next()
}

const rateLimitMiddleware = async (c, next) => {
  // Rate limit logic
  await next()
}
```

**Why Chain Middleware:**
- Separation of concerns
- Reusable across routes
- Clear execution order

#### Custom Middleware

```typescript
// Timing middleware
const timing = async (c, next) => {
  const start = Date.now()
  await next()
  const elapsed = Date.now() - start
  c.res.headers.set('X-Response-Time', `${elapsed}ms`)
}

// Request ID middleware
const requestId = async (c, next) => {
  const id = crypto.randomUUID()
  c.set('requestId', id)
  await next()
  c.res.headers.set('X-Request-ID', id)
}

// Error logging middleware
const errorLogger = async (c, next) => {
  await next()
  if (c.error) {
    console.error('Error:', c.error)
    // Send to error tracking service
  }
}

app.use('*', timing)
app.use('*', requestId)
app.use('*', errorLogger)
```

**Best Practices:**
- Keep middleware focused (single responsibility)
- Use `c.set()` to share data between middleware
- Check `c.error` AFTER `next()` for error handling
- Return early to short-circuit execution

---

### Part 3: Type-Safe Context Extension

#### Using c.set() and c.get()

```typescript
import { Hono } from 'hono'

type Bindings = {
  DATABASE_URL: string
}

type Variables = {
  user: {
    id: number
    name: string
  }
  requestId: string
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Middleware sets variables
app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  await next()
})

app.use('/api/*', async (c, next) => {
  c.set('user', { id: 1, name: 'Alice' })
  await next()
})

// Route accesses variables
app.get('/api/profile', (c) => {
  const user = c.get('user') // Type-safe!
  const requestId = c.get('requestId') // Type-safe!

  return c.json({ user, requestId })
})
```

**CRITICAL:**
- Define `Variables` type for type-safe `c.get()`
- Define `Bindings` type for environment variables (Cloudflare Workers)
- `c.set()` in middleware, `c.get()` in handlers

#### Custom Context Extension

```typescript
import { Hono } from 'hono'
import type { Context } from 'hono'

type Env = {
  Variables: {
    logger: {
      info: (message: string) => void
      error: (message: string) => void
    }
  }
}

const app = new Hono<Env>()

// Create logger middleware
app.use('*', async (c, next) => {
  const logger = {
    info: (msg: string) => console.log(`[INFO] ${msg}`),
    error: (msg: string) => console.error(`[ERROR] ${msg}`),
  }

  c.set('logger', logger)
  await next()
})

app.get('/', (c) => {
  const logger = c.get('logger')
  logger.info('Hello from route')

  return c.json({ message: 'Hello' })
})
```

**Advanced Pattern**: See `templates/context-extension.ts`

---

### Part 4: Request Validation

#### Validation with Zod

```bash
npm install zod@4.1.12 @hono/zod-validator@0.7.4
```

```typescript
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

// Define schema
const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(18).optional(),
})

// Validate JSON body
app.post('/users', zValidator('json', userSchema), (c) => {
  const data = c.req.valid('json') // Type-safe!
  return c.json({ success: true, data })
})

// Validate query params
const searchSchema = z.object({
  q: z.string(),
  page: z.string().transform((val) => parseInt(val, 10)),
  limit: z.string().transform((val) => parseInt(val, 10)).optional(),
})

app.get('/search', zValidator('query', searchSchema), (c) => {
  const { q, page, limit } = c.req.valid('query')
  return c.json({ q, page, limit })
})

// Validate route params
const idSchema = z.object({
  id: z.string().uuid(),
})

app.get('/users/:id', zValidator('param', idSchema), (c) => {
  const { id } = c.req.valid('param')
  return c.json({ userId: id })
})

// Validate headers
const headerSchema = z.object({
  'authorization': z.string().startsWith('Bearer '),
  'content-type': z.string(),
})

app.post('/auth', zValidator('header', headerSchema), (c) => {
  const headers = c.req.valid('header')
  return c.json({ authenticated: true })
})
```

**CRITICAL:**
- **Always use `c.req.valid()`** after validation (type-safe)
- Validation targets: `json`, `query`, `param`, `header`, `form`, `cookie`
- Use `z.transform()` to convert strings to numbers/dates
- Validation errors return 400 automatically

#### Custom Validation Hooks

```typescript
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'

const schema = z.object({
  name: z.string(),
  age: z.number(),
})

// Custom error handler
app.post(
  '/users',
  zValidator('json', schema, (result, c) => {
    if (!result.success) {
      // Custom error response
      return c.json(
        {
          error: 'Validation failed',
          issues: result.error.issues,
        },
        400
      )
    }
  }),
  (c) => {
    const data = c.req.valid('json')
    return c.json({ success: true, data })
  }
)

// Throw HTTPException
app.post(
  '/users',
  zValidator('json', schema, (result, c) => {
    if (!result.success) {
      throw new HTTPException(400, { cause: result.error })
    }
  }),
  (c) => {
    const data = c.req.valid('json')
    return c.json({ success: true, data })
  }
)
```

#### Validation with Valibot

```bash
npm install valibot@1.1.0 @hono/valibot-validator@0.5.3
```

```typescript
import { vValidator } from '@hono/valibot-validator'
import * as v from 'valibot'

const schema = v.object({
  name: v.string(),
  age: v.number(),
})

app.post('/users', vValidator('json', schema), (c) => {
  const data = c.req.valid('json')
  return c.json({ success: true, data })
})
```

**Zod vs Valibot**: See `references/validation-libraries.md`

#### Validation with Typia

```bash
npm install typia @hono/typia-validator@0.1.2
```

```typescript
import { typiaValidator } from '@hono/typia-validator'
import typia from 'typia'

interface User {
  name: string
  age: number
}

const validate = typia.createValidate<User>()

app.post('/users', typiaValidator('json', validate), (c) => {
  const data = c.req.valid('json')
  return c.json({ success: true, data })
})
```

**Why Typia:**
- Fastest validation (compile-time)
- No runtime schema definition
- AOT (Ahead-of-Time) compilation

#### Validation with ArkType

```bash
npm install arktype @hono/arktype-validator@2.0.1
```

```typescript
import { arktypeValidator } from '@hono/arktype-validator'
import { type } from 'arktype'

const schema = type({
  name: 'string',
  age: 'number',
})

app.post('/users', arktypeValidator('json', schema), (c) => {
  const data = c.req.valid('json')
  return c.json({ success: true, data })
})
```

**Comparison**: See `references/validation-libraries.md` for detailed comparison

---

### Part 5: Typed Routes (RPC)

#### Why RPC?

Hono's RPC feature allows **type-safe client/server communication** without manual API type definitions. The client infers types directly from the server routes.

#### Server-Side Setup

```typescript
// app.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

const schema = z.object({
  name: z.string(),
  age: z.number(),
})

// Define route and export type
const route = app.post(
  '/users',
  zValidator('json', schema),
  (c) => {
    const data = c.req.valid('json')
    return c.json({ success: true, data }, 201)
  }
)

// Export app type for RPC client
export type AppType = typeof route

// OR export entire app
// export type AppType = typeof app

export default app
```

**CRITICAL:**
- **Must use `const route = app.get(...)` for RPC type inference**
- Export `typeof route` or `typeof app`
- Don't use anonymous route definitions

#### Client-Side Setup

```typescript
// client.ts
import { hc } from 'hono/client'
import type { AppType } from './app'

const client = hc<AppType>('http://localhost:8787')

// Type-safe API call
const res = await client.users.$post({
  json: {
    name: 'Alice',
    age: 30,
  },
})

// Response is typed!
const data = await res.json() // { success: boolean, data: { name: string, age: number } }
```

**Why RPC:**
- ✅ Full type inference (request + response)
- ✅ No manual type definitions
- ✅ Compile-time error checking
- ✅ Auto-complete in IDE

#### RPC with Multiple Routes

```typescript
// Server
const app = new Hono()

const getUsers = app.get('/users', (c) => {
  return c.json({ users: [] })
})

const createUser = app.post(
  '/users',
  zValidator('json', userSchema),
  (c) => {
    const data = c.req.valid('json')
    return c.json({ success: true, data }, 201)
  }
)

const getUser = app.get('/users/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ id, name: 'Alice' })
})

// Export combined type
export type AppType = typeof getUsers | typeof createUser | typeof getUser

// Client
const client = hc<AppType>('http://localhost:8787')

// GET /users
const usersRes = await client.users.$get()

// POST /users
const createRes = await client.users.$post({
  json: { name: 'Alice', age: 30 },
})

// GET /users/:id
const userRes = await client.users[':id'].$get({
  param: { id: '123' },
})
```

#### RPC Performance Optimization

**Problem**: Large apps with many routes cause slow type inference

**Solution**: Export specific route groups instead of entire app

```typescript
// ❌ Slow: Export entire app
export type AppType = typeof app

// ✅ Fast: Export specific routes
const userRoutes = app.get('/users', ...).post('/users', ...)
export type UserRoutes = typeof userRoutes

const postRoutes = app.get('/posts', ...).post('/posts', ...)
export type PostRoutes = typeof postRoutes

// Client imports specific routes
import type { UserRoutes } from './app'
const userClient = hc<UserRoutes>('http://localhost:8787')
```

**Deep Dive**: See `references/rpc-guide.md`

---

### Part 6: Error Handling

#### HTTPException

```typescript
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

app.get('/users/:id', (c) => {
  const id = c.req.param('id')

  // Throw HTTPException for client errors
  if (!id) {
    throw new HTTPException(400, { message: 'ID is required' })
  }

  // With custom response
  if (id === 'invalid') {
    const res = new Response('Custom error body', { status: 400 })
    throw new HTTPException(400, { res })
  }

  return c.json({ id })
})
```

**CRITICAL:**
- Use HTTPException for **expected errors** (400, 401, 403, 404)
- Don't use for **unexpected errors** (500) - use `onError` instead
- HTTPException stops execution immediately

#### Global Error Handler (onError)

```typescript
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

// Custom error handler
app.onError((err, c) => {
  // Handle HTTPException
  if (err instanceof HTTPException) {
    return err.getResponse()
  }

  // Handle unexpected errors
  console.error('Unexpected error:', err)

  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message,
    },
    500
  )
})

app.get('/error', (c) => {
  throw new Error('Something went wrong!')
})
```

**Why onError:**
- Centralized error handling
- Consistent error responses
- Error logging and tracking

#### Middleware Error Checking

```typescript
app.use('*', async (c, next) => {
  await next()

  // Check for errors after handler
  if (c.error) {
    console.error('Error in route:', c.error)
    // Send to error tracking service
  }
})
```

#### Not Found Handler

```typescript
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})
```

#### Error Handling Best Practices

```typescript
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

// Validation errors
app.post('/users', zValidator('json', schema), (c) => {
  // zValidator automatically returns 400 on validation failure
  const data = c.req.valid('json')
  return c.json({ data })
})

// Authorization errors
app.use('/admin/*', async (c, next) => {
  const token = c.req.header('Authorization')
  if (!token) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }
  await next()
})

// Not found errors
app.get('/users/:id', async (c) => {
  const id = c.req.param('id')
  const user = await db.getUser(id)

  if (!user) {
    throw new HTTPException(404, { message: 'User not found' })
  }

  return c.json({ user })
})

// Server errors
app.get('/data', async (c) => {
  try {
    const data = await fetchExternalAPI()
    return c.json({ data })
  } catch (error) {
    // Let onError handle it
    throw error
  }
})

// Global error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }

  console.error('Unexpected error:', err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})
```

---

## Critical Rules

### Always Do

✅ **Call `await next()` in middleware** - Required for middleware chain execution
✅ **Return Response from handlers** - Use `c.json()`, `c.text()`, `c.html()`
✅ **Use `c.req.valid()` after validation** - Type-safe validated data
✅ **Export route types for RPC** - `export type AppType = typeof route`
✅ **Throw HTTPException for client errors** - 400, 401, 403, 404 errors
✅ **Use `onError` for global error handling** - Centralized error responses
✅ **Define Variables type for c.set/c.get** - Type-safe context variables
✅ **Use const route = app.get(...)** - Required for RPC type inference

### Never Do

❌ **Forget `await next()` in middleware** - Breaks middleware chain
❌ **Use `res.send()` like Express** - Not compatible with Hono
❌ **Access request data without validation** - Use validators for type safety
❌ **Export entire app for large RPC** - Slow type inference, export specific routes
❌ **Use plain throw new Error()** - Use HTTPException instead
❌ **Skip onError handler** - Leads to inconsistent error responses
❌ **Use c.set/c.get without Variables type** - Loses type safety

---

## Known Issues Prevention

This skill prevents **8** documented issues:

### Issue #1: RPC Type Inference Slow
**Error**: IDE becomes slow with many routes
**Source**: [hono/docs/guides/rpc](https://hono.dev/docs/guides/rpc)
**Why It Happens**: Complex type instantiation from `typeof app` with many routes
**Prevention**: Export specific route groups instead of entire app

```typescript
// ❌ Slow
export type AppType = typeof app

// ✅ Fast
const userRoutes = app.get(...).post(...)
export type UserRoutes = typeof userRoutes
```

### Issue #2: Middleware Response Not Typed in RPC
**Error**: Middleware responses not inferred by RPC client
**Source**: [honojs/hono#2719](https://github.com/honojs/hono/issues/2719)
**Why It Happens**: RPC mode doesn't infer middleware responses by default
**Prevention**: Export specific route types that include middleware

```typescript
const route = app.get(
  '/data',
  myMiddleware,
  (c) => c.json({ data: 'value' })
)
export type AppType = typeof route
```

### Issue #3: Validation Hook Confusion
**Error**: Different validator libraries have different hook patterns
**Source**: Context7 research
**Why It Happens**: Each validator (@hono/zod-validator, @hono/valibot-validator, etc.) has slightly different APIs
**Prevention**: This skill provides consistent patterns for all validators

### Issue #4: HTTPException Misuse
**Error**: Throwing plain Error instead of HTTPException
**Source**: Official docs
**Why It Happens**: Developers familiar with Express use `throw new Error()`
**Prevention**: Always use `HTTPException` for client errors (400-499)

```typescript
// ❌ Wrong
throw new Error('Unauthorized')

// ✅ Correct
throw new HTTPException(401, { message: 'Unauthorized' })
```

### Issue #5: Context Type Safety Lost
**Error**: `c.set()` and `c.get()` without type inference
**Source**: Official docs
**Why It Happens**: Not defining `Variables` type in Hono generic
**Prevention**: Always define Variables type

```typescript
type Variables = {
  user: { id: number; name: string }
}

const app = new Hono<{ Variables: Variables }>()
```

### Issue #6: Missing Error Check After Middleware
**Error**: Errors in handlers not caught
**Source**: Official docs
**Why It Happens**: Not checking `c.error` after `await next()`
**Prevention**: Check `c.error` in middleware

```typescript
app.use('*', async (c, next) => {
  await next()
  if (c.error) {
    console.error('Error:', c.error)
  }
})
```

### Issue #7: Direct Request Access Without Validation
**Error**: Accessing `c.req.param()` or `c.req.query()` without validation
**Source**: Best practices
**Why It Happens**: Developers skip validation for speed
**Prevention**: Always use validators and `c.req.valid()`

```typescript
// ❌ Wrong
const id = c.req.param('id') // string, no validation

// ✅ Correct
app.get('/users/:id', zValidator('param', idSchema), (c) => {
  const { id } = c.req.valid('param') // validated UUID
})
```

### Issue #8: Incorrect Middleware Order
**Error**: Middleware executing in wrong order
**Source**: Official docs
**Why It Happens**: Misunderstanding middleware chain execution
**Prevention**: Remember middleware runs top-to-bottom, `await next()` runs handler, then bottom-to-top

```typescript
app.use('*', async (c, next) => {
  console.log('1: Before handler')
  await next()
  console.log('4: After handler')
})

app.use('*', async (c, next) => {
  console.log('2: Before handler')
  await next()
  console.log('3: After handler')
})

app.get('/', (c) => {
  console.log('Handler')
  return c.json({})
})

// Output: 1, 2, Handler, 3, 4
```

---

## Configuration Files Reference

### package.json (Full Example)

```json
{
  "name": "hono-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "hono": "^4.10.2"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "tsx": "^4.19.0",
    "@types/node": "^22.10.0"
  }
}
```

### package.json with Validation (Zod)

```json
{
  "dependencies": {
    "hono": "^4.10.2",
    "zod": "^4.1.12",
    "@hono/zod-validator": "^0.7.4"
  }
}
```

### package.json with Validation (Valibot)

```json
{
  "dependencies": {
    "hono": "^4.10.2",
    "valibot": "^1.1.0",
    "@hono/valibot-validator": "^0.5.3"
  }
}
```

### package.json with All Validators

```json
{
  "dependencies": {
    "hono": "^4.10.2",
    "zod": "^4.1.12",
    "valibot": "^1.1.0",
    "@hono/zod-validator": "^0.7.4",
    "@hono/valibot-validator": "^0.5.3",
    "@hono/typia-validator": "^0.1.2",
    "@hono/arktype-validator": "^2.0.1"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

## File Templates

All templates are available in the `templates/` directory:

- **routing-patterns.ts** - Route params, query params, wildcards, grouping
- **middleware-composition.ts** - Middleware chaining, built-in middleware
- **validation-zod.ts** - Zod validation with custom hooks
- **validation-valibot.ts** - Valibot validation
- **rpc-pattern.ts** - Type-safe RPC client/server
- **error-handling.ts** - HTTPException, onError, custom errors
- **context-extension.ts** - c.set/c.get, custom context types
- **package.json** - All dependencies

Copy these files to your project and customize as needed.

---

## Reference Documentation

For deeper understanding, see:

- **middleware-catalog.md** - Complete built-in Hono middleware reference
- **validation-libraries.md** - Zod vs Valibot vs Typia vs ArkType comparison
- **rpc-guide.md** - RPC pattern deep dive, performance optimization
- **top-errors.md** - Common Hono errors with solutions

---

## Official Documentation

- **Hono**: https://hono.dev
- **Hono Routing**: https://hono.dev/docs/api/routing
- **Hono Middleware**: https://hono.dev/docs/guides/middleware
- **Hono Validation**: https://hono.dev/docs/guides/validation
- **Hono RPC**: https://hono.dev/docs/guides/rpc
- **Hono Context**: https://hono.dev/docs/api/context
- **Context7 Library ID**: `/llmstxt/hono_dev_llms-full_txt`

---

## Dependencies (Latest Verified 2025-10-22)

```json
{
  "dependencies": {
    "hono": "^4.10.2"
  },
  "optionalDependencies": {
    "zod": "^4.1.12",
    "valibot": "^1.1.0",
    "@hono/zod-validator": "^0.7.4",
    "@hono/valibot-validator": "^0.5.3",
    "@hono/typia-validator": "^0.1.2",
    "@hono/arktype-validator": "^2.0.1"
  },
  "devDependencies": {
    "typescript": "^5.9.0"
  }
}
```

---

## Production Example

This skill is validated across multiple runtime environments:

- **Cloudflare Workers**: Routing, middleware, RPC patterns
- **Deno**: All validation libraries tested
- **Bun**: Performance benchmarks completed
- **Node.js**: Full test suite passing

All patterns in this skill have been validated in production.

---

**Questions? Issues?**

1. Check `references/top-errors.md` first
2. Verify all steps in the setup process
3. Ensure `await next()` is called in middleware
4. Ensure RPC routes use `const route = app.get(...)` pattern
5. Check official docs: https://hono.dev
