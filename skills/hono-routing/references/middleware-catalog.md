# Hono Built-in Middleware Catalog

Complete reference for all built-in Hono middleware with usage examples and configuration options.

**Last Updated**: 2025-10-22
**Hono Version**: 4.10.2+

---

## Installation

All built-in middleware are included in the `hono` package. No additional dependencies required.

```bash
npm install hono@4.10.2
```

---

## Request Logging

### logger()

Logs request method, path, status, and response time.

```typescript
import { logger } from 'hono/logger'

app.use('*', logger())
```

**Output**:
```
GET /api/users 200 - 15ms
POST /api/posts 201 - 42ms
```

**Custom logger**:
```typescript
import { logger } from 'hono/logger'

app.use(
  '*',
  logger((message, ...rest) => {
    console.log(`[Custom] ${message}`, ...rest)
  })
)
```

---

## CORS

### cors()

Enables Cross-Origin Resource Sharing.

```typescript
import { cors } from 'hono/cors'

// Simple usage
app.use('*', cors())

// Custom configuration
app.use(
  '/api/*',
  cors({
    origin: ['https://example.com', 'https://app.example.com'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['X-Request-ID', 'X-Response-Time'],
    maxAge: 600,
    credentials: true,
  })
)

// Dynamic origin
app.use(
  '*',
  cors({
    origin: (origin) => {
      return origin.endsWith('.example.com') ? origin : 'https://example.com'
    },
  })
)
```

**Options**:
- `origin`: String, array, or function
- `allowMethods`: HTTP methods array
- `allowHeaders`: Headers array
- `exposeHeaders`: Headers to expose
- `maxAge`: Preflight cache duration (seconds)
- `credentials`: Allow credentials

---

## Pretty JSON

### prettyJSON()

Formats JSON responses with indentation (development only).

```typescript
import { prettyJSON } from 'hono/pretty-json'

if (process.env.NODE_ENV === 'development') {
  app.use('*', prettyJSON())
}
```

**Options**:
```typescript
app.use(
  '*',
  prettyJSON({
    space: 2, // Indentation spaces (default: 2)
  })
)
```

---

## Compression

### compress()

Compresses responses using gzip or deflate.

```typescript
import { compress } from 'hono/compress'

app.use('*', compress())

// Custom options
app.use(
  '*',
  compress({
    encoding: 'gzip', // 'gzip' | 'deflate'
  })
)
```

**Behavior**:
- Automatically detects `Accept-Encoding` header
- Skips if `Content-Encoding` already set
- Skips if response is already compressed

---

## Caching

### cache()

Sets HTTP cache headers.

```typescript
import { cache } from 'hono/cache'

app.use(
  '/static/*',
  cache({
    cacheName: 'my-app',
    cacheControl: 'max-age=3600', // 1 hour
  })
)

// Conditional caching
app.use(
  '/api/public/*',
  cache({
    cacheName: 'api-cache',
    cacheControl: 'public, max-age=300', // 5 minutes
    wait: true, // Wait for cache to be ready
  })
)
```

**Options**:
- `cacheName`: Cache name
- `cacheControl`: Cache-Control header value
- `wait`: Wait for cache to be ready

---

## ETag

### etag()

Generates and validates ETags for responses.

```typescript
import { etag } from 'hono/etag'

app.use('/api/*', etag())

// Custom options
app.use(
  '/api/*',
  etag({
    weak: true, // Use weak ETags (W/"...")
  })
)
```

**Behavior**:
- Automatically generates ETag from response body
- Returns 304 Not Modified if ETag matches
- Works with `If-None-Match` header

---

## Security Headers

### secureHeaders()

Sets security-related HTTP headers.

```typescript
import { secureHeaders } from 'hono/secure-headers'

app.use('*', secureHeaders())

// Custom configuration
app.use(
  '*',
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
    strictTransportSecurity: 'max-age=31536000; includeSubDomains',
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'no-referrer',
  })
)
```

**Headers set**:
- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `X-XSS-Protection` (deprecated but included)

---

## Server Timing

### timing()

Adds Server-Timing header with performance metrics.

```typescript
import { timing } from 'hono/timing'

app.use('*', timing())

// Custom timing
import { setMetric, startTime, endTime } from 'hono/timing'

app.use('*', timing())

app.get('/api/data', async (c) => {
  startTime(c, 'db')
  // Database query
  endTime(c, 'db')

  startTime(c, 'external')
  // External API call
  endTime(c, 'external')

  setMetric(c, 'total', 150)

  return c.json({ data: [] })
})
```

**Output header**:
```
Server-Timing: db;dur=45, external;dur=85, total;dur=150
```

---

## Bearer Auth

### bearerAuth()

Simple bearer token authentication.

