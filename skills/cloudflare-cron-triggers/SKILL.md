---
name: Cloudflare Cron Triggers
description: |
  Complete knowledge domain for Cloudflare Cron Triggers - scheduled execution of Workers using
  cron expressions for periodic tasks, maintenance jobs, and automated workflows.

  Use when: scheduling Workers to run periodically, adding cron triggers to Workers, configuring
  scheduled tasks, testing cron handlers, combining crons with Workflows, enabling Green Compute,
  handling multiple schedules, or encountering "scheduled handler not found", "cron expression invalid",
  "changes not propagating", "handler does not export", "timezone issues" errors.

  Keywords: cloudflare cron, cron triggers, scheduled workers, scheduled handler, periodic tasks,
  background jobs, scheduled tasks, cron expression, wrangler crons, scheduled event, green compute,
  workflow triggers, maintenance tasks, scheduled() handler, ScheduledController, UTC timezone
license: MIT
---

# Cloudflare Cron Triggers

**Status**: Production Ready ✅
**Last Updated**: 2025-10-23
**Dependencies**: cloudflare-worker-base (for Worker setup)
**Latest Versions**: wrangler@4.43.0, @cloudflare/workers-types@4.20251014.0

---

## Quick Start (5 Minutes)

### 1. Add Scheduled Handler to Your Worker

**src/index.ts:**

```typescript
export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('Cron job executed at:', new Date(controller.scheduledTime));
    console.log('Triggered by cron:', controller.cron);

    // Your scheduled task logic here
    await doPeriodicTask(env);
  },
};
```

**Why this matters:**
- Handler must be named exactly `scheduled` (not `scheduledHandler` or `onScheduled`)
- Must be exported in default export object
- Must use ES modules format (not Service Worker format)

### 2. Configure Cron Trigger in Wrangler

**wrangler.jsonc:**

```jsonc
{
  "name": "my-scheduled-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-23",
  "triggers": {
    "crons": [
      "0 * * * *"  // Every hour at minute 0
    ]
  }
}
```

**CRITICAL:**
- Cron expressions use 5 fields: `minute hour day-of-month month day-of-week`
- All times are **UTC only** (no timezone conversion)
- Changes take **up to 15 minutes** to propagate globally

### 3. Test Locally

```bash
# Enable scheduled testing
npx wrangler dev --test-scheduled

# In another terminal, trigger the scheduled handler
curl "http://localhost:8787/__scheduled?cron=0+*+*+*+*"

# View output in wrangler dev terminal
```

**Testing tips:**
- `/__scheduled` endpoint is only available with `--test-scheduled` flag
- Can pass any cron expression in query parameter
- Python Workers use `/cdn-cgi/handler/scheduled` instead

### 4. Deploy

```bash
npm run deploy
# or
npx wrangler deploy
```

**After deployment:**
- Changes may take up to 15 minutes to propagate
- Check dashboard: Workers & Pages > [Your Worker] > **Cron Triggers**
- View past executions in **Logs** tab

---

## Cron Expression Syntax

### Five-Field Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of Week (0-6, Sunday=0)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of Month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

### Special Characters

| Character | Meaning | Example |
|-----------|---------|---------|
| `*` | Every | `* * * * *` = every minute |
| `,` | List | `0,30 * * * *` = every hour at :00 and :30 |
| `-` | Range | `0 9-17 * * *` = every hour from 9am-5pm |
| `/` | Step | `*/15 * * * *` = every 15 minutes |

### Common Patterns

```bash
# Every minute
* * * * *

# Every 5 minutes
*/5 * * * *

# Every 15 minutes
*/15 * * * *

# Every hour at minute 0
0 * * * *

# Every hour at minute 30
30 * * * *

# Every 6 hours
0 */6 * * *

# Every day at midnight (00:00 UTC)
0 0 * * *

# Every day at noon (12:00 UTC)
0 12 * * *

# Every day at 3:30am UTC
30 3 * * *

# Every Monday at 9am UTC
0 9 * * 1

# Every weekday at 9am UTC
0 9 * * 1-5

# Every Sunday at midnight UTC
0 0 * * 0

# First day of every month at midnight UTC
0 0 1 * *

# Twice a day (6am and 6pm UTC)
0 6,18 * * *

# Every 30 minutes during business hours (9am-5pm UTC, weekdays)
*/30 9-17 * * 1-5
```

