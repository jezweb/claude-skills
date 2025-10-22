---
name: cloudflare-durable-objects
description: |
  Comprehensive guide for Cloudflare Durable Objects - globally unique, stateful objects for coordination, real-time communication, and persistent state management.

  Use when: building real-time applications, creating WebSocket servers with hibernation, implementing chat rooms or multiplayer games, coordinating between multiple clients, managing per-user or per-room state, implementing rate limiting or session management, scheduling tasks with alarms, building queues or workflows, or encountering "do class export", "new_sqlite_classes", "migrations required", "websocket hibernation", "alarm api error", or "global uniqueness" errors.

  Prevents 15+ documented issues: class not exported, missing migrations, wrong migration type, constructor overhead blocking hibernation, setTimeout breaking hibernation, in-memory state lost on hibernation, outgoing WebSocket not hibernating, global uniqueness confusion, partial deleteAll on KV backend, binding name mismatches, state size limits exceeded, non-atomic migrations, location hints misunderstood, alarm retry failures, and fetch calls blocking hibernation.

  Keywords: durable objects, cloudflare do, DurableObject class, do bindings, websocket hibernation, do state api, ctx.storage.sql, ctx.acceptWebSocket, webSocketMessage, alarm() handler, storage.setAlarm, idFromName, newUniqueId, getByName, DurableObjectStub, serializeAttachment, real-time cloudflare, multiplayer cloudflare, chat room workers, coordination cloudflare, stateful workers, new_sqlite_classes, do migrations, location hints, RPC methods, blockConcurrencyWhile, "do class export", "new_sqlite_classes", "migrations required", "websocket hibernation", "alarm api error", "global uniqueness", "binding not found"
license: MIT
---

# Cloudflare Durable Objects

**Status**: Production Ready ✅
**Last Updated**: 2025-10-22
**Dependencies**: cloudflare-worker-base (recommended)
**Latest Versions**: wrangler@4.43.0+, @cloudflare/workers-types@4.20251014.0+
**Official Docs**: https://developers.cloudflare.com/durable-objects/

---

## What are Durable Objects?

Cloudflare Durable Objects are **globally unique, stateful objects** that provide:

- **Single-point coordination** - Each Durable Object instance is globally unique across Cloudflare's network
- **Strong consistency** - Transactional, serializable storage (ACID guarantees)
- **Real-time communication** - WebSocket Hibernation API for thousands of connections per instance
- **Persistent state** - Built-in SQLite database (up to 1GB) or key-value storage
- **Scheduled tasks** - Alarms API for future task execution
- **Global distribution** - Automatically routed to optimal location
- **Automatic scaling** - Millions of independent instances

**Use Cases**:
- Chat rooms and real-time collaboration
- Multiplayer game servers
- Rate limiting and session management
- Leader election and coordination
- WebSocket servers with hibernation
- Stateful workflows and queues
- Per-user or per-room logic

---

## Quick Start (10 Minutes)

### Option 1: Scaffold New DO Project

```bash
npm create cloudflare@latest my-durable-app -- \
  --template=cloudflare/durable-objects-template \
  --ts \
  --git \
  --deploy false

cd my-durable-app
npm install
npm run dev
```

**What this creates:**
- Complete Durable Objects project structure
- TypeScript configuration
- wrangler.jsonc with bindings and migrations
- Example DO class implementation
- Worker to call the DO

### Option 2: Add to Existing Worker

```bash
cd my-existing-worker
npm install -D @cloudflare/workers-types
```

**Create a Durable Object class** (`src/counter.ts`):

```typescript
import { DurableObject } from 'cloudflare:workers';

export class Counter extends DurableObject {
  async increment(): Promise<number> {
    // Get current value from storage (default to 0)
    let value: number = (await this.ctx.storage.get('value')) || 0;

    // Increment
    value += 1;

    // Save back to storage
    await this.ctx.storage.put('value', value);

    return value;
  }

  async get(): Promise<number> {
    return (await this.ctx.storage.get('value')) || 0;
  }
}

// CRITICAL: Export the class
export default Counter;
```

**Configure wrangler.jsonc:**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-22",

  // Durable Objects binding
  "durable_objects": {
    "bindings": [
      {
        "name": "COUNTER",           // How you access it: env.COUNTER
        "class_name": "Counter"      // MUST match exported class name
      }
    ]
  },

  // REQUIRED: Migration for new DO class
  "migrations": [
    {
      "tag": "v1",                   // Unique migration identifier
      "new_sqlite_classes": [        // Use SQLite backend (recommended)
        "Counter"
      ]
    }
  ]
}
```

**Call from Worker** (`src/index.ts`):

```typescript
import { Counter } from './counter';

interface Env {
  COUNTER: DurableObjectNamespace<Counter>;
}

export { Counter };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Get Durable Object stub by name
    const id = env.COUNTER.idFromName('global-counter');
    const stub = env.COUNTER.get(id);

    // Call RPC method on the DO
    const count = await stub.increment();

    return new Response(`Count: ${count}`);
  },
};
```

**Deploy:**

```bash
npx wrangler deploy
```

---

## Durable Object Class Structure

### Base Class Pattern

All Durable Objects **MUST extend `DurableObject`** from `cloudflare:workers`:

```typescript
import { DurableObject } from 'cloudflare:workers';

export class MyDurableObject extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Optional: Initialize from storage
    ctx.blockConcurrencyWhile(async () => {
      // Load state before handling requests
      this.someValue = await ctx.storage.get('someKey') || defaultValue;
    });
  }

  // RPC methods (recommended)
  async myMethod(): Promise<string> {
    return 'Hello from DO!';
  }

  // Optional: HTTP fetch handler
  async fetch(request: Request): Promise<Response> {
    return new Response('Hello from DO fetch!');
  }
}

