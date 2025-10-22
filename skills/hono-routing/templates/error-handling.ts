/**
 * Hono Error Handling
 *
 * Complete examples for error handling using HTTPException, onError, and custom error handlers.
 */

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

// ============================================================================
// HTTPEXCEPTION - CLIENT ERRORS (400-499)
// ============================================================================

// 400 Bad Request
app.get('/bad-request', (c) => {
  throw new HTTPException(400, { message: 'Bad Request - Invalid parameters' })
})

// 401 Unauthorized
app.get('/unauthorized', (c) => {
  throw new HTTPException(401, { message: 'Unauthorized - Missing or invalid token' })
})

// 403 Forbidden
app.get('/forbidden', (c) => {
  throw new HTTPException(403, { message: 'Forbidden - Insufficient permissions' })
})

// 404 Not Found
app.get('/users/:id', async (c) => {
  const id = c.req.param('id')

  // Simulate database lookup
  const user = null // await db.findUser(id)

  if (!user) {
    throw new HTTPException(404, { message: `User with ID ${id} not found` })
  }

  return c.json({ user })
})

// Custom response body
app.get('/custom-error', (c) => {
  const res = new Response(
    JSON.stringify({
      error: 'CUSTOM_ERROR',
      code: 'ERR001',
      details: 'Custom error details',
    }),
    {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  throw new HTTPException(400, { res })
})

// ============================================================================
// AUTHENTICATION ERRORS
// ============================================================================

app.get('/protected', (c) => {
  const token = c.req.header('Authorization')

  if (!token) {
    throw new HTTPException(401, {
      message: 'Missing Authorization header',
    })
  }

  if (!token.startsWith('Bearer ')) {
    throw new HTTPException(401, {
      message: 'Invalid Authorization header format',
    })
  }

  const actualToken = token.replace('Bearer ', '')

  if (actualToken !== 'valid-token') {
    throw new HTTPException(401, {
      message: 'Invalid or expired token',
    })
  }

  return c.json({ message: 'Access granted', data: 'Protected data' })
})

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().min(18),
})

// Validation errors automatically return 400
app.post('/users', zValidator('json', userSchema), (c) => {
  const data = c.req.valid('json')
  return c.json({ success: true, data })
})

// Custom validation error handler
app.post(
  '/users/custom',
  zValidator('json', userSchema, (result, c) => {
    if (!result.success) {
      throw new HTTPException(400, {
        message: 'Validation failed',
        cause: result.error,
      })
    }
  }),
  (c) => {
    const data = c.req.valid('json')
    return c.json({ success: true, data })
  }
)

// ============================================================================
// GLOBAL ERROR HANDLER (onError)
// ============================================================================

app.onError((err, c) => {
  console.error(`Error on ${c.req.method} ${c.req.path}:`, err)

  // Handle HTTPException
  if (err instanceof HTTPException) {
    // Get custom response if provided
    if (err.res) {
      return err.res
    }

    // Return default HTTPException response
    return c.json(
      {
        error: err.message,
        status: err.status,
      },
      err.status
    )
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return c.json(
      {
        error: 'Validation failed',
        issues: err.issues,
      },
      400
    )
  }

  // Handle unexpected errors (500)
  return c.json(
    {
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    },
    500
  )
})

// ============================================================================
// NOT FOUND HANDLER
// ============================================================================

app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
    404
  )
})

// ============================================================================
// MIDDLEWARE ERROR CHECKING
// ============================================================================

app.use('*', async (c, next) => {
  await next()

  // Check for errors after handler execution
  if (c.error) {
    console.error('Error detected in middleware:', {
      error: c.error.message,
      path: c.req.path,
      method: c.req.method,
    })

    // Send to error tracking service
    // await sendToSentry(c.error, { path: c.req.path, method: c.req.method })
  }
})

// ============================================================================
// TRY-CATCH ERROR HANDLING
// ============================================================================

app.get('/external-api', async (c) => {
  try {
    // Simulated external API call
    const response = await fetch('https://api.example.com/data')

    if (!response.ok) {
      throw new HTTPException(response.status, {
        message: `External API returned ${response.status}`,
      })
    }

    const data = await response.json()
    return c.json({ data })
  } catch (error) {
    // Network errors or parsing errors
    if (error instanceof HTTPException) {
      throw error // Re-throw HTTPException
    }

    // Log unexpected error
    console.error('External API error:', error)

    // Return generic error to client
    throw new HTTPException(503, {
      message: 'External service unavailable',
    })
  }
})

// ============================================================================
// CONDITIONAL ERROR RESPONSES
// ============================================================================

app.get('/data/:id', async (c) => {
  const id = c.req.param('id')

  // Validate ID format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new HTTPException(400, {
      message: 'Invalid UUID format',
    })
  }

  // Check access permissions
  const hasAccess = true // await checkUserAccess(id)

  if (!hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to access this resource',
    })
  }

  // Fetch data
  const data = null // await db.getData(id)

  if (!data) {
    throw new HTTPException(404, {
      message: 'Resource not found',
    })
  }

  return c.json({ data })
})

// ============================================================================
// TYPED ERROR RESPONSES
// ============================================================================

type ErrorResponse = {
  error: string
  code: string
  details?: string
}

function createErrorResponse(code: string, message: string, details?: string): ErrorResponse {
  return {
    error: message,
    code,
    details,
  }
}

app.get('/typed-error', (c) => {
  const errorBody = createErrorResponse('USER_NOT_FOUND', 'User not found', 'The requested user does not exist')

  throw new HTTPException(404, {
    res: c.json(errorBody, 404),
  })
})

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

class ValidationError extends HTTPException {
  constructor(message: string, cause?: any) {
    super(400, { message, cause })
    this.name = 'ValidationError'
  }
}

class AuthenticationError extends HTTPException {
  constructor(message: string) {
    super(401, { message })
    this.name = 'AuthenticationError'
  }
}

class AuthorizationError extends HTTPException {
  constructor(message: string) {
    super(403, { message })
    this.name = 'AuthorizationError'
  }
}

class NotFoundError extends HTTPException {
  constructor(resource: string) {
    super(404, { message: `${resource} not found` })
    this.name = 'NotFoundError'
  }
}

// Usage
app.get('/custom-errors/:id', async (c) => {
  const id = c.req.param('id')

  if (!id) {
    throw new ValidationError('ID is required')
  }

  const user = null // await db.findUser(id)

  if (!user) {
    throw new NotFoundError('User')
  }

  return c.json({ user })
})

// Handle custom error classes in onError
app.onError((err, c) => {
  if (err instanceof ValidationError) {
    return c.json({ error: err.message, type: 'validation' }, err.status)
  }

  if (err instanceof AuthenticationError) {
    return c.json({ error: err.message, type: 'authentication' }, err.status)
  }

  if (err instanceof NotFoundError) {
    return c.json({ error: err.message, type: 'not_found' }, err.status)
  }

  if (err instanceof HTTPException) {
    return err.getResponse()
  }

  return c.json({ error: 'Internal Server Error' }, 500)
})

// ============================================================================
// ERROR LOGGING WITH CONTEXT
// ============================================================================

app.use('*', async (c, next) => {
  const requestId = crypto.randomUUID()
  c.set('requestId', requestId)

  try {
    await next()
  } catch (error) {
    // Log with context
    console.error('Request failed', {
      requestId,
      method: c.req.method,
      path: c.req.path,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Re-throw to be handled by onError
    throw error
  }
})

// ============================================================================
// EXPORT
// ============================================================================

export default app

export {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  createErrorResponse,
}
