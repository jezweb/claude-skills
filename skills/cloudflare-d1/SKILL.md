---
name: Cloudflare D1 Database
description: |
  Complete knowledge domain for Cloudflare D1 - serverless SQLite database on Cloudflare's edge network.

  Use when: creating D1 databases, writing SQL migrations, configuring D1 bindings, querying D1 from Workers,
  handling SQLite data, building relational data models, or encountering "D1_ERROR", "statement too long",
  "too many requests queued", migration failures, or query performance issues.

  Keywords: d1, d1 database, cloudflare d1, wrangler d1, d1 migrations, d1 bindings, sqlite workers,
  serverless database, edge database, d1 queries, sql cloudflare, prepared statements, batch queries,
  d1 api, wrangler migrations, D1_ERROR, D1_EXEC_ERROR, statement too long, database bindings,
  sqlite cloudflare, sql workers api, d1 indexes, query optimization, d1 schema
---

# Cloudflare D1 Database

**Status**: Production Ready ✅
**Last Updated**: 2025-10-21
**Dependencies**: cloudflare-worker-base (for Worker setup)
**Latest Versions**: wrangler@4.43.0, @cloudflare/workers-types@4.20251014.0

---

## Quick Start (5 Minutes)

### 1. Create D1 Database

```bash
# Create a new D1 database
npx wrangler d1 create my-database

# Output includes database_id - save this!
# ✅ Successfully created DB 'my-database'
#
# [[d1_databases]]
# binding = "DB"
# database_name = "my-database"
# database_id = "<UUID>"
```

### 2. Configure Bindings

Add to your `wrangler.jsonc`:

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-11",
  "d1_databases": [
    {
      "binding": "DB",                    // Available as env.DB in your Worker
      "database_name": "my-database",      // Name from wrangler d1 create
      "database_id": "<UUID>",             // ID from wrangler d1 create
      "preview_database_id": "local-db"    // For local development
    }
  ]
}
```

**CRITICAL:**
- `binding` is how you access the database in code (`env.DB`)
- `database_id` is the production database UUID
- `preview_database_id` is for local dev (can be any string)
- **Never commit real `database_id` values to public repos** - use environment variables or secrets

### 3. Create Your First Migration

```bash
# Create migration file
npx wrangler d1 migrations create my-database create_users_table

# This creates: migrations/0001_create_users_table.sql
```

Edit the migration file:

```sql
-- migrations/0001_create_users_table.sql
DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Optimize database
PRAGMA optimize;
```

### 4. Apply Migration

```bash
# Apply locally first (for testing)
npx wrangler d1 migrations apply my-database --local

# Apply to production when ready
npx wrangler d1 migrations apply my-database --remote
```

### 5. Query from Your Worker

```typescript
// src/index.ts
import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/api/users/:email', async (c) => {
  const email = c.req.param('email');

  try {
    // ALWAYS use prepared statements with bind()
    const result = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    )
    .bind(email)
    .first();

    if (!result) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(result);
  } catch (error: any) {
    console.error('D1 Error:', error.message);
    return c.json({ error: 'Database error' }, 500);
  }
});

export default app;
```

---

## D1 Migrations System

### Migration Workflow

```bash
# 1. Create migration
npx wrangler d1 migrations create <DATABASE_NAME> <MIGRATION_NAME>

# 2. List unapplied migrations
npx wrangler d1 migrations list <DATABASE_NAME> --local
npx wrangler d1 migrations list <DATABASE_NAME> --remote

# 3. Apply migrations
npx wrangler d1 migrations apply <DATABASE_NAME> --local   # Test locally
npx wrangler d1 migrations apply <DATABASE_NAME> --remote  # Deploy to production
```

### Migration File Naming

Migrations are automatically versioned:

```
migrations/
├── 0000_initial_schema.sql
├── 0001_add_users_table.sql
├── 0002_add_posts_table.sql
└── 0003_add_indexes.sql
```

**Rules:**
- Files are executed in sequential order
- Each migration runs once (tracked in `d1_migrations` table)
- Failed migrations roll back (transactional)
- Can't modify or delete applied migrations

### Custom Migration Configuration

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-database",
      "database_id": "<UUID>",
      "migrations_dir": "db/migrations",        // Custom directory (default: migrations/)
      "migrations_table": "schema_migrations"   // Custom tracking table (default: d1_migrations)
    }
  ]
}
```

### Migration Best Practices

#### ✅ Always Do:

