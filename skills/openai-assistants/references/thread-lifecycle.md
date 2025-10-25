# Thread Lifecycle Management

Complete guide to managing threads effectively to avoid errors and optimize performance.

---

## Thread States

A thread progresses through these states based on run activity:

```
Idle (no active runs)
  ↓
Active (run in progress)
  ↓
Requires Action (function calling)
  ↓
Completed / Failed / Cancelled
  ↓
Idle (ready for next run)
```

---

## Common Patterns

### Pattern 1: One Thread Per User

**Use Case**: Chatbots, support assistants

```typescript
// In-memory cache (use database in production)
const userThreads = new Map<string, string>();

async function getOrCreateUserThread(userId: string): Promise<string> {
  let threadId = userThreads.get(userId);

  if (!threadId) {
    const thread = await openai.beta.threads.create({
      metadata: { user_id: userId },
    });
    threadId = thread.id;
    userThreads.set(userId, threadId);
  }

  return threadId;
}
```

**Benefits**:
- Conversation continuity
- Automatic history management
- Simple architecture

**Drawbacks**:
- Long threads consume memory
- 100k message limit eventually

### Pattern 2: Session-Based Threads

**Use Case**: Temporary conversations

```typescript
async function createSessionThread(userId: string, sessionId: string) {
  return await openai.beta.threads.create({
    metadata: {
      user_id: userId,
      session_id: sessionId,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  });
}
```

**Benefits**:
- Clear boundaries
- Easy cleanup
- Fresh context

### Pattern 3: Topic-Based Threads

**Use Case**: Multi-topic conversations

```typescript
async function getTopicThread(userId: string, topic: string) {
  const key = `${userId}:${topic}`;
  // Separate threads for different topics
  return await getOrCreateThread(key);
}
```

---

## Active Run Management

### Check for Active Runs

```typescript
async function hasActiveRun(threadId: string): Promise<boolean> {
  const runs = await openai.beta.threads.runs.list(threadId, {
    limit: 1,
    order: 'desc',
  });

  const latestRun = runs.data[0];
  return latestRun && ['queued', 'in_progress', 'cancelling'].includes(latestRun.status);
}
```

### Safe Run Creation

```typescript
async function createRunSafely(
  threadId: string,
  assistantId: string,
  cancelIfActive = true
) {
  // Check for active runs
  const runs = await openai.beta.threads.runs.list(threadId, {
    limit: 1,
    order: 'desc',
  });

  const latestRun = runs.data[0];
  if (latestRun && ['queued', 'in_progress'].includes(latestRun.status)) {
    if (cancelIfActive) {
      await openai.beta.threads.runs.cancel(threadId, latestRun.id);
      // Wait for cancellation
      while (latestRun.status !== 'cancelled') {
        await new Promise(r => setTimeout(r, 500));
        latestRun = await openai.beta.threads.runs.retrieve(threadId, latestRun.id);
      }
    } else {
      throw new Error('Thread has active run');
    }
  }

  return await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  });
}
```

---

## Cleanup Strategies

### Time-Based Cleanup

```typescript
async function cleanupOldThreads(maxAgeHours: number = 24) {
  // Query your database for old threads
  const oldThreads = await db.getThreadsOlderThan(maxAgeHours);

  for (const threadId of oldThreads) {
    await openai.beta.threads.del(threadId);
    await db.deleteThreadRecord(threadId);
  }
}
```

### Message Count-Based

```typescript
async function archiveIfTooLong(threadId: string, maxMessages: number = 1000) {
  const messages = await openai.beta.threads.messages.list(threadId);

  if (messages.data.length >= maxMessages) {
    // Archive to database
    await db.archiveThread(threadId, messages.data);

    // Create new thread
    return await openai.beta.threads.create({
      metadata: { previous_thread: threadId },
    });
  }

  return threadId;
}
```

### Safe Deletion

```typescript
async function safeDeleteThread(threadId: string) {
  // Cancel all active runs first
  const runs = await openai.beta.threads.runs.list(threadId);

  for (const run of runs.data) {
    if (['queued', 'in_progress'].includes(run.status)) {
      await openai.beta.threads.runs.cancel(threadId, run.id);
    }
  }

  // Wait a moment for cancellations
  await new Promise(r => setTimeout(r, 1000));

  // Delete thread
  await openai.beta.threads.del(threadId);
}
```

---

## Error Handling

### Concurrent Run Prevention

```typescript
class ThreadManager {
  private locks = new Map<string, Promise<any>>();

  async executeRun(threadId: string, assistantId: string) {
    // Wait if another run is in progress
    if (this.locks.has(threadId)) {
      await this.locks.get(threadId);
    }

    // Create lock
    const runPromise = this._runAssistant(threadId, assistantId);
    this.locks.set(threadId, runPromise);

    try {
      return await runPromise;
    } finally {
      this.locks.delete(threadId);
    }
  }

  private async _runAssistant(threadId: string, assistantId: string) {
    // Run logic here
  }
}
```

---

## Best Practices

1. **Always check for active runs** before creating new ones
2. **Use metadata** to track ownership and expiration
3. **Implement cleanup** to manage costs
4. **Set reasonable limits** (message count, age)
5. **Handle errors gracefully** (active run conflicts)
6. **Archive old conversations** before deletion
7. **Use locks** for concurrent access

---

## Monitoring

```typescript
async function getThreadStats(threadId: string) {
  const thread = await openai.beta.threads.retrieve(threadId);
  const messages = await openai.beta.threads.messages.list(threadId);
  const runs = await openai.beta.threads.runs.list(threadId);

  return {
    threadId: thread.id,
    createdAt: new Date(thread.created_at * 1000),
    messageCount: messages.data.length,
    runCount: runs.data.length,
    lastRun: runs.data[0],
    metadata: thread.metadata,
  };
}
```

---

**Last Updated**: 2025-10-25
