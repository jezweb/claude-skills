/**
 * Queue Consumer with Explicit Acknowledgement
 *
 * Use when: Operations are non-idempotent (NOT safe to retry)
 * Examples: Database writes, payment processing, API calls with side effects
 *
 * How it works:
 * - Call message.ack() after successful processing
 * - Only acknowledged messages are removed from queue
 * - Failed messages can retry independently
 *
 * Setup:
 * 1. Create queue: npx wrangler queues create my-queue
 * 2. Create DLQ: npx wrangler queues create my-dlq
 * 3. Add consumer binding with DLQ (see wrangler-queues-config.jsonc)
 * 4. Deploy: npm run deploy
 */

type Env = {
  DB: D1Database;
  API_KEY: string;
};

export default {
  async queue(
    batch: MessageBatch,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log(`Processing batch of ${batch.messages.length} messages`);

    // Process each message individually
    for (const message of batch.messages) {
      try {
        // Non-idempotent operation
        await processNonIdempotent(message.body, env);

        // CRITICAL: Explicitly acknowledge success
        message.ack();

        console.log(`✅ Message ${message.id} processed successfully`);
      } catch (error) {
        console.error(`❌ Failed to process message ${message.id}:`, error);

        // Don't call ack() - message will retry
        // After max_retries, sent to DLQ (if configured)
      }
    }

    // Note: We DON'T throw an error here
    // Only unacknowledged messages will retry
  },
};

/**
 * Process message with non-idempotent operations
 */
async function processNonIdempotent(body: any, env: Env) {
  switch (body.type) {
    case 'create-order':
      await createOrder(body, env);
      break;

    case 'charge-payment':
      await chargePayment(body, env);
      break;

    case 'update-inventory':
      await updateInventory(body, env);
      break;

    default:
      throw new Error(`Unknown message type: ${body.type}`);
  }
}

/**
 * Example: Create database record (non-idempotent)
 */
async function createOrder(data: any, env: Env) {
  // Insert into database (can't be retried safely)
  const result = await env.DB.prepare(`
    INSERT INTO orders (id, user_id, total, status, created_at)
    VALUES (?, ?, ?, ?, ?)
  `)
    .bind(
      data.orderId,
      data.userId,
      data.total,
      'pending',
      new Date().toISOString()
    )
    .run();

  if (!result.success) {
    throw new Error(`Failed to create order: ${data.orderId}`);
  }

  console.log(`Order created: ${data.orderId}`);
}

/**
 * Example: Charge payment (non-idempotent)
 */
async function chargePayment(data: any, env: Env) {
  // Call payment API (can't be retried safely without deduplication)
  const response = await fetch('https://api.stripe.com/v1/charges', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      amount: String(data.amount),
      currency: data.currency,
      source: data.token,
      description: data.description,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Payment failed: ${error}`);
  }

  const charge = await response.json();
  console.log(`Payment charged: ${charge.id}`);

  // Update database with charge ID
  await env.DB.prepare(`
    UPDATE orders SET payment_id = ?, status = 'paid' WHERE id = ?
  `)
    .bind(charge.id, data.orderId)
    .run();
}

/**
 * Example: Update inventory (non-idempotent)
 */
async function updateInventory(data: any, env: Env) {
  for (const item of data.items) {
    // Decrement inventory count
    const result = await env.DB.prepare(`
      UPDATE inventory
      SET quantity = quantity - ?
      WHERE sku = ? AND quantity >= ?
    `)
      .bind(item.quantity, item.sku, item.quantity)
      .run();

    if (result.changes === 0) {
      throw new Error(`Insufficient inventory for SKU: ${item.sku}`);
    }

    console.log(`Inventory updated: ${item.sku} (-${item.quantity})`);
  }
}