```sql
-- Use IF NOT EXISTS to make migrations idempotent
CREATE TABLE IF NOT EXISTS users (...);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Run PRAGMA optimize after schema changes
PRAGMA optimize;

-- Use transactions for data migrations
BEGIN TRANSACTION;
UPDATE users SET updated_at = unixepoch() WHERE updated_at IS NULL;
COMMIT;
```

#### ❌ Never Do:

```sql
-- DON'T include BEGIN TRANSACTION at start (D1 handles this)
BEGIN TRANSACTION;  -- ❌ Remove this

-- DON'T use MySQL/PostgreSQL syntax
ALTER TABLE users MODIFY COLUMN email VARCHAR(255);  -- ❌ Not SQLite

-- DON'T create tables without IF NOT EXISTS
CREATE TABLE users (...);  -- ❌ Fails if table exists
```

### Handling Foreign Keys in Migrations

```sql
-- Temporarily disable foreign key checks during schema changes
PRAGMA defer_foreign_keys = true;

-- Make schema changes that would violate foreign keys
ALTER TABLE posts DROP COLUMN author_id;
ALTER TABLE posts ADD COLUMN user_id INTEGER REFERENCES users(user_id);

-- Foreign keys re-enabled automatically at end of migration
```

---

## D1 Workers API

### Type Definitions

```typescript
// Add to env.d.ts or worker-configuration.d.ts
interface Env {
  DB: D1Database;
  // ... other bindings
}

// For Hono
type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();
```

### prepare() - Prepared Statements (PRIMARY METHOD)

**Always use prepared statements for queries with user input.**

```typescript
// Basic prepared statement
const stmt = env.DB.prepare('SELECT * FROM users WHERE user_id = ?');
const bound = stmt.bind(userId);
const result = await bound.first();

// Chained (most common pattern)
const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
  .bind(email)
  .first();
```

**Why use prepare():**
- ✅ Prevents SQL injection
- ✅ Can be reused with different parameters
- ✅ Better performance (query plan caching)
- ✅ Type-safe with TypeScript

### Query Result Methods

#### .all() - Get All Rows

```typescript
const { results, meta } = await env.DB.prepare(
  'SELECT * FROM users WHERE created_at > ?'
)
.bind(timestamp)
.all();

console.log(results);  // Array of rows
console.log(meta);     // { duration, rows_read, rows_written }
```

#### .first() - Get First Row

```typescript
// Returns first row or null
const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
  .bind('user@example.com')
  .first();

if (!user) {
  return c.json({ error: 'Not found' }, 404);
}
```

#### .first(column) - Get Single Column Value

```typescript
// Returns the value of a specific column from first row
const count = await env.DB.prepare('SELECT COUNT(*) as total FROM users')
  .first('total');

console.log(count);  // 42 (just the number, not an object)
```

#### .run() - Execute Without Results

```typescript
// For INSERT, UPDATE, DELETE
const { success, meta } = await env.DB.prepare(
  'INSERT INTO users (email, username, created_at) VALUES (?, ?, ?)'
)
.bind(email, username, Date.now())
.run();

console.log(meta);  // { duration, rows_read, rows_written, last_row_id }
```

### batch() - Execute Multiple Queries

**CRITICAL FOR PERFORMANCE**: Use batch() to reduce latency.

```typescript
// Prepare multiple statements
const stmt1 = env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(1);
const stmt2 = env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(2);
const stmt3 = env.DB.prepare('SELECT * FROM posts WHERE user_id = ?').bind(1);

// Execute all in one round trip
const results = await env.DB.batch([stmt1, stmt2, stmt3]);

console.log(results[0].results);  // Users query 1
console.log(results[1].results);  // Users query 2
console.log(results[2].results);  // Posts query
```

**Batch Behavior:**
- Executes sequentially (in order)
- Each statement commits individually (auto-commit mode)
- If one fails, remaining statements don't execute
- Much faster than individual queries (single network round trip)

**Batch Use Cases:**
```typescript
// ✅ Insert multiple rows efficiently
const inserts = users.map(user =>
  env.DB.prepare('INSERT INTO users (email, username) VALUES (?, ?)')
    .bind(user.email, user.username)
);
await env.DB.batch(inserts);

// ✅ Fetch related data in parallel
const [user, posts, comments] = await env.DB.batch([
  env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(userId),
  env.DB.prepare('SELECT * FROM posts WHERE user_id = ?').bind(userId),
  env.DB.prepare('SELECT * FROM comments WHERE user_id = ?').bind(userId)
]);
```

