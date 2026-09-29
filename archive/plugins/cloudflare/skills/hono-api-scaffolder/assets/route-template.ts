/**
 * Route Template — [Resource Name]
 *
 * Copy this file to src/routes/[resource].ts and customise.
 * Includes: list, get, create, update, delete with Zod validation.
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../types'

const app = new Hono<{ Bindings: Env }>()

const createSchema = z.object({
  name: z.string().min(1).max(100),
  // Add fields here
})

const updateSchema = createSchema.partial()

// GET /api/[resource]
app.get('/', async (c) => {
  const db = c.env.DB
  const { results } = await db.prepare('SELECT * FROM [table] ORDER BY created_at DESC').all()
  return c.json({ items: results })
})

// GET /api/[resource]/:id
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const item = await c.env.DB.prepare('SELECT * FROM [table] WHERE id = ?').bind(id).first()
  if (!item) return c.json({ error: 'Not found' }, 404)
  return c.json({ item })
})

// POST /api/[resource]
app.post('/', zValidator('json', createSchema), async (c) => {
  const body = c.req.valid('json')
  const id = crypto.randomUUID()
  await c.env.DB.prepare('INSERT INTO [table] (id, name) VALUES (?, ?)').bind(id, body.name).run()
  return c.json({ item: { id, ...body } }, 201)
})

// PUT /api/[resource]/:id
app.put('/:id', zValidator('json', updateSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.req.valid('json')
  // ... update logic
  return c.json({ item: { id, ...body } })
})

// DELETE /api/[resource]/:id
app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM [table] WHERE id = ?').bind(id).run()
  return c.body(null, 204)
})

export default app
