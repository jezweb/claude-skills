# Durable Objects Best Practices

Production patterns and optimization strategies.

---

## Performance

### Minimize Constructor Work

Heavy work in constructor delays request handling and hibernation wake-up.

```typescript
// ✅ GOOD
constructor(ctx: DurableObjectState, env: Env) {
  super(ctx, env);

  // Minimal initialization
  this.sessions = new Map();

  // Load from storage with blockConcurrencyWhile
  ctx.blockConcurrencyWhile(async () => {
    this.data = await ctx.storage.get('data') || defaultData;
  });
}

// ❌ BAD
constructor(ctx: DurableObjectState, env: Env) {
  super(ctx, env);

  // Expensive operations delay all requests
  await this.loadMassiveDataset();
  await this.computeComplexState();
}
```

### Use Indexes for SQL Queries

```typescript
// Create indexes for frequently queried columns
this.sql.exec(`
  CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_created_at ON messages(created_at);
`);

// Use EXPLAIN QUERY PLAN to verify index usage
const plan = this.sql.exec('EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = ?', email);
```

### Batch Operations

```typescript
// ✅ GOOD: Batch inserts
this.sql.exec(`INSERT INTO messages (text, user_id) VALUES ${rows.map(() => '(?, ?)').join(', ')}`, ...flatValues);

// ❌ BAD: Individual inserts
for (const row of rows) {
  this.sql.exec('INSERT INTO messages (text, user_id) VALUES (?, ?)', row.text, row.userId);
}
```

### Use Transactions

```typescript
// Atomic multi-step operations
this.ctx.storage.transactionSync(() => {
  this.sql.exec('UPDATE users SET balance = balance - ? WHERE id = ?', amount, senderId);
  this.sql.exec('UPDATE users SET balance = balance + ? WHERE id = ?', amount, receiverId);
  this.sql.exec('INSERT INTO transactions ...');
});
```

---

## Cost Optimization

### Use WebSocket Hibernation

```typescript
// ✅ GOOD: Hibernates when idle (~90% cost savings)
this.ctx.acceptWebSocket(server);

// ❌ BAD: Never hibernates (high duration charges)
server.accept();
```

### Use Alarms, Not setTimeout

```typescript
// ✅ GOOD: Allows hibernation
await this.ctx.storage.setAlarm(Date.now() + 60000);

// ❌ BAD: Prevents hibernation
setTimeout(() => this.doWork(), 60000);
```

### Minimize Storage Size

```typescript
// Periodic cleanup with alarms
async alarm(): Promise<void> {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

  this.sql.exec('DELETE FROM messages WHERE created_at < ?', oneDayAgo);

  // Schedule next cleanup
  await this.ctx.storage.setAlarm(Date.now() + 3600000);
}
```

---

## Reliability

### Implement Idempotent Operations

```typescript
// ✅ GOOD: Idempotent (safe to retry)
async processPayment(paymentId: string, amount: number): Promise<void> {
  // Check if already processed
  const existing = await this.ctx.storage.get(`payment:${paymentId}`);
  if (existing) {
    return;  // Already processed
  }

  // Process payment
  await this.chargeCustomer(amount);

  // Mark as processed
  await this.ctx.storage.put(`payment:${paymentId}`, { processed: true, amount });
}

// ❌ BAD: Not idempotent (duplicate charges on retry)
async processPayment(amount: number): Promise<void> {
  await this.chargeCustomer(amount);
}
```

### Limit Alarm Retries

```typescript
async alarm(info: { retryCount: number }): Promise<void> {
  if (info.retryCount > 3) {
    console.error('Giving up after 3 retries');
    await this.logFailure();
    return;
  }

  await this.doWork();
}
```

### Graceful Error Handling

```typescript
async processMessage(message: string): Promise<void> {
  try {
    await this.handleMessage(message);
  } catch (error) {
    console.error('Message processing failed:', error);

    // Store failed message for retry
    await this.ctx.storage.put(`failed:${Date.now()}`, message);

    // Don't throw - prevents retry storm
  }
}
```

---

## Security

### Validate Input

```typescript
async createUser(email: string, username: string): Promise<void> {
  // Validate input
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email');
  }

  if (!username || username.length < 3) {
    throw new Error('Invalid username');
  }

  // Use parameterized queries (prevents SQL injection)
  this.sql.exec(
    'INSERT INTO users (email, username) VALUES (?, ?)',
    email,
    username
  );
}
```

