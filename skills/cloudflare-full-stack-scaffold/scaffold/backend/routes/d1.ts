/**
 * D1 Database Routes
 *
 * CRUD operations on the users table.
 * See schema.sql for table definitions.
 */

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const d1 = new Hono<{ Bindings: Bindings }>()

// Get all users
d1.get('/users', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM users ORDER BY created_at DESC LIMIT 100'
  ).all()

  return c.json({ users: results })
})

// Get user by ID
d1.get('/users/:id', async (c) => {
  const id = c.req.param('id')

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  )
    .bind(id)
    .first()

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({ user })
})

// Create user
d1.post('/users', async (c) => {
  const body = await c.req.json()

  if (!body.email) {
    return c.json({ error: 'Email is required' }, 400)
  }

  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)

  try {
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(id, body.email, body.name || null, now, now)
      .run()

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first()

    return c.json({ user }, 201)
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint')) {
      return c.json({ error: 'Email already exists' }, 409)
    }
    throw error
  }
})

// Update user
d1.put('/users/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const now = Math.floor(Date.now() / 1000)

  const result = await c.env.DB.prepare(
    'UPDATE users SET name = ?, updated_at = ? WHERE id = ?'
  )
    .bind(body.name, now, id)
    .run()

  if (result.meta.changes === 0) {
    return c.json({ error: 'User not found' }, 404)
  }

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first()

  return c.json({ user })
})

// Delete user
d1.delete('/users/:id', async (c) => {
  const id = c.req.param('id')

  const result = await c.env.DB.prepare('DELETE FROM users WHERE id = ?')
    .bind(id)
    .run()

  if (result.meta.changes === 0) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({ success: true })
})

export default d1
