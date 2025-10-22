# Top 15+ Documented Errors and Solutions

Complete reference for common Durable Objects errors and how to prevent them.

---

## 1. Class Not Exported

**Error:** `"binding not found"`, `"Class X not found"`

**Source:** https://developers.cloudflare.com/durable-objects/get-started/

**Why It Happens:** Durable Object class not exported from Worker

**Solution:**
```typescript
export class MyDO extends DurableObject { }

// CRITICAL: Export as default
export default MyDO;

// In Worker, also export for Wrangler
export { MyDO };
```

---

## 2. Missing Migration

**Error:** `"migrations required"`, `"no migration found for class"`

**Source:** https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/

**Why It Happens:** Created DO class without migration entry

**Solution:** Always add migration when creating new DO class
```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["MyDO"]
    }
  ]
}
```

---

## 3. Wrong Migration Type (KV vs SQLite)

**Error:** Schema errors, storage API mismatch

**Source:** https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/

**Why It Happens:** Used `new_classes` instead of `new_sqlite_classes`

**Solution:** Use `new_sqlite_classes` for SQLite backend (recommended)
```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["MyDO"]  // ← SQLite (1GB, atomic)
    }
  ]
}
```

---

## 4. Constructor Overhead Blocks Hibernation Wake

**Error:** Slow hibernation wake-up times, high latency

**Source:** https://developers.cloudflare.com/durable-objects/best-practices/access-durable-objects-storage/

**Why It Happens:** Heavy work in constructor delays all requests

**Solution:** Minimize constructor, use `blockConcurrencyWhile()`
```typescript
constructor(ctx, env) {
  super(ctx, env);

  // Minimal initialization
  this.sessions = new Map();

  // Load from storage (blocks requests until complete)
  ctx.blockConcurrencyWhile(async () => {
    this.data = await ctx.storage.get('data');
  });
}
```

---

## 5. setTimeout Breaks Hibernation

**Error:** DO never hibernates, high duration charges

**Source:** https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/

**Why It Happens:** `setTimeout`/`setInterval` prevents hibernation

**Solution:** Use alarms API instead
```typescript
// ❌ WRONG: Prevents hibernation
setTimeout(() => this.doWork(), 60000);

// ✅ CORRECT: Allows hibernation
await this.ctx.storage.setAlarm(Date.now() + 60000);

async alarm() {
  this.doWork();
}
```

---

## 6. In-Memory State Lost on Hibernation

**Error:** WebSocket metadata lost, state reset unexpectedly

**Source:** https://developers.cloudflare.com/durable-objects/best-practices/websockets/

**Why It Happens:** Relied on in-memory state that's cleared on hibernation

**Solution:** Use `serializeAttachment()` for WebSocket metadata
```typescript
// Persist metadata
ws.serializeAttachment({ userId, username });

// Restore in constructor
constructor(ctx, env) {
  super(ctx, env);

  this.sessions = new Map();

  ctx.getWebSockets().forEach(ws => {
    const metadata = ws.deserializeAttachment();
    this.sessions.set(ws, metadata);
  });
}
```

---

## 7. Outgoing WebSocket Cannot Hibernate

**Error:** High charges despite using hibernation API

**Source:** https://developers.cloudflare.com/durable-objects/best-practices/websockets/

**Why It Happens:** Outgoing WebSockets don't support hibernation

**Solution:** Only use hibernation for server-side (incoming) WebSockets

**Note:** DO must be WebSocket server, not client.

---

## 8. Global Uniqueness Confusion

**Error:** Unexpected DO class name conflicts across Workers

**Source:** https://developers.cloudflare.com/durable-objects/platform/known-issues/#global-uniqueness

**Why It Happens:** DO class names are globally unique per account

**Solution:** Understand scope and use unique class names
```typescript
// Worker A
export class CounterA extends DurableObject { }

// Worker B
export class CounterB extends DurableObject { }

// ❌ WRONG: Both use "Counter" → conflict
```

---

## 9. Partial deleteAll on KV Backend

**Error:** Storage not fully deleted, billing continues

**Source:** https://developers.cloudflare.com/durable-objects/api/legacy-kv-storage-api/

**Why It Happens:** KV backend `deleteAll()` can fail partially

**Solution:** Use SQLite backend for atomic deleteAll
```jsonc
{
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["MyDO"] }  // Atomic operations
  ]
}
```

---

## 10. Binding Name Mismatch

**Error:** Runtime error accessing DO binding, `undefined`

**Source:** https://developers.cloudflare.com/durable-objects/get-started/

**Why It Happens:** Binding name in wrangler.jsonc doesn't match code

**Solution:** Ensure consistency
```jsonc
{
  "durable_objects": {
    "bindings": [
      { "name": "MY_DO", "class_name": "MyDO" }
    ]
  }
}
```

```typescript
// Must match binding name
env.MY_DO.getByName('instance');
```

---

## 11. State Size Exceeded

**Error:** `"state limit exceeded"`, storage errors

**Source:** https://developers.cloudflare.com/durable-objects/platform/pricing/

**Why It Happens:** Exceeded 1GB (SQLite) or 128MB (KV) limit

