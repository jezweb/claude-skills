# Hono Patterns

Advanced patterns for Hono on Cloudflare Workers. Load this when building complex APIs or troubleshooting route issues.

## Route Priority

Hono matches routes in registration order. Place specific routes before generic ones:

```typescript
// Correct order
app.get('/api/users/me', getMeHandler)       // specific first
app.get('/api/users/:id', getUserHandler)    // param route second
app.get('/api/users', listUsersHandler)      // list last
```

## Middleware Chains

Middleware runs in order of `app.use()` registration:

```typescript
app.use('*', logger())                        // all routes
app.use('/api/*', cors())                     // all API routes
app.use('/api/admin/*', requireAuth)          // admin routes only
```

### Per-Route Middleware

```typescript
app.get('/api/secret', requireAuth, async (c) => {
  // runs after auth middleware
})
```

### Typed Context with Variables

```typescript
// Set in middleware
export const authMiddleware = createMiddleware<{
  Bindings: Env
  Variables: { userId: string; role: string }
}>(async (c, next) => {
  c.set('userId', decoded.sub)
  c.set('role', decoded.role)
  await next()
})

// Read in handler
app.get('/api/me', authMiddleware, (c) => {
  const userId = c.get('userId')  // typed string
})
```

## Request Handling

### Path Parameters

```typescript
app.get('/api/posts/:id', (c) => {
  const id = c.req.param('id')  // string
})

// Multiple params
app.get('/api/orgs/:orgId/users/:userId', (c) => {
  const { orgId, userId } = c.req.param()
})
```

### Query Parameters

```typescript
app.get('/api/users', (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const search = c.req.query('search')
})
```

### Headers

```typescript
const token = c.req.header('Authorization')?.replace('Bearer ', '')
const contentType = c.req.header('Content-Type')
```

## Response Patterns

### JSON (most common)

```typescript
return c.json({ users }, 200)
return c.json({ error: 'Not found' }, 404)
return c.json({ user }, 201)  // created
```

### Empty responses

```typescript
return c.body(null, 204)  // no content (DELETE success)
return new Response(null, { status: 204 })
```

### Redirects

```typescript
return c.redirect('/login', 302)
```

### Streaming

```typescript
return c.stream(async (stream) => {
  await stream.write('chunk 1')
  await stream.write('chunk 2')
})
```

## Error Handling

### Global error handler

```typescript
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})
```

### HTTPException

```typescript
import { HTTPException } from 'hono/http-exception'

throw new HTTPException(403, { message: 'Forbidden' })
```

### Not Found handler

```typescript
app.notFound((c) => c.json({ error: 'Not found' }, 404))
```

## Zod Validation Patterns

### Body validation

```typescript
const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']).optional(),
})

app.post('/', zValidator('json', schema), async (c) => {
  const body = c.req.valid('json')
})
```

### Query validation

```typescript
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
})

app.get('/', zValidator('query', querySchema), async (c) => {
  const { page, limit, search } = c.req.valid('query')
})
```

### Custom error response

```typescript
app.post('/',
  zValidator('json', schema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', details: result.error.flatten() }, 400)
    }
  }),
  handler,
)
```

## RPC (Remote Procedure Call)

End-to-end type safety between Worker and client without code generation:

```typescript
// Worker: chain routes for type inference
const routes = app
  .get('/api/users', async (c) => c.json({ users: [] }))
  .post('/api/users', zValidator('json', schema), async (c) => c.json({ user: {} }, 201))

export type AppType = typeof routes

// Client:
import { hc } from 'hono/client'
import type { AppType } from './worker'

const client = hc<AppType>('https://api.example.com')
const res = await client.api.users.$get()
const data = await res.json()  // typed: { users: User[] }
```

**Key**: The route chain must be assigned to a variable for type inference to work. Don't use `app.route()` for RPC — mount routes directly on the app.
