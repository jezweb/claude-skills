/**
 * Cloudflare D1 Worker Query Examples
 *
 * This file demonstrates type-safe D1 queries in a Cloudflare Worker with Hono.
 *
 * Topics covered:
 * - Type definitions for D1 bindings
 * - CRUD operations (Create, Read, Update, Delete)
 * - Batch queries for performance
 * - Error handling and validation
 * - Pagination patterns
 * - JOIN queries
 * - Transaction-like behavior
 *
 * Usage:
 * 1. Copy relevant patterns to your Worker
 * 2. Update table/column names to match your schema
 * 3. Add proper input validation
 */

import { Hono } from 'hono';

// ============================================
// Type Definitions
// ============================================

interface Env {
  DB: D1Database;
  // ... other bindings
}

type Bindings = {
  DB: D1Database;
};

interface User {
  user_id: number;
  email: string;
  username: string;
  full_name: string | null;
  created_at: number;
  updated_at: number | null;
}

interface Post {
  post_id: number;
  user_id: number;
  title: string;
  content: string;
  slug: string;
  published: number;
  created_at: number;
  published_at: number | null;
}

interface PostWithAuthor extends Post {
  author_name: string;
  author_email: string;
}

// ============================================
// App Setup
// ============================================

const app = new Hono<{ Bindings: Bindings }>();

// ============================================
// CREATE Operations
// ============================================

