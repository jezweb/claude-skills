/**
 * Prepared Statements with Drizzle ORM and D1
 *
 * Prepared statements allow you to define queries once and execute them
 * multiple times with different parameters for better performance.
 *
 * IMPORTANT: D1 doesn't cache prepared statements between requests like
 * traditional SQLite. They're still useful for code reusability and type safety.
 */

import { drizzle } from 'drizzle-orm/d1';
import { users, posts, comments } from './schema';
import { eq, and, gte, sql } from 'drizzle-orm';

/**
 * Basic Prepared Statements
 */

// Get user by ID (prepared)
export function prepareGetUserById(db: ReturnType<typeof drizzle>) {
  return db
    .select()
    .from(users)
    .where(eq(users.id, sql.placeholder('id')))
    .prepare();
}

// Usage:
// const getUserById = prepareGetUserById(db);
// const user1 = await getUserById.get({ id: 1 });
// const user2 = await getUserById.get({ id: 2 });

// Get user by email (prepared)
export function prepareGetUserByEmail(db: ReturnType<typeof drizzle>) {
  return db
    .select()
    .from(users)
    .where(eq(users.email, sql.placeholder('email')))
    .prepare();
}

// Get posts by author (prepared)
export function prepareGetPostsByAuthor(db: ReturnType<typeof drizzle>) {
  return db
    .select()
    .from(posts)
    .where(eq(posts.authorId, sql.placeholder('authorId')))
    .prepare();
}

/**
 * Prepared Statements with Multiple Parameters
 */

// Get published posts after a date
export function prepareGetPublishedPostsAfterDate(db: ReturnType<typeof drizzle>) {
  return db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.published, sql.placeholder('published')),
        gte(posts.createdAt, sql.placeholder('afterDate'))
      )
    )
    .prepare();
}

// Usage:
// const getPublishedPosts = prepareGetPublishedPostsAfterDate(db);
// const recentPosts = await getPublishedPosts.all({
//   published: true,
//   afterDate: new Date('2024-01-01'),
// });

// Search users by partial email/name match
export function prepareSearchUsers(db: ReturnType<typeof drizzle>) {
  return db
    .select()
    .from(users)
    .where(
      sql`${users.email} LIKE ${sql.placeholder('searchTerm')} OR ${users.name} LIKE ${sql.placeholder('searchTerm')}`
    )
    .prepare();
}

// Usage:
// const searchUsers = prepareSearchUsers(db);
// const results = await searchUsers.all({ searchTerm: '%john%' });

/**
 * Prepared Statements for INSERT
 */

// Insert user (prepared)
export function prepareInsertUser(db: ReturnType<typeof drizzle>) {
  return db
    .insert(users)
    .values({
      email: sql.placeholder('email'),
      name: sql.placeholder('name'),
      bio: sql.placeholder('bio'),
    })
    .returning()
    .prepare();
}

// Usage:
// const insertUser = prepareInsertUser(db);
// const [newUser] = await insertUser.get({
//   email: 'test@example.com',
//   name: 'Test User',
//   bio: null,
// });

// Insert post (prepared)
export function prepareInsertPost(db: ReturnType<typeof drizzle>) {
  return db
    .insert(posts)
    .values({
      title: sql.placeholder('title'),
      slug: sql.placeholder('slug'),
      content: sql.placeholder('content'),
      authorId: sql.placeholder('authorId'),
      published: sql.placeholder('published'),
    })
    .returning()
    .prepare();
}

/**
 * Prepared Statements for UPDATE
 */

// Update user name (prepared)
export function prepareUpdateUserName(db: ReturnType<typeof drizzle>) {
  return db
    .update(users)
    .set({
      name: sql.placeholder('name'),
      updatedAt: sql.placeholder('updatedAt'),
    })
    .where(eq(users.id, sql.placeholder('id')))
    .returning()
    .prepare();
}

