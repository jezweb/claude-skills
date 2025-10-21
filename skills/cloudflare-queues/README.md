# Cloudflare Queues

Complete knowledge domain for Cloudflare Queues - flexible message queue for asynchronous processing and background tasks on Workers.

---

## Auto-Trigger Keywords

### Primary Keywords
- cloudflare queues
- queues workers
- message queue
- queue bindings
- async processing
- background jobs
- queue consumer
- queue producer
- workers queue
- message broker

### Secondary Keywords
- batch processing
- send queue
- sendBatch
- queue handler
- message retry
- queue ack
- acknowledge message
- dead letter queue
- dlq
- queue delay
- delay message
- consumer concurrency
- queue backlog
- wrangler queues

### Error-Based Keywords
- queue timeout
- batch retry
- message lost
- queue throughput exceeded
- consumer not scaling
- queue storage limit
- Too Many Requests queue
- message retention exceeded
- visibility timeout
- max retries reached
- queue delivery failed
- consumer error

### Framework Integration Keywords
- hono queues
- queues hono
- cloudflare workers queues
- wrangler queue
- queue api workers

---

## What This Skill Does

This skill provides complete Cloudflare Queues knowledge including:

- ✅ **Queue Creation** - Create, configure, and manage queues with wrangler
- ✅ **Producer Patterns** - send(), sendBatch() with delays
- ✅ **Consumer Patterns** - Basic, explicit ack, DLQ, retry strategies
- ✅ **Batching Configuration** - max_batch_size, max_batch_timeout
- ✅ **Retry Strategies** - Implicit, explicit, with exponential backoff
- ✅ **Dead Letter Queues** - Handle permanently failed messages
- ✅ **Explicit Acknowledgement** - ack(), retry(), ackAll(), retryAll()
- ✅ **Message Delays** - Delay delivery up to 12 hours
- ✅ **Consumer Concurrency** - Auto-scaling up to 250 concurrent invocations
- ✅ **Error Handling** - Timeouts, retries, rate limits
- ✅ **Pull Consumers** - HTTP-based consumers (not just Workers)
- ✅ **Performance Optimization** - Batching, concurrency, cost reduction

---

## Known Issues Prevented

| Issue | Description | Prevention |
|-------|-------------|------------|
| **Batch retry on single failure** | One message fails → entire batch retried | Use explicit ack() for non-idempotent operations |
| **Messages deleted without DLQ** | After max_retries, messages permanently lost | Configure dead_letter_queue in consumer |
| **Throughput exceeded** | >5000 msg/s per queue causes errors | Document limit + implement retry logic |
| **Message too large** | >128 KB fails to send | Validate message size before sending |
| **Ordering not guaranteed** | Messages arrive out of order | Use timestamps, don't rely on delivery order |
| **Consumer timeout** | Default 30s CPU limit too low | Set limits.cpu_ms up to 300000 (5 min) |
| **No explicit ack** | DB writes/API calls repeated on retry | Always ack() after successful operations |
| **Rate limit errors** | API rate limits (1200 req/5min) | Implement exponential backoff |

---

## When to Use This Skill

### ✅ Use this skill when:
- Decoupling application components
- Processing tasks asynchronously
- Handling background jobs (emails, notifications, data processing)
- Buffering calls to external APIs
- Implementing task queues
- Managing workload spikes
- Rate limiting upstream services
- Building event-driven architectures
- Processing webhooks asynchronously
- Scheduling delayed tasks

### ❌ When NOT to use:
- You need real-time processing (<1 second latency)
- You need guaranteed FIFO ordering (use Durable Objects)
- You need strict message ordering
- Messages >128 KB (split them or use R2 references)
- You need synchronous responses
- You need transactional guarantees across operations

---

## Quick Example

```typescript
import { Hono } from 'hono';

type Bindings = {
  MY_QUEUE: Queue;
};

const app = new Hono<{ Bindings: Bindings }>();

// Producer: Send message to queue
app.post('/tasks', async (c) => {
  const task = await c.req.json();

  // Send single message
  await c.env.MY_QUEUE.send({
    type: 'process-order',
    orderId: task.orderId,
    userId: task.userId,
  });

  return c.json({ status: 'queued' });
});

// Producer: Send batch of messages
app.post('/tasks/batch', async (c) => {
  const tasks = await c.req.json();

  // Send up to 100 messages at once
  await c.env.MY_QUEUE.sendBatch(
    tasks.map((task) => ({
      body: {
        type: 'process-order',
        orderId: task.orderId,
      },
    }))
  );

  return c.json({ status: 'queued', count: tasks.length });
});

export default app;
```

```typescript
// Consumer: Process messages from queue
export default {
  async queue(
    batch: MessageBatch,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    // Process each message
    for (const message of batch.messages) {
      try {
        // Your processing logic
        await processOrder(message.body);

        // Explicitly acknowledge success
        message.ack();
      } catch (error) {
        console.error(`Failed to process message ${message.id}:`, error);

        // Retry with exponential backoff
        message.retry({
          delaySeconds: Math.min(60 * message.attempts, 3600),
        });
      }
    }
  },
};
```

---

## Token Efficiency

- **Manual Setup**: 8,000-12,000 tokens
- **With This Skill**: 3,500-5,500 tokens
- **Savings**: ~50-55%

---

## Files Included

- `SKILL.md` - Complete Queues knowledge domain
- `templates/wrangler-queues-config.jsonc` - Producer + Consumer bindings
- `templates/queues-producer.ts` - Send messages (single + batch)
- `templates/queues-consumer-basic.ts` - Basic consumer (implicit ack)
- `templates/queues-consumer-explicit-ack.ts` - Explicit ack pattern
- `templates/queues-dlq-pattern.ts` - Dead letter queue setup
- `templates/queues-retry-with-delay.ts` - Retry with exponential backoff
- `reference/wrangler-commands.md` - Complete CLI reference
- `reference/producer-api.md` - send/sendBatch API details
- `reference/consumer-api.md` - queue handler + batch operations
- `reference/best-practices.md` - Patterns, concurrency, optimization

---

## Dependencies

- **cloudflare-worker-base** - For Hono + Vite + Worker setup
- **wrangler** - For queue management CLI

---

## Production Status

✅ **Production Ready**

This skill is based on:
- Official Cloudflare Queues documentation
- Cloudflare Workers SDK examples
- Production-tested patterns
- Latest package versions (verified 2025-10-21)

---

## Related Skills

- **cloudflare-worker-base** - Base Worker setup with Hono
- **cloudflare-d1** - Serverless SQLite database
- **cloudflare-r2** - Object storage
- **cloudflare-kv** - Key-value storage
- **cloudflare-workers-ai** - AI inference on Workers

---

**Last Updated**: 2025-10-21
**Status**: Production Ready ✅
**Maintainer**: Jeremy Dawes | jeremy@jezweb.net
