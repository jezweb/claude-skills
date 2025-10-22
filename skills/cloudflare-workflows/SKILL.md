---
name: Cloudflare Workflows
description: |
  Complete knowledge domain for Cloudflare Workflows - durable execution framework
  for building multi-step applications on Workers that automatically retry, persist
  state, and run for hours or days.

  Use when: creating long-running workflows, implementing retry logic, building
  event-driven processes, scheduling multi-step tasks, coordinating between APIs,
  or encountering "NonRetryableError", "I/O context", "workflow execution failed",
  "serialization error", or "WorkflowEvent not found" errors.

  Keywords: cloudflare workflows, workflows workers, durable execution, workflow step,
  WorkflowEntrypoint, step.do, step.sleep, workflow retries, NonRetryableError,
  workflow state, wrangler workflows, workflow events, long-running tasks, step.sleepUntil,
  step.waitForEvent, workflow bindings
license: MIT
---

# Cloudflare Workflows

**Status**: Production Ready ✅
**Last Updated**: 2025-10-22
**Dependencies**: cloudflare-worker-base (for Worker setup)
**Latest Versions**: wrangler@4.44.0, @cloudflare/workers-types@4.20251014.0

---

## Quick Start (10 Minutes)

### 1. Create a Workflow

Use the Cloudflare Workflows starter template:

```bash
npm create cloudflare@latest my-workflow -- --template cloudflare/workflows-starter --git --deploy false
cd my-workflow
```

**What you get:**
- WorkflowEntrypoint class template
- Worker to trigger workflows
- Complete wrangler.jsonc configuration

### 2. Understand the Basic Structure

**src/index.ts:**

```typescript
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

type Env = {
  MY_WORKFLOW: Workflow;
};

type Params = {
  userId: string;
  email: string;
};

export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    // Access params from event.payload
    const { userId, email } = event.payload;

    // Step 1: Do some work
    const result = await step.do('process user', async () => {
      return { processed: true, userId };
    });

    // Step 2: Wait before next action
    await step.sleep('wait 1 hour', '1 hour');

    // Step 3: Continue workflow
    await step.do('send email', async () => {
      // Send email logic
      return { sent: true, email };
    });

    // Optional: return final state
    return { completed: true, userId };
  }
}

// Worker to trigger workflow
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // Create new workflow instance
    const instance = await env.MY_WORKFLOW.create({
      params: { userId: '123', email: 'user@example.com' }
    });

    return Response.json({
      id: instance.id,
      status: await instance.status()
    });
  }
};
```

### 3. Configure Wrangler

**wrangler.jsonc:**

```jsonc
{
  "name": "my-workflow",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-22",
  "workflows": [
    {
      "name": "my-workflow",
      "binding": "MY_WORKFLOW",
      "class_name": "MyWorkflow"
    }
  ]
}
```

### 4. Deploy and Test

```bash
# Deploy workflow
npm run deploy

# Trigger workflow (visit in browser or curl)
curl https://my-workflow.<subdomain>.workers.dev/

# View workflow instances
npx wrangler workflows instances list my-workflow

# Check instance status
npx wrangler workflows instances describe my-workflow <instance-id>
```

---

## WorkflowEntrypoint Class

### Extend WorkflowEntrypoint

Every Workflow must extend `WorkflowEntrypoint` and implement a `run()` method:

```typescript
export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    // Workflow steps here
  }
}
```

**Type Parameters:**
- `Env` - Environment bindings (KV, D1, R2, etc.)
- `Params` - Type of workflow parameters passed via `event.payload`

### run() Method

```typescript
async run(
  event: WorkflowEvent<Params>,
  step: WorkflowStep
): Promise<T | void>
```

**Parameters:**
- `event` - Contains workflow metadata and payload
- `step` - Provides step methods (do, sleep, sleepUntil, waitForEvent)

**Returns:**
- Optional return value (must be serializable)
- Return value available via instance.status()

**Example:**

