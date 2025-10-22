/**
 * Hono Validation with Zod
 *
 * Complete examples for request validation using Zod validator.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

// ============================================================================
// BASIC VALIDATION
// ============================================================================

// JSON body validation
const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(18).optional(),
})

app.post('/users', zValidator('json', userSchema), (c) => {
  const data = c.req.valid('json') // Type-safe! { name: string, email: string, age?: number }

  return c.json({
    success: true,
    data,
  })
})

// ============================================================================
// QUERY PARAMETER VALIDATION
// ============================================================================

// Search query validation
const searchSchema = z.object({
  q: z.string().min(1),
  page: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1)),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default('10'),
  sort: z.enum(['name', 'date', 'relevance']).optional(),
})

app.get('/search', zValidator('query', searchSchema), (c) => {
  const { q, page, limit, sort } = c.req.valid('query')
  // All types inferred correctly!

  return c.json({
    query: q,
    page,
    limit,
    sort,
    results: [],
  })
})

// ============================================================================
// ROUTE PARAMETER VALIDATION
// ============================================================================

// UUID parameter validation
const uuidParamSchema = z.object({
  id: z.string().uuid(),
})

app.get('/users/:id', zValidator('param', uuidParamSchema), (c) => {
  const { id } = c.req.valid('param') // Type: string (validated UUID)

  return c.json({
    userId: id,
    name: 'John Doe',
  })
})

// Numeric ID parameter
const numericIdSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()),
})

app.get('/posts/:id', zValidator('param', numericIdSchema), (c) => {
  const { id } = c.req.valid('param') // Type: number

  return c.json({
    postId: id,
    title: 'Post Title',
  })
})

// ============================================================================
// HEADER VALIDATION
// ============================================================================

const headerSchema = z.object({
  'authorization': z.string().startsWith('Bearer '),
  'content-type': z.literal('application/json'),
  'x-api-version': z.enum(['1.0', '2.0']).optional(),
})

app.post('/auth', zValidator('header', headerSchema), (c) => {
  const headers = c.req.valid('header')

  return c.json({
    authenticated: true,
    apiVersion: headers['x-api-version'] || '1.0',
  })
})

// ============================================================================
// FORM DATA VALIDATION
// ============================================================================

const formSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  remember: z.enum(['on', 'off']).optional(),
})

app.post('/login', zValidator('form', formSchema), (c) => {
  const { username, password, remember } = c.req.valid('form')

  return c.json({
    loggedIn: true,
    username,
    rememberMe: remember === 'on',
  })
})

// ============================================================================
// CUSTOM VALIDATION HOOKS
// ============================================================================

// Custom error response
const customErrorSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(18),
})

app.post(
  '/register',
  zValidator('json', customErrorSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: 'Validation failed',
          issues: result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
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

// Throw HTTPException on validation failure
app.post(
  '/submit',
  zValidator('json', userSchema, (result, c) => {
    if (!result.success) {
      throw new HTTPException(400, {
        message: 'Validation error',
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
// COMPLEX SCHEMA VALIDATION
// ============================================================================

// Nested objects
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zipCode: z.string().regex(/^\d{5}$/),
  country: z.string().length(2),
})

const profileSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  address: addressSchema,
  tags: z.array(z.string()).min(1).max(5),
})

app.post('/profile', zValidator('json', profileSchema), (c) => {
  const data = c.req.valid('json')
  // Fully typed nested structure!

  return c.json({
    success: true,
    profile: data,
  })
})

// ============================================================================
// CONDITIONAL VALIDATION
// ============================================================================

// Discriminated union
const paymentSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('card'),
    cardNumber: z.string().regex(/^\d{16}$/),
    cvv: z.string().regex(/^\d{3}$/),
  }),
  z.object({
    method: z.literal('paypal'),
    email: z.string().email(),
  }),
  z.object({
    method: z.literal('bank'),
    accountNumber: z.string(),
    routingNumber: z.string(),
  }),
])

app.post('/payment', zValidator('json', paymentSchema), (c) => {
  const payment = c.req.valid('json')

  // TypeScript knows the shape based on payment.method
  if (payment.method === 'card') {
    console.log('Processing card payment:', payment.cardNumber)
  }

  return c.json({ success: true })
})

// ============================================================================
// REFINEMENTS AND CUSTOM VALIDATION
// ============================================================================

// Custom validation logic
const passwordSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

app.post('/change-password', zValidator('json', passwordSchema), (c) => {
  const data = c.req.valid('json')

  return c.json({
    success: true,
    message: 'Password changed',
  })
})

// ============================================================================
// TRANSFORMATION AND COERCION
// ============================================================================

// Transform strings to dates
const eventSchema = z.object({
  name: z.string(),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  capacity: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()),
})

app.post('/events', zValidator('json', eventSchema), (c) => {
  const event = c.req.valid('json')
  // event.startDate is Date, not string!

  return c.json({
    success: true,
    event: {
      ...event,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
    },
  })
})

// ============================================================================
// OPTIONAL AND DEFAULT VALUES
// ============================================================================

const settingsSchema = z.object({
  theme: z.enum(['light', 'dark']).default('light'),
  notifications: z.boolean().optional(),
  language: z.string().default('en'),
  maxResults: z.number().int().min(1).max(100).default(10),
})

app.post('/settings', zValidator('json', settingsSchema), (c) => {
  const settings = c.req.valid('json')
  // Default values applied if not provided

  return c.json({
    success: true,
    settings,
  })
})

// ============================================================================
// ARRAY VALIDATION
// ============================================================================

const batchCreateSchema = z.object({
  users: z.array(
    z.object({
      name: z.string(),
      email: z.string().email(),
    })
  ).min(1).max(100),
})

app.post('/batch-users', zValidator('json', batchCreateSchema), (c) => {
  const { users } = c.req.valid('json')

  return c.json({
    success: true,
    count: users.length,
    users,
  })
})

// ============================================================================
// MULTIPLE VALIDATORS
// ============================================================================

// Validate multiple targets
const headerAuthSchema = z.object({
  authorization: z.string().startsWith('Bearer '),
})

const bodyDataSchema = z.object({
  data: z.string(),
})

app.post(
  '/protected',
  zValidator('header', headerAuthSchema),
  zValidator('json', bodyDataSchema),
  (c) => {
    const headers = c.req.valid('header')
    const body = c.req.valid('json')

    return c.json({
      authenticated: true,
      data: body.data,
    })
  }
)

// ============================================================================
// PARTIAL AND PICK SCHEMAS
// ============================================================================

// Update endpoint - make all fields optional
const updateUserSchema = userSchema.partial()

app.patch('/users/:id', zValidator('json', updateUserSchema), (c) => {
  const updates = c.req.valid('json')
  // All fields are optional

  return c.json({
    success: true,
    updated: updates,
  })
})

// Pick specific fields
const loginSchema = userSchema.pick({ email: true })

app.post('/login', zValidator('json', loginSchema), (c) => {
  const { email } = c.req.valid('json')

  return c.json({
    success: true,
    email,
  })
})

// ============================================================================
// UNION AND INTERSECTION
// ============================================================================

// Union types (either/or)
const contentSchema = z.union([
  z.object({ type: z.literal('text'), content: z.string() }),
  z.object({ type: z.literal('image'), url: z.string().url() }),
  z.object({ type: z.literal('video'), videoId: z.string() }),
])

app.post('/content', zValidator('json', contentSchema), (c) => {
  const content = c.req.valid('json')

  return c.json({
    success: true,
    contentType: content.type,
  })
})

// ============================================================================
// EXPORT
// ============================================================================

export default app

// Export schemas for reuse
export {
  userSchema,
  searchSchema,
  uuidParamSchema,
  profileSchema,
  paymentSchema,
}