// Usage:
// const updateUserName = prepareUpdateUserName(db);
// const [updated] = await updateUserName.get({
//   id: 1,
//   name: 'New Name',
//   updatedAt: new Date(),
// });

// Publish post (prepared)
export function preparePublishPost(db: ReturnType<typeof drizzle>) {
  return db
    .update(posts)
    .set({
      published: true,
      updatedAt: sql.placeholder('updatedAt'),
    })
    .where(eq(posts.id, sql.placeholder('id')))
    .returning()
    .prepare();
}

/**
 * Prepared Statements for DELETE
 */

// Delete user (prepared)
export function prepareDeleteUser(db: ReturnType<typeof drizzle>) {
  return db
    .delete(users)
    .where(eq(users.id, sql.placeholder('id')))
    .returning()
    .prepare();
}

// Delete posts by author (prepared)
export function prepareDeletePostsByAuthor(db: ReturnType<typeof drizzle>) {
  return db
    .delete(posts)
    .where(eq(posts.authorId, sql.placeholder('authorId')))
    .returning()
    .prepare();
}

/**
 * Best Practices
 */

// Create a class to encapsulate all prepared statements
export class PreparedQueries {
  private db: ReturnType<typeof drizzle>;

  // Prepared statements
  private getUserByIdStmt;
  private getUserByEmailStmt;
  private insertUserStmt;
  private updateUserNameStmt;
  private deleteUserStmt;

  constructor(db: ReturnType<typeof drizzle>) {
    this.db = db;

    // Initialize all prepared statements once
    this.getUserByIdStmt = prepareGetUserById(db);
    this.getUserByEmailStmt = prepareGetUserByEmail(db);
    this.insertUserStmt = prepareInsertUser(db);
    this.updateUserNameStmt = prepareUpdateUserName(db);
    this.deleteUserStmt = prepareDeleteUser(db);
  }

  // Convenient methods that use prepared statements
  async getUserById(id: number) {
    return await this.getUserByIdStmt.get({ id });
  }

  async getUserByEmail(email: string) {
    return await this.getUserByEmailStmt.get({ email });
  }

  async insertUser(data: { email: string; name: string; bio?: string | null }) {
    const [user] = await this.insertUserStmt.get({
      email: data.email,
      name: data.name,
      bio: data.bio ?? null,
    });
    return user;
  }

  async updateUserName(id: number, name: string) {
    const [user] = await this.updateUserNameStmt.get({
      id,
      name,
      updatedAt: new Date(),
    });
    return user;
  }

  async deleteUser(id: number) {
    const [user] = await this.deleteUserStmt.get({ id });
    return user;
  }
}

// Usage:
// const queries = new PreparedQueries(db);
// const user = await queries.getUserById(1);

/**
 * Performance Considerations for D1
 *
 * Unlike traditional SQLite:
 * - D1 doesn't cache prepared statements between requests
 * - Each request starts fresh
 * - Prepared statements are still useful for:
 *   1. Code reusability
 *   2. Type safety
 *   3. Preventing SQL injection
 *   4. Cleaner code organization
 *
 * But don't expect:
 * - Performance improvements from statement caching
 * - Faster execution on repeated calls
 * - Shared state between requests
 */

/**
 * When to Use Prepared Statements:
 *
 * ✅ Good for:
 * - Queries you'll execute multiple times in the same request
 * - Complex queries with dynamic parameters
 * - Code organization and reusability
 * - Type-safe parameter passing
 *
 * ❌ Not necessary for:
 * - One-off queries
 * - Simple CRUD operations
 * - Static queries without parameters
 */

/**
 * Execution Methods:
 *
 * - .all() - Returns all results as array
 * - .get() - Returns first result or undefined
 * - .run() - Executes query, returns metadata only
 */

/**
 * TypeScript Types
 */

import type { InferSelectModel } from 'drizzle-orm';

export type PreparedQuery<T> = {
  all: (params: T) => Promise<any[]>;
  get: (params: T) => Promise<any | undefined>;
  run: (params: T) => Promise<any>;
};
