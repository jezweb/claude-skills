/**
 * Auth Middleware Template
 *
 * Validates Bearer token and sets userId/role in context.
 * Customise the token validation logic for your auth system.
 */
import { createMiddleware } from 'hono/factory'
import type { Env } from '../types'

type AuthVariables = {
  userId: string
  role: string
}

export const requireAuth = createMiddleware<{
  Bindings: Env
  Variables: AuthVariables
}>(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // TODO: Validate token (JWT, session lookup, API key check, etc.)
  // const decoded = await verifyToken(token, c.env.JWT_SECRET)
  // c.set('userId', decoded.sub)
  // c.set('role', decoded.role)

  await next()
})
