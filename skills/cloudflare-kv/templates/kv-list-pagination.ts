/**
 * Cloudflare Workers KV - List & Pagination Patterns
 *
 * This template demonstrates:
 * - Basic listing with cursor pagination
 * - Prefix filtering
 * - Async iterator pattern
 * - Batch processing
 * - Key search and filtering
 */

import { Hono } from 'hono';

type Bindings = {
  MY_KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Basic Pagination
// ============================================================================

// List keys with cursor pagination
app.get('/kv/list', async (c) => {
  const prefix = c.req.query('prefix') || '';
  const cursor = c.req.query('cursor');
  const limit = parseInt(c.req.query('limit') || '100', 10);

  try {
    const result = await c.env.MY_KV.list({
      prefix,
      limit: Math.min(limit, 1000), // Max 1000
      cursor: cursor || undefined,
    });

    return c.json({
      success: true,
      keys: result.keys.map((k) => ({
        name: k.name,
        expiration: k.expiration,
        metadata: k.metadata,
      })),
      count: result.keys.length,
      hasMore: !result.list_complete,
      nextCursor: result.cursor,
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
// Async Iterator Pattern
// ============================================================================

/**
 * Async generator for paginating through all keys
 */
async function* paginateKeys(
  kv: KVNamespace,
  options: {
    prefix?: string;
    limit?: number;
  } = {}
) {
  let cursor: string | undefined;

  do {
    const result = await kv.list({
      prefix: options.prefix,
      limit: options.limit || 1000,
      cursor,
    });

    yield result.keys;

    cursor = result.list_complete ? undefined : result.cursor;
  } while (cursor);
}

// Get all keys (fully paginated)
app.get('/kv/all', async (c) => {
  const prefix = c.req.query('prefix') || '';

  try {
    const allKeys: any[] = [];

    // Use async iterator to get all keys
    for await (const batch of paginateKeys(c.env.MY_KV, { prefix })) {
      allKeys.push(...batch);
    }

    return c.json({
      success: true,
      keys: allKeys.map((k) => k.name),
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
// Prefix Filtering
// ============================================================================

// List keys by namespace prefix
app.get('/kv/namespace/:namespace', async (c) => {
  const namespace = c.req.param('namespace');
  const cursor = c.req.query('cursor');

  try {
    const result = await c.env.MY_KV.list({
      prefix: `${namespace}:`, // e.g., "user:", "session:", "cache:"
      cursor: cursor || undefined,
    });

    return c.json({
      success: true,
      namespace,
      keys: result.keys,
      count: result.keys.length,
      hasMore: !result.list_complete,
      nextCursor: result.cursor,
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

// Count keys by prefix
app.get('/kv/count/:prefix', async (c) => {
  const prefix = c.req.param('prefix');

  try {
    let count = 0;
    let cursor: string | undefined;

    do {
      const result = await c.env.MY_KV.list({
        prefix,
        cursor,
      });

      count += result.keys.length;
      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);

    return c.json({
      success: true,
      prefix,
      count,
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
// Batch Processing
// ============================================================================

/**
 * Process keys in batches
 */
async function processBatches<T>(
  kv: KVNamespace,
  options: {
    prefix?: string;
    batchSize?: number;
  },
  processor: (keys: any[]) => Promise<T[]>
): Promise<T[]> {
  const results: T[] = [];
  let cursor: string | undefined;

  do {
    const result = await kv.list({
      prefix: options.prefix,
      limit: options.batchSize || 100,
      cursor,
    });

    // Process this batch
    const batchResults = await processor(result.keys);
    results.push(...batchResults);

    cursor = result.list_complete ? undefined : result.cursor;
  } while (cursor);

  return results;
}

// Example: Export all keys with values
app.get('/kv/export', async (c) => {
  const prefix = c.req.query('prefix') || '';

  try {
    const exported = await processBatches(
      c.env.MY_KV,
      { prefix, batchSize: 100 },
      async (keys) => {
        // Get values for all keys in batch (bulk read)
        const keyNames = keys.map((k) => k.name);
        const values = await c.env.MY_KV.get(keyNames);

        // Combine keys with values
        return keys.map((key) => ({
          key: key.name,
          value: values.get(key.name),
          metadata: key.metadata,
          expiration: key.expiration,
        }));
      }
    );

    return c.json({
      success: true,
      data: exported,
      count: exported.length,
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
// Search & Filtering
// ============================================================================

// Search keys by pattern (client-side filtering)
app.get('/kv/search', async (c) => {
  const query = c.req.query('q') || '';
  const prefix = c.req.query('prefix') || '';

  if (!query) {
    return c.json(
      {
        success: false,
        error: 'Query parameter "q" is required',
      },
      400
    );
  }

  try {
    const matches: any[] = [];
    let cursor: string | undefined;

    do {
      const result = await c.env.MY_KV.list({
        prefix,
        cursor,
      });

      // Filter keys that match the search query
      const filteredKeys = result.keys.filter((key) =>
        key.name.toLowerCase().includes(query.toLowerCase())
      );

      matches.push(...filteredKeys);
      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);

    return c.json({
      success: true,
      query,
      matches: matches.map((k) => k.name),
      count: matches.length,
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

// Filter by metadata
app.get('/kv/filter/metadata', async (c) => {
  const metadataKey = c.req.query('key');
  const metadataValue = c.req.query('value');

  if (!metadataKey) {
    return c.json(
      {
        success: false,
        error: 'Query parameter "key" is required',
      },
      400
    );
  }

  try {
    const matches: any[] = [];
    let cursor: string | undefined;

    do {
      const result = await c.env.MY_KV.list({ cursor });

      // Filter by metadata
      const filteredKeys = result.keys.filter((key) => {
        if (!key.metadata) return false;

        return metadataValue
          ? key.metadata[metadataKey] === metadataValue
          : metadataKey in key.metadata;
      });

      matches.push(...filteredKeys);
      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);

    return c.json({
      success: true,
      matches: matches.map((k) => ({
        name: k.name,
        metadata: k.metadata,
      })),
      count: matches.length,
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
// Cleanup & Maintenance
// ============================================================================

// Delete expired keys (manual cleanup)
app.post('/kv/cleanup/expired', async (c) => {
  try {
    let deletedCount = 0;
    let cursor: string | undefined;

    do {
      const result = await c.env.MY_KV.list({ cursor });

      // Filter keys that have expired
      const now = Math.floor(Date.now() / 1000);
      const expiredKeys = result.keys
        .filter((key) => key.expiration && key.expiration < now)
        .map((key) => key.name);

      // Delete expired keys
      await Promise.all(expiredKeys.map((key) => c.env.MY_KV.delete(key)));

      deletedCount += expiredKeys.length;
      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);

    return c.json({
      success: true,
      message: `Deleted ${deletedCount} expired keys`,
      deletedCount,
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

// Delete all keys with prefix (DANGEROUS!)
app.post('/kv/delete/prefix', async (c) => {
  const { prefix } = await c.req.json<{ prefix: string }>();

  if (!prefix) {
    return c.json(
      {
        success: false,
        error: 'Prefix is required',
      },
      400
    );
  }

  try {
    let deletedCount = 0;
    let cursor: string | undefined;

    do {
      const result = await c.env.MY_KV.list({ prefix, cursor });

      // Delete batch
      await Promise.all(result.keys.map((key) => c.env.MY_KV.delete(key.name)));

      deletedCount += result.keys.length;
      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);

    return c.json({
      success: true,
      message: `Deleted ${deletedCount} keys with prefix "${prefix}"`,
      deletedCount,
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
// Namespace Statistics
// ============================================================================

// Get detailed namespace stats
app.get('/kv/stats/detailed', async (c) => {
  try {
    let totalKeys = 0;
    let withMetadata = 0;
    let withExpiration = 0;
    const prefixes = new Map<string, number>();

    let cursor: string | undefined;

    do {
      const result = await c.env.MY_KV.list({ cursor });

      totalKeys += result.keys.length;

      // Analyze keys
      for (const key of result.keys) {
        if (key.metadata) withMetadata++;
        if (key.expiration) withExpiration++;

        // Extract prefix (before first ":")
        const prefix = key.name.split(':')[0];
        prefixes.set(prefix, (prefixes.get(prefix) || 0) + 1);
      }

      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);

    return c.json({
      success: true,
      stats: {
        totalKeys,
        withMetadata,
        withExpiration,
        prefixCounts: Object.fromEntries(prefixes),
      },
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

// Group keys by prefix
app.get('/kv/groups', async (c) => {
  try {
    const groups = new Map<string, string[]>();
    let cursor: string | undefined;

    do {
      const result = await c.env.MY_KV.list({ cursor });

      for (const key of result.keys) {
        const prefix = key.name.split(':')[0];

        if (!groups.has(prefix)) {
          groups.set(prefix, []);
        }

        groups.get(prefix)!.push(key.name);
      }

      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);

    return c.json({
      success: true,
      groups: Object.fromEntries(groups),
      groupCount: groups.size,
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
