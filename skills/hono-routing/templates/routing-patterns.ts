/**
 * Hono Routing Patterns
 *
 * Complete examples for route parameters, query params, wildcards, and route grouping.
 */

import { Hono } from 'hono'

const app = new Hono()

// ============================================================================
// BASIC ROUTES
// ============================================================================

// GET request
app.get('/posts', (c) => {
  return c.json({
    posts: [
      { id: 1, title: 'First Post' },
      { id: 2, title: 'Second Post' },
    ],
  })
})

// POST request
app.post('/posts', async (c) => {
  const body = await c.req.json()
  return c.json({ created: true, data: body }, 201)
})

// PUT request
app.put('/posts/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  return c.json({ updated: true, id, data: body })
})

// DELETE request
app.delete('/posts/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ deleted: true, id })
})

// Multiple methods on same route
app.on(['GET', 'POST'], '/multi', (c) => {
  return c.text(`Method: ${c.req.method}`)
})

// All HTTP methods
app.all('/catch-all', (c) => {
  return c.text(`Any method works: ${c.req.method}`)
})

// ============================================================================
// ROUTE PARAMETERS
// ============================================================================

// Single parameter
app.get('/users/:id', (c) => {
  const id = c.req.param('id')

  return c.json({
    userId: id,
    name: 'John Doe',
  })
})

// Multiple parameters
app.get('/posts/:postId/comments/:commentId', (c) => {
  const { postId, commentId } = c.req.param()

  return c.json({
    postId,
    commentId,
    comment: 'This is a comment',
  })
})

// Optional parameters (using wildcards)
app.get('/files/*', (c) => {
  const path = c.req.param('*')

  return c.json({
    filePath: path || 'root',
    message: 'File accessed',
  })
})

// Named wildcard (regex pattern)
app.get('/assets/:filepath{.+}', (c) => {
  const filepath = c.req.param('filepath')

  return c.json({
    asset: filepath,
    contentType: 'application/octet-stream',
  })
})

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

// Single query param
app.get('/search', (c) => {
  const q = c.req.query('q') // ?q=hello

  return c.json({
    query: q,
    results: [],
  })
})

// Multiple query params
app.get('/products', (c) => {
  const page = c.req.query('page') || '1' // ?page=2
  const limit = c.req.query('limit') || '10' // ?limit=20
  const sort = c.req.query('sort') || 'name' // ?sort=price

  return c.json({
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort,
    products: [],
  })
})

// All query params as object
app.get('/filter', (c) => {
  const query = c.req.query()

  return c.json({
    filters: query,
    results: [],
  })
})

// Array query params (e.g., ?tag=js&tag=ts)
app.get('/tags', (c) => {
  const tags = c.req.queries('tag') // returns string[]

  return c.json({
    tags: tags || [],
    count: tags?.length || 0,
  })
})

// ============================================================================
// WILDCARD ROUTES
// ============================================================================

// Catch-all route (must be last)
app.get('/api/*', (c) => {
  const path = c.req.param('*')

  return c.json({
    message: 'API catch-all',
    requestedPath: path,
  })
})

// Multiple wildcard levels
app.get('/cdn/:version/*', (c) => {
  const version = c.req.param('version')
  const path = c.req.param('*')

  return c.json({
    version,
    assetPath: path,
  })
})

// ============================================================================
// ROUTE GROUPING (SUB-APPS)
// ============================================================================

// Create API sub-app
const api = new Hono()

api.get('/users', (c) => {
  return c.json({ users: [] })
})

api.get('/posts', (c) => {
  return c.json({ posts: [] })
})

api.get('/comments', (c) => {
  return c.json({ comments: [] })
})

// Create admin sub-app
const admin = new Hono()

admin.get('/dashboard', (c) => {
  return c.json({ message: 'Admin Dashboard' })
})

admin.get('/users', (c) => {
  return c.json({ message: 'Admin Users' })
})

// Mount sub-apps
app.route('/api', api) // Routes: /api/users, /api/posts, /api/comments
app.route('/admin', admin) // Routes: /admin/dashboard, /admin/users

// ============================================================================
// ROUTE CHAINING
// ============================================================================

// Method chaining for same path
app
  .get('/items', (c) => c.json({ items: [] }))
  .post('/items', (c) => c.json({ created: true }))
  .put('/items/:id', (c) => c.json({ updated: true }))
  .delete('/items/:id', (c) => c.json({ deleted: true }))

// ============================================================================
// ROUTE PRIORITY
// ============================================================================

// Specific routes BEFORE wildcards
app.get('/special/exact', (c) => {
  return c.json({ message: 'Exact route' })
})

app.get('/special/*', (c) => {
  return c.json({ message: 'Wildcard route' })
})

// Request to /special/exact → "Exact route"
// Request to /special/anything → "Wildcard route"

// ============================================================================
// HEADER AND BODY ACCESS
// ============================================================================

// Accessing headers
app.get('/headers', (c) => {
  const userAgent = c.req.header('User-Agent')
  const authorization = c.req.header('Authorization')

  // All headers
  const allHeaders = c.req.raw.headers

  return c.json({
    userAgent,
    authorization,
    allHeaders: Object.fromEntries(allHeaders.entries()),
  })
})

// Accessing request body
app.post('/body', async (c) => {
  // JSON body
  const json = await c.req.json()

  // Text body
  // const text = await c.req.text()

  // Form data
  // const formData = await c.req.formData()

  // Array buffer
  // const buffer = await c.req.arrayBuffer()

  return c.json({ received: json })
})

// ============================================================================
// ROUTE METADATA
// ============================================================================

// Access current route information
app.get('/info', (c) => {
  return c.json({
    method: c.req.method, // GET
    url: c.req.url, // Full URL
    path: c.req.path, // Path only
    routePath: c.req.routePath, // Route pattern (e.g., /info)
  })
})

// ============================================================================
// EXPORT
// ============================================================================

export default app

// TypeScript types for environment
type Bindings = {
  // Add your environment variables here
}

type Variables = {
  // Add your context variables here
}

// Typed app
export const typedApp = new Hono<{ Bindings: Bindings; Variables: Variables }>()
