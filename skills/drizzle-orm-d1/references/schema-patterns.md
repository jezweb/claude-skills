# Schema Patterns

Complete reference for Drizzle schema definition with SQLite/D1.

---

## Column Types

### Text
```typescript
text('column_name')
text('column_name', { length: 255 }) // Max length (not enforced by SQLite)
```

### Integer
```typescript
integer('column_name') // JavaScript number
integer('column_name', { mode: 'number' }) // Explicit number (default)
integer('column_name', { mode: 'boolean' }) // Boolean (0/1)
integer('column_name', { mode: 'timestamp' }) // JavaScript Date
integer('column_name', { mode: 'timestamp_ms' }) // Milliseconds
```

### Real
```typescript
real('column_name') // Floating point
```

### Blob
```typescript
blob('column_name') // Binary data
blob('column_name', { mode: 'buffer' }) // Node.js Buffer
blob('column_name', { mode: 'json' }) // JSON as blob
```

---

## Constraints

### NOT NULL
```typescript
text('name').notNull()
```

### UNIQUE
```typescript
text('email').unique()
```

### DEFAULT (static)
```typescript
integer('status').default(0)
text('role').default('user')
```

### DEFAULT (dynamic)
```typescript
integer('created_at', { mode: 'timestamp' })
  .$defaultFn(() => new Date())
```

### PRIMARY KEY
```typescript
integer('id').primaryKey()
integer('id').primaryKey({ autoIncrement: true })
```

### FOREIGN KEY
```typescript
integer('user_id')
  .notNull()
  .references(() => users.id)

// With cascade
integer('user_id')
  .notNull()
  .references(() => users.id, { onDelete: 'cascade' })
```

---

## Indexes

```typescript
export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
  },
  (table) => {
    return {
      // Single column index
      emailIdx: index('users_email_idx').on(table.email),

      // Composite index
      nameEmailIdx: index('users_name_email_idx').on(table.name, table.email),
    };
  }
);
```

---

## Relations

### One-to-Many

```typescript
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
```

### Many-to-Many

```typescript
export const postsToTags = sqliteTable('posts_to_tags', {
  postId: integer('post_id')
    .notNull()
    .references(() => posts.id),
  tagId: integer('tag_id')
    .notNull()
    .references(() => tags.id),
});

export const postsRelations = relations(posts, ({ many }) => ({
  postsToTags: many(postsToTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postsToTags: many(postsToTags),
}));
```

---

## TypeScript Types

```typescript
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
```

---

## Common Patterns

### Timestamps

```typescript
createdAt: integer('created_at', { mode: 'timestamp' })
  .$defaultFn(() => new Date()),
updatedAt: integer('updated_at', { mode: 'timestamp' }),
```

### Soft Deletes

```typescript
deletedAt: integer('deleted_at', { mode: 'timestamp' }),
```

### JSON Fields

```typescript
// Option 1: text with JSON
metadata: text('metadata', { mode: 'json' }),

// Option 2: blob with JSON
settings: blob('settings', { mode: 'json' }),
```

### Enums (Text)

```typescript
role: text('role', { enum: ['user', 'admin', 'moderator'] }).notNull(),
```
