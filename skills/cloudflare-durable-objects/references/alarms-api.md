# Alarms API - Scheduled Tasks

Complete guide to scheduling future tasks with alarms.

---

## What are Alarms?

Alarms allow Durable Objects to **schedule themselves** to wake up at a specific time in the future.

**Use Cases:**
- Batching (accumulate items, process in bulk)
- Cleanup (delete old data periodically)
- Reminders (notifications, alerts)
- Delayed operations (rate limiting reset)
- Periodic tasks (health checks, sync)

---

## Set Alarm

### `storage.setAlarm(time)`

```typescript
// Fire in 10 seconds
await this.ctx.storage.setAlarm(Date.now() + 10000);

// Fire at specific date/time
await this.ctx.storage.setAlarm(new Date('2025-12-31T23:59:59Z'));

// Fire in 1 hour
await this.ctx.storage.setAlarm(Date.now() + 3600000);
```

**Parameters:**
- `time` (number | Date): Unix timestamp (ms) or Date object

**Behavior:**
- ✅ **Only ONE alarm per DO** - setting new alarm overwrites previous
- ✅ **Persists across hibernation** - survives DO eviction
- ✅ **Guaranteed at-least-once execution**

---

## Alarm Handler

### `alarm(alarmInfo)`

Called when alarm fires (or retries).

```typescript
async alarm(alarmInfo: { retryCount: number; isRetry: boolean }): Promise<void> {
  console.log(`Alarm fired (retry: ${alarmInfo.isRetry}, count: ${alarmInfo.retryCount})`);

  // Do work
  await this.processBatch();

  // Alarm is automatically deleted after successful execution
}
```

**Parameters:**
- `alarmInfo.retryCount` (number): Number of retries (0 on first attempt)
- `alarmInfo.isRetry` (boolean): True if this is a retry

**CRITICAL:**
- ✅ **Implement idempotent operations** (safe to retry)
- ✅ **Limit retry attempts** (avoid infinite retries)
- ❌ **Don't throw errors lightly** (triggers automatic retry)

---

## Get Alarm

### `storage.getAlarm()`

Get current alarm time (null if not set).

```typescript
const alarmTime = await this.ctx.storage.getAlarm();

if (alarmTime === null) {
  // No alarm set
  await this.ctx.storage.setAlarm(Date.now() + 60000);
} else {
  console.log(`Alarm scheduled for ${new Date(alarmTime).toISOString()}`);
}
```

**Returns:** Promise<number | null> (Unix timestamp in ms)

---

## Delete Alarm

### `storage.deleteAlarm()`

Cancel scheduled alarm.

```typescript
await this.ctx.storage.deleteAlarm();
```

**When to use:**
- Cancel scheduled task
- Before deleting DO (if using `deleteAll()`)

---

## Retry Behavior

**Automatic Retries:**
- Up to **6 retries** on failure
- Exponential backoff: **2s, 4s, 8s, 16s, 32s, 64s**
- Retries if `alarm()` throws uncaught exception

**Example with retry limit:**

```typescript
async alarm(alarmInfo: { retryCount: number; isRetry: boolean }): Promise<void> {
  if (alarmInfo.retryCount > 3) {
    console.error('Alarm failed after 3 retries, giving up');
    // Clean up to avoid infinite retries
    return;
  }

  try {
    await this.sendNotification();
  } catch (error) {
    console.error('Alarm failed:', error);
    throw error;  // Will trigger retry
  }
}
```

---

## Common Patterns

### Pattern 1: Batching

Accumulate items, process in bulk.

```typescript
async addItem(item: string): Promise<void> {
  this.buffer.push(item);
  await this.ctx.storage.put('buffer', this.buffer);

  // Schedule alarm if not already set
  const alarm = await this.ctx.storage.getAlarm();
  if (alarm === null) {
    await this.ctx.storage.setAlarm(Date.now() + 10000);  // 10s
  }
}

async alarm(): Promise<void> {
  this.buffer = await this.ctx.storage.get('buffer') || [];

  if (this.buffer.length > 0) {
    await this.processBatch(this.buffer);
    this.buffer = [];
    await this.ctx.storage.put('buffer', []);
  }

  // Alarm automatically deleted after success
}
```

### Pattern 2: Periodic Cleanup

Run cleanup every hour.

```typescript
constructor(ctx: DurableObjectState, env: Env) {
  super(ctx, env);

  // Schedule first cleanup
  ctx.blockConcurrencyWhile(async () => {
    const alarm = await ctx.storage.getAlarm();
    if (alarm === null) {
      await ctx.storage.setAlarm(Date.now() + 3600000);  // 1 hour
    }
  });
}

async alarm(): Promise<void> {
  // Cleanup old data
  await this.cleanup();

  // Schedule next cleanup
  await this.ctx.storage.setAlarm(Date.now() + 3600000);
}
```

### Pattern 3: Delayed Operation

Execute task after delay.

```typescript
async scheduleTask(task: string, delayMs: number): Promise<void> {
  await this.ctx.storage.put('pendingTask', task);
  await this.ctx.storage.setAlarm(Date.now() + delayMs);
}

async alarm(): Promise<void> {
  const task = await this.ctx.storage.get('pendingTask');

  if (task) {
    await this.executeTask(task);
    await this.ctx.storage.delete('pendingTask');
  }
}
```

### Pattern 4: Reminder/Notification

One-time reminder.

```typescript
async setReminder(message: string, fireAt: Date): Promise<void> {
  await this.ctx.storage.put('reminder', { message, fireAt: fireAt.getTime() });
  await this.ctx.storage.setAlarm(fireAt);
}

async alarm(): Promise<void> {
  const reminder = await this.ctx.storage.get('reminder');

  if (reminder) {
    await this.sendNotification(reminder.message);
    await this.ctx.storage.delete('reminder');
  }
}
```

---

## Limitations

⚠️ **One alarm per DO**
- Setting new alarm overwrites previous
- Use storage to track multiple pending tasks

⚠️ **No cron syntax**
- Alarm is one-time (but can reschedule in handler)
- For periodic tasks, reschedule in `alarm()` handler

⚠️ **Minimum precision: ~1 second**
- Don't expect millisecond precision
- Designed for longer delays (seconds to hours)

---

## Best Practices

### Idempotent Operations

```typescript
// ✅ GOOD: Idempotent (safe to retry)
async alarm(): Promise<void> {
  const messageId = await this.ctx.storage.get('messageId');

  // Check if already sent (idempotent)
  const sent = await this.checkIfSent(messageId);
  if (sent) {
    return;
  }

  await this.sendMessage(messageId);
  await this.markAsSent(messageId);
}

// ❌ BAD: Not idempotent (duplicate sends on retry)
async alarm(): Promise<void> {
  await this.sendMessage();  // Will send duplicate if retried
}
```

### Limit Retries

```typescript
async alarm(info: { retryCount: number }): Promise<void> {
  if (info.retryCount > 3) {
    console.error('Giving up after 3 retries');
    return;
  }

  // Try operation
  await this.doWork();
}
```

### Clean Up Before `deleteAll()`

```typescript
async destroy(): Promise<void> {
  // Delete alarm first
  await this.ctx.storage.deleteAlarm();

  // Then delete all storage
  await this.ctx.storage.deleteAll();
}
```

---

**Official Docs**: https://developers.cloudflare.com/durable-objects/api/alarms/
