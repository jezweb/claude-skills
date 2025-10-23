# Cloudflare Services Configuration

This scaffold includes all Cloudflare services. Here's what each one does and when to use it.

---

## D1 (SQL Database)

**Use for**: Relational data, user accounts, structured content

**Configuration**: `wrangler.jsonc` → `d1_databases`

**Example**:
```typescript
const users = await c.env.DB.prepare(
  'SELECT * FROM users WHERE email = ?'
).bind(email).all()
```

---

## KV (Key-Value Storage)

**Use for**: Caching, session data, simple key-value pairs

**Configuration**: `wrangler.jsonc` → `kv_namespaces`

**Example**:
```typescript
await c.env.KV.put('key', 'value', { expirationTtl: 3600 })
const value = await c.env.KV.get('key')
```

---

## R2 (Object Storage)

**Use for**: File uploads, images, videos, large files

**Configuration**: `wrangler.jsonc` → `r2_buckets`

**Example**:
```typescript
await c.env.BUCKET.put('file.jpg', fileData)
const file = await c.env.BUCKET.get('file.jpg')
```

---

## Workers AI

**Use for**: AI inference (text, images, embeddings)

**Configuration**: `wrangler.jsonc` → `ai`

**Example**:
```typescript
const result = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
  messages: [{ role: 'user', content: 'Hello' }]
})
```

---

## Vectorize (Vector Database)

**Use for**: RAG, semantic search, embeddings

**Configuration**: `wrangler.jsonc` → `vectorize`

**Example**:
```typescript
await c.env.VECTORIZE.insert([{
  id: '1',
  values: embedding,
  metadata: { text: 'content' }
}])
```

---

## Queues

**Use for**: Background jobs, async processing

**Configuration**: `wrangler.jsonc` → `queues`

**Example**:
```typescript
await c.env.QUEUE.send({ task: 'process', data: {} })
```

---

## Removing Unused Services

Don't need a service? Remove from:
1. `wrangler.jsonc` (binding)
2. `vite.config.ts` (dev binding)
3. `backend/src/index.ts` (type definition)
