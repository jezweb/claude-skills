/**
 * PostgreSQL with postgres.js
 *
 * Modern PostgreSQL driver with better performance and tagged template literals.
 * Good for: Fast queries, streaming, modern API
 *
 * Minimum version: postgres@3.4.5
 */

import postgres from "postgres";

type Bindings = {
  HYPERDRIVE: Hyperdrive;
};

export default {
  async fetch(
    request: Request,
    env: Bindings,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Create postgres.js connection
    const sql = postgres(env.HYPERDRIVE.connectionString, {
      // CRITICAL: max 5 connections (Workers limit: 6)
      max: 5,

      // CRITICAL for caching: Enable prepared statements
      prepare: true,

      // Disable fetch_types if not using array types (reduces latency)
      fetch_types: false,

      // Connection timeout
      connect_timeout: 10,

      // Idle connection timeout
      idle_timeout: 30
    });

    try {
      // Example: Simple query with tagged template literal
      const currentTime = await sql`SELECT NOW() as current_time`;

      // Example: Parameterized query (auto-escaped)
      const users = await sql`
        SELECT id, name, email
        FROM users
        WHERE created_at > ${new Date('2024-01-01')}
        LIMIT 10
      `;

      // Example: Dynamic columns (use sql() for identifiers)
      const orderBy = 'created_at';
      const sortedUsers = await sql`
        SELECT * FROM users
        ORDER BY ${sql(orderBy)} DESC
        LIMIT 5
      `;

      // Example: Bulk insert
      const newUsers = [
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob', email: 'bob@example.com' }
      ];

      await sql`
        INSERT INTO users ${sql(newUsers, 'name', 'email')}
      `;

      // Example: Transaction
      const result = await sql.begin(async sql => {
        const [user] = await sql`
          INSERT INTO users (name, email)
          VALUES ('Charlie', 'charlie@example.com')
          RETURNING *
        `;

        await sql`
          INSERT INTO audit_log (action, user_id)
          VALUES ('User created', ${user.id})
        `;

        return user;
      });

      return Response.json({
        success: true,
        data: {
          currentTime: currentTime[0].current_time,
          users: users,
          sortedUsers: sortedUsers,
          newUser: result
        }
      });

    } catch (error: any) {
      console.error("Database error:", error);

      return Response.json({
        success: false,
        error: error.message
      }, {
        status: 500
      });

    } finally {
      // CRITICAL: Close all connections
      ctx.waitUntil(sql.end({ timeout: 5 }));
    }
  }
};