**CRITICAL: UTC Timezone Only**
- All cron triggers execute on **UTC time**
- No timezone conversion available
- Convert your local time to UTC manually
- Example: 9am PST = 5pm UTC (next day during DST)

---

## ScheduledController Interface

```typescript
interface ScheduledController {
  readonly cron: string;           // The cron expression that triggered this execution
  readonly type: string;           // Always "scheduled"
  readonly scheduledTime: number;  // Unix timestamp (ms) when scheduled
}
```

### Properties

#### `controller.cron` (string)

The cron expression that triggered this execution.

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    console.log(`Triggered by: ${controller.cron}`);
    // Output: "Triggered by: 0 * * * *"
  },
};
```

**Use case:** Differentiate between multiple cron schedules (see Multiple Cron Triggers pattern).

#### `controller.type` (string)

Always returns `"scheduled"` for cron-triggered executions.

```typescript
if (controller.type === 'scheduled') {
  // This is a cron-triggered execution
}
```

#### `controller.scheduledTime` (number)

Unix timestamp (milliseconds since epoch) when this execution was scheduled to run.

```typescript
export default {
  async scheduled(controller: ScheduledController): Promise<void> {
    const scheduledDate = new Date(controller.scheduledTime);
    console.log(`Scheduled for: ${scheduledDate.toISOString()}`);
    // Output: "Scheduled for: 2025-10-23T15:00:00.000Z"
  },
};
```

**Note:** This is the **scheduled** time, not the actual execution time. Due to system load, actual execution may be slightly delayed (usually <1 second).

---

## Execution Context

```typescript
export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext  // ← Execution context
  ): Promise<void> {
    // Use ctx.waitUntil() for async operations that should complete
    ctx.waitUntil(logToAnalytics(env));
  },
};
```

### `ctx.waitUntil(promise: Promise<any>)`

Extends the execution context to wait for async operations to complete after the handler returns.

**Use cases:**
- Logging to external services
- Analytics tracking
- Cleanup operations
- Non-critical background tasks

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    // Critical task - must complete before handler exits
    await processData(env);

    // Non-critical tasks - can complete in background
    ctx.waitUntil(sendMetrics(env));
    ctx.waitUntil(cleanupOldData(env));
    ctx.waitUntil(notifySlack({ message: 'Cron completed' }));
  },
};
```

**Important:** First `waitUntil()` that fails will be reported as the status in dashboard logs.

---

## Integration Patterns

### 1. Standalone Scheduled Worker

**Best for:** Workers that only run on schedule (no HTTP requests)

```typescript
// src/index.ts
interface Env {
  DB: D1Database;
  MY_BUCKET: R2Bucket;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('Running scheduled maintenance...');

    // Database cleanup
    await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?')
      .bind(Date.now())
      .run();

    // Generate daily report
    const report = await generateDailyReport(env.DB);

    // Upload to R2
    await env.MY_BUCKET.put(
      `reports/${new Date().toISOString().split('T')[0]}.json`,
      JSON.stringify(report)
    );

    console.log('Maintenance complete');
  },
};
```

---

### 2. Combined with Hono (Fetch + Scheduled)

**Best for:** Workers that handle both HTTP requests and scheduled tasks

```typescript
// src/index.ts
import { Hono } from 'hono';

interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

// Regular HTTP routes
app.get('/', (c) => c.text('Worker is running'));

app.get('/api/stats', async (c) => {
  const stats = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
  return c.json(stats);
});

// Export both fetch handler and scheduled handler
export default {
  // Handle HTTP requests
  fetch: app.fetch,

  // Handle cron triggers
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('Cron triggered:', controller.cron);

    // Run scheduled task
    await updateCache(env.DB);

    // Log completion
    ctx.waitUntil(logExecution(controller.scheduledTime));
  },
};
```

**Why this pattern:**
- One Worker handles both use cases
- Share environment bindings
- Reduce number of Workers to manage
- Lower costs (one Worker subscription)

---

### 3. Multiple Cron Triggers

**Best for:** Different schedules for different tasks

**wrangler.jsonc:**

