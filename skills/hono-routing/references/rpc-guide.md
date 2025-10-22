# Hono RPC Pattern Deep Dive

Complete guide to type-safe client/server communication using Hono's RPC feature.

**Last Updated**: 2025-10-22

---

## What is Hono RPC?

Hono RPC allows you to create **fully type-safe client/server communication** without manually defining API types. The client automatically infers types directly from server routes.

**Key Benefits**:
- ✅ Full type inference (request + response)
- ✅ No manual type definitions
- ✅ Compile-time error checking
- ✅ Auto-complete in IDE
- ✅ Refactoring safety

---

## Basic Setup

### Server

```typescript
// server.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
})

// CRITICAL: Use const route = app.get(...) pattern
const route = app.post(
  '/users',
  zValidator('json', userSchema),
  (c) => {
    const data = c.req.valid('json')
    return c.json({ success: true, user: { id: '1', ...data } }, 201)
  }
)

// Export type for RPC client
export type AppType = typeof route

export default app
```

### Client

```typescript
// client.ts
import { hc } from 'hono/client'
import type { AppType } from './server'

const client = hc<AppType>('http://localhost:8787')

// Type-safe API call
const res = await client.users.$post({
  json: {
    name: 'Alice',
    email: 'alice@example.com',
  },
})

const data = await res.json()
// Type: { success: boolean, user: { id: string, name: string, email: string } }
```

---

## Export Patterns

### Pattern 1: Export Single Route

```typescript
const route = app.get('/users', handler)
export type AppType = typeof route
```

**When to use**: Single route, simple API

### Pattern 2: Export Multiple Routes

```typescript
const getUsers = app.get('/users', handler)
const createUser = app.post('/users', handler)
const getUser = app.get('/users/:id', handler)

export type AppType = typeof getUsers | typeof createUser | typeof getUser
```

**When to use**: Multiple routes, moderate complexity

### Pattern 3: Export Sub-apps

```typescript
const usersApp = new Hono()
usersApp.get('/', handler)
usersApp.post('/', handler)

export type UsersType = typeof usersApp
```

**When to use**: Organized route groups, large APIs

### Pattern 4: Export Entire App

```typescript
const app = new Hono()
// ... many routes ...

export type AppType = typeof app
```

**When to use**: Small apps only (performance issue with large apps)

---

## Performance Optimization

### Problem: Slow Type Inference

With many routes, exporting `typeof app` causes slow IDE performance due to complex type instantiation.

### Solution: Export Specific Route Groups

```typescript
// ❌ Slow: 100+ routes
export type AppType = typeof app

// ✅ Fast: Export by domain
const userRoutes = app.basePath('/users').get('/', ...).post('/', ...)
const postRoutes = app.basePath('/posts').get('/', ...).post('/', ...)

export type UserRoutes = typeof userRoutes
export type PostRoutes = typeof postRoutes

// Client uses specific routes
const userClient = hc<UserRoutes>('http://localhost:8787/users')
const postClient = hc<PostRoutes>('http://localhost:8787/posts')
```

---

## Client Usage Patterns

### Basic GET Request

```typescript
const res = await client.users.$get()
const data = await res.json()
```

### POST with JSON Body

```typescript
const res = await client.users.$post({
  json: {
    name: 'Alice',
    email: 'alice@example.com',
  },
})

const data = await res.json()
```

### Route Parameters

```typescript
const res = await client.users[':id'].$get({
  param: { id: '123' },
})

const data = await res.json()
```

### Query Parameters

```typescript
const res = await client.search.$get({
  query: {
    q: 'hello',
    page: '2',
  },
})

const data = await res.json()
```

### Custom Headers

```typescript
const res = await client.users.$get({}, {
  headers: {
    Authorization: 'Bearer token',
  },
})
```

### Fetch Options

```typescript
const res = await client.users.$get({}, {
  signal: AbortSignal.timeout(5000), // 5 second timeout
  cache: 'no-cache',
})
```

---

## Error Handling

### Basic Error Handling

```typescript
const res = await client.users.$post({
  json: { name: 'Alice', email: 'alice@example.com' },
})

if (!res.ok) {
  console.error('Request failed:', res.status)
  return
}

const data = await res.json()
```

### Typed Error Responses

```typescript
const res = await client.users.$post({
  json: { name: '', email: 'invalid' },
})

if (res.status === 400) {
  const error = await res.json() // Typed as error response
  console.error('Validation error:', error)
  return
}

if (res.status === 500) {
  const error = await res.json()
  console.error('Server error:', error)
  return
}

const data = await res.json() // Typed as success response
```

