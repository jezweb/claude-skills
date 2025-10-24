/**
 * Transactions with Drizzle ORM and D1 Batch API
 *
 * IMPORTANT: D1 does not support traditional SQL transactions (BEGIN/COMMIT/ROLLBACK).
 * Instead, use D1's batch API to execute multiple statements atomically.
 *
 * Issue: https://github.com/drizzle-team/drizzle-orm/issues/4212
 */

import { drizzle } from 'drizzle-orm/d1';
import { users, posts, comments } from './schema';

/**
 * ❌ DON'T: Use Drizzle's transaction API
 *
 * This will fail with D1_ERROR: Cannot use BEGIN TRANSACTION
 */
export async function DONT_useTraditionalTransaction(db: ReturnType<typeof drizzle>) {
  try {
    await db.transaction(async (tx) => {
      await tx.insert(users).values({ email: 'test@example.com', name: 'Test' });
      await tx.insert(posts).values({ title: 'Post', slug: 'post', content: 'Content', authorId: 1 });
    });
  } catch (error) {
    console.error('Transaction failed:', error);
    // Error: D1_ERROR: Cannot use BEGIN TRANSACTION
  }
}

/**
 * ✅ DO: Use D1 Batch API
 *
 * Execute multiple statements in a single batch
 */

// Basic batch insert
export async function batchInsertUsers(
  db: ReturnType<typeof drizzle>,
  usersData: { email: string; name: string }[]
) {
  const statements = usersData.map((user) =>
    db.insert(users).values(user).returning()
  );

  // All statements execute atomically
  const results = await db.batch(statements);

  return results;
}

// Batch insert with related records
export async function createUserWithPosts(
  db: ReturnType<typeof drizzle>,
  userData: { email: string; name: string },
  postsData: { title: string; slug: string; content: string }[]
) {
  try {
    // First insert user
    const [user] = await db.insert(users).values(userData).returning();

    // Then batch insert posts
    const postStatements = postsData.map((post) =>
      db.insert(posts).values({ ...post, authorId: user.id }).returning()
    );

    const postResults = await db.batch(postStatements);

    return {
      user,
      posts: postResults.flat(),
    };
  } catch (error) {
    console.error('Batch operation failed:', error);
    // Manual cleanup if needed
    // await db.delete(users).where(eq(users.email, userData.email));
    throw error;
  }
}

// Batch with mixed operations (insert, update, delete)
export async function batchMixedOperations(db: ReturnType<typeof drizzle>) {
  const results = await db.batch([
    // Insert new user
    db.insert(users).values({ email: 'new@example.com', name: 'New User' }).returning(),

    // Update existing post
    db.update(posts).set({ published: true }).where(eq(posts.id, 1)).returning(),

    // Delete old comments
    db.delete(comments).where(lt(comments.createdAt, new Date('2024-01-01'))).returning(),
  ]);

  const [newUsers, updatedPosts, deletedComments] = results;

  return {
    newUsers,
    updatedPosts,
    deletedComments,
  };
}

/**
 * Error Handling with Batch API
 *
 * If any statement in a batch fails, the entire batch fails.
 * However, D1 doesn't provide automatic rollback like traditional transactions.
 */

// Batch with error handling
export async function batchWithErrorHandling(
  db: ReturnType<typeof drizzle>,
  usersData: { email: string; name: string }[]
) {
  const statements = usersData.map((user) =>
    db.insert(users).values(user).returning()
  );

  try {
    const results = await db.batch(statements);
    console.log('All operations succeeded');
    return { success: true, results };
  } catch (error) {
    console.error('Batch failed:', error);
    // Implement manual cleanup logic if needed
    // For example, delete any partially created records

    return { success: false, error };
  }
}

// Batch with validation before execution
export async function safeBatchInsert(
  db: ReturnType<typeof drizzle>,
  usersData: { email: string; name: string }[]
) {
  // Validate all data before batching
  for (const user of usersData) {
    if (!user.email || !user.name) {
      throw new Error('Invalid user data');
    }

    // Check for duplicates
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, user.email))
      .get();

    if (existing) {
      throw new Error(`User with email ${user.email} already exists`);
    }
  }

  // All validation passed, execute batch
  const statements = usersData.map((user) =>
    db.insert(users).values(user).returning()
  );

  return await db.batch(statements);
}

/**
 * Batch Query Patterns
 */

// Batch read operations
export async function batchReadOperations(db: ReturnType<typeof drizzle>, userIds: number[]) {
  const queries = userIds.map((id) =>
    db.select().from(users).where(eq(users.id, id))
  );

  return await db.batch(queries);
}

// Batch with dependent operations
export async function createBlogPost(
  db: ReturnType<typeof drizzle>,
  postData: { title: string; slug: string; content: string; authorId: number },
  tagsData: string[]
) {
  // Insert post first
  const [post] = await db.insert(posts).values(postData).returning();

  // Then batch insert tags (if you had a tags table)
  // This is a two-step process because we need the post.id

  return post;
}

/**
 * Performance Optimization with Batch
 */

// Batch insert for large datasets
export async function bulkInsertUsers(
  db: ReturnType<typeof drizzle>,
  usersData: { email: string; name: string }[]
) {
  const BATCH_SIZE = 100; // Process in chunks

  const results = [];

  for (let i = 0; i < usersData.length; i += BATCH_SIZE) {
    const chunk = usersData.slice(i, i + BATCH_SIZE);

    const statements = chunk.map((user) =>
      db.insert(users).values(user).returning()
    );

    const chunkResults = await db.batch(statements);
    results.push(...chunkResults);
  }

  return results.flat();
}

/**
 * Important Notes:
 *
 * 1. D1 Batch API vs Traditional Transactions:
 *    - Batch API: Executes multiple statements in one round-trip
 *    - Traditional transactions: Support ROLLBACK on error (not available in D1)
 *
 * 2. Error Handling:
 *    - If batch fails, manually clean up any partially created records
 *    - Use try-catch for error handling
 *    - Validate data before executing batch
 *
 * 3. Atomicity:
 *    - All statements in a batch execute together
 *    - If one fails, the entire batch fails
 *    - No partial success (all or nothing)
 *
 * 4. Performance:
 *    - Batching reduces round-trips to the database
 *    - Process large datasets in chunks (100-1000 records)
 *    - Consider rate limits when batching
 *
 * 5. Supported Operations:
 *    - INSERT
 *    - UPDATE
 *    - DELETE
 *    - SELECT
 *    - Mixed operations in a single batch
 */

/**
 * Workaround for Complex Transactions:
 *
 * If you need more complex transaction logic with rollback:
 * 1. Use application-level transaction management
 * 2. Implement compensating transactions
 * 3. Use idempotency keys to prevent duplicate operations
 * 4. Consider using a different database if ACID is critical
 */

import { eq, lt } from 'drizzle-orm';
