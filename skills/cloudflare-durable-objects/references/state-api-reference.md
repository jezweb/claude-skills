# Durable Objects State API Reference

Complete reference for the State API (SQL and Key-Value storage).

---

## SQL API (SQLite Backend)

Access via `ctx.storage.sql` (requires SQLite backend in migration).

### `exec(query, ...params)`

Execute SQL query with optional parameters. Returns cursor.

```typescript
// Insert with RETURNING
const cursor = this.sql.exec(
  'INSERT INTO users (name, email) VALUES (?, ?) RETURNING id',
  'Alice',
  'alice@example.com'
);

// SELECT
const cursor = this.sql.exec('SELECT * FROM users WHERE id = ?', userId);

// UPDATE
this.sql.exec('UPDATE users SET email = ? WHERE id = ?', newEmail, userId);

// DELETE
this.sql.exec('DELETE FROM users WHERE id = ?', userId);
```

**Parameters:**
- `query` (string): SQL query with `?` placeholders
- `...params` (any[]): Values to bind to placeholders

**Returns:** `SqlCursor`

### Cursor Methods

```typescript
// Get single row (throws if 0 or >1 rows)
const row = cursor.one<{ id: number; name: string }>();

// Get single row (returns null if no rows)
const row = cursor.one<RowType>({ allowNone: true });

// Get all rows as array
const rows = cursor.toArray<RowType>();

// Iterate cursor
for (const row of cursor) {
  console.log(row.name);
}
```

### Transactions (Synchronous)

```typescript
this.ctx.storage.transactionSync(() => {
  this.sql.exec('INSERT INTO table1 ...');
  this.sql.exec('UPDATE table2 ...');
  // All or nothing - atomic
});
```

**CRITICAL:** Must be synchronous (no `async`/`await` inside).

---

## Key-Value API

Available on both SQLite and KV backends via `ctx.storage`.

### `get(key)` / `get(keys[])`

Get single or multiple values.

```typescript
// Get single value
const value = await this.ctx.storage.get<number>('count');

// Get multiple values (returns Map)
const map = await this.ctx.storage.get<string>(['key1', 'key2', 'key3']);

// Iterate Map
for (const [key, value] of map.entries()) {
  console.log(key, value);
}
```

**Parameters:**
- `key` (string): Key to retrieve
- `keys` (string[]): Array of keys to retrieve

**Returns:** Promise<value> or Promise<Map<string, value>>

### `put(key, value)` / `put(entries)`

Put single or multiple values.

```typescript
// Put single value
await this.ctx.storage.put('count', 42);

// Put multiple values
await this.ctx.storage.put({
  key1: 'value1',
  key2: 'value2',
  key3: 'value3',
});
```

**Parameters:**
- `key` (string): Key to store
- `value` (any): Value to store (must be serializable)
- `entries` (Record<string, any>): Object with key-value pairs

**Returns:** Promise<void>

### `delete(key)` / `delete(keys[])`

Delete single or multiple keys.

```typescript
// Delete single key
await this.ctx.storage.delete('key1');

// Delete multiple keys
await this.ctx.storage.delete(['key1', 'key2', 'key3']);
```

**Returns:** Promise<boolean> (true if deleted)

### `list(options)`

List keys with optional filtering.

```typescript
// List all keys
const map = await this.ctx.storage.list();

// List with prefix
const map = await this.ctx.storage.list({ prefix: 'user:' });

// List with limit
const map = await this.ctx.storage.list({ limit: 100 });

// List in reverse order
const map = await this.ctx.storage.list({ reverse: true });

// List with start/end range
const map = await this.ctx.storage.list({
  start: 'user:a',
  end: 'user:z',
});
```

**Parameters:**
- `prefix` (string): Filter keys by prefix
- `limit` (number): Max keys to return
- `reverse` (boolean): Reverse order
- `start` (string): Start key (inclusive)
- `end` (string): End key (exclusive)

**Returns:** Promise<Map<string, any>>

### `deleteAll()`

Delete all storage (DO will cease to exist after shutdown).

```typescript
// Delete alarm first
await this.ctx.storage.deleteAlarm();

// Delete all storage
await this.ctx.storage.deleteAll();
```

**CRITICAL:**
- ✅ Atomic on SQLite backend
- ⚠️ May be partial on KV backend

**Returns:** Promise<void>

### `transaction(callback)`

Async transaction for KV operations.

```typescript
await this.ctx.storage.transaction(async (txn) => {
  const value = await txn.get('count');
  await txn.put('count', value + 1);
  await txn.put('lastUpdate', Date.now());
  // All or nothing
});
```

**Returns:** Promise<any> (callback return value)

---

## Alarms API

### `setAlarm(time)`

Schedule alarm to fire at specific time.

```typescript
// Fire in 60 seconds
await this.ctx.storage.setAlarm(Date.now() + 60000);

// Fire at specific date
await this.ctx.storage.setAlarm(new Date('2025-12-31T23:59:59Z'));
```

**Parameters:**
- `time` (number | Date): Timestamp or Date to fire

**Returns:** Promise<void>

### `getAlarm()`

Get current alarm time (null if not set).

```typescript
const alarmTime = await this.ctx.storage.getAlarm();

if (alarmTime) {
  console.log(`Alarm scheduled for ${new Date(alarmTime).toISOString()}`);
}
```

**Returns:** Promise<number | null>

### `deleteAlarm()`

Delete scheduled alarm.

```typescript
await this.ctx.storage.deleteAlarm();
```

**Returns:** Promise<void>

---

## Storage Limits

| Backend | Max Storage | deleteAll() Atomic |
|---------|-------------|-------------------|
| SQLite | 1 GB | ✅ Yes |
| KV | 128 MB | ❌ No (may be partial) |

---

## Best Practices

✅ **Always use parameterized queries** (SQL)
```typescript
// ✅ CORRECT
this.sql.exec('SELECT * FROM users WHERE id = ?', userId);

// ❌ WRONG (SQL injection risk)
this.sql.exec(`SELECT * FROM users WHERE id = ${userId}`);
```

✅ **Use transactions for multi-step operations**
```typescript
this.ctx.storage.transactionSync(() => {
  this.sql.exec('INSERT ...');
  this.sql.exec('UPDATE ...');
});
```

✅ **Create indexes for frequently queried columns**
```typescript
this.sql.exec('CREATE INDEX idx_user_email ON users(email)');
```

✅ **Monitor storage size** (approach 1GB limit)
```typescript
const size = await this.estimateStorageSize();
if (size > 900_000_000) {  // 900MB
  await this.cleanup();
}
```

---

**Official Docs**:
- SQL API: https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- KV API: https://developers.cloudflare.com/durable-objects/api/legacy-kv-storage-api/
