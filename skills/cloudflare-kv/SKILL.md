---
name: Cloudflare Workers KV
description: |
  Complete knowledge domain for Cloudflare Workers KV - global, low-latency key-value storage on Cloudflare's edge network.

  Use when: creating KV namespaces, storing configuration data, caching API responses, managing user preferences,
  implementing TTL expiration, handling KV metadata, or encountering "KV_ERROR", "429 too many requests",
  "kv rate limit", cacheTtl errors, or eventual consistency issues.

  Keywords: kv storage, cloudflare kv, workers kv, kv namespace, kv bindings, kv cache, kv ttl, kv metadata,
  kv list, kv pagination, cache optimization, edge caching, KV_ERROR, 429 too many requests, kv rate limit,
  eventually consistent, wrangler kv, kv operations, key value storage
---

# Cloudflare Workers KV

**Status**: Production Ready ✅
**Last Updated**: 2025-10-21
**Dependencies**: cloudflare-worker-base (for Worker setup)
**Latest Versions**: wrangler@4.43.0, @cloudflare/workers-types@4.20251014.0

---

## Quick Start (5 Minutes)

### 1. Create KV Namespace

```bash
# Create a new KV namespace
npx wrangler kv namespace create MY_NAMESPACE

# Output includes namespace_id - save this!
# ✅ Success!
# Add the following to your wrangler.toml or wrangler.jsonc:
#
# [[kv_namespaces]]
# binding = "MY_NAMESPACE"
# id = "<UUID>"
```

**For development (preview) namespace:**

```bash
npx wrangler kv namespace create MY_NAMESPACE --preview

# Output:
# [[kv_namespaces]]
# binding = "MY_NAMESPACE"
# preview_id = "<UUID>"
```

### 2. Configure Bindings

Add to your `wrangler.jsonc`:

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-11",
  "kv_namespaces": [
    {
      "binding": "MY_NAMESPACE",          // Available as env.MY_NAMESPACE
      "id": "<production-uuid>",           // Production namespace ID
      "preview_id": "<preview-uuid>"       // Local dev namespace ID (optional)
    }
  ]
}
```

**Or use `wrangler.toml`:**

```toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2025-10-11"

[[kv_namespaces]]
binding = "MY_NAMESPACE"
id = "<production-uuid>"
preview_id = "<preview-uuid>"  # optional
```

**CRITICAL:**
- `binding` is how you access the namespace in code (`env.MY_NAMESPACE`)
- `id` is the production namespace UUID
- `preview_id` is for local dev (optional, separate namespace)
- **Never commit real namespace IDs to public repos** - use environment variables or secrets

### 3. Write Your First Key-Value Pair

```typescript
import { Hono } from 'hono';

