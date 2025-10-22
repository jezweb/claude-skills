# Query Caching Guide

Complete guide to Hyperdrive's automatic query caching.

---

## Overview

Hyperdrive automatically caches **read-only queries** at Cloudflare's edge, reducing database load and improving response times.

**Key Features**:
- ✅ Automatic caching (enabled by default)
- ✅ Wire protocol parsing (differentiates reads from writes)
- ✅ Edge-based caching (near users)
- ✅ Zero configuration required

---

## What Gets Cached

### Cacheable Queries (✅ Cached)

**PostgreSQL**:
```sql
-- Simple SELECT
SELECT * FROM articles WHERE published = true ORDER BY date DESC LIMIT 50;

-- JOIN queries
SELECT u.name, p.title
FROM users u
JOIN posts p ON u.id = p.author_id
WHERE p.published = true;

-- Aggregates
SELECT COUNT(*) FROM users WHERE created_at > '2024-01-01';

-- Subqueries
SELECT * FROM products
WHERE category IN (SELECT id FROM categories WHERE active = true);
```

**MySQL**:
```sql
-- Simple SELECT
SELECT * FROM articles WHERE DATE(published_time) = CURDATE() ORDER BY published_time DESC LIMIT 50;

-- Aggregates
SELECT COUNT(*) as total_users FROM users;

-- JOIN queries
SELECT orders.id, customers.name
FROM orders
JOIN customers ON orders.customer_id = customers.id;
```

---

### Non-Cacheable Queries (❌ NOT Cached)

**Mutating Queries** (writes to database):
```sql
-- INSERT
INSERT INTO users (name, email) VALUES ('John', 'john@example.com');

-- UPDATE
UPDATE posts SET published = true WHERE id = 123;

-- DELETE
DELETE FROM sessions WHERE expired = true;

-- UPSERT
INSERT INTO users (id, name) VALUES (1, 'John')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- CREATE/ALTER/DROP
CREATE TABLE new_table (...);
ALTER TABLE users ADD COLUMN age INT;
DROP TABLE old_table;
```

**Volatile Functions** (PostgreSQL):
```sql
-- LASTVAL() - returns last sequence value
SELECT LASTVAL(), * FROM articles LIMIT 50;

-- CURRVAL() - current sequence value
SELECT CURRVAL('users_id_seq');

-- NEXTVAL() - advance sequence
SELECT NEXTVAL('users_id_seq');

-- RANDOM() - random values
SELECT * FROM products ORDER BY RANDOM() LIMIT 10;

-- NOW(), CURRENT_TIMESTAMP with modifications
SELECT * FROM logs WHERE created_at > NOW() - INTERVAL '1 hour';

-- PG_SLEEP() - delays
SELECT PG_SLEEP(1);
```

**Volatile Functions** (MySQL):
```sql
-- LAST_INSERT_ID()
SELECT LAST_INSERT_ID(), * FROM articles LIMIT 50;

-- UUID() - generates random UUIDs
SELECT UUID();

-- RAND() - random values
SELECT * FROM products ORDER BY RAND() LIMIT 10;

-- NOW() with modifications
SELECT * FROM logs WHERE created_at > NOW() - INTERVAL 1 HOUR;
```

**Transactions**:
```sql
-- Any query within explicit transaction
BEGIN;
SELECT * FROM users;  -- Not cached (within transaction)
COMMIT;
```

---

## How Caching Works

### 1. Wire Protocol Parsing

Hyperdrive parses the **database wire protocol** (not SQL text) to determine cacheability:

```
Client → Query → Hyperdrive → Parse Protocol → Cacheable?
                                                  ↓
                                            Yes → Check Cache
                                                  ↓
                                            Hit? → Return Cached
                                                  ↓
                                            Miss → Query Database → Cache Result
```

