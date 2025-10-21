# Consumer API Reference

Complete reference for consuming messages from Cloudflare Queues.

---

## Queue Handler

Consumer Workers must export a `queue()` handler:

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

### Parameters

- **`batch`** - MessageBatch object containing messages
- **`env`** - Environment bindings (KV, D1, R2, etc.)
- **`ctx`** - Execution context
  - `waitUntil(promise)` - Extend Worker lifetime
  - `passThroughOnException()` - Continue on error

### Return Value

- Must return `Promise<void>` or `void`
- Throwing error = all unacknowledged messages retried
- Returning successfully = implicit ack for messages without explicit ack()

---

## MessageBatch Interface

```typescript
interface MessageBatch<Body = unknown> {
  readonly queue: string;
  readonly messages: Message<Body>[];
  ackAll(): void;
  retryAll(options?: QueueRetryOptions): void;
}
```

### Properties

#### `queue` (string)

Name of the queue this batch came from.

**Use case:** One consumer handling multiple queues

```typescript
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    switch (batch.queue) {
      case 'high-priority':
        await processUrgent(batch.messages);
        break;
      case 'low-priority':
        await processNormal(batch.messages);
        break;
      default:
        console.warn(`Unknown queue: ${batch.queue}`);
    }
  },
};
```

---

#### `messages` (Message[])

Array of Message objects.

**Important:**
- Ordering is **best effort**, not guaranteed
- Don't rely on message order
- Use timestamps for ordering if needed

```typescript
// Sort by timestamp if order matters
const sortedMessages = batch.messages.sort(
  (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
);
```

---

### Methods

#### `ackAll()` - Acknowledge All Messages

Mark all messages as successfully delivered, even if handler throws error.

```typescript
export default {
  async queue(batch: MessageBatch): Promise<void> {
    // Acknowledge all messages upfront
    batch.ackAll();

    // Even if this fails, messages won't retry
    await processMessages(batch.messages);
  },
};
```

**Use cases:**
- Idempotent operations where retries are safe
- Already processed messages (deduplication)
- Want to prevent retries regardless of outcome

---

#### `retryAll(options?)` - Retry All Messages

Mark all messages for retry.

```typescript
interface QueueRetryOptions {
  delaySeconds?: number;  // 0-43200 (12 hours)
}

batch.retryAll();
batch.retryAll({ delaySeconds: 300 }); // Retry in 5 minutes
```

**Use cases:**
- Rate limiting (retry after backoff)
- Temporary system failure
- Upstream service unavailable

```typescript
export default {
  async queue(batch: MessageBatch): Promise<void> {
    try {
      await callUpstreamAPI(batch.messages);
    } catch (error) {
      if (error.status === 503) {
        // Service unavailable - retry in 5 minutes
        batch.retryAll({ delaySeconds: 300 });
      } else {
        // Other error - retry immediately
        batch.retryAll();
      }
    }
  },
};
```

---

## Message Interface

```typescript
interface Message<Body = unknown> {
  readonly id: string;
  readonly timestamp: Date;
  readonly body: Body;
  readonly attempts: number;
  ack(): void;
  retry(options?: QueueRetryOptions): void;
}
```

### Properties

#### `id` (string)

Unique system-generated message ID (UUID format).

```typescript
console.log(message.id); // "550e8400-e29b-41d4-a716-446655440000"
```

---

#### `timestamp` (Date)

When message was sent to queue.

```typescript
console.log(message.timestamp); // Date object
console.log(message.timestamp.toISOString()); // "2025-10-21T12:34:56.789Z"

// Check message age
const ageMs = Date.now() - message.timestamp.getTime();
console.log(`Message age: ${ageMs}ms`);
```

---

#### `body` (any)

Your message content.

```typescript
interface MyMessage {
  type: string;
  userId: string;
  data: any;
}

const message: Message<MyMessage> = ...;
console.log(message.body.type);   // TypeScript knows the type
console.log(message.body.userId);
console.log(message.body.data);
```

---

#### `attempts` (number)

Number of times consumer has attempted to process this message. Starts at 1.

```typescript
console.log(message.attempts); // 1 (first attempt)

// Use for exponential backoff
const delaySeconds = 60 * Math.pow(2, message.attempts - 1);
message.retry({ delaySeconds });

// Attempts: 1 → 60s, 2 → 120s, 3 → 240s, 4 → 480s, ...
```

---

### Methods

#### `ack()` - Acknowledge Message

Mark message as successfully delivered. Won't retry even if handler fails.

```typescript
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        // Non-idempotent operation
        await env.DB.prepare(
          'INSERT INTO orders (id, data) VALUES (?, ?)'
        ).bind(message.body.id, JSON.stringify(message.body)).run();

        // CRITICAL: Acknowledge success
        message.ack();
      } catch (error) {
        console.error(`Failed: ${message.id}`, error);
        // Don't ack - will retry
      }
    }
  },
};
```

