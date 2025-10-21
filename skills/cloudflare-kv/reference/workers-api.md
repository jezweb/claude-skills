# Cloudflare Workers KV - Complete API Reference

This document provides the complete Workers KV API reference based on official Cloudflare documentation.

---

## KVNamespace Interface

```typescript
interface KVNamespace {
  get(key: string, options?: Partial<KVGetOptions<undefined>>): Promise<string | null>;
  get(key: string, type: "text"): Promise<string | null>;
  get<ExpectedValue = unknown>(key: string, type: "json"): Promise<ExpectedValue | null>;
  get(key: string, type: "arrayBuffer"): Promise<ArrayBuffer | null>;
  get(key: string, type: "stream"): Promise<ReadableStream | null>;
  get(keys: string[]): Promise<Map<string, string | null>>;
  get<ExpectedValue = unknown>(keys: string[], type: "json"): Promise<Map<string, ExpectedValue | null>>;

  getWithMetadata<Metadata = unknown>(key: string, options?: Partial<KVGetOptions<undefined>>): Promise<KVGetWithMetadataResult<string, Metadata>>;
  getWithMetadata<ExpectedValue = unknown, Metadata = unknown>(key: string, type: "json"): Promise<KVGetWithMetadataResult<ExpectedValue, Metadata>>;
  getWithMetadata<Metadata = unknown>(keys: string[]): Promise<Map<string, KVGetWithMetadataResult<string, Metadata>>>;

  put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream, options?: KVPutOptions): Promise<void>;

  delete(key: string): Promise<void>;

  list<Metadata = unknown>(options?: KVListOptions): Promise<KVListResult<Metadata>>;
}
```

---

## Read Operations

### `get()` - Single Key

Read a single key-value pair.

**Signature:**
```typescript
get(key: string, options?: KVGetOptions): Promise<T | null>
```

**Parameters:**
- `key` (string, required) - The key to read
- `options` (object, optional):
  - `type` - Return type: `"text"` (default), `"json"`, `"arrayBuffer"`, `"stream"`
  - `cacheTtl` (number) - Edge cache duration in seconds (minimum: 60)

**Returns:**
- `Promise<T | null>` - Value or `null` if key doesn't exist

**Examples:**
```typescript
// Text (default)
const value = await env.MY_KV.get('my-key');

// JSON
const data = await env.MY_KV.get<MyType>('my-key', { type: 'json' });

// With cache optimization
const value = await env.MY_KV.get('my-key', {
  type: 'text',
  cacheTtl: 300, // Cache for 5 minutes
});

// ArrayBuffer
const buffer = await env.MY_KV.get('binary-key', { type: 'arrayBuffer' });

// Stream (for large values)
const stream = await env.MY_KV.get('large-file', { type: 'stream' });
```

---

### `get()` - Multiple Keys (Bulk)

Read multiple keys in a single operation.

**Signature:**
```typescript
get(keys: string[], type?: 'text' | 'json'): Promise<Map<string, T | null>>
```

**Parameters:**
- `keys` (string[], required) - Array of keys to read
- `type` (optional) - Return type: `"text"` (default) or `"json"`

**Returns:**
- `Promise<Map<string, T | null>>` - Map of key-value pairs

**Important:**
- Counts as **1 operation** regardless of number of keys
- Only supports `text` and `json` types (not `arrayBuffer` or `stream`)
- For binary/stream types, use individual `get()` calls with `Promise.all()`

**Examples:**
```typescript
// Read multiple keys
const keys = ['key1', 'key2', 'key3'];
const values = await env.MY_KV.get(keys);

// Access values
const value1 = values.get('key1');
const value2 = values.get('key2');

// Convert to object
const obj = Object.fromEntries(values);

// Read as JSON
const values = await env.MY_KV.get<MyType>(keys, 'json');
```

---

### `getWithMetadata()` - Single Key

Read key-value pair with metadata.

**Signature:**
```typescript
getWithMetadata<Value, Metadata>(
  key: string,
  options?: KVGetOptions
): Promise<KVGetWithMetadataResult<Value, Metadata>>
```

