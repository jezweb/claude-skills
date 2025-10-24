/**
 * Database Schema for Drizzle ORM with Cloudflare D1
 *
 * This file defines the database schema including tables, columns, constraints,
 * and relations. Drizzle uses this to generate TypeScript types and SQL migrations.
 *
 * Example: Blog database with users, posts, and comments
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

/**
 * Users Table
 *
 * Stores user accounts with email authentication
 */
export const users = sqliteTable(
  'users',
  {
    // Primary key with auto-increment
    id: integer('id').primaryKey({ autoIncrement: true }),

    // Email (required, unique)
    email: text('email').notNull().unique(),

    // Name (required)
    name: text('name').notNull(),

    // Bio (optional, longer text)
    bio: text('bio'),

    // Created timestamp (integer in Unix milliseconds)
    // Use integer with mode: 'timestamp' for dates in D1/SQLite
    createdAt: integer('created_at', { mode: 'timestamp' })
      .$defaultFn(() => new Date()),

    // Updated timestamp (optional)
    updatedAt: integer('updated_at', { mode: 'timestamp' }),
  },
  (table) => {
    return {
      // Index on email for fast lookups (already unique, but helps with queries)
      emailIdx: index('users_email_idx').on(table.email),

      // Index on createdAt for sorting
      createdAtIdx: index('users_created_at_idx').on(table.createdAt),
    };
  }
);

/**
 * Posts Table
 *
 * Stores blog posts written by users
 */
export const posts = sqliteTable(
  'posts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),

    // Title (required)
    title: text('title').notNull(),

    // Slug for URLs (unique)
    slug: text('slug').notNull().unique(),

    // Content (required)
    content: text('content').notNull(),

    // Published status (default to false)
    published: integer('published', { mode: 'boolean' }).notNull().default(false),

    // Foreign key to users table
    // onDelete: 'cascade' means deleting a user deletes their posts
    authorId: integer('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Timestamps
    createdAt: integer('created_at', { mode: 'timestamp' })
      .$defaultFn(() => new Date()),

    updatedAt: integer('updated_at', { mode: 'timestamp' }),
  },
  (table) => {
    return {
      // Index on slug for URL lookups
      slugIdx: index('posts_slug_idx').on(table.slug),

      // Index on authorId for user's posts
      authorIdx: index('posts_author_idx').on(table.authorId),

      // Index on published + createdAt for listing published posts
      publishedCreatedIdx: index('posts_published_created_idx').on(
        table.published,
        table.createdAt
      ),
    };
  }
);

/**
 * Comments Table
 *
 * Stores comments on posts
 */
export const comments = sqliteTable(
  'comments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),

    // Comment content
    content: text('content').notNull(),

    // Foreign key to posts (cascade delete)
    postId: integer('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),

    // Foreign key to users (cascade delete)
    authorId: integer('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Timestamps
    createdAt: integer('created_at', { mode: 'timestamp' })
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      // Index on postId for post's comments
      postIdx: index('comments_post_idx').on(table.postId),

      // Index on authorId for user's comments
      authorIdx: index('comments_author_idx').on(table.authorId),
    };
  }
);

/**
 * Relations
 *
 * Define relationships between tables for type-safe joins
 * These are used by Drizzle's relational query API
 */

// User has many posts
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

// Post belongs to one user, has many comments
export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
}));

// Comment belongs to one post and one user
export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

/**
 * TypeScript Types
 *
 * Infer types from schema for use in your application
 */
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Select types (for reading from database)
export type User = InferSelectModel<typeof users>;
export type Post = InferSelectModel<typeof posts>;
export type Comment = InferSelectModel<typeof comments>;

// Insert types (for writing to database, optional fields allowed)
export type NewUser = InferInsertModel<typeof users>;
export type NewPost = InferInsertModel<typeof posts>;
export type NewComment = InferInsertModel<typeof comments>;

/**
 * Usage Examples:
 *
 * const user: User = await db.select().from(users).where(eq(users.id, 1)).get();
 *
 * const newUser: NewUser = {
 *   email: 'test@example.com',
 *   name: 'Test User',
 *   // createdAt is optional (has default)
 * };
 *
 * await db.insert(users).values(newUser);
 */

/**
 * Column Types Reference:
 *
 * Text:
 * - text('column_name') - Variable length text
 * - text('column_name', { length: 255 }) - Max length (not enforced by SQLite)
 *
 * Integer:
 * - integer('column_name') - Integer number
 * - integer('column_name', { mode: 'number' }) - JavaScript number (default)
 * - integer('column_name', { mode: 'boolean' }) - Boolean (0 = false, 1 = true)
 * - integer('column_name', { mode: 'timestamp' }) - JavaScript Date object
 * - integer('column_name', { mode: 'timestamp_ms' }) - Milliseconds timestamp
 *
 * Real:
 * - real('column_name') - Floating point number
 *
 * Blob:
 * - blob('column_name') - Binary data
 * - blob('column_name', { mode: 'buffer' }) - Node.js Buffer
 * - blob('column_name', { mode: 'json' }) - JSON stored as blob
 *
 * Modifiers:
 * - .notNull() - NOT NULL constraint
 * - .unique() - UNIQUE constraint
 * - .default(value) - DEFAULT value
 * - .$defaultFn(() => value) - Dynamic default (function)
 * - .primaryKey() - PRIMARY KEY
 * - .primaryKey({ autoIncrement: true }) - AUTO INCREMENT
 * - .references(() => table.column) - FOREIGN KEY
 * - .references(() => table.column, { onDelete: 'cascade' }) - CASCADE DELETE
 */