**Solution:** Monitor storage size, implement cleanup
```typescript
async checkStorageSize(): Promise<void> {
  const size = await this.estimateSize();

  if (size > 900_000_000) {  // 900MB
    await this.cleanup();
  }
}

async alarm() {
  // Periodic cleanup
  const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
  this.sql.exec('DELETE FROM messages WHERE created_at < ?', cutoff);

  await this.ctx.storage.setAlarm(Date.now() + 86400000);
}
```

---

## 12. Migration Not Atomic

**Error:** Gradual deployment blocked, migration errors

**Source:** https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/

**Why It Happens:** Tried to use gradual rollout with migrations

**Solution:** Understand migrations deploy atomically
- All DO instances migrate at once
- Cannot use gradual deployment with migrations
- Test thoroughly before deploying

---

## 13. Location Hint Ignored

**Error:** DO created in wrong region, higher latency

**Source:** https://developers.cloudflare.com/durable-objects/reference/data-location/

**Why It Happens:** Location hints are best-effort, not guaranteed

**Solution:** Use jurisdiction for strict requirements
```typescript
// ⚠️ Best-effort (not guaranteed)
const stub = env.MY_DO.get(id, { locationHint: 'enam' });

// ✅ Strictly enforced
const euId = env.MY_DO.newUniqueId({ jurisdiction: 'eu' });
const stub = env.MY_DO.get(euId);
```

---

## 14. Alarm Retry Failures

**Error:** Tasks lost after repeated alarm failures

**Source:** https://developers.cloudflare.com/durable-objects/api/alarms/

**Why It Happens:** Alarm handler throws errors repeatedly, exhausts retries

**Solution:** Implement idempotent alarm handlers with retry limits
```typescript
async alarm(info: { retryCount: number }): Promise<void> {
  if (info.retryCount > 3) {
    console.error('Giving up after 3 retries');
    // Log failure, clean up state
    await this.logFailure();
    return;
  }

  // Idempotent operation (safe to retry)
  await this.processWithIdempotency();
}
```

---

## 15. Fetch Blocks Hibernation

**Error:** DO never hibernates despite using hibernation API

**Source:** https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/

**Why It Happens:** In-progress `fetch()` requests prevent hibernation

**Solution:** Ensure all async I/O completes before idle period
```typescript
async webSocketMessage(ws: WebSocket, message: string): Promise<void> {
  // ✅ GOOD: Await all I/O before returning
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
  ws.send(JSON.stringify(data));
  // Handler completes → can hibernate

  // ❌ BAD: Background fetch prevents hibernation
  this.ctx.waitUntil(
    fetch('https://api.example.com/log').then(r => r.json())
  );
}
```

---

## 16. Cannot Enable SQLite on Existing KV DO

**Error:** Migration fails, schema errors

**Source:** https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/

**Why It Happens:** Attempted to migrate existing KV-backed DO to SQLite

**Solution:** Create new SQLite-backed DO class, migrate data manually
```jsonc
// ❌ WRONG: Cannot change existing DO backend
{
  "migrations": [
    { "tag": "v1", "new_classes": ["Counter"] },  // KV backend
    { "tag": "v2", "renamed_classes": [{ "from": "Counter", "to": "CounterSQLite" }] }
    // This doesn't change backend!
  ]
}

// ✅ CORRECT: Create new class
{
  "migrations": [
    { "tag": "v1", "new_classes": ["Counter"] },
    { "tag": "v2", "new_sqlite_classes": ["CounterV2"] }
  ]
}

// Then migrate data from Counter to CounterV2
```

---

## 17. SQL Injection Vulnerability

**Error:** Security vulnerability, data breach

**Source:** https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/

**Why It Happens:** String concatenation in SQL queries

**Solution:** Always use parameterized queries
```typescript
// ❌ WRONG: SQL injection risk
this.sql.exec(`SELECT * FROM users WHERE email = '${userEmail}'`);

// ✅ CORRECT: Parameterized query
this.sql.exec('SELECT * FROM users WHERE email = ?', userEmail);
```

---

## 18. Standard WebSocket API Used

**Error:** High duration charges, no hibernation

**Source:** https://developers.cloudflare.com/durable-objects/best-practices/websockets/

**Why It Happens:** Used `ws.accept()` instead of `ctx.acceptWebSocket()`

**Solution:** Use hibernation API
```typescript
// ❌ WRONG: Standard API, no hibernation
server.accept();

// ✅ CORRECT: Hibernation API
this.ctx.acceptWebSocket(server);
```

---

## Quick Error Lookup

| Error Message | Issue # | Quick Fix |
|---------------|---------|-----------|
| "binding not found" | #1 | Export DO class |
| "migrations required" | #2 | Add migration |
| Slow wake-up | #4 | Minimize constructor |
| High duration charges | #5, #15 | Use alarms, await I/O |
| State lost | #6 | serializeAttachment |
| "state limit exceeded" | #11 | Implement cleanup |
| "SQL injection" | #17 | Parameterized queries |

---

**For more help:** Check official docs and GitHub issues at https://github.com/cloudflare/workerd/issues
