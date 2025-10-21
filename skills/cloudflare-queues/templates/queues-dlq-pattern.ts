/**
 * Dead Letter Queue (DLQ) Consumer
 *
 * Handles messages that failed after max retries in the main queue.
 *
 * Use when: You need to:
 * - Log permanently failed messages
 * - Alert ops team about failures
 * - Store failed messages for manual review
 * - Implement custom retry logic
 *
 * Setup:
 * 1. Create DLQ: npx wrangler queues create my-dlq
 * 2. Configure main queue consumer with DLQ:
 *    "dead_letter_queue": "my-dlq" in wrangler.jsonc
 * 3. Create consumer for DLQ (this file)
 * 4. Deploy both consumers
 */

type Env = {
  DB: D1Database;
  ALERTS: KVNamespace;
  MAIN_QUEUE: Queue; // Reference to main queue for retry
};

export default {
  async queue(
    batch: MessageBatch,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log(`⚠️ Processing ${batch.messages.length} FAILED messages from DLQ`);

    for (const message of batch.messages) {
      try {
        await handleFailedMessage(message, env);

        // Acknowledge to remove from DLQ
        message.ack();
      } catch (error) {
        console.error(`Failed to process DLQ message ${message.id}:`, error);
        // Don't ack - will retry in DLQ
      }
    }
  },
};

/**
 * Handle permanently failed message
 */
async function handleFailedMessage(message: Message, env: Env) {
  console.log(`💀 Dead Letter Message:`);
  console.log(`  ID: ${message.id}`);
  console.log(`  Attempts: ${message.attempts}`);
  console.log(`  Original Timestamp: ${message.timestamp}`);
  console.log(`  Body:`, message.body);

  // 1. Store in database for manual review
  await storeFailed Message(message, env);

  // 2. Send alert to ops team
  await sendAlert(message, env);

  // 3. Optional: Implement custom retry logic
  if (shouldRetryInMainQueue(message)) {
    await retryInMainQueue(message, env);
  }
}

/**
 * Store failed message in database
 */
async function storeFailedMessage(message: Message, env: Env) {
  await env.DB.prepare(`
    INSERT INTO failed_messages (
      id,
      queue_name,
      body,
      attempts,
      original_timestamp,
      failed_at,
      error_details
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      message.id,
      'my-queue', // Or get from message.body if you include it
      JSON.stringify(message.body),
      message.attempts,
      message.timestamp.toISOString(),
      new Date().toISOString(),
      JSON.stringify({
        reason: 'Max retries exceeded',
        lastAttempt: message.attempts,
      })
    )
    .run();

  console.log(`Stored failed message in database: ${message.id}`);
}

/**
 * Send alert to ops team
 */
async function sendAlert(message: Message, env: Env) {
  // Send to monitoring service (e.g., PagerDuty, Slack, Email)
  const alert = {
    severity: 'high',
    title: 'Queue Message Permanently Failed',
    description: `Message ${message.id} failed after ${message.attempts} attempts`,
    details: {
      messageId: message.id,
      attempts: message.attempts,
      body: message.body,
      timestamp: message.timestamp.toISOString(),
    },
  };

  // Example: Store in KV for alert aggregation
  const alertKey = `alert:${message.id}`;
  await env.ALERTS.put(alertKey, JSON.stringify(alert), {
    expirationTtl: 86400 * 7, // 7 days
  });

  // Example: Send webhook to Slack
  await fetch(process.env.SLACK_WEBHOOK_URL || '', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 Queue DLQ Alert: Message ${message.id} failed permanently`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Message ID:* ${message.id}\n*Attempts:* ${message.attempts}\n*Type:* ${message.body.type}`,
          },
        },
      ],
    }),
  });

  console.log(`Alert sent for message: ${message.id}`);
}

/**
 * Determine if message should be retried in main queue
 * (e.g., after fixing a bug, or for specific message types)
 */
function shouldRetryInMainQueue(message: Message): boolean {
  // Example: Retry if it's a payment message and attempts < 10
  if (message.body.type === 'charge-payment' && message.attempts < 10) {
    return true;
  }

  // Example: Retry if it failed due to a specific error
  if (message.body.retryable === true) {
    return true;
  }

  return false;
}

/**
 * Retry message in main queue (with delay)
 */
async function retryInMainQueue(message: Message, env: Env) {
  console.log(`Retrying message ${message.id} in main queue`);

  // Send back to main queue with exponential delay
  const delaySeconds = Math.min(
    3600 * Math.pow(2, message.attempts - 3), // Start from where DLQ picked up
    43200 // Max 12 hours
  );

  await env.MAIN_QUEUE.send(
    {
      ...message.body,
      retriedFromDLQ: true,
      originalMessageId: message.id,
      dlqAttempts: message.attempts,
    },
    { delaySeconds }
  );

  console.log(`Message ${message.id} re-queued with ${delaySeconds}s delay`);
}

/**
 * Manual retry endpoint (call via REST API or dashboard)
 */
export async function manualRetry(messageId: string, env: Env) {
  // Fetch failed message from database
  const result = await env.DB.prepare(
    'SELECT * FROM failed_messages WHERE id = ?'
  )
    .bind(messageId)
    .first();

  if (!result) {
    throw new Error(`Message ${messageId} not found in DLQ`);
  }

  const body = JSON.parse(result.body as string);

  // Send back to main queue
  await env.MAIN_QUEUE.send({
    ...body,
    manualRetry: true,
    retriedBy: 'admin',
    retriedAt: new Date().toISOString(),
  });

  console.log(`Manually retried message: ${messageId}`);
}
