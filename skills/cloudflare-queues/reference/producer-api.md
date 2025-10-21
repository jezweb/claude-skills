# Producer API Reference

Complete reference for sending messages to Cloudflare Queues from Workers.

---

## Queue Binding

Access queues via environment bindings configured in `wrangler.jsonc`:

```jsonc
{
  "queues": {
    "producers": [
      {
        "binding": "MY_QUEUE",
        "queue": "my-queue"
      }
    ]
  }
}
```

**TypeScript:**

```typescript
type Bindings = {
  MY_QUEUE: Queue;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post('/send', async (c) => {
  await c.env.MY_QUEUE.send({ data: 'hello' });
  return c.json({ sent: true });
});
```

---

## `send()` - Send Single Message

### Signature

```typescript
interface Queue<Body = any> {
  send(body: Body, options?: QueueSendOptions): Promise<void>;
}

interface QueueSendOptions {
  delaySeconds?: number;  // 0-43200 (12 hours)
}
```

### Parameters

- **`body`** - Any JSON serializable value
  - Must be compatible with structured clone algorithm
  - Max size: 128 KB (including ~100 bytes metadata)
  - Types: primitives, objects, arrays, Date, Map, Set, etc.
  - NOT supported: Functions, Symbols, DOM nodes

- **`options.delaySeconds`** (optional)
  - Delay message delivery
  - Range: 0-43200 seconds (0-12 hours)
  - Default: 0 (immediate delivery)

### Examples

```typescript
// Send simple message
await env.MY_QUEUE.send({ userId: '123', action: 'welcome' });

// Send with delay (10 minutes)
await env.MY_QUEUE.send(
  { userId: '123', action: 'reminder' },
  { delaySeconds: 600 }
);

// Send complex object
await env.MY_QUEUE.send({
  type: 'order',
  order: {
    id: 'ORD-123',
    items: [
      { sku: 'ITEM-1', quantity: 2, price: 19.99 },
      { sku: 'ITEM-2', quantity: 1, price: 29.99 },
    ],
    total: 69.97,
    customer: {
      id: 'CUST-456',
      email: 'user@example.com',
    },
    metadata: {
      source: 'web',
      campaign: 'summer-sale',
    },
  },
  timestamp: Date.now(),
});

// Send with Date objects
await env.MY_QUEUE.send({
  scheduledFor: new Date('2025-12-25T00:00:00Z'),
  createdAt: new Date(),
});
```

---

## `sendBatch()` - Send Multiple Messages

### Signature

```typescript
interface Queue<Body = any> {
  sendBatch(
    messages: Iterable<MessageSendRequest<Body>>,
    options?: QueueSendBatchOptions
  ): Promise<void>;
}

interface MessageSendRequest<Body = any> {
  body: Body;
  delaySeconds?: number;
}

interface QueueSendBatchOptions {
  delaySeconds?: number;  // Default delay for all messages
}
```

### Parameters

- **`messages`** - Iterable of message objects
  - Each message has `body` and optional `delaySeconds`
  - Max 100 messages per batch
  - Max 256 KB total batch size
  - Can be Array, Set, Generator, etc.

- **`options.delaySeconds`** (optional)
  - Default delay applied to all messages
  - Overridden by individual message `delaySeconds`

### Examples

```typescript
// Send batch of messages
await env.MY_QUEUE.sendBatch([
  { body: { userId: '1', action: 'email' } },
  { body: { userId: '2', action: 'email' } },
  { body: { userId: '3', action: 'email' } },
]);

// Send batch with individual delays
await env.MY_QUEUE.sendBatch([
  { body: { task: 'immediate' }, delaySeconds: 0 },
  { body: { task: '5-min' }, delaySeconds: 300 },
  { body: { task: '1-hour' }, delaySeconds: 3600 },
]);

// Send batch with default delay (overridable per message)
await env.MY_QUEUE.sendBatch(
  [
    { body: { task: 'default-delay' } },
    { body: { task: 'custom-delay' }, delaySeconds: 600 },
  ],
  { delaySeconds: 300 } // Default 5 minutes
);

// Dynamic batch from database
const users = await getActiveUsers();
await env.MY_QUEUE.sendBatch(
  users.map(user => ({
    body: {
      type: 'send-notification',
      userId: user.id,
      email: user.email,
      message: 'You have a new message',
    },
  }))
);

// Generator pattern
async function* generateMessages() {
  for (let i = 0; i < 100; i++) {
    yield {
      body: { taskId: i, priority: i % 3 },
    };
  }
}

await env.MY_QUEUE.sendBatch(generateMessages());
```

---

## Message Size Validation

Messages must be ≤128 KB. Check size before sending:

```typescript
async function sendWithValidation(queue: Queue, message: any) {
  const messageStr = JSON.stringify(message);
  const size = new TextEncoder().encode(messageStr).length;
  const MAX_SIZE = 128 * 1024; // 128 KB

  if (size > MAX_SIZE) {
    throw new Error(
      `Message too large: ${size} bytes (max ${MAX_SIZE})`
    );
  }

  await queue.send(message);
}
```

**Handling large messages:**

```typescript
// Store large data in R2, send reference
if (size > 128 * 1024) {
  const key = `messages/${crypto.randomUUID()}.json`;
  await env.MY_BUCKET.put(key, JSON.stringify(largeMessage));

  await env.MY_QUEUE.send({
    type: 'large-message',
    r2Key: key,
    metadata: {
      size,
      createdAt: Date.now(),
    },
  });
}
```

---

## Throughput Management

Max throughput: 5,000 messages/second per queue.

**Rate limiting:**

```typescript
// Batch sends for better throughput
const messages = Array.from({ length: 1000 }, (_, i) => ({
  body: { id: i },
}));

// Send in batches of 100 (10 sendBatch calls vs 1000 send calls)
for (let i = 0; i < messages.length; i += 100) {
  const batch = messages.slice(i, i + 100);
  await env.MY_QUEUE.sendBatch(batch);
}

// Add delay if needed
for (let i = 0; i < messages.length; i += 100) {
  const batch = messages.slice(i, i + 100);
  await env.MY_QUEUE.sendBatch(batch);

  if (i + 100 < messages.length) {
    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms
  }
}
```

---

## Error Handling

```typescript
try {
  await env.MY_QUEUE.send(message);
} catch (error) {
  if (error.message.includes('Too Many Requests')) {
    // Throughput exceeded (>5000 msg/s)
    console.error('Rate limited');
  } else if (error.message.includes('too large')) {
    // Message >128 KB
    console.error('Message too large');
  } else {
    // Other error
    console.error('Queue send failed:', error);
  }
}
```

---

## Production Patterns

### Idempotency Keys

```typescript
await env.MY_QUEUE.send({
  idempotencyKey: crypto.randomUUID(),
  orderId: 'ORD-123',
  action: 'process',
});
```

### Message Versioning

```typescript
await env.MY_QUEUE.send({
  _version: 1,
  _schema: 'order-v1',
  orderId: 'ORD-123',
  // ...
});
```

### Correlation IDs

```typescript
await env.MY_QUEUE.send({
  correlationId: requestId,
  parentSpanId: traceId,
  // ...
});
```

### Priority Queues

```typescript
// Use multiple queues for different priorities
if (priority === 'high') {
  await env.HIGH_PRIORITY_QUEUE.send(message);
} else {
  await env.LOW_PRIORITY_QUEUE.send(message);
}
```

---

**Last Updated**: 2025-10-21
