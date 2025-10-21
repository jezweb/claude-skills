// Database Client Examples for Next.js on Cloudflare Workers
// Demonstrates request-scoped client pattern to avoid "Cannot perform I/O" errors

import type { NextRequest } from 'next/server';

// ============================================================================
// ❌ WRONG: Global Database Client (DO NOT DO THIS)
// ============================================================================

// import { Pool } from 'pg';
//
// // ❌ This will FAIL with "Cannot perform I/O on behalf of a different request"
// const globalPool = new Pool({
//   connectionString: process.env.DATABASE_URL
// });
//
// export async function GET() {
//   // This will error because pool was created in different request context
//   const result = await globalPool.query('SELECT * FROM users');
//   return Response.json(result.rows);
// }

// ============================================================================
// ✅ CORRECT: Request-Scoped Database Client
// ============================================================================

import { Pool } from 'pg';

export async function GET(request: NextRequest) {
  // ✅ Create client within request handler
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const result = await pool.query('SELECT * FROM users WHERE active = $1', [true]);
    return Response.json(result.rows);
  } finally {
    // Clean up connection
    await pool.end();
  }
}

// ============================================================================
// ✅ BEST: Use Cloudflare D1 (Designed for Workers)
// ============================================================================

export async function GET_D1(request: NextRequest) {
  // Access D1 binding from environment
  const env = process.env as any;

  // ✅ No connection pooling needed - D1 is designed for Workers
  const result = await env.DB.prepare(
    'SELECT * FROM users WHERE active = ?'
  ).bind(true).all();

  return Response.json(result.results);
}

export async function POST_D1(request: NextRequest) {
  const env = process.env as any;
  const { name, email } = await request.json();

  // Insert with prepared statement
  const result = await env.DB.prepare(
    'INSERT INTO users (name, email, active) VALUES (?, ?, ?)'
  ).bind(name, email, true).run();

  return Response.json({
    id: result.meta.last_row_id,
    success: result.success
  });
}

// ============================================================================
// Helper: Reusable Request-Scoped Client Factory
// ============================================================================

type DatabaseClient = Pool;

async function withDatabase<T>(
  handler: (client: DatabaseClient) => Promise<T>
): Promise<T> {
  const client = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    return await handler(client);
  } finally {
    await client.end();
  }
}

// Usage:
export async function GET_WITH_HELPER() {
  return withDatabase(async (db) => {
    const result = await db.query('SELECT * FROM users');
    return Response.json(result.rows);
  });
}

// ============================================================================
// TypeScript Types for Cloudflare Bindings
// ============================================================================

// Generate types with: npm run cf-typegen

interface CloudflareEnv {
  DB: D1Database;
  BUCKET: R2Bucket;
  KV: KVNamespace;
  AI: Ai;
}

// Access typed bindings:
export async function GET_TYPED(request: NextRequest) {
  const env = process.env as CloudflareEnv;

  // Now env.DB is properly typed
  const result = await env.DB.prepare('SELECT * FROM users').all();

  return Response.json(result.results);
}