```jsonc
{
  "triggers": {
    "crons": [
      "*/5 * * * *",    // Every 5 minutes
      "0 */6 * * *",    // Every 6 hours
      "0 0 * * *"       // Daily at midnight UTC
    ]
  }
}
```

**src/index.ts:**

```typescript
export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    // Route based on which cron triggered this execution
    switch (controller.cron) {
      case '*/5 * * * *':
        // Every 5 minutes: Check system health
        await checkSystemHealth(env);
        break;

      case '0 */6 * * *':
        // Every 6 hours: Sync data from external API
        await syncExternalData(env);
        break;

      case '0 0 * * *':
        // Daily at midnight: Generate reports and cleanup
        await generateDailyReports(env);
        await cleanupOldData(env);
        break;

      default:
        console.warn(`Unknown cron trigger: ${controller.cron}`);
    }
  },
};
```

**CRITICAL:**
- Use exact cron expression match (whitespace sensitive)
- Maximum 3 cron triggers per Worker (Free plan)
- Standard/Paid plan supports more (check limits)

---

### 4. Accessing Environment Bindings

**All Worker bindings available in scheduled handler:**

```typescript
interface Env {
  // Databases
  DB: D1Database;

  // Storage
  MY_BUCKET: R2Bucket;
  KV_NAMESPACE: KVNamespace;

  // AI & Vectors
  AI: Ai;
  VECTOR_INDEX: VectorizeIndex;

  // Queues & Workflows
  MY_QUEUE: Queue;
  MY_WORKFLOW: Workflow;

  // Durable Objects
  RATE_LIMITER: DurableObjectNamespace;

  // Secrets
  API_KEY: string;
}

export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    // D1 Database
    const users = await env.DB.prepare('SELECT * FROM users WHERE active = 1').all();

    // R2 Storage
    const file = await env.MY_BUCKET.get('data.json');

    // KV Storage
    const config = await env.KV_NAMESPACE.get('config', 'json');

    // Workers AI
    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      prompt: 'Summarize today\'s data',
    });

    // Send to Queue
    await env.MY_QUEUE.send({ type: 'process', data: users.results });

    // Trigger Workflow
    await env.MY_WORKFLOW.create({ input: { timestamp: Date.now() } });

    // Use secrets
    await fetch('https://api.example.com/webhook', {
      headers: { Authorization: `Bearer ${env.API_KEY}` },
    });
  },
};
```

---

### 5. Combining with Workflows

**Best for:** Multi-step, long-running tasks triggered on schedule

**wrangler.jsonc:**

```jsonc
{
  "triggers": {
    "crons": ["0 2 * * *"]  // Daily at 2am UTC
  },
  "workflows": [
    {
      "name": "daily-report-workflow",
      "binding": "DAILY_REPORT"
    }
  ]
}
```

**src/index.ts:**

```typescript
interface Env {
  DAILY_REPORT: Workflow;
}

export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    console.log('Triggering daily report workflow...');

    // Trigger workflow with initial state
    const instance = await env.DAILY_REPORT.create({
      params: {
        date: new Date().toISOString().split('T')[0],
        reportType: 'daily-summary',
      },
    });

    console.log(`Workflow started: ${instance.id}`);
  },
};
```

**Why use Workflows:**
- Workflows can run for hours (cron handlers have CPU limits)
- Built-in retry and error handling
- State persistence across steps
- Better for complex, multi-step processes

