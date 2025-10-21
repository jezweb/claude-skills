/**
 * Basic Queue Consumer (Implicit Acknowledgement)
 *
 * Use when: Operations are idempotent (safe to retry)
 * Examples: Logging, sending emails (idempotent with deduplication), metrics
 *
 * How it works:
 * - If handler returns successfully → all messages acknowledged
 * - If handler throws error → entire batch retried
 *
 * Setup:
 * 1. Create queue: npx wrangler queues create my-queue
 * 2. Add consumer binding to wrangler.jsonc (see wrangler-queues-config.jsonc)
 * 3. Deploy: npm run deploy
 */

type Env = {
  // Add your bindings here (D1, KV, R2, etc.)
  LOGS: KVNamespace;
};

export default {
  async queue(
    batch: MessageBatch,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log(`Processing batch of ${batch.messages.length} messages from queue: ${batch.queue}`);

    // Process each message
    for (const message of batch.messages) {
      console.log(`Message ID: ${message.id}`);
      console.log(`Attempt: ${message.attempts}`);
      console.log(`Timestamp: ${message.timestamp}`);
      console.log(`Body:`, message.body);

      // Your processing logic
      await processMessage(message.body, env);
    }

    // Implicit acknowledgement:
    // Returning successfully acknowledges ALL messages
    // If this function throws, ALL messages will be retried
  },
};

/**
 * Process individual message
 */
async function processMessage(body: any, env: Env) {
  switch (body.type) {
    case 'send-email':
      await sendEmail(body);
      break;

    case 'log-event':
      await logEvent(body, env);
      break;

    case 'update-metrics':
      await updateMetrics(body, env);
      break;

    default:
      console.warn(`Unknown message type: ${body.type}`);
  }
}

/**
 * Example: Send email (idempotent with external deduplication)
 */
async function sendEmail(data: any) {
  console.log(`Sending email to ${data.to}`);

  // Call email API (e.g., Resend, SendGrid)
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'noreply@example.com',
      to: data.to,
      subject: data.subject,
      html: data.html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send email: ${response.statusText}`);
  }

  console.log(`Email sent successfully to ${data.to}`);
}

/**
 * Example: Log event to KV (idempotent)
 */
async function logEvent(data: any, env: Env) {
  const logKey = `log:${data.eventId}:${Date.now()}`;

  await env.LOGS.put(logKey, JSON.stringify({
    event: data.event,
    userId: data.userId,
    timestamp: new Date().toISOString(),
    metadata: data.metadata,
  }), {
    expirationTtl: 86400 * 30, // 30 days
  });

  console.log(`Event logged: ${logKey}`);
}

/**
 * Example: Update metrics (idempotent aggregation)
 */
async function updateMetrics(data: any, env: Env) {
  // Increment counter in KV
  const key = `metric:${data.metric}`;
  const current = await env.LOGS.get(key);
  const count = current ? parseInt(current) : 0;

  await env.LOGS.put(key, String(count + 1));

  console.log(`Metric ${data.metric} updated: ${count + 1}`);
}
