---
name: Cloudflare Queues
description: |
  Complete knowledge domain for Cloudflare Queues - flexible message queue for asynchronous processing
  and background tasks on Cloudflare Workers.

  Use when: creating message queues, async processing, background jobs, batch processing, handling retries,
  configuring dead letter queues, implementing consumer concurrency, or encountering "queue timeout",
  "batch retry", "message lost", "throughput exceeded", "consumer not scaling" errors.

  Keywords: cloudflare queues, queues workers, message queue, queue bindings, async processing,
  background jobs, queue consumer, queue producer, batch processing, dead letter queue, dlq,
  message retry, queue ack, consumer concurrency, queue backlog, wrangler queues
---

# Cloudflare Queues

**Status**: Production Ready ✅
**Last Updated**: 2025-10-21
**Dependencies**: cloudflare-worker-base (for Worker setup)
**Latest Versions**: wrangler@4.43.0, @cloudflare/workers-types@4.20251014.0

---

## Quick Start (10 Minutes)

### 1. Create a Queue

```bash
# Create a new queue
npx wrangler queues create my-queue

# Output:
# ✅ Successfully created queue my-queue

# List all queues
npx wrangler queues list

# Get queue info
npx wrangler queues info my-queue
```

### 2. Set Up Producer (Send Messages)

**wrangler.jsonc:**

```jsonc
{
  "name": "my-producer",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-11",
  "queues": {
    "producers": [
      {
        "binding": "MY_QUEUE",           // Available as env.MY_QUEUE
        "queue": "my-queue"               // Queue name from step 1
      }
    ]
  }
}
```

**src/index.ts (Producer):**

```typescript
import { Hono } from 'hono';

type Bindings = {
  MY_QUEUE: Queue;
};

const app = new Hono<{ Bindings: Bindings }>();

// Send single message
app.post('/send', async (c) => {
  const body = await c.req.json();

  await c.env.MY_QUEUE.send({
    userId: body.userId,
    action: 'process-order',
    timestamp: Date.now(),
  });

  return c.json({ status: 'queued' });
});

// Send batch of messages
app.post('/send-batch', async (c) => {
  const items = await c.req.json();

  await c.env.MY_QUEUE.sendBatch(
    items.map((item) => ({
      body: { userId: item.userId, action: item.action },
    }))
  );

  return c.json({ status: 'queued', count: items.length });
});

export default app;
```

### 3. Set Up Consumer (Process Messages)

**Create consumer Worker:**

```bash
# In a new directory
npm create cloudflare@latest my-consumer -- --type hello-world --ts
cd my-consumer
```

**wrangler.jsonc:**

```jsonc
{
  "name": "my-consumer",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-11",
  "queues": {
    "consumers": [
      {
        "queue": "my-queue",              // Queue to consume from
        "max_batch_size": 10,             // Process up to 10 messages at once
        "max_batch_timeout": 5            // Or wait max 5 seconds
      }
    ]
  }
}
```

**src/index.ts (Consumer):**

```typescript
export default {
  async queue(
    batch: MessageBatch,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log(`Processing batch of ${batch.messages.length} messages`);

    for (const message of batch.messages) {
      console.log('Message:', message.id, message.body, `Attempt: ${message.attempts}`);

      // Your processing logic here
      await processMessage(message.body);
    }

    // Implicit acknowledgement: if this function returns without error,
    // all messages are automatically acknowledged
  },
};

async function processMessage(body: any) {
  // Process the message
  console.log('Processing:', body);
}
```

### 4. Deploy and Test

```bash
# Deploy producer
cd my-producer
npm run deploy

# Deploy consumer
cd my-consumer
npm run deploy

# Test by sending a message
curl -X POST https://my-producer.<your-subdomain>.workers.dev/send \
  -H "Content-Type: application/json" \
  -d '{"userId": "123", "action": "welcome-email"}'

# Watch consumer logs
npx wrangler tail my-consumer
```

---

## Complete Producer API

### `send()` - Send Single Message

```typescript
interface QueueSendOptions {
  delaySeconds?: number;  // Delay delivery (0-43200 seconds / 12 hours)
}

await env.MY_QUEUE.send(body: any, options?: QueueSendOptions);
```

