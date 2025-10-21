# D1 Query Patterns Reference

**Complete guide to all D1 Workers API methods with examples**

---

## Table of Contents

1. [D1 API Methods Overview](#d1-api-methods-overview)
2. [prepare() - Prepared Statements](#prepare---prepared-statements)
3. [Query Result Methods](#query-result-methods)
4. [batch() - Multiple Queries](#batch---multiple-queries)
5. [exec() - Raw SQL](#exec---raw-sql)
6. [Common Query Patterns](#common-query-patterns)
7. [Performance Tips](#performance-tips)

---

## D1 API Methods Overview

| Method | Use Case | Returns Results | Safe for User Input |
|--------|----------|-----------------|---------------------|
| `.prepare().bind()` | **Primary method** for queries | Yes | ✅ Yes (prevents SQL injection) |
| `.batch()` | Multiple queries in one round trip | Yes | ✅ Yes (if using prepare) |
| `.exec()` | Raw SQL execution | No | ❌ No (SQL injection risk) |

---

## prepare() - Prepared Statements

**Primary method for all queries with user input.**

### Basic Syntax

```typescript
const stmt = env.DB.prepare(sql);
const bound = stmt.bind(...parameters);
const result = await bound.all(); // or .first(), .run()
```

### Method Chaining (Most Common)

```typescript
const result = await env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
  .bind(userId)
  .first();
```

### Parameter Binding

```typescript
// Single parameter
const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
  .bind('user@example.com')
  .first();

// Multiple parameters
const posts = await env.DB.prepare(
  'SELECT * FROM posts WHERE user_id = ? AND published = ? LIMIT ?'
)
.bind(userId, 1, 10)
.all();

// Use null for optional values (NEVER undefined)
const updated = await env.DB.prepare(
  'UPDATE users SET bio = ?, avatar_url = ? WHERE user_id = ?'
)
.bind(bio || null, avatarUrl || null, userId)
.run();
```

### Why use prepare()?

- ✅ **SQL injection protection** - Parameters are safely escaped
- ✅ **Performance** - Query plans can be cached
- ✅ **Reusability** - Same statement, different parameters
- ✅ **Type safety** - Works with TypeScript generics

---

## Query Result Methods

### .all() - Get All Rows

Returns all matching rows as an array.

```typescript
const { results, meta } = await env.DB.prepare('SELECT * FROM users')
  .all();

console.log(results);  // Array of row objects
console.log(meta);     // { duration, rows_read, rows_written }
```

**With Type Safety:**

```typescript
interface User {
  user_id: number;
  email: string;
  username: string;
}

const { results } = await env.DB.prepare('SELECT * FROM users')
  .all<User>();

// results is now typed as User[]
```

**Response Structure:**

```typescript
{
  success: true,
  results: [
    { user_id: 1, email: 'alice@example.com', username: 'alice' },
    { user_id: 2, email: 'bob@example.com', username: 'bob' }
  ],
  meta: {
    duration: 2.5,         // Milliseconds
    rows_read: 2,          // Rows scanned
    rows_written: 0        // Rows modified
  }
}
```

---

### .first() - Get First Row

Returns the first row or `null` if no results.

```typescript
const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
  .bind('alice@example.com')
  .first();

if (!user) {
  return c.json({ error: 'User not found' }, 404);
}
```

**With Type Safety:**

```typescript
const user = await env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
  .bind(userId)
  .first<User>();

// user is typed as User | null
```

**Note**: `.first()` doesn't add `LIMIT 1` automatically. For better performance:

```typescript
// ✅ Better: Add LIMIT 1 yourself
const user = await env.DB.prepare('SELECT * FROM users WHERE email = ? LIMIT 1')
  .bind(email)
  .first();
```

---

### .first(column) - Get Single Column Value

Returns the value of a specific column from the first row.

```typescript
// Get count
const total = await env.DB.prepare('SELECT COUNT(*) as total FROM users')
  .first('total');

console.log(total);  // 42 (just the number, not an object)

// Get specific field
const email = await env.DB.prepare('SELECT email FROM users WHERE user_id = ?')
  .bind(userId)
  .first('email');

console.log(email);  // 'user@example.com'
```

**Use Cases:**
- Counting rows
- Checking existence (SELECT 1)
- Getting single values (MAX, MIN, AVG)

---

### .run() - Execute Without Results

Used for INSERT, UPDATE, DELETE when you don't need the data back.

```typescript
const { success, meta } = await env.DB.prepare(
  'INSERT INTO users (email, username, created_at) VALUES (?, ?, ?)'
)
.bind(email, username, Date.now())
.run();

console.log(success);           // true/false
console.log(meta.last_row_id);  // ID of inserted row
console.log(meta.rows_written); // Number of rows affected
```

**Response Structure:**

```typescript
{
  success: true,
  meta: {
    duration: 1.2,
    rows_read: 0,
    rows_written: 1,
    last_row_id: 42     // Only for INSERT with AUTOINCREMENT
  }
}
```

**Check if rows were affected:**

```typescript
const result = await env.DB.prepare('DELETE FROM users WHERE user_id = ?')
  .bind(userId)
  .run();

if (result.meta.rows_written === 0) {
  return c.json({ error: 'User not found' }, 404);
}
```

---

## batch() - Multiple Queries

**CRITICAL FOR PERFORMANCE**: Execute multiple queries in one network round trip.

### Basic Batch

```typescript
const [users, posts, comments] = await env.DB.batch([
  env.DB.prepare('SELECT * FROM users LIMIT 10'),
  env.DB.prepare('SELECT * FROM posts LIMIT 10'),
  env.DB.prepare('SELECT * FROM comments LIMIT 10')
]);

console.log(users.results);     // User rows
console.log(posts.results);     // Post rows
console.log(comments.results);  // Comment rows
```

### Batch with Parameters

```typescript
const stmt1 = env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(1);
const stmt2 = env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(2);
const stmt3 = env.DB.prepare('SELECT * FROM posts WHERE user_id = ?').bind(1);

const results = await env.DB.batch([stmt1, stmt2, stmt3]);
```

### Bulk Insert with Batch

```typescript
const users = [
  { email: 'user1@example.com', username: 'user1' },
  { email: 'user2@example.com', username: 'user2' },
  { email: 'user3@example.com', username: 'user3' }
];

const inserts = users.map(u =>
  env.DB.prepare('INSERT INTO users (email, username, created_at) VALUES (?, ?, ?)')
    .bind(u.email, u.username, Date.now())
);

const results = await env.DB.batch(inserts);

const successCount = results.filter(r => r.success).length;
console.log(`Inserted ${successCount} users`);
```

### Transaction-like Behavior

```typescript
// All statements execute sequentially
// If one fails, remaining statements don't execute
await env.DB.batch([
  // Deduct credits from user 1
  env.DB.prepare('UPDATE users SET credits = credits - ? WHERE user_id = ?')
    .bind(100, userId1),

  // Add credits to user 2
  env.DB.prepare('UPDATE users SET credits = credits + ? WHERE user_id = ?')
    .bind(100, userId2),

  // Record transaction
  env.DB.prepare('INSERT INTO transactions (from_user, to_user, amount) VALUES (?, ?, ?)')
    .bind(userId1, userId2, 100)
]);
```

**Batch Behavior:**
- Executes statements **sequentially** (in order)
- Each statement commits individually (auto-commit mode)
- If one fails, **remaining statements don't execute**
- All statements in one **network round trip** (huge performance win)

### Batch Performance Comparison

```typescript
// ❌ BAD: 10 separate queries = 10 network round trips
for (let i = 0; i < 10; i++) {
  await env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
    .bind(i)
    .first();
}
// ~500ms total latency

// ✅ GOOD: 1 batch query = 1 network round trip
const userIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const queries = userIds.map(id =>
  env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(id)
);
const results = await env.DB.batch(queries);
// ~50ms total latency
```

---

## exec() - Raw SQL

**AVOID IN PRODUCTION**. Only use for migrations and one-off tasks.

### Basic Exec

```typescript
const result = await env.DB.exec('SELECT * FROM users');

console.log(result);
// { count: 1, duration: 2.5 }
```

**NOTE**: `exec()` does **not return data**, only count and duration!

### Multiple Statements

```typescript
const result = await env.DB.exec(`
  DROP TABLE IF EXISTS temp_users;
  CREATE TABLE temp_users (user_id INTEGER PRIMARY KEY);
  INSERT INTO temp_users VALUES (1), (2), (3);
`);

console.log(result);
// { count: 3, duration: 5.2 }
```

### ⚠️ NEVER Use exec() For:

```typescript
// ❌ NEVER: SQL injection vulnerability
const email = userInput;
await env.DB.exec(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ ALWAYS: Use prepared statements instead
await env.DB.prepare('SELECT * FROM users WHERE email = ?')
  .bind(email)
  .first();
```

### ✅ ONLY Use exec() For:

- Running migration files locally
- One-off maintenance tasks (PRAGMA optimize)
- Database initialization scripts
- CLI tools (not production Workers)

---

## Common Query Patterns

### Existence Check

```typescript
// Check if email exists
const exists = await env.DB.prepare('SELECT 1 FROM users WHERE email = ? LIMIT 1')
  .bind(email)
  .first();

if (exists) {
  return c.json({ error: 'Email already registered' }, 409);
}
```

### Get or Create

```typescript
// Try to find user
let user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
  .bind(email)
  .first<User>();

// Create if doesn't exist
if (!user) {
  const result = await env.DB.prepare(
    'INSERT INTO users (email, username, created_at) VALUES (?, ?, ?)'
  )
  .bind(email, username, Date.now())
  .run();

  const userId = result.meta.last_row_id;

  user = await env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
    .bind(userId)
    .first<User>();
}
```

### Pagination

```typescript
const page = 1;
const limit = 20;
const offset = (page - 1) * limit;

const [countResult, dataResult] = await env.DB.batch([
  env.DB.prepare('SELECT COUNT(*) as total FROM posts WHERE published = 1'),
  env.DB.prepare(
    'SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(limit, offset)
]);

const total = countResult.results[0].total;
const posts = dataResult.results;

return {
  posts,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
};
```

### Upsert (INSERT or UPDATE)

```typescript
// SQLite 3.24.0+ supports UPSERT
await env.DB.prepare(`
  INSERT INTO user_settings (user_id, theme, language)
  VALUES (?, ?, ?)
  ON CONFLICT(user_id) DO UPDATE SET
    theme = excluded.theme,
    language = excluded.language,
    updated_at = unixepoch()
`)
.bind(userId, theme, language)
.run();
```

### Bulk Upsert

```typescript
const settings = [
  { user_id: 1, theme: 'dark', language: 'en' },
  { user_id: 2, theme: 'light', language: 'es' }
];

const upserts = settings.map(s =>
  env.DB.prepare(`
    INSERT INTO user_settings (user_id, theme, language)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      theme = excluded.theme,
      language = excluded.language
  `).bind(s.user_id, s.theme, s.language)
);

await env.DB.batch(upserts);
```

---

## Performance Tips

### Use SELECT Column Names (Not SELECT *)

```typescript
// ❌ Bad: Fetches all columns
const users = await env.DB.prepare('SELECT * FROM users').all();

// ✅ Good: Only fetch needed columns
const users = await env.DB.prepare('SELECT user_id, email, username FROM users').all();
```

### Always Use LIMIT

```typescript
// ❌ Bad: Could return millions of rows
const posts = await env.DB.prepare('SELECT * FROM posts').all();

// ✅ Good: Limit result set
const posts = await env.DB.prepare('SELECT * FROM posts LIMIT 100').all();
```

### Use Indexes

```sql
-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_posts_published_created
  ON posts(published, created_at DESC)
  WHERE published = 1;
```

```typescript
// Query will use the index
const posts = await env.DB.prepare(
  'SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC LIMIT 10'
).all();
```

### Check Index Usage

```sql
EXPLAIN QUERY PLAN SELECT * FROM posts WHERE published = 1;
-- Should see: SEARCH posts USING INDEX idx_posts_published_created
```

### Batch Instead of Loop

```typescript
// ❌ Bad: Multiple network round trips
for (const id of userIds) {
  const user = await env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
    .bind(id)
    .first();
}

// ✅ Good: One network round trip
const queries = userIds.map(id =>
  env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(id)
);
const results = await env.DB.batch(queries);
```

---

## Meta Object Reference

Every D1 query returns a `meta` object with execution details:

```typescript
{
  duration: 2.5,          // Query execution time in milliseconds
  rows_read: 100,         // Number of rows scanned
  rows_written: 1,        // Number of rows modified (INSERT/UPDATE/DELETE)
  last_row_id: 42,        // ID of last inserted row (INSERT only)
  changed: 1              // Rows affected (UPDATE/DELETE only)
}
```

### Using Meta for Debugging

```typescript
const result = await env.DB.prepare('SELECT * FROM large_table WHERE status = ?')
  .bind('active')
  .all();

console.log(`Query took ${result.meta.duration}ms`);
console.log(`Scanned ${result.meta.rows_read} rows`);
console.log(`Returned ${result.results.length} rows`);

// If rows_read is much higher than results.length, add an index!
if (result.meta.rows_read > result.results.length * 10) {
  console.warn('Query is inefficient - consider adding an index');
}
```

---

## Official Documentation

- **Workers API**: https://developers.cloudflare.com/d1/worker-api/
- **Prepared Statements**: https://developers.cloudflare.com/d1/worker-api/prepared-statements/
- **Return Object**: https://developers.cloudflare.com/d1/worker-api/return-object/
