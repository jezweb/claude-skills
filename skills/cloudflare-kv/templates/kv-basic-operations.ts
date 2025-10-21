/**
 * Cloudflare Workers KV - Basic CRUD Operations
 *
 * This template demonstrates all basic KV operations:
 * - Create (PUT)
 * - Read (GET)
 * - Update (PUT)
 * - Delete (DELETE)
 * - List keys
 * - Metadata handling
 * - TTL/Expiration
 * - Error handling
 */

import { Hono } from 'hono';

type Bindings = {
  MY_KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// CREATE / UPDATE - Write key-value pairs
// ============================================================================

// Simple write
app.put('/kv/:key', async (c) => {
  const key = c.req.param('key');
  const value = await c.req.text();

  try {
    await c.env.MY_KV.put(key, value);

    return c.json({
      success: true,
      message: `Key "${key}" created/updated`,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// Write with TTL expiration
app.put('/kv/:key/ttl/:seconds', async (c) => {
  const key = c.req.param('key');
  const ttl = parseInt(c.req.param('seconds'), 10);
  const value = await c.req.text();

  // Validate TTL (minimum 60 seconds)
  if (ttl < 60) {
    return c.json(
      {
        success: false,
        error: 'TTL must be at least 60 seconds',
      },
      400
    );
  }

  try {
    await c.env.MY_KV.put(key, value, {
      expirationTtl: ttl,
    });

    return c.json({
      success: true,
      message: `Key "${key}" will expire in ${ttl} seconds`,
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// Write with metadata
app.put('/kv/:key/metadata', async (c) => {
  const key = c.req.param('key');
  const body = await c.req.json<{ value: string; metadata: any }>();

  // Validate metadata size (max 1024 bytes serialized)
  const metadataJson = JSON.stringify(body.metadata);
  if (metadataJson.length > 1024) {
    return c.json(
      {
        success: false,
        error: `Metadata too large: ${metadataJson.length} bytes (max 1024)`,
      },
      400
    );
  }

  try {
    await c.env.MY_KV.put(key, body.value, {
      metadata: body.metadata,
    });

    return c.json({
      success: true,
      message: `Key "${key}" created with metadata`,
      metadata: body.metadata,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// Write JSON data
app.post('/kv/json/:key', async (c) => {
  const key = c.req.param('key');
  const data = await c.req.json();

  try {
    await c.env.MY_KV.put(key, JSON.stringify(data));

    return c.json({
      success: true,
      message: `JSON data stored at key "${key}"`,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// ============================================================================
// READ - Get key-value pairs
// ============================================================================

// Simple read (text)
app.get('/kv/:key', async (c) => {
  const key = c.req.param('key');

  try {
    const value = await c.env.MY_KV.get(key);

    if (value === null) {
      return c.json(
        {
          success: false,
          error: `Key "${key}" not found`,
        },
        404
      );
    }

    return c.json({
      success: true,
      key,
      value,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// Read JSON data
app.get('/kv/json/:key', async (c) => {
  const key = c.req.param('key');

  try {
    const value = await c.env.MY_KV.get(key, { type: 'json' });

    if (value === null) {
      return c.json(
        {
          success: false,
          error: `Key "${key}" not found`,
        },
        404
      );
    }

    return c.json({
      success: true,
      key,
      value,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// Read with metadata
app.get('/kv/:key/metadata', async (c) => {
  const key = c.req.param('key');

  try {
    const { value, metadata } = await c.env.MY_KV.getWithMetadata(key);

    if (value === null) {
      return c.json(
        {
          success: false,
          error: `Key "${key}" not found`,
        },
        404
      );
    }

    return c.json({
      success: true,
      key,
      value,
      metadata,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// Read with cache optimization
app.get('/kv/:key/cached', async (c) => {
  const key = c.req.param('key');
  const cacheTtl = parseInt(c.req.query('cacheTtl') || '300', 10);

  // Validate cacheTtl (minimum 60 seconds)
  if (cacheTtl < 60) {
    return c.json(
      {
        success: false,
        error: 'cacheTtl must be at least 60 seconds',
      },
      400
    );
  }

  try {
    const value = await c.env.MY_KV.get(key, {
      type: 'text',
      cacheTtl,
    });

    if (value === null) {
      return c.json(
        {
          success: false,
          error: `Key "${key}" not found`,
        },
        404
      );
    }

    return c.json({
      success: true,
      key,
      value,
      cached: true,
      cacheTtl,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// Bulk read (multiple keys)
app.post('/kv/bulk/get', async (c) => {
  const { keys } = await c.req.json<{ keys: string[] }>();

  if (!Array.isArray(keys) || keys.length === 0) {
    return c.json(
      {
        success: false,
        error: 'keys must be a non-empty array',
      },
      400
    );
  }

  try {
    // Bulk read counts as 1 operation!
    const values = await c.env.MY_KV.get(keys);

    // Convert Map to object
    const result: Record<string, string | null> = {};
    for (const [key, value] of values) {
      result[key] = value;
    }

    return c.json({
      success: true,
      count: keys.length,
      values: result,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// ============================================================================
// LIST - List keys with pagination
// ============================================================================

// List all keys (with pagination)
app.get('/kv/list', async (c) => {
  const prefix = c.req.query('prefix') || '';
  const cursor = c.req.query('cursor');
  const limit = parseInt(c.req.query('limit') || '1000', 10);

  try {
    const result = await c.env.MY_KV.list({
      prefix,
      limit,
      cursor: cursor || undefined,
    });

    return c.json({
      success: true,
      keys: result.keys,
      count: result.keys.length,
      hasMore: !result.list_complete,
      cursor: result.cursor,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// List all keys with prefix (fully paginated)
app.get('/kv/list/all/:prefix', async (c) => {
  const prefix = c.req.param('prefix');
  let cursor: string | undefined;
  const allKeys: any[] = [];

  try {
    // Paginate through all keys
    do {
      const result = await c.env.MY_KV.list({
        prefix,
        cursor,
      });

      allKeys.push(...result.keys);
      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);

    return c.json({
      success: true,
      prefix,
      keys: allKeys,
      totalCount: allKeys.length,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// ============================================================================
// DELETE - Delete key-value pairs
// ============================================================================

// Delete single key
app.delete('/kv/:key', async (c) => {
  const key = c.req.param('key');

  try {
    // Delete always succeeds, even if key doesn't exist
    await c.env.MY_KV.delete(key);

    return c.json({
      success: true,
      message: `Key "${key}" deleted`,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// Delete multiple keys
app.post('/kv/bulk/delete', async (c) => {
  const { keys } = await c.req.json<{ keys: string[] }>();

  if (!Array.isArray(keys) || keys.length === 0) {
    return c.json(
      {
        success: false,
        error: 'keys must be a non-empty array',
      },
      400
    );
  }

  try {
    // Delete all keys in parallel
    await Promise.all(keys.map((key) => c.env.MY_KV.delete(key)));

    return c.json({
      success: true,
      message: `${keys.length} keys deleted`,
      count: keys.length,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// ============================================================================
// UTILITY - Helper endpoints
// ============================================================================

// Check if key exists
app.get('/kv/:key/exists', async (c) => {
  const key = c.req.param('key');

  try {
    const value = await c.env.MY_KV.get(key);

    return c.json({
      exists: value !== null,
      key,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// Get namespace stats
app.get('/kv/stats', async (c) => {
  try {
    const result = await c.env.MY_KV.list();
    let totalKeys = result.keys.length;
    let cursor = result.cursor;

    // Count all keys (with pagination)
    while (!result.list_complete && cursor) {
      const nextResult = await c.env.MY_KV.list({ cursor });
      totalKeys += nextResult.keys.length;
      cursor = nextResult.cursor;
    }

    return c.json({
      success: true,
      totalKeys,
      sample: result.keys.slice(0, 10), // First 10 keys
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default app;