**Examples:**

```typescript
// Simple send
await env.MY_QUEUE.send({ userId: '123', action: 'send-email' });

// Send with delay (10 minutes)
await env.MY_QUEUE.send(
  { userId: '123', action: 'reminder' },
  { delaySeconds: 600 }
);

// Send structured data
await env.MY_QUEUE.send({
  type: 'order-confirmation',
  orderId: 'ORD-123',
  email: 'user@example.com',
  items: [{ sku: 'ITEM-1', quantity: 2 }],
  total: 49.99,
  timestamp: Date.now(),
});
```

**CRITICAL:**
- Message body must be JSON serializable (structured clone algorithm)
- Maximum message size: **128 KB** (including ~100 bytes internal metadata)
- Messages >128 KB will fail - split them or store in R2 and send reference

---

### `sendBatch()` - Send Multiple Messages

```typescript
interface MessageSendRequest<Body = any> {
  body: Body;
  delaySeconds?: number;
}

interface QueueSendBatchOptions {
  delaySeconds?: number;  // Default delay for all messages
}

await env.MY_QUEUE.sendBatch(
  messages: Iterable<MessageSendRequest>,
  options?: QueueSendBatchOptions
);
```

**Examples:**

```typescript
// Send batch of messages
await env.MY_QUEUE.sendBatch([
  { body: { userId: '1', action: 'email' } },
  { body: { userId: '2', action: 'email' } },
  { body: { userId: '3', action: 'email' } },
]);

// Send batch with individual delays
await env.MY_QUEUE.sendBatch([
  { body: { task: 'task1' }, delaySeconds: 60 },   // 1 min
  { body: { task: 'task2' }, delaySeconds: 300 },  // 5 min
  { body: { task: 'task3' }, delaySeconds: 600 },  // 10 min
]);

// Send batch with default delay
await env.MY_QUEUE.sendBatch(
  [
    { body: { task: 'task1' } },
    { body: { task: 'task2' } },
  ],
  { delaySeconds: 3600 } // All delayed by 1 hour
);

// Dynamic batch from array
const tasks = await getTasks();
await env.MY_QUEUE.sendBatch(
  tasks.map((task) => ({
    body: {
      taskId: task.id,
      userId: task.userId,
      priority: task.priority,
    },
  }))
);
```

**Limits:**
- Maximum 100 messages per batch
- Maximum 256 KB total batch size
- Each message still limited to 128 KB individually

---

## Complete Consumer API

### Queue Handler Function

```typescript
export default {
  async queue(
    batch: MessageBatch,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    // Process messages
  },
};
```

**Parameters:**
- `batch` - MessageBatch object containing messages
- `env` - Environment bindings (KV, D1, R2, etc.)
- `ctx` - Execution context for `waitUntil()`, `passThroughOnException()`

---

### MessageBatch Interface

```typescript
interface MessageBatch<Body = unknown> {
  readonly queue: string;              // Queue name
  readonly messages: Message<Body>[];  // Array of messages
  ackAll(): void;                      // Acknowledge all messages
  retryAll(options?: QueueRetryOptions): void;  // Retry all messages
}
```

**Properties:**

- **`queue`** - Name of the queue this batch came from
  - Useful when one consumer handles multiple queues

- **`messages`** - Array of Message objects
  - Ordering is **best effort**, not guaranteed
  - Process order should not be assumed

**Methods:**

- **`ackAll()`** - Mark all messages as successfully delivered
  - Even if handler throws error, these messages won't retry
  - Use when you've safely processed all messages

- **`retryAll(options?)`** - Mark all messages for retry
  - Messages re-queued immediately (or after delay)
  - Counts towards max_retries limit

---

### Message Interface

```typescript
interface Message<Body = unknown> {
  readonly id: string;          // Unique message ID
  readonly timestamp: Date;     // When message was sent
  readonly body: Body;          // Message content
  readonly attempts: number;    // Retry count (starts at 1)
  ack(): void;                  // Acknowledge this message
  retry(options?: QueueRetryOptions): void;  // Retry this message
}
```

**Properties:**