```typescript
export class OrderWorkflow extends WorkflowEntrypoint<Env, OrderParams> {
  async run(event: WorkflowEvent<OrderParams>, step: WorkflowStep) {
    const { orderId, customerId } = event.payload;

    // Access bindings via this.env
    const order = await this.env.DB.prepare(
      'SELECT * FROM orders WHERE id = ?'
    ).bind(orderId).first();

    const result = await step.do('process payment', async () => {
      // Payment processing
      return { paid: true, amount: order.total };
    });

    // Return final state
    return {
      orderId,
      status: 'completed',
      paidAmount: result.amount
    };
  }
}
```

---

## Step Methods

### step.do() - Execute Work

```typescript
step.do<T>(
  name: string,
  config?: WorkflowStepConfig,
  callback: () => Promise<T>
): Promise<T>
```

**OR** (config is optional):

```typescript
step.do<T>(
  name: string,
  callback: () => Promise<T>
): Promise<T>
```

**Parameters:**
- `name` - Step name (for observability)
- `config` (optional) - Retry configuration
- `callback` - Async function that does the work

**Returns:**
- The value returned from callback (must be serializable)

**Example:**

```typescript
// Simple step
const files = await step.do('fetch files', async () => {
  const response = await fetch('https://api.example.com/files');
  return await response.json();
});

// Step with retry config
const result = await step.do(
  'call payment API',
  {
    retries: {
      limit: 10,
      delay: '10 seconds',
      backoff: 'exponential'
    },
    timeout: '5 minutes'
  },
  async () => {
    const response = await fetch('https://payment-api.example.com/charge', {
      method: 'POST',
      body: JSON.stringify({ amount: 100 })
    });
    return await response.json();
  }
);
```

**CRITICAL - Serialization:**
- Return value must be JSON serializable
- ✅ Allowed: string, number, boolean, Array, Object, null
- ❌ Forbidden: Function, Symbol, circular references, undefined
- Step will throw error if return value isn't serializable

---

### step.sleep() - Relative Sleep

```typescript
step.sleep(name: string, duration: WorkflowDuration): Promise<void>
```

**Parameters:**
- `name` - Step name
- `duration` - Number (milliseconds) or human-readable string

**Accepted units:**
- `"second"` / `"seconds"`
- `"minute"` / `"minutes"`
- `"hour"` / `"hours"`
- `"day"` / `"days"`
- `"week"` / `"weeks"`
- `"month"` / `"months"`
- `"year"` / `"years"`

**Examples:**

```typescript
// Sleep for 5 minutes
await step.sleep('wait 5 minutes', '5 minutes');

// Sleep for 1 hour
await step.sleep('hourly delay', '1 hour');

// Sleep for 2 days
await step.sleep('wait 2 days', '2 days');

// Sleep using milliseconds
await step.sleep('wait 30 seconds', 30000);

// Common pattern: schedule daily task
await step.do('send daily report', async () => {
  // Send report
});
await step.sleep('wait until tomorrow', '1 day');
// Workflow continues next day
```

**Priority:**
- Workflows resuming from sleep take priority over new instances
- Ensures older workflows complete before new ones start

---

### step.sleepUntil() - Sleep to Specific Date

```typescript
step.sleepUntil(
  name: string,
  timestamp: Date | number
): Promise<void>
```

**Parameters:**
- `name` - Step name
- `timestamp` - Date object or UNIX timestamp (milliseconds)

**Examples:**

```typescript
// Sleep until specific date
const launchDate = new Date('2025-12-25T00:00:00Z');
await step.sleepUntil('wait for launch', launchDate);

// Sleep until UNIX timestamp
const timestamp = Date.parse('24 Oct 2024 13:00:00 UTC');
await step.sleepUntil('wait until time', timestamp);

// Sleep until next Monday 9am UTC
const nextMonday = new Date();
nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
nextMonday.setUTCHours(9, 0, 0, 0);
await step.sleepUntil('wait until Monday 9am', nextMonday);

// Schedule work at specific time
await step.do('prepare campaign', async () => {
  // Prepare marketing campaign
});

const campaignLaunch = new Date('2025-11-01T12:00:00Z');
await step.sleepUntil('wait for campaign launch', campaignLaunch);

await step.do('launch campaign', async () => {
  // Launch campaign
});
```

