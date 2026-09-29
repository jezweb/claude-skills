# D1 Specifics

Reference for Cloudflare D1 behaviour that differs from standard SQLite. Load this when troubleshooting D1 issues or when you need to write raw SQL against D1.

## D1 vs Standard SQLite

| Feature | Standard SQLite | D1 |
|---------|-----------------|-----|
| Foreign keys default | OFF | **ON (always enforced)** |
| `PRAGMA foreign_keys` | Can toggle freely | **Blocked** — always on |
| `PRAGMA defer_foreign_keys` | Available | Available (for migration ordering) |
| Other PRAGMAs | Full access | Restricted (table_list, table_info, table_xinfo only) |
| Bound parameters per query | ~999 | **100** |
| Max database size | Filesystem | 10 GB (paid) / 500 MB (free) |
| Max columns per table | Unlimited | **100** |
| Max string/BLOB size | Unlimited | **2 MB** |
| Max SQL statement length | Unlimited | **100 KB** |
| Max queries per Worker invocation | N/A | 1000 (paid) / 50 (free) |
| Max concurrent D1 connections | N/A | **6 per Worker** |
| Max query duration | N/A | **30 seconds** |
| Concurrency model | Multi-writer | **Single-threaded** (Durable Object) |
| BigInt support | Yes | **No** (JS 52-bit limit) |
| Virtual tables (FTS5) | Yes | Yes, but **blocks `wrangler d1 export`** |

## JSON in D1

JSON functions are always available (no extension loading needed).

### Storage

JSON is stored as `TEXT` columns. Drizzle handles serialisation with `{ mode: 'json' }`.

### Extraction Functions

| Function | Returns | Example |
|----------|---------|---------|
| `json_extract(col, '$.path')` | SQL type matching JSON type | `json_extract(data, '$.name')` → `"Alice"` |
| `col -> '$.path'` | JSON representation | `data -> '$.score'` → `42` (as JSON) |
| `col ->> '$.path'` | SQL TEXT | `data ->> '$.score'` → `"42"` (as TEXT) |
| `json_each(value)` | Rows (top-level array) | Expand array into rows |
| `json_tree(value)` | Rows (full nested) | Expand entire structure |

### Type Coercion

| JSON type | D1 type |
|-----------|---------|
| `null` | `NULL` |
| number (integer) | `INTEGER` |
| number (decimal) | `REAL` |
| boolean | `INTEGER` (1 = true, 0 = false) |
| string | `TEXT` |
| object/array | `TEXT` |

### Generated Columns from JSON

D1 supports generated columns — extract JSON fields as indexable columns:

```sql
CREATE TABLE sensor_data (
  raw_data TEXT,
  location AS (json_extract(raw_data, '$.location')) STORED
);
CREATE INDEX idx_location ON sensor_data(location);
```

### JSON Gotcha

`json_extract()` throws `malformed JSON` (error 9015) if the column contains non-JSON text. Guard with `json_valid()`:

```sql
SELECT * FROM events
WHERE json_valid(metadata) AND json_extract(metadata, '$.country') = 'AU'
```

## Query Result Formats

### `.all<T>()` — Array of row objects

```typescript
const { results, success, meta } = await env.DB
  .prepare("SELECT * FROM users WHERE role = ?")
  .bind("admin")
  .all<UserRow>()
// results: UserRow[]
// meta: { duration, rows_read, rows_written, last_row_id, changes, size_after }
```

### `.first()` — Single row or null

```typescript
const row = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first()
// row: Record<string, unknown> | null

// With column name — returns scalar:
const count = await env.DB.prepare("SELECT COUNT(*) as count FROM users").first('count')
// count: number | null
```

### `.run()` — Execute mutation (no rows returned)

```typescript
const result = await env.DB
  .prepare("INSERT INTO users (id, name) VALUES (?, ?)")
  .bind(id, name)
  .run()
// result: { success, meta: { changes, last_row_id, ... } }
```

### `.raw()` — Array of arrays (no column names)

```typescript
const rows = await env.DB.prepare("SELECT id, name FROM users").raw()
// rows: [["abc", "Alice"], ["def", "Bob"]]

// With column names:
const rows = await env.DB.prepare("SELECT id, name FROM users").raw({ columnNames: true })
// rows: [["id", "name"], ["abc", "Alice"], ["def", "Bob"]]
```

### `.batch()` — Multiple statements in one transaction

```typescript
const [r1, r2] = await env.DB.batch([
  env.DB.prepare("INSERT INTO users VALUES (?, ?)").bind(id1, name1),
  env.DB.prepare("INSERT INTO users VALUES (?, ?)").bind(id2, name2),
])
// Returns: D1Result[] — one per statement, all in single transaction
```

## Batch Insert Calculation

D1's 100 parameter limit means: `max_rows_per_insert = Math.floor(100 / columns_per_row)`

| Columns | Max rows per INSERT |
|---------|-------------------|
| 5 | 20 |
| 10 | 10 |
| 15 | 6 |
| 20 | 5 |

Symptoms of hitting the limit: silent failure, partial data, or cryptic "Failed to insert" error.
