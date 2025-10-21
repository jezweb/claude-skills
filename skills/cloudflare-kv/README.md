# Cloudflare Workers KV

Complete knowledge domain for Cloudflare Workers KV - global, low-latency key-value storage on Cloudflare's edge network.

---

## Auto-Trigger Keywords

### Primary Keywords
- kv storage
- cloudflare kv
- kv namespace
- workers kv
- kv bindings
- kv cache
- kv api
- key value storage
- edge storage

### Secondary Keywords
- kv get
- kv put
- kv delete
- kv list
- kv ttl
- kv expiration
- kv metadata
- cache ttl
- kv pagination
- kv prefix
- kv wrangler
- namespace create
- kv operations
- eventually consistent

### Error-Based Keywords
- KV_ERROR
- 429 too many requests
- kv rate limit
- kv quota exceeded
- kv write limit
- concurrent writes kv
- kv_put_failed
- metadata too large
- value too large
- key too long
- cacheTtl minimum

### Framework Integration Keywords
- kv hono
- kv workers api
- kv cloudflare workers
- wrangler kv
- kv bindings workers

---

## What This Skill Does

This skill provides complete Workers KV knowledge including:

- ✅ **KV Namespace Management** - Create, configure, and bind namespaces
- ✅ **CRUD Operations** - get(), put(), delete(), list()
- ✅ **Bulk Operations** - Bulk reads and REST API batch writes
- ✅ **Metadata Storage** - Store up to 1KB metadata per key
- ✅ **TTL & Expiration** - Automatic key expiration with TTL or absolute time
- ✅ **CacheTtl Optimization** - Control edge caching for faster reads
- ✅ **List Operations** - Pagination with cursor, prefix filtering
- ✅ **Performance Patterns** - Key coalescing, caching strategies
- ✅ **Error Handling** - Rate limit retries, eventual consistency handling
- ✅ **Development vs Production** - Environment-specific namespaces

---

## Known Issues Prevented

| Issue | Description | Prevention |
|-------|-------------|------------|
| **1 write/sec limit** | Concurrent writes to same key cause 429 errors | Document rate limits + retry logic with backoff |
| **Eventually consistent** | Writes take up to 60s to propagate globally | Set expectations, use cacheTtl appropriately |
| **cacheTtl minimum 60s** | Setting lower than 60s fails | Always use 60+ seconds for cacheTtl |
| **Metadata 1024 byte limit** | Exceeding metadata size causes errors | Validate metadata size before put() |
| **Value 25MB limit** | Large values fail to store | Check size before writing |
| **1000 operations/invocation** | Exceeding causes Worker failure | Use bulk operations, batch reads |

---

## When to Use This Skill

### ✅ Use this skill when:
- Storing configuration data or feature flags
- Caching API responses or computed values
- Storing user preferences or session data
- Building read-heavy applications
- Implementing A/B testing configurations
- Storing authentication tokens or JWT data
- Building CDN-like caching layers
- Storing routing tables or redirect maps
- Managing global application state

### ❌ When NOT to use:
- You need strong consistency (use Durable Objects)
- You need atomic operations (use Durable Objects)
- You need relational data (use cloudflare-d1)
- You need frequent writes to same key (>1/sec)
- You need large file storage (use cloudflare-r2)
- You need vector search (use cloudflare-vectorize)

---

## Quick Example

```typescript
import { Hono } from 'hono';

type Bindings = {
  CONFIG: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// Write with expiration
app.post('/config/:key', async (c) => {
  const key = c.req.param('key');
  const value = await c.req.text();

  await c.env.CONFIG.put(key, value, {
    expirationTtl: 3600, // Expire in 1 hour
    metadata: { updatedAt: Date.now(), updatedBy: 'admin' },
  });

  return c.json({ success: true, key });
});

// Read with cache optimization
app.get('/config/:key', async (c) => {
  const key = c.req.param('key');

  const { value, metadata } = await c.env.CONFIG.getWithMetadata(key, {
    type: 'json',
    cacheTtl: 300, // Cache for 5 minutes at edge
  });

  if (!value) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json({ value, metadata });
});

// List with prefix and pagination
app.get('/config/list/:prefix?', async (c) => {
  const prefix = c.req.param('prefix') || '';
  const cursor = c.req.query('cursor');

  const result = await c.env.CONFIG.list({
    prefix,
    limit: 100,
    cursor: cursor || undefined,
  });

  return c.json({
    keys: result.keys,
    hasMore: !result.list_complete,
    cursor: result.cursor,
  });
});

export default app;
```

---

## Token Efficiency

- **Manual Setup**: 9,000-13,000 tokens
- **With This Skill**: 3,500-5,000 tokens
- **Savings**: ~55-60%

---

## Files Included

- `SKILL.md` - Complete KV knowledge domain
- `templates/wrangler-kv-config.jsonc` - KV namespace bindings
- `templates/kv-basic-operations.ts` - CRUD operations Worker
- `templates/kv-caching-pattern.ts` - Cache optimization patterns
- `templates/kv-list-pagination.ts` - List with cursor pagination
- `templates/kv-metadata-pattern.ts` - Metadata usage patterns
- `reference/workers-api.md` - Complete Workers API reference
- `reference/best-practices.md` - Performance & caching strategies

---

## Dependencies

- **cloudflare-worker-base** - For Hono + Vite + Worker setup
- **wrangler** - For KV namespace management

---

## Production Status

✅ **Production Ready**

This skill is based on:
- Official Cloudflare KV documentation
- Cloudflare Workers SDK examples
- Production-tested patterns
- Latest package versions (verified 2025-10-21)

---

## Related Skills

- **cloudflare-worker-base** - Base Worker setup with Hono
- **cloudflare-d1** - Serverless SQLite database
- **cloudflare-r2** - Object storage
- **cloudflare-workers-ai** - AI inference on Workers

---

**Last Updated**: 2025-10-21
**Status**: Production Ready ✅
**Maintainer**: Jeremy Dawes | jeremy@jezweb.net
