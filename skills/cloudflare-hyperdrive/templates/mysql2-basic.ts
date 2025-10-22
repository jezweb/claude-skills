/**
 * MySQL with mysql2
 *
 * MySQL driver for Cloudflare Workers via Hyperdrive.
 *
 * CRITICAL: Must set disableEval: true (eval() not supported in Workers)
 * Minimum version: mysql2@3.13.0
 */

import { createConnection } from "mysql2/promise";

type Bindings = {
  HYPERDRIVE: Hyperdrive;
};

export default {
  async fetch(
    request: Request,
    env: Bindings,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Create MySQL connection via Hyperdrive
    const connection = await createConnection({
      host: env.HYPERDRIVE.host,
      user: env.HYPERDRIVE.user,
      password: env.HYPERDRIVE.password,
      database: env.HYPERDRIVE.database,
      port: env.HYPERDRIVE.port,

      // CRITICAL: Required for Workers (eval() not supported)
      disableEval: true
    });

    try {
      // Example: Simple query
      const [rows] = await connection.query('SELECT NOW() as current_time');
      console.log("Query executed successfully");

      // Example: Parameterized query (prevents SQL injection)
      const [users] = await connection.query(
        'SELECT id, name, email FROM users WHERE created_at > ? LIMIT ?',
        ['2024-01-01', 10]
      );

      // Example: Execute multiple statements
      const [results] = await connection.query(
        'SELECT COUNT(*) as total FROM users'
      );

      return Response.json({
        success: true,
        data: {
          currentTime: (rows as any[])[0].current_time,
          users: users,
          totalUsers: (results as any[])[0].total
        },
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
      ctx.waitUntil(connection.end());
    }
  }
};
