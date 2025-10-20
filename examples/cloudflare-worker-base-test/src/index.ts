/**
 * Cloudflare Worker with Hono
 *
 * CRITICAL: Export pattern to prevent "Cannot read properties of undefined (reading 'map')" error
 * See: https://github.com/honojs/hono/issues/3955
 *
 * ✅ CORRECT: export default app (for Hono apps)
 * ❌ WRONG:   export default { fetch: app.fetch } (causes build errors with Vite)
 *
 * Exception: If you need multiple handlers (scheduled, tail, etc.), use Module Worker format:
 * export default {
 *   fetch: app.fetch,
 *   scheduled: async (event, env, ctx) => { ... }
 * }
 */

import { Hono } from 'hono'

// Type-safe environment bindings
type Bindings = {
	ASSETS: Fetcher
}

const app = new Hono<{ Bindings: Bindings }>()

/**
 * API Routes
 *
 * These routes are handled by the Worker BEFORE static assets due to
 * "run_worker_first": ["/api/*"] in wrangler.jsonc
 */
app.get('/api/hello', (c) => {
	return c.json({
		message: 'Hello from Cloudflare Workers!',
		timestamp: new Date().toISOString(),
	})
})

app.get('/api/data', (c) => {
	return c.json({
		items: [
			{ id: 1, name: 'Item 1', description: 'First item' },
			{ id: 2, name: 'Item 2', description: 'Second item' },
			{ id: 3, name: 'Item 3', description: 'Third item' },
		],
		count: 3,
	})
})

app.post('/api/echo', async (c) => {
	const body = await c.req.json()
	return c.json({
		received: body,
		method: c.req.method,
	})
})

/**
 * Health check endpoint
 */
app.get('/api/health', (c) => {
	return c.json({
		status: 'ok',
		version: '1.0.0',
		environment: c.env ? 'production' : 'development',
	})
})

/**
 * Fallback to Static Assets
 *
 * Any route not matched above will be served from the public/ directory
 * thanks to Workers Static Assets
 */
app.all('*', (c) => {
	// Let Cloudflare Workers handle static assets automatically
	return c.env.ASSETS.fetch(c.req.raw)
})

/**
 * Export the Hono app directly (ES Module format)
 * This is the correct pattern for Cloudflare Workers with Hono + Vite
 */
export default app