// CRITICAL: Export the class
export default MyDurableObject;
```

### Constructor Pattern

```typescript
constructor(ctx: DurableObjectState, env: Env) {
  super(ctx, env);  // REQUIRED

  // Access to environment bindings
  this.env = env;

  // this.ctx provides:
  // - this.ctx.storage      (storage API)
  // - this.ctx.id           (unique ID)
  // - this.ctx.waitUntil()  (background tasks)
  // - this.ctx.acceptWebSocket() (WebSocket hibernation)
}
```

**CRITICAL Rules:**
- ✅ **Always call `super(ctx, env)`** first
- ✅ **Keep constructor minimal** - heavy work blocks hibernation wake-up
- ✅ **Use `ctx.blockConcurrencyWhile()`** to initialize from storage before requests
- ❌ **Never use `setTimeout` or `setInterval`** - breaks hibernation (use alarms instead)
- ❌ **Don't rely only on in-memory state** with WebSockets - persist to storage

### Exporting the Class

```typescript
// Export as default (required for Worker to use it)
export default MyDurableObject;

// Also export as named export (for type inference in Worker)
export { MyDurableObject };
```

**In Worker:**

```typescript
// Import the class for types
import { MyDurableObject } from './my-durable-object';

// Export it so Worker can instantiate it
export { MyDurableObject };

interface Env {
  MY_DO: DurableObjectNamespace<MyDurableObject>;
}
```

---

## State API - Persistent Storage

Durable Objects provide **two storage APIs** depending on the backend:

1. **SQL API** (SQLite backend) - **Recommended**
2. **Key-Value API** (KV or SQLite backend)

### Enable SQLite Backend (Recommended)

In `wrangler.jsonc` migrations:

```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["MyDurableObject"]  // ← Use this for SQLite
    }
  ]
}
```

**Why SQLite?**
- ✅ Up to **1GB storage** (vs 128MB for KV backend)
- ✅ **Atomic operations** (deleteAll is all-or-nothing)
- ✅ **SQL queries** with transactions
- ✅ **Point-in-time recovery** (PITR)
- ✅ Synchronous KV API available too

### SQL API

Access via `ctx.storage.sql`:

```typescript
import { DurableObject } from 'cloudflare:workers';

export class MyDurableObject extends DurableObject {
  sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;

