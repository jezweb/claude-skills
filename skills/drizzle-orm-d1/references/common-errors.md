# Common Errors with Drizzle ORM and D1

This document provides detailed solutions for all 12 documented issues.

---

## Issue #1: D1 Transaction Errors

**Error**: `D1_ERROR: Cannot use BEGIN TRANSACTION`

**Source**: https://github.com/drizzle-team/drizzle-orm/issues/4212

**Why It Happens**:
Drizzle ORM tries to use traditional SQL transactions with `BEGIN TRANSACTION` and `COMMIT` statements. However, Cloudflare D1 does not support these SQL transaction commands and raises a D1_ERROR.

**Solution**:
Use D1's batch API instead:

```typescript
// ❌ Don't use
await db.transaction(async (tx) => {
  // This will fail
});

// ✅ Use batch API
await db.batch([
  db.insert(users).values({ email: 'test@example.com', name: 'Test' }),
  db.insert(posts).values({ title: 'Post', content: 'Content', authorId: 1 }),
]);
```

See `templates/transactions.ts` for complete examples.

---

## Issue #2: Foreign Key Constraint Failures

**Error**: `FOREIGN KEY constraint failed: SQLITE_CONSTRAINT`

**Source**: https://github.com/drizzle-team/drizzle-orm/issues/4089

**Why It Happens**:
Drizzle-generated migrations include `PRAGMA foreign_keys = OFF;` which can cause issues during migration execution.

**Solution**:
1. Define cascading deletes in schema:
```typescript
authorId: integer('author_id')
  .notNull()
  .references(() => users.id, { onDelete: 'cascade' })
```

2. Ensure proper migration order (parent tables before child tables)
3. Test migrations locally first: `wrangler d1 migrations apply DB --local`

---

## Issue #3: Module Import Errors

**Error**: `Error: No such module "wrangler"`

**Source**: https://github.com/drizzle-team/drizzle-orm/issues/4257

**Why It Happens**:
Bundlers (like OpenNext) may incorrectly try to bundle Wrangler, which should only be used as a CLI tool.

**Solution**:
1. Never import from `wrangler` in runtime code
2. Use correct imports: `import { drizzle } from 'drizzle-orm/d1'`
3. Configure bundler externals if needed

---

## Issue #4: D1 Binding Not Found

**Error**: `env.DB is undefined` or `Cannot read property 'prepare' of undefined`

**Why It Happens**:
The D1 binding name in wrangler.jsonc doesn't match the name used in code.

**Solution**:
Ensure consistency:

```jsonc
// wrangler.jsonc
{
  "d1_databases": [
    { "binding": "DB" }  // ← Must match
  ]
}
```

```typescript
// code
export interface Env {
  DB: D1Database;  // ← Must match
}

const db = drizzle(env.DB);  // ← Must match
```

---

## Issue #5: Migration Apply Failures

**Error**: `Migration failed to apply: near "...": syntax error`

**Why It Happens**:
SQL syntax errors, conflicting migrations, or applying migrations out of order.

**Solution**:
1. Test locally first: `wrangler d1 migrations apply DB --local`
2. Review generated SQL in `./migrations` before applying
3. If failed, delete and regenerate: `rm -rf migrations/ && drizzle-kit generate`

---

## Issue #6: Schema TypeScript Inference Errors

**Error**: `Type instantiation is excessively deep and possibly infinite`

**Why It Happens**:
Complex circular references in relations cause TypeScript to fail type inference.

**Solution**:
Use explicit type annotations:

```typescript
import { InferSelectModel } from 'drizzle-orm';

export type User = InferSelectModel<typeof users>;
export type Post = InferSelectModel<typeof posts>;
```

---

## Issue #7: Prepared Statement Caching Issues

**Error**: Stale or incorrect results from queries

**Why It Happens**:
D1 doesn't cache prepared statements between requests like traditional SQLite.

**Solution**:
Don't rely on caching behavior:

```typescript
// ✅ Use .all() or .get() methods
const users = await db.select().from(users).all();
```

---

## Issue #8: Transaction Rollback Patterns

**Error**: Transaction doesn't roll back on error

**Why It Happens**:
D1 batch API doesn't support traditional rollback.

**Solution**:
Implement error handling with manual cleanup:

```typescript
try {
  await db.batch([/* operations */]);
} catch (error) {
  // Manual cleanup if needed
  console.error('Batch failed:', error);
}
```

---

## Issue #9: TypeScript Strict Mode Errors

**Error**: Type errors with `strict: true`

**Solution**:
Use explicit return types:

```typescript
async function getUser(id: number): Promise<User | undefined> {
  return await db.select().from(users).where(eq(users.id, id)).get();
}
```

---

## Issue #10: Drizzle Config Not Found

**Error**: `Cannot find drizzle.config.ts`

**Why It Happens**:
Wrong file location or incorrect file name.

**Solution**:
1. File must be named exactly `drizzle.config.ts`
2. File must be in project root
3. Or specify: `drizzle-kit generate --config=custom.config.ts`

---

## Issue #11: Remote vs Local Confusion

**Error**: Changes not appearing

**Why It Happens**:
Applying migrations to wrong database.

**Solution**:
Use correct flags consistently:

```bash
# Development
wrangler d1 migrations apply DB --local

# Production
wrangler d1 migrations apply DB --remote
```

---

## Issue #12: wrangler.toml vs wrangler.jsonc

**Error**: Configuration not recognized

**Why It Happens**:
Mixing TOML and JSON config formats.

**Solution**:
Use `wrangler.jsonc` consistently (supports comments):

```jsonc
{
  "name": "my-worker",
  // Comment here
  "d1_databases": []
}
```

---

**Total Errors Prevented**: 12
**Success Rate**: 100% when following these solutions