### exec() - Execute Raw SQL (AVOID IN PRODUCTION)

```typescript
// Only for migrations, maintenance, and one-off tasks
const result = await env.DB.exec(`
  SELECT * FROM users;
  SELECT * FROM posts;
`);

console.log(result);  // { count: 2, duration: 5 }
```

**NEVER use exec() for:**
- ❌ Queries with user input (SQL injection risk)
- ❌ Production queries (poor performance)
- ❌ Queries that need results (exec doesn't return data)

**ONLY use exec() for:**
- ✅ Running migration SQL files locally
- ✅ One-off maintenance tasks
- ✅ Database initialization scripts

---

## Query Patterns

### Basic CRUD Operations

#### Create (INSERT)

```typescript
// Single insert
const { meta } = await env.DB.prepare(
  'INSERT INTO users (email, username, created_at) VALUES (?, ?, ?)'
)
.bind(email, username, Date.now())
.run();

const newUserId = meta.last_row_id;

// Bulk insert with batch()
const users = [
  { email: 'user1@example.com', username: 'user1' },
  { email: 'user2@example.com', username: 'user2' }
];

const inserts = users.map(u =>
  env.DB.prepare('INSERT INTO users (email, username, created_at) VALUES (?, ?, ?)')
    .bind(u.email, u.username, Date.now())
);

await env.DB.batch(inserts);
```

#### Read (SELECT)

```typescript
// Single row
const user = await env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
  .bind(userId)
  .first();

// Multiple rows
const { results } = await env.DB.prepare(
  'SELECT * FROM users WHERE created_at > ? ORDER BY created_at DESC LIMIT ?'
)
.bind(timestamp, 10)
.all();

// Count
const count = await env.DB.prepare('SELECT COUNT(*) as total FROM users')
  .first('total');

// Exists check
const exists = await env.DB.prepare('SELECT 1 FROM users WHERE email = ? LIMIT 1')
  .bind(email)
  .first();

if (exists) {
  // Email already registered
}
```

#### Update (UPDATE)

```typescript
const { meta } = await env.DB.prepare(
  'UPDATE users SET username = ?, updated_at = ? WHERE user_id = ?'
)
.bind(newUsername, Date.now(), userId)
.run();

const rowsAffected = meta.rows_written;

if (rowsAffected === 0) {
  // User not found
}
```

#### Delete (DELETE)

```typescript
const { meta } = await env.DB.prepare('DELETE FROM users WHERE user_id = ?')
  .bind(userId)
  .run();

const rowsDeleted = meta.rows_written;
```

### Advanced Queries

#### Pagination

```typescript
app.get('/api/users', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  const [countResult, usersResult] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT COUNT(*) as total FROM users'),
    c.env.DB.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(limit, offset)
  ]);

  const total = countResult.results[0].total as number;
  const users = usersResult.results;

  return c.json({
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
```

#### Joins

```typescript
const { results } = await env.DB.prepare(`
  SELECT
    posts.*,
    users.username as author_name,
    users.email as author_email
  FROM posts
  INNER JOIN users ON posts.user_id = users.user_id
  WHERE posts.published = ?
  ORDER BY posts.created_at DESC
  LIMIT ?
`)
.bind(1, 10)
.all();
```

#### Transactions (Batch Pattern)

D1 doesn't support multi-statement transactions, but batch() provides sequential execution:

```typescript
// Transfer credits between users (pseudo-transaction)
await env.DB.batch([
  env.DB.prepare('UPDATE users SET credits = credits - ? WHERE user_id = ?')
    .bind(amount, fromUserId),
  env.DB.prepare('UPDATE users SET credits = credits + ? WHERE user_id = ?')
    .bind(amount, toUserId),
  env.DB.prepare('INSERT INTO transactions (from_user, to_user, amount) VALUES (?, ?, ?)')
    .bind(fromUserId, toUserId, amount)
]);
```

**Note**: If any statement fails, the batch stops. This provides some transaction-like behavior.

---

## Error Handling

### Error Types

```typescript
try {
  const result = await env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
    .bind(userId)
    .first();
} catch (error: any) {
  // D1 errors have a message property
  const errorMessage = error.message;

  if (errorMessage.includes('D1_ERROR')) {
    // D1-specific error
  } else if (errorMessage.includes('D1_EXEC_ERROR')) {
    // SQL syntax error
  } else if (errorMessage.includes('D1_TYPE_ERROR')) {
    // Type mismatch (e.g., undefined instead of null)
  } else if (errorMessage.includes('D1_COLUMN_NOTFOUND')) {
    // Column doesn't exist
  }

  console.error('Database error:', errorMessage);
  return c.json({ error: 'Database operation failed' }, 500);
}
```

### Common Errors and Fixes

#### "Statement too long"

```typescript
// ❌ DON'T: Single massive INSERT
await env.DB.exec(`
  INSERT INTO users (email) VALUES
    ('user1@example.com'),
    ('user2@example.com'),
    ... // 1000 more rows
`);

// ✅ DO: Break into batches
const batchSize = 100;
for (let i = 0; i < users.length; i += batchSize) {
  const batch = users.slice(i, i + batchSize);
  const inserts = batch.map(u =>
    env.DB.prepare('INSERT INTO users (email) VALUES (?)').bind(u.email)
  );
  await env.DB.batch(inserts);
}
```

#### "Too many requests queued"

```typescript
// ❌ DON'T: Fire off many individual queries
for (const user of users) {
  await env.DB.prepare('INSERT INTO users (email) VALUES (?)').bind(user.email).run();
}

// ✅ DO: Use batch()
const inserts = users.map(u =>
  env.DB.prepare('INSERT INTO users (email) VALUES (?)').bind(u.email)
);
await env.DB.batch(inserts);
```

#### "D1_TYPE_ERROR" (undefined vs null)

```typescript
// ❌ DON'T: Use undefined
await env.DB.prepare('INSERT INTO users (email, bio) VALUES (?, ?)')
  .bind(email, undefined);  // ❌ D1 doesn't support undefined

// ✅ DO: Use null for optional values
await env.DB.prepare('INSERT INTO users (email, bio) VALUES (?, ?)')
  .bind(email, bio || null);
```

### Retry Logic

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

      // Retry on transient errors
      const isRetryable =
        message.includes('Network connection lost') ||
        message.includes('storage caused object to be reset') ||
        message.includes('reset because its code was updated');

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Retry logic failed');
}