---

### step.waitForEvent() - Wait for External Event

```typescript
step.waitForEvent<T>(
  name: string,
  options: { type: string; timeout?: string | number }
): Promise<T>
```

**Parameters:**
- `name` - Step name
- `options.type` - Event type to match
- `options.timeout` (optional) - Max wait time (default: 24 hours)

**Returns:**
- The event payload sent via `instance.sendEvent()`

**Example:**

```typescript
export class PaymentWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    // Create payment intent
    await step.do('create payment intent', async () => {
      // Call Stripe API
    });

    // Wait for webhook from Stripe (max 1 hour)
    const webhookData = await step.waitForEvent<StripeWebhook>(
      'wait for payment confirmation',
      { type: 'stripe-webhook', timeout: '1 hour' }
    );

    // Continue based on webhook
    if (webhookData.status === 'succeeded') {
      await step.do('fulfill order', async () => {
        // Fulfill order
      });
    } else {
      await step.do('handle failed payment', async () => {
        // Handle failure
      });
    }
  }
}

// Worker receives webhook and sends event to workflow
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.url.includes('/webhook/stripe')) {
      const webhookData = await req.json();

      // Get workflow instance by ID (stored when created)
      const instance = await env.PAYMENT_WORKFLOW.get(instanceId);

      // Send event to waiting workflow
      await instance.sendEvent({
        type: 'stripe-webhook',
        payload: webhookData
      });

      return new Response('OK');
    }
  }
};
```

**Timeout behavior:**
- If timeout expires, throws error and workflow can retry or fail
- Wrap in try-catch if timeout should not fail workflow

```typescript
try {
  const event = await step.waitForEvent('wait for user input', {
    type: 'user-submitted',
    timeout: '10 minutes'
  });
} catch (error) {
  // Timeout occurred - handle gracefully
  await step.do('send reminder', async () => {
    // Send reminder to user
  });
}
```

---

## WorkflowStepConfig

Configure retry behavior for individual steps:

```typescript
interface WorkflowStepConfig {
  retries?: {
    limit: number;          // Max retry attempts (Infinity allowed)
    delay: string | number; // Delay between retries
    backoff?: 'constant' | 'linear' | 'exponential';
  };
  timeout?: string | number; // Max time per attempt
}
```

### Default Configuration

If no config provided, Workflows uses:

```typescript
{
  retries: {
    limit: 5,
    delay: 10000,      // 10 seconds
    backoff: 'exponential'
  },
  timeout: '10 minutes'
}
```

### Retry Examples

**Constant Backoff (same delay each time):**

```typescript
await step.do(
  'send email',
  {
    retries: {
      limit: 3,
      delay: '30 seconds',
      backoff: 'constant'  // Always wait 30 seconds
    }
  },
  async () => {
    // Send email
  }
);
```

**Linear Backoff (increasing delay):**

```typescript
await step.do(
  'poll API',
  {
    retries: {
      limit: 5,
      delay: '1 minute',
      backoff: 'linear'  // 1m, 2m, 3m, 4m, 5m
    }
  },
  async () => {
    // Poll API
  }
);
```

**Exponential Backoff (recommended for most cases):**

```typescript
await step.do(
  'call rate-limited API',
  {
    retries: {
      limit: 10,
      delay: '10 seconds',
      backoff: 'exponential'  // 10s, 20s, 40s, 80s, 160s, ...
    },
    timeout: '5 minutes'
  },
  async () => {
    // API call
  }
);
```

**Unlimited Retries:**

```typescript
await step.do(
  'critical operation',
  {
    retries: {
      limit: Infinity,  // Retry forever
      delay: '1 minute',
      backoff: 'exponential'
    }
  },
  async () => {
    // Operation that must succeed eventually
  }
);
```

