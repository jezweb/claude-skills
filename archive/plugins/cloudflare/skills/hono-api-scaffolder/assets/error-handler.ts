/**
 * Standard Error Handler
 *
 * Returns JSON errors for all routes.
 * API routes must return JSON, never HTML redirects.
 */
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

export const errorHandler = (err: Error, c: Context) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }

  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal server error' }, 500)
}
