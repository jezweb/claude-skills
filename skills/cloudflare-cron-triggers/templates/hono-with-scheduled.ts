/**
 * Hono + Scheduled Worker
 *
 * Worker that handles both HTTP requests (via Hono) and scheduled tasks (via cron).
 * Best for: Workers that need both API endpoints and background jobs
 *
 * wrangler.jsonc configuration:
 * {
 *   "triggers": {
 *     "crons": ["0 * * * *"]  // Every hour
 *   }
 * }
 *
 * Dependencies:
 * npm install hono@4.10.1
 */

import { Hono } from 'hono';

interface Env {
  DB: D1Database;
  MY_BUCKET: R2Bucket;
  KV_NAMESPACE: KVNamespace;
}

// Create Hono app for HTTP routes
const app = new Hono<{ Bindings: Env }>();

// ============================================================================
// HTTP ROUTES (Regular API endpoints)
// ============================================================================

app.get('/', (c) => {
  return c.text('Worker is running. Scheduled tasks execute hourly.');
});

app.get('/api/status', async (c) => {
  // Check last cron execution time from KV
  const lastExecution = await c.env.KV_NAMESPACE.get('last_cron_execution');

  return c.json({
    status: 'operational',
    lastCronExecution: lastExecution ? new Date(parseInt(lastExecution)).toISOString() : 'never',
  });
});

app.get('/api/stats', async (c) => {
  // Get stats from database
  const stats = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as total_records,
      MAX(created_at) as latest_record
    FROM data
  `).first();

  return c.json(stats);
});

app.post('/api/manual-trigger', async (c) => {
  // Manually trigger the scheduled task logic
  try {
    await performScheduledTask(c.env);
    return c.json({ success: true, message: 'Scheduled task executed manually' });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// SCHEDULED HANDLER (Cron trigger)
// ============================================================================

/**
 * Main scheduled task logic
 * Called by both scheduled handler and manual trigger endpoint
 */
async function performScheduledTask(env: Env): Promise<void> {
  console.log('Performing scheduled task...');

  // Example 1: Database cleanup
  const result = await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?')
    .bind(Date.now())
    .run();

  console.log(`Deleted ${result.meta.changes} expired sessions`);

  // Example 2: Fetch external data
  const response = await fetch('https://api.example.com/v1/data');
  const data = await response.json();

  // Example 3: Store in R2
  const timestamp = new Date().toISOString();
  await env.MY_BUCKET.put(
    `data/${timestamp.split('T')[0]}.json`,
    JSON.stringify(data)
  );

  // Example 4: Update KV with last execution time
  await env.KV_NAMESPACE.put('last_cron_execution', Date.now().toString());

  console.log('Scheduled task completed successfully');
}

// ============================================================================
// EXPORTS (Both HTTP and Scheduled)
// ============================================================================

export default {
  /**
   * HTTP request handler (via Hono)
   */
  fetch: app.fetch,

  /**
   * Scheduled handler (via Cron Trigger)
   *
   * This runs on the schedule defined in wrangler.jsonc
   */
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('Cron triggered:', controller.cron);
    console.log('Scheduled time:', new Date(controller.scheduledTime).toISOString());

    try {
      // Execute the main scheduled task
      await performScheduledTask(env);

      // Background logging
      ctx.waitUntil(
        env.DB.prepare(
          'INSERT INTO cron_executions (cron, status, timestamp) VALUES (?, ?, ?)'
        )
          .bind(controller.cron, 'success', Date.now())
          .run()
      );

      console.log('Cron execution completed successfully');
    } catch (error) {
      console.error('Cron execution failed:', error);

      // Log failure
      ctx.waitUntil(
        env.DB.prepare(
          'INSERT INTO cron_executions (cron, status, error, timestamp) VALUES (?, ?, ?, ?)'
        )
          .bind(controller.cron, 'failed', error.message, Date.now())
          .run()
      );

      // Send alert
      ctx.waitUntil(sendAlert(error, controller, env));

      // Re-throw to mark as failed
      throw error;
    }
  },
};

/**
 * Send alert on failure
 */
async function sendAlert(
  error: any,
  controller: ScheduledController,
  env: Env
): Promise<void> {
  // Example: Post to Slack webhook
  // await fetch('https://hooks.slack.com/services/YOUR/WEBHOOK/URL', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     text: `🚨 Scheduled task failed`,
  //     blocks: [
  //       {
  //         type: 'section',
  //         fields: [
  //           { type: 'mrkdwn', text: `*Cron:*\n${controller.cron}` },
  //           { type: 'mrkdwn', text: `*Error:*\n${error.message}` },
  //           {
  //             type: 'mrkdwn',
  //             text: `*Time:*\n${new Date(controller.scheduledTime).toISOString()}`,
  //           },
  //         ],
  //       },
  //     ],
  //   }),
  // });

  console.log('Alert sent for failed execution');
}