**No Retries:**

```typescript
await step.do(
  'non-idempotent operation',
  {
    retries: {
      limit: 0  // Fail immediately on error
    }
  },
  async () => {
    // One-time operation
  }
);
```

---

## Error Handling

### NonRetryableError

Force workflow to fail immediately without retrying:

```typescript
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';

export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    await step.do('validate input', async () => {
      if (!event.payload.userId) {
        throw new NonRetryableError('userId is required');
      }

      // Validate user exists
      const user = await this.env.DB.prepare(
        'SELECT * FROM users WHERE id = ?'
      ).bind(event.payload.userId).first();

      if (!user) {
        // Terminal error - retrying won't help
        throw new NonRetryableError('User not found');
      }

      return user;
    });
  }
}
```

**When to use NonRetryableError:**
- ✅ Authentication/authorization failures
- ✅ Invalid input that won't change
- ✅ Resource doesn't exist (404)
- ✅ Validation errors
- ❌ Network failures (should retry)
- ❌ Rate limits (should retry with backoff)
- ❌ Temporary service outages (should retry)

---

### Catch Errors to Continue Workflow

Prevent entire workflow from failing by catching step errors:

```typescript
export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    // Critical step - workflow fails if this fails
    await step.do('process payment', async () => {
      // Payment processing
    });

    // Optional step - workflow continues even if it fails
    try {
      await step.do('send confirmation email', async () => {
        // Email sending
      });
    } catch (error) {
      console.log(`Email failed: ${error.message}`);

      // Do cleanup or alternative action
      await step.do('log email failure', async () => {
        await this.env.DB.prepare(
          'INSERT INTO failed_emails (user_id, error) VALUES (?, ?)'
        ).bind(event.payload.userId, error.message).run();
      });
    }

    // Workflow continues
    await step.do('update order status', async () => {
      // Update status
    });
  }
}
```

**Pattern: Graceful degradation:**

```typescript
// Try primary service, fall back to secondary
let result;

try {
  result = await step.do('call primary API', async () => {
    return await callPrimaryAPI();
  });
} catch (error) {
  console.log('Primary API failed, trying backup');

  result = await step.do('call backup API', async () => {
    return await callBackupAPI();
  });
}
```

---

## Triggering Workflows

### From Workers

**Configure binding in wrangler.jsonc:**

```jsonc
{
  "name": "trigger-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-22",
  "workflows": [
    {
      "name": "my-workflow",
      "binding": "MY_WORKFLOW",
      "class_name": "MyWorkflow",
      "script_name": "workflow-worker"  // If workflow is in different Worker
    }
  ]
}
```

**Trigger from Worker:**

```typescript
type Env = {
  MY_WORKFLOW: Workflow;
};

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // Create new workflow instance
    const instance = await env.MY_WORKFLOW.create({
      params: {
        userId: '123',
        email: 'user@example.com'
      }
    });

    // Return instance ID
    return Response.json({
      id: instance.id,
      status: await instance.status()
    });
  }
};
```

### Get Instance Status

```typescript
// Get instance by ID
const instance = await env.MY_WORKFLOW.get(instanceId);

// Get status
const status = await instance.status();

console.log(status);
// {
//   status: 'running' | 'complete' | 'errored' | 'queued' | 'unknown',
//   error: string | null,
//   output: any  // Return value from run() if complete
// }
```

### Send Events to Running Instance

```typescript
// Get instance
const instance = await env.MY_WORKFLOW.get(instanceId);

// Send event (will be received by step.waitForEvent)
await instance.sendEvent({
  type: 'user-action',
  payload: { action: 'approved' }
});
```

### Pause and Resume

```typescript
// Pause instance
await instance.pause();

// Resume instance
await instance.resume();

// Terminate instance
await instance.terminate();
```

---

## Workflow Patterns

### Pattern 1: Long-Running Process

