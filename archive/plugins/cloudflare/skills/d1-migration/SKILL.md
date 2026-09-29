---
name: d1-migration
description: "Cloudflare D1 migration workflow: generate with Drizzle, inspect SQL for gotchas, apply to local and remote, fix stuck migrations, handle partial failures. Use when running migrations, fixing migration errors, or setting up D1 schemas."
compatibility: claude-code-only
---

# D1 Migration Workflow

Guided workflow for Cloudflare D1 database migrations using Drizzle ORM.

## Standard Migration Flow

### 1. Generate Migration

```bash
pnpm db:generate
```

This creates a new `.sql` file in `drizzle/` (or your configured migrations directory).

### 2. Inspect the SQL (CRITICAL)

**Always read the generated SQL before applying.** Drizzle sometimes generates destructive migrations for simple schema changes.

#### Red Flag: Table Recreation

If you see this pattern, the migration will likely fail:

```sql
CREATE TABLE `my_table_new` (...);
INSERT INTO `my_table_new` SELECT ..., `new_column`, ... FROM `my_table`;
--                                      ^^^ This column doesn't exist in old table!
DROP TABLE `my_table`;
ALTER TABLE `my_table_new` RENAME TO `my_table`;
```

**Cause**: Changing a column's `default` value in Drizzle schema triggers full table recreation. The INSERT SELECT references the new column from the old table.

**Fix**: If you're only adding new columns (no type/constraint changes on existing columns), simplify to:

```sql
ALTER TABLE `my_table` ADD COLUMN `new_column` TEXT DEFAULT 'value';
```

Edit the `.sql` file directly before applying.

### 3. Apply to Local

```bash
pnpm db:migrate:local
# or: npx wrangler d1 migrations apply DB_NAME --local
```

### 4. Apply to Remote

```bash
pnpm db:migrate:remote
# or: npx wrangler d1 migrations apply DB_NAME --remote
```

**Always apply to BOTH local and remote before testing.** Local-only migrations cause confusing "works locally, breaks in production" issues.

### 5. Verify

```bash
# Check local
npx wrangler d1 execute DB_NAME --local --command "PRAGMA table_info(my_table)"

# Check remote
npx wrangler d1 execute DB_NAME --remote --command "PRAGMA table_info(my_table)"
```

## Fixing Stuck Migrations

When a migration partially applied (e.g. column was added but migration wasn't recorded), wrangler retries it and fails on the duplicate column.

**Symptoms**: `pnpm db:migrate` errors on a migration that looks like it should be done. `PRAGMA table_info` shows the column exists.

### Diagnosis

```bash
# 1. Verify the column/table exists
npx wrangler d1 execute DB_NAME --remote \
  --command "PRAGMA table_info(my_table)"

# 2. Check what migrations are recorded
npx wrangler d1 execute DB_NAME --remote \
  --command "SELECT * FROM d1_migrations ORDER BY id"
```

### Fix

```bash
# 3. Manually record the stuck migration
npx wrangler d1 execute DB_NAME --remote \
  --command "INSERT INTO d1_migrations (name, applied_at) VALUES ('0013_my_migration.sql', datetime('now'))"

# 4. Run remaining migrations normally
pnpm db:migrate
```

### Prevention

- `CREATE TABLE IF NOT EXISTS` — safe to re-run
- `ALTER TABLE ADD COLUMN` — SQLite has no `IF NOT EXISTS` variant; check column existence first or use try/catch in application code
- **Always inspect generated SQL** before applying (Step 2 above)

## Bulk Insert Batching

D1's parameter limit causes silent failures with large multi-row INSERTs. Batch into chunks:

```typescript
const BATCH_SIZE = 10;
for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
  const batch = allRows.slice(i, i + BATCH_SIZE);
  await db.insert(myTable).values(batch);
}
```

**Why**: D1 fails when rows x columns exceeds ~100-150 parameters.

## Column Naming

| Context | Convention | Example |
|---------|-----------|---------|
| Drizzle schema | camelCase | `caseNumber: text('case_number')` |
| Raw SQL queries | snake_case | `UPDATE cases SET case_number = ?` |
| API responses | Match SQL aliases | `SELECT case_number FROM cases` |

## New Project Setup

When creating a D1 database for a new project, follow this order:

1. **Deploy Worker first** — `npm run build && npx wrangler deploy`
2. **Create D1 database** — `npx wrangler d1 create project-name-db`
3. **Copy database_id** to `wrangler.jsonc` `d1_databases` binding
4. **Redeploy** — `npx wrangler deploy`
5. **Run migrations** — apply to both local and remote
