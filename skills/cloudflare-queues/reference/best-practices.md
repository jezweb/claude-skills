# Cloudflare Queues Best Practices

Production patterns, optimization strategies, and common pitfalls.

---

## Consumer Design Patterns

### 1. Explicit Acknowledgement for Non-Idempotent Operations

**Problem:** Database writes or API calls get duplicated when batch retries

**Solution:** Use explicit `ack()` for each message

```typescript
// ❌ Bad: Entire batch retried if one operation fails
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      await env.DB.prepare(
        'INSERT INTO orders (id, data) VALUES (?, ?)'
      ).bind(message.body.id, JSON.stringify(message.body)).run();
    }
    // If last insert fails, ALL inserts are retried → duplicates!
  },
};

// ✅ Good: Each message acknowledged individually
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        await env.DB.prepare(
          'INSERT INTO orders (id, data) VALUES (?, ?)'
        ).bind(message.body.id, JSON.stringify(message.body)).run();

        message.ack(); // Only ack on success
      } catch (error) {
        console.error(`Failed: ${message.id}`, error);
        // Don't ack - will retry this message only
      }
    }
  },
};
```

---

### 2. Exponential Backoff for Rate Limits

**Problem:** Retrying immediately hits same rate limit

**Solution:** Use exponential backoff based on attempts

```typescript
// ❌ Bad: Retry immediately
try {
  await callRateLimitedAPI();
  message.ack();
} catch (error) {
  message.retry(); // Immediately hits rate limit again
}

// ✅ Good: Exponential backoff
try {
  await callRateLimitedAPI();
  message.ack();
} catch (error) {
  if (error.status === 429) {
    const delaySeconds = Math.min(
      60 * Math.pow(2, message.attempts - 1), // 1m, 2m, 4m, 8m, ...
      3600 // Max 1 hour
    );

    console.log(`Rate limited. Retrying in ${delaySeconds}s`);
    message.retry({ delaySeconds });
  }
}
```

---

### 3. Always Configure Dead Letter Queue

**Problem:** Messages deleted permanently after max retries

**Solution:** Always configure DLQ in production

```jsonc
{
  "queues": {
    "consumers": [
      {
        "queue": "my-queue",
        "max_retries": 3,
        "dead_letter_queue": "my-dlq"  // ✅ Always configure
      }
    ]
  }
}
```

**DLQ Consumer:**

```typescript
// Monitor and alert on DLQ messages
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      // Log failure
      console.error('PERMANENT FAILURE:', message.id, message.body);

      // Store for manual review
      await env.DB.prepare(
        'INSERT INTO failed_messages (id, body, attempts) VALUES (?, ?, ?)'
      ).bind(message.id, JSON.stringify(message.body), message.attempts).run();

      // Send alert
      await sendAlert(`Message ${message.id} failed permanently`);

      message.ack();
    }
  },
};
```

---

## Batch Configuration

### Optimizing Batch Size

**High volume, low latency:**

```jsonc
{
  "queues": {
    "consumers": [{
      "queue": "high-volume-queue",
      "max_batch_size": 100,      // Max messages per batch
      "max_batch_timeout": 1      // Process ASAP
    }]
  }
}
```

**Low volume, batch efficiency:**

```jsonc
{
  "queues": {
    "consumers": [{
      "queue": "low-volume-queue",
      "max_batch_size": 50,       // Medium batch
      "max_batch_timeout": 30     // Wait for batch to fill
    }]
  }
}
```

**Cost optimization:**

```jsonc
{
  "queues": {
    "consumers": [{
      "queue": "cost-optimized",
      "max_batch_size": 100,      // Largest batches
      "max_batch_timeout": 60     // Max wait time
    }]
  }
}
```

---

## Concurrency Management

### Let It Auto-Scale (Default)

```jsonc
{
  "queues": {
    "consumers": [{
      "queue": "my-queue"
      // No max_concurrency - auto-scales to 250
    }]
  }
}
```

**✅ Use when:**
- Default case
- Want best performance
- No upstream rate limits

---

### Limit Concurrency

```jsonc
{
  "queues": {
    "consumers": [{
      "queue": "rate-limited-api-queue",
      "max_concurrency": 10       // Limit to 10 concurrent consumers
    }]
  }
}
```

**✅ Use when:**
- Calling rate-limited APIs
- Database connection limits
- Want to control costs
- Protecting upstream services

---

## Message Design

### Include Metadata

```typescript
// ✅ Good: Include helpful metadata
await env.MY_QUEUE.send({
  // Message type for routing
  type: 'order-confirmation',

  // Idempotency key
  idempotencyKey: crypto.randomUUID(),

  // Correlation ID for tracing
  correlationId: requestId,

  // Timestamps
  createdAt: Date.now(),
  scheduledFor: Date.now() + 3600000,

  // Version for schema evolution
  _version: 1,

  // Actual payload
  payload: {
    orderId: 'ORD-123',
    userId: 'USER-456',
    total: 99.99,
  },
});
```

---

### Message Versioning

```typescript
// Handle multiple message versions
export default {
  async queue(batch: MessageBatch): Promise<void> {
    for (const message of batch.messages) {
      switch (message.body._version) {
        case 1:
          await processV1(message.body);
          break;
        case 2:
          await processV2(message.body);
          break;
        default:
          console.warn(`Unknown version: ${message.body._version}`);
      }

      message.ack();
    }
  },
};
```

---

### Large Messages

**Problem:** Messages >128 KB fail

**Solution:** Store in R2, send reference

