# RPC vs Fetch Patterns - Decision Guide

When to use RPC methods vs HTTP fetch handler.

---

## Quick Decision Matrix

| Requirement | Use | Why |
|-------------|-----|-----|
| **New project (compat_date >= 2024-04-03)** | RPC | Simpler, type-safe |
| **Type safety important** | RPC | TypeScript knows method signatures |
| **Simple method calls** | RPC | Less boilerplate |
| **WebSocket upgrade needed** | Fetch | Requires HTTP upgrade |
| **Complex HTTP routing** | Fetch | Full request/response control |
| **Need headers, cookies, status codes** | Fetch | HTTP-specific features |
| **Legacy compatibility** | Fetch | Pre-2024-04-03 projects |
| **Auto-serialization wanted** | RPC | Handles structured data automatically |

---

## RPC Pattern (Recommended)

### Enable RPC

Set compatibility date `>= 2024-04-03`:

```jsonc
{
  "compatibility_date": "2025-10-22"
}
```

### Define RPC Methods

```typescript
export class MyDO extends DurableObject {
  // Public methods are automatically exposed as RPC
  async increment(): Promise<number> {
    // ...
  }

  async get(): Promise<number> {
    // ...
  }

  // Private methods are NOT exposed
  private async internalHelper(): Promise<void> {
    // ...
  }
}
```

### Call from Worker

```typescript
const stub = env.MY_DO.getByName('my-instance');

// Direct method calls
const count = await stub.increment();
const value = await stub.get();
```

### Advantages

✅ **Type-safe** - TypeScript knows method signatures
✅ **Less boilerplate** - No HTTP ceremony
✅ **Auto-serialization** - Structured data works seamlessly
✅ **Exception propagation** - Errors thrown in DO received in Worker

### Limitations

❌ Cannot use HTTP-specific features (headers, status codes)
❌ Cannot handle WebSocket upgrades
❌ Requires compat_date >= 2024-04-03

---

## HTTP Fetch Pattern

### Define fetch() Handler

```typescript
export class MyDO extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/increment' && request.method === 'POST') {
      // ...
      return new Response(JSON.stringify({ count }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }
}
```

### Call from Worker

```typescript
const stub = env.MY_DO.getByName('my-instance');

const response = await stub.fetch('https://fake-host/increment', {
  method: 'POST',
});

const data = await response.json();
```

### Advantages

✅ **Full HTTP control** - Headers, cookies, status codes
✅ **WebSocket upgrades** - Required for WebSocket server
✅ **Complex routing** - Use path, method, headers for routing
✅ **Legacy compatible** - Works with pre-2024-04-03

### Limitations

❌ More boilerplate - Manual JSON parsing, response creation
❌ No type safety - Worker doesn't know what methods exist
❌ Manual error handling - Must parse HTTP status codes

---

## Hybrid Pattern (Both)

Use both RPC and fetch() in same DO:

```typescript
export class MyDO extends DurableObject {
  // RPC method for simple calls
  async getStatus(): Promise<{ active: boolean }> {
    return { active: true };
  }

  // Fetch for WebSocket upgrade
  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');

    if (upgradeHeader === 'websocket') {
      // Handle WebSocket upgrade
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.ctx.acceptWebSocket(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response('Not found', { status: 404 });
  }
}
```

**Call from Worker:**

```typescript
const stub = env.MY_DO.getByName('my-instance');

// Use RPC for status
const status = await stub.getStatus();

// Use fetch for WebSocket upgrade
const response = await stub.fetch(request);
```

---

## RPC Serialization

**What works:**
- ✅ Primitives (string, number, boolean, null)
- ✅ Objects (plain objects)
- ✅ Arrays
- ✅ Nested structures
- ✅ Date objects
- ✅ ArrayBuffer, Uint8Array, etc.

**What doesn't work:**
- ❌ Functions
- ❌ Symbols
- ❌ Circular references
- ❌ Class instances (except basic types)

**Example:**

```typescript
// ✅ WORKS
async getData(): Promise<{ users: string[]; count: number }> {
  return {
    users: ['alice', 'bob'],
    count: 2,
  };
}

// ❌ DOESN'T WORK
async getFunction(): Promise<() => void> {
  return () => console.log('hello');  // Functions not serializable
}
```

---

## Error Handling

### RPC Error Handling

```typescript
// In DO
async doWork(): Promise<void> {
  if (somethingWrong) {
    throw new Error('Something went wrong');
  }
}

// In Worker
try {
  await stub.doWork();
} catch (error) {
  console.error('RPC error:', error.message);
  // Error propagated from DO
}
```

### Fetch Error Handling

```typescript
// In DO
async fetch(request: Request): Promise<Response> {
  if (somethingWrong) {
    return new Response(JSON.stringify({ error: 'Something went wrong' }), {
      status: 500,
    });
  }

  return new Response('OK');
}

// In Worker
const response = await stub.fetch(request);

if (!response.ok) {
  const error = await response.json();
  console.error('Fetch error:', error);
}
```

---

## Migration from Fetch to RPC

**Before (Fetch):**

```typescript
export class Counter extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/increment') {
      let count = await this.ctx.storage.get<number>('count') || 0;
      count += 1;
      await this.ctx.storage.put('count', count);

      return new Response(JSON.stringify({ count }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }
}
```

**After (RPC):**

```typescript
export class Counter extends DurableObject {
  async increment(): Promise<number> {
    let count = await this.ctx.storage.get<number>('count') || 0;
    count += 1;
    await this.ctx.storage.put('count', count);
    return count;
  }
}

// Worker before:
const response = await stub.fetch('https://fake-host/increment');
const { count } = await response.json();

// Worker after:
const count = await stub.increment();
```

**Benefits:**
- ✅ ~60% less code
- ✅ Type-safe
- ✅ Cleaner, more maintainable

---

**Official Docs**: https://developers.cloudflare.com/durable-objects/best-practices/create-durable-object-stubs-and-send-requests/