**Reference:** [Cloudflare Workflows Docs](https://developers.cloudflare.com/workflows/)

---

### 6. Error Handling in Scheduled Handlers

```typescript
export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    try {
      // Main task
      await performScheduledTask(env);
    } catch (error) {
      // Log error
      console.error('Scheduled task failed:', error);

      // Send alert
      await sendAlert({
        worker: 'my-scheduled-worker',
        cron: controller.cron,
        error: error.message,
        timestamp: new Date(controller.scheduledTime).toISOString(),
      });

      // Store failure in database
      ctx.waitUntil(
        env.DB.prepare(
          'INSERT INTO cron_failures (cron, error, timestamp) VALUES (?, ?, ?)'
        )
          .bind(controller.cron, error.message, Date.now())
          .run()
      );

      // Re-throw to mark execution as failed
      throw error;
    }
  },
};

async function sendAlert(details: any): Promise<void> {
  await fetch('https://hooks.slack.com/services/YOUR/WEBHOOK/URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 Cron job failed: ${details.worker}`,
      blocks: [
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Worker:*\n${details.worker}` },
            { type: 'mrkdwn', text: `*Cron:*\n${details.cron}` },
            { type: 'mrkdwn', text: `*Error:*\n${details.error}` },
            { type: 'mrkdwn', text: `*Time:*\n${details.timestamp}` },
          ],
        },
      ],
    }),
  });
}
```

---

## Wrangler Configuration

### Basic Configuration

```jsonc
{
  "name": "my-scheduled-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-23",
  "triggers": {
    "crons": ["0 * * * *"]
  }
}
```

---

### Multiple Cron Triggers

```jsonc
{
  "triggers": {
    "crons": [
      "*/5 * * * *",     // Every 5 minutes
      "0 */6 * * *",     // Every 6 hours
      "0 2 * * *",       // Daily at 2am UTC
      "0 0 * * 1"        // Weekly on Monday at midnight UTC
    ]
  }
}
```

**Limits:**
- Free: 3 cron schedules max
- Paid: Higher limits (check current limits)

---

### Environment-Specific Crons

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "env": {
    "dev": {
      "triggers": {
        "crons": ["*/5 * * * *"]  // Dev: every 5 minutes for testing
      }
    },
    "staging": {
      "triggers": {
        "crons": ["*/30 * * * *"]  // Staging: every 30 minutes
      }
    },
    "production": {
      "triggers": {
        "crons": ["0 * * * *"]  // Production: hourly
      }
    }
  }
}
```

**Deploy specific environment:**

```bash
# Deploy to dev
npx wrangler deploy --env dev

# Deploy to production
npx wrangler deploy --env production
```

---

### Removing All Cron Triggers

```jsonc
{
  "triggers": {
    "crons": []  // Empty array removes all crons
  }
}
```

After deploy, Worker will no longer execute on schedule.

---

## Testing & Development

### Local Testing with Wrangler

```bash
# Start dev server with scheduled testing enabled
npx wrangler dev --test-scheduled
```

This exposes `/__scheduled` endpoint for triggering scheduled handlers.

---

### Trigger Scheduled Handler

```bash
# Trigger with default cron (if only one configured)
curl "http://localhost:8787/__scheduled"

# Trigger with specific cron expression
curl "http://localhost:8787/__scheduled?cron=0+*+*+*+*"

# Trigger with URL-encoded cron
curl "http://localhost:8787/__scheduled?cron=*/5+*+*+*+*"
```

**Note:** Use `+` instead of spaces in URL, or URL-encode properly.

---

### Verify Handler Output

```bash
# Start dev server
npx wrangler dev --test-scheduled

# In another terminal, trigger and watch output
curl "http://localhost:8787/__scheduled?cron=0+*+*+*+*"
```

Output appears in `wrangler dev` terminal:

```
[wrangler:inf] GET /__scheduled?cron=0+*+*+*+* 200 OK (45ms)
Cron job executed at: 2025-10-23T15:00:00.000Z
Triggered by cron: 0 * * * *
Scheduled task completed successfully
```

---

### Test Multiple Cron Expressions

```bash
# Test hourly cron
curl "http://localhost:8787/__scheduled?cron=0+*+*+*+*"

# Test daily cron
curl "http://localhost:8787/__scheduled?cron=0+0+*+*+*"

# Test weekly cron
curl "http://localhost:8787/__scheduled?cron=0+0+*+*+1"
```

---

### Python Workers Testing

```bash
# Python Workers use different endpoint
curl "http://localhost:8787/cdn-cgi/handler/scheduled?cron=*+*+*+*+*"
```

---

## Green Compute

Run cron triggers only in data centers powered by renewable energy.

### Enable Green Compute

**Via Dashboard:**

1. Go to [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages)
2. In **Account details** section, find **Compute Setting**
3. Click **Change**
4. Select **Green Compute**
5. Click **Confirm**

**Applies to:**
- All cron triggers in your account
- Reduces carbon footprint
- No additional cost
- May introduce slight delays in some regions

**How it works:**
- Cloudflare routes cron executions to green-powered data centers
- Uses renewable energy: wind, solar, hydroelectric
- Verified through Power Purchase Agreements (PPAs) and Renewable Energy Credits (RECs)

---

## Known Issues Prevention

This skill prevents **6** documented issues:

### Issue #1: Cron Changes Not Propagating

**Error:** Cron triggers updated in wrangler.jsonc but not executing

**Source:** [Cloudflare Docs - Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)

**Why It Happens:**
- Changes to cron triggers take up to **15 minutes** to propagate globally
- Cloudflare network needs time to update edge nodes
- No instant propagation like regular deploys

**Prevention:**
- Wait 15 minutes after deploy before expecting execution
- Check dashboard: Workers & Pages > [Worker] > Cron Triggers
- Use `wrangler triggers deploy` for trigger-only changes

```bash
# If you only changed triggers (not code), use:
npx wrangler triggers deploy

# Wait 15 minutes, then verify in dashboard
```

---

### Issue #2: Handler Does Not Export

**Error:** `Handler does not export a 'scheduled' method`

**Source:** Common deployment error

**Why It Happens:**
- Handler not named exactly `scheduled`
- Handler not exported in default export object
- Using Service Worker format instead of ES modules

**Prevention:**

```typescript
// ❌ Wrong: Incorrect handler name
export default {
  async scheduledHandler(controller, env, ctx) { }
};

// ❌ Wrong: Not in default export
export async function scheduled(controller, env, ctx) { }

// ✅ Correct: Named 'scheduled' in default export
export default {
  async scheduled(controller, env, ctx) { }
};
```

---

### Issue #3: UTC Timezone Confusion

**Error:** Cron runs at wrong time

**Source:** User expectation vs. reality

**Why It Happens:**
- All cron triggers run on **UTC time only**
- No timezone conversion available
- Users expect local timezone

**Prevention:**

Convert your local time to UTC manually:

```typescript
// Want to run at 9am PST (UTC-8)?
// 9am PST = 5pm UTC (17:00)
{
  "triggers": {
    "crons": ["0 17 * * *"]  // 9am PST = 5pm UTC
  }
}

// Want to run at 6pm EST (UTC-5)?
// 6pm EST = 11pm UTC (23:00)
{
  "triggers": {
    "crons": ["0 23 * * *"]  // 6pm EST = 11pm UTC
  }
}

// Remember: DST changes affect conversion!
// PST is UTC-8, PDT is UTC-7
```

**Tools:**
- [Time Zone Converter](https://www.timeanddate.com/worldclock/converter.html)
- [Cron Expression Generator](https://crontab.guru/)

---

### Issue #4: Invalid Cron Expression

**Error:** Cron doesn't execute, no error shown

**Source:** Silent validation failure

**Why It Happens:**
- Invalid cron syntax silently fails
- Validation happens at deploy, but may not be obvious
- Common mistakes: wrong field order, invalid ranges

**Prevention:**

```bash
# ❌ Wrong: Too many fields (6 fields instead of 5)
"crons": ["0 0 * * * *"]  # Has seconds field - not supported

# ❌ Wrong: Invalid minute range
"crons": ["65 * * * *"]  # Minute must be 0-59

# ❌ Wrong: Invalid day of week
"crons": ["0 0 * * 7"]  # Day of week is 0-6 (use 0 for Sunday)

# ✅ Correct: 5 fields, valid ranges
"crons": ["0 0 * * 0"]  # Sunday at midnight UTC
```

**Validation:**
- Use [Crontab Guru](https://crontab.guru/) to validate expressions
- Check wrangler deploy output for errors
- Test locally with `--test-scheduled`

---

### Issue #5: Missing ES Modules Format

**Error:** `Worker must use ES modules format`

**Source:** Legacy Service Worker format

**Why It Happens:**
- Scheduled handler requires ES modules format
- Old Service Worker format not supported
- Mixed format in codebase

**Prevention:**

```typescript
// ❌ Wrong: Service Worker format
addEventListener('scheduled', (event) => {
  event.waitUntil(handleScheduled(event));
});

// ✅ Correct: ES modules format
export default {
  async scheduled(controller, env, ctx) {
    await handleScheduled(controller, env, ctx);
  },
};
```

---

### Issue #6: CPU Time Limits Exceeded

**Error:** `CPU time limit exceeded`

**Source:** Long-running scheduled tasks

**Why It Happens:**
- Default CPU limit: 30 seconds
- Long-running tasks exceed limit
- No automatic timeout extension

**Prevention:**

**Option 1: Increase CPU limit in wrangler.jsonc**

```jsonc
{
  "limits": {
    "cpu_ms": 300000  // 5 minutes (max for Standard plan)
  }
}
```

**Option 2: Use Workflows for long-running tasks**

```typescript
// Instead of long task in cron:
export default {
  async scheduled(controller, env, ctx) {
    // Trigger Workflow that can run for hours
    await env.MY_WORKFLOW.create({
      params: { task: 'long-running-job' },
    });
  },
};
```

**Option 3: Break into smaller chunks**

```typescript
export default {
  async scheduled(controller, env, ctx) {
    // Process in batches
    const batch = await getNextBatch(env.DB);

    for (const item of batch) {
      await processItem(item);
    }

    // If more work, send to Queue for next batch
    const hasMore = await hasMoreWork(env.DB);
    if (hasMore) {
      await env.MY_QUEUE.send({ type: 'continue-processing' });
    }
  },
};
```

---

## Always Do ✅

1. **Use exact handler name** - Must be `scheduled`, not `scheduledHandler` or variants
2. **Use ES modules format** - Export in default object, not addEventListener
3. **Convert to UTC** - All cron times are UTC, convert from local timezone
4. **Wait 15 minutes** - Cron changes take up to 15 min to propagate
5. **Test locally first** - Use `wrangler dev --test-scheduled`
6. **Validate cron syntax** - Use [Crontab Guru](https://crontab.guru/)
7. **Handle errors gracefully** - Log, alert, and optionally re-throw
8. **Use ctx.waitUntil()** - For non-critical async operations
9. **Consider Workflows** - For tasks that need >30 seconds CPU time
10. **Monitor executions** - Check dashboard logs regularly

---

## Never Do ❌

1. **Never assume local timezone** - All crons run on UTC
2. **Never use 6-field cron expressions** - Cloudflare uses 5-field format (no seconds)
3. **Never rely on instant propagation** - Changes take up to 15 minutes
4. **Never use Service Worker format** - Must use ES modules format
5. **Never forget error handling** - Uncaught errors fail silently
6. **Never run CPU-intensive tasks without limit increase** - Default 30s limit
7. **Never use day-of-week 7** - Use 0 for Sunday (0-6 range only)
8. **Never deploy without testing** - Always test with `--test-scheduled` first
9. **Never ignore execution logs** - Dashboard shows past failures
10. **Never hardcode schedules for testing** - Use environment-specific configs

---

## Common Use Cases

### 1. Database Cleanup

**Every day at 2am UTC: Delete old records**

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    // Delete sessions older than 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    await env.DB.prepare('DELETE FROM sessions WHERE created_at < ?')
      .bind(thirtyDaysAgo)
      .run();

    // Delete soft-deleted users older than 90 days
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);

    await env.DB.prepare('DELETE FROM users WHERE deleted_at < ?')
      .bind(ninetyDaysAgo)
      .run();

    console.log('Database cleanup completed');
  },
};
```

**wrangler.jsonc:**
```jsonc
{
  "triggers": {
    "crons": ["0 2 * * *"]  // Daily at 2am UTC
  }
}
```

---

### 2. API Data Collection

**Every 15 minutes: Fetch data from external API**

```typescript
interface Env {
  DB: D1Database;
  API_KEY: string;
}

export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    try {
      // Fetch from external API
      const response = await fetch('https://api.example.com/v1/data', {
        headers: {
          Authorization: `Bearer ${env.API_KEY}`,
        },
      });

      const data = await response.json();

      // Store in D1
      for (const item of data.items) {
        await env.DB.prepare(
          'INSERT INTO collected_data (id, value, timestamp) VALUES (?, ?, ?)'
        )
          .bind(item.id, item.value, Date.now())
          .run();
      }

      console.log(`Collected ${data.items.length} items`);
    } catch (error) {
      console.error('Failed to collect data:', error);
      throw error;  // Mark execution as failed
    }
  },
};
```

**wrangler.jsonc:**
```jsonc
{
  "triggers": {
    "crons": ["*/15 * * * *"]  // Every 15 minutes
  }
}
```

---

### 3. Daily Reports Generation

**Every day at 8am UTC: Generate and email report**

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    // Generate report from database
    const report = await generateDailyReport(env.DB);

    // Store in R2
    const fileName = `reports/${new Date().toISOString().split('T')[0]}.json`;
    await env.MY_BUCKET.put(fileName, JSON.stringify(report));

    // Send via email
    ctx.waitUntil(sendReportEmail(report, env.RESEND_API_KEY));

    console.log('Daily report generated and sent');
  },
};

