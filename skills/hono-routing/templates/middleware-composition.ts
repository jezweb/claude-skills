/**
 * Hono Middleware Composition
 *
 * Complete examples for middleware chaining, built-in middleware, and custom middleware.
 */

import { Hono } from 'hono'
import type { Next } from 'hono'
import type { Context } from 'hono'

// Built-in middleware
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import { compress } from 'hono/compress'
import { cache } from 'hono/cache'
import { etag } from 'hono/etag'
import { secureHeaders } from 'hono/secure-headers'
import { timing } from 'hono/timing'

const app = new Hono()

// ============================================================================
// BUILT-IN MIDDLEWARE
// ============================================================================

// Request logging (prints to console)
app.use('*', logger())

// CORS (for API routes)
app.use(
  '/api/*',
  cors({
    origin: ['https://example.com', 'https://app.example.com'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['X-Request-ID'],
    maxAge: 600,
    credentials: true,
  })
)

// Pretty JSON (development only - adds indentation)
if (process.env.NODE_ENV === 'development') {
  app.use('*', prettyJSON())
}

// Compression (gzip/deflate)
app.use('*', compress())

// Caching (HTTP cache headers)
app.use(
  '/static/*',
  cache({
    cacheName: 'my-app',
    cacheControl: 'max-age=3600',
  })
)

// ETag support
app.use('/api/*', etag())

// Security headers
app.use('*', secureHeaders())

// Server timing header
app.use('*', timing())

// ============================================================================
// CUSTOM MIDDLEWARE
// ============================================================================

// Request ID middleware
const requestIdMiddleware = async (c: Context, next: Next) => {
  const requestId = crypto.randomUUID()
  c.set('requestId', requestId)

  await next()

  // Add to response headers
  c.res.headers.set('X-Request-ID', requestId)
}

app.use('*', requestIdMiddleware)

// Performance timing middleware
const performanceMiddleware = async (c: Context, next: Next) => {
  const start = Date.now()

  await next()

  const elapsed = Date.now() - start
  c.res.headers.set('X-Response-Time', `${elapsed}ms`)

  console.log(`${c.req.method} ${c.req.path} - ${elapsed}ms`)
}

app.use('*', performanceMiddleware)

// Error logging middleware
const errorLoggerMiddleware = async (c: Context, next: Next) => {
  await next()

  // Check for errors after handler execution
  if (c.error) {
    console.error('Error occurred:', {
      error: c.error.message,
      stack: c.error.stack,
      path: c.req.path,
      method: c.req.method,
    })

    // Send to error tracking service (e.g., Sentry)
    // await sendToErrorTracker(c.error, c.req)
  }
}

app.use('*', errorLoggerMiddleware)

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

// Simple token authentication
const authMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Validate token (simplified example)
  if (token !== 'secret-token') {
    return c.json({ error: 'Invalid token' }, 401)
  }

  // Set user in context
  c.set('user', {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
  })

  await next()
}

// Apply to specific routes
app.use('/admin/*', authMiddleware)
app.use('/api/protected/*', authMiddleware)

// ============================================================================
// RATE LIMITING MIDDLEWARE
// ============================================================================

// Simple in-memory rate limiter (production: use Redis/KV)
const rateLimits = new Map<string, { count: number; resetAt: number }>()

const rateLimitMiddleware = (maxRequests: number, windowMs: number) => {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('CF-Connecting-IP') || 'unknown'
    const now = Date.now()

    const limit = rateLimits.get(ip)

    if (!limit || limit.resetAt < now) {
      // New window
      rateLimits.set(ip, {
        count: 1,
        resetAt: now + windowMs,
      })
    } else if (limit.count >= maxRequests) {
      // Rate limit exceeded
      return c.json(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil((limit.resetAt - now) / 1000),
        },
        429
      )
    } else {
      // Increment count
      limit.count++
    }

    await next()
  }
}

// Apply rate limiting (100 requests per minute)
app.use('/api/*', rateLimitMiddleware(100, 60000))

// ============================================================================
// MIDDLEWARE CHAINING
// ============================================================================

// Multiple middleware for specific route
app.get(
  '/protected/data',
  authMiddleware,
  rateLimitMiddleware(10, 60000),
  (c) => {
    const user = c.get('user')
    return c.json({ message: 'Protected data', user })
  }
)

// ============================================================================
// CONDITIONAL MIDDLEWARE
// ============================================================================

