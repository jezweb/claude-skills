---
name: d1-drizzle-schema
description: "Generate Drizzle ORM schemas for Cloudflare D1 databases with correct D1-specific patterns. Produces schema files, migration commands, type exports, and DATABASE_SCHEMA.md documentation. Handles D1 quirks: foreign keys always enforced, no native BOOLEAN/DATETIME types, 100 bound parameter limit, JSON stored as TEXT. Use when creating a new database, adding tables, or scaffolding a D1 data layer."
compatibility: claude-code-only
---

# D1 Drizzle Schema

Generate correct Drizzle ORM schemas for Cloudflare D1. D1 is SQLite-based but has important differences that cause subtle bugs if you use standard SQLite patterns. This skill produces schemas that work correctly with D1's constraints.

## Critical D1 Differences

| Feature | Standard SQLite | D1 |
|---------|-----------------|-----|
| Foreign keys | OFF by default | **Always ON** (cannot disable) |
| Boolean type | No | No — use `integer({ mode: 'boolean' })` |
| Datetime type | No | No — use `integer({ mode: 'timestamp' })` |
| Max bound params | ~999 | **100** (affects bulk inserts) |
| JSON support | Extension | **Always available** (json_extract, ->, ->>) |
| Concurrency | Multi-writer | **Single-threaded** (one query at a time) |

## Workflow

### Step 1: Describe the Data Model

Gather requirements: what tables, what relationships, what needs indexing. If working from an existing description, infer the schema directly.

### Step 2: Generate Drizzle Schema

Create schema files using D1-correct column patterns:

```typescript
import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  // UUID primary key (preferred for D1)
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Text fields
  name: text('name').notNull(),
  email: text('email').notNull(),

  // Enum (stored as TEXT, validated at schema level)
  role: text('role', { enum: ['admin', 'editor', 'viewer'] }).notNull().default('viewer'),

  // Boolean (D1 has no BOOL — stored as INTEGER 0/1)
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),

  // Timestamp (D1 has no DATETIME — stored as unix seconds)
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),

  // Typed JSON (stored as TEXT, Drizzle auto-serialises)
  preferences: text('preferences', { mode: 'json' }).$type<UserPreferences>(),

  // Foreign key (always enforced in D1)
  organisationId: text('organisation_id').references(() => organisations.id, { onDelete: 'cascade' }),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  orgIdx: index('users_org_idx').on(table.organisationId),
}))
```

See [references/column-patterns.md](references/column-patterns.md) for the full type reference.

### Step 3: Add Relations

Drizzle relations are query builder helpers (separate from FK constraints):

```typescript
import { relations } from 'drizzle-orm'

export const usersRelations = relations(users, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [users.organisationId],
    references: [organisations.id],
  }),
  posts: many(posts),
}))
```

### Step 4: Export Types

```typescript
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

### Step 5: Set Up Drizzle Config

Copy [assets/drizzle-config-template.ts](assets/drizzle-config-template.ts) to `drizzle.config.ts` and update the schema path.

### Step 6: Add Migration Scripts

Add to `package.json`:
```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate:local": "wrangler d1 migrations apply DB --local",
  "db:migrate:remote": "wrangler d1 migrations apply DB --remote"
}
```

**Always run on BOTH local AND remote before testing.**

### Step 7: Generate DATABASE_SCHEMA.md

Document the schema for future sessions:
- Tables with columns, types, and constraints
- Relationships and foreign keys
- Indexes and their purpose
- Migration workflow

## Bulk Insert Pattern

D1 limits bound parameters to 100. Calculate batch size:

```typescript
const BATCH_SIZE = Math.floor(100 / COLUMNS_PER_ROW)
for (let i = 0; i < rows.length; i += BATCH_SIZE) {
  await db.insert(table).values(rows.slice(i, i + BATCH_SIZE))
}
```

## D1 Runtime Usage

```typescript
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

// In Worker fetch handler:
const db = drizzle(env.DB, { schema })

// Query patterns
const all = await db.select().from(schema.users).all()           // Array<User>
const one = await db.select().from(schema.users).where(eq(schema.users.id, id)).get()  // User | undefined
const count = await db.select({ count: sql`count(*)` }).from(schema.users).get()
```

## Reference Files

| When | Read |
|------|------|
| D1 vs SQLite, JSON queries, limits | [references/d1-specifics.md](references/d1-specifics.md) |
| Column type patterns for Drizzle + D1 | [references/column-patterns.md](references/column-patterns.md) |

## Assets

| File | Purpose |
|------|---------|
| [assets/drizzle-config-template.ts](assets/drizzle-config-template.ts) | Starter drizzle.config.ts for D1 |
| [assets/schema-template.ts](assets/schema-template.ts) | Example schema with all common D1 patterns |