async function generateDailyReport(db: D1Database) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfDay = yesterday.setHours(0, 0, 0, 0);
  const endOfDay = yesterday.setHours(23, 59, 59, 999);

  const stats = await db
    .prepare(`
      SELECT
        COUNT(*) as total_users,
        COUNT(DISTINCT user_id) as active_users,
        SUM(revenue) as total_revenue
      FROM events
      WHERE timestamp BETWEEN ? AND ?
    `)
    .bind(startOfDay, endOfDay)
    .first();

  return {
    date: yesterday.toISOString().split('T')[0],
    stats,
  };
}
```

**wrangler.jsonc:**
```jsonc
{
  "triggers": {
    "crons": ["0 8 * * *"]  // Daily at 8am UTC
  }
}
```

---

### 4. Cache Warming

**Every hour: Pre-warm cache with popular content**

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    // Get most popular pages from analytics
    const popularPages = await env.DB
      .prepare('SELECT url FROM pages ORDER BY views DESC LIMIT 100')
      .all();

    // Fetch each page to warm cache
    const requests = popularPages.results.map((page) =>
      fetch(`https://example.com${page.url}`, {
        cf: {
          cacheTtl: 3600,  // Cache for 1 hour
        },
      })
    );

    await Promise.all(requests);

    console.log(`Warmed cache for ${popularPages.results.length} pages`);
  },
};
```

**wrangler.jsonc:**
```jsonc
{
  "triggers": {
    "crons": ["0 * * * *"]  // Every hour
  }
}
```

---

### 5. Monitoring & Health Checks

**Every 5 minutes: Check system health**

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    const checks = await Promise.allSettled([
      checkDatabaseHealth(env.DB),
      checkAPIHealth(),
      checkStorageHealth(env.MY_BUCKET),
    ]);

    const failures = checks.filter((check) => check.status === 'rejected');

    if (failures.length > 0) {
      // Send alert
      await sendAlert({
        service: 'health-check',
        failures: failures.map((f) => f.reason),
        timestamp: new Date().toISOString(),
      });
    }
  },
};

async function checkDatabaseHealth(db: D1Database): Promise<void> {
  const result = await db.prepare('SELECT 1 as health').first();
  if (!result || result.health !== 1) {
    throw new Error('Database health check failed');
  }
}

async function checkAPIHealth(): Promise<void> {
  const response = await fetch('https://api.example.com/health');
  if (!response.ok) {
    throw new Error(`API health check failed: ${response.status}`);
  }
}

async function checkStorageHealth(bucket: R2Bucket): Promise<void> {
  const testObject = await bucket.get('health-check.txt');
  if (!testObject) {
    throw new Error('Storage health check failed');
  }
}
```