    // Create table on first run
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        user TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_created_at ON messages(created_at);
    `);
  }

  async addMessage(text: string, user: string): Promise<number> {
    // Insert with exec (returns cursor)
    const cursor = this.sql.exec(
      'INSERT INTO messages (text, user, created_at) VALUES (?, ?, ?) RETURNING id',
      text,
      user,
      Date.now()
    );

    const row = cursor.one<{ id: number }>();
    return row.id;
  }

  async getMessages(limit: number = 50): Promise<any[]> {
    const cursor = this.sql.exec(
      'SELECT * FROM messages ORDER BY created_at DESC LIMIT ?',
      limit
    );

    // Convert cursor to array
    return cursor.toArray();
  }

  async deleteOldMessages(beforeTimestamp: number): Promise<void> {
    this.sql.exec(
      'DELETE FROM messages WHERE created_at < ?',
      beforeTimestamp
    );
  }
}
```

**SQL API Methods:**

```typescript
// Execute query (returns cursor)
const cursor = this.sql.exec('SELECT * FROM table WHERE id = ?', id);

// Get single row
const row = cursor.one<RowType>();

// Get first row or null
const row = cursor.one<RowType>({ allowNone: true });

// Get all rows as array
const rows = cursor.toArray<RowType>();

// Iterate cursor
for (const row of cursor) {
  // Process row
}

// Transactions (synchronous)
this.ctx.storage.transactionSync(() => {
  this.sql.exec('INSERT INTO table1 ...');
  this.sql.exec('UPDATE table2 ...');
  // All or nothing
});
```

**CRITICAL SQL Rules:**
- ✅ Always use **parameterized queries** with `?` placeholders
- ✅ Create indexes for frequently queried columns
- ✅ Use transactions for multi-statement operations
- ❌ Don't access the hidden `__cf_kv` table (used internally for KV API)
- ❌ Don't enable SQLite on existing deployed KV-backed DOs (not supported)

### Key-Value API

Available on **both SQLite and KV backends** via `ctx.storage`:

```typescript
import { DurableObject } from 'cloudflare:workers';

export class MyDurableObject extends DurableObject {
  async increment(): Promise<number> {
    // Get value
    let count = await this.ctx.storage.get<number>('count') || 0;

    // Increment
    count += 1;

    // Put value back
    await this.ctx.storage.put('count', count);

    return count;
  }

  async batchOperations(): Promise<void> {
    // Get multiple keys
    const map = await this.ctx.storage.get<number>(['key1', 'key2', 'key3']);

    // Put multiple keys
    await this.ctx.storage.put({
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    });

    // Delete key
    await this.ctx.storage.delete('key1');

    // Delete multiple keys
    await this.ctx.storage.delete(['key2', 'key3']);
  }

  async listKeys(): Promise<string[]> {
    // List all keys
    const map = await this.ctx.storage.list();
    return Array.from(map.keys());

    // List with prefix
    const mapWithPrefix = await this.ctx.storage.list({
      prefix: 'user:',
      limit: 100,
    });
  }

  async deleteAllStorage(): Promise<void> {
    // Delete alarm first (if set)
    await this.ctx.storage.deleteAlarm();

    // Delete all storage (DO will cease to exist after shutdown)
    await this.ctx.storage.deleteAll();
  }
}
```

**KV API Methods:**

```typescript
// Get single value
const value = await this.ctx.storage.get<T>('key');

// Get multiple values (returns Map)
const map = await this.ctx.storage.get<T>(['key1', 'key2']);

// Put single value
await this.ctx.storage.put('key', value);

// Put multiple values
await this.ctx.storage.put({ key1: value1, key2: value2 });

// Delete single key
await this.ctx.storage.delete('key');

// Delete multiple keys
await this.ctx.storage.delete(['key1', 'key2']);

// List keys
const map = await this.ctx.storage.list<T>({
  prefix: 'user:',
  limit: 100,
  reverse: false
});

// Delete all (atomic on SQLite, may be partial on KV backend)
await this.ctx.storage.deleteAll();

// Transactions (async)
await this.ctx.storage.transaction(async (txn) => {
  await txn.put('key1', value1);
  await txn.put('key2', value2);
  // All or nothing
});
```

**Storage Limits:**
- **SQLite backend**: Up to **1GB** storage per DO instance
- **KV backend**: Up to **128MB** storage per DO instance

---

## WebSocket Hibernation API

The **WebSocket Hibernation API** allows Durable Objects to:
- Handle **thousands of WebSocket connections** per instance
- **Hibernate** when idle (no messages, no events) to save costs
- **Wake up** automatically when messages arrive
- Maintain connections without incurring duration charges during idle periods

**Use for:** Chat rooms, real-time collaboration, multiplayer games, live updates

### How Hibernation Works

1. **Active state** - DO is in memory, handling messages
2. **Idle state** - No messages for ~10 seconds, DO can hibernate
3. **Hibernation** - In-memory state cleared, WebSockets stay connected to Cloudflare edge
4. **Wake up** - New message arrives → constructor runs → handler method called

**CRITICAL:** In-memory state is **lost on hibernation**. Use `serializeAttachment()` to persist per-WebSocket metadata.

### WebSocket Server Pattern

```typescript
import { DurableObject } from 'cloudflare:workers';

export class ChatRoom extends DurableObject {
  sessions: Map<WebSocket, { userId: string; username: string }>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Restore WebSocket connections after hibernation
    this.sessions = new Map();

    ctx.getWebSockets().forEach((ws) => {
      // Deserialize attachment (persisted metadata)
      const attachment = ws.deserializeAttachment();
      this.sessions.set(ws, attachment);
    });
  }

  async fetch(request: Request): Promise<Response> {
    // Expect WebSocket upgrade request
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected websocket', { status: 426 });
    }

    // Create WebSocket pair
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Get user info from URL or headers
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'anonymous';
    const username = url.searchParams.get('username') || 'Anonymous';

    // Accept WebSocket with hibernation
    // CRITICAL: Use ctx.acceptWebSocket(), NOT ws.accept()
    this.ctx.acceptWebSocket(server);

    // Serialize metadata to persist across hibernation
    const metadata = { userId, username };
    server.serializeAttachment(metadata);

    // Track in-memory (will be restored after hibernation)
    this.sessions.set(server, metadata);

    // Notify others
    this.broadcast(`${username} joined`, server);

    // Return client WebSocket to browser
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  // Called when WebSocket receives a message
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const session = this.sessions.get(ws);

    if (typeof message === 'string') {
      const data = JSON.parse(message);

      if (data.type === 'chat') {
        // Broadcast to all connections
        this.broadcast(`${session?.username}: ${data.text}`, ws);
      }
    }
  }

  // Called when WebSocket closes
  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    const session = this.sessions.get(ws);
    this.sessions.delete(ws);

    // Close the WebSocket
    ws.close(code, 'Durable Object closing WebSocket');

    // Notify others
    if (session) {
      this.broadcast(`${session.username} left`);
    }
  }

  // Called on WebSocket errors
  async webSocketError(ws: WebSocket, error: any): Promise<void> {
    console.error('WebSocket error:', error);
    const session = this.sessions.get(ws);
    this.sessions.delete(ws);
  }

  // Helper to broadcast to all connections
  broadcast(message: string, except?: WebSocket): void {
    this.sessions.forEach((session, ws) => {
      if (ws !== except && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'message', text: message }));
      }
    });
  }
}
```

**WebSocket Handler Methods:**

```typescript
// Receive message from client
async webSocketMessage(
  ws: WebSocket,
  message: string | ArrayBuffer
): Promise<void> {
  // Handle message
}

// WebSocket closed by client
async webSocketClose(
  ws: WebSocket,
  code: number,
  reason: string,
  wasClean: boolean
): Promise<void> {
  // Cleanup
}

// WebSocket error occurred
async webSocketError(
  ws: WebSocket,
  error: any
): Promise<void> {
  // Handle error
}
```

**Hibernation-Safe Patterns:**

```typescript
// ✅ CORRECT: Use ctx.acceptWebSocket (enables hibernation)
this.ctx.acceptWebSocket(server);

// ❌ WRONG: Don't use ws.accept() (standard API, no hibernation)
server.accept();

// ✅ CORRECT: Persist metadata across hibernation
server.serializeAttachment({ userId: '123', username: 'Alice' });

// ✅ CORRECT: Restore metadata in constructor
constructor(ctx, env) {
  super(ctx, env);

  ctx.getWebSockets().forEach((ws) => {
    const metadata = ws.deserializeAttachment();
    this.sessions.set(ws, metadata);
  });
}

// ❌ WRONG: Don't use setTimeout/setInterval (prevents hibernation)
setTimeout(() => { /* ... */ }, 1000);  // ❌ NEVER DO THIS

// ✅ CORRECT: Use alarms for scheduled tasks
await this.ctx.storage.setAlarm(Date.now() + 60000);
```

**When Hibernation Does NOT Occur:**
- `setTimeout` or `setInterval` callbacks are pending
- In-progress `fetch()` request (awaited I/O)
- Standard WebSocket API is used (not hibernation API)
- Request/event is still being processed

---

## Alarms API - Scheduled Tasks

The **Alarms API** allows Durable Objects to schedule themselves to wake up at a specific time in the future.

**Use for:** Batching, cleanup jobs, reminders, periodic tasks, delayed operations

### Basic Alarm Pattern

```typescript
import { DurableObject } from 'cloudflare:workers';

export class Batcher extends DurableObject {
  buffer: string[];

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    ctx.blockConcurrencyWhile(async () => {
      // Restore buffer from storage
      this.buffer = await ctx.storage.get('buffer') || [];
    });
  }

  async addItem(item: string): Promise<void> {
    this.buffer.push(item);
    await this.ctx.storage.put('buffer', this.buffer);

    // Schedule alarm for 10 seconds from now (if not already set)
    const currentAlarm = await this.ctx.storage.getAlarm();
    if (currentAlarm === null) {
      await this.ctx.storage.setAlarm(Date.now() + 10000);
    }
  }

  // Called when alarm fires
  async alarm(alarmInfo: { retryCount: number; isRetry: boolean }): Promise<void> {
    console.log(`Alarm fired (retry count: ${alarmInfo.retryCount})`);

    // Process batch
    if (this.buffer.length > 0) {
      await this.processBatch(this.buffer);

      // Clear buffer
      this.buffer = [];
      await this.ctx.storage.put('buffer', []);
    }

    // Alarm is automatically deleted after successful execution
  }

  async processBatch(items: string[]): Promise<void> {
    // Send to external API, write to database, etc.
    console.log(`Processing ${items.length} items:`, items);
  }
}
```

**Alarm API Methods:**

```typescript
// Set alarm to fire at specific timestamp
await this.ctx.storage.setAlarm(Date.now() + 60000);  // 60 seconds from now

// Set alarm to fire at specific date
await this.ctx.storage.setAlarm(new Date('2025-12-31T23:59:59Z'));

// Get current alarm (null if not set)
const alarmTime = await this.ctx.storage.getAlarm();

// Delete alarm
await this.ctx.storage.deleteAlarm();

// Alarm handler (called when alarm fires)
async alarm(alarmInfo: { retryCount: number; isRetry: boolean }): Promise<void> {
  // Do work
}
```

**Alarm Behavior:**
- ✅ **Guaranteed at-least-once execution** - will retry on failure
- ✅ **Automatic retries** - up to 6 retries with exponential backoff (starting at 2 seconds)
- ✅ **Persistent** - survives DO hibernation and eviction
- ✅ **Automatically deleted** after successful execution
- ⚠️ **One alarm per DO** - setting a new alarm overwrites the previous one

**Retry Pattern (Idempotent Operations):**

```typescript
async alarm(alarmInfo: { retryCount: number; isRetry: boolean }): Promise<void> {
  if (alarmInfo.retryCount > 3) {
    console.error('Alarm failed after 3 retries, giving up');
    return;
  }

  try {
    // Idempotent operation (safe to retry)
    await this.sendNotification();
  } catch (error) {
    console.error('Alarm failed:', error);
    throw error;  // Will trigger retry
  }
}
```

---

## RPC vs HTTP Fetch

Durable Objects support **two invocation patterns**:

1. **RPC (Remote Procedure Call)** - Recommended for new projects
2. **HTTP Fetch** - For HTTP request/response flows or legacy compatibility

### RPC Pattern (Recommended)

**Enable RPC** with compatibility date `>= 2024-04-03`:

```jsonc
{
  "compatibility_date": "2025-10-22"
}
```

**Define RPC methods** on DO class:

```typescript
export class Counter extends DurableObject {
  // Public RPC methods (automatically exposed)
  async increment(): Promise<number> {
    let value = await this.ctx.storage.get<number>('count') || 0;
    value += 1;
    await this.ctx.storage.put('count', value);
    return value;
  }

  async decrement(): Promise<number> {
    let value = await this.ctx.storage.get<number>('count') || 0;
    value -= 1;
    await this.ctx.storage.put('count', value);
    return value;
  }

  async get(): Promise<number> {
    return await this.ctx.storage.get<number>('count') || 0;
  }
}
```

**Call from Worker:**

```typescript
// Get stub
const id = env.COUNTER.idFromName('my-counter');
const stub = env.COUNTER.get(id);

// Call RPC methods directly
const count = await stub.increment();
const current = await stub.get();
```

**RPC Benefits:**
- ✅ **Type-safe** - TypeScript knows method signatures
- ✅ **Simple** - Direct method calls, no HTTP ceremony
- ✅ **Automatic serialization** - Handles structured data
- ✅ **Exception propagation** - Errors thrown in DO are received in Worker

### HTTP Fetch Pattern

**Define `fetch()` handler** on DO class:

```typescript
export class Counter extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/increment' && request.method === 'POST') {
      let value = await this.ctx.storage.get<number>('count') || 0;
      value += 1;
      await this.ctx.storage.put('count', value);
      return new Response(JSON.stringify({ count: value }));
    }

    if (url.pathname === '/get' && request.method === 'GET') {
      let value = await this.ctx.storage.get<number>('count') || 0;
      return new Response(JSON.stringify({ count: value }));
    }

    return new Response('Not found', { status: 404 });
  }
}
```

**Call from Worker:**

```typescript
// Get stub
const id = env.COUNTER.idFromName('my-counter');
const stub = env.COUNTER.get(id);

// Call fetch
const response = await stub.fetch('https://fake-host/increment', {
  method: 'POST',
});

const data = await response.json();
```

### When to Use Each

| Use Case | Recommendation |
|----------|----------------|
| **New project** | ✅ RPC (simpler, type-safe) |
| **HTTP request/response flow** | HTTP Fetch |
| **Complex routing logic** | HTTP Fetch |
| **Type safety important** | ✅ RPC |
| **Legacy compatibility** | HTTP Fetch |
| **WebSocket upgrades** | HTTP Fetch (required) |

---

## Creating Durable Object Stubs and Routing

To interact with a Durable Object from a Worker, you need to:
1. Get a **Durable Object ID**
2. Create a **stub** from the ID
3. Call methods on the stub

### Getting Durable Object IDs

**Three methods to create IDs:**

#### 1. `idFromName(name)` - Named DOs (Most Common)

Use when you want **consistent routing** to the same DO instance based on a name:

```typescript
// Same name always routes to same DO instance globally
const roomId = env.CHAT_ROOM.idFromName('room-123');
const userId = env.USER_SESSION.idFromName('user-alice');
const globalCounter = env.COUNTER.idFromName('global');
```

**Use for:**
- Chat rooms (name = room ID)
- User sessions (name = user ID)
- Per-tenant logic (name = tenant ID)
- Global singletons (name = 'global')

**Characteristics:**
- ✅ **Deterministic** - same name = same DO instance
- ✅ **Easy to reference** - just need the name string
- ⚠️ **First access latency** - ~100-300ms for global uniqueness check
- ⚠️ **Cached after first use** - subsequent access is fast

#### 2. `newUniqueId()` - Random IDs

Use when you need a **new, unique DO instance**:

```typescript
// Creates a random, globally unique ID
const id = env.MY_DO.newUniqueId();

// With jurisdiction restriction (EU data residency)
const euId = env.MY_DO.newUniqueId({ jurisdiction: 'eu' });

// Store the ID for future use
const idString = id.toString();
await env.KV.put('session:123', idString);
```

**Use for:**
- Creating new sessions/rooms that don't exist yet
- One-time use DOs
- When you don't have a natural name

**Characteristics:**
- ✅ **Lower latency** on first use (no global uniqueness check)
- ⚠️ **Must store ID** to access same DO later
- ⚠️ **ID format is opaque** - can't derive meaning from it

#### 3. `idFromString(idString)` - Recreate from Saved ID

Use when you've **previously stored an ID** and need to recreate it:

```typescript
// Get stored ID string (from KV, D1, cookie, etc.)
const idString = await env.KV.get('session:123');

// Recreate ID
const id = env.MY_DO.idFromString(idString);

// Get stub
const stub = env.MY_DO.get(id);
```

**Throws exception** if:
- ID string is invalid
- ID was not created from the same `DurableObjectNamespace`

### Getting Stubs

#### Method 1: `get(id)` - From ID

```typescript
const id = env.MY_DO.idFromName('my-instance');
const stub = env.MY_DO.get(id);

// Call methods
await stub.myMethod();
```

#### Method 2: `getByName(name)` - Shortcut for Named DOs

```typescript
// Shortcut that combines idFromName + get
const stub = env.MY_DO.getByName('my-instance');

// Equivalent to:
// const id = env.MY_DO.idFromName('my-instance');
// const stub = env.MY_DO.get(id);

await stub.myMethod();
```

**Recommended** for named DOs (cleaner code).

### Location Hints (Geographic Routing)

**Control WHERE a Durable Object is created** with location hints:

```typescript
// Create DO near specific location
const id = env.MY_DO.idFromName('user-alice');
const stub = env.MY_DO.get(id, { locationHint: 'enam' });  // Eastern North America

// Available location hints:
// - 'wnam' - Western North America
// - 'enam' - Eastern North America
// - 'sam'  - South America
// - 'weur' - Western Europe
// - 'eeur' - Eastern Europe
// - 'apac' - Asia-Pacific
// - 'oc'   - Oceania
// - 'afr'  - Africa
// - 'me'   - Middle East
```

**When to use:**
- ✅ Create DO near user's location (lower latency)
- ✅ Data residency requirements (e.g., EU users → weur/eeur)

**Limitations:**
- ⚠️ **Hints are best-effort** - not guaranteed
- ⚠️ **Only affects first creation** - subsequent access uses existing location
- ⚠️ **Cannot move existing DOs** - once created, location is fixed

### Jurisdiction Restriction (Data Residency)

**Enforce strict data location** requirements:

```typescript
// Create DO that MUST stay in EU
const euId = env.MY_DO.newUniqueId({ jurisdiction: 'eu' });

// Available jurisdictions:
// - 'eu' - European Union
// - 'fedramp' - FedRAMP (US government)
```

**Use for:**
- Regulatory compliance (GDPR, FedRAMP)
- Data sovereignty requirements

**CRITICAL:**
- ✅ **Strictly enforced** - DO will never leave jurisdiction
- ⚠️ **Cannot combine** jurisdiction with location hints
- ⚠️ **Higher latency** for users outside jurisdiction

---

## Migrations - Managing DO Classes

**Migrations are REQUIRED** when you:
- Create a new DO class
- Rename a DO class
- Delete a DO class
- Transfer a DO class to another Worker

**Migration Types:**

### 1. Create New DO Class

```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "COUNTER",
        "class_name": "Counter"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",                    // Unique identifier for this migration
      "new_sqlite_classes": [         // SQLite backend (recommended)
        "Counter"
      ]
    }
  ]
}
```

**For KV backend (legacy):**

```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["Counter"]      // KV backend (128MB limit)
    }
  ]
}
```

**CRITICAL:**
- ✅ Use `new_sqlite_classes` for new DOs (up to 1GB storage)
- ❌ Cannot enable SQLite on existing deployed KV-backed DOs

### 2. Rename DO Class

```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "MY_DO",
        "class_name": "NewClassName"    // New class name
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["OldClassName"]
    },
    {
      "tag": "v2",                      // New migration tag
      "renamed_classes": [
        {
          "from": "OldClassName",
          "to": "NewClassName"
        }
      ]
    }
  ]
}
```

**What happens:**
- ✅ Existing DO instances keep their data
- ✅ Old bindings automatically forward to new class
- ⚠️ **Must export new class** in Worker code

### 3. Delete DO Class

```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["Counter"]
    },
    {
      "tag": "v2",
      "deleted_classes": ["Counter"]    // Mark as deleted
    }
  ]
}
```

**What happens:**
- ✅ Existing DO instances are **deleted immediately**
- ✅ All storage is deleted
- ⚠️ **Cannot undo** - data is permanently lost

**Before deleting:**
- Export data if needed
- Update Workers that reference this DO

### 4. Transfer DO Class to Another Worker

```jsonc
// In destination Worker:
{
  "durable_objects": {
    "bindings": [
      {
        "name": "TRANSFERRED_DO",
        "class_name": "TransferredClass"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "transferred_classes": [
        {
          "from": "OriginalClass",
          "from_script": "original-worker",  // Source Worker name
          "to": "TransferredClass"
        }
      ]
    }
  ]
}
```

**What happens:**
- ✅ DO instances move to new Worker
- ✅ All storage is transferred
- ✅ Old bindings automatically forward
- ⚠️ **Destination class must be exported**

### Migration Rules

**CRITICAL Migration Gotchas:**

❌ **Migrations are ATOMIC** - cannot gradual deploy
- All instances migrate at once when you deploy
- No partial rollout support

❌ **Migration tags must be unique**
- Cannot reuse tags
- Tags are append-only

❌ **Cannot enable SQLite on existing KV-backed DOs**
- Must create new DO class instead

✅ **Code changes don't need migrations**
- Only schema changes (new/rename/delete/transfer) need migrations
- You can deploy code updates freely

✅ **Global uniqueness is per account**
- DO class names are unique across your entire account
- Even across different Workers

---

## Common Patterns

### Pattern 1: Rate Limiting (Per-User)

```typescript
export class RateLimiter extends DurableObject {
  async checkLimit(userId: string, limit: number, window: number): Promise<boolean> {
    const key = `rate:${userId}`;
    const now = Date.now();

    // Get recent requests
    const requests = await this.ctx.storage.get<number[]>(key) || [];

    // Remove requests outside window
    const validRequests = requests.filter(timestamp => now - timestamp < window);

    // Check limit
    if (validRequests.length >= limit) {
      return false;  // Rate limit exceeded
    }

    // Add current request
    validRequests.push(now);
    await this.ctx.storage.put(key, validRequests);

    return true;  // Within limit
  }
}

// Worker usage:
const limiter = env.RATE_LIMITER.getByName(userId);
const allowed = await limiter.checkLimit(userId, 100, 60000);  // 100 req/min

if (!allowed) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

### Pattern 2: Session Management

```typescript
export class UserSession extends DurableObject {
  sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS session (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at INTEGER
      );
    `);

    // Schedule cleanup alarm
    ctx.blockConcurrencyWhile(async () => {
      const alarm = await ctx.storage.getAlarm();
      if (alarm === null) {
        await ctx.storage.setAlarm(Date.now() + 3600000);  // 1 hour
      }
    });
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl : null;

    this.sql.exec(
      'INSERT OR REPLACE INTO session (key, value, expires_at) VALUES (?, ?, ?)',
      key,
      JSON.stringify(value),
      expiresAt
    );
  }

  async get(key: string): Promise<any | null> {
    const cursor = this.sql.exec(
      'SELECT value, expires_at FROM session WHERE key = ?',
      key
    );

    const row = cursor.one<{ value: string; expires_at: number | null }>({ allowNone: true });

    if (!row) {
      return null;
    }

    // Check expiration
    if (row.expires_at && row.expires_at < Date.now()) {
      this.sql.exec('DELETE FROM session WHERE key = ?', key);
      return null;
    }

    return JSON.parse(row.value);
  }

  async alarm(): Promise<void> {
    // Cleanup expired sessions
    this.sql.exec('DELETE FROM session WHERE expires_at < ?', Date.now());

    // Schedule next cleanup
    await this.ctx.storage.setAlarm(Date.now() + 3600000);
  }
}
```

### Pattern 3: Leader Election

```typescript
export class LeaderElection extends DurableObject {
  sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS leader (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        worker_id TEXT NOT NULL,
        elected_at INTEGER NOT NULL
      );
    `);
  }

  async electLeader(workerId: string): Promise<boolean> {
    // Try to become leader
    try {
      this.sql.exec(
        'INSERT INTO leader (id, worker_id, elected_at) VALUES (1, ?, ?)',
        workerId,
        Date.now()
      );
      return true;  // Became leader
    } catch (error) {
      return false;  // Someone else is leader
    }
  }

  async getLeader(): Promise<string | null> {
    const cursor = this.sql.exec('SELECT worker_id FROM leader WHERE id = 1');
    const row = cursor.one<{ worker_id: string }>({ allowNone: true });
    return row?.worker_id || null;
  }

  async releaseLeadership(workerId: string): Promise<void> {
    this.sql.exec('DELETE FROM leader WHERE id = 1 AND worker_id = ?', workerId);
  }
}
```

### Pattern 4: Multi-DO Coordination

```typescript
// Coordinator DO
export class GameCoordinator extends DurableObject {
  async createGame(gameId: string, env: Env): Promise<void> {
    // Create game room DO
    const gameRoom = env.GAME_ROOM.getByName(gameId);
    await gameRoom.initialize();

    // Track in coordinator
    await this.ctx.storage.put(`game:${gameId}`, {
      id: gameId,
      created: Date.now(),
    });
  }