// Create a new user
app.post('/api/users', async (c) => {
  try {
    const { email, username, full_name } = await c.req.json();

    // Validate input
    if (!email || !username) {
      return c.json({ error: 'Email and username are required' }, 400);
    }

    // Check if email already exists
    const existing = await c.env.DB.prepare(
      'SELECT user_id FROM users WHERE email = ? LIMIT 1'
    )
    .bind(email)
    .first();

    if (existing) {
      return c.json({ error: 'Email already registered' }, 409);
    }

    // Insert new user
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, username, full_name, created_at) VALUES (?, ?, ?, ?)'
    )
    .bind(email, username, full_name || null, Date.now())
    .run();

    const userId = result.meta.last_row_id;

    // Fetch the created user
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
      .bind(userId)
      .first<User>();

    return c.json({ user }, 201);
  } catch (error: any) {
    console.error('Error creating user:', error.message);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// Bulk insert with batch()
app.post('/api/users/bulk', async (c) => {
  try {
    const { users } = await c.req.json();

    if (!Array.isArray(users) || users.length === 0) {
      return c.json({ error: 'Invalid users array' }, 400);
    }

    // Create batch of insert statements
    const inserts = users.map(user =>
      c.env.DB.prepare(
        'INSERT INTO users (email, username, full_name, created_at) VALUES (?, ?, ?, ?)'
      ).bind(user.email, user.username, user.full_name || null, Date.now())
    );

    // Execute all inserts in one batch
    const results = await c.env.DB.batch(inserts);

    const insertedCount = results.filter(r => r.success).length;

    return c.json({
      message: `Inserted ${insertedCount} users`,
      count: insertedCount
    }, 201);
  } catch (error: any) {
    console.error('Error bulk inserting users:', error.message);
    return c.json({ error: 'Failed to insert users' }, 500);
  }
});

// ============================================
// READ Operations
// ============================================

// Get single user by ID
app.get('/api/users/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
      .bind(userId)
      .first<User>();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error: any) {
    console.error('Error fetching user:', error.message);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// Get user by email
app.get('/api/users/email/:email', async (c) => {
  try {
    const email = c.req.param('email');

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first<User>();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error: any) {
    console.error('Error fetching user:', error.message);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// List users with pagination
app.get('/api/users', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100); // Max 100
    const offset = (page - 1) * limit;

    // Use batch to get count and users in one round trip
    const [countResult, usersResult] = await c.env.DB.batch([
      c.env.DB.prepare('SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL'),
      c.env.DB.prepare(
        'SELECT * FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(limit, offset)
    ]);

    const total = (countResult.results[0] as any).total as number;
    const users = usersResult.results as User[];

    return c.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error listing users:', error.message);
    return c.json({ error: 'Failed to list users' }, 500);
  }
});

// ============================================
// UPDATE Operations
// ============================================

// Update user
app.put('/api/users/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const { username, full_name, bio } = await c.req.json();

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (username !== undefined) {
      updates.push('username = ?');
      values.push(username);
    }
    if (full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(full_name);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    // Add updated_at
    updates.push('updated_at = ?');
    values.push(Date.now());

    // Add user_id for WHERE clause
    values.push(userId);

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`;

    const result = await c.env.DB.prepare(sql).bind(...values).run();

    if (result.meta.rows_written === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Fetch updated user
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
      .bind(userId)
      .first<User>();

    return c.json({ user });
  } catch (error: any) {
    console.error('Error updating user:', error.message);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// Increment post view count (simple update)
app.post('/api/posts/:id/view', async (c) => {
  try {
    const postId = parseInt(c.req.param('id'));

    const result = await c.env.DB.prepare(
      'UPDATE posts SET view_count = view_count + 1 WHERE post_id = ?'
    )
    .bind(postId)
    .run();

    if (result.meta.rows_written === 0) {
      return c.json({ error: 'Post not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error incrementing view count:', error.message);
    return c.json({ error: 'Failed to update view count' }, 500);
  }
});

// ============================================
// DELETE Operations
// ============================================

// Soft delete user
app.delete('/api/users/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));

    const result = await c.env.DB.prepare(
      'UPDATE users SET deleted_at = ? WHERE user_id = ? AND deleted_at IS NULL'
    )
    .bind(Date.now(), userId)
    .run();

    if (result.meta.rows_written === 0) {
      return c.json({ error: 'User not found or already deleted' }, 404);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error.message);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// Hard delete post
app.delete('/api/posts/:id/permanent', async (c) => {
  try {
    const postId = parseInt(c.req.param('id'));

    const result = await c.env.DB.prepare('DELETE FROM posts WHERE post_id = ?')
      .bind(postId)
      .run();

    if (result.meta.rows_written === 0) {
      return c.json({ error: 'Post not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting post:', error.message);
    return c.json({ error: 'Failed to delete post' }, 500);
  }
});

// ============================================
// JOIN Queries
// ============================================

// Get posts with author information
app.get('/api/posts', async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);

    const { results } = await c.env.DB.prepare(`
      SELECT
        posts.*,
        users.username as author_name,
        users.email as author_email
      FROM posts
      INNER JOIN users ON posts.user_id = users.user_id
      WHERE posts.published = 1
        AND users.deleted_at IS NULL
      ORDER BY posts.published_at DESC
      LIMIT ?
    `)
    .bind(limit)
    .all<PostWithAuthor>();

    return c.json({ posts: results });
  } catch (error: any) {
    console.error('Error fetching posts:', error.message);
    return c.json({ error: 'Failed to fetch posts' }, 500);
  }
});

// Get post with author and tags
app.get('/api/posts/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');

    // Use batch to get post+author and tags in one round trip
    const [postResult, tagsResult] = await c.env.DB.batch([
      // Get post with author
      c.env.DB.prepare(`
        SELECT
          posts.*,
          users.username as author_name,
          users.email as author_email
        FROM posts
        INNER JOIN users ON posts.user_id = users.user_id
        WHERE posts.slug = ?
        LIMIT 1
      `).bind(slug),

      // Get post's tags
      c.env.DB.prepare(`
        SELECT tags.*
        FROM tags
        INNER JOIN post_tags ON tags.tag_id = post_tags.tag_id
        INNER JOIN posts ON post_tags.post_id = posts.post_id
        WHERE posts.slug = ?
      `).bind(slug)
    ]);

    const post = postResult.results[0] as PostWithAuthor | undefined;

    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const tags = tagsResult.results;

    return c.json({ post, tags });
  } catch (error: any) {
    console.error('Error fetching post:', error.message);
    return c.json({ error: 'Failed to fetch post' }, 500);
  }
});

// ============================================
// Transaction-like Behavior with Batch
// ============================================

// Publish post (update post + record event)
app.post('/api/posts/:id/publish', async (c) => {
  try {
    const postId = parseInt(c.req.param('id'));
    const now = Date.now();

    // Execute multiple related updates in one batch
    const results = await c.env.DB.batch([
      // Update post status
      c.env.DB.prepare(
        'UPDATE posts SET published = 1, published_at = ?, updated_at = ? WHERE post_id = ?'
      ).bind(now, now, postId),

      // Record publish event (example analytics table)
      c.env.DB.prepare(
        'INSERT INTO post_events (post_id, event_type, created_at) VALUES (?, ?, ?)'
      ).bind(postId, 'published', now)
    ]);

    // Check if post update succeeded
    if (results[0].meta.rows_written === 0) {
      return c.json({ error: 'Post not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error publishing post:', error.message);
    return c.json({ error: 'Failed to publish post' }, 500);
  }
});

// ============================================
// Advanced Patterns
// ============================================

// Search posts by keyword (simple full-text search)
app.get('/api/posts/search', async (c) => {
  try {
    const query = c.req.query('q') || '';
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);

    if (query.length < 2) {
      return c.json({ error: 'Query must be at least 2 characters' }, 400);
    }

    const searchTerm = `%${query}%`;

    const { results } = await c.env.DB.prepare(`
      SELECT
        posts.*,
        users.username as author_name
      FROM posts
      INNER JOIN users ON posts.user_id = users.user_id
      WHERE posts.published = 1
        AND (posts.title LIKE ? OR posts.content LIKE ?)
      ORDER BY posts.published_at DESC
      LIMIT ?
    `)
    .bind(searchTerm, searchTerm, limit)
    .all<PostWithAuthor>();

    return c.json({ posts: results, query });
  } catch (error: any) {
    console.error('Error searching posts:', error.message);
    return c.json({ error: 'Failed to search posts' }, 500);
  }
});

// Get user stats (multiple aggregations in batch)
app.get('/api/users/:id/stats', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));

    const [userResult, statsResults] = await c.env.DB.batch([
      // Get user
      c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(userId),

      // Get all stats in one query with UNION
      c.env.DB.prepare(`
        SELECT 'posts' as metric, COUNT(*) as count FROM posts WHERE user_id = ?
        UNION ALL
        SELECT 'comments', COUNT(*) FROM comments WHERE user_id = ?
        UNION ALL
        SELECT 'published_posts', COUNT(*) FROM posts WHERE user_id = ? AND published = 1
      `).bind(userId, userId, userId)
    ]);

    const user = userResult.results[0] as User | undefined;

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Parse stats results
    const stats: Record<string, number> = {};
    for (const row of statsResults.results as any[]) {
      stats[row.metric] = row.count;
    }

    return c.json({ user, stats });
  } catch (error: any) {
    console.error('Error fetching user stats:', error.message);
    return c.json({ error: 'Failed to fetch user stats' }, 500);
  }
});

// ============================================
// Error Handling Example with Retry
// ============================================

async function queryWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error: any) {
      const message = error.message;

      // Check if error is retryable
      const isRetryable =
        message.includes('Network connection lost') ||
        message.includes('storage caused object to be reset') ||
        message.includes('reset because its code was updated');

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Retry logic failed');
}

// Example usage with retry
app.get('/api/users/:id/with-retry', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));

    const user = await queryWithRetry(() =>
      c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
        .bind(userId)
        .first<User>()
    );

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error: any) {
    console.error('Error fetching user (with retry):', error.message);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// ============================================
// Export App
// ============================================

export default app;