**wrangler.jsonc:**
```jsonc
{
  "triggers": {
    "crons": ["*/5 * * * *"]  // Every 5 minutes
  }
}
```

---

## TypeScript Types

```typescript
// Scheduled event controller
interface ScheduledController {
  readonly cron: string;
  readonly type: string;
  readonly scheduledTime: number;
}

// Execution context
interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

// Scheduled handler
export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void>;
}
```

---

## Limits & Pricing

### Limits

| Feature | Free Plan | Paid Plan |
|---------|-----------|-----------|
| **Cron triggers per Worker** | 3 | Higher (check docs) |
| **CPU time per execution** | 10 ms (avg) | 30 seconds (default), 5 min (max) |
| **Wall clock time** | 30 seconds | 15 minutes |
| **Memory** | 128 MB | 128 MB |

### Pricing

Cron triggers use **Standard Workers pricing**:

- **Workers Paid Plan**: $5/month required
- **Requests**: $0.30 per million requests (after 10M free)
- **CPU Time**: $0.02 per million CPU-ms (after 30M free)

**Cron execution = 1 request**

**Example:**
- Cron runs every hour (24 times/day)
- 30 days × 24 executions = 720 executions/month
- Average 50ms CPU time per execution

**Cost:**
- Requests: 720 (well under 10M free)
- CPU time: 720 × 50ms = 36,000ms (under 30M free)
- **Total: $5/month (just subscription)**

