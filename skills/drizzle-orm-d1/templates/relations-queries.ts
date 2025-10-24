/**
 * Relational Queries with Drizzle ORM
 *
 * This file demonstrates how to query relations between tables using:
 * 1. Drizzle's relational query API (db.query)
 * 2. Manual JOINs
 */

import { drizzle } from 'drizzle-orm/d1';
import { users, posts, comments, usersRelations, postsRelations, commentsRelations } from './schema';
import { eq, desc, sql } from 'drizzle-orm';

/**
 * IMPORTANT: To use relational queries (db.query), you must pass the schema to drizzle()
 *
 * const db = drizzle(env.DB, {
 *   schema: { users, posts, comments, usersRelations, postsRelations, commentsRelations }
 * });
 */

/**
 * Relational Query API (db.query)
 *
 * This is the recommended way to query relations in Drizzle
 */

// Get user with all their posts
export async function getUserWithPosts(db: ReturnType<typeof drizzle>, userId: number) {
  return await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      posts: true,
    },
  });
}

// Get user with posts and comments
export async function getUserWithPostsAndComments(db: ReturnType<typeof drizzle>, userId: number) {
  return await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      posts: true,
      comments: true,
    },
  });
}

// Get post with author
export async function getPostWithAuthor(db: ReturnType<typeof drizzle>, postId: number) {
  return await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: {
      author: true,
    },
  });
}

// Get post with author and comments
export async function getPostWithAuthorAndComments(db: ReturnType<typeof drizzle>, postId: number) {
  return await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: {
      author: true,
      comments: {
        with: {
          author: true, // Nested: get comment author too
        },
      },
    },
  });
}

// Get all published posts with authors
export async function getPublishedPostsWithAuthors(db: ReturnType<typeof drizzle>, limit = 10) {
  return await db.query.posts.findMany({
    where: eq(posts.published, true),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
          // Exclude bio and timestamps
        },
      },
    },
    orderBy: [desc(posts.createdAt)],
    limit,
  });
}

// Get user with filtered posts (only published)
export async function getUserWithPublishedPosts(db: ReturnType<typeof drizzle>, userId: number) {
  return await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      posts: {
        where: eq(posts.published, true),
        orderBy: [desc(posts.createdAt)],
      },
    },
  });
}

// Get post with recent comments
export async function getPostWithRecentComments(
  db: ReturnType<typeof drizzle>,
  postId: number,
  commentLimit = 10
) {
  return await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: {
      author: true,
      comments: {
        with: {
          author: true,
        },
        orderBy: [desc(comments.createdAt)],
        limit: commentLimit,
      },
    },
  });
}

/**
 * Manual JOINs
 *
 * For more complex queries, you can use manual JOINs
 */

// Left join: Get all users with their post counts
export async function getUsersWithPostCounts(db: ReturnType<typeof drizzle>) {
  return await db
    .select({
      user: users,
      postCount: sql<number>`count(${posts.id})`,
    })
    .from(users)
    .leftJoin(posts, eq(posts.authorId, users.id))
    .groupBy(users.id)
    .all();
}

// Inner join: Get users who have posts
export async function getUsersWithPosts(db: ReturnType<typeof drizzle>) {
  return await db
    .select({
      user: users,
      post: posts,
    })
    .from(users)
    .innerJoin(posts, eq(posts.authorId, users.id))
    .all();
}

// Multiple joins: Get comments with post and author info
export async function getCommentsWithDetails(db: ReturnType<typeof drizzle>) {
  return await db
    .select({
      comment: comments,
      post: {
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
      },
      author: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .innerJoin(users, eq(comments.authorId, users.id))
    .all();
}

// Complex join with aggregation
export async function getPostsWithCommentCounts(db: ReturnType<typeof drizzle>) {
  return await db
    .select({
      post: posts,
      author: users,
      commentCount: sql<number>`count(${comments.id})`,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .leftJoin(comments, eq(comments.postId, posts.id))
    .groupBy(posts.id, users.id)
    .all();
}

/**
 * Subqueries
 */

// Get users with more than 5 posts
export async function getActiveAuthors(db: ReturnType<typeof drizzle>) {
  const postCounts = db
    .select({
      authorId: posts.authorId,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(posts)
    .groupBy(posts.authorId)
    .as('post_counts');

  return await db
    .select({
      user: users,
      postCount: postCounts.count,
    })
    .from(users)
    .innerJoin(postCounts, eq(users.id, postCounts.authorId))
    .where(sql`${postCounts.count} > 5`)
    .all();
}

/**
 * Aggregations with Relations
 */

// Get post statistics
export async function getPostStatistics(db: ReturnType<typeof drizzle>, postId: number) {
  const [stats] = await db
    .select({
      post: posts,
      commentCount: sql<number>`count(DISTINCT ${comments.id})`,
    })
    .from(posts)
    .leftJoin(comments, eq(comments.postId, posts.id))
    .where(eq(posts.id, postId))
    .groupBy(posts.id)
    .all();

  return stats;
}

/**
 * Tips for Relational Queries:
 *
 * 1. Use db.query for simple relations (cleaner syntax, type-safe)
 * 2. Use manual JOINs for complex queries with aggregations
 * 3. Use `with` to load nested relations
 * 4. Use `columns` to select specific fields
 * 5. Apply `where`, `orderBy`, `limit` within relations
 * 6. Remember: Must pass schema to drizzle() for db.query to work
 */

/**
 * Performance Tips:
 *
 * 1. Be selective with relations (only load what you need)
 * 2. Use `columns` to exclude unnecessary fields
 * 3. Apply limits to prevent loading too much data
 * 4. Consider pagination for large datasets
 * 5. Use indexes on foreign keys (already done in schema.ts)
 */

/**
 * Common Patterns:
 *
 * 1. One-to-Many: User has many Posts
 *    - Use: db.query.users.findFirst({ with: { posts: true } })
 *
 * 2. Many-to-One: Post belongs to User
 *    - Use: db.query.posts.findFirst({ with: { author: true } })
 *
 * 3. Nested Relations: Post with Author and Comments (with their Authors)
 *    - Use: db.query.posts.findFirst({
 *        with: {
 *          author: true,
 *          comments: { with: { author: true } }
 *        }
 *      })
 */
