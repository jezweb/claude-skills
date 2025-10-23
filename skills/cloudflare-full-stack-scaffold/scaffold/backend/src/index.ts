import { Hono } from 'hono'

type Bindings = {
  AI: Ai
  DB: D1Database
  KV: KVNamespace
  BUCKET: R2Bucket
  VECTORIZE: VectorizeIndex
  QUEUE: Queue
}

const app = new Hono<{ Bindings: Bindings }>()

// Basic health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() })
})

// TODO: Use cloudflare-full-stack-integration skill to add:
// - CORS middleware
// - Auth middleware (optional)
// - D1 routes
// - KV routes
// - R2 routes
// - Workers AI routes
// - AI SDK routes
// - Vectorize routes
// - Queue routes

// Example: Test Workers AI
app.get('/api/ai/test', async (c) => {
  const result = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
    messages: [{ role: 'user', content: 'Hello! Respond in 10 words or less.' }],
  })
  return c.json(result)
})

export default app
