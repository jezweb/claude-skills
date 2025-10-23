/**
 * CORS Middleware for Cloudflare Workers + Hono
 *
 * Prevents the common error:
 *   "Access to fetch at '...' from origin '...' has been blocked by CORS policy"
 *
 * CRITICAL: This middleware MUST be applied BEFORE route handlers
 *
 * ❌ WRONG:
 *   app.post('/api/data', handler)
 *   app.use('/api/*', cors())
 *
 * ✅ CORRECT:
 *   app.use('/api/*', cors())
 *   app.post('/api/data', handler)
 *
 * @package hono version 4.10.2+
 */

import { cors } from 'hono/cors'
import type { MiddlewareHandler } from 'hono'

/**
 * Development CORS - Allows all origins
 *
 * Use this for local development. It allows requests from any origin,
 * which is fine for dev but NOT for production.
 */
export const corsDevMiddleware: MiddlewareHandler = cors({
  origin: '*', // Allow all origins
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 600, // Cache preflight for 10 minutes
})

/**
 * Production CORS - Restricted to your domain(s)
 *
 * Replace 'https://example.com' with your actual production domain.
 * You can also use an array: ['https://example.com', 'https://app.example.com']
 */
export const corsProdMiddleware: MiddlewareHandler = cors({
  origin: 'https://example.com', // ← REPLACE with your domain
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  credentials: true,
  maxAge: 86400, // Cache preflight for 24 hours
})

/**
 * Dynamic CORS - Choose based on environment
 *
 * Automatically uses dev CORS for local and prod CORS for production.
 */
export function corsMiddleware(env: any): MiddlewareHandler {
  // Check if running in production
  const isProduction = env.ENVIRONMENT === 'production'

  return isProduction ? corsProdMiddleware : corsDevMiddleware
}