- **`id`** - System-generated unique ID (UUID)
- **`timestamp`** - Date object when message was sent to queue
- **`body`** - Your message content (any JSON serializable type)
- **`attempts`** - Number of times consumer has processed this message
  - Starts at 1 on first delivery
  - Increments on each retry
  - Use for exponential backoff: `delaySeconds: 60 * message.attempts`

**Methods:**

- **`ack()`** - Mark message as successfully delivered
  - Message won't be retried even if handler fails later
  - **Critical for non-idempotent operations** (DB writes, API calls)

- **`retry(options?)`** - Mark message for retry
  - Re-queued immediately or after `delaySeconds`
  - Counts towards max_retries (default 3)

---

### QueueRetryOptions

```typescript
interface QueueRetryOptions {
  delaySeconds?: number;  // Delay retry (0-43200 seconds / 12 hours)
}
```

**Example:**

```typescript
// Retry immediately
message.retry();

// Retry after 5 minutes
message.retry({ delaySeconds: 300 });

// Exponential backoff based on attempts
message.retry({
  delaySeconds: Math.min(60 * Math.pow(2, message.attempts - 1), 3600),
});
```

---

## Consumer Patterns

### 1. Basic Consumer (Implicit Acknowledgement)

**Best for:** Idempotent operations where retries are safe

```typescript
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      // Process message
      await sendEmail(message.body.email, message.body.content);
    }

    // Implicit ack: returning successfully acknowledges ALL messages
  },
};
```

**Behavior:**
- If function returns successfully → all messages acknowledged
- If function throws error → **all messages retried**
- Simple but can cause duplicate processing on partial failures

---

### 2. Explicit Acknowledgement (Non-Idempotent Operations)

**Best for:** Database writes, API calls, financial transactions

```typescript
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        // Non-idempotent operation
        await env.DB.prepare(
          'INSERT INTO orders (id, user_id, amount) VALUES (?, ?, ?)'
        ).bind(message.body.orderId, message.body.userId, message.body.amount).run();

        // Explicitly acknowledge success
        message.ack();
      } catch (error) {
        console.error(`Failed to process ${message.id}:`, error);

        // Don't ack - will retry (or let it fail)
        // Optionally: message.retry() for explicit retry
      }
    }
  },
};
```

**Why explicit ack?**
- Prevents duplicate writes if one message in batch fails
- Only successfully processed messages are acknowledged
- Failed messages retry independently

---

### 3. Retry with Exponential Backoff

**Best for:** Rate-limited APIs, temporary failures

```typescript
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        // Call rate-limited API
        await fetch('https://api.example.com/process', {
          method: 'POST',
          body: JSON.stringify(message.body),
        });

        message.ack();
      } catch (error) {
        if (error.status === 429) {
          // Rate limited - retry with exponential backoff
          const delaySeconds = Math.min(
            60 * Math.pow(2, message.attempts - 1), // 60s, 120s, 240s, ...
            3600 // Max 1 hour
          );

          console.log(`Rate limited. Retrying in ${delaySeconds}s (attempt ${message.attempts})`);
          message.retry({ delaySeconds });
        } else {
          // Other error - retry immediately
          message.retry();
        }
      }
    }
  },
};
```

---

### 4. Dead Letter Queue (DLQ) Pattern

**Best for:** Handling permanently failed messages

**Setup DLQ:**

```bash
# Create DLQ
npx wrangler queues create my-dlq

# Configure consumer with DLQ
```

**wrangler.jsonc:**

```jsonc
{
  "queues": {
    "consumers": [
      {
        "queue": "my-queue",
        "max_batch_size": 10,
        "max_retries": 3,
        "dead_letter_queue": "my-dlq"  // Failed messages go here
      }
    ]
  }
}
```

**DLQ Consumer:**

```typescript
// Consumer for dead letter queue
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      // Log failed message
      console.error('PERMANENTLY FAILED MESSAGE:', {
        id: message.id,
        attempts: message.attempts,
        body: message.body,
        timestamp: message.timestamp,
      });

      // Store in database for manual review
      await env.DB.prepare(
        'INSERT INTO failed_messages (id, body, attempts, failed_at) VALUES (?, ?, ?, ?)'
      ).bind(
        message.id,
        JSON.stringify(message.body),
        message.attempts,
        new Date().toISOString()
      ).run();

      // Optionally: send alert to ops team
      await sendAlert({
        type: 'queue-dlq',
        messageId: message.id,
        queue: batch.queue,
      });

      // Acknowledge to remove from DLQ
      message.ack();
    }
  },
};
```