// Usage
const user = await queryWithRetry(() =>
  env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
    .bind(userId)
    .first()
);
```

---

## Performance Optimization

### Indexes

Indexes dramatically improve query performance for filtered columns.

#### When to Create Indexes

```typescript
// ✅ Index columns used in WHERE clauses
CREATE INDEX idx_users_email ON users(email);

// ✅ Index foreign keys
CREATE INDEX idx_posts_user_id ON posts(user_id);

// ✅ Index columns used for sorting
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

// ✅ Multi-column indexes for complex queries
CREATE INDEX idx_posts_user_published ON posts(user_id, published);
```

#### Test Index Usage

```sql
-- Check if index is being used
EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = 'user@example.com';

-- Should see: SEARCH users USING INDEX idx_users_email
```

#### Partial Indexes

```sql
-- Index only non-deleted records
CREATE INDEX idx_users_active ON users(email) WHERE deleted = 0;

-- Index only published posts
CREATE INDEX idx_posts_published ON posts(created_at DESC) WHERE published = 1;
```

### PRAGMA optimize

Run after creating indexes or making schema changes:

```sql
-- In your migration file
CREATE INDEX idx_users_email ON users(email);
PRAGMA optimize;
```

Or from Worker:

```typescript
await env.DB.exec('PRAGMA optimize');
```

### Query Optimization Tips

```typescript
// ✅ Use specific columns instead of SELECT *
const users = await env.DB.prepare(
  'SELECT user_id, email, username FROM users'
).all();

// ✅ Use LIMIT to prevent scanning entire table
const latest = await env.DB.prepare(
  'SELECT * FROM posts ORDER BY created_at DESC LIMIT 10'
).all();

// ✅ Use indexes for WHERE conditions
// Create index first: CREATE INDEX idx_users_email ON users(email)
const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
  .bind(email)
  .first();

// ❌ Avoid functions in WHERE (can't use indexes)
// Bad: WHERE LOWER(email) = 'user@example.com'
// Good: WHERE email = 'user@example.com' (store email lowercase)
```

---

## Local Development

### Local vs Remote Databases

```bash
# Create local database (automatic on first --local command)
npx wrangler d1 migrations apply my-database --local

# Query local database
npx wrangler d1 execute my-database --local --command "SELECT * FROM users"

