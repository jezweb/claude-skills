/**
 * Multiple Cron Triggers
 *
 * Worker with multiple schedules, each triggering different tasks.
 * Best for: Workers that need different tasks on different schedules
 *
 * wrangler.jsonc configuration:
 * {
 *   "triggers": {
 *     "crons": [
 *       "*/5 * * * *",    // Every 5 minutes
 *       "0 */6 * * *",    // Every 6 hours
 *       "0 2 * * *"       // Daily at 2am UTC
 *     ]
 *   }
 * }
 */

interface Env {
  DB: D1Database;
  MY_BUCKET: R2Bucket;
  KV_NAMESPACE: KVNamespace;
  API_KEY: string;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('Cron triggered:', controller.cron);
    console.log('Scheduled time:', new Date(controller.scheduledTime).toISOString());

    try {
      // Route to appropriate handler based on cron expression
      switch (controller.cron) {
        case '*/5 * * * *':
          // Every 5 minutes: Health check
          await handleHealthCheck(env, ctx);
          break;

        case '0 */6 * * *':
          // Every 6 hours: Sync external data
          await handleDataSync(env, ctx);
          break;

        case '0 2 * * *':
          // Daily at 2am UTC: Generate reports and cleanup
          await handleDailyMaintenance(env, ctx);
          break;

        default:
          console.warn(`Unknown cron trigger: ${controller.cron}`);
          await sendAlert({
            type: 'unknown_cron',
            cron: controller.cron,
            message: 'Received unexpected cron trigger',
          });
      }

      console.log('Cron execution completed successfully');
    } catch (error) {
      console.error('Cron execution failed:', error);

      // Log failure
      ctx.waitUntil(
        env.DB.prepare(
          'INSERT INTO cron_failures (cron, error, timestamp) VALUES (?, ?, ?)'
        )
          .bind(controller.cron, error.message, Date.now())
          .run()
      );

      // Send alert
      ctx.waitUntil(
        sendAlert({
          type: 'execution_failed',
          cron: controller.cron,
          error: error.message,
          timestamp: new Date(controller.scheduledTime).toISOString(),
        })
      );

      // Re-throw to mark as failed
      throw error;
    }
  },
};

// ============================================================================
// HANDLER FUNCTIONS (One per schedule)
// ============================================================================

/**
 * Health Check (Every 5 minutes)
 *
 * Checks system health and sends alerts if issues detected
 */
async function handleHealthCheck(env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('[HEALTH CHECK] Starting health check...');

  const checks = await Promise.allSettled([
    checkDatabaseHealth(env.DB),
    checkStorageHealth(env.MY_BUCKET),
    checkKVHealth(env.KV_NAMESPACE),
  ]);

  const failures = checks.filter((check) => check.status === 'rejected');

  if (failures.length > 0) {
    console.error(`[HEALTH CHECK] ${failures.length} checks failed`);

    // Send alert for failures
    await sendAlert({
      type: 'health_check_failed',
      failures: failures.map((f) => ({
        reason: f.status === 'rejected' ? f.reason : 'Unknown',
      })),
    });
  } else {
    console.log('[HEALTH CHECK] All checks passed');
  }

  // Update last check time
  ctx.waitUntil(
    env.KV_NAMESPACE.put('last_health_check', Date.now().toString())
  );
}

/**
 * Data Sync (Every 6 hours)
 *
 * Fetches data from external API and stores in database
 */