```typescript
// Producer
const message = { largeData: ... };
const size = new TextEncoder().encode(JSON.stringify(message)).length;

if (size > 128 * 1024) {
  // Store in R2
  const key = `messages/${crypto.randomUUID()}.json`;
  await env.MY_BUCKET.put(key, JSON.stringify(message));

  // Send reference
  await env.MY_QUEUE.send({
    type: 'large-message',
    r2Key: key,
    size,
    timestamp: Date.now(),
  });
} else {
  await env.MY_QUEUE.send(message);
}

// Consumer
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      if (message.body.type === 'large-message') {
        // Fetch from R2
        const obj = await env.MY_BUCKET.get(message.body.r2Key);
        const data = await obj.json();

        await processLargeMessage(data);

        // Clean up R2
        await env.MY_BUCKET.delete(message.body.r2Key);
      } else {
        await processMessage(message.body);
      }

      message.ack();
    }
  },
};
```

---

## Error Handling

### Different Retry Strategies by Error Type

```typescript
try {
  await processMessage(message.body);
  message.ack();
} catch (error) {
  // Rate limit - exponential backoff
  if (error.status === 429) {
    message.retry({
      delaySeconds: Math.min(60 * Math.pow(2, message.attempts - 1), 3600),
    });
  }
  // Server error - shorter backoff
  else if (error.status >= 500) {
    message.retry({ delaySeconds: 60 });
  }
  // Client error - don't retry
  else if (error.status >= 400) {
    console.error('Client error, not retrying:', error);
    // Don't ack or retry - goes to DLQ
  }
  // Unknown error - retry immediately
  else {
    message.retry();
  }
}
```

---

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      // Check if we should try again
      if (Date.now() - this.lastFailure > 60000) { // 1 minute
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();

      // Success - reset
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailure = Date.now();

      // Open circuit after 3 failures
      if (this.failures >= 3) {
        this.state = 'open';
      }

      throw error;
    }
  }
}

const breaker = new CircuitBreaker();

export default {
  async queue(batch: MessageBatch): Promise<void> {
    for (const message of batch.messages) {
      try {
        await breaker.call(() => callUpstreamAPI(message.body));
        message.ack();
      } catch (error) {
        if (error.message === 'Circuit breaker is open') {
          // Retry later when circuit might be closed
          message.retry({ delaySeconds: 120 });
        } else {
          message.retry({ delaySeconds: 60 });
        }
      }
    }
  },
};
```

---

## Cost Optimization

### Batch Operations

```typescript
// ❌ Bad: 100 operations (3 per message)
for (let i = 0; i < 100; i++) {
  await env.MY_QUEUE.send({ id: i });
}

// ✅ Good: 3 operations total (write batch, read batch, delete batch)
await env.MY_QUEUE.sendBatch(
  Array.from({ length: 100 }, (_, i) => ({
    body: { id: i },
  }))
);
```

### Larger Batches

```jsonc
// Process more messages per invocation
{
  "queues": {
    "consumers": [{
      "queue": "my-queue",
      "max_batch_size": 100  // ✅ Max batch size = fewer invocations
    }]
  }
}
```

---

## Monitoring & Observability

### Structured Logging

```typescript
export default {
  async queue(batch: MessageBatch): Promise<void> {
    console.log(JSON.stringify({
      event: 'batch_start',
      queue: batch.queue,
      messageCount: batch.messages.length,
      timestamp: Date.now(),
    }));

    let processed = 0;
    let failed = 0;

    for (const message of batch.messages) {
      try {
        await processMessage(message.body);
        message.ack();
        processed++;
      } catch (error) {
        console.error(JSON.stringify({
          event: 'message_failed',
          messageId: message.id,
          attempts: message.attempts,
          error: error.message,
        }));
        failed++;
      }
    }

    console.log(JSON.stringify({
      event: 'batch_complete',
      processed,
      failed,
      duration: Date.now() - batch.messages[0].timestamp.getTime(),
    }));
  },
};
```

### Metrics Tracking

```typescript
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    const startTime = Date.now();

    for (const message of batch.messages) {
      const msgStartTime = Date.now();

      try {
        await processMessage(message.body);
        message.ack();

        // Track processing time
        await env.METRICS.put(
          `processing_time:${Date.now()}`,
          String(Date.now() - msgStartTime)
        );
      } catch (error) {
        await env.METRICS.put(
          `errors:${Date.now()}`,
          JSON.stringify({
            messageId: message.id,
            error: error.message,
          })
        );
      }
    }

    // Track batch metrics
    await env.METRICS.put(
      `batch_size:${Date.now()}`,
      String(batch.messages.length)
    );
  },
};
```

---

## Testing

### Local Development

```bash
# Start local dev server
npm run dev

# In another terminal, send test messages
curl -X POST http://localhost:8787/send \
  -H "Content-Type: application/json" \
  -d '{"test": "message"}'

# Watch consumer logs
npx wrangler tail my-consumer --local
```

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('Queue Consumer', () => {
  it('processes messages correctly', async () => {
    const batch: MessageBatch = {
      queue: 'test-queue',
      messages: [
        {
          id: '123',
          timestamp: new Date(),
          body: { type: 'test', data: 'hello' },
          attempts: 1,
          ack: () => {},
          retry: () => {},
        },
      ],
      ackAll: () => {},
      retryAll: () => {},
    };

    const env = {
      // Mock bindings
    };

    const ctx = {
      waitUntil: () => {},
      passThroughOnException: () => {},
    };

    await worker.queue(batch, env, ctx);

    // Assert expectations
  });
});
```

---

**Last Updated**: 2025-10-21