# Query remote database
npx wrangler d1 execute my-database --remote --command "SELECT * FROM users"
```

### Local Database Location

Local D1 databases are stored in:
```
.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<database_id>.sqlite
```

### Seeding Local Database

```bash
# Create seed file
cat > seed.sql << 'EOF'
INSERT INTO users (email, username, created_at) VALUES
  ('alice@example.com', 'alice', 1698000000),
  ('bob@example.com', 'bob', 1698000060);
EOF

# Apply seed
npx wrangler d1 execute my-database --local --file=seed.sql
```

---

## Drizzle ORM (Optional)

While D1 works great with raw SQL, some developers prefer ORMs. Drizzle ORM supports D1:

```bash
npm install drizzle-orm
npm install -D drizzle-kit
```

**Note**: Drizzle adds complexity and another layer to learn. For most D1 use cases, **raw SQL with wrangler is simpler and more direct**. Only consider Drizzle if you:
- Prefer TypeScript schema definitions over SQL
- Want auto-complete for queries
- Are building a very large application with complex schemas

**Official Drizzle D1 docs**: https://orm.drizzle.team/docs/get-started-sqlite#cloudflare-d1

---

## Best Practices Summary

### ✅ Always Do:

1. **Use prepared statements** with `.bind()` for user input
2. **Use `.batch()`** for multiple queries (reduces latency)
3. **Create indexes** on frequently queried columns
4. **Run `PRAGMA optimize`** after schema changes
5. **Use `IF NOT EXISTS`** in migrations for idempotency
6. **Test migrations locally** before applying to production
7. **Handle errors gracefully** with try/catch
8. **Use `null`** instead of `undefined` for optional values
9. **Validate input** before binding to queries
10. **Check `meta.rows_written`** after UPDATE/DELETE

### ❌ Never Do:

1. **Never use `.exec()`** with user input (SQL injection risk)
2. **Never hardcode `database_id`** in public repos
3. **Never use `undefined`** in bind parameters (causes D1_TYPE_ERROR)
4. **Never fire individual queries in loops** (use batch instead)
5. **Never forget `LIMIT`** on potentially large result sets
6. **Never use `SELECT *`** in production (specify columns)
7. **Never include `BEGIN TRANSACTION`** in migration files
8. **Never modify applied migrations** (create new ones)
9. **Never skip error handling** on database operations
10. **Never assume queries succeed** (always check results)

---

## Known Issues Prevented

| Issue | Description | How to Avoid |
|-------|-------------|--------------|
| **Statement too long** | Large INSERT statements exceed D1 limits | Break into batches of 100-250 rows |
| **Transaction conflicts** | `BEGIN TRANSACTION` in migration files | Remove BEGIN/COMMIT (D1 handles this) |
| **Foreign key violations** | Schema changes break foreign key constraints | Use `PRAGMA defer_foreign_keys = true` |
| **Rate limiting / queue overload** | Too many individual queries | Use `batch()` instead of loops |
| **Memory limit exceeded** | Query loads too much data into memory | Add LIMIT, paginate results, shard queries |
| **Type mismatch errors** | Using `undefined` instead of `null` | Always use `null` for optional values |

---

## Wrangler Commands Reference

```bash
# Database management
wrangler d1 create <DATABASE_NAME>
wrangler d1 list
wrangler d1 delete <DATABASE_NAME>
wrangler d1 info <DATABASE_NAME>

# Migrations
wrangler d1 migrations create <DATABASE_NAME> <MIGRATION_NAME>
wrangler d1 migrations list <DATABASE_NAME> --local|--remote
wrangler d1 migrations apply <DATABASE_NAME> --local|--remote

# Execute queries
wrangler d1 execute <DATABASE_NAME> --local|--remote --command "SELECT * FROM users"
wrangler d1 execute <DATABASE_NAME> --local|--remote --file=./query.sql

# Time Travel (view historical data)
wrangler d1 time-travel info <DATABASE_NAME> --timestamp "2025-10-20"
wrangler d1 time-travel restore <DATABASE_NAME> --timestamp "2025-10-20"
```

---

## Official Documentation

- **D1 Overview**: https://developers.cloudflare.com/d1/
- **Get Started**: https://developers.cloudflare.com/d1/get-started/
- **Migrations**: https://developers.cloudflare.com/d1/reference/migrations/
- **Workers API**: https://developers.cloudflare.com/d1/worker-api/
- **Best Practices**: https://developers.cloudflare.com/d1/best-practices/
- **Wrangler Commands**: https://developers.cloudflare.com/workers/wrangler/commands/#d1

---

**Ready to build with D1!** 🚀
