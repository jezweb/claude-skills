/**
 * Cloudflare Workers KV - Caching Pattern
 *
 * This template demonstrates optimal caching patterns with KV:
 * - Cache-aside pattern (read-through cache)
 * - Write-through cache
 * - CacheTtl optimization for edge caching
 * - Stale-while-revalidate pattern
 * - Cache invalidation
 */

import { Hono } from 'hono';

type Bindings = {
  CACHE: KVNamespace;
  DB: D1Database; // Example: database for cache misses
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Cache-Aside Pattern (Read-Through Cache)
// ============================================================================

/**
 * Generic cache-aside helper
 *
 * 1. Try to read from cache
 * 2. On miss, fetch from source
 * 3. Store in cache
 * 4. Return data
 */
async function getCached<T>(
  kv: KVNamespace,
  cacheKey: string,
  fetchFn: () => Promise<T>,
  options: {
    ttl?: number; // KV expiration (default: 3600)
    cacheTtl?: number; // Edge cache TTL (default: 300)
  } = {}
): Promise<T> {
  const ttl = options.ttl ?? 3600; // 1 hour default
  const cacheTtl = options.cacheTtl ?? 300; // 5 minutes default

  // Try cache first (with edge caching)
  const cached = await kv.get<T>(cacheKey, {
    type: 'json',
    cacheTtl: Math.max(cacheTtl, 60), // Minimum 60 seconds
  });

  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch from source
  const data = await fetchFn();

  // Store in cache (fire-and-forget)
  await kv.put(cacheKey, JSON.stringify(data), {
    expirationTtl: Math.max(ttl, 60), // Minimum 60 seconds
  });

  return data;
}

// Example: Cache API response
app.get('/api/user/:id', async (c) => {
  const userId = c.req.param('id');
  const cacheKey = `user:${userId}`;

  try {
    const user = await getCached(
      c.env.CACHE,
      cacheKey,
      async () => {
        // Simulate database fetch
        const result = await c.env.DB.prepare(
          'SELECT * FROM users WHERE id = ?'
        )
          .bind(userId)
          .first();

        if (!result) {
          throw new Error('User not found');
        }

        return result;
      },
      {
        ttl: 3600, // Cache in KV for 1 hour
        cacheTtl: 300, // Cache at edge for 5 minutes
      }
    );

    return c.json({
      success: true,
      user,
      cached: true,
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
// Write-Through Cache Pattern
// ============================================================================

/**
 * Write-through cache: Update cache when data changes
 */
app.put('/api/user/:id', async (c) => {
  const userId = c.req.param('id');
  const userData = await c.req.json();
  const cacheKey = `user:${userId}`;

  try {
    // Update database
    await c.env.DB.prepare(
      'UPDATE users SET name = ?, email = ? WHERE id = ?'
    )
      .bind(userData.name, userData.email, userId)
      .run();

    // Update cache immediately
    await c.env.CACHE.put(cacheKey, JSON.stringify(userData), {
      expirationTtl: 3600,
    });

    return c.json({
      success: true,
      message: 'User updated and cache refreshed',
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
// Cache Invalidation
// ============================================================================

/**
 * Invalidate cache when data changes
 */
app.delete('/api/user/:id', async (c) => {
  const userId = c.req.param('id');
  const cacheKey = `user:${userId}`;

  try {
    // Delete from database
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

    // Invalidate cache
    await c.env.CACHE.delete(cacheKey);

    return c.json({
      success: true,
      message: 'User deleted and cache invalidated',
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

// Invalidate multiple cache keys
app.post('/api/cache/invalidate', async (c) => {
  const { keys } = await c.req.json<{ keys: string[] }>();

  try {
    // Delete all cache keys in parallel
    await Promise.all(keys.map((key) => c.env.CACHE.delete(key)));

    return c.json({
      success: true,
      message: `${keys.length} cache keys invalidated`,
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

// Invalidate by prefix (requires list + delete)
app.post('/api/cache/invalidate/prefix', async (c) => {
  const { prefix } = await c.req.json<{ prefix: string }>();

  try {
    let cursor: string | undefined;
    let deletedCount = 0;

    // List all keys with prefix and delete them
    do {
      const result = await c.env.CACHE.list({ prefix, cursor });

      // Delete batch in parallel
      await Promise.all(result.keys.map((key) => c.env.CACHE.delete(key.name)));

      deletedCount += result.keys.length;
      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);

    return c.json({
      success: true,
      message: `Cache invalidated for prefix "${prefix}"`,
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
// Stale-While-Revalidate Pattern
// ============================================================================

/**
 * Return cached data immediately, refresh in background
 */
async function staleWhileRevalidate<T>(
  kv: KVNamespace,
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ctx: ExecutionContext,
  options: {
    ttl?: number;
    staleThreshold?: number; // Refresh if older than this
  } = {}
): Promise<T> {
  const ttl = options.ttl ?? 3600;
  const staleThreshold = options.staleThreshold ?? 300; // 5 minutes

  // Get cached value with metadata
  const { value, metadata } = await kv.getWithMetadata<
    T,
    { timestamp: number }
  >(cacheKey, { type: 'json' });

  // If cached and not too stale, return immediately
  if (value !== null && metadata) {
    const age = Date.now() - metadata.timestamp;

    // If stale, refresh in background
    if (age > staleThreshold * 1000) {
      ctx.waitUntil(
        (async () => {
          try {
            const fresh = await fetchFn();
            await kv.put(cacheKey, JSON.stringify(fresh), {
              expirationTtl: ttl,
              metadata: { timestamp: Date.now() },
            });
          } catch (error) {
            console.error('Background refresh failed:', error);
          }
        })()
      );
    }

    return value;
  }

  // Cache miss - fetch and store
  const data = await fetchFn();
  await kv.put(cacheKey, JSON.stringify(data), {
    expirationTtl: ttl,
    metadata: { timestamp: Date.now() },
  });

  return data;
}

// Example usage
app.get('/api/stats', async (c) => {
  try {
    const stats = await staleWhileRevalidate(
      c.env.CACHE,
      'global:stats',
      async () => {
        // Expensive computation
        const result = await c.env.DB.prepare(
          'SELECT COUNT(*) as total FROM users'
        ).first();
        return result;
      },
      c.executionCtx,
      {
        ttl: 3600, // Cache for 1 hour
        staleThreshold: 300, // Refresh if older than 5 minutes
      }
    );

    return c.json({
      success: true,
      stats,
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
// Multi-Layer Cache (KV + Memory)
// ============================================================================

/**
 * Two-tier cache: In-memory cache + KV cache
 * Useful for frequently accessed data within same Worker instance
 */
const memoryCache = new Map<string, { value: any; expires: number }>();

async function getMultiLayerCache<T>(
  kv: KVNamespace,
  cacheKey: string,
  fetchFn: () => Promise<T>,
  options: {
    ttl?: number;
    memoryTtl?: number; // In-memory cache duration
  } = {}
): Promise<T> {
  const ttl = options.ttl ?? 3600;
  const memoryTtl = (options.memoryTtl ?? 60) * 1000; // Convert to ms

  // Check memory cache first (fastest)
  const memoryCached = memoryCache.get(cacheKey);
  if (memoryCached && memoryCached.expires > Date.now()) {
    return memoryCached.value;
  }

  // Check KV cache (fast, global)
  const kvCached = await kv.get<T>(cacheKey, {
    type: 'json',
    cacheTtl: 300,
  });

  if (kvCached !== null) {
    // Store in memory cache
    memoryCache.set(cacheKey, {
      value: kvCached,
      expires: Date.now() + memoryTtl,
    });
    return kvCached;
  }

  // Cache miss - fetch from source
  const data = await fetchFn();

  // Store in both caches
  memoryCache.set(cacheKey, {
    value: data,
    expires: Date.now() + memoryTtl,
  });

  await kv.put(cacheKey, JSON.stringify(data), {
    expirationTtl: ttl,
  });

  return data;
}

// Example usage
app.get('/api/config', async (c) => {
  try {
    const config = await getMultiLayerCache(
      c.env.CACHE,
      'app:config',
      async () => {
        // Fetch from database or API
        return {
          theme: 'dark',
          features: ['feature1', 'feature2'],
          version: '1.0.0',
        };
      },
      {
        ttl: 3600, // KV cache: 1 hour
        memoryTtl: 60, // Memory cache: 1 minute
      }
    );

    return c.json({
      success: true,
      config,
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
// Cache Warming
// ============================================================================

/**
 * Pre-populate cache with frequently accessed data
 */
app.post('/api/cache/warm', async (c) => {
  try {
    // Example: Warm cache with top 100 users
    const topUsers = await c.env.DB.prepare(
      'SELECT * FROM users ORDER BY activity DESC LIMIT 100'
    ).all();

    // Store each user in cache
    const promises = topUsers.results.map((user: any) =>
      c.env.CACHE.put(`user:${user.id}`, JSON.stringify(user), {
        expirationTtl: 3600,
      })
    );

    await Promise.all(promises);

    return c.json({
      success: true,
      message: `Warmed cache with ${topUsers.results.length} users`,
      count: topUsers.results.length,
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
// Cache Statistics
// ============================================================================

/**
 * Track cache hit/miss rates
 */
let cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
};

app.get('/api/cache/stats', (c) => {
  const total = cacheStats.hits + cacheStats.misses;
  const hitRate = total > 0 ? (cacheStats.hits / total) * 100 : 0;

  return c.json({
    success: true,
    stats: {
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      errors: cacheStats.errors,
      total,
      hitRate: `${hitRate.toFixed(2)}%`,
    },
  });
});

// Reset stats
app.post('/api/cache/stats/reset', (c) => {
  cacheStats = { hits: 0, misses: 0, errors: 0 };

  return c.json({
    success: true,
    message: 'Cache stats reset',
  });
});

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default app;