```typescript
export class VideoProcessingWorkflow extends WorkflowEntrypoint<Env, VideoParams> {
  async run(event: WorkflowEvent<VideoParams>, step: WorkflowStep) {
    const { videoId } = event.payload;

    // Step 1: Upload to processing service
    const uploadResult = await step.do('upload video', async () => {
      const video = await this.env.MY_BUCKET.get(`videos/${videoId}`);
      const response = await fetch('https://processor.example.com/upload', {
        method: 'POST',
        body: video?.body
      });
      return await response.json();
    });

    // Step 2: Wait for processing (could take hours)
    await step.sleep('wait for initial processing', '10 minutes');

    // Step 3: Poll for completion
    let processed = false;
    let attempts = 0;

    while (!processed && attempts < 20) {
      const status = await step.do(`check status attempt ${attempts}`, async () => {
        const response = await fetch(
          `https://processor.example.com/status/${uploadResult.jobId}`
        );
        return await response.json();
      });

      if (status.complete) {
        processed = true;
      } else {
        attempts++;
        await step.sleep(`wait before retry ${attempts}`, '5 minutes');
      }
    }

    // Step 4: Download processed video
    await step.do('download processed video', async () => {
      const response = await fetch(uploadResult.downloadUrl);
      const processed = await response.blob();
      await this.env.MY_BUCKET.put(`processed/${videoId}`, processed);
    });

    return { videoId, status: 'complete' };
  }
}
```

---

### Pattern 2: Event-Driven Approval Flow

```typescript
export class ApprovalWorkflow extends WorkflowEntrypoint<Env, ApprovalParams> {
  async run(event: WorkflowEvent<ApprovalParams>, step: WorkflowStep) {
    const { requestId, requesterId } = event.payload;

    // Step 1: Create approval request
    await step.do('create approval request', async () => {
      await this.env.DB.prepare(
        'INSERT INTO approvals (id, requester_id, status) VALUES (?, ?, ?)'
      ).bind(requestId, requesterId, 'pending').run();
    });

    // Step 2: Send notification to approvers
    await step.do('notify approvers', async () => {
      await sendNotification(requestId);
    });

    // Step 3: Wait for approval (max 7 days)
    let approvalEvent;

    try {
      approvalEvent = await step.waitForEvent<ApprovalEvent>(
        'wait for approval decision',
        { type: 'approval-decision', timeout: '7 days' }
      );
    } catch (error) {
      // Timeout - auto-reject
      await step.do('auto-reject due to timeout', async () => {
        await this.env.DB.prepare(
          'UPDATE approvals SET status = ? WHERE id = ?'
        ).bind('rejected', requestId).run();
      });

      return { requestId, status: 'rejected', reason: 'timeout' };
    }

    // Step 4: Process decision
    await step.do('process approval decision', async () => {
      await this.env.DB.prepare(
        'UPDATE approvals SET status = ?, approver_id = ? WHERE id = ?'
      ).bind(approvalEvent.approved ? 'approved' : 'rejected', approvalEvent.approverId, requestId).run();
    });

    // Step 5: Execute approved action (if approved)
    if (approvalEvent.approved) {
      await step.do('execute approved action', async () => {
        // Execute the action
      });
    }

    return { requestId, status: approvalEvent.approved ? 'approved' : 'rejected' };
  }
}
```

---

### Pattern 3: Scheduled Workflow

```typescript
export class DailyReportWorkflow extends WorkflowEntrypoint<Env, ReportParams> {
  async run(event: WorkflowEvent<ReportParams>, step: WorkflowStep) {
    // Calculate next 9am UTC
    const now = new Date();
    const tomorrow9am = new Date();
    tomorrow9am.setUTCDate(tomorrow9am.getUTCDate() + 1);
    tomorrow9am.setUTCHours(9, 0, 0, 0);

    // Sleep until tomorrow 9am
    await step.sleepUntil('wait until 9am tomorrow', tomorrow9am);

    // Generate report
    const report = await step.do('generate daily report', async () => {
      const results = await this.env.DB.prepare(
        'SELECT * FROM metrics WHERE date = ?'
      ).bind(now.toISOString().split('T')[0]).all();

      return {
        date: now.toISOString().split('T')[0],
        metrics: results.results
      };
    });

    // Send report
    await step.do('send report', async () => {
      await sendEmail({
        to: event.payload.recipients,
        subject: `Daily Report - ${report.date}`,
        body: formatReport(report.metrics)
      });
    });

    return { sent: true, date: report.date };
  }
}
```

---

### Pattern 4: Workflow Chaining

```typescript
export class OrderWorkflow extends WorkflowEntrypoint<Env, OrderParams> {
  async run(event: WorkflowEvent<OrderParams>, step: WorkflowStep) {
    const { orderId } = event.payload;

    // Step 1: Process payment
    const paymentResult = await step.do('process payment', async () => {
      return await processPayment(orderId);
    });

    // Step 2: Trigger fulfillment workflow
    const fulfillmentInstance = await step.do('start fulfillment', async () => {
      return await this.env.FULFILLMENT_WORKFLOW.create({
        params: {
          orderId,
          paymentId: paymentResult.id
        }
      });
    });

    // Step 3: Wait for fulfillment to complete
    await step.sleep('wait for fulfillment', '5 minutes');

    // Step 4: Check fulfillment status
    const fulfillmentStatus = await step.do('check fulfillment', async () => {
      const instance = await this.env.FULFILLMENT_WORKFLOW.get(fulfillmentInstance.id);
      return await instance.status();
    });

    if (fulfillmentStatus.status === 'complete') {
      // Step 5: Send confirmation
      await step.do('send order confirmation', async () => {
        await sendConfirmation(orderId);
      });
    }

    return { orderId, status: 'complete' };
  }
}
```

---

## Wrangler Commands

### List Workflow Instances

```bash
# List all instances of a workflow
npx wrangler workflows instances list my-workflow

