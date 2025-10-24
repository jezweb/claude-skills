/**
 * Complete Cloudflare Worker with Drizzle ORM and D1
 *
 * This template demonstrates a full-featured Worker using:
 * - Hono for routing
 * - Drizzle ORM for database queries
 * - D1 for serverless SQLite
 * - TypeScript for type safety
 */

import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { eq } from 'drizzle-orm';

import * as schema from './db/schema';
import { users, posts, comments } from './db/schema';

/**
 * Environment Interface
 *
 * Define all Cloudflare bindings
 */
export interface Env {
  DB: D1Database; // D1 database binding
  // Add other bindings as needed:
  // KV: KVNamespace;
  // R2: R2Bucket;
  // AI: Ai;
}

/**
 * Initialize Hono App
 */
const app = new Hono<{ Bindings: Env }>();

/**
 * Middleware
 */

// CORS
app.use('/*', cors());

// Pretty JSON responses
app.use('/*', prettyJSON());

// Add database to context
app.use('*', async (c, next) => {
  // Initialize Drizzle client with schema for relational queries
  c.set('db', drizzle(c.env.DB, { schema }));
  await next();
});

/**
 * Health Check
 */
app.get('/', (c) => {
  return c.json({
    message: 'Cloudflare Worker with Drizzle ORM + D1',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Users Routes
 */

// Get all users
app.get('/api/users', async (c) => {
  const db = c.get('db');

  const allUsers = await db.select().from(users).all();

  return c.json(allUsers);
});

// Get user by ID
app.get('/api/users/:id', async (c) => {
  const db = c.get('db');
  const id = parseInt(c.req.param('id'));

  if (isNaN(id)) {
    return c.json({ error: 'Invalid user ID' }, 400);
  }

  const user = await db.select().from(users).where(eq(users.id, id)).get();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(user);
});

// Get user with posts (relational query)
app.get('/api/users/:id/posts', async (c) => {
  const db = c.get('db');
  const id = parseInt(c.req.param('id'));

  if (isNaN(id)) {
    return c.json({ error: 'Invalid user ID' }, 400);
  }

  const userWithPosts = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      posts: {
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
      },
    },
  });

  if (!userWithPosts) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(userWithPosts);
});

// Create user
app.post('/api/users', async (c) => {
  const db = c.get('db');

  try {
    const body = await c.req.json();

    // Validate input
    if (!body.email || !body.name) {
      return c.json({ error: 'Email and name are required' }, 400);
    }

    // Check if user exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .get();

    if (existing) {
      return c.json({ error: 'User with this email already exists' }, 409);
    }

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: body.email,
        name: body.name,
        bio: body.bio,
      })
      .returning();

    return c.json(newUser, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// Update user
app.put('/api/users/:id', async (c) => {
  const db = c.get('db');
  const id = parseInt(c.req.param('id'));

  if (isNaN(id)) {
    return c.json({ error: 'Invalid user ID' }, 400);
  }

  try {
    const body = await c.req.json();

    const [updated] = await db
      .update(users)
      .set({
        name: body.name,
        bio: body.bio,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(updated);
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// Delete user
app.delete('/api/users/:id', async (c) => {
  const db = c.get('db');
  const id = parseInt(c.req.param('id'));

  if (isNaN(id)) {
    return c.json({ error: 'Invalid user ID' }, 400);
  }

  try {
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (!deleted) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ message: 'User deleted successfully', user: deleted });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

/**
 * Posts Routes
 */

// Get all published posts
app.get('/api/posts', async (c) => {
  const db = c.get('db');

  const publishedPosts = await db.query.posts.findMany({
    where: eq(posts.published, true),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  });

  return c.json(publishedPosts);
});

// Get post by ID (with author and comments)
app.get('/api/posts/:id', async (c) => {
  const db = c.get('db');
  const id = parseInt(c.req.param('id'));

  if (isNaN(id)) {
    return c.json({ error: 'Invalid post ID' }, 400);
  }

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, id),
    with: {
      author: true,
      comments: {
        with: {
          author: true,
        },
        orderBy: (comments, { desc }) => [desc(comments.createdAt)],
      },
    },
  });

  if (!post) {
    return c.json({ error: 'Post not found' }, 404);
  }

  return c.json(post);
});

// Create post
app.post('/api/posts', async (c) => {
  const db = c.get('db');

  try {
    const body = await c.req.json();

    // Validate input
    if (!body.title || !body.slug || !body.content || !body.authorId) {
      return c.json(
        { error: 'Title, slug, content, and authorId are required' },
        400
      );
    }

    // Check if author exists
    const author = await db
      .select()
      .from(users)
      .where(eq(users.id, body.authorId))
      .get();

    if (!author) {
      return c.json({ error: 'Author not found' }, 404);
    }

    // Create post
    const [newPost] = await db
      .insert(posts)
      .values({
        title: body.title,
        slug: body.slug,
        content: body.content,
        authorId: body.authorId,
        published: body.published ?? false,
      })
      .returning();

    return c.json(newPost, 201);
  } catch (error) {
    console.error('Error creating post:', error);
    return c.json({ error: 'Failed to create post' }, 500);
  }
});

/**
 * Error Handling
 */
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

/**
 * 404 Handler
 */
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

/**
 * Export Worker
 */
export default app;

/**
 * Usage:
 *
 * 1. Deploy: npx wrangler deploy
 * 2. Test: curl https://your-worker.workers.dev/
 *
 * API Endpoints:
 * - GET    /api/users              - Get all users
 * - GET    /api/users/:id          - Get user by ID
 * - GET    /api/users/:id/posts    - Get user with posts
 * - POST   /api/users              - Create user
 * - PUT    /api/users/:id          - Update user
 * - DELETE /api/users/:id          - Delete user
 * - GET    /api/posts              - Get all published posts
 * - GET    /api/posts/:id          - Get post with author and comments
 * - POST   /api/posts              - Create post
 */

/**
 * Type-Safe Context
 *
 * For better TypeScript support, you can extend Hono's context
 */
declare module 'hono' {
  interface ContextVariableMap {
    db: ReturnType<typeof drizzle>;
  }
}
