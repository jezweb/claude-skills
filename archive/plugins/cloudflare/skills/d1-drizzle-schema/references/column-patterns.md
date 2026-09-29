# Column Patterns

Complete reference for every Drizzle ORM column type used with Cloudflare D1. All patterns verified against real D1 projects.

## Imports

```typescript
import { sqliteTable, text, integer, real, blob, index, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { relations, sql } from 'drizzle-orm'
```

## Primary Keys

### Text UUID (preferred)

```typescript
id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
```

Generates UUIDs at insert time. Works in Workers runtime (crypto.randomUUID is available).

### Integer Autoincrement

```typescript
id: integer('id').primaryKey({ autoIncrement: true }),
```

Use when you need sequential IDs or when the table is insert-heavy and UUID overhead matters.

## Text

### Plain text

```typescript
name: text('name').notNull(),
description: text('description'),  // nullable
```

### Text with enum

```typescript
role: text('role', { enum: ['admin', 'editor', 'viewer'] }).notNull().default('viewer'),
status: text('status', { enum: ['draft', 'published', 'archived'] }).notNull().default('draft'),
```

Stored as TEXT in D1. Drizzle validates at the TypeScript level — no database-level constraint.

## Boolean

D1 has no native BOOLEAN. Use INTEGER with `mode: 'boolean'`:

```typescript
emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
```

Stored as 0/1 in D1. Drizzle auto-converts to/from `boolean` in TypeScript.

## Timestamps

D1 has no native DATETIME. Use INTEGER with `mode: 'timestamp'`:

```typescript
// Stores as unix epoch seconds, returns as Date object
createdAt: integer('created_at', { mode: 'timestamp' })
  .notNull()
  .$defaultFn(() => new Date()),

updatedAt: integer('updated_at', { mode: 'timestamp' })
  .notNull()
  .$defaultFn(() => new Date()),
```

### Manual unix timestamps (when you don't want Date objects)

```typescript
timestamp: integer('timestamp').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
```

## Numbers

### Integer

```typescript
count: integer('count').notNull().default(0),
sortOrder: integer('sort_order'),
```

### Real (float/decimal)

```typescript
price: real('price').notNull(),
latitude: real('latitude'),
longitude: real('longitude'),
```

## JSON

Store as TEXT with `mode: 'json'`. Drizzle handles JSON.stringify/parse automatically.

### Typed JSON (recommended)

```typescript
preferences: text('preferences', { mode: 'json' })
  .$type<{ theme: string; notifications: boolean }>()
  .$defaultFn(() => ({ theme: 'default', notifications: true })),

metadata: text('metadata', { mode: 'json' })
  .$type<Record<string, unknown>>(),

changes: text('changes', { mode: 'json' })
  .$type<Record<string, { old: unknown; new: unknown }>>(),
```

### Untyped JSON (when schema varies)

```typescript
rawData: text('raw_data'),  // manual JSON.stringify/parse
```

Use `{ mode: 'json' }` unless you need to query JSON fields in raw SQL — in that case, use plain `text()` and handle serialisation yourself.

## Foreign Keys

Foreign keys are **always enforced in D1** (cannot disable with PRAGMA).

```typescript
// Inline reference
userId: text('user_id')
  .notNull()
  .references(() => users.id, { onDelete: 'cascade' }),

// With set null
categoryId: text('category_id')
  .references(() => categories.id, { onDelete: 'set null' }),

// Self-referencing
parentId: text('parent_id')
  .references((): AnySQLiteColumn => categories.id),
```

**Cascade options**: `cascade`, `set null`, `restrict`, `no action` (default).

**Migration ordering**: When creating tables with circular FKs, use `PRAGMA defer_foreign_keys = on` at the start of the migration.

## Indexes

Defined in the table function callback (second argument to `sqliteTable`):

```typescript
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  authorId: text('author_id').notNull().references(() => users.id),
  status: text('status', { enum: ['draft', 'published'] }).notNull(),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
}, (table) => ({
  // Single column index
  authorIdx: index('posts_author_idx').on(table.authorId),

  // Unique index
  slugIdx: uniqueIndex('posts_slug_idx').on(table.slug),

  // Composite index
  statusDateIdx: index('posts_status_date_idx').on(table.status, table.publishedAt),
}))
```

**Naming convention**: `{table}_{column(s)}_{idx|uniq}`.

## Relations

Drizzle relations are query builder helpers — not database-level constraints. Define alongside FKs.

### One-to-many

```typescript
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}))
```

### Many-to-many (via junction table)

```typescript
export const postTags = sqliteTable('post_tags', {
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: uniqueIndex('post_tags_pk').on(table.postId, table.tagId),
}))
```

## Type Exports

Always export inferred types for every table:

```typescript
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
```
