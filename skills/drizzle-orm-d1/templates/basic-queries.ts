/**
 * Basic CRUD Queries with Drizzle ORM and D1
 *
 * This file demonstrates all basic database operations:
 * - Create (INSERT)
 * - Read (SELECT)
 * - Update (UPDATE)
 * - Delete (DELETE)
 */

import { drizzle } from 'drizzle-orm/d1';
import { users, posts, type NewUser, type NewPost } from './schema';
import { eq, and, or, gt, lt, gte, lte, like, notLike, isNull, isNotNull, inArray } from 'drizzle-orm';

// Assuming db is initialized
// const db = drizzle(env.DB);

/**
 * CREATE Operations (INSERT)
 */

// Insert single user
export async function createUser(db: ReturnType<typeof drizzle>, email: string, name: string) {
  const newUser: NewUser = {
    email,
    name,
  };

  // Insert and return the created user
  const [user] = await db.insert(users).values(newUser).returning();

  return user;
}

// Insert multiple users
export async function createUsers(db: ReturnType<typeof drizzle>, usersData: NewUser[]) {
  const createdUsers = await db.insert(users).values(usersData).returning();

  return createdUsers;
}

// Insert post
export async function createPost(
  db: ReturnType<typeof drizzle>,
  data: { title: string; slug: string; content: string; authorId: number }
) {
  const newPost: NewPost = {
    ...data,
    published: false, // Default to unpublished
  };

  const [post] = await db.insert(posts).values(newPost).returning();

  return post;
}

/**
 * READ Operations (SELECT)
 */

// Get all users
export async function getAllUsers(db: ReturnType<typeof drizzle>) {
  return await db.select().from(users).all();
}

// Get user by ID
export async function getUserById(db: ReturnType<typeof drizzle>, id: number) {
  return await db.select().from(users).where(eq(users.id, id)).get();
}

// Get user by email
export async function getUserByEmail(db: ReturnType<typeof drizzle>, email: string) {
  return await db.select().from(users).where(eq(users.email, email)).get();
}

// Get multiple users by IDs
export async function getUsersByIds(db: ReturnType<typeof drizzle>, ids: number[]) {
  return await db.select().from(users).where(inArray(users.id, ids)).all();
}

// Get users with conditions
export async function searchUsers(db: ReturnType<typeof drizzle>, searchTerm: string) {
  return await db
    .select()
    .from(users)
    .where(
      or(
        like(users.email, `%${searchTerm}%`),
        like(users.name, `%${searchTerm}%`)
      )
    )
    .all();
}

// Get recent posts (ordered)
export async function getRecentPosts(db: ReturnType<typeof drizzle>, limit = 10) {
  return await db
    .select()
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(posts.createdAt) // or desc(posts.createdAt) for descending
    .limit(limit)
    .all();
}

// Get posts with pagination
export async function getPosts(db: ReturnType<typeof drizzle>, page = 1, pageSize = 10) {
  const offset = (page - 1) * pageSize;

  return await db
    .select()
    .from(posts)
    .where(eq(posts.published, true))
    .limit(pageSize)
    .offset(offset)
    .all();
}

// Get posts by author
export async function getPostsByAuthor(db: ReturnType<typeof drizzle>, authorId: number) {
  return await db
    .select()
    .from(posts)
    .where(eq(posts.authorId, authorId))
    .all();
}

// Complex WHERE conditions
export async function getPublishedPostsAfterDate(
  db: ReturnType<typeof drizzle>,
  date: Date
) {
  return await db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.published, true),
        gte(posts.createdAt, date)
      )
    )
    .all();
}

// Select specific columns
export async function getUserEmails(db: ReturnType<typeof drizzle>) {
  return await db
    .select({
      email: users.email,
      name: users.name,
    })
    .from(users)
    .all();
}

// Count queries
export async function countUsers(db: ReturnType<typeof drizzle>) {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .get();

  return result?.count ?? 0;
}

/**
 * UPDATE Operations
 */

// Update user by ID
export async function updateUser(
  db: ReturnType<typeof drizzle>,
  id: number,
  data: { name?: string; bio?: string }
) {
  const [updated] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return updated;
}

// Update post
export async function updatePost(
  db: ReturnType<typeof drizzle>,
  id: number,
  data: { title?: string; content?: string; published?: boolean }
) {
  const [updated] = await db
    .update(posts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id))
    .returning();

  return updated;
}

// Publish post
export async function publishPost(db: ReturnType<typeof drizzle>, id: number) {
  const [updated] = await db
    .update(posts)
    .set({
      published: true,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id))
    .returning();

  return updated;
}

// Update with conditions
export async function unpublishOldPosts(db: ReturnType<typeof drizzle>, cutoffDate: Date) {
  return await db
    .update(posts)
    .set({
      published: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(posts.published, true),
        lt(posts.createdAt, cutoffDate)
      )
    )
    .returning();
}

/**
 * DELETE Operations
 */

// Delete user by ID
export async function deleteUser(db: ReturnType<typeof drizzle>, id: number) {
  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();

  return deleted;
}

// Delete post by ID
export async function deletePost(db: ReturnType<typeof drizzle>, id: number) {
  const [deleted] = await db
    .delete(posts)
    .where(eq(posts.id, id))
    .returning();

  return deleted;
}

// Delete multiple posts
export async function deletePostsByAuthor(db: ReturnType<typeof drizzle>, authorId: number) {
  return await db
    .delete(posts)
    .where(eq(posts.authorId, authorId))
    .returning();
}

// Delete with conditions
export async function deleteUnpublishedPostsOlderThan(
  db: ReturnType<typeof drizzle>,
  cutoffDate: Date
) {
  return await db
    .delete(posts)
    .where(
      and(
        eq(posts.published, false),
        lt(posts.createdAt, cutoffDate)
      )
    )
    .returning();
}

/**
 * Operator Reference:
 *
 * Comparison:
 * - eq(column, value) - Equal (=)
 * - ne(column, value) - Not equal (!=)
 * - gt(column, value) - Greater than (>)
 * - gte(column, value) - Greater than or equal (>=)
 * - lt(column, value) - Less than (<)
 * - lte(column, value) - Less than or equal (<=)
 *
 * Logical:
 * - and(...conditions) - AND
 * - or(...conditions) - OR
 * - not(condition) - NOT
 *
 * Pattern Matching:
 * - like(column, pattern) - LIKE
 * - notLike(column, pattern) - NOT LIKE
 *
 * NULL:
 * - isNull(column) - IS NULL
 * - isNotNull(column) - IS NOT NULL
 *
 * Arrays:
 * - inArray(column, values) - IN (...)
 * - notInArray(column, values) - NOT IN (...)
 *
 * Between:
 * - between(column, min, max) - BETWEEN
 * - notBetween(column, min, max) - NOT BETWEEN
 */

/**
 * Method Reference:
 *
 * Execution:
 * - .all() - Returns all results as array
 * - .get() - Returns first result or undefined
 * - .run() - Executes query, returns metadata (for INSERT/UPDATE/DELETE without RETURNING)
 * - .returning() - Returns affected rows (works with INSERT/UPDATE/DELETE)
 *
 * Modifiers:
 * - .where(condition) - Filter results
 * - .orderBy(column) - Sort results (ascending)
 * - .orderBy(desc(column)) - Sort results (descending)
 * - .limit(n) - Limit results
 * - .offset(n) - Skip n results
 */
