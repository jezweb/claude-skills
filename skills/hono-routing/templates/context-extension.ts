/**
 * Hono Context Extension
 *
 * Type-safe context extension using c.set() and c.get() with custom Variables.
 */

import { Hono } from 'hono'
import type { Context, Next } from 'hono'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Define environment bindings (for Cloudflare Workers, etc.)
type Bindings = {
  DATABASE_URL: string
  API_KEY: string
  ENVIRONMENT: 'development' | 'staging' | 'production'
}

// Define context variables (c.set/c.get)
type Variables = {
  user: {
    id: string
    email: string
    name: string
    role: 'admin' | 'user'
  }
  requestId: string
  startTime: number
  logger: {
    info: (message: string, meta?: any) => void
    warn: (message: string, meta?: any) => void
    error: (message: string, meta?: any) => void
  }
  db: {
    query: <T>(sql: string, params?: any[]) => Promise<T[]>
    execute: (sql: string, params?: any[]) => Promise<void>
  }
  cache: {
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string, ttl?: number) => Promise<void>
    delete: (key: string) => Promise<void>
  }
}

// Create typed app
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ============================================================================
// REQUEST ID MIDDLEWARE
// ============================================================================

app.use('*', async (c, next) => {
  const requestId = crypto.randomUUID()
  c.set('requestId', requestId)

  await next()

  c.res.headers.set('X-Request-ID', requestId)
})

// ============================================================================
// PERFORMANCE TIMING MIDDLEWARE
// ============================================================================

app.use('*', async (c, next) => {
  const startTime = Date.now()
  c.set('startTime', startTime)

  await next()

  const elapsed = Date.now() - startTime
  c.res.headers.set('X-Response-Time', `${elapsed}ms`)

  const logger = c.get('logger')
  logger.info(`Request completed in ${elapsed}ms`, {
    path: c.req.path,
    method: c.req.method,
  })
})

// ============================================================================
// LOGGER MIDDLEWARE
// ============================================================================

app.use('*', async (c, next) => {
  const requestId = c.get('requestId')

  const logger = {
    info: (message: string, meta?: any) => {
      console.log(
        JSON.stringify({
          level: 'info',
          requestId,
          message,
          ...meta,
          timestamp: new Date().toISOString(),
        })
      )
    },
    warn: (message: string, meta?: any) => {
      console.warn(
        JSON.stringify({
          level: 'warn',
          requestId,
          message,
          ...meta,
          timestamp: new Date().toISOString(),
        })
      )
    },
    error: (message: string, meta?: any) => {
      console.error(
        JSON.stringify({
          level: 'error',
          requestId,
          message,
          ...meta,
          timestamp: new Date().toISOString(),
        })
      )
    },
  }

  c.set('logger', logger)

  await next()
})

// ============================================================================
// DATABASE MIDDLEWARE
// ============================================================================

app.use('/api/*', async (c, next) => {
  // Simulated database connection
  const db = {
    query: async <T>(sql: string, params?: any[]): Promise<T[]> => {
      const logger = c.get('logger')
      logger.info('Executing query', { sql, params })

      // Simulated query execution
      return [] as T[]
    },
    execute: async (sql: string, params?: any[]): Promise<void> => {
      const logger = c.get('logger')
      logger.info('Executing statement', { sql, params })

      // Simulated execution
    },
  }

  c.set('db', db)

  await next()
})

// ============================================================================
// CACHE MIDDLEWARE
// ============================================================================

app.use('/api/*', async (c, next) => {
  // Simulated cache (use Redis, KV, etc. in production)
  const cacheStore = new Map<string, { value: string; expiresAt: number }>()

  const cache = {
    get: async (key: string): Promise<string | null> => {
      const logger = c.get('logger')
      const entry = cacheStore.get(key)

      if (!entry) {
        logger.info('Cache miss', { key })
        return null
      }

      if (entry.expiresAt < Date.now()) {
        logger.info('Cache expired', { key })
        cacheStore.delete(key)
        return null
      }

      logger.info('Cache hit', { key })
      return entry.value
    },
    set: async (key: string, value: string, ttl: number = 60000): Promise<void> => {
      const logger = c.get('logger')
      logger.info('Cache set', { key, ttl })

      cacheStore.set(key, {
        value,
        expiresAt: Date.now() + ttl,
      })
    },
    delete: async (key: string): Promise<void> => {
      const logger = c.get('logger')
      logger.info('Cache delete', { key })

      cacheStore.delete(key)
    },
  }

  c.set('cache', cache)

  await next()
})

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

