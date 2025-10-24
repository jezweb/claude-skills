/**
 * Drizzle Client for Cloudflare D1
 *
 * This file shows how to initialize the Drizzle client with D1 in a Cloudflare Worker.
 */

import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/**
 * Environment Interface
 *
 * Define your Worker's environment bindings
 */
export interface Env {
  // D1 database binding (name must match wrangler.jsonc)
  DB: D1Database;

  // Add other bindings as needed
  // KV: KVNamespace;
  // R2: R2Bucket;
}

/**
 * Create Drizzle Client
 *
 * Initialize Drizzle with your D1 database binding
 *
 * @param db - D1Database instance from env.DB
 * @returns Drizzle database client
 */
export function createDrizzleClient(db: D1Database) {
  // Option 1: Without schema (for basic queries)
  // return drizzle(db);

  // Option 2: With schema (enables relational queries)
  return drizzle(db, { schema });
}

/**
 * Usage in Worker:
 *
 * export default {
 *   async fetch(request: Request, env: Env): Promise<Response> {
 *     const db = createDrizzleClient(env.DB);
 *
 *     // Now you can use db for queries
 *     const users = await db.select().from(schema.users).all();
 *
 *     return Response.json(users);
 *   },
 * };
 */

/**
 * Type-Safe Client
 *
 * For better TypeScript inference, you can create a typed client
 */
export type DrizzleD1 = ReturnType<typeof createDrizzleClient>;

/**
 * Usage with typed client:
 *
 * async function getUsers(db: DrizzleD1) {
 *   return await db.select().from(schema.users).all();
 * }
 */

/**
 * Relational Queries
 *
 * When you pass schema to drizzle(), you get access to db.query API
 * for type-safe relational queries:
 *
 * const db = drizzle(env.DB, { schema });
 *
 * // Get user with all their posts
 * const user = await db.query.users.findFirst({
 *   where: eq(schema.users.id, 1),
 *   with: {
 *     posts: true,
 *   },
 * });
 */

/**
 * IMPORTANT: D1 Binding Name
 *
 * The binding name "DB" must match exactly between:
 *
 * 1. wrangler.jsonc:
 *    {
 *      "d1_databases": [
 *        {
 *          "binding": "DB",  // ← Must match
 *          ...
 *        }
 *      ]
 *    }
 *
 * 2. Env interface:
 *    export interface Env {
 *      DB: D1Database;  // ← Must match
 *    }
 *
 * 3. Worker code:
 *    const db = drizzle(env.DB);  // ← Must match
 */
