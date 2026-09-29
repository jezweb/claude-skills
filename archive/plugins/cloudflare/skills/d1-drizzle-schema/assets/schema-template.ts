/**
 * D1 Drizzle Schema Template
 *
 * Demonstrates all common D1 column patterns:
 * - UUID primary key, text with enums, boolean as integer,
 *   timestamp as integer, typed JSON, foreign keys, indexes
 */
import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// --- Users ---

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role', { enum: ['admin', 'editor', 'viewer'] }).notNull().default('viewer'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  preferences: text('preferences', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
}))

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}))

// --- Posts ---

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  content: text('content'),
  status: text('status', { enum: ['draft', 'published', 'archived'] }).notNull().default('draft'),
  authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  authorIdx: index('posts_author_idx').on(table.authorId),
  statusIdx: index('posts_status_idx').on(table.status),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}))

// --- Type Exports ---

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