app.use('/api/*', async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const logger = c.get('logger')

  if (!token) {
    logger.warn('Missing authentication token')
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Simulated token validation
  if (token !== 'valid-token') {
    logger.warn('Invalid authentication token')
    return c.json({ error: 'Invalid token' }, 401)
  }

  // Simulated user lookup
  const user = {
    id: '123',
    email: 'user@example.com',
    name: 'John Doe',
    role: 'user' as const,
  }

  c.set('user', user)
  logger.info('User authenticated', { userId: user.id })

  await next()
})

// ============================================================================
// ROUTES USING CONTEXT
// ============================================================================

// Route using logger
app.get('/api/log-example', (c) => {
  const logger = c.get('logger')

  logger.info('This is an info message')
  logger.warn('This is a warning')
  logger.error('This is an error')

  return c.json({ message: 'Logged' })
})

// Route using user
app.get('/api/profile', (c) => {
  const user = c.get('user')

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  })
})

// Route using database
app.get('/api/users', async (c) => {
  const db = c.get('db')
  const logger = c.get('logger')

  try {
    const users = await db.query<{ id: string; name: string }>('SELECT * FROM users')

    return c.json({ users })
  } catch (error) {
    logger.error('Database query failed', { error })
    return c.json({ error: 'Database error' }, 500)
  }
})

// Route using cache
app.get('/api/cached-data', async (c) => {
  const cache = c.get('cache')
  const logger = c.get('logger')

  const cacheKey = 'expensive-data'

  // Try to get from cache
  const cached = await cache.get(cacheKey)

  if (cached) {
    return c.json({ data: JSON.parse(cached), cached: true })
  }

  // Simulate expensive computation
  const data = { result: 'expensive data', timestamp: Date.now() }

  // Store in cache
  await cache.set(cacheKey, JSON.stringify(data), 60000) // 1 minute

  return c.json({ data, cached: false })
})

// Route using request ID
app.get('/api/request-info', (c) => {
  const requestId = c.get('requestId')
  const startTime = c.get('startTime')
  const elapsed = Date.now() - startTime

  return c.json({
    requestId,
    elapsed: `${elapsed}ms`,
    method: c.req.method,
    path: c.req.path,
  })
})

// Route using environment bindings
app.get('/api/env', (c) => {
  const environment = c.env.ENVIRONMENT
  const apiKey = c.env.API_KEY // Don't expose this in real app!

  return c.json({
    environment,
    hasApiKey: !!apiKey,
  })
})

// ============================================================================
// COMBINING MULTIPLE CONTEXT VALUES
// ============================================================================

app.post('/api/create-user', async (c) => {
  const logger = c.get('logger')
  const db = c.get('db')
  const user = c.get('user')
  const requestId = c.get('requestId')

  // Check permissions
  if (user.role !== 'admin') {
    logger.warn('Unauthorized user creation attempt', {
      userId: user.id,
      requestId,
    })

    return c.json({ error: 'Forbidden' }, 403)
  }

  // Parse request body
  const body = await c.req.json()

  // Create user
  try {
    await db.execute('INSERT INTO users (name, email) VALUES (?, ?)', [body.name, body.email])

    logger.info('User created', {
      createdBy: user.id,
      newUserEmail: body.email,
      requestId,
    })

    return c.json({ success: true }, 201)
  } catch (error) {
    logger.error('User creation failed', {
      error,
      requestId,
    })

    return c.json({ error: 'Failed to create user' }, 500)
  }
})

// ============================================================================
// CUSTOM CONTEXT HELPERS
// ============================================================================

// Helper to get authenticated user (with type guard)
function getAuthenticatedUser(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
  const user = c.get('user')

  if (!user) {
    throw new Error('User not authenticated')
  }

  return user
}

// Helper to check admin role
function requireAdmin(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
  const user = getAuthenticatedUser(c)

  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }

  return user
}

// Usage
app.delete('/api/users/:id', (c) => {
  const admin = requireAdmin(c) // Throws if not admin
  const logger = c.get('logger')

  logger.info('User deletion requested', {
    adminId: admin.id,
    targetUserId: c.req.param('id'),
  })

  return c.json({ success: true })
})

// ============================================================================
// EXPORT
// ============================================================================

export default app

export type { Bindings, Variables }
export { getAuthenticatedUser, requireAdmin }
