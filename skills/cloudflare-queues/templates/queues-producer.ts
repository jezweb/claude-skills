/**
 * Queue Producer Example
 *
 * Shows how to send messages to Cloudflare Queues from a Hono Worker.
 *
 * Setup:
 * 1. Create queue: npx wrangler queues create my-queue
 * 2. Add producer binding to wrangler.jsonc (see wrangler-queues-config.jsonc)
 * 3. Deploy: npm run deploy
 */

import { Hono } from 'hono';

type Bindings = {
  MY_QUEUE: Queue;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Send Single Message
// ============================================================================

app.post('/send', async (c) => {
  const body = await c.req.json();

  // Simple send
  await c.env.MY_QUEUE.send({
    type: 'process-order',
    orderId: body.orderId,
    userId: body.userId,
    timestamp: Date.now(),
  });

  return c.json({ status: 'queued' });
});

// ============================================================================
// Send Message with Delay
// ============================================================================

app.post('/send-delayed', async (c) => {
  const { task, delayMinutes } = await c.req.json();

  // Delay message delivery
  await c.env.MY_QUEUE.send(
    {
      type: 'scheduled-task',
      task,
      scheduledFor: Date.now() + (delayMinutes * 60 * 1000),
    },
    {
      delaySeconds: delayMinutes * 60, // Convert minutes to seconds
    }
  );

  return c.json({
    status: 'scheduled',
    delayMinutes,
    processAt: new Date(Date.now() + (delayMinutes * 60 * 1000)).toISOString(),
  });
});

// ============================================================================
// Send Batch of Messages
// ============================================================================

app.post('/send-batch', async (c) => {
  const items = await c.req.json<Array<any>>();

  // Validate batch size (max 100 messages)
  if (items.length > 100) {
    return c.json(
      { error: 'Maximum 100 messages per batch' },
      400
    );
  }

  // Send batch
  await c.env.MY_QUEUE.sendBatch(
    items.map((item) => ({
      body: {
        type: 'batch-process',
        itemId: item.id,
        data: item.data,
      },
    }))
  );

  return c.json({
    status: 'queued',
    count: items.length,
  });
});

// ============================================================================
// Send Batch with Individual Delays
// ============================================================================

app.post('/send-scheduled-batch', async (c) => {
  const tasks = await c.req.json<Array<{ task: string; delayMinutes: number }>>();

  await c.env.MY_QUEUE.sendBatch(
    tasks.map((task) => ({
      body: {
        type: 'scheduled-task',
        task: task.task,
      },
      delaySeconds: task.delayMinutes * 60,
    }))
  );

  return c.json({
    status: 'scheduled',
    count: tasks.length,
  });
});

// ============================================================================
// Validate Message Size (< 128 KB)
// ============================================================================

app.post('/send-validated', async (c) => {
  const body = await c.req.json();

  // Check message size
  const messageSize = new TextEncoder().encode(JSON.stringify(body)).length;
  const MAX_SIZE = 128 * 1024; // 128 KB

  if (messageSize > MAX_SIZE) {
    return c.json(
      {
        error: 'Message too large',
        size: messageSize,
        maxSize: MAX_SIZE,
      },
      400
    );
  }

  await c.env.MY_QUEUE.send(body);

  return c.json({
    status: 'queued',
    messageSize,
  });
});

// ============================================================================
// Real-World Example: E-commerce Order Processing
// ============================================================================

interface Order {
  orderId: string;
  userId: string;
  items: Array<{ sku: string; quantity: number; price: number }>;
  total: number;
  email: string;
}

app.post('/orders', async (c) => {
  const order: Order = await c.req.json();

  // Queue multiple tasks for this order
  await c.env.MY_QUEUE.sendBatch([
    // Immediate: Send confirmation email
    {
      body: {
        type: 'send-email',
        template: 'order-confirmation',
        to: order.email,
        orderId: order.orderId,
      },
    },

    // Immediate: Update inventory
    {
      body: {
        type: 'update-inventory',
        items: order.items,
        orderId: order.orderId,
      },
    },

    // Delayed: Send shipping notification (estimated 2 hours)
    {
      body: {
        type: 'send-email',
        template: 'shipping-notification',
        to: order.email,
        orderId: order.orderId,
      },
      delaySeconds: 2 * 60 * 60, // 2 hours
    },

    // Delayed: Request review (3 days later)
    {
      body: {
        type: 'send-email',
        template: 'review-request',
        to: order.email,
        orderId: order.orderId,
      },
      delaySeconds: 3 * 24 * 60 * 60, // 3 days
    },
  ]);

  return c.json({
    status: 'success',
    orderId: order.orderId,
    tasksQueued: 4,
  });
});

// ============================================================================
// Webhook Handler Example
// ============================================================================

app.post('/webhooks/:service', async (c) => {
  const service = c.req.param('service');
  const payload = await c.req.json();

  // Queue webhook for async processing
  await c.env.MY_QUEUE.send({
    type: 'webhook',
    service,
    payload,
    receivedAt: Date.now(),
  });

  // Respond immediately (don't block webhook)
  return c.json({ received: true }, 200);
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

export default app;