**Parameters:**
- Same as `get()`

**Returns:**
```typescript
{
  value: Value | null,
  metadata: Metadata | null
}
```

**Examples:**
```typescript
// Get with metadata
const { value, metadata } = await env.MY_KV.getWithMetadata('my-key');

// Get as JSON with metadata
const { value, metadata } = await env.MY_KV.getWithMetadata<MyType>('my-key', {
  type: 'json',
  cacheTtl: 300,
});

if (value !== null) {
  console.log('Value:', value);
  console.log('Metadata:', metadata);
}
```

---

### `getWithMetadata()` - Multiple Keys (Bulk)

Read multiple keys with metadata.

**Signature:**
```typescript
getWithMetadata<Metadata>(
  keys: string[],
  type?: 'text' | 'json'
): Promise<Map<string, KVGetWithMetadataResult<T, Metadata>>>
```

**Examples:**
```typescript
const keys = ['key1', 'key2'];
const results = await env.MY_KV.getWithMetadata(keys);

for (const [key, data] of results) {
  console.log(key, data.value, data.metadata);
}
```

---

## Write Operations

### `put()` - Write Key-Value Pair

Write or update a key-value pair.

**Signature:**
```typescript
put(
  key: string,
  value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
  options?: KVPutOptions
): Promise<void>
```

**Parameters:**
- `key` (string, required) - Maximum 512 bytes
- `value` (required) - Maximum 25 MiB
- `options` (object, optional):
  - `expiration` (number) - Absolute expiration time (seconds since epoch)
  - `expirationTtl` (number) - TTL in seconds from now (minimum: 60)
  - `metadata` (any) - JSON-serializable metadata (maximum: 1024 bytes)

**Returns:**
- `Promise<void>`

**Examples:**
```typescript
// Simple write
await env.MY_KV.put('key', 'value');

// Write JSON
await env.MY_KV.put('user:123', JSON.stringify({ name: 'John' }));

// Write with TTL
await env.MY_KV.put('session', sessionData, {
  expirationTtl: 3600, // Expire in 1 hour
});

// Write with absolute expiration
const expirationTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours
await env.MY_KV.put('token', tokenValue, {
  expiration: expirationTime,
});

// Write with metadata
await env.MY_KV.put('config', configData, {
  metadata: {
    updatedAt: Date.now(),
    updatedBy: 'admin',
    version: 2,
  },
});

// Write with everything
await env.MY_KV.put('key', 'value', {
  expirationTtl: 600,
  metadata: { source: 'api' },
});
```

**Limits:**
- **Key size**: Maximum 512 bytes
- **Value size**: Maximum 25 MiB
- **Metadata size**: Maximum 1024 bytes (JSON serialized)
- **Write rate**: Maximum **1 write per second per key**
- **Expiration minimum**: 60 seconds

---

## Delete Operations

### `delete()` - Delete Key

Delete a key-value pair.

**Signature:**
```typescript
delete(key: string): Promise<void>
```

**Parameters:**
- `key` (string, required) - Key to delete

**Returns:**
- `Promise<void>` - Always succeeds, even if key doesn't exist

**Examples:**
```typescript
// Delete single key
await env.MY_KV.delete('my-key');

// Delete multiple keys
const keys = ['key1', 'key2', 'key3'];
await Promise.all(keys.map(key => env.MY_KV.delete(key)));
```

**Note:** For bulk delete of >10,000 keys, use the REST API.

---

## List Operations

### `list()` - List Keys

List keys in the namespace.

**Signature:**
```typescript
list<Metadata>(options?: KVListOptions): Promise<KVListResult<Metadata>>
```

**Parameters:**
```typescript
interface KVListOptions {
  prefix?: string;  // Filter keys by prefix
  limit?: number;   // Max keys to return (default: 1000, max: 1000)
  cursor?: string;  // Pagination cursor
}
```

**Returns:**
```typescript
interface KVListResult<Metadata> {
  keys: {
    name: string;
    expiration?: number;  // Seconds since epoch
    metadata?: Metadata;
  }[];
  list_complete: boolean;  // true if no more keys
  cursor?: string;         // Use for next page
}
```

