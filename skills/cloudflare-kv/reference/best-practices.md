# Cloudflare Workers KV - Best Practices

This document contains production-tested best practices for Cloudflare Workers KV.

---

## Table of Contents

1. [Performance Optimization](#performance-optimization)
2. [Caching Strategies](#caching-strategies)
3. [Key Design](#key-design)
4. [Metadata Usage](#metadata-usage)
5. [Error Handling](#error-handling)
6. [Security](#security)
7. [Cost Optimization](#cost-optimization)
8. [Monitoring & Debugging](#monitoring--debugging)

---

## Performance Optimization

### 1. Use Bulk Operations

**❌ Bad: Individual reads**
```typescript
const value1 = await kv.get('key1'); // 1 operation
const value2 = await kv.get('key2'); // 1 operation
const value3 = await kv.get('key3'); // 1 operation
// Total: 3 operations
```

**✅ Good: Bulk read**
```typescript
const values = await kv.get(['key1', 'key2', 'key3']); // 1 operation
// Total: 1 operation
```

**Benefits:**
- Counts as 1 operation against the 1000/invocation limit
- Faster execution
- Lower latency

---

### 2. Use CacheTtl for Frequently-Read Data

**❌ Bad: No edge caching**
```typescript
const value = await kv.get('config'); // Fetches from KV every time
```

**✅ Good: Edge caching**
```typescript
const value = await kv.get('config', {
  cacheTtl: 300, // Cache at edge for 5 minutes
});
```

**Guidelines:**
- Use `cacheTtl` for data that changes infrequently
- Minimum: 60 seconds
- Typical values:
  - Configuration: 300-600 seconds (5-10 minutes)
  - Static content: 3600+ seconds (1+ hour)
  - Frequently changing: 60-120 seconds

**Trade-off:** Higher `cacheTtl` = faster reads but slower updates propagate

---

### 3. Coalesce Related Keys

**❌ Bad: Many small keys**
```typescript
await kv.put('user:123:name', 'John');
await kv.put('user:123:email', 'john@example.com');
await kv.put('user:123:age', '30');

// Reading requires 3 operations
const name = await kv.get('user:123:name');
const email = await kv.get('user:123:email');
const age = await kv.get('user:123:age');
```

**✅ Good: Coalesced key**
```typescript
await kv.put('user:123', JSON.stringify({
  name: 'John',
  email: 'john@example.com',
  age: 30,
}));

// Reading requires 1 operation
const user = await kv.get<User>('user:123', { type: 'json' });
```

**Benefits:**
- Fewer operations
- Single cache entry
- Faster reads

**When to use:**
- Related data that's always accessed together
- Data that doesn't update frequently
- Values stay under 25 MiB total

---

### 4. Store Small Values in Metadata

**❌ Bad: Separate keys for metadata**
```typescript
await kv.put('user:123', 'data');
await kv.put('user:123:status', 'active');

// List requires additional get() calls
const users = await kv.list({ prefix: 'user:' });
for (const key of users.keys) {
  const status = await kv.get(`${key.name}:status`); // Extra operation!
}
```

**✅ Good: Metadata pattern**
```typescript
await kv.put('user:123', 'data', {
  metadata: { status: 'active', plan: 'pro' },
});

// List includes metadata, no extra get() calls!
const users = await kv.list({ prefix: 'user:' });
for (const key of users.keys) {
  console.log(key.name, key.metadata.status); // No extra operations
}
```

**When to use:**
- Values fit in 1024 bytes
- Frequently use `list()` operations
- Need to filter/process many keys

---

## Caching Strategies

### 1. Cache-Aside Pattern (Read-Through)

```typescript
async function getCached<T>(
  kv: KVNamespace,
  key: string,
  fetchFn: () => Promise<T>,
  ttl = 3600
): Promise<T> {
  // Try cache
  const cached = await kv.get<T>(key, {
    type: 'json',
    cacheTtl: 300,
  });

  if (cached !== null) return cached;

  // Cache miss - fetch and store
  const data = await fetchFn();
  await kv.put(key, JSON.stringify(data), { expirationTtl: ttl });

  return data;
}
```

**Use when:**
- Data is expensive to compute/fetch
- Read >> Write ratio
- Acceptable to serve slightly stale data

---

### 2. Write-Through Cache

```typescript
async function updateCached<T>(
  kv: KVNamespace,
  key: string,
  data: T,
  ttl = 3600
): Promise<void> {
  // Update database
  await database.update(data);

  // Update cache immediately
  await kv.put(key, JSON.stringify(data), { expirationTtl: ttl });
}
```

**Use when:**
- Need cache consistency
- Write operations are infrequent
- Cache must always reflect latest data

---

### 3. Stale-While-Revalidate

```typescript
async function staleWhileRevalidate<T>(
  kv: KVNamespace,
  key: string,
  fetchFn: () => Promise<T>,
  ctx: ExecutionContext,
  staleThreshold = 300
): Promise<T> {
  const { value, metadata } = await kv.getWithMetadata<T, { timestamp: number }>(
    key,
    { type: 'json' }
  );

  if (value !== null && metadata) {
    const age = Date.now() - metadata.timestamp;

    // Refresh in background if stale
    if (age > staleThreshold * 1000) {
      ctx.waitUntil(
        (async () => {
          const fresh = await fetchFn();
          await kv.put(key, JSON.stringify(fresh), {
            metadata: { timestamp: Date.now() },
          });
        })()
      );
    }

    return value;
  }

  // Cache miss
  const data = await fetchFn();
  await kv.put(key, JSON.stringify(data), {
    metadata: { timestamp: Date.now() },
  });

  return data;
}
```

**Use when:**
- Fast response time is critical
- Acceptable to serve slightly stale data
- Background refresh is acceptable

---

## Key Design

### 1. Use Hierarchical Namespaces

**✅ Good key patterns:**
```
user:123:profile
user:123:settings
user:123:sessions

session:abc123:data
session:abc123:metadata

cache:api:users:list
cache:api:posts:123
cache:db:query:hash123
```

**Benefits:**
- Easy to filter with `list({ prefix: 'user:123:' })`
- Easy to invalidate groups
- Clear organization

---

### 2. Use Lexicographic Ordering

Keys are always sorted lexicographically, so design keys to take advantage:

```typescript
// Date-based keys (ISO format sorts correctly)
'log:2025-10-21:entry1'
'log:2025-10-22:entry1'

// Numeric IDs (zero-padded)
'user:00000001'
'user:00000123'
'user:00001000'

// Priority-based (prefix with number)
'task:1:high-priority'
'task:2:medium-priority'
'task:3:low-priority'
```

---

### 3. Avoid Key Collisions

**❌ Bad:**
```
user:123        // User data
user:123:count  // Some counter
user:123        // Different data? Collision!
```

**✅ Good:**
```
user:data:123
user:counter:123
user:session:123
```

---

## Metadata Usage

### 1. Track Versions

```typescript
await kv.put('config', JSON.stringify(data), {
  metadata: {
    version: 2,
    updatedAt: Date.now(),
    updatedBy: 'admin',
  },
});
```

---

### 2. Audit Trails

```typescript
await kv.put(key, value, {
  metadata: {
    createdAt: Date.now(),
    createdBy: userId,
    accessCount: 0,
  },
});
```

---

### 3. Feature Flags

```typescript
// Store flags in metadata for fast list() access
await kv.put(`flag:${name}`, JSON.stringify(config), {
  metadata: {
    enabled: true,
    rolloutPercentage: 50,
  },
});

// List all flags without additional get() calls
const flags = await kv.list({ prefix: 'flag:' });
```

---

## Error Handling

### 1. Handle Rate Limits (429)

```typescript
async function putWithRetry(
  kv: KVNamespace,
  key: string,
  value: string,
  maxAttempts = 5
): Promise<void> {
  let attempts = 0;
  let delay = 1000;

  while (attempts < maxAttempts) {
    try {
      await kv.put(key, value);
      return;
    } catch (error) {
      const message = (error as Error).message;

      if (message.includes('429') || message.includes('Too Many Requests')) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Max retry attempts reached');
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
}
```

---

### 2. Handle Null Values

```typescript
// ❌ Bad
const value = await kv.get('key');
console.log(value.toUpperCase()); // Error if key doesn't exist

// ✅ Good
const value = await kv.get('key');
if (value !== null) {
  console.log(value.toUpperCase());
}

// ✅ Good: Default value
const value = await kv.get('key') ?? 'default';
```

---

### 3. Validate Input Sizes

```typescript
function validateKVInput(key: string, value: string, metadata?: any): void {
  // Key size
  if (new TextEncoder().encode(key).length > 512) {
    throw new Error('Key exceeds 512 bytes');
  }

  // Value size
  if (new TextEncoder().encode(value).length > 25 * 1024 * 1024) {
    throw new Error('Value exceeds 25 MiB');
  }

  // Metadata size
  if (metadata) {
    const serialized = JSON.stringify(metadata);
    if (new TextEncoder().encode(serialized).length > 1024) {
      throw new Error('Metadata exceeds 1024 bytes');
    }
  }
}
```

---

## Security

### 1. Never Commit Namespace IDs

**❌ Bad:**
```jsonc
{
  "kv_namespaces": [
    {
      "binding": "MY_KV",
      "id": "abc123def456..." // Hardcoded!
    }
  ]
}
```

**✅ Good:**
```jsonc
{
  "kv_namespaces": [
    {
      "binding": "MY_KV",
      "id": "${KV_NAMESPACE_ID}" // Environment variable
    }
  ]
}
```

---

### 2. Encrypt Sensitive Data

```typescript
// Encrypt before storing
const encrypted = await encrypt(sensitiveData, encryptionKey);
await kv.put('sensitive:123', encrypted);

// Decrypt after reading
const encrypted = await kv.get('sensitive:123');
const decrypted = await decrypt(encrypted, encryptionKey);
```

---

### 3. Use Separate Namespaces for Environments

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "MY_KV",
      "id": "production-namespace-id",
      "preview_id": "development-namespace-id"
    }
  ]
}
```

---

## Cost Optimization

### 1. Minimize Write Operations (Free Tier)

**Free tier limits:**
- 1,000 writes per day
- 100,000 reads per day

**Strategies:**
- Batch writes when possible
- Use longer TTLs to reduce rewrites
- Cache data in memory if accessed frequently within same invocation

---

### 2. Use Metadata Instead of Separate Keys

**❌ Expensive: 3 writes, 3 reads**
```typescript
await kv.put('user:123:status', 'active');
await kv.put('user:123:plan', 'pro');
await kv.put('user:123:updated', Date.now().toString());
```

**✅ Cheaper: 1 write, 1 read**
```typescript
await kv.put('user:123', '', {
  metadata: { status: 'active', plan: 'pro', updated: Date.now() },
});
```

---

### 3. Set Appropriate TTLs

Longer TTLs = fewer rewrites = lower costs

```typescript
// ❌ Expensive: Rewrites every minute
await kv.put('cache:data', data, { expirationTtl: 60 });

// ✅ Better: Rewrites every hour
await kv.put('cache:data', data, { expirationTtl: 3600 });
```

---

## Monitoring & Debugging

### 1. Track Cache Hit Rates

```typescript
let stats = { hits: 0, misses: 0 };

async function getCached<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const value = await kv.get<T>(key, { type: 'json' });

  if (value !== null) {
    stats.hits++;
  } else {
    stats.misses++;
  }

  return value;
}

// View stats
app.get('/stats', (c) => {
  const total = stats.hits + stats.misses;
  const hitRate = total > 0 ? (stats.hits / total) * 100 : 0;

  return c.json({
    hits: stats.hits,
    misses: stats.misses,
    hitRate: `${hitRate.toFixed(2)}%`,
  });
});
```

---

### 2. Log KV Operations

```typescript
async function loggedGet<T>(
  kv: KVNamespace,
  key: string
): Promise<T | null> {
  const start = Date.now();
  const value = await kv.get<T>(key, { type: 'json' });
  const duration = Date.now() - start;

  console.log({
    operation: 'get',
    key,
    found: value !== null,
    duration,
  });

  return value;
}
```

---

### 3. Use Namespace Prefixes for Testing

```typescript
const namespace = env.ENVIRONMENT === 'production' ? 'prod' : 'test';

await kv.put(`${namespace}:user:123`, data);

// Cleanup test data
if (env.ENVIRONMENT === 'test') {
  // Delete all test: keys
  let cursor: string | undefined;
  do {
    const result = await kv.list({ prefix: 'test:', cursor });
    await Promise.all(result.keys.map(k => kv.delete(k.name)));
    cursor = result.list_complete ? undefined : result.cursor;
  } while (cursor);
}
```

---

## Production Checklist

Before deploying to production:

- [ ] Environment-specific namespaces configured
- [ ] Namespace IDs stored in environment variables
- [ ] Rate limit retry logic implemented
- [ ] Appropriate `cacheTtl` values set
- [ ] Input validation for key/value/metadata sizes
- [ ] Bulk operations used where possible
- [ ] Pagination implemented correctly for `list()`
- [ ] Error handling for null values
- [ ] Monitoring/alerting for rate limits
- [ ] Documentation for eventual consistency behavior
- [ ] Security review for sensitive data
- [ ] Cost analysis for expected usage

---

## Common Patterns

### 1. Session Management

```typescript
// Store session
await kv.put(`session:${sessionId}`, JSON.stringify(sessionData), {
  expirationTtl: 3600, // 1 hour
  metadata: { userId, createdAt: Date.now() },
});

// Read session
const session = await kv.get<SessionData>(`session:${sessionId}`, {
  type: 'json',
  cacheTtl: 60, // Cache for 1 minute
});
```

---

### 2. API Response Caching

```typescript
const cacheKey = `api:${endpoint}:${JSON.stringify(params)}`;

let response = await kv.get<ApiResponse>(cacheKey, {
  type: 'json',
  cacheTtl: 300,
});

if (!response) {
  response = await fetchFromAPI(endpoint, params);
  await kv.put(cacheKey, JSON.stringify(response), {
    expirationTtl: 600,
  });
}

return response;
```

---

### 3. Configuration Management

```typescript
// Update config
await kv.put('config:app', JSON.stringify(config), {
  metadata: {
    version: 2,
    updatedAt: Date.now(),
    updatedBy: adminId,
  },
});

// Read config (with long cache)
const config = await kv.get<AppConfig>('config:app', {
  type: 'json',
  cacheTtl: 3600, // Cache for 1 hour
});
```

---

## References

- [Cloudflare KV Documentation](https://developers.cloudflare.com/kv/)
- [How KV Works](https://developers.cloudflare.com/kv/concepts/how-kv-works/)
- [KV Limits](https://developers.cloudflare.com/kv/platform/limits/)
- [KV Pricing](https://developers.cloudflare.com/kv/platform/pricing/)