```typescript
import { bearerAuth } from 'hono/bearer-auth'

app.use(
  '/admin/*',
  bearerAuth({
    token: 'my-secret-token',
  })
)

// Multiple tokens
app.use(
  '/api/*',
  bearerAuth({
    token: ['token1', 'token2', 'token3'],
  })
)

// Custom error
app.use(
  '/api/*',
  bearerAuth({
    token: 'secret',
    realm: 'My API',
    onError: (c) => {
      return c.json({ error: 'Unauthorized' }, 401)
    },
  })
)
```

---

## Basic Auth

### basicAuth()

HTTP Basic authentication.

```typescript
import { basicAuth } from 'hono/basic-auth'

app.use(
  '/admin/*',
  basicAuth({
    username: 'admin',
    password: 'secret',
  })
)

// Custom validation
app.use(
  '/api/*',
  basicAuth({
    verifyUser: async (username, password, c) => {
      const user = await db.findUser(username)
      if (!user) return false

      return await bcrypt.compare(password, user.passwordHash)
    },
  })
)
```

---

## JWT

### jwt()

JSON Web Token authentication.

```typescript
import { jwt } from 'hono/jwt'

app.use(
  '/api/*',
  jwt({
    secret: 'my-secret-key',
  })
)

// Access JWT payload
app.get('/api/profile', (c) => {
  const payload = c.get('jwtPayload')
  return c.json({ user: payload })
})

// Custom algorithm
app.use(
  '/api/*',
  jwt({
    secret: 'secret',
    alg: 'HS256', // HS256 (default), HS384, HS512
  })
)
```

---

## Request ID

### requestId()

Generates unique request IDs.

```typescript
import { requestId } from 'hono/request-id'

app.use('*', requestId())

app.get('/', (c) => {
  const id = c.get('requestId')
  return c.json({ requestId: id })
})

// Custom generator
app.use(
  '*',
  requestId({
    generator: () => `req-${Date.now()}-${Math.random()}`,
  })
)
```

---

## Combine

### combine()

Combines multiple middleware into one.

```typescript
import { combine } from 'hono/combine'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { compress } from 'hono/compress'

app.use('*', combine(
  logger(),
  cors(),
  compress()
))
```

---

## Trailing Slash

### trimTrailingSlash()

Removes trailing slashes from URLs.

```typescript
import { trimTrailingSlash } from 'hono/trailing-slash'

app.use('*', trimTrailingSlash())

// /api/users/ → /api/users
```

---

## Serve Static

### serveStatic()

Serves static files (runtime-specific).

**Cloudflare Workers**:
```typescript
import { serveStatic } from 'hono/cloudflare-workers'

app.use('/static/*', serveStatic({ root: './public' }))
```

**Deno**:
```typescript
import { serveStatic } from 'hono/deno'

app.use('/static/*', serveStatic({ root: './public' }))
```

**Bun**:
```typescript
import { serveStatic } from 'hono/bun'

app.use('/static/*', serveStatic({ root: './public' }))
```

---

## Body Limit

### bodyLimit()

Limits request body size.

```typescript
import { bodyLimit } from 'hono/body-limit'

app.use(
  '/api/*',
  bodyLimit({
    maxSize: 1024 * 1024, // 1 MB
    onError: (c) => {
      return c.json({ error: 'Request body too large' }, 413)
    },
  })
)
```

---

## Timeout

### timeout()

Sets timeout for requests.

```typescript
import { timeout } from 'hono/timeout'

app.use(
  '/api/*',
  timeout(5000) // 5 seconds
)

// Custom error
app.use(
  '/api/*',
  timeout(
    3000,
    (c) => c.json({ error: 'Request timeout' }, 504)
  )
)
```

---

## IP Restriction

### ipRestriction()

Restricts access by IP address.

```typescript
import { ipRestriction } from 'hono/ip-restriction'

app.use(
  '/admin/*',
  ipRestriction(
    {
      allowList: ['192.168.1.0/24'],
      denyList: ['10.0.0.0/8'],
    },
    (c) => c.json({ error: 'Forbidden' }, 403)
  )
)
```

---

## Summary

| Middleware | Purpose | Common Use Case |
|------------|---------|-----------------|
| `logger()` | Request logging | Development, debugging |
| `cors()` | CORS handling | API routes |
| `prettyJSON()` | JSON formatting | Development |
| `compress()` | Response compression | All routes |
| `cache()` | HTTP caching | Static assets |
| `etag()` | ETag generation | API responses |
| `secureHeaders()` | Security headers | All routes |
| `timing()` | Performance metrics | Production monitoring |
| `bearerAuth()` | Bearer token auth | API authentication |
| `basicAuth()` | Basic auth | Admin panels |
| `jwt()` | JWT authentication | API authentication |
| `requestId()` | Request IDs | Logging, tracing |
| `combine()` | Combine middleware | Clean code |
| `trimTrailingSlash()` | URL normalization | All routes |
| `serveStatic()` | Static files | Assets |
| `bodyLimit()` | Body size limit | API routes |
| `timeout()` | Request timeout | Long-running operations |
| `ipRestriction()` | IP filtering | Admin panels |

---

**Official Documentation**: https://hono.dev/docs/guides/middleware
