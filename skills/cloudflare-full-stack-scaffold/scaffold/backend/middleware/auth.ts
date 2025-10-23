/**
 * Auth Middleware for Cloudflare Workers + Hono
 *
 * This file contains Clerk authentication patterns (COMMENTED out by default).
 * Enable auth by running: ./scripts/enable-auth.sh
 *
 * @package hono version 4.10.2+
 * @package @clerk/backend version 2.19.0+ (when auth enabled)
 */

import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

/* CLERK AUTH START
import { jwt } from 'hono/jwt'
import type { JwtVariables } from 'hono/jwt'

type Variables = JwtVariables & {
  userId: string
  sessionClaims: any
}

/**
 * Simple JWT Middleware using Hono's built-in jwt()
 *
 * This is the SIMPLEST approach. Use Clerk's signing secret directly.
 *
 * Usage:
 *   app.use('/api/protected/*', jwtAuthMiddleware(env.CLERK_SECRET_KEY))
 *   app.get('/api/protected/data', (c) => {
 *     const payload = c.get('jwtPayload')
 *     const userId = payload.sub // User ID from Clerk
 *     return c.json({ userId })
 *   })
 */
export function jwtAuthMiddleware(secret: string) {
  return jwt({
    secret,
    cookie: 'clerk-session',
  })
}

/**
 * Advanced Auth Middleware with @clerk/backend
 *
 * Provides session verification and user metadata access.
 *
 * Usage:
 *   import { createClerkClient } from '@clerk/backend'
 *   const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY })
 *   app.use('/api/protected/*', clerkAuthMiddleware(clerkClient))
 */
export function clerkAuthMiddleware(clerkClient: any) {
  return createMiddleware(async (c, next) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      throw new HTTPException(401, {
        message: 'Missing or invalid Authorization header',
      })
    }

    const token = authHeader.replace('Bearer ', '')

    try {
      const session = await clerkClient.sessions.verifySession(token)
      c.set('userId', session.userId)
      c.set('sessionClaims', session)
      await next()
    } catch (error) {
      console.error('Auth verification failed:', error)
      throw new HTTPException(401, { message: 'Invalid or expired token' })
    }
  })
}

/**
 * Optional Auth Middleware
 *
 * Allows both authenticated and unauthenticated requests.
 * If authenticated: c.get('userId') will be set
 * If not authenticated: c.get('userId') will be undefined
 */
export function optionalAuthMiddleware(secret: string) {
  return createMiddleware(async (c, next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return next()
    }

    const token = authHeader.replace('Bearer ', '')

    try {
      const { jwt: jwtMiddleware } = await import('hono/jwt')
      const verify = jwtMiddleware({ secret })
      await verify(c, next)
    } catch (error) {
      console.warn('Optional auth failed:', error)
    }

    await next()
  })
}

/**
 * Common Auth Errors and Fixes
 *
 * ❌ Error: "Missing or invalid Authorization header"
 * Fix: Make sure frontend sends: Authorization: Bearer <token>
 *
 * ❌ Error: "Invalid signature"
 * Fix: Check that CLERK_SECRET_KEY is correct
 *
 * ❌ Error: "Token expired"
 * Fix: Frontend needs to refresh the token (Clerk handles this)
 *
 * ❌ Error: 401 on first request after sign in
 * Fix: Frontend race condition - check isLoaded before making API calls
 */
CLERK AUTH END */

/**
 * Example: How to use auth middleware
 *
 * 1. Enable auth: ./scripts/enable-auth.sh
 * 2. Apply to protected routes:
 *
 *    import { jwtAuthMiddleware } from './middleware/auth'
 *    app.use('/api/protected/*', jwtAuthMiddleware(env.CLERK_SECRET_KEY))
 *
 * 3. Access user in route handler:
 *
 *    app.get('/api/protected/profile', (c) => {
 *      const payload = c.get('jwtPayload')
 *      const userId = payload.sub
 *      return c.json({ userId })
 *    })
 *
 * See cloudflare-full-stack-integration skill for complete patterns.
 */
