/**
 * PostgreSQL with node-postgres (pg) - Basic Usage
 *
 * Simple pattern using pg.Client for straightforward queries.
 * Good for: Single query per request, simple operations
 */

import { Client } from "pg";

type Bindings = {
  HYPERDRIVE: Hyperdrive;
};

export default {
  async fetch(
    request: Request,
    env: Bindings,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Create a new client for this request
    const client = new Client({
      connectionString: env.HYPERDRIVE.connectionString
    });

    try {
      // Connect to the database
      await client.connect();
      console.log("Connected to PostgreSQL via Hyperdrive");

      // Example: Simple query
      const result = await client.query('SELECT NOW() as current_time');
      console.log("Query executed successfully");

      // Example: Parameterized query (prevents SQL injection)
      const users = await client.query(
        'SELECT id, name, email FROM users WHERE created_at > $1 LIMIT $2',
        ['2024-01-01', 10]
      );

      return Response.json({
        success: true,
        currentTime: result.rows[0].current_time,
        users: users.rows,
        // Hyperdrive metadata
        hyperdriveInfo: {
          host: env.HYPERDRIVE.host,
          database: env.HYPERDRIVE.database,
          port: env.HYPERDRIVE.port
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
      // CRITICAL: Clean up connection AFTER response is sent
      // ctx.waitUntil() runs in background (non-blocking)
      ctx.waitUntil(client.end());
    }
  }
};
