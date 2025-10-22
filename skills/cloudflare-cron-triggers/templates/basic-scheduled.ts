/**
 * Basic Scheduled Worker
 *
 * Minimal example of a Worker with only a scheduled handler.
 * Best for: Workers that only run on schedule (no HTTP requests)
 *
 * wrangler.jsonc configuration:
 * {
 *   "triggers": {
 *     "crons": ["0 * * * *"]  // Every hour
 *   }
 * }
 */

interface Env {
  // Add your environment bindings here
  // DB: D1Database;
  // MY_BUCKET: R2Bucket;
  // KV_NAMESPACE: KVNamespace;
}

export default {
  /**
   * Scheduled handler
   * Triggered by cron expressions defined in wrangler.jsonc
   *
   * @param controller - Information about the scheduled event
   * @param env - Environment bindings (D1, KV, R2, secrets, etc.)
   * @param ctx - Execution context for waitUntil()
   */
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    // Log execution details
    console.log('Cron job started');
    console.log('Triggered by:', controller.cron);
    console.log('Scheduled time:', new Date(controller.scheduledTime).toISOString());
    console.log('Controller type:', controller.type);

    try {
      // Your scheduled task logic here
      await performScheduledTask(env);

      // Use ctx.waitUntil() for non-critical async operations
      ctx.waitUntil(logSuccess(controller, env));

      console.log('Cron job completed successfully');
    } catch (error) {
      // Log the error
      console.error('Cron job failed:', error);

      // Send alert (optional)
      ctx.waitUntil(sendAlert(error, controller));

      // Re-throw to mark execution as failed in dashboard
      throw error;
    }
  },
};

/**
 * Main scheduled task
 * Implement your business logic here
 */
async function performScheduledTask(env: Env): Promise<void> {
  // Example: Database cleanup
  // await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?')
  //   .bind(Date.now())
  //   .run();

  // Example: Fetch external data
  // const response = await fetch('https://api.example.com/data');
  // const data = await response.json();

  // Example: Store in R2
  // await env.MY_BUCKET.put('data.json', JSON.stringify(data));

  console.log('Scheduled task executed');
}

/**
 * Log successful execution
 * Runs in background via ctx.waitUntil()
 */
async function logSuccess(
  controller: ScheduledController,
  env: Env
): Promise<void> {
  // Log to analytics, database, or external service
  console.log('Logging successful execution...');

  // Example: Store in D1
  // await env.DB.prepare(
  //   'INSERT INTO cron_executions (cron, status, timestamp) VALUES (?, ?, ?)'
  // )
  //   .bind(controller.cron, 'success', Date.now())
  //   .run();
}

/**
 * Send alert on failure
 * Runs in background via ctx.waitUntil()
 */
async function sendAlert(
  error: any,
  controller: ScheduledController
): Promise<void> {
  // Send to Slack, email, or monitoring service
  console.error('Sending alert for failed execution...');

  // Example: Post to Slack webhook
  // await fetch('https://hooks.slack.com/services/YOUR/WEBHOOK/URL', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     text: `🚨 Cron job failed: ${controller.cron}`,
  //     blocks: [
  //       {
  //         type: 'section',
  //         fields: [
  //           { type: 'mrkdwn', text: `*Cron:*\n${controller.cron}` },
  //           { type: 'mrkdwn', text: `*Error:*\n${error.message}` },
  //         ],
  //       },
  //     ],
  //   }),
  // });
}