**Examples:**
```typescript
// List all keys (up to 1000)
const result = await env.MY_KV.list();

// List with prefix
const users = await env.MY_KV.list({ prefix: 'user:' });

// List with limit
const recent = await env.MY_KV.list({ limit: 100 });

// Pagination
let cursor: string | undefined;
do {
  const result = await env.MY_KV.list({ cursor });

  // Process keys
  console.log(result.keys);

  cursor = result.list_complete ? undefined : result.cursor;
} while (cursor);
```

**Important:**
- Keys are **always** sorted lexicographically (UTF-8)
- **Always check `list_complete`**, not `keys.length === 0`
- Empty `keys` array doesn't mean no more data (tombstones exist)
- When paginating with `prefix`, pass `prefix` with each cursor request

---

## Type Definitions

### KVGetOptions

```typescript
interface KVGetOptions<Type> {
  type: Type;        // "text" | "json" | "arrayBuffer" | "stream"
  cacheTtl?: number; // Edge cache duration (minimum: 60 seconds)
}
```

### KVPutOptions

```typescript
interface KVPutOptions {
  expiration?: number;     // Seconds since epoch
  expirationTtl?: number;  // Seconds from now (minimum: 60)
  metadata?: any;          // Max 1024 bytes serialized
}
```

### KVGetWithMetadataResult

```typescript
interface KVGetWithMetadataResult<Value, Metadata> {
  value: Value | null;
  metadata: Metadata | null;
}
```

### KVListOptions

```typescript
interface KVListOptions {
  prefix?: string;
  limit?: number;   // Default: 1000, max: 1000
  cursor?: string;
}
```

### KVListResult

```typescript
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

## Limits

| Feature | Limit |
|---------|-------|
| Key size | 512 bytes |
| Value size | 25 MiB |
| Metadata size | 1024 bytes (JSON) |
| Writes per key per second | 1 |
| Operations per Worker invocation | 1,000 |
| List limit | 1,000 keys |
| Minimum cacheTtl | 60 seconds |
| Minimum expiration | 60 seconds |
| Namespaces per account (Free) | 1,000 |
| Namespaces per account (Paid) | 1,000 |
| Storage per account (Free) | 1 GB |
| Storage per account (Paid) | Unlimited |
| Read operations per day (Free) | 100,000 |
| Read operations per day (Paid) | Unlimited |
| Write operations per day (Free) | 1,000 |
| Write operations per day (Paid) | Unlimited |

---

## Consistency Model

### Eventually Consistent

- Writes are **immediately visible** in the same location
- Writes take **up to 60 seconds** to propagate globally
- Cached reads may return stale data during propagation

### Implications

```typescript
// Tokyo datacenter
await env.KV.put('counter', '1');
const value1 = await env.KV.get('counter'); // "1" ✅

// London datacenter (within 60 seconds)
const value2 = await env.KV.get('counter'); // Might be old value ⚠️

// After 60+ seconds globally
const value3 = await env.KV.get('counter'); // "1" ✅
```

**For strong consistency, use [Durable Objects](https://developers.cloudflare.com/durable-objects/).**

---

## Error Handling

### Common Errors

1. **429 Too Many Requests**
   - Cause: >1 write/second to same key
   - Solution: Implement retry with exponential backoff

2. **Value too large**
   - Cause: Value >25 MiB
   - Solution: Validate size before writing

3. **Metadata too large**
   - Cause: Metadata >1024 bytes serialized
   - Solution: Validate JSON size before writing

4. **Invalid cacheTtl**
   - Cause: cacheTtl <60 seconds
   - Solution: Use minimum 60 seconds

5. **Operations limit exceeded**
   - Cause: >1000 KV operations in Worker invocation
   - Solution: Use bulk operations

---

## References

- [Official KV Documentation](https://developers.cloudflare.com/kv/)
- [KV API Reference](https://developers.cloudflare.com/kv/api/)
- [KV Limits](https://developers.cloudflare.com/kv/platform/limits/)
- [How KV Works](https://developers.cloudflare.com/kv/concepts/how-kv-works/)