### Try-Catch

```typescript
try {
  const res = await client.users.$get()

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }

  const data = await res.json()
  console.log('Users:', data)
} catch (error) {
  console.error('Network error:', error)
}
```

---

## Authentication

### Bearer Token

```typescript
const client = hc<AppType>('http://localhost:8787', {
  headers: {
    Authorization: 'Bearer your-token-here',
  },
})

const res = await client.protected.$get()
```

### Dynamic Headers

```typescript
async function makeAuthenticatedRequest() {
  const token = await getAuthToken()

  const res = await client.protected.$get({}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return res.json()
}
```

---

## React Integration

### Basic Hook

```typescript
import { useState, useEffect } from 'react'
import { hc } from 'hono/client'
import type { AppType } from './server'

const client = hc<AppType>('http://localhost:8787')

function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      setError(null)

      try {
        const res = await client.users.$get()

        if (!res.ok) {
          throw new Error('Failed to fetch users')
        }

        const data = await res.json()
        setUsers(data.users)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  return { users, loading, error }
}
```

### With TanStack Query

```typescript
import { useQuery } from '@tanstack/react-query'
import { hc } from 'hono/client'
import type { AppType } from './server'

const client = hc<AppType>('http://localhost:8787')

function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await client.users.$get()

      if (!res.ok) {
        throw new Error('Failed to fetch users')
      }

      return res.json()
    },
  })
}

function UsersComponent() {
  const { data, isLoading, error } = useUsers()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {data?.users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

---

## Advanced Patterns

### Middleware Responses

Server:
```typescript
const authMiddleware = async (c, next) => {
  const token = c.req.header('Authorization')

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  await next()
}

const route = app.get('/protected', authMiddleware, (c) => {
  return c.json({ data: 'Protected data' })
})

export type ProtectedType = typeof route
```

Client:
```typescript
const res = await client.protected.$get()

// Response type includes both middleware (401) and handler (200) responses
if (res.status === 401) {
  const error = await res.json() // Type: { error: string }
  console.error('Unauthorized:', error)
  return
}

const data = await res.json() // Type: { data: string }
```

### Multiple Sub-apps

Server:
```typescript
const usersApp = new Hono()
usersApp.get('/', handler)
usersApp.post('/', handler)

const postsApp = new Hono()
postsApp.get('/', handler)
postsApp.post('/', handler)

const app = new Hono()
app.route('/users', usersApp)
app.route('/posts', postsApp)

export type UsersType = typeof usersApp
export type PostsType = typeof postsApp
```

Client:
```typescript
const userClient = hc<UsersType>('http://localhost:8787/users')
const postClient = hc<PostsType>('http://localhost:8787/posts')

const users = await userClient.index.$get()
const posts = await postClient.index.$get()
```

---

## TypeScript Tips

### Type Inference

```typescript
// Infer request type
type UserRequest = Parameters<typeof client.users.$post>[0]['json']
// Type: { name: string, email: string }

// Infer response type
type UserResponse = Awaited<ReturnType<typeof client.users.$post>>
type UserData = Awaited<ReturnType<UserResponse['json']>>
// Type: { success: boolean, user: { id: string, name: string, email: string } }
```

### Generic Client Functions

```typescript
async function fetchFromAPI<T extends typeof client[keyof typeof client]>(
  endpoint: T,
  options?: Parameters<T['$get']>[0]
) {
  const res = await endpoint.$get(options)

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }

  return res.json()
}

// Usage
const users = await fetchFromAPI(client.users)
```

---

## Performance Best Practices

1. **Export specific routes** for large APIs
2. **Use route groups** for better organization
3. **Batch requests** when possible
4. **Cache client instance** (don't recreate on every request)
5. **Use AbortController** for request cancellation

---

## Common Pitfalls

### ❌ Don't: Anonymous Routes

```typescript
app.get('/users', (c) => c.json({ users: [] }))
export type AppType = typeof app // Won't infer route properly
```

### ✅ Do: Named Routes

```typescript
const route = app.get('/users', (c) => c.json({ users: [] }))
export type AppType = typeof route
```

### ❌ Don't: Forget Type Import

```typescript
import { AppType } from './server' // Wrong: runtime import
```

### ✅ Do: Type-Only Import

```typescript
import type { AppType } from './server' // Correct: type-only import
```

---

## Official Documentation

- **Hono RPC Guide**: https://hono.dev/docs/guides/rpc
- **hc Client API**: https://hono.dev/docs/helpers/hc
