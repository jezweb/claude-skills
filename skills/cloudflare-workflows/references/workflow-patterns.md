# Cloudflare Workflows - Production Patterns

**Last Updated**: 2025-10-22

This document provides battle-tested patterns for building production-ready Cloudflare Workflows.

---

## Table of Contents

1. [Idempotency Patterns](#idempotency-patterns)
2. [Error Handling Patterns](#error-handling-patterns)
3. [Long-Running Process Patterns](#long-running-process-patterns)
4. [Human-in-the-Loop Patterns](#human-in-the-loop-patterns)
5. [Workflow Chaining Patterns](#workflow-chaining-patterns)
6. [Testing Patterns](#testing-patterns)
7. [Monitoring Patterns](#monitoring-patterns)

---

## Idempotency Patterns

### Pattern 1: Idempotency Keys

**Problem:** Workflow steps may execute multiple times due to retries.

**Solution:** Use idempotency keys to ensure operations execute only once.

```typescript
export class PaymentWorkflow extends WorkflowEntrypoint<Env, PaymentParams> {
  async run(event: WorkflowEvent<PaymentParams>, step: WorkflowStep) {
    const { orderId, amount } = event.payload;

    // Generate idempotency key from workflow instance ID + step name
    const idempotencyKey = `${event.instanceId}-charge-payment`;

    const paymentResult = await step.do('charge payment', async () => {
      // Check if already processed
      const existing = await this.env.KV.get(`payment:${idempotencyKey}`);
      if (existing) {
        console.log('Payment already processed, returning cached result');
        return JSON.parse(existing);
      }

      // Process payment
      const response = await fetch('https://payment-gateway.example.com/charge', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey  // Payment gateway checks this
        },
        body: JSON.stringify({ orderId, amount })
      });

      const result = await response.json();

      // Cache result
      await this.env.KV.put(
        `payment:${idempotencyKey}`,
        JSON.stringify(result),
        { expirationTtl: 86400 }  // 24 hours
      });

      return result;
    });

    return { orderId, transactionId: paymentResult.transactionId };
  }
}
```

---

### Pattern 2: Database Upsert for Idempotency

```typescript
await step.do('create order', async () => {
  // Use INSERT OR REPLACE to make idempotent
  await this.env.DB.prepare(`
    INSERT INTO orders (id, user_id, amount, status, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      user_id = excluded.user_id,
      amount = excluded.amount,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    orderId,
    userId,
    amount,
    'pending',
    new Date().toISOString()
  ).run();

  return { orderId };
});
```

---

## Error Handling Patterns

### Pattern 1: Categorize Errors for Retry Logic

```typescript
async function shouldRetry(error: Error): Promise<boolean> {
  // Don't retry on client errors (4xx)
  if (error.message.includes('400') ||
      error.message.includes('401') ||
      error.message.includes('403') ||
      error.message.includes('404')) {
    return false;
  }

  // Retry on server errors (5xx) and network errors
  return true;
}

await step.do('call API', async () => {
  try {
    const response = await fetch('https://api.example.com/data');

    if (!response.ok) {
      const error = new Error(`API error: ${response.status}`);

      if (!await shouldRetry(error)) {
        throw new NonRetryableError(error.message);
      }

      throw error;  // Will retry
    }

    return await response.json();
  } catch (error) {
    if (error instanceof NonRetryableError) {
      throw error;
    }

    // Network error - retry
    throw error;
  }
});
```

---

### Pattern 2: Circuit Breaker

```typescript
export class CircuitBreaker {
  constructor(
    private kv: KVNamespace,
    private serviceName: string,
    private threshold: number = 5,
    private resetTime: number = 60000  // 1 minute
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    const key = `circuit:${this.serviceName}`;
    const state = await this.kv.get(key, 'json') as {
      failures: number;
      lastFailure: number;
    } | null;

    // Check if circuit is open
    if (state && state.failures >= this.threshold) {
      const elapsed = Date.now() - state.lastFailure;

      if (elapsed < this.resetTime) {
        throw new NonRetryableError(
          `Circuit breaker open for ${this.serviceName}`
        );
      }
    }

    try {
      const result = await fn();

      // Reset on success
      await this.kv.delete(key);

      return result;
    } catch (error) {
      // Increment failure count
      const newState = {
        failures: (state?.failures || 0) + 1,
        lastFailure: Date.now()
      };

      await this.kv.put(key, JSON.stringify(newState), {
        expirationTtl: this.resetTime / 1000
      });

      throw error;
    }
  }
}

// Usage
export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const circuitBreaker = new CircuitBreaker(this.env.KV, 'external-api');

    await step.do('call external API', async () => {
      return await circuitBreaker.call(async () => {
        const response = await fetch('https://external-api.example.com/data');
        return await response.json();
      });
    });
  }
}
```

---

### Pattern 3: Graceful Degradation

```typescript
await step.do('fetch user preferences', async () => {
  try {
    const response = await fetch(`https://api.example.com/users/${userId}/preferences`);
    if (!response.ok) throw new Error('Failed to fetch preferences');
    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch preferences, using defaults:', error);

    // Fallback to defaults
    return {
      theme: 'light',
      language: 'en',
      notifications: true
    };
  }
});
```

---

## Long-Running Process Patterns

### Pattern 1: Polling with Exponential Backoff

```typescript
export class VideoProcessingWorkflow extends WorkflowEntrypoint<Env, VideoParams> {
  async run(event: WorkflowEvent<VideoParams>, step: WorkflowStep) {
    const { videoId } = event.payload;

    // Submit video for processing
    const jobId = await step.do('submit video', async () => {
      const response = await fetch('https://processor.example.com/jobs', {
        method: 'POST',
        body: JSON.stringify({ videoId })
      });
      const data = await response.json();
      return data.jobId;
    });

    // Poll for completion with exponential backoff
    let complete = false;
    let attempt = 0;
    const maxAttempts = 20;

    while (!complete && attempt < maxAttempts) {
      // Wait with exponential backoff: 10s, 20s, 40s, ...
      const delay = Math.min(10 * Math.pow(2, attempt), 300);  // Max 5 minutes
      await step.sleep(`wait attempt ${attempt}`, `${delay} seconds`);

      const status = await step.do(`check status attempt ${attempt}`, async () => {
        const response = await fetch(
          `https://processor.example.com/jobs/${jobId}/status`
        );
        return await response.json();
      });

      if (status.state === 'complete') {
        complete = true;
      } else if (status.state === 'failed') {
        throw new NonRetryableError(`Processing failed: ${status.error}`);
      }

      attempt++;
    }

    if (!complete) {
      throw new Error('Processing timeout after maximum attempts');
    }

    return { videoId, jobId, status: 'complete' };
  }
}
```

---

### Pattern 2: Progress Tracking

```typescript
export class DataMigrationWorkflow extends WorkflowEntrypoint<Env, MigrationParams> {
  async run(event: WorkflowEvent<MigrationParams>, step: WorkflowStep) {
    const { totalRecords, batchSize } = event.payload;
    const batches = Math.ceil(totalRecords / batchSize);

    for (let i = 0; i < batches; i++) {
      const progress = await step.do(`migrate batch ${i}`, async () => {
        const offset = i * batchSize;

        // Migrate batch
        await this.migrateBatch(offset, batchSize);

        // Update progress in DB
        const percentage = Math.round(((i + 1) / batches) * 100);
        await this.env.DB.prepare(`
          UPDATE migration_jobs
          SET progress = ?, updated_at = ?
          WHERE id = ?
        `).bind(percentage, new Date().toISOString(), event.payload.jobId).run();

        return { batch: i + 1, total: batches, percentage };
      });

      console.log(`Progress: ${progress.percentage}%`);

      // Small delay between batches to avoid overwhelming database
      if (i < batches - 1) {
        await step.sleep(`pause before batch ${i + 1}`, '1 second');
      }
    }

    return { status: 'complete', batches };
  }

  private async migrateBatch(offset: number, limit: number) {
    // Migration logic
  }
}
```

---

## Human-in-the-Loop Patterns

### Pattern 1: Approval with Timeout and Escalation

```typescript
export class ApprovalWorkflow extends WorkflowEntrypoint<Env, ApprovalParams> {
  async run(event: WorkflowEvent<ApprovalParams>, step: WorkflowStep) {
    const { requestId, amount } = event.payload;

    // Send to primary approver
    await step.do('notify primary approver', async () => {
      await this.sendApprovalRequest('manager@example.com', requestId);
    });

    // Wait 48 hours for approval
    let approved: boolean;
    let approver: string;

    try {
      const decision = await step.waitForEvent<ApprovalEvent>(
        'wait for primary approval',
        { type: 'approval-decision', timeout: '48 hours' }
      );

      approved = decision.approved;
      approver = decision.approverId;
    } catch (error) {
      // Timeout - escalate to senior manager
      console.log('Primary approval timeout, escalating');

      await step.do('notify senior approver', async () => {
        await this.sendApprovalRequest('senior-manager@example.com', requestId);
      });

      // Wait another 24 hours
      const escalatedDecision = await step.waitForEvent<ApprovalEvent>(
        'wait for escalated approval',
        { type: 'approval-decision', timeout: '24 hours' }
      );

      approved = escalatedDecision.approved;
      approver = escalatedDecision.approverId;
    }

    if (approved) {
      await step.do('execute approved action', async () => {
        // Execute the action
      });
    }

    return { requestId, approved, approver };
  }

  private async sendApprovalRequest(to: string, requestId: string) {
    // Send notification
  }
}
```

---

## Workflow Chaining Patterns

### Pattern 1: Parent-Child Workflows

```typescript
export class OrderWorkflow extends WorkflowEntrypoint<Env, OrderParams> {
  async run(event: WorkflowEvent<OrderParams>, step: WorkflowStep) {
    const { orderId } = event.payload;

    // Step 1: Process payment (separate workflow)
    const paymentWorkflow = await step.do('start payment workflow', async () => {
      const instance = await this.env.PAYMENT_WORKFLOW.create({
        params: { orderId, amount: event.payload.amount }
      });
      return { instanceId: instance.id };
    });

    // Step 2: Wait for payment to complete
    let paymentComplete = false;

    while (!paymentComplete) {
      await step.sleep('wait for payment', '30 seconds');

      const paymentStatus = await step.do('check payment status', async () => {
        const instance = await this.env.PAYMENT_WORKFLOW.get(
          paymentWorkflow.instanceId
        );
        return await instance.status();
      });

      if (paymentStatus.status === 'complete') {
        paymentComplete = true;
      } else if (paymentStatus.status === 'errored') {
        throw new Error(`Payment failed: ${paymentStatus.error}`);
      }
    }

    // Step 3: Start fulfillment workflow
    await step.do('start fulfillment workflow', async () => {
      await this.env.FULFILLMENT_WORKFLOW.create({
        params: { orderId }
      });
    });

    return { orderId, status: 'processing' };
  }
}
```

---

## Testing Patterns

### Pattern 1: Mock External APIs

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { unstable_dev } from 'wrangler';

describe('PaymentWorkflow', () => {
  let worker;

  beforeEach(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true }
    });
  });

  it('should process payment successfully', async () => {
    // Mock fetch to return success
    globalThis.fetch = async (url: string) => {
      if (url.includes('payment-gateway')) {
        return new Response(JSON.stringify({
          transactionId: 'TXN-123',
          status: 'success'
        }));
      }
      return new Response('Not found', { status: 404 });
    };

    const response = await worker.fetch('/workflows/create', {
      method: 'POST',
      body: JSON.stringify({
        orderId: 'ORD-123',
        amount: 99.99
      })
    });

    const data = await response.json();
    expect(data.id).toBeDefined();
  });
});
```

---

## Monitoring Patterns

### Pattern 1: Structured Logging

```typescript
export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    this.log('info', 'Workflow started', {
      instanceId: event.instanceId,
      params: event.payload
    });

    try {
      await step.do('process data', async () => {
        this.log('info', 'Processing data', { userId: event.payload.userId });
        // Process
        return { processed: true };
      });

      this.log('info', 'Workflow completed successfully', {
        instanceId: event.instanceId
      });
    } catch (error) {
      this.log('error', 'Workflow failed', {
        instanceId: event.instanceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private log(level: string, message: string, data: any) {
    console.log(JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  }
}
```

---

### Pattern 2: Metrics Tracking

```typescript
await step.do('track metrics', async () => {
  const metrics = {
    workflowId: event.instanceId,
    stepName: 'payment-processing',
    duration: performance.now() - startTime,
    status: 'success',
    timestamp: new Date().toISOString()
  };

  // Store in Analytics Engine
  await this.env.ANALYTICS.writeDataPoint(metrics);

  return metrics;
});
```

---

## Best Practices Summary

### Always Do

1. **Use idempotency keys** for external API calls
2. **Categorize errors** - retry on transient failures, fail fast on terminal errors
3. **Log structured data** - JSON logs for easy querying
4. **Track progress** - update database for long-running processes
5. **Use exponential backoff** - for polling and retries
6. **Test workflows** - unit tests with mocked dependencies
7. **Monitor metrics** - track success rates, durations, errors

### Never Do

1. **Don't retry non-idempotent operations infinitely** - use retry limits
2. **Don't ignore timeout errors** - handle gracefully with fallbacks
3. **Don't block on external events without timeout** - always set timeout
4. **Don't assume steps execute in order** - each step is independent
5. **Don't return non-serializable values** - only JSON-compatible types
6. **Don't store sensitive data in workflow state** - use KV/D1 instead
7. **Don't forget to clean up resources** - terminate unused workflow instances

---

**Last Updated**: 2025-10-22
**Maintainer**: Jeremy Dawes | jeremy@jezweb.net
