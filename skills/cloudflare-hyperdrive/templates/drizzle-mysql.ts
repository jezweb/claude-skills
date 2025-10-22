/**
 * Drizzle ORM with MySQL
 *
 * Type-safe ORM for MySQL via Hyperdrive.
 *
 * Install: npm install drizzle-orm mysql2
 * Install (dev): npm install -D drizzle-kit
 *
 * Minimum version: mysql2@3.13.0
 */

import { drizzle } from "drizzle-orm/mysql2";
import { createConnection } from "mysql2";
import { mysqlTable, int, varchar, timestamp } from "drizzle-orm/mysql-core";
import { eq } from "drizzle-orm";

// Define schema
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

type Bindings = {
  HYPERDRIVE: Hyperdrive;
};

export default {
  async fetch(
    request: Request,
    env: Bindings,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Create mysql2 connection
    const connection = createConnection({
      host: env.HYPERDRIVE.host,
      user: env.HYPERDRIVE.user,
      password: env.HYPERDRIVE.password,
      database: env.HYPERDRIVE.database,
      port: env.HYPERDRIVE.port,
      disableEval: true  // REQUIRED for Workers
    });

    // Create Drizzle client
    const db = drizzle(connection);

    try {
      // Example: Select all users
      const allUsers = await db.select().from(users);

      // Example: Select with where clause
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, 1));

      // Example: Insert
      await db.insert(users).values({
        name: "John Doe",
        email: `john.${Date.now()}@example.com`
      });

      // Example: Update
      await db
        .update(users)
        .set({ name: "Jane Doe" })
        .where(eq(users.id, 1));

      return Response.json({
        success: true,
        data: {
          allUsers,
          user
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
      // CRITICAL: Clean up connection
      ctx.waitUntil(
        new Promise<void>((resolve) => {
          connection.end(() => resolve());
        })
      );
    }
  }
};
