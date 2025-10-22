/**
 * Drizzle ORM with PostgreSQL
 *
 * Type-safe ORM for PostgreSQL via Hyperdrive.
 *
 * Install: npm install drizzle-orm postgres
 * Install (dev): npm install -D drizzle-kit
 *
 * Minimum version: postgres@3.4.5
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

// Define schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
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
    // Create postgres.js connection
    const sql = postgres(env.HYPERDRIVE.connectionString, {
      max: 5,
      prepare: true,
      fetch_types: false
    });

    // Create Drizzle client
    const db = drizzle(sql);

    try {
      // Example: Select all users
      const allUsers = await db.select().from(users);

      // Example: Select with where clause
      const recentUsers = await db
        .select()
        .from(users)
        .where(eq(users.createdAt, new Date('2024-01-01')));

      // Example: Insert
      const [newUser] = await db
        .insert(users)
        .values({
          name: "John Doe",
          email: `john.${Date.now()}@example.com`
        })
        .returning();

      // Example: Update
      await db
        .update(users)
        .set({ name: "Jane Doe" })
        .where(eq(users.id, newUser.id));

      // Example: Delete
      // await db.delete(users).where(eq(users.id, 123));

      return Response.json({
        success: true,
        data: {
          allUsers,
          recentUsers,
          newUser
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
      ctx.waitUntil(sql.end());
    }
  }
};
