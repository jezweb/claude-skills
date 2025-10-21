/**
 * Cloudflare Workers KV - Metadata Patterns
 *
 * This template demonstrates:
 * - Storing data in metadata for list() efficiency
 * - Metadata-based filtering
 * - Versioning with metadata
 * - Audit trails
 * - Feature flags with metadata
 */

import { Hono } from 'hono';

type Bindings = {
  MY_KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Metadata Optimization Pattern
// ============================================================================

/**
 * Store small values in metadata to avoid separate get() calls
 * Maximum metadata size: 1024 bytes (JSON serialized)
 */

// ❌ BAD: Requires 2 operations per key
async function getStatusBad(kv: KVNamespace, userId: string) {
  const status = await kv.get(`user:${userId}:status`);
  const lastSeen = await kv.get(`user:${userId}:lastseen`);
  return { status, lastSeen };
}

// ✅ GOOD: Single list() operation gets metadata for all users
async function getStatusGood(kv: KVNamespace) {
  const users = await kv.list({ prefix: 'user:' });

  return users.keys.map((key) => ({
    userId: key.name.split(':')[1],
    status: key.metadata?.status,
    lastSeen: key.metadata?.lastSeen,
  }));
}

// Example: User status with metadata
app.post('/users/:id/status', async (c) => {
  const userId = c.req.param('id');
  const { status } = await c.req.json<{ status: string }>();

  try {
    // Store empty value, all data in metadata
    await c.env.MY_KV.put(`user:${userId}`, '', {
      metadata: {
        status,
        lastSeen: Date.now(),
        plan: 'free',
      },
    });

    return c.json({
      success: true,
      message: 'Status updated',
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

// List all users with status (no additional get() calls needed!)
app.get('/users/status', async (c) => {
  try {
    const users = await c.env.MY_KV.list({ prefix: 'user:' });

    const statuses = users.keys.map((key) => ({
      userId: key.name.split(':')[1],
      status: key.metadata?.status || 'unknown',
      lastSeen: key.metadata?.lastSeen,
      plan: key.metadata?.plan,
    }));

    return c.json({
      success: true,
      users: statuses,
      count: statuses.length,
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
// Versioning with Metadata
// ============================================================================

interface VersionedData {
  content: any;
  version: number;
  updatedAt: number;
  updatedBy: string;
}

// Write with versioning
app.put('/config/:key', async (c) => {
  const key = c.req.param('key');
  const content = await c.req.json();
  const updatedBy = c.req.header('X-User-ID') || 'system';

  try {
    // Get current version
    const existing = await c.env.MY_KV.getWithMetadata<
      VersionedData,
      { version: number }
    >(`config:${key}`, { type: 'json' });

    const currentVersion = existing.metadata?.version || 0;
    const newVersion = currentVersion + 1;

    // Store new version
    const data: VersionedData = {
      content,
      version: newVersion,
      updatedAt: Date.now(),
      updatedBy,
    };

    await c.env.MY_KV.put(`config:${key}`, JSON.stringify(data), {
      metadata: {
        version: newVersion,
        updatedAt: data.updatedAt,
        updatedBy,
      },
    });

    // Store version history (optional)
    await c.env.MY_KV.put(
      `config:${key}:v${newVersion}`,
      JSON.stringify(data),
      {
        expirationTtl: 86400 * 30, // Keep versions for 30 days
      }
    );

    return c.json({
      success: true,
      version: newVersion,
      previousVersion: currentVersion,
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

// Get config with version info
app.get('/config/:key', async (c) => {
  const key = c.req.param('key');

  try {
    const { value, metadata } = await c.env.MY_KV.getWithMetadata<
      VersionedData,
      { version: number; updatedAt: number; updatedBy: string }
    >(`config:${key}`, { type: 'json' });

    if (!value) {
      return c.json(
        {
          success: false,
          error: 'Config not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: value,
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

// Get specific version
app.get('/config/:key/version/:version', async (c) => {
  const key = c.req.param('key');
  const version = c.req.param('version');

  try {
    const data = await c.env.MY_KV.get<VersionedData>(
      `config:${key}:v${version}`,
      { type: 'json' }
    );

    if (!data) {
      return c.json(
        {
          success: false,
          error: `Version ${version} not found`,
        },
        404
      );
    }

    return c.json({
      success: true,
      data,
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
// Audit Trail with Metadata
// ============================================================================

interface AuditMetadata {
  createdBy: string;
  createdAt: number;
  updatedBy: string;
  updatedAt: number;
  accessCount: number;
}

// Write with audit trail
app.post('/data/:key', async (c) => {
  const key = c.req.param('key');
  const value = await c.req.text();
  const userId = c.req.header('X-User-ID') || 'anonymous';

  try {
    // Check if key exists
    const existing = await c.env.MY_KV.getWithMetadata<string, AuditMetadata>(
      key
    );

    const metadata: AuditMetadata = existing.metadata
      ? {
          ...existing.metadata,
          updatedBy: userId,
          updatedAt: Date.now(),
        }
      : {
          createdBy: userId,
          createdAt: Date.now(),
          updatedBy: userId,
          updatedAt: Date.now(),
          accessCount: 0,
        };

    await c.env.MY_KV.put(key, value, { metadata });

    return c.json({
      success: true,
      audit: metadata,
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

// Read with access tracking
app.get('/data/:key', async (c) => {
  const key = c.req.param('key');

  try {
    const { value, metadata } = await c.env.MY_KV.getWithMetadata<
      string,
      AuditMetadata
    >(key);

    if (!value) {
      return c.json(
        {
          success: false,
          error: 'Key not found',
        },
        404
      );
    }

    // Increment access count (fire-and-forget)
    if (metadata) {
      c.executionCtx.waitUntil(
        c.env.MY_KV.put(key, value, {
          metadata: {
            ...metadata,
            accessCount: metadata.accessCount + 1,
          },
        })
      );
    }

    return c.json({
      success: true,
      value,
      audit: metadata,
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
// Feature Flags with Metadata
// ============================================================================

interface FeatureFlag {
  enabled: boolean;
  rolloutPercentage: number;
  targetUsers?: string[];
  metadata: {
    createdAt: number;
    updatedAt: number;
    description: string;
  };
}

// Create feature flag
app.post('/flags/:name', async (c) => {
  const name = c.req.param('name');
  const flag = await c.req.json<FeatureFlag>();

  try {
    await c.env.MY_KV.put(`flag:${name}`, JSON.stringify(flag), {
      metadata: {
        enabled: flag.enabled,
        rolloutPercentage: flag.rolloutPercentage,
        updatedAt: Date.now(),
      },
    });

    return c.json({
      success: true,
      message: `Feature flag "${name}" created`,
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

// List all feature flags (metadata only)
app.get('/flags', async (c) => {
  try {
    const flags = await c.env.MY_KV.list({ prefix: 'flag:' });

    const flagList = flags.keys.map((key) => ({
      name: key.name.replace('flag:', ''),
      enabled: key.metadata?.enabled || false,
      rolloutPercentage: key.metadata?.rolloutPercentage || 0,
      updatedAt: key.metadata?.updatedAt,
    }));

    return c.json({
      success: true,
      flags: flagList,
      count: flagList.length,
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

// Check feature flag for user
app.get('/flags/:name/check/:userId', async (c) => {
  const name = c.req.param('name');
  const userId = c.req.param('userId');

  try {
    const flag = await c.env.MY_KV.get<FeatureFlag>(`flag:${name}`, {
      type: 'json',
    });

    if (!flag) {
      return c.json(
        {
          success: false,
          error: 'Feature flag not found',
        },
        404
      );
    }

    // Check if enabled
    if (!flag.enabled) {
      return c.json({ enabled: false, reason: 'Flag disabled globally' });
    }

    // Check target users
    if (flag.targetUsers && flag.targetUsers.length > 0) {
      const enabled = flag.targetUsers.includes(userId);
      return c.json({
        enabled,
        reason: enabled ? 'User in target list' : 'User not in target list',
      });
    }

    // Check rollout percentage
    const userHash =
      parseInt(userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0).toString()) %
      100;
    const enabled = userHash < flag.rolloutPercentage;

    return c.json({
      enabled,
      reason: enabled
        ? `User in ${flag.rolloutPercentage}% rollout`
        : `User not in ${flag.rolloutPercentage}% rollout`,
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
// Metadata Size Validation
// ============================================================================

// Validate metadata size before writing
app.post('/validate/metadata', async (c) => {
  const { metadata } = await c.req.json<{ metadata: any }>();

  const serialized = JSON.stringify(metadata);
  const size = new TextEncoder().encode(serialized).length;

  if (size > 1024) {
    return c.json({
      valid: false,
      size,
      maxSize: 1024,
      error: `Metadata too large: ${size} bytes (max 1024)`,
    });
  }

  return c.json({
    valid: true,
    size,
    maxSize: 1024,
  });
});

// ============================================================================
// Metadata Migration
// ============================================================================

// Migrate existing keys to add metadata
app.post('/migrate/add-metadata', async (c) => {
  const { prefix, metadata } = await c.req.json<{
    prefix: string;
    metadata: any;
  }>();

  try {
    let migratedCount = 0;
    let cursor: string | undefined;

    do {
      const result = await c.env.MY_KV.list({ prefix, cursor });

      // Migrate batch
      for (const key of result.keys) {
        // Get existing value
        const value = await c.env.MY_KV.get(key.name);

        if (value !== null) {
          // Re-write with metadata
          await c.env.MY_KV.put(key.name, value, {
            metadata: {
              ...key.metadata,
              ...metadata,
              migratedAt: Date.now(),
            },
          });

          migratedCount++;
        }
      }

      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);

    return c.json({
      success: true,
      message: `Migrated ${migratedCount} keys`,
      migratedCount,
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
