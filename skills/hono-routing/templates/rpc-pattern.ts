/**
 * Hono RPC Pattern
 *
 * Type-safe client/server communication using Hono's RPC feature.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

// ============================================================================
// SERVER-SIDE: Define Routes with Type Export
// ============================================================================

const app = new Hono()

// Define schemas
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().min(18).optional(),
})

const updateUserSchema = createUserSchema.partial()

const userParamSchema = z.object({
  id: z.string().uuid(),
})

// ============================================================================
// METHOD 1: Export Individual Routes
// ============================================================================

// Define route and assign to variable (REQUIRED for RPC type inference)
const getUsers = app.get('/users', (c) => {
  return c.json({
    users: [
      { id: '1', name: 'Alice', email: 'alice@example.com' },
      { id: '2', name: 'Bob', email: 'bob@example.com' },
    ],
  })
})

const createUser = app.post('/users', zValidator('json', createUserSchema), (c) => {
  const data = c.req.valid('json')

  return c.json(
    {
      success: true,
      user: {
        id: crypto.randomUUID(),
        ...data,
      },
    },
    201
  )
})

const getUser = app.get('/users/:id', zValidator('param', userParamSchema), (c) => {
  const { id } = c.req.valid('param')

  return c.json({
    id,
    name: 'Alice',
    email: 'alice@example.com',
  })
})

const updateUser = app.patch(
  '/users/:id',
  zValidator('param', userParamSchema),
  zValidator('json', updateUserSchema),
  (c) => {
    const { id } = c.req.valid('param')
    const updates = c.req.valid('json')

    return c.json({
      success: true,
      user: {
        id,
        ...updates,
      },
    })
  }
)

const deleteUser = app.delete('/users/:id', zValidator('param', userParamSchema), (c) => {
  const { id } = c.req.valid('param')

  return c.json({ success: true, deletedId: id })
})

// Export combined type for RPC client
export type AppType = typeof getUsers | typeof createUser | typeof getUser | typeof updateUser | typeof deleteUser

// ============================================================================
// METHOD 2: Export Entire App (Simpler but slower for large apps)
// ============================================================================

const simpleApp = new Hono()

simpleApp.get('/hello', (c) => {
  return c.json({ message: 'Hello!' })
})

simpleApp.post('/echo', zValidator('json', z.object({ message: z.string() })), (c) => {
  const { message } = c.req.valid('json')
  return c.json({ echo: message })
})

export type SimpleAppType = typeof simpleApp

// ============================================================================
// METHOD 3: Group Routes by Domain
// ============================================================================

// Posts routes
const postsApp = new Hono()

const getPosts = postsApp.get('/', (c) => {
  return c.json({ posts: [] })
})

const createPost = postsApp.post(
  '/',
  zValidator(
    'json',
    z.object({
      title: z.string(),
      content: z.string(),
    })
  ),
  (c) => {
    const data = c.req.valid('json')
    return c.json({ success: true, post: { id: '1', ...data } }, 201)
  }
)

export type PostsType = typeof getPosts | typeof createPost

// Comments routes
const commentsApp = new Hono()

const getComments = commentsApp.get('/', (c) => {
  return c.json({ comments: [] })
})

export type CommentsType = typeof getComments

// Mount to main app
app.route('/posts', postsApp)
app.route('/comments', commentsApp)

// ============================================================================
// MIDDLEWARE WITH RPC
// ============================================================================

// Middleware that returns early (short-circuits)
const authMiddleware = async (c: any, next: any) => {
  const token = c.req.header('Authorization')

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  await next()
}

// Route with middleware
const protectedRoute = app.get('/protected', authMiddleware, (c) => {
  return c.json({ data: 'Protected data' })
})

// Export type includes middleware responses
export type ProtectedType = typeof protectedRoute

// ============================================================================
// QUERY PARAMETER HANDLING
// ============================================================================

const searchQuerySchema = z.object({
  q: z.string(),
  page: z.string().transform((val) => parseInt(val, 10)),
})

const searchRoute = app.get('/search', zValidator('query', searchQuerySchema), (c) => {
  const { q, page } = c.req.valid('query')

  return c.json({
    query: q,
    page,
    results: [],
  })
})

export type SearchType = typeof searchRoute

// ============================================================================
// EXPORT MAIN APP
// ============================================================================

export default app