  async listGames(): Promise<string[]> {
    const games = await this.ctx.storage.list({ prefix: 'game:' });
    return Array.from(games.keys()).map(key => key.replace('game:', ''));
  }
}

// Game room DO
export class GameRoom extends DurableObject {
  async initialize(): Promise<void> {
    await this.ctx.storage.put('state', {
      players: [],
      started: false,
    });
  }

  async addPlayer(playerId: string): Promise<void> {
    const state = await this.ctx.storage.get('state');
    state.players.push(playerId);
    await this.ctx.storage.put('state', state);
  }
}
```

---

## Critical Rules

### Always Do

✅ **Export DO class** from Worker
```typescript
export class MyDO extends DurableObject { }
export default MyDO;  // Required
```

✅ **Call `super(ctx, env)`** in constructor
```typescript
constructor(ctx: DurableObjectState, env: Env) {
  super(ctx, env);  // Required first line
}
```

✅ **Use `new_sqlite_classes`** for new DOs
```jsonc
{ "tag": "v1", "new_sqlite_classes": ["MyDO"] }
```

✅ **Use `ctx.acceptWebSocket()`** for hibernation
```typescript
this.ctx.acceptWebSocket(server);  // Enables hibernation
```

✅ **Persist critical state** to storage (not just memory)
```typescript
await this.ctx.storage.put('important', value);
```

✅ **Use alarms** instead of setTimeout/setInterval
```typescript
await this.ctx.storage.setAlarm(Date.now() + 60000);
```

✅ **Use parameterized SQL queries**
```typescript
this.sql.exec('SELECT * FROM table WHERE id = ?', id);
```

✅ **Minimize constructor work**
```typescript
constructor(ctx, env) {
  super(ctx, env);
  // Minimal initialization only
  ctx.blockConcurrencyWhile(async () => {
    // Load from storage
  });
}
```

### Never Do

❌ **Create DO without migration**
```jsonc
// Missing migrations array = error
```

❌ **Forget to export DO class**
```typescript
class MyDO extends DurableObject { }
// Missing: export default MyDO;
```

❌ **Use `setTimeout` or `setInterval`**
```typescript
setTimeout(() => {}, 1000);  // Prevents hibernation
```

❌ **Rely only on in-memory state** with WebSockets
```typescript
// ❌ WRONG: this.sessions will be lost on hibernation
// ✅ CORRECT: Use serializeAttachment()
```

❌ **Deploy migrations gradually**
```bash
# Migrations are atomic - cannot use gradual rollout
```

❌ **Enable SQLite on existing KV-backed DO**
```jsonc
// Not supported - must create new DO class instead
```

❌ **Use standard WebSocket API** expecting hibernation
```typescript
ws.accept();  // ❌ No hibernation
this.ctx.acceptWebSocket(ws);  // ✅ Hibernation enabled
```

❌ **Assume location hints are guaranteed**
```typescript
// Location hints are best-effort only
```

---

## Known Issues Prevention

This skill prevents **15+ documented issues**:

### Issue #1: Class Not Exported
**Error**: `"binding not found"` or `"Class X not found"`
**Source**: https://developers.cloudflare.com/durable-objects/get-started/
**Why It Happens**: DO class not exported from Worker
**Prevention**:
```typescript
export class MyDO extends DurableObject { }
export default MyDO;  // ← Required
```

### Issue #2: Missing Migration
**Error**: `"migrations required"` or `"no migration found for class"`
**Source**: https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/
**Why It Happens**: Created DO class without migration entry
**Prevention**: Always add migration when creating new DO class
```jsonc
{
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["MyDO"] }
  ]
}
```

### Issue #3: Wrong Migration Type (KV vs SQLite)
**Error**: Schema errors, storage API mismatch
**Source**: https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
**Why It Happens**: Used `new_classes` instead of `new_sqlite_classes`
**Prevention**: Use `new_sqlite_classes` for SQLite backend (recommended)

### Issue #4: Constructor Overhead Blocks Hibernation Wake
**Error**: Slow hibernation wake-up times
**Source**: https://developers.cloudflare.com/durable-objects/best-practices/access-durable-objects-storage/
**Why It Happens**: Heavy work in constructor
**Prevention**: Minimize constructor, use `blockConcurrencyWhile()`
```typescript
constructor(ctx, env) {
  super(ctx, env);
  ctx.blockConcurrencyWhile(async () => {
    // Load from storage
  });
}
```

### Issue #5: setTimeout Breaks Hibernation
**Error**: DO never hibernates, high duration charges
**Source**: https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/
**Why It Happens**: `setTimeout`/`setInterval` prevents hibernation
**Prevention**: Use alarms API instead
```typescript
// ❌ WRONG
setTimeout(() => {}, 1000);