# Filter by status
npx wrangler workflows instances list my-workflow --status running
npx wrangler workflows instances list my-workflow --status complete
npx wrangler workflows instances list my-workflow --status errored
```

### Describe Instance

```bash
# Get detailed info about specific instance
npx wrangler workflows instances describe my-workflow <instance-id>

# Output shows:
# - Current status (running/complete/errored)
# - Each step with start/end times
# - Step outputs
# - Retry history
# - Any errors
# - Sleep state (if sleeping)
```

### Trigger Workflow (Development)

```bash
# Deploy workflow
npx wrangler deploy

# Trigger via HTTP (if Worker is set up to trigger)
curl https://my-workflow.<subdomain>.workers.dev/
```

---

## State Persistence

### What Can Be Persisted

Workflows automatically persist state returned from `step.do()`:

**✅ Serializable Types:**
- Primitives: `string`, `number`, `boolean`, `null`
- Arrays: `[1, 2, 3]`, `['a', 'b', 'c']`
- Objects: `{ key: 'value' }`, `{ nested: { data: true } }`
- Nested structures: `{ users: [{ id: 1, name: 'Alice' }] }`

**❌ Non-Serializable Types:**
- Functions: `() => {}`
- Symbols: `Symbol('key')`
- Circular references: `const obj = {}; obj.self = obj;`
- undefined (use null instead)
- Class instances (serialize to plain objects)

**Example - Correct Serialization:**

```typescript
// ✅ Good - all values serializable
const result = await step.do('fetch data', async () => {
  return {
    users: [
      { id: 1, name: 'Alice', active: true },
      { id: 2, name: 'Bob', active: false }
    ],
    timestamp: Date.now(),
    metadata: null
  };
});