// Apply middleware based on condition
const conditionalMiddleware = async (c: Context, next: Next) => {
  const isDevelopment = process.env.NODE_ENV === 'development'

  if (isDevelopment) {
    console.log('[DEV]', c.req.method, c.req.path)
  }

  await next()
}

app.use('*', conditionalMiddleware)

// ============================================================================
// MIDDLEWARE FACTORY PATTERN
// ============================================================================

// Middleware factory for custom headers
const customHeadersMiddleware = (headers: Record<string, string>) => {
  return async (c: Context, next: Next) => {
    await next()

    for (const [key, value] of Object.entries(headers)) {
      c.res.headers.set(key, value)
    }
  }
}

// Apply custom headers
app.use(
  '/api/*',
  customHeadersMiddleware({
    'X-API-Version': '1.0.0',
    'X-Powered-By': 'Hono',
  })
)

// ============================================================================
// CONTEXT EXTENSION MIDDLEWARE
// ============================================================================

// Logger middleware (extends context)
const loggerMiddleware = async (c: Context, next: Next) => {
  const logger = {
    info: (message: string) => console.log(`[INFO] ${message}`),
    warn: (message: string) => console.warn(`[WARN] ${message}`),
    error: (message: string) => console.error(`[ERROR] ${message}`),
  }

  c.set('logger', logger)

  await next()
}

app.use('*', loggerMiddleware)

// Use logger in routes
app.get('/log-example', (c) => {
  const logger = c.get('logger')
  logger.info('This is an info message')

  return c.json({ message: 'Logged' })
})

// ============================================================================
// DATABASE CONNECTION MIDDLEWARE
// ============================================================================

// Database connection (simplified example)
const dbMiddleware = async (c: Context, next: Next) => {
  // Simulated database connection
  const db = {
    query: async (sql: string) => {
      console.log('Executing query:', sql)
      return []
    },
    close: async () => {
      console.log('Closing database connection')
    },
  }

  c.set('db', db)

  await next()

  // Cleanup
  await db.close()
}

app.use('/api/*', dbMiddleware)

// ============================================================================
// REQUEST VALIDATION MIDDLEWARE
// ============================================================================

// Content-Type validation
const jsonOnlyMiddleware = async (c: Context, next: Next) => {
  const contentType = c.req.header('Content-Type')

  if (c.req.method === 'POST' || c.req.method === 'PUT') {
    if (!contentType || !contentType.includes('application/json')) {
      return c.json(
        {
          error: 'Content-Type must be application/json',
        },
        415
      )
    }
  }

  await next()
}

app.use('/api/*', jsonOnlyMiddleware)

// ============================================================================
// MIDDLEWARE EXECUTION ORDER
// ============================================================================

// Middleware runs in order: top to bottom before handler, bottom to top after
app.use('*', async (c, next) => {
  console.log('1: Before handler')
  await next()
  console.log('6: After handler')
})

app.use('*', async (c, next) => {
  console.log('2: Before handler')
  await next()
  console.log('5: After handler')
})

app.use('*', async (c, next) => {
  console.log('3: Before handler')
  await next()
  console.log('4: After handler')
})

app.get('/middleware-order', (c) => {
  console.log('Handler')
  return c.json({ message: 'Check console for execution order' })
})

// Output: 1, 2, 3, Handler, 4, 5, 6

// ============================================================================
// EARLY RETURN FROM MIDDLEWARE
// ============================================================================

// Middleware can return early (short-circuit)
const maintenanceMiddleware = async (c: Context, next: Next) => {
  const isMaintenanceMode = false // Set to true to enable

  if (isMaintenanceMode) {
    // Don't call next() - return response directly
    return c.json(
      {
        error: 'Service is under maintenance',
        retryAfter: 3600,
      },
      503
    )
  }

  await next()
}

app.use('*', maintenanceMiddleware)

// ============================================================================
// TYPE-SAFE MIDDLEWARE
// ============================================================================

type Bindings = {
  DATABASE_URL: string
  API_KEY: string
}

type Variables = {
  user: { id: number; name: string; email: string }
  requestId: string
  logger: {
    info: (message: string) => void
    error: (message: string) => void
  }
  db: {
    query: (sql: string) => Promise<any[]>
    close: () => Promise<void>
  }
}

// Typed app
const typedApp = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Type-safe middleware
typedApp.use('*', async (c, next) => {
  const user = c.get('user') // Type-safe!
  const logger = c.get('logger') // Type-safe!

  await next()
})

// ============================================================================
// EXPORT
// ============================================================================

export default app
export { typedApp }