async function handleDataSync(env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('[DATA SYNC] Starting data sync...');

  // Fetch from external API
  const response = await fetch('https://api.example.com/v1/data', {
    headers: {
      Authorization: `Bearer ${env.API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // Store in D1
  const stmt = env.DB.prepare(
    'INSERT OR REPLACE INTO external_data (id, value, synced_at) VALUES (?, ?, ?)'
  );

  const batch = data.items.map((item: any) =>
    stmt.bind(item.id, JSON.stringify(item), Date.now())
  );

  await env.DB.batch(batch);

  console.log(`[DATA SYNC] Synced ${data.items.length} items`);

  // Update last sync time
  ctx.waitUntil(env.KV_NAMESPACE.put('last_data_sync', Date.now().toString()));
}

/**
 * Daily Maintenance (Daily at 2am UTC)
 *
 * Generates reports, cleans up old data, optimizes storage
 */
async function handleDailyMaintenance(
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  console.log('[DAILY MAINTENANCE] Starting daily maintenance...');

  // Step 1: Delete old sessions (older than 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const sessionsDeleted = await env.DB.prepare(
    'DELETE FROM sessions WHERE created_at < ?'
  )
    .bind(thirtyDaysAgo)
    .run();

  console.log(`[DAILY MAINTENANCE] Deleted ${sessionsDeleted.meta.changes} old sessions`);

  // Step 2: Delete soft-deleted users (older than 90 days)
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const usersDeleted = await env.DB.prepare(
    'DELETE FROM users WHERE deleted_at < ?'
  )
    .bind(ninetyDaysAgo)
    .run();

  console.log(`[DAILY MAINTENANCE] Deleted ${usersDeleted.meta.changes} soft-deleted users`);

  // Step 3: Generate daily report
  const report = await generateDailyReport(env.DB);

  // Step 4: Store report in R2
  const dateStr = new Date().toISOString().split('T')[0];
  await env.MY_BUCKET.put(
    `reports/daily/${dateStr}.json`,
    JSON.stringify(report, null, 2)
  );

  console.log('[DAILY MAINTENANCE] Daily report generated and stored');

  // Step 5: Update last maintenance time
  ctx.waitUntil(
    env.KV_NAMESPACE.put('last_maintenance', Date.now().toString())
  );

  console.log('[DAILY MAINTENANCE] Maintenance completed successfully');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function checkDatabaseHealth(db: D1Database): Promise<void> {
  const result = await db.prepare('SELECT 1 as health').first();
  if (!result || result.health !== 1) {
    throw new Error('Database health check failed');
  }
}

async function checkStorageHealth(bucket: R2Bucket): Promise<void> {
  // Try to read a test object
  const testObject = await bucket.get('health-check.txt');
  if (!testObject) {
    // Create it if it doesn't exist
    await bucket.put('health-check.txt', 'OK');
  }
}

async function checkKVHealth(kv: KVNamespace): Promise<void> {
  // Try to read and write
  await kv.put('health-check', 'OK', { expirationTtl: 60 });
  const value = await kv.get('health-check');
  if (value !== 'OK') {
    throw new Error('KV health check failed');
  }
}

async function generateDailyReport(db: D1Database): Promise<any> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfDay = yesterday.setHours(0, 0, 0, 0);
  const endOfDay = yesterday.setHours(23, 59, 59, 999);

  // Example queries for report
  const [userStats, activityStats] = await Promise.all([
    db
      .prepare(`
        SELECT
          COUNT(*) as total_users,
          COUNT(CASE WHEN created_at >= ? THEN 1 END) as new_users
        FROM users
      `)
      .bind(startOfDay)
      .first(),
    db
      .prepare(`
        SELECT
          COUNT(*) as total_activities,
          COUNT(DISTINCT user_id) as active_users
        FROM activities
        WHERE timestamp BETWEEN ? AND ?
      `)
      .bind(startOfDay, endOfDay)
      .first(),
  ]);

  return {
    date: yesterday.toISOString().split('T')[0],
    users: userStats,
    activities: activityStats,
    generated_at: new Date().toISOString(),
  };
}

async function sendAlert(details: any): Promise<void> {
  // Example: Post to Slack webhook
  // await fetch('https://hooks.slack.com/services/YOUR/WEBHOOK/URL', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     text: `🚨 Alert: ${details.type}`,
  //     blocks: [
  //       {
  //         type: 'section',
  //         fields: Object.entries(details).map(([key, value]) => ({
  //           type: 'mrkdwn',
  //           text: `*${key}:*\n${JSON.stringify(value)}`,
  //         })),
  //       },
  //     ],
  //   }),
  // });

  console.log('Alert sent:', details);
}