**High frequency example:**
- Cron runs every minute (1440 times/day)
- 30 days × 1440 = 43,200 executions/month
- Still under free tier limits
- **Total: $5/month**

---

## Troubleshooting

### Issue: Cron not executing

**Possible causes:**
1. Changes not propagated yet (wait 15 minutes)
2. Invalid cron expression
3. Handler not exported correctly
4. Worker not deployed

**Solution:**

```bash
# Re-deploy
npx wrangler deploy

# Wait 15 minutes

# Check dashboard
# Workers & Pages > [Worker] > Cron Triggers

# Check logs
# Workers & Pages > [Worker] > Logs > Real-time Logs
```

---

### Issue: Handler executes but fails

**Possible causes:**
1. Uncaught error in handler
2. CPU time limit exceeded
3. Missing environment bindings
4. Network timeout

**Solution:**

```typescript
export default {
  async scheduled(controller, env, ctx) {
    try {
      await yourTask(env);
    } catch (error) {
      // Log detailed error
      console.error('Handler failed:', {
        error: error.message,
        stack: error.stack,
        cron: controller.cron,
        time: new Date(controller.scheduledTime),
      });

      // Send alert
      ctx.waitUntil(sendAlert(error));

      // Re-throw to mark as failed
      throw error;
    }
  },
};
```