**How it works:**
1. Message fails in main queue
2. Retries up to `max_retries` (default 3)
3. After max retries, sent to DLQ
4. DLQ consumer processes failed messages
5. Without DLQ, messages are **deleted permanently**

---

### 5. Multiple Queues, Single Consumer

**Best for:** Centralized processing logic

```typescript
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    // Switch based on queue name
    switch (batch.queue) {
      case 'high-priority-queue':
        await processHighPriority(batch.messages, env);
        break;

      case 'low-priority-queue':
        await processLowPriority(batch.messages, env);
        break;

      case 'email-queue':
        await processEmails(batch.messages, env);
        break;

      default:
        console.warn(`Unknown queue: ${batch.queue}`);
        // Log to DLQ or monitoring
    }
  },
};

async function processHighPriority(messages: Message[], env: Env) {
  for (const message of messages) {
    // Process with urgency
    await fastProcess(message.body);
    message.ack();
  }
}

async function processLowPriority(messages: Message[], env: Env) {
  for (const message of messages) {
    // Can take longer
    await slowProcess(message.body);
    message.ack();
  }
}
```

**wrangler.jsonc:**

```jsonc
{
  "queues": {
    "consumers": [
      { "queue": "high-priority-queue" },
      { "queue": "low-priority-queue" },
      { "queue": "email-queue" }
    ]
  }
}
```

---

## Consumer Configuration

### Batch Settings

```jsonc
{
  "queues": {
    "consumers": [
      {
        "queue": "my-queue",
        "max_batch_size": 100,        // 1-100 messages (default: 10)
        "max_batch_timeout": 30       // 0-60 seconds (default: 5)
      }
    ]
  }
}
```

**How batching works:**
- Consumer called when **either** condition met:
  - `max_batch_size` messages accumulated
  - `max_batch_timeout` seconds elapsed (whichever comes first)

**Example:**
- `max_batch_size: 100`, `max_batch_timeout: 10`
- If 100 messages arrive in 3 seconds → batch delivered immediately
- If only 50 messages arrive in 10 seconds → batch of 50 delivered

**Tuning guidelines:**
- **High volume, low latency** → `max_batch_size: 100`, `max_batch_timeout: 1`
- **Low volume, batch writes** → `max_batch_size: 50`, `max_batch_timeout: 30`
- **Cost optimization** → Larger batches = fewer invocations

---

### Retry Settings

```jsonc
{
  "queues": {
    "consumers": [
      {
        "queue": "my-queue",
        "max_retries": 5,             // 0-100 (default: 3)
        "retry_delay": 300            // Seconds (default: 0)
      }
    ]
  }
}
```

**`max_retries`:**
- Number of times to retry failed message
- After max retries:
  - With DLQ → message sent to DLQ
  - Without DLQ → **message deleted permanently**

**`retry_delay`:**
- Default delay for all retried messages (seconds)
- Can be overridden with `message.retry({ delaySeconds })`
- Maximum delay: 43200 seconds (12 hours)

---

### Concurrency Settings

```jsonc
{
  "queues": {
    "consumers": [
      {
        "queue": "my-queue",
        "max_concurrency": 10         // 1-250 (default: auto-scale)
      }
    ]
  }
}
```

**How concurrency works:**
- Queues auto-scales consumers based on backlog
- Default: Scales up to 250 concurrent invocations
- Setting `max_concurrency` limits scaling

**When to set max_concurrency:**
- ✅ Upstream API has rate limits
- ✅ Database connection limits
- ✅ Want to control costs
- ❌ Most cases - leave unset for best performance

**Auto-scaling triggers:**
- Growing backlog (messages accumulating)
- High error rate
- Processing speed vs. incoming rate

---

### Dead Letter Queue

```jsonc
{
  "queues": {
    "consumers": [
      {
        "queue": "my-queue",
        "max_retries": 3,
        "dead_letter_queue": "my-dlq"  // Name of DLQ
      }
    ]
  }
}
```

