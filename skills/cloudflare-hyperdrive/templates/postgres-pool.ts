/**
 * PostgreSQL with node-postgres (pg) - Connection Pool
 *
 * Advanced pattern using pg.Pool for parallel queries.
 * Good for: Multiple queries per request, better performance
 */

import { Pool } from "pg";

type Bindings = {
  HYPERDRIVE: Hyperdrive;
};

export default {
  async fetch(
    request: Request,
    env: Bindings,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Create a connection pool
    // CRITICAL: max: 5 (Workers limit is 6 concurrent external connections)
    const pool = new Pool({
      connectionString: env.HYPERDRIVE.connectionString,
      max: 5,                    // Max connections in pool (stay within Workers' limit)
      idleTimeoutMillis: 30000,  // Close idle connections after 30 seconds
      connectionTimeoutMillis: 10000  // Timeout after 10 seconds if can't acquire connection
    });

    try {
      // Example: Run multiple queries in parallel
      const [usersResult, postsResult, statsResult] = await Promise.all([
        pool.query('SELECT id, name, email FROM users ORDER BY created_at DESC LIMIT 10'),
        pool.query('SELECT id, title, author_id FROM posts ORDER BY published_at DESC LIMIT 10'),
        pool.query(`
          SELECT
            (SELECT COUNT(*) FROM users) as total_users,
            (SELECT COUNT(*) FROM posts) as total_posts,
            (SELECT COUNT(*) FROM comments) as total_comments
        `)
      ]);

      // Example: Transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('INSERT INTO users (name, email) VALUES ($1, $2)', ['John Doe', 'john@example.com']);
        await client.query('INSERT INTO audit_log (action) VALUES ($1)', ['User created']);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();  // Return connection to pool
      }

      return Response.json({
        success: true,
        data: {
          users: usersResult.rows,
          posts: postsResult.rows,
          stats: statsResult.rows[0]
        }
      });

    } catch (error: any) {
      console.error("Database error:", error.message);

      return Response.json({
        success: false,
        error: error.message
      }, {
        status: 500
      });

    } finally {
      // CRITICAL: Clean up all pool connections
      ctx.waitUntil(pool.end());
    }
  }
};