// ❌ Bad - contains function
const bad = await step.do('bad example', async () => {
  return {
    data: [1, 2, 3],
    transform: (x) => x * 2  // ❌ Function not serializable
  };
});
// This will throw an error!
```

### Access State Across Steps

```typescript
export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    // Step 1: Get data
    const userData = await step.do('fetch user', async () => {
      return { id: 123, email: 'user@example.com' };
    });

    // Step 2: Use data from step 1
    const orderData = await step.do('create order', async () => {
      return {
        userId: userData.id,      // ✅ Access previous step's data
        userEmail: userData.email,
        orderId: 'ORD-456'
      };
    });

    // Step 3: Use data from step 1 and 2
    await step.do('send confirmation', async () => {
      await sendEmail({
        to: userData.email,       // ✅ Still accessible
        subject: `Order ${orderData.orderId} confirmed`
      });
    });
  }
}
```

---

## Observability

### Built-in Metrics

Workflows automatically track:
- **Instance status**: queued, running, complete, errored, paused
- **Step execution**: start/end times, duration, success/failure
- **Retry history**: attempts, errors, delays
- **Sleep state**: when workflow will wake up
- **Output**: return values from steps and run()

### View Metrics in Dashboard

Access via Cloudflare dashboard:
1. Workers & Pages
2. Select your workflow
3. View instances and metrics

**Metrics include:**
- Total instances created
- Success/error rates
- Average execution time
- Step-level performance

### Programmatic Access

```typescript
// Get instance status
const instance = await env.MY_WORKFLOW.get(instanceId);
const status = await instance.status();

console.log(status);
// {
//   status: 'complete',
//   error: null,
//   output: { userId: '123', status: 'processed' }
// }
```

---

## Limits

| Feature | Limit |
|---------|-------|
| **Max workflow duration** | 30 days |
| **Max steps per workflow** | 10,000 |
| **Max sleep/sleepUntil duration** | 30 days |
| **Max step timeout** | 15 minutes |
| **Max concurrent instances** | Unlimited (autoscales) |
| **Max payload size** | 128 KB |
| **Max step output size** | 128 KB |
| **Max waitForEvent timeout** | 30 days |
| **Max retry limit** | Infinity (configurable) |

**Notes:**
- `step.sleep()` and `step.sleepUntil()` do NOT count toward 10,000 step limit
- Workflows can run for up to 30 days total
- Each step execution limited to 15 minutes max
- Retries count as separate attempts, not separate steps

---

## Pricing

**Requires Workers Paid plan** ($5/month)

**Workflow Executions:**
- First 10,000,000 step executions/month: **FREE**
- After that: **$0.30 per million step executions**

**What counts as a step execution:**
- Each `step.do()` call
- Each retry of a step
- `step.sleep()`, `step.sleepUntil()`, `step.waitForEvent()` do NOT count

**Cost examples:**
- Workflow with 5 steps, no retries: **5 step executions**
- Workflow with 3 steps, 1 step retries 2 times: **5 step executions** (3 + 2)
- 10M simple workflows/month (5 steps each): ((50M - 10M) / 1M) × $0.30 = **$12/month**

---

## Always Do ✅

1. **Use descriptive step names** - "fetch user data", not "step 1"
2. **Return serializable values only** - primitives, arrays, plain objects
3. **Use NonRetryableError for terminal errors** - auth failures, invalid input
4. **Configure retry limits** - avoid infinite retries unless necessary
5. **Catch errors for optional steps** - use try-catch if step can fail gracefully
6. **Use exponential backoff for retries** - default backoff for most cases
7. **Validate inputs early** - fail fast with NonRetryableError if invalid
8. **Store workflow instance IDs** - save to DB/KV to query status later
9. **Use waitForEvent for human-in-loop** - approvals, external confirmations
10. **Monitor workflow metrics** - track success rates and errors

---

## Never Do ❌

1. **Never return functions from steps** - will throw serialization error
2. **Never create circular references** - will fail to serialize
3. **Never assume steps execute immediately** - they may retry or sleep
4. **Never use blocking operations** - use step.do() for async work
5. **Never exceed 128 KB payload/output** - will fail
6. **Never retry non-idempotent operations infinitely** - use retry limits
7. **Never ignore serialization errors** - fix the data structure
8. **Never use workflows for real-time operations** - use Durable Objects instead
9. **Never skip error handling for critical steps** - wrap in try-catch or use NonRetryableError
10. **Never assume step order is guaranteed across retries** - each step is independent

---

## Troubleshooting

### Issue: "Cannot perform I/O on behalf of a different request"

**Cause:** Trying to use I/O objects created in one request context from another request handler

**Solution:** Always perform I/O within `step.do()` callbacks

```typescript
// ❌ Bad - I/O outside step
const response = await fetch('https://api.example.com/data');
const data = await response.json();