Check logs in dashboard for error details.

---

### Issue: Wrong execution time

**Cause:** UTC vs. local timezone confusion

**Solution:**

Convert your desired local time to UTC:

```typescript
// Want 9am PST (UTC-8)?
// 9am PST = 5pm UTC (17:00)

{
  "triggers": {
    "crons": ["0 17 * * *"]
  }
}
```

**Tools:**
- [World Clock Converter](https://www.timeanddate.com/worldclock/converter.html)
- Remember DST changes (PST vs PDT)

---

### Issue: Local testing not working

**Possible causes:**
1. Missing `--test-scheduled` flag
2. Wrong endpoint (should be `/__scheduled`)
3. Python Worker (use `/cdn-cgi/handler/scheduled`)

**Solution:**

```bash
# Correct: Start with flag
npx wrangler dev --test-scheduled

# In another terminal
curl "http://localhost:8787/__scheduled?cron=0+*+*+*+*"
```

---

## Production Checklist

Before deploying cron triggers to production:

- [ ] Cron expression validated on [Crontab Guru](https://crontab.guru/)
- [ ] Handler named exactly `scheduled` in default export
- [ ] ES modules format used (not Service Worker)
- [ ] Local timezone converted to UTC
- [ ] Error handling implemented with logging
- [ ] Alerts configured for failures
- [ ] CPU limits increased if needed (`limits.cpu_ms`)
- [ ] Environment bindings tested
- [ ] Tested locally with `--test-scheduled`
- [ ] Deployment tested in staging environment
- [ ] Waited 15 minutes after deploy for propagation
- [ ] Verified execution in dashboard logs
- [ ] Monitoring and alerting configured
- [ ] Documentation updated with schedule details

---

## Related Documentation

- **Cloudflare Cron Triggers**: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- **Scheduled Handler API**: https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/
- **Cron Trigger Examples**: https://developers.cloudflare.com/workers/examples/cron-trigger/
- **Multiple Cron Triggers**: https://developers.cloudflare.com/workers/examples/multiple-cron-triggers/
- **Wrangler Triggers Command**: https://developers.cloudflare.com/workers/wrangler/commands/#triggers
- **Workers Pricing**: https://developers.cloudflare.com/workers/platform/pricing/
- **Workflows Integration**: https://developers.cloudflare.com/workflows/
- **Crontab Guru** (validator): https://crontab.guru/
- **Time Zone Converter**: https://www.timeanddate.com/worldclock/converter.html

---

**Last Updated**: 2025-10-23
**Version**: 1.0.0
**Maintainer**: Jeremy Dawes | jeremy@jezweb.net