**Why wire protocol, not SQL parsing?**
- More accurate (understands database's interpretation)
- Handles different SQL dialects
- Detects function volatility correctly

---

### 2. Cache Key Generation

Cache key includes:
- Query text
- Parameter values
- Database connection details

**Example**:
```typescript
// These are DIFFERENT cache keys (different parameters)
await pool.query('SELECT * FROM users WHERE id = $1', [1]);
await pool.query('SELECT * FROM users WHERE id = $1', [2]);

// These are the SAME cache key (same query, same parameter)
await pool.query('SELECT * FROM users WHERE id = $1', [1]);
await pool.query('SELECT * FROM users WHERE id = $1', [1]);  // Cache HIT
```

---

### 3. Cache Invalidation

**Automatic Invalidation**:
- Write queries invalidate related cached queries
- Hyperdrive tracks dependencies
- No manual invalidation needed

**Example**:
```typescript
// 1. Query cached
await pool.query('SELECT * FROM users WHERE id = 1');  // Cache MISS, then cached

// 2. Read from cache
await pool.query('SELECT * FROM users WHERE id = 1');  // Cache HIT

// 3. Write invalidates cache
await pool.query('UPDATE users SET name = $1 WHERE id = 1', ['Jane']);

// 4. Query re-cached
await pool.query('SELECT * FROM users WHERE id = 1');  // Cache MISS (invalidated), then re-cached
```

---

## Cache Configuration

### Default Settings

**Enabled by default** - no configuration needed.

```typescript
// Caching is automatically enabled
const client = new Client({
  connectionString: env.HYPERDRIVE.connectionString
});
```

---

### Disable Caching (Per Hyperdrive Config)

```bash
# Disable caching for specific Hyperdrive config
npx wrangler hyperdrive update <hyperdrive-id> --caching-disabled

# Re-enable caching
npx wrangler hyperdrive update <hyperdrive-id> --caching-disabled=false
```

**When to disable**:
- Debugging cache-related issues
- Testing without cache
- Workloads that never benefit from caching (all writes)

---

## Optimizing for Caching

### 1. Use Prepared Statements (postgres.js)

**Critical**: postgres.js requires `prepare: true` for caching.

```typescript
// ✅ Cacheable (prepared statements enabled)
const sql = postgres(env.HYPERDRIVE.connectionString, {
  prepare: true  // CRITICAL for caching
});

// ❌ NOT cacheable (prepare disabled)
const sql = postgres(env.HYPERDRIVE.connectionString, {
  prepare: false  // Queries won't be cached!
});
```

**Why**: Hyperdrive caches prepared statements, not simple queries from postgres.js.

---

### 2. Avoid Volatile Functions

**Instead of**:
```sql
-- ❌ Not cached (RANDOM)
SELECT * FROM products ORDER BY RANDOM() LIMIT 10;
```

**Use**:
```typescript
// ✅ Cached (random offset generated in Worker)
const offset = Math.floor(Math.random() * 1000);
await pool.query('SELECT * FROM products OFFSET $1 LIMIT 10', [offset]);
```

---

### 3. Parameterize Queries

**Instead of**:
```typescript
// ❌ Different cache keys for each user ID
await pool.query(`SELECT * FROM users WHERE id = ${userId}`);
```

**Use**:
```typescript
// ✅ Same cache key structure, parameterized
await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
```

---

### 4. Keep Transactions Short

**Avoid**:
```typescript
// ❌ Queries within transaction not cached
await client.query('BEGIN');
await client.query('SELECT * FROM users');  // Not cached
await client.query('SELECT * FROM posts');  // Not cached
await client.query('COMMIT');
```

**Use**:
```typescript
// ✅ Queries outside transaction are cached
await client.query('SELECT * FROM users');  // Cached
await client.query('SELECT * FROM posts');  // Cached
```

---

### 5. Separate Read and Write Patterns

**Organize code**:
```typescript
// Read-heavy endpoints (benefit from caching)
app.get('/users', async (c) => {
  const users = await pool.query('SELECT * FROM users LIMIT 100');
  return c.json(users.rows);
});

// Write-heavy endpoints (no caching)
app.post('/users', async (c) => {
  const { name, email } = await c.req.json();
  await pool.query('INSERT INTO users (name, email) VALUES ($1, $2)', [name, email]);
  return c.json({ success: true });
});
```

---

## Monitoring Cache Performance

### Cache Status

Check cache hit/miss in response:

```typescript
const response = await fetch('https://your-worker.dev/api/users');
const cacheStatus = response.headers.get('cf-cache-status');

console.log(cacheStatus);
// Values: HIT, MISS, BYPASS, EXPIRED, etc.
```

**Cache Status Values**:
- `HIT` - Query result served from cache
- `MISS` - Query not in cache, fetched from database
- `BYPASS` - Caching disabled or non-cacheable query
- `EXPIRED` - Cached result expired, re-fetched
- `UNCACHEABLE` - Query cannot be cached (write operation)

---

### Hyperdrive Analytics

View cache metrics in Cloudflare dashboard:

1. Go to [Hyperdrive Dashboard](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select your Hyperdrive configuration
3. Click **Metrics** tab

**Available Metrics**:
- **Cache hit ratio** - % of queries served from cache
- **Query count** - Total queries
- **Cache status breakdown** - HIT vs MISS vs BYPASS
- **Query latency** - p50, p95, p99
- **Result size** - Bytes cached

**Ideal Cache Hit Ratio**:
- **Read-heavy workload**: 60-90% cache hit ratio
- **Mixed workload**: 30-60% cache hit ratio
- **Write-heavy workload**: 10-30% cache hit ratio

---

## Cache Behavior by Query Type

| Query Type | PostgreSQL | MySQL | Cached? |
|------------|------------|-------|---------|
| **SELECT** | `SELECT * FROM users` | `SELECT * FROM users` | ✅ Yes |
| **INSERT** | `INSERT INTO users VALUES (...)` | `INSERT INTO users VALUES (...)` | ❌ No |
| **UPDATE** | `UPDATE users SET name = ...` | `UPDATE users SET name = ...` | ❌ No |
| **DELETE** | `DELETE FROM users WHERE ...` | `DELETE FROM users WHERE ...` | ❌ No |
| **CREATE TABLE** | `CREATE TABLE new_table (...)` | `CREATE TABLE new_table (...)` | ❌ No |
| **LASTVAL()** | `SELECT LASTVAL()` | `SELECT LAST_INSERT_ID()` | ❌ No |
| **RANDOM()** | `SELECT ... ORDER BY RANDOM()` | `SELECT ... ORDER BY RAND()` | ❌ No |
| **Transaction** | `BEGIN; SELECT ...; COMMIT;` | `START TRANSACTION; SELECT ...; COMMIT;` | ❌ No |
| **JOIN** | `SELECT * FROM a JOIN b` | `SELECT * FROM a JOIN b` | ✅ Yes |
| **Aggregate** | `SELECT COUNT(*) FROM users` | `SELECT COUNT(*) FROM users` | ✅ Yes |
| **Subquery** | `SELECT * WHERE id IN (SELECT ...)` | `SELECT * WHERE id IN (SELECT ...)` | ✅ Yes |

---

## Cache TTL

**Default TTL**: Hyperdrive manages TTL automatically based on workload patterns.

**Cache invalidation**:
- Write queries invalidate related cached queries
- TTL expires based on usage patterns
- No manual TTL configuration needed

---

## Best Practices

1. **Enable prepared statements** (postgres.js: `prepare: true`)
2. **Avoid volatile functions** (RANDOM, LASTVAL, etc.)
3. **Use parameterized queries** for consistent cache keys
4. **Keep transactions short** (queries in transactions not cached)
5. **Separate read and write workloads** for better cache efficiency
6. **Monitor cache hit ratio** in Hyperdrive analytics
7. **Don't disable caching** unless debugging (it's automatic and beneficial)

---

## Troubleshooting

### Low Cache Hit Ratio

**Symptom**: Most queries showing cache MISS.

**Causes & Solutions**:

**1. Prepared statements disabled (postgres.js)**:
```typescript
// ❌ Problem
const sql = postgres(url, { prepare: false });

// ✅ Solution
const sql = postgres(url, { prepare: true });
```

**2. Using volatile functions**:
```sql
-- ❌ Problem
SELECT LASTVAL(), * FROM articles;

-- ✅ Solution
SELECT * FROM articles;
```

**3. Mostly write queries**:
```sql
-- ❌ Problem (writes not cached)
INSERT INTO logs (...) VALUES (...);

-- ✅ Expected behavior (writes aren't cached, this is normal)
```

**4. Transactions wrapping reads**:
```typescript
// ❌ Problem
await client.query('BEGIN');
await client.query('SELECT ...');
await client.query('COMMIT');

// ✅ Solution
await client.query('SELECT ...');  // No transaction
```

---

### Queries Not Cached

**Symptom**: Expected cacheable queries showing BYPASS or UNCACHEABLE.

**Debug Steps**:

**1. Check query is read-only**:
```sql
-- ✅ Should be cached
SELECT * FROM users;

-- ❌ Not cached (write)
UPDATE users SET name = 'John';
```

**2. Check for volatile functions**:
```sql
-- ❌ Not cached
SELECT RANDOM();

-- ✅ Cached
SELECT * FROM products;
```

**3. Check prepared statements enabled** (postgres.js):
```typescript
const sql = postgres(url, { prepare: true });
```

**4. Check caching not disabled**:
```bash
npx wrangler hyperdrive get <hyperdrive-id>
# Check "caching": { "disabled": false }
```

---

## References

- [Query Caching Docs](https://developers.cloudflare.com/hyperdrive/configuration/query-caching/)
- [PostgreSQL Volatile Functions](https://www.postgresql.org/docs/current/xfunc-volatility.html)
- [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/configuration/how-hyperdrive-works/)
- [Hyperdrive Metrics](https://developers.cloudflare.com/hyperdrive/observability/metrics/)