**CRITICAL:**
- DLQ must be created separately: `npx wrangler queues create my-dlq`
- Without DLQ, failed messages are **deleted permanently**
- Messages in DLQ persist for 4 days without consumer
- Always configure DLQ for production queues

---

## Wrangler Commands

### Create Queue

```bash
# Create queue with defaults
npx wrangler queues create my-queue

# Create with custom retention (4 days default, max 14 days)
npx wrangler queues create my-queue --message-retention-period-secs 1209600

# Create with delivery delay
npx wrangler queues create my-queue --delivery-delay-secs 60
```

---

### List Queues

```bash
npx wrangler queues list
```

---

### Get Queue Info

```bash
npx wrangler queues info my-queue

# Output shows:
# - Queue name
# - Message retention period
# - Delivery delay
# - Consumers
# - Backlog size
```

---

### Update Queue

```bash
# Update message retention (60 seconds to 14 days)
npx wrangler queues update my-queue --message-retention-period-secs 604800

# Update delivery delay (0 to 12 hours)
npx wrangler queues update my-queue --delivery-delay-secs 3600
```

---

### Delete Queue

```bash
npx wrangler queues delete my-queue

# Warning: This deletes ALL messages in the queue!
# Use with caution in production
```

---

### Consumer Management

```bash
# Add consumer to queue
npx wrangler queues consumer add my-queue my-consumer-worker \
  --batch-size 50 \
  --batch-timeout 10 \
  --message-retries 5 \
  --max-concurrency 20 \
  --retry-delay-secs 300

# Remove consumer from queue
npx wrangler queues consumer remove my-queue my-consumer-worker
```

---

### Purge Queue

```bash
# Delete ALL messages in queue (use with caution!)
npx wrangler queues purge my-queue
```

---

### Pause/Resume Delivery

```bash
# Pause message delivery to consumers
npx wrangler queues pause-delivery my-queue

# Resume message delivery
npx wrangler queues resume-delivery my-queue
```

**Use cases:**
- Maintenance on consumer Workers
- Temporarily stop processing
- Debug issues without losing messages

---

## Limits & Quotas

| Feature | Limit |
|---------|-------|
| **Queues per account** | 10,000 |
| **Message size** | 128 KB (includes ~100 bytes metadata) |
| **Message retries** | 100 max |
| **Batch size** | 1-100 messages |
| **Batch timeout** | 0-60 seconds |
| **Messages per sendBatch** | 100 (or 256 KB total) |
| **Queue throughput** | 5,000 messages/second per queue |
| **Message retention** | 4 days (default), 14 days (max) |
| **Queue backlog size** | 25 GB per queue |
| **Concurrent consumers** | 250 (push-based, auto-scale) |
| **Consumer duration** | 15 minutes (wall clock) |
| **Consumer CPU time** | 30 seconds (default), 5 minutes (max) |
| **Visibility timeout** | 12 hours (pull consumers) |
| **Message delay** | 12 hours (max) |
| **API rate limit** | 1200 requests / 5 minutes |

---

## Pricing

**Requires Workers Paid plan** ($5/month)

**Operations Pricing:**
- First 1,000,000 operations/month: **FREE**
- After that: **$0.40 per million operations**

**What counts as an operation:**
- Each 64 KB chunk written, read, or deleted
- Messages >64 KB count as multiple operations:
  - 65 KB message = 2 operations
  - 127 KB message = 2 operations
  - 128 KB message = 2 operations

**Typical message lifecycle:**
- 1 write + 1 read + 1 delete = **3 operations**

**Retries:**
- Each retry = additional **read operation**
- Message retried 3 times = 1 write + 4 reads + 1 delete = **6 operations**

**Dead Letter Queue:**
- Writing to DLQ = additional **write operation**

**Cost examples:**
- 1M messages/month (no retries): ((1M × 3) - 1M) / 1M × $0.40 = **$0.80**
- 10M messages/month: ((10M × 3) - 1M) / 1M × $0.40 = **$11.60**
- 100M messages/month: ((100M × 3) - 1M) / 1M × $0.40 = **$119.60**

