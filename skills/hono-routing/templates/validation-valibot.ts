/**
 * Hono Validation with Valibot
 *
 * Complete examples for request validation using Valibot validator.
 * Valibot is lighter and faster than Zod, with modular imports.
 */

import { Hono } from 'hono'
import { vValidator } from '@hono/valibot-validator'
import * as v from 'valibot'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

// ============================================================================
// BASIC VALIDATION
// ============================================================================

// JSON body validation
const userSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  email: v.pipe(v.string(), v.email()),
  age: v.optional(v.pipe(v.number(), v.integer(), v.minValue(18))),
})

app.post('/users', vValidator('json', userSchema), (c) => {
  const data = c.req.valid('json') // Type-safe!

  return c.json({
    success: true,
    data,
  })
})

// ============================================================================
// QUERY PARAMETER VALIDATION
// ============================================================================

const searchSchema = v.object({
  q: v.pipe(v.string(), v.minLength(1)),
  page: v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1)),
  limit: v.optional(
    v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
    '10'
  ),
  sort: v.optional(v.picklist(['name', 'date', 'relevance'])),
})

app.get('/search', vValidator('query', searchSchema), (c) => {
  const { q, page, limit, sort } = c.req.valid('query')

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

// UUID parameter
const uuidParamSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
})

app.get('/users/:id', vValidator('param', uuidParamSchema), (c) => {
  const { id } = c.req.valid('param')

  return c.json({
    userId: id,
    name: 'John Doe',
  })
})

// Numeric ID parameter
const numericIdSchema = v.object({
  id: v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1)),
})

app.get('/posts/:id', vValidator('param', numericIdSchema), (c) => {
  const { id } = c.req.valid('param') // Type: number

  return c.json({
    postId: id,
    title: 'Post Title',
  })
})

// ============================================================================
// HEADER VALIDATION
// ============================================================================

const headerSchema = v.object({
  'authorization': v.pipe(v.string(), v.startsWith('Bearer ')),
  'content-type': v.literal('application/json'),
  'x-api-version': v.optional(v.picklist(['1.0', '2.0'])),
})

app.post('/auth', vValidator('header', headerSchema), (c) => {
  const headers = c.req.valid('header')

  return c.json({
    authenticated: true,
    apiVersion: headers['x-api-version'] || '1.0',
  })
})

// ============================================================================
// CUSTOM VALIDATION HOOKS
// ============================================================================

const customErrorSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  age: v.pipe(v.number(), v.integer(), v.minValue(18)),
})

app.post(
  '/register',
  vValidator('json', customErrorSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: 'Validation failed',
          issues: result.issues,
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

// ============================================================================
// COMPLEX SCHEMA VALIDATION
// ============================================================================

const addressSchema = v.object({
  street: v.string(),
  city: v.string(),
  zipCode: v.pipe(v.string(), v.regex(/^\d{5}$/)),
  country: v.pipe(v.string(), v.length(2)),
})

const profileSchema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
  address: addressSchema,
  tags: v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(5)),
})

app.post('/profile', vValidator('json', profileSchema), (c) => {
  const data = c.req.valid('json')

  return c.json({
    success: true,
    profile: data,
  })
})

// ============================================================================
// DISCRIMINATED UNION
// ============================================================================

const paymentSchema = v.variant('method', [
  v.object({
    method: v.literal('card'),
    cardNumber: v.pipe(v.string(), v.regex(/^\d{16}$/)),
    cvv: v.pipe(v.string(), v.regex(/^\d{3}$/)),
  }),
  v.object({
    method: v.literal('paypal'),
    email: v.pipe(v.string(), v.email()),
  }),
  v.object({
    method: v.literal('bank'),
    accountNumber: v.string(),
    routingNumber: v.string(),
  }),
])

app.post('/payment', vValidator('json', paymentSchema), (c) => {
  const payment = c.req.valid('json')

  if (payment.method === 'card') {
    console.log('Processing card payment:', payment.cardNumber)
  }

  return c.json({ success: true })
})

// ============================================================================
// TRANSFORMATIONS
// ============================================================================

const eventSchema = v.object({
  name: v.string(),
  startDate: v.pipe(v.string(), v.transform((val) => new Date(val))),
  endDate: v.pipe(v.string(), v.transform((val) => new Date(val))),
  capacity: v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1)),
})

app.post('/events', vValidator('json', eventSchema), (c) => {
  const event = c.req.valid('json')

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

const settingsSchema = v.object({
  theme: v.optional(v.picklist(['light', 'dark']), 'light'),
  notifications: v.optional(v.boolean()),
  language: v.optional(v.string(), 'en'),
  maxResults: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
})

app.post('/settings', vValidator('json', settingsSchema), (c) => {
  const settings = c.req.valid('json')

  return c.json({
    success: true,
    settings,
  })
})

// ============================================================================
// ARRAY VALIDATION
// ============================================================================

const batchCreateSchema = v.object({
  users: v.pipe(
    v.array(
      v.object({
        name: v.string(),
        email: v.pipe(v.string(), v.email()),
      })
    ),
    v.minLength(1),
    v.maxLength(100)
  ),
})

app.post('/batch-users', vValidator('json', batchCreateSchema), (c) => {
  const { users } = c.req.valid('json')

  return c.json({
    success: true,
    count: users.length,
    users,
  })
})

// ============================================================================
// PARTIAL SCHEMAS
// ============================================================================

const updateUserSchema = v.partial(userSchema)

app.patch('/users/:id', vValidator('json', updateUserSchema), (c) => {
  const updates = c.req.valid('json')

  return c.json({
    success: true,
    updated: updates,
  })
})

// ============================================================================
// UNION TYPES
// ============================================================================

const contentSchema = v.variant('type', [
  v.object({ type: v.literal('text'), content: v.string() }),
  v.object({ type: v.literal('image'), url: v.pipe(v.string(), v.url()) }),
  v.object({ type: v.literal('video'), videoId: v.string() }),
])

app.post('/content', vValidator('json', contentSchema), (c) => {
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

export {
  userSchema,
  searchSchema,
  uuidParamSchema,
  profileSchema,
  paymentSchema,
}
