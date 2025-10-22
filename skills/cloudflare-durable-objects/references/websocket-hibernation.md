# WebSocket Hibernation API Deep Dive

Complete guide to WebSocket hibernation for cost savings.

---

## Why WebSocket Hibernation?

Traditional WebSocket connections keep the Durable Object **active in memory**, incurring duration charges even when idle.

**With Hibernation:**
- ✅ DO hibernates when idle (~10 seconds no activity)
- ✅ WebSocket clients **stay connected** to Cloudflare edge
- ✅ DO wakes up automatically when messages arrive
- ✅ **Massive cost savings** for long-lived connections

**Cost Example:**
- 1000 WebSocket connections for 1 hour
- Without hibernation: ~$0.50/hour (assuming 90% idle time)
- With hibernation: ~$0.05/hour
- **~90% savings**

---

## Hibernation Lifecycle

```
1. ACTIVE     → DO in memory, handling messages
2. IDLE       → No messages for ~10 seconds
3. HIBERNATE  → In-memory state cleared, WebSockets stay connected
4. WAKE       → New message → constructor runs → handler called
```

**CRITICAL:** In-memory state is **LOST** on hibernation!

---

## Enable Hibernation

### Use `ctx.acceptWebSocket()`

```typescript
// ✅ CORRECT: Enables hibernation
this.ctx.acceptWebSocket(server);

// ❌ WRONG: Standard API, NO hibernation
server.accept();
```

**Only works for server-side (incoming) WebSockets.**

---

## Handler Methods

### `webSocketMessage(ws, message)`

Called when WebSocket receives a message (even if hibernated).

```typescript
async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
  if (typeof message === 'string') {
    const data = JSON.parse(message);
    // Handle message
  }
}
```

**Parameters:**
- `ws` (WebSocket): The WebSocket that received the message
- `message` (string | ArrayBuffer): The message data

### `webSocketClose(ws, code, reason, wasClean)`

Called when WebSocket closes.

```typescript
async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
  // Cleanup
  this.sessions.delete(ws);

  // Close the WebSocket
  ws.close(code, 'Durable Object closing WebSocket');
}
```

**Parameters:**
- `ws` (WebSocket): The WebSocket that closed
- `code` (number): Close code
- `reason` (string): Close reason
- `wasClean` (boolean): True if closed cleanly

### `webSocketError(ws, error)`

Called on WebSocket errors (not disconnections).

```typescript
async webSocketError(ws: WebSocket, error: any): Promise<void> {
  console.error('WebSocket error:', error);
  this.sessions.delete(ws);
}
```

---

## Persist Metadata with Attachments

Use `serializeAttachment()` / `deserializeAttachment()` to persist per-WebSocket metadata across hibernation.

### Serialize on Accept

```typescript
const metadata = { userId: '123', username: 'Alice' };

// Persist metadata
server.serializeAttachment(metadata);

// Track in-memory
this.sessions.set(server, metadata);
```

### Deserialize in Constructor

```typescript
constructor(ctx: DurableObjectState, env: Env) {
  super(ctx, env);

  // Restore WebSocket connections after hibernation
  this.sessions = new Map();

  ctx.getWebSockets().forEach((ws) => {
    // Restore metadata
    const metadata = ws.deserializeAttachment();
    this.sessions.set(ws, metadata);
  });
}
```

**CRITICAL:** Metadata is **persisted to storage**, not just memory.

---

## Get Active WebSockets

```typescript
// Get all WebSockets accepted by this DO
const webSockets = this.ctx.getWebSockets();

console.log(`${webSockets.length} active connections`);

// Filter by tag (if tagged)
const taggedWs = this.ctx.getWebSockets('room:123');
```

---

## Tag WebSockets (Optional)

Tag WebSockets for grouping (e.g., by room, channel).

```typescript
// Accept with tag
this.ctx.acceptWebSocket(server, ['room:123']);

// Get by tag
const roomSockets = this.ctx.getWebSockets('room:123');

// Get all tags
const tags = ws.getTags();
```

---

## When Hibernation Does NOT Occur

Hibernation is **blocked** if:

❌ `setTimeout` or `setInterval` callbacks are pending
❌ In-progress `fetch()` request (awaited I/O)
❌ Standard WebSocket API used (not hibernation API)
❌ Request/event still being processed
❌ Outgoing WebSocket (DO is client, not server)

---

## Best Practices

### Minimize Constructor Work

Heavy work in constructor **delays wake-up**.

```typescript
// ✅ GOOD: Minimal constructor
constructor(ctx, env) {
  super(ctx, env);

  this.sessions = new Map();

  ctx.getWebSockets().forEach((ws) => {
    const metadata = ws.deserializeAttachment();
    this.sessions.set(ws, metadata);
  });
}

// ❌ BAD: Heavy work delays wake-up
constructor(ctx, env) {
  super(ctx, env);

  // Don't do expensive I/O here
  await this.loadLotsOfData();
}
```

### Use Alarms, Not setTimeout

```typescript
// ❌ WRONG: Prevents hibernation
setTimeout(() => {
  this.doSomething();
}, 60000);

// ✅ CORRECT: Use alarms
await this.ctx.storage.setAlarm(Date.now() + 60000);

async alarm() {
  this.doSomething();
}
```

### Persist Critical State

```typescript
// ❌ WRONG: Only in-memory (lost on hibernation)
this.userCount = 42;

// ✅ CORRECT: Persist to storage
await this.ctx.storage.put('userCount', 42);

// Or use serializeAttachment for per-WebSocket data
ws.serializeAttachment({ userId, username });
```

---

## Debugging Hibernation

### Check if DO is Hibernating

```typescript
// Log in constructor
constructor(ctx, env) {
  super(ctx, env);
  console.log('DO woke up! Active WebSockets:', ctx.getWebSockets().length);
}

// If you see this log frequently, DO is hibernating
```

### Common Issues

**Issue:** DO never hibernates (high duration charges)

**Possible Causes:**
- `setTimeout`/`setInterval` active
- In-progress `fetch()` requests
- Standard WebSocket API used (`ws.accept()` instead of `ctx.acceptWebSocket()`)

**Solution:** Check for blocking operations, use alarms instead.

---

## Limitations

⚠️ **Hibernation only for server-side WebSockets**
- DO must be WebSocket server (accept connections)
- Outgoing WebSockets (DO as client) **cannot hibernate**

⚠️ **In-memory state is lost**
- Restore state in constructor
- Use `serializeAttachment()` for per-WebSocket metadata
- Use storage for DO-wide state

⚠️ **No WebSocket Standard API** with hibernation
- Cannot use `addEventListener('message', ...)`
- Must use handler methods (`webSocketMessage`, etc.)

---

**Official Docs**: https://developers.cloudflare.com/durable-objects/best-practices/websockets/
