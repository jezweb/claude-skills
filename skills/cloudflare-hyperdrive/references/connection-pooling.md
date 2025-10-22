# Connection Pooling Guide

Complete guide to connection pooling patterns with Cloudflare Hyperdrive.

---

## Overview

**Why Pooling Matters**:
- Workers have a limit of **6 concurrent external connections**
- Database drivers create new connections for each operation
- Connection pooling reuses connections across queries
- Hyperdrive provides global connection pooling near your database

---

## Workers Connection Limit

### The 6 Connection Rule

Cloudflare Workers can maintain **maximum 6 concurrent external TCP connections** (includes database connections).

**What counts toward limit**:
- ✅ Database connections (pg.Client, pg.Pool, mysql2)
- ✅ HTTP requests to external APIs
- ✅ WebSocket connections
- ✅ Any TCP socket connection

**What doesn't count**:
- ❌ Requests to Cloudflare services (D1, KV, R2, Workers AI)
- ❌ Requests within Cloudflare network
- ❌ HTTP requests to other Workers

**Source**: [Workers Platform Limits](https://developers.cloudflare.com/workers/platform/limits)

---

## Connection Pool Sizing

### Rule of Thumb

**Set `max: 5` for connection pools** to stay within Workers' 6 connection limit.

```typescript
// PostgreSQL (node-postgres)
const pool = new Pool({
  connectionString: env.HYPERDRIVE.connectionString,
  max: 5  // Leave 1 connection for other operations
});

// PostgreSQL (postgres.js)
const sql = postgres(env.HYPERDRIVE.connectionString, {
  max: 5
});
```

### Why Not 6?

- Reserve 1 connection for other operations
- Prevents hitting connection limit errors
- Allows concurrent database + API requests
- Safety margin for connection acquisition

---

## Connection Patterns

### Pattern 1: Single Connection (pg.Client)

**Use Case**: Simple queries, one query per request

```typescript
import { Client } from "pg";

export default {
  async fetch(request, env, ctx) {
    const client = new Client({
      connectionString: env.HYPERDRIVE.connectionString
    });

    await client.connect();

    try {
      const result = await client.query('SELECT * FROM users');
      return Response.json(result.rows);
    } finally {
      ctx.waitUntil(client.end());
    }
  }
};
```

**Pros**:
- Simple, straightforward
- One connection per request
- Easy to reason about

**Cons**:
- Can't run parallel queries
- Creates new connection for each request (mitigated by Hyperdrive)

**When to use**:
- Single query per request
- No parallel operations needed
- Simple CRUD operations

---

### Pattern 2: Connection Pool (pg.Pool)

**Use Case**: Multiple parallel queries in single request

```typescript
import { Pool } from "pg";

export default {
  async fetch(request, env, ctx) {
    const pool = new Pool({
      connectionString: env.HYPERDRIVE.connectionString,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    try {
      // Run parallel queries
      const [users, posts, stats] = await Promise.all([
        pool.query('SELECT * FROM users'),
        pool.query('SELECT * FROM posts'),
        pool.query('SELECT COUNT(*) FROM comments')
      ]);

      return Response.json({ users: users.rows, posts: posts.rows, stats: stats.rows });
    } finally {
      ctx.waitUntil(pool.end());
    }
  }
};
```

**Pros**:
- Parallel queries possible
- Better performance for multiple operations
- Efficient connection reuse

**Cons**:
- More complex
- Must manage pool lifecycle
- Must set max correctly

**When to use**:
- Multiple queries per request
- Parallel operations needed
- Complex data fetching

---

### Pattern 3: Reusable Pool (Advanced)

**⚠️ Advanced Pattern**: Create pool once, reuse across requests.

```typescript
import { Pool } from "pg";

// Create pool outside handler (reused across requests)
let pool: Pool | null = null;

function getPool(connectionString: string): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 60000
    });
  }
  return pool;
}

export default {
  async fetch(request, env, ctx) {
    const pool = getPool(env.HYPERDRIVE.connectionString);

    const result = await pool.query('SELECT * FROM users');
    return Response.json(result.rows);

    // NOTE: Don't call pool.end() here - pool is reused
  }
};
```

**Pros**:
- Maximum connection reuse
- Best performance
- No connection overhead

**Cons**:
- Global state (not recommended for Workers)
- Harder to debug
- Connection lifecycle management complex

**When to use**:
- High-traffic applications
- Performance-critical paths
- When you understand Workers execution model well

**⚠️ Caution**: Workers may be restarted, pool will be recreated. This pattern works but requires careful testing.

---

## Connection Pool Configuration

### pg.Pool Options

```typescript
const pool = new Pool({
  // Connection string (Hyperdrive)
  connectionString: env.HYPERDRIVE.connectionString,

  // Maximum connections in pool (CRITICAL: set to 5)
  max: 5,

  // Close idle connections after 30 seconds
  idleTimeoutMillis: 30000,

  // Timeout when acquiring connection (10 seconds)
  connectionTimeoutMillis: 10000,

  // Allow exiting process if no connections active
  allowExitOnIdle: false
});
```

### postgres.js Options

```typescript
const sql = postgres(env.HYPERDRIVE.connectionString, {
  // Maximum connections
  max: 5,

  // Idle connection timeout (seconds)
  idle_timeout: 30,

  // Connection timeout (seconds)
  connect_timeout: 10,

  // Prepared statements (CRITICAL for caching)
  prepare: true
});
```

### mysql2 Options

```typescript
const pool = mysql.createPool({
  host: env.HYPERDRIVE.host,
  user: env.HYPERDRIVE.user,
  password: env.HYPERDRIVE.password,
  database: env.HYPERDRIVE.database,
  port: env.HYPERDRIVE.port,

  // Maximum connections
  connectionLimit: 5,

  // Queue if pool exhausted
  queueLimit: 0,

  // Required for Workers
  disableEval: true
});
```

---

## Connection Cleanup

### The ctx.waitUntil() Pattern

**CRITICAL**: Always use `ctx.waitUntil()` to clean up connections AFTER response is sent.

```typescript
export default {
  async fetch(request, env, ctx) {
    const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
    await client.connect();

    try {
      const result = await client.query('SELECT ...');
      return Response.json(result.rows);  // Response sent here
    } finally {
      // Connection closed AFTER response sent (non-blocking)
      ctx.waitUntil(client.end());
    }
  }
};
```

**Why**:
- Allows Worker to return response immediately
- Connection cleanup happens in background
- Prevents adding latency to response time
- Prevents connection leaks

**DON'T do this**:
```typescript
await client.end();  // ❌ Blocks response, adds latency
```

---

## Transaction Management

### Transactions and Connection Pooling

**Problem**: Transactions hold connections for their duration, limiting pool availability.

**Impact on Pooling**:
```typescript
// ❌ Bad: Long transaction holds connection
const client = await pool.connect();
await client.query('BEGIN');
// ... many queries (connection held) ...
await client.query('COMMIT');
client.release();
```

**Better Approach**:
```typescript
// ✅ Good: Short transactions
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('INSERT ...');
  await client.query('UPDATE ...');
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();  // Return connection to pool quickly
}
```

**Best Practice**:
- Keep transactions as short as possible
- Avoid holding connections during I/O operations
- Release connections back to pool immediately after transaction

---

## Monitoring Connection Usage

### Check Active Connections

```typescript
// pg.Pool
console.log('Total clients:', pool.totalCount);
console.log('Idle clients:', pool.idleCount);
console.log('Waiting clients:', pool.waitingCount);

// postgres.js
// No built-in monitoring (check database side)
```

### Database-Side Monitoring

**PostgreSQL**:
```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'mydb';
```

**MySQL**:
```sql
SHOW STATUS LIKE 'Threads_connected';
```

---

## Connection Pool Exhaustion

### Symptoms

**Error**: `Failed to acquire a connection from the pool`

**Causes**:
1. Too many concurrent requests
2. Long-running queries holding connections
3. Transactions not releasing connections
4. Connection leaks (not calling `client.end()`)

### Solutions

**1. Use ctx.waitUntil() for cleanup**:
```typescript
ctx.waitUntil(client.end());
```

**2. Set connection timeouts**:
```typescript
const pool = new Pool({
  max: 5,
  connectionTimeoutMillis: 10000  // Fail fast if can't acquire
});
```

**3. Keep transactions short**:
```typescript
// Minimize time between BEGIN and COMMIT
```

**4. Monitor pool metrics**:
```typescript
console.log('Pool stats:', {
  total: pool.totalCount,
  idle: pool.idleCount,
  waiting: pool.waitingCount
});
```

---

## Hyperdrive's Global Pooling

### How Hyperdrive Helps

**Without Hyperdrive**:
- Each Worker request creates new connection
- 7 round trips for each connection (TCP + TLS + auth)
- High latency, many connections to database

**With Hyperdrive**:
- Global connection pool near your database
- Connection reused across Workers globally
- Only 1 round trip (Worker to Hyperdrive edge)
- Reduced connections to database

**Result**:
- Lower latency
- Fewer connections to database
- Better scalability

### Hyperdrive + Local Pooling

**Best of both worlds**:
```typescript
// Local pool (max: 5) for parallel queries in single request
const pool = new Pool({ max: 5, connectionString: env.HYPERDRIVE.connectionString });

// Hyperdrive's global pool handles reuse across Workers globally
```

**Benefits**:
- Parallel queries within request (local pool)
- Connection reuse across Workers (Hyperdrive)
- Optimal performance

---

## Best Practices

1. **Always set max: 5** for connection pools
2. **Use ctx.waitUntil()** for connection cleanup
3. **Keep transactions short** to free connections quickly
4. **Use connection pools** for parallel queries, single connections otherwise
5. **Monitor connection usage** in development
6. **Set connection timeouts** to fail fast
7. **Release connections immediately** after use
8. **Avoid holding connections** during I/O operations

---

## Common Mistakes

❌ **Mistake 1**: Setting max > 5
```typescript
const pool = new Pool({ max: 10 });  // Exceeds Workers' limit
```

❌ **Mistake 2**: Not cleaning up connections
```typescript
const client = new Client(...);
await client.connect();
const result = await client.query('SELECT ...');
return Response.json(result.rows);
// Connection leak! No client.end()
```

❌ **Mistake 3**: Blocking response with cleanup
```typescript
await client.end();  // Adds latency to response
```

❌ **Mistake 4**: Long transactions
```typescript
await client.query('BEGIN');
await fetch('https://api.example.com');  // Holding connection during HTTP request!
await client.query('COMMIT');
```

✅ **Correct Pattern**:
```typescript
const pool = new Pool({ max: 5, connectionString: env.HYPERDRIVE.connectionString });

try {
  const [users, posts] = await Promise.all([
    pool.query('SELECT * FROM users'),
    pool.query('SELECT * FROM posts')
  ]);
  return Response.json({ users: users.rows, posts: posts.rows });
} finally {
  ctx.waitUntil(pool.end());
}
```

---

## References

- [Workers Platform Limits](https://developers.cloudflare.com/workers/platform/limits)
- [node-postgres Pooling](https://node-postgres.com/apis/pool)
- [postgres.js Connection Options](https://github.com/porsager/postgres)
- [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/configuration/how-hyperdrive-works/)