// ✅ CORRECT
await this.ctx.storage.setAlarm(Date.now() + 1000);
```

### Issue #6: In-Memory State Lost on Hibernation
**Error**: WebSocket metadata lost, state reset unexpectedly
**Source**: https://developers.cloudflare.com/durable-objects/best-practices/websockets/
**Why It Happens**: Relied on in-memory state that's cleared on hibernation
**Prevention**: Use `serializeAttachment()` for WebSocket metadata
```typescript
ws.serializeAttachment({ userId, username });

// Restore in constructor
ctx.getWebSockets().forEach(ws => {
  const metadata = ws.deserializeAttachment();
  this.sessions.set(ws, metadata);
});
```

### Issue #7: Outgoing WebSocket Cannot Hibernate
**Error**: High charges despite hibernation API
**Source**: https://developers.cloudflare.com/durable-objects/best-practices/websockets/
**Why It Happens**: Outgoing WebSockets don't support hibernation
**Prevention**: Only use hibernation for server-side (incoming) WebSockets

### Issue #8: Global Uniqueness Confusion
**Error**: Unexpected DO class name conflicts
**Source**: https://developers.cloudflare.com/durable-objects/platform/known-issues/#global-uniqueness
**Why It Happens**: DO class names are globally unique per account
**Prevention**: Understand DO class names are shared across all Workers in account

### Issue #9: Partial deleteAll on KV Backend
**Error**: Storage not fully deleted, billing continues
**Source**: https://developers.cloudflare.com/durable-objects/api/legacy-kv-storage-api/
**Why It Happens**: KV backend `deleteAll()` can fail partially
**Prevention**: Use SQLite backend for atomic deleteAll

### Issue #10: Binding Name Mismatch
**Error**: Runtime error accessing DO binding
**Source**: https://developers.cloudflare.com/durable-objects/get-started/
**Why It Happens**: Binding name in wrangler.jsonc doesn't match code
**Prevention**: Ensure consistency
```jsonc
{ "bindings": [{ "name": "MY_DO", "class_name": "MyDO" }] }
```
```typescript
env.MY_DO.getByName('instance');  // Must match binding name
```

### Issue #11: State Size Exceeded
**Error**: `"state limit exceeded"` or storage errors
**Source**: https://developers.cloudflare.com/durable-objects/platform/pricing/
**Why It Happens**: Exceeded 1GB (SQLite) or 128MB (KV) limit
**Prevention**: Monitor storage size, implement cleanup with alarms

### Issue #12: Migration Not Atomic
**Error**: Gradual deployment blocked
**Source**: https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/
**Why It Happens**: Tried to use gradual rollout with migrations
**Prevention**: Migrations deploy atomically across all instances

### Issue #13: Location Hint Ignored
**Error**: DO created in wrong region
**Source**: https://developers.cloudflare.com/durable-objects/reference/data-location/
**Why It Happens**: Location hints are best-effort, not guaranteed
**Prevention**: Use jurisdiction for strict requirements

### Issue #14: Alarm Retry Failures
**Error**: Tasks lost after alarm failures
**Source**: https://developers.cloudflare.com/durable-objects/api/alarms/
**Why It Happens**: Alarm handler throws errors repeatedly
**Prevention**: Implement idempotent alarm handlers
```typescript
async alarm(info: { retryCount: number }): Promise<void> {
  if (info.retryCount > 3) {
    console.error('Giving up after 3 retries');
    return;
  }
  // Idempotent operation
}
```

### Issue #15: Fetch Blocks Hibernation
**Error**: DO never hibernates despite using hibernation API
**Source**: https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/
**Why It Happens**: In-progress `fetch()` requests prevent hibernation
**Prevention**: Ensure all async I/O completes before idle period

---

## Configuration Reference

### Complete wrangler.jsonc Example

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-22",

  // Durable Objects configuration
  "durable_objects": {
    "bindings": [
      {
        "name": "COUNTER",              // Binding name (use as env.COUNTER)
        "class_name": "Counter"         // Must match exported class
      },
      {
        "name": "CHAT_ROOM",
        "class_name": "ChatRoom"
      }
    ]
  },

  // Migrations (required for all DO changes)
  "migrations": [
    {
      "tag": "v1",                      // Initial migration
      "new_sqlite_classes": [
        "Counter",
        "ChatRoom"
      ]
    },
    {
      "tag": "v2",                      // Rename example
      "renamed_classes": [
        {
          "from": "Counter",
          "to": "CounterV2"
        }
      ]
    }
  ]
}
```

---

## TypeScript Types

```typescript
import { DurableObject, DurableObjectState, DurableObjectNamespace } from 'cloudflare:workers';

// Environment bindings
interface Env {
  MY_DO: DurableObjectNamespace<MyDurableObject>;
  DB: D1Database;
  // ... other bindings
}

// Durable Object class
export class MyDurableObject extends DurableObject<Env> {
  sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
  }

  async myMethod(): Promise<string> {
    // Access env bindings
    await this.env.DB.prepare('...').run();
    return 'Hello';
  }
}
```

---

## Official Documentation

- **Durable Objects**: https://developers.cloudflare.com/durable-objects/
- **State API (SQL)**: https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- **WebSocket Hibernation**: https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- **Alarms API**: https://developers.cloudflare.com/durable-objects/api/alarms/
- **Migrations**: https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/
- **Best Practices**: https://developers.cloudflare.com/durable-objects/best-practices/
- **Pricing**: https://developers.cloudflare.com/durable-objects/platform/pricing/

---

**Questions? Issues?**

1. Check `references/top-errors.md` for common problems
2. Review `templates/` for working examples
3. Consult official docs: https://developers.cloudflare.com/durable-objects/
4. Verify migrations configuration carefully