await step.do('use data', async () => {
  // Using data from outside step's I/O context
  return data;  // This will fail!
});

// ✅ Good - I/O inside step
const data = await step.do('fetch data', async () => {
  const response = await fetch('https://api.example.com/data');
  return await response.json();  // ✅ Correct
});
```

---

### Issue: NonRetryableError behaves differently in dev vs production

**Known Issue:** Throwing NonRetryableError with empty message in dev mode causes retries, but works correctly in production

**Workaround:** Always provide a message to NonRetryableError

```typescript
// ❌ May retry in dev
throw new NonRetryableError();

// ✅ Works consistently
throw new NonRetryableError('User not found');
```

**Source:** [workers-sdk#10113](https://github.com/cloudflare/workers-sdk/issues/10113)

---

### Issue: "The requested module 'cloudflare:workers' does not provide an export named 'WorkflowEvent'"

**Cause:** Incorrect import or outdated @cloudflare/workers-types

**Solution:**

```bash
# Update types
npm install -D @cloudflare/workers-types@latest

# Ensure correct import
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';
```

---

### Issue: Step returns undefined instead of expected value

**Cause:** Step callback doesn't return a value

**Solution:** Always return from step callbacks

```typescript
// ❌ Bad - no return
const result = await step.do('get data', async () => {
  const data = await fetchData();
  // Missing return!
});
console.log(result);  // undefined

// ✅ Good - explicit return
const result = await step.do('get data', async () => {
  const data = await fetchData();
  return data;  // ✅
});
```

---

### Issue: Workflow instance stuck in "running" state

**Possible causes:**
1. Step is sleeping for long duration
2. Step is waiting for event that never arrives
3. Step is retrying with long backoff

**Solution:**

```bash
# Check instance details
npx wrangler workflows instances describe my-workflow <instance-id>

# Look for:
# - Sleep state (will show wake time)
# - Waiting for event (will show event type and timeout)
# - Retry history (will show attempts and delays)
```

---

## Production Checklist

Before deploying workflows to production:

- [ ] All steps have descriptive names
- [ ] Retry limits configured for all steps
- [ ] NonRetryableError used for terminal errors
- [ ] Critical steps have error handling
- [ ] Optional steps wrapped in try-catch
- [ ] No non-serializable values returned
- [ ] Payload sizes under 128 KB
- [ ] Workflow duration under 30 days
- [ ] Instance IDs stored for status queries
- [ ] Monitoring and alerting configured
- [ ] waitForEvent timeouts configured
- [ ] Tested in development environment
- [ ] Tested retry behavior
- [ ] Tested error scenarios

---

## Related Documentation

- [Cloudflare Workflows Docs](https://developers.cloudflare.com/workflows/)
- [Get Started Guide](https://developers.cloudflare.com/workflows/get-started/guide/)
- [Workers API](https://developers.cloudflare.com/workflows/build/workers-api/)
- [Sleeping and Retrying](https://developers.cloudflare.com/workflows/build/sleeping-and-retrying/)
- [Events and Parameters](https://developers.cloudflare.com/workflows/build/events-and-parameters/)
- [Limits](https://developers.cloudflare.com/workflows/reference/limits/)
- [Pricing](https://developers.cloudflare.com/workflows/platform/pricing/)
- [Changelog](https://developers.cloudflare.com/workflows/reference/changelog/)

---

**Last Updated**: 2025-10-22
**Version**: 1.0.0
**Maintainer**: Jeremy Dawes | jeremy@jezweb.net