**Use cases:**
- Database writes
- Payment processing
- Any non-idempotent operation
- Prevents duplicate processing

---

#### `retry(options?)` - Retry Message

Mark message for retry. Can optionally delay retry.

```typescript
interface QueueRetryOptions {
  delaySeconds?: number;  // 0-43200 (12 hours)
}

message.retry();
message.retry({ delaySeconds: 600 }); // Retry in 10 minutes
```

**Use cases:**
- Rate limiting (429 errors)
- Temporary failures
- Exponential backoff

```typescript
// Exponential backoff
message.retry({
  delaySeconds: Math.min(
    60 * Math.pow(2, message.attempts - 1),
    3600 // Max 1 hour
  ),
});

// Different delays for different errors
try {
  await processMessage(message.body);
  message.ack();
} catch (error) {
  if (error.status === 429) {
    // Rate limited - retry in 5 minutes
    message.retry({ delaySeconds: 300 });
  } else if (error.status >= 500) {
    // Server error - retry in 1 minute
    message.retry({ delaySeconds: 60 });
  } else {
    // Client error - don't retry
    console.error('Client error, not retrying');
  }
}
```

---

## Acknowledgement Precedence Rules

When mixing ack/retry calls:

1. **`ack()` or `retry()` wins** - First call on a message takes precedence
2. **Individual > Batch** - Message-level call overrides batch-level call
3. **Subsequent calls ignored** - Second call on same message is silently ignored

```typescript
// ack() takes precedence
message.ack();
message.retry(); // Ignored

// retry() takes precedence
message.retry();
message.ack(); // Ignored

// Individual overrides batch
message.ack();
batch.retryAll(); // Doesn't affect this message

// Batch doesn't affect individually handled messages
for (const msg of batch.messages) {
  msg.ack(); // These messages won't be affected by retryAll()
}
batch.retryAll(); // Only affects messages not explicitly ack'd
```

---

## Processing Patterns

### Sequential Processing

```typescript
export default {
  async queue(batch: MessageBatch): Promise<void> {
    for (const message of batch.messages) {
      await processMessage(message.body);
      message.ack();
    }
  },
};
```

**Pros:** Simple, ordered processing
**Cons:** Slow for large batches

---

### Parallel Processing

```typescript
export default {
  async queue(batch: MessageBatch): Promise<void> {
    await Promise.all(
      batch.messages.map(async (message) => {
        try {
          await processMessage(message.body);
          message.ack();
        } catch (error) {
          console.error(`Failed: ${message.id}`, error);
        }
      })
    );
  },
};
```

**Pros:** Fast, efficient
**Cons:** No ordering, higher memory usage

---

### Batched Database Writes

```typescript
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    // Prepare all statements
    const statements = batch.messages.map((message) =>
      env.DB.prepare(
        'INSERT INTO events (id, data) VALUES (?, ?)'
      ).bind(message.id, JSON.stringify(message.body))
    );

    // Execute in batch
    const results = await env.DB.batch(statements);

    // Acknowledge based on results
    for (let i = 0; i < results.length; i++) {
      if (results[i].success) {
        batch.messages[i].ack();
      } else {
        console.error(`Failed: ${batch.messages[i].id}`);
      }
    }
  },
};
```

**Pros:** Efficient database usage
**Cons:** More complex error handling

---

### Message Type Routing

```typescript
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        switch (message.body.type) {
          case 'email':
            await sendEmail(message.body, env);
            break;
          case 'sms':
            await sendSMS(message.body, env);
            break;
          case 'push':
            await sendPush(message.body, env);
            break;
          default:
            console.warn(`Unknown type: ${message.body.type}`);
        }

        message.ack();
      } catch (error) {
        console.error(`Failed: ${message.id}`, error);
        message.retry({ delaySeconds: 300 });
      }
    }
  },
};
```

---

## ExecutionContext Methods

### `waitUntil(promise)`

Extend Worker lifetime beyond handler return.

```typescript
export default {
  async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext): Promise<void> {
    for (const message of batch.messages) {
      await processMessage(message.body);
      message.ack();

      // Log asynchronously (doesn't block)
      ctx.waitUntil(
        env.LOGS.put(`log:${message.id}`, JSON.stringify({
          processedAt: Date.now(),
          message: message.body,
        }))
      );
    }
  },
};
```

---

### `passThroughOnException()`

Continue processing even if handler throws.

```typescript
export default {
  async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.passThroughOnException();

    // If this throws, Worker doesn't fail
    // But unacknowledged messages will retry
    await processMessages(batch.messages);
  },
};
```

---

**Last Updated**: 2025-10-21
