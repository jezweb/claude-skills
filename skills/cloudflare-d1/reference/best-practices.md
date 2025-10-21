# D1 Best Practices

**Production-ready patterns for Cloudflare D1**

---

## Table of Contents

1. [Security](#security)
2. [Performance](#performance)
3. [Migrations](#migrations)
4. [Error Handling](#error-handling)
5. [Data Modeling](#data-modeling)
6. [Testing](#testing)
7. [Deployment](#deployment)

---

## Security

### Always Use Prepared Statements

```typescript
// ❌ NEVER: SQL injection vulnerability
const email = c.req.query('email');
await env.DB.exec(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ ALWAYS: Safe prepared statement
const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
  .bind(email)
  .first();
```

**Why?** User input like `'; DROP TABLE users; --` would execute in the first example!

### Use null Instead of undefined

```typescript
// ❌ WRONG: undefined causes D1_TYPE_ERROR
await env.DB.prepare('INSERT INTO users (email, bio) VALUES (?, ?)')
  .bind(email, undefined);

// ✅ CORRECT: Use null for optional values
await env.DB.prepare('INSERT INTO users (email, bio) VALUES (?, ?)')
  .bind(email, bio || null);
```

### Never Commit Sensitive IDs

```jsonc
// ❌ WRONG: Database ID in public repo
{
  "d1_databases": [
    {
      "database_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  // ❌
    }
  ]
}

// ✅ BETTER: Use environment variable or secret
{
  "d1_databases": [
    {
      "database_id": "$D1_DATABASE_ID"  // Reference env var
    }
  ]
}
```

Or use wrangler secrets:

```bash
npx wrangler secret put D1_DATABASE_ID
```

### Validate Input Before Binding

```typescript
// ✅ Validate email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.post('/api/users', async (c) => {
  const { email } = await c.req.json();

  if (!isValidEmail(email)) {
    return c.json({ error: 'Invalid email format' }, 400);
  }

  // Now safe to use
  const user = await c.env.DB.prepare('INSERT INTO users (email) VALUES (?)')
    .bind(email)
    .run();
});
```

---

## Performance

### Use Batch for Multiple Queries

```typescript
// ❌ BAD: 3 network round trips (~150ms)
const user = await env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(1).first();
const posts = await env.DB.prepare('SELECT * FROM posts WHERE user_id = ?').bind(1).all();
const comments = await env.DB.prepare('SELECT * FROM comments WHERE user_id = ?').bind(1).all();

// ✅ GOOD: 1 network round trip (~50ms)
const [userResult, postsResult, commentsResult] = await env.DB.batch([
  env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(1),
  env.DB.prepare('SELECT * FROM posts WHERE user_id = ?').bind(1),
  env.DB.prepare('SELECT * FROM comments WHERE user_id = ?').bind(1)
]);

const user = userResult.results[0];
const posts = postsResult.results;
const comments = commentsResult.results;
```

**Performance win: 3x faster!**

### Create Indexes for WHERE Clauses

```sql
-- ❌ Slow: Full table scan
SELECT * FROM posts WHERE user_id = 123;

-- ✅ Fast: Create index first
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

-- Now this query is fast
SELECT * FROM posts WHERE user_id = 123;
```

**Verify index is being used:**

```sql
EXPLAIN QUERY PLAN SELECT * FROM posts WHERE user_id = 123;
-- Should see: SEARCH posts USING INDEX idx_posts_user_id
```

### Run PRAGMA optimize After Schema Changes

```sql
-- After creating indexes or altering schema
PRAGMA optimize;
```

This collects statistics that help the query planner choose the best execution plan.

### Select Only Needed Columns

```typescript
// ❌ Bad: Fetches all columns (wastes bandwidth)
const users = await env.DB.prepare('SELECT * FROM users').all();

// ✅ Good: Only fetch what you need
const users = await env.DB.prepare('SELECT user_id, email, username FROM users').all();
```

### Always Use LIMIT

```typescript
// ❌ Dangerous: Could return millions of rows
const posts = await env.DB.prepare('SELECT * FROM posts WHERE published = 1').all();

// ✅ Safe: Limit result set
const posts = await env.DB.prepare(
  'SELECT * FROM posts WHERE published = 1 LIMIT 100'
).all();
```

### Use Partial Indexes

```sql
-- Index only published posts (smaller index, faster writes)
CREATE INDEX idx_posts_published ON posts(created_at DESC)
  WHERE published = 1;

-- Index only active users (exclude deleted)
CREATE INDEX idx_users_active ON users(email)
  WHERE deleted_at IS NULL;
```

Benefits:
- ✅ Smaller indexes (faster queries)
- ✅ Fewer index updates (faster writes)
- ✅ Only index relevant data

---

## Migrations

### Make Migrations Idempotent

```sql
-- ✅ ALWAYS use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY,
  email TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ✅ Use IF EXISTS for drops
DROP TABLE IF EXISTS temp_table;
```

**Why?** Re-running a migration won't fail if it's already applied.

### Never Modify Applied Migrations

```bash
# ❌ WRONG: Editing applied migration
vim migrations/0001_create_users.sql  # Already applied!

# ✅ CORRECT: Create new migration
npx wrangler d1 migrations create my-database add_users_bio_column
```

**Why?** D1 tracks which migrations have been applied. Modifying them causes inconsistencies.

### Test Migrations Locally First

```bash
# 1. Apply to local database
npx wrangler d1 migrations apply my-database --local

# 2. Test queries locally
npx wrangler d1 execute my-database --local --command "SELECT * FROM users"

# 3. Only then apply to production
npx wrangler d1 migrations apply my-database --remote
```

### Handle Foreign Keys Carefully

```sql
-- Disable foreign key checks temporarily during schema changes
PRAGMA defer_foreign_keys = true;

-- Make schema changes that would violate foreign keys
ALTER TABLE posts DROP COLUMN old_user_id;
ALTER TABLE posts ADD COLUMN user_id INTEGER REFERENCES users(user_id);

-- Foreign keys re-enabled automatically at end of migration
```

### Break Large Data Migrations into Batches

```sql
-- ❌ BAD: Single massive INSERT (causes "statement too long")
INSERT INTO users (email) VALUES
  ('user1@example.com'),
  ('user2@example.com'),
  ... -- 10,000 more rows

-- ✅ GOOD: Split into batches of 100-250 rows
-- File: 0001_migrate_users_batch1.sql
INSERT INTO users (email) VALUES
  ('user1@example.com'),
  ... -- 100 rows

-- File: 0002_migrate_users_batch2.sql
INSERT INTO users (email) VALUES
  ('user101@example.com'),
  ... -- next 100 rows
```

---

## Error Handling

### Check for Errors After Every Query

```typescript
try {
  const result = await env.DB.prepare('INSERT INTO users (email) VALUES (?)')
    .bind(email)
    .run();

  if (!result.success) {
    console.error('Insert failed');
    return c.json({ error: 'Failed to create user' }, 500);
  }

  // Success!
  const userId = result.meta.last_row_id;

} catch (error: any) {
  console.error('Database error:', error.message);
  return c.json({ error: 'Database operation failed' }, 500);
}
```

### Implement Retry Logic for Transient Errors

```typescript
async function queryWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error: any) {
      const message = error.message;

      // Check if error is retryable
      const isRetryable =
        message.includes('Network connection lost') ||
        message.includes('storage caused object to be reset') ||
        message.includes('reset because its code was updated');

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}

// Usage
const user = await queryWithRetry(() =>
  env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
    .bind(userId)
    .first()
);
```

### Handle Common D1 Errors

```typescript
try {
  await env.DB.prepare(query).bind(...params).run();
} catch (error: any) {
  const message = error.message;

  if (message.includes('D1_ERROR')) {
    // D1-specific error
    console.error('D1 error:', message);
  } else if (message.includes('UNIQUE constraint failed')) {
    // Duplicate key error
    return c.json({ error: 'Email already exists' }, 409);
  } else if (message.includes('FOREIGN KEY constraint failed')) {
    // Invalid foreign key
    return c.json({ error: 'Invalid user reference' }, 400);
  } else {
    // Unknown error
    console.error('Unknown database error:', message);
    return c.json({ error: 'Database operation failed' }, 500);
  }
}
```

---

## Data Modeling

### Use Appropriate Data Types

```sql
CREATE TABLE users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Auto-incrementing ID
  email TEXT NOT NULL,                        -- String
  username TEXT NOT NULL,
  age INTEGER,                                 -- Number
  balance REAL,                                -- Decimal/float
  is_active INTEGER DEFAULT 1,                -- Boolean (0 or 1)
  metadata TEXT,                               -- JSON (stored as TEXT)
  created_at INTEGER NOT NULL                  -- Unix timestamp
);
```

**SQLite has 5 types**: NULL, INTEGER, REAL, TEXT, BLOB

### Store Timestamps as Unix Epoch

```sql
-- ✅ RECOMMENDED: Unix timestamp (INTEGER)
created_at INTEGER NOT NULL DEFAULT (unixepoch())

-- ❌ AVOID: ISO 8601 strings (harder to query/compare)
created_at TEXT NOT NULL DEFAULT (datetime('now'))
```

**Why?** Unix timestamps are easier to compare, filter, and work with in JavaScript:

```typescript
// Easy to work with
const timestamp = Date.now();  // 1698000000
const date = new Date(timestamp);

// Easy to query
const recentPosts = await env.DB.prepare(
  'SELECT * FROM posts WHERE created_at > ?'
).bind(Date.now() - 86400000).all();  // Last 24 hours
```

### Store JSON as TEXT

```sql
CREATE TABLE users (
  user_id INTEGER PRIMARY KEY,
  email TEXT NOT NULL,
  settings TEXT  -- Store JSON here
);
```

```typescript
// Insert JSON
const settings = { theme: 'dark', language: 'en' };
await env.DB.prepare('INSERT INTO users (email, settings) VALUES (?, ?)')
  .bind(email, JSON.stringify(settings))
  .run();

// Read JSON
const user = await env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
  .bind(userId)
  .first();

const settings = JSON.parse(user.settings);
console.log(settings.theme);  // 'dark'
```

### Use Soft Deletes

```sql
CREATE TABLE users (
  user_id INTEGER PRIMARY KEY,
  email TEXT NOT NULL,
  deleted_at INTEGER  -- NULL = active, timestamp = deleted
);

-- Index for active users only
CREATE INDEX idx_users_active ON users(user_id)
  WHERE deleted_at IS NULL;
```

```typescript
// Soft delete
await env.DB.prepare('UPDATE users SET deleted_at = ? WHERE user_id = ?')
  .bind(Date.now(), userId)
  .run();

// Query only active users
const activeUsers = await env.DB.prepare(
  'SELECT * FROM users WHERE deleted_at IS NULL'
).all();
```

### Normalize Related Data

```sql
-- ✅ GOOD: Normalized (users in separate table)
CREATE TABLE posts (
  post_id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ❌ BAD: Denormalized (user data duplicated in every post)
CREATE TABLE posts (
  post_id INTEGER PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  title TEXT NOT NULL
);
```

---

## Testing

### Test Migrations Locally

```bash
# 1. Create local database
npx wrangler d1 migrations apply my-database --local

# 2. Seed with test data
npx wrangler d1 execute my-database --local --file=seed.sql

# 3. Run test queries
npx wrangler d1 execute my-database --local --command "SELECT COUNT(*) FROM users"
```

### Use Separate Databases for Development

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-app-prod",
      "database_id": "<PROD_UUID>",
      "preview_database_id": "local-dev"  // Local only
    }
  ]
}
```

**Benefits:**
- ✅ Never accidentally modify production data
- ✅ Fast local development (no network latency)
- ✅ Can reset local DB anytime

### Backup Before Major Migrations

```bash
# Export current database
npx wrangler d1 export my-database --remote --output=backup-$(date +%Y%m%d).sql

# Apply migration
npx wrangler d1 migrations apply my-database --remote

# If something goes wrong, restore from backup
npx wrangler d1 execute my-database --remote --file=backup-20251021.sql
```

---

## Deployment

### Use Preview Databases for Testing

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-app-prod",
      "database_id": "<PROD_UUID>",
      "preview_database_id": "<PREVIEW_UUID>"  // Separate preview database
    }
  ]
}
```

Deploy preview:

```bash
npx wrangler deploy --env preview
```

### Apply Migrations Before Deploying Code

```bash
# 1. Apply migrations first
npx wrangler d1 migrations apply my-database --remote

# 2. Then deploy Worker code
npx wrangler deploy
```

**Why?** Ensures database schema is ready before code expects it.

### Monitor Query Performance

```typescript
app.get('/api/users', async (c) => {
  const start = Date.now();

  const { results, meta } = await c.env.DB.prepare('SELECT * FROM users LIMIT 100')
    .all();

  const duration = Date.now() - start;

  // Log slow queries
  if (duration > 100) {
    console.warn(`Slow query: ${duration}ms, rows_read: ${meta.rows_read}`);
  }

  return c.json({ users: results });
});
```

### Use Time Travel for Data Recovery

```bash
# View database state 2 hours ago
npx wrangler d1 time-travel info my-database --timestamp "2025-10-21T10:00:00Z"

# Restore database to 2 hours ago
npx wrangler d1 time-travel restore my-database --timestamp "2025-10-21T10:00:00Z"
```

**Note**: Time Travel available for last 30 days.

---

## Summary Checklist

### Security ✅
- [ ] Always use `.prepare().bind()` for user input
- [ ] Use `null` instead of `undefined`
- [ ] Validate input before binding
- [ ] Never commit database IDs to public repos

### Performance ✅
- [ ] Use `.batch()` for multiple queries
- [ ] Create indexes on filtered columns
- [ ] Run `PRAGMA optimize` after schema changes
- [ ] Select only needed columns
- [ ] Always use `LIMIT`

### Migrations ✅
- [ ] Make migrations idempotent (IF NOT EXISTS)
- [ ] Never modify applied migrations
- [ ] Test locally before production
- [ ] Break large data migrations into batches

### Error Handling ✅
- [ ] Wrap queries in try/catch
- [ ] Implement retry logic for transient errors
- [ ] Check `result.success` and `meta.rows_written`
- [ ] Log errors with context

### Data Modeling ✅
- [ ] Use appropriate SQLite data types
- [ ] Store timestamps as Unix epoch (INTEGER)
- [ ] Use soft deletes (deleted_at column)
- [ ] Normalize related data with foreign keys

### Testing ✅
- [ ] Test migrations locally first
- [ ] Use separate development/production databases
- [ ] Backup before major migrations

### Deployment ✅
- [ ] Apply migrations before deploying code
- [ ] Use preview databases for testing
- [ ] Monitor query performance
- [ ] Use Time Travel for recovery

---

## Official Documentation

- **Best Practices**: https://developers.cloudflare.com/d1/best-practices/
- **Indexes**: https://developers.cloudflare.com/d1/best-practices/use-indexes/
- **Local Development**: https://developers.cloudflare.com/d1/best-practices/local-development/
- **Retry Queries**: https://developers.cloudflare.com/d1/best-practices/retry-queries/
- **Time Travel**: https://developers.cloudflare.com/d1/reference/time-travel/