---

## TypeScript Types

```typescript
// Queue binding (producer)
interface Queue<Body = any> {
  send(body: Body, options?: QueueSendOptions): Promise<void>;
  sendBatch(
    messages: Iterable<MessageSendRequest<Body>>,
    options?: QueueSendBatchOptions
  ): Promise<void>;
}

interface QueueSendOptions {
  delaySeconds?: number;
}

interface MessageSendRequest<Body = any> {
  body: Body;
  delaySeconds?: number;
}

interface QueueSendBatchOptions {
  delaySeconds?: number;
}

// Consumer handler
export default {
  queue(
    batch: MessageBatch,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void>;
}

interface MessageBatch<Body = unknown> {
  readonly queue: string;
  readonly messages: Message<Body>[];
  ackAll(): void;
  retryAll(options?: QueueRetryOptions): void;
}

interface Message<Body = unknown> {
  readonly id: string;
  readonly timestamp: Date;
  readonly body: Body;
  readonly attempts: number;
  ack(): void;
  retry(options?: QueueRetryOptions): void;
}

interface QueueRetryOptions {
  delaySeconds?: number;
}
```

---

## Error Handling

### Common Errors

#### 1. Message Too Large

```typescript
// ❌ Bad: Message >128 KB
await env.MY_QUEUE.send({
  data: largeArray, // >128 KB
});

// ✅ Good: Check size before sending
const message = { data: largeArray };
const size = new TextEncoder().encode(JSON.stringify(message)).length;

if (size > 128000) {
  // Store in R2, send reference
  const key = `messages/${crypto.randomUUID()}.json`;
  await env.MY_BUCKET.put(key, JSON.stringify(message));
  await env.MY_QUEUE.send({ type: 'large-message', r2Key: key });
} else {
  await env.MY_QUEUE.send(message);
}
```

---

#### 2. Throughput Exceeded

```typescript
// ❌ Bad: Exceeding 5000 msg/s per queue
for (let i = 0; i < 10000; i++) {
  await env.MY_QUEUE.send({ id: i }); // Too fast!
}

// ✅ Good: Use sendBatch
const messages = Array.from({ length: 10000 }, (_, i) => ({
  body: { id: i },
}));

// Send in batches of 100
for (let i = 0; i < messages.length; i += 100) {
  await env.MY_QUEUE.sendBatch(messages.slice(i, i + 100));
}

// ✅ Even better: Rate limit with delay
for (let i = 0; i < messages.length; i += 100) {
  await env.MY_QUEUE.sendBatch(messages.slice(i, i + 100));
  if (i + 100 < messages.length) {
    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
  }
}
```

---

#### 3. Consumer Timeout

```typescript
// ❌ Bad: Long processing without CPU limit increase
export default {
  async queue(batch: MessageBatch): Promise<void> {
    for (const message of batch.messages) {
      await processForMinutes(message.body); // CPU timeout!
    }
  },
};

// ✅ Good: Increase CPU limit in wrangler.jsonc
```

**wrangler.jsonc:**

```jsonc
{
  "limits": {
    "cpu_ms": 300000  // 5 minutes (max allowed)
  }
}
```

---

#### 4. Backlog Growing

```typescript
// Issue: Consumer too slow, backlog growing

// ✅ Solution 1: Increase batch size
{
  "queues": {
    "consumers": [{
      "queue": "my-queue",
      "max_batch_size": 100  // Process more per invocation
    }]
  }
}

// ✅ Solution 2: Let concurrency auto-scale (don't set max_concurrency)

// ✅ Solution 3: Optimize consumer code
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    // Process in parallel
    await Promise.all(
      batch.messages.map(async (message) => {
        await process(message.body);
        message.ack();
      })
    );
  },
};
```

---

## Always Do ✅

