/**
 * Basic API Routes
 *
 * Simple examples without database dependencies.
 * Use these patterns for your own API routes.
 */

import { Hono } from 'hono'

const api = new Hono()

// Echo endpoint - Returns what you send
api.post('/echo', async (c) => {
  const body = await c.req.json()
  return c.json({
    echo: body,
    timestamp: Date.now(),
  })
})

// Status endpoint - Returns server info
api.get('/status', (c) => {
  return c.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: Date.now(),
    environment: c.env.ENVIRONMENT || 'development',
  })
})

// Example POST with validation
api.post('/data', async (c) => {
  try {
    const body = await c.req.json()

    // Simple validation
    if (!body.name) {
      return c.json({ error: 'Name is required' }, 400)
    }

    // Process data
    return c.json({
      success: true,
      data: {
        id: crypto.randomUUID(),
        name: body.name,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
})

// Example query parameters
api.get('/search', (c) => {
  const query = c.req.query('q')
  const limit = parseInt(c.req.query('limit') || '10')

  return c.json({
    query,
    limit,
    results: [
      // Mock results
      { id: 1, title: `Result for: ${query}` },
      { id: 2, title: `Another result for: ${query}` },
    ].slice(0, limit),
  })
})

export default api