type Bindings = {
  MY_NAMESPACE: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post('/set/:key', async (c) => {
  const key = c.req.param('key');
  const value = await c.req.text();

  // Simple write
  await c.env.MY_NAMESPACE.put(key, value);

  return c.json({ success: true, key });
});

app.get('/get/:key', async (c) => {
  const key = c.req.param('key');
  const value = await c.env.MY_NAMESPACE.get(key);

  if (!value) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json({ value });
});

export default app;
```

### 4. Test Locally

```bash
# Start local development server
npm run dev

# In another terminal, test the endpoints
curl -X POST http://localhost:8787/set/test -d "Hello KV"
# {"success":true,"key":"test"}

curl http://localhost:8787/get/test
# {"value":"Hello KV"}
```

---

## Complete Workers KV API

### 1. Read Operations

#### `get()` - Read Single Key

```typescript
// Get as string (default)
const value: string | null = await env.MY_KV.get('my-key');

// Get as JSON
const data: MyType | null = await env.MY_KV.get('my-key', { type: 'json' });

// Get as ArrayBuffer
const buffer: ArrayBuffer | null = await env.MY_KV.get('my-key', { type: 'arrayBuffer' });

// Get as ReadableStream
const stream: ReadableStream | null = await env.MY_KV.get('my-key', { type: 'stream' });

// Get with cache optimization
const value = await env.MY_KV.get('my-key', {
  type: 'text',
  cacheTtl: 300, // Cache at edge for 5 minutes (minimum 60 seconds)
});
```

#### `get()` - Read Multiple Keys (Bulk)

```typescript
// Read multiple keys at once (counts as 1 operation)
const keys = ['key1', 'key2', 'key3'];
const values: Map<string, string | null> = await env.MY_KV.get(keys);

// Access values
const value1 = values.get('key1'); // string | null
const value2 = values.get('key2'); // string | null

// Convert to object
const obj = Object.fromEntries(values);
```

#### `getWithMetadata()` - Read with Metadata

```typescript
// Get single key with metadata
const { value, metadata } = await env.MY_KV.getWithMetadata('my-key');

// value: string | null
// metadata: any | null

// Get as JSON with metadata
const { value, metadata } = await env.MY_KV.getWithMetadata<MyType>('my-key', {
  type: 'json',
  cacheTtl: 300,
});

// Get multiple keys with metadata
const keys = ['key1', 'key2'];
const result: Map<string, { value: string | null, metadata: any | null }> =
  await env.MY_KV.getWithMetadata(keys);

for (const [key, data] of result) {
  console.log(key, data.value, data.metadata);
}
```

**Type Options:**
- `text` (default) - Returns `string`
- `json` - Parses JSON, returns `object`
- `arrayBuffer` - Returns `ArrayBuffer`
- `stream` - Returns `ReadableStream`

**Note:** Bulk read with `get(keys[])` only supports `text` and `json` types. For `arrayBuffer` or `stream`, use individual `get()` calls with `Promise.all()`.

---

### 2. Write Operations

#### `put()` - Write Key-Value Pair

```typescript
// Simple write
await env.MY_KV.put('key', 'value');

// Write JSON
await env.MY_KV.put('user:123', JSON.stringify({ name: 'John', age: 30 }));

// Write with expiration (TTL)
await env.MY_KV.put('session:abc', sessionData, {
  expirationTtl: 3600, // Expire in 1 hour (minimum 60 seconds)
});

// Write with absolute expiration
const expirationTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
await env.MY_KV.put('token', tokenValue, {
  expiration: expirationTime, // Seconds since epoch
});

// Write with metadata
await env.MY_KV.put('config:theme', 'dark', {
  metadata: {
    updatedAt: Date.now(),
    updatedBy: 'admin',
    version: 2
  },
});

// Write with everything
await env.MY_KV.put('feature:flags', JSON.stringify(flags), {
  expirationTtl: 600,
  metadata: { source: 'api', timestamp: Date.now() },
});
```

**CRITICAL Limits:**
- **Key size**: Maximum 512 bytes
- **Value size**: Maximum 25 MiB
- **Metadata size**: Maximum 1024 bytes (JSON serialized)
- **Write rate**: Maximum 1 write per second **per key**
- **Expiration minimum**: 60 seconds (both TTL and absolute)

**Rate Limit Handling:**

```typescript
async function putWithRetry(
  kv: KVNamespace,
  key: string,
  value: string,
  options?: KVPutOptions
) {
  let attempts = 0;
  const maxAttempts = 5;
  let delay = 1000; // Start with 1 second

  while (attempts < maxAttempts) {
    try {
      await kv.put(key, value, options);
      return; // Success
    } catch (error) {
      const message = (error as Error).message;

      if (message.includes('429') || message.includes('Too Many Requests')) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Max retry attempts reached');
        }

        console.warn(`Attempt ${attempts} failed. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Exponential backoff
        delay *= 2;
      } else {
        throw error; // Different error, rethrow
      }
    }
  }
}
```

---

### 3. List Operations

#### `list()` - List Keys

```typescript
// List all keys (up to 1000)
const result = await env.MY_KV.list();

console.log(result.keys);         // Array of key objects
console.log(result.list_complete); // boolean - false if more keys exist
console.log(result.cursor);        // string - for pagination

// List with prefix filter
const result = await env.MY_KV.list({
  prefix: 'user:', // Only keys starting with 'user:'
});

// List with limit
const result = await env.MY_KV.list({
  limit: 100, // Maximum 1000 (default 1000)
});

// Pagination with cursor
let cursor: string | undefined;
let allKeys: any[] = [];

do {
  const result = await env.MY_KV.list({ cursor });
  allKeys = allKeys.concat(result.keys);
  cursor = result.list_complete ? undefined : result.cursor;
} while (cursor);

// Combined: prefix + pagination
let cursor: string | undefined;
const userKeys: any[] = [];

do {
  const result = await env.MY_KV.list({
    prefix: 'user:',
    cursor,
  });

  userKeys.push(...result.keys);
  cursor = result.list_complete ? undefined : result.cursor;
} while (cursor);
```

**List Response Format:**

```typescript
{
  keys: [
    {
      name: "user:123",
      expiration: 1234567890,  // Optional: seconds since epoch
      metadata: { ... }         // Optional: metadata object
    },
    // ... more keys
  ],
  list_complete: false,  // true if no more keys
  cursor: "6Ck1la0VxJ0djhidm1MdX2FyD"  // Use for next page
}
```

**IMPORTANT:**
- Keys are **always** returned in lexicographically sorted order (UTF-8)
- **Always check `list_complete`**, not `keys.length === 0`
- Empty `keys` array doesn't mean no more data (expired/deleted keys create "tombstones")
- When paginating with `prefix`, you **must** pass the same `prefix` with each `cursor` request

---

### 4. Delete Operations

#### `delete()` - Delete Key

```typescript
// Delete single key
await env.MY_KV.delete('my-key');

// Delete always succeeds, even if key doesn't exist
await env.MY_KV.delete('non-existent-key'); // No error

// Bulk delete pattern (in Worker)
const keysToDelete = ['key1', 'key2', 'key3', ...];

// Delete in parallel (careful of Worker subrequest limits)
await Promise.all(
  keysToDelete.map(key => env.MY_KV.delete(key))
);

// For more than 1000 keys, use REST API bulk delete (via wrangler or API)
```

**Bulk Delete via REST API:**

The Workers binding doesn't support bulk delete, but you can use the REST API (via `wrangler` or direct API calls):

```bash
# Using wrangler CLI
npx wrangler kv bulk delete --namespace-id=<UUID> keys.json

# keys.json format:
# ["key1", "key2", "key3"]
```

**REST API Limit:** Up to 10,000 keys per bulk delete request.

---

## Advanced Patterns & Best Practices

### 1. Caching Pattern with CacheTtl

```typescript
async function getCachedData(
  kv: KVNamespace,
  cacheKey: string,
  fetchFn: () => Promise<any>,
  cacheTtl: number = 300
) {
  // Try to get from KV cache
  const cached = await kv.get(cacheKey, {
    type: 'json',
    cacheTtl, // Cache at edge for faster subsequent reads
  });

  if (cached) {
    return cached;
  }

  // Cache miss - fetch fresh data
  const data = await fetchFn();

  // Store in KV with expiration
  await kv.put(cacheKey, JSON.stringify(data), {
    expirationTtl: cacheTtl * 2, // Store longer than cache
  });

  return data;
}

// Usage
app.get('/api/data/:id', async (c) => {
  const id = c.req.param('id');

  const data = await getCachedData(
    c.env.CACHE,
    `data:${id}`,
    () => fetchFromDatabase(id),
    300 // 5 minutes
  );

  return c.json(data);
});
```

**CacheTtl Guidelines:**
- **Minimum:** 60 seconds
- **Default:** 60 seconds
- **Maximum:** `Number.MAX_SAFE_INTEGER`
- **Use case:** Frequently read, infrequently updated data
- **Trade-off:** Higher cacheTtl = faster reads but slower update propagation

---

### 2. Metadata Optimization Pattern

Store small values in metadata to avoid separate `get()` calls:

```typescript
// ❌ Bad: Two operations
await env.MY_KV.put('user:123', 'active');
const status = await env.MY_KV.get('user:123');

// ✅ Good: Store in metadata with empty value
await env.MY_KV.put('user:123', '', {
  metadata: {
    status: 'active',
    lastSeen: Date.now(),
    plan: 'pro'
  },
});

// List returns metadata automatically
const users = await env.MY_KV.list({ prefix: 'user:' });

users.keys.forEach(({ name, metadata }) => {
  console.log(name, metadata.status, metadata.plan);
  // No additional get() calls needed!
});
```

**When to Use:**
- ✅ Values fit in 1024 bytes
- ✅ You frequently use `list()` operations
- ✅ You need to filter/process many keys
- ❌ Don't use for large values (use regular value storage)

---

### 3. Key Coalescing for Performance

Combine related cold keys with hot keys:

```typescript
// ❌ Bad: Many individual keys (some hot, some cold)
await kv.put('user:123:name', 'John');
await kv.put('user:123:email', 'john@example.com');
await kv.put('user:123:age', '30');

// ✅ Good: Coalesce into single hot key
await kv.put('user:123', JSON.stringify({
  name: 'John',
  email: 'john@example.com',
  age: 30,
}));

// Single read gets everything
const user = await kv.get<User>('user:123', { type: 'json' });
```

**Advantages:**
- Cold keys benefit from hot key caching
- Fewer operations = better performance
- Single cache entry instead of multiple

**Disadvantages:**
- Can't update individual fields easily (requires read-modify-write)
- Large coalesced values may hit memory limits
- Concurrent updates need locking mechanism

---

### 4. Pagination Helper

```typescript
async function* paginateKV(
  kv: KVNamespace,
  options: { prefix?: string; limit?: number } = {}
) {
  let cursor: string | undefined;

  do {
    const result = await kv.list({
      prefix: options.prefix,
      limit: options.limit || 1000,
      cursor,
    });

    yield result.keys;

    cursor = result.list_complete ? undefined : result.cursor;
  } while (cursor);
}

// Usage
app.get('/all-users', async (c) => {
  const allUsers = [];

  for await (const keys of paginateKV(c.env.MY_KV, { prefix: 'user:' })) {
    // Process batch
    allUsers.push(...keys.map(k => k.name));
  }

  return c.json({ users: allUsers, count: allUsers.length });
});
```

---

### 5. Feature Flags Pattern

```typescript
interface FeatureFlags {
  darkMode: boolean;
  newDashboard: boolean;
  betaFeatures: boolean;
}

async function getFeatureFlags(
  kv: KVNamespace,
  userId?: string
): Promise<FeatureFlags> {
  // Try user-specific flags first
  if (userId) {
    const userFlags = await kv.get<FeatureFlags>(`flags:user:${userId}`, {
      type: 'json',
      cacheTtl: 300,
    });
    if (userFlags) return userFlags;
  }

  // Fallback to global flags
  const globalFlags = await kv.get<FeatureFlags>('flags:global', {
    type: 'json',
    cacheTtl: 300,
  });

  return globalFlags || {
    darkMode: false,
    newDashboard: false,
    betaFeatures: false,
  };
}

// Update global flags
app.post('/admin/flags', async (c) => {
  const flags = await c.req.json<FeatureFlags>();

  await c.env.CONFIG.put('flags:global', JSON.stringify(flags), {
    metadata: { updatedAt: Date.now() },
  });

  return c.json({ success: true });
});
```

---

## Understanding Eventual Consistency

KV is **eventually consistent** across Cloudflare's global network:

### How It Works:

1. **Writes** are immediately visible in the **same location**
2. **Other locations** see the update within **~60 seconds** (or your `cacheTtl` value)
3. **Cached reads** may return stale data during propagation

### Implications:

```typescript
// In Tokyo data center:
await env.MY_KV.put('counter', '1');
const value1 = await env.MY_KV.get('counter'); // "1" ✅

// In London data center (within 60 seconds):
const value2 = await env.MY_KV.get('counter'); // Might still be old value ⚠️

// After 60+ seconds:
const value3 = await env.MY_KV.get('counter'); // "1" ✅
```

### Best Practices:

✅ **Use KV for:**
- Read-heavy workloads (100:1 read/write ratio)
- Data that doesn't require immediate global consistency
- Configuration, feature flags, caching
- User preferences, session data

❌ **Don't use KV for:**
- Financial transactions requiring atomic operations
- Data requiring strong consistency
- High-frequency writes to same key (>1/second)
- Critical data where stale reads are unacceptable

**If you need strong consistency, use [Durable Objects](https://developers.cloudflare.com/durable-objects/).**

---

## Wrangler CLI Operations

### Create Namespace

```bash
# Production namespace
npx wrangler kv namespace create MY_NAMESPACE

# Preview/development namespace
npx wrangler kv namespace create MY_NAMESPACE --preview
```

### List Namespaces

```bash
npx wrangler kv namespace list
```

### Write Key-Value Pairs

```bash
# Write single key
npx wrangler kv key put --binding=MY_NAMESPACE "my-key" "my-value"

# Write from file
npx wrangler kv key put --binding=MY_NAMESPACE "config" --path=config.json

# Write with metadata
npx wrangler kv key put --binding=MY_NAMESPACE "key" "value" --metadata='{"version":1}'

# Write with TTL (seconds)
npx wrangler kv key put --binding=MY_NAMESPACE "session" "data" --ttl=3600
```

### Read Key-Value Pairs

```bash
# Read single key
npx wrangler kv key get --binding=MY_NAMESPACE "my-key"

# Read to file
npx wrangler kv key get --binding=MY_NAMESPACE "image" --path=image.png
```

### List Keys

```bash
# List all keys
npx wrangler kv key list --binding=MY_NAMESPACE

# List with prefix
npx wrangler kv key list --binding=MY_NAMESPACE --prefix="user:"

# Pretty print
npx wrangler kv key list --binding=MY_NAMESPACE | jq "."
```

### Delete Keys

```bash
# Delete single key
npx wrangler kv key delete --binding=MY_NAMESPACE "my-key"
```

### Bulk Operations

```bash
# Bulk write (up to 10,000 keys)
npx wrangler kv bulk put --binding=MY_NAMESPACE data.json

# data.json format:
# [
#   {"key": "key1", "value": "value1"},
#   {"key": "key2", "value": "value2", "expiration_ttl": 3600}
# ]

# Bulk delete (up to 10,000 keys)
npx wrangler kv bulk delete --binding=MY_NAMESPACE keys.json

# keys.json format:
# ["key1", "key2", "key3"]
```

---

## Limits & Quotas

| Feature | Free Plan | Paid Plan |
|---------|-----------|-----------|
| **Reads per day** | 100,000 | Unlimited |
| **Writes per day** (different keys) | 1,000 | Unlimited |
| **Writes per key per second** | 1 | 1 |
| **Operations per Worker invocation** | 1,000 | 1,000 |
| **Namespaces per account** | 1,000 | 1,000 |
| **Storage per account** | 1 GB | Unlimited |
| **Storage per namespace** | 1 GB | Unlimited |
| **Keys per namespace** | Unlimited | Unlimited |
| **Key size** | 512 bytes | 512 bytes |
| **Metadata size** | 1024 bytes | 1024 bytes |
| **Value size** | 25 MiB | 25 MiB |
| **Minimum cacheTtl** | 60 seconds | 60 seconds |
| **Maximum cacheTtl** | Number.MAX_SAFE_INTEGER | Number.MAX_SAFE_INTEGER |

**Important Notes:**
- **1 write/second per key**: Concurrent writes to the same key cause 429 errors
- **1000 operations per invocation**: Bulk operations count as **1 operation**
- **Bulk reads** (reading multiple keys) count as a single operation
- **REST API** is subject to [Cloudflare API rate limits](https://developers.cloudflare.com/fundamentals/api/reference/limits/)

---

## TypeScript Types

```typescript
// KVNamespace type is provided by @cloudflare/workers-types
interface KVNamespace {
  get(key: string, options?: Partial<KVGetOptions<undefined>>): Promise<string | null>;
  get(key: string, type: "text"): Promise<string | null>;
  get<ExpectedValue = unknown>(key: string, type: "json"): Promise<ExpectedValue | null>;
  get(key: string, type: "arrayBuffer"): Promise<ArrayBuffer | null>;
  get(key: string, type: "stream"): Promise<ReadableStream | null>;
  get(key: string, options?: KVGetOptions<"text">): Promise<string | null>;
  get<ExpectedValue = unknown>(key: string, options?: KVGetOptions<"json">): Promise<ExpectedValue | null>;
  get(key: string, options?: KVGetOptions<"arrayBuffer">): Promise<ArrayBuffer | null>;
  get(key: string, options?: KVGetOptions<"stream">): Promise<ReadableStream | null>;
  get(keys: string[]): Promise<Map<string, string | null>>;
  get(keys: string[], type: "text"): Promise<Map<string, string | null>>;
  get<ExpectedValue = unknown>(keys: string[], type: "json"): Promise<Map<string, ExpectedValue | null>>;

  getWithMetadata<Metadata = unknown>(key: string, options?: Partial<KVGetOptions<undefined>>): Promise<KVGetWithMetadataResult<string, Metadata>>;
  getWithMetadata<Metadata = unknown>(key: string, type: "text"): Promise<KVGetWithMetadataResult<string, Metadata>>;
  getWithMetadata<ExpectedValue = unknown, Metadata = unknown>(key: string, type: "json"): Promise<KVGetWithMetadataResult<ExpectedValue, Metadata>>;
  getWithMetadata<Metadata = unknown>(key: string, options?: KVGetOptions<"text">): Promise<KVGetWithMetadataResult<string, Metadata>>;
  getWithMetadata<ExpectedValue = unknown, Metadata = unknown>(key: string, options?: KVGetOptions<"json">): Promise<KVGetWithMetadataResult<ExpectedValue, Metadata>>;
  getWithMetadata<Metadata = unknown>(keys: string[]): Promise<Map<string, KVGetWithMetadataResult<string, Metadata>>>;
  getWithMetadata<Metadata = unknown>(keys: string[], type: "text"): Promise<Map<string, KVGetWithMetadataResult<string, Metadata>>>;
  getWithMetadata<ExpectedValue = unknown, Metadata = unknown>(keys: string[], type: "json"): Promise<Map<string, KVGetWithMetadataResult<ExpectedValue, Metadata>>>;

  put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream, options?: KVPutOptions): Promise<void>;

  delete(key: string): Promise<void>;

  list<Metadata = unknown>(options?: KVListOptions): Promise<KVListResult<Metadata>>;
}

interface KVGetOptions<Type> {
  type: Type;
  cacheTtl?: number;
}

interface KVGetWithMetadataResult<Value, Metadata> {
  value: Value | null;
  metadata: Metadata | null;
}

interface KVPutOptions {
  expiration?: number;        // Seconds since epoch
  expirationTtl?: number;     // Seconds from now (minimum 60)
  metadata?: any;             // Serializable to JSON, max 1024 bytes
}

interface KVListOptions {
  prefix?: string;
  limit?: number;   // Default 1000, max 1000
  cursor?: string;
}

interface KVListResult<Metadata = unknown> {
  keys: {
    name: string;
    expiration?: number;
    metadata?: Metadata;
  }[];
  list_complete: boolean;
  cursor?: string;
}
```

---

## Error Handling

### Common Errors

#### 1. Rate Limit (429 Too Many Requests)

```typescript
try {
  await env.MY_KV.put('counter', '1');
  await env.MY_KV.put('counter', '2'); // Too fast! < 1 second
} catch (error) {
  // Error: KV PUT failed: 429 Too Many Requests
  console.error(error);
}

// Solution: Use retry with backoff (see putWithRetry example above)
```

#### 2. Value Too Large

```typescript
const largeValue = 'x'.repeat(26 * 1024 * 1024); // > 25 MiB

try {
  await env.MY_KV.put('large', largeValue);
} catch (error) {
  // Error: Value too large
  console.error(error);
}

// Solution: Check size before writing
if (value.length > 25 * 1024 * 1024) {
  throw new Error('Value exceeds 25 MiB limit');
}
```

#### 3. Metadata Too Large

```typescript
const metadata = { data: 'x'.repeat(2000) }; // > 1024 bytes serialized

try {
  await env.MY_KV.put('key', 'value', { metadata });
} catch (error) {
  // Error: Metadata too large
  console.error(error);
}

// Solution: Validate metadata size
const serialized = JSON.stringify(metadata);
if (serialized.length > 1024) {
  throw new Error('Metadata exceeds 1024 byte limit');
}
```

#### 4. Invalid CacheTtl

```typescript
// ❌ Too low
await env.MY_KV.get('key', { cacheTtl: 30 }); // Error: minimum is 60

// ✅ Correct
await env.MY_KV.get('key', { cacheTtl: 60 });
```

---

## Always Do ✅

1. **Use bulk operations** when reading multiple keys (counts as 1 operation)
2. **Set cacheTtl** for frequently-read, infrequently-updated data
3. **Store small values in metadata** when using `list()` frequently
4. **Check `list_complete`** when paginating, not `keys.length === 0`
5. **Use retry logic with exponential backoff** for write operations
6. **Validate sizes** before writing (key 512 bytes, value 25 MiB, metadata 1 KB)
7. **Use preview namespaces** for local development
8. **Set appropriate TTLs** for cache invalidation (minimum 60 seconds)
9. **Coalesce related keys** for better caching performance
10. **Use KV for read-heavy workloads** (100:1 read/write ratio ideal)

---

## Never Do ❌

1. **Never write to same key >1/second** - Causes 429 rate limit errors
2. **Never assume immediate global consistency** - Takes ~60 seconds to propagate
3. **Never use KV for atomic operations** - Use Durable Objects instead
4. **Never set cacheTtl <60 seconds** - Will fail
5. **Never commit namespace IDs to public repos** - Use environment variables
6. **Never exceed 1000 operations per invocation** - Use bulk operations
7. **Never rely on write order** - Eventual consistency means no guarantees
8. **Never store sensitive data without encryption** - KV is not encrypted at rest by default
9. **Never use KV for high-frequency writes** - Not designed for write-heavy workloads
10. **Never forget to handle null values** - `get()` returns `null` if key doesn't exist

---

## Troubleshooting

### Issue: "429 Too Many Requests" on writes

**Cause:** Writing to same key more than once per second

**Solution:**
```typescript
// ❌ Bad
for (let i = 0; i < 10; i++) {
  await kv.put('counter', String(i)); // Rate limit!
}

// ✅ Good - consolidate writes
const finalValue = '9';
await kv.put('counter', finalValue);

// ✅ Good - use retry with backoff
await putWithRetry(kv, 'counter', String(i));
```

---

### Issue: Stale reads after write

**Cause:** Eventual consistency - writes take up to 60 seconds to propagate globally

**Solution:**
```typescript
// Accept that reads may be stale for up to 60 seconds
// OR use Durable Objects for strong consistency
// OR implement application-level cache invalidation
```

---

### Issue: "Operations limit exceeded"

**Cause:** More than 1000 KV operations in single Worker invocation

**Solution:**
```typescript
// ❌ Bad - 5000 operations
const keys = Array.from({ length: 5000 }, (_, i) => `key${i}`);
for (const key of keys) {
  await kv.get(key); // Exceeds 1000 limit
}

// ✅ Good - 1 operation (bulk read)
const values = await kv.get(keys);
```

---

### Issue: List returns empty but cursor exists

**Cause:** Recently deleted/expired keys create "tombstones" in the list

**Solution:**
```typescript
// Always check list_complete, not keys.length
let cursor: string | undefined;

do {
  const result = await kv.list({ cursor });

  // Process keys even if empty
  processKeys(result.keys);

  // CORRECT: Check list_complete
  cursor = result.list_complete ? undefined : result.cursor;
} while (cursor);
```

---

## Production Checklist

Before deploying to production:

- [ ] Environment-specific namespaces configured (`id` vs `preview_id`)
- [ ] Namespace IDs stored in environment variables (not hardcoded)
- [ ] Rate limit retry logic implemented for writes
- [ ] Appropriate `cacheTtl` values set for reads
- [ ] Metadata sizes validated (<1024 bytes)
- [ ] Value sizes validated (<25 MiB)
- [ ] Key sizes validated (<512 bytes)
- [ ] Bulk operations used where possible
- [ ] Pagination implemented correctly for `list()`
- [ ] Error handling for null values
- [ ] Monitoring/alerting for rate limits
- [ ] Documentation for eventual consistency behavior

---

## Related Documentation

- [Cloudflare KV Docs](https://developers.cloudflare.com/kv/)
- [KV API Reference](https://developers.cloudflare.com/kv/api/)
- [KV Limits](https://developers.cloudflare.com/kv/platform/limits/)
- [How KV Works](https://developers.cloudflare.com/kv/concepts/how-kv-works/)
- [Wrangler KV Commands](https://developers.cloudflare.com/workers/wrangler/commands/#kv)

---

**Last Updated**: 2025-10-21
**Version**: 1.0.0
**Maintainer**: Jeremy Dawes | jeremy@jezweb.net