1. **Configure Dead Letter Queue** for production queues
2. **Use explicit ack()** for non-idempotent operations (DB writes, API calls)
3. **Validate message size** before sending (<128 KB)
4. **Use sendBatch()** for multiple messages (more efficient)
5. **Implement exponential backoff** for retries
6. **Set appropriate batch settings** based on workload
7. **Monitor queue backlog** and consumer errors
8. **Use ctx.waitUntil()** for async cleanup in consumers
9. **Handle errors gracefully** - log, alert, retry
10. **Let concurrency auto-scale** (don't set max_concurrency unless needed)

---

## Never Do ❌

1. **Never assume message ordering** - not guaranteed FIFO
2. **Never rely on implicit ack for non-idempotent ops** - use explicit ack()
3. **Never send messages >128 KB** - will fail
4. **Never delete queues with active messages** - data loss
5. **Never skip DLQ configuration** in production
6. **Never exceed 5000 msg/s per queue** - rate limit error
7. **Never process messages synchronously in loop** - use Promise.all()
8. **Never ignore message.attempts** - use for backoff logic
9. **Never set max_concurrency=1** unless you have a very specific reason
10. **Never forget to ack()** in explicit acknowledgement patterns

---

## Troubleshooting

### Issue: Messages not being delivered to consumer

**Possible causes:**
1. Consumer not deployed
2. Wrong queue name in wrangler.jsonc
3. Delivery paused
4. Consumer throwing errors

**Solution:**

```bash
# Check queue info
npx wrangler queues info my-queue

# Check if delivery paused
npx wrangler queues resume-delivery my-queue

# Check consumer logs
npx wrangler tail my-consumer
```

---

### Issue: Entire batch retried when one message fails

**Cause:** Using implicit acknowledgement with non-idempotent operations

**Solution:** Use explicit ack()

```typescript
// ✅ Explicit ack
for (const message of batch.messages) {
  try {
    await dbWrite(message.body);
    message.ack(); // Only ack on success
  } catch (error) {
    console.error(`Failed: ${message.id}`);
    // Don't ack - will retry
  }
}
```

---

### Issue: Messages deleted without processing

**Cause:** No Dead Letter Queue configured

**Solution:**

```bash
# Create DLQ
npx wrangler queues create my-dlq

# Add to consumer config
```

```jsonc
{
  "queues": {
    "consumers": [{
      "queue": "my-queue",
      "dead_letter_queue": "my-dlq"
    }]
  }
}
```

---

### Issue: Consumer not auto-scaling

**Possible causes:**
1. `max_concurrency` set to 1
2. Consumer returning errors (not processing)
3. Batch processing too fast (no backlog)

**Solution:**

```jsonc
{
  "queues": {
    "consumers": [{
      "queue": "my-queue",
      // Don't set max_concurrency - let it auto-scale
      "max_batch_size": 50  // Increase batch size instead
    }]
  }
}
```

---

## Production Checklist

Before deploying to production:

- [ ] Dead Letter Queue created and configured
- [ ] Explicit ack() used for non-idempotent operations
- [ ] Message size validation (<128 KB)
- [ ] Batch settings optimized for workload
- [ ] Retry settings configured (max_retries, retry_delay)
- [ ] Consumer concurrency settings appropriate
- [ ] Error handling and logging implemented
- [ ] Monitoring and alerting set up
- [ ] DLQ consumer deployed
- [ ] Exponential backoff for rate-limited APIs
- [ ] CPU limits increased if needed (limits.cpu_ms)
- [ ] Message retention period appropriate
- [ ] Tested under load

---

## Related Documentation

- [Cloudflare Queues Docs](https://developers.cloudflare.com/queues/)
- [How Queues Works](https://developers.cloudflare.com/queues/reference/how-queues-works/)
- [JavaScript APIs](https://developers.cloudflare.com/queues/configuration/javascript-apis/)
- [Batching & Retries](https://developers.cloudflare.com/queues/configuration/batching-retries/)
- [Consumer Concurrency](https://developers.cloudflare.com/queues/configuration/consumer-concurrency/)
- [Dead Letter Queues](https://developers.cloudflare.com/queues/configuration/dead-letter-queues/)
- [Wrangler Commands](https://developers.cloudflare.com/queues/reference/wrangler-commands/)
- [Limits](https://developers.cloudflare.com/queues/platform/limits/)
- [Pricing](https://developers.cloudflare.com/queues/platform/pricing/)

---

**Last Updated**: 2025-10-21
**Version**: 1.0.0
**Maintainer**: Jeremy Dawes | jeremy@jezweb.net