### Use Parameterized Queries

```typescript
// ✅ GOOD: Parameterized (safe from SQL injection)
this.sql.exec('SELECT * FROM users WHERE email = ?', userEmail);

// ❌ BAD: String concatenation (SQL injection risk)
this.sql.exec(`SELECT * FROM users WHERE email = '${userEmail}'`);
```

### Authenticate Requests

```typescript
async fetch(request: Request): Promise<Response> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !this.validateToken(authHeader)) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Handle authenticated request
}
```

---

## Data Management

### Monitor Storage Size

```typescript
async getStorageSize(): Promise<number> {
  // Approximate size (sum of all values)
  const map = await this.ctx.storage.list();

  let size = 0;
  for (const value of map.values()) {
    size += JSON.stringify(value).length;
  }

  return size;
}

async checkStorageLimit(): Promise<void> {
  const size = await this.getStorageSize();

  if (size > 900_000_000) {  // 900MB (90% of 1GB limit)
    console.warn('Storage approaching limit');
    await this.triggerCleanup();
  }
}
```

### Cleanup Old Data

```typescript
// Regular cleanup with alarms
async alarm(): Promise<void> {
  const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);  // 30 days

  this.sql.exec('DELETE FROM messages WHERE created_at < ?', cutoff);

  // Schedule next cleanup
  await this.ctx.storage.setAlarm(Date.now() + 86400000);  // 24 hours
}
```

### Backup Critical Data

```typescript
async backup(): Promise<void> {
  // Export to R2 or D1
  const data = await this.exportData();

  await this.env.BUCKET.put(`backup-${Date.now()}.json`, JSON.stringify(data));
}
```

---

## Testing

### Local Development

```bash
# Start local dev server
npx wrangler dev

# Test with curl
curl -X POST http://localhost:8787/api/increment
```

### Integration Tests

```typescript
// Test DO behavior
describe('Counter DO', () => {
  it('should increment', async () => {
    const stub = env.COUNTER.getByName('test-counter');

    const count1 = await stub.increment();
    expect(count1).toBe(1);

    const count2 = await stub.increment();
    expect(count2).toBe(2);
  });
});
```

### Simulate Hibernation

```typescript
// Test hibernation wake-up
constructor(ctx, env) {
  super(ctx, env);

  console.log('DO woke up!', {
    websockets: ctx.getWebSockets().length,
  });

  // Restore state
  ctx.getWebSockets().forEach(ws => {
    const metadata = ws.deserializeAttachment();
    this.sessions.set(ws, metadata);
  });
}
```

---

## Monitoring

### Log Important Events

```typescript
async importantOperation(): Promise<void> {
  console.log('Starting important operation', {
    doId: this.ctx.id.toString(),
    timestamp: Date.now(),
  });

  await this.doWork();

  console.log('Important operation completed');
}
```

### Track Metrics

```typescript
async recordMetric(metric: string, value: number): Promise<void> {
  // Store metrics
  await this.ctx.storage.put(`metric:${metric}:${Date.now()}`, value);

  // Or send to Analytics Engine
  // await this.env.ANALYTICS.writeDataPoint({
  //   indexes: [metric],
  //   doubles: [value],
  // });
}
```

### Use Tail Logs

```bash
# Tail live logs
npx wrangler tail

# Filter by DO
npx wrangler tail --search "DurableObject"
```

---

## Common Patterns

### Rate Limiting

```typescript
async checkRateLimit(userId: string, limit: number, window: number): Promise<boolean> {
  const key = `rate:${userId}`;
  const now = Date.now();

  const requests = await this.ctx.storage.get<number[]>(key) || [];

  const validRequests = requests.filter(t => now - t < window);

  if (validRequests.length >= limit) {
    return false;  // Rate limited
  }

  validRequests.push(now);
  await this.ctx.storage.put(key, validRequests);

  return true;
}
```

### Leader Election

```typescript
async electLeader(workerId: string): Promise<boolean> {
  try {
    this.sql.exec(
      'INSERT INTO leader (id, worker_id) VALUES (1, ?)',
      workerId
    );
    return true;  // Became leader
  } catch {
    return false;  // Someone else is leader
  }
}
```

### Session Management

See `templates/state-api-patterns.ts` for complete example.

---

**Official Docs**: https://developers.cloudflare.com/durable-objects/best-practices/
