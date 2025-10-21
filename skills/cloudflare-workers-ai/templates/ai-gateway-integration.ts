/**
 * Cloudflare AI Gateway - Integration Examples
 *
 * This template demonstrates:
 * - AI Gateway setup and configuration
 * - Caching AI responses
 * - Logging and analytics
 * - Cost tracking
 * - Rate limiting
 * - Feedback collection
 */

import { Hono } from 'hono';

type Bindings = {
  AI: Ai;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Basic AI Gateway Usage
// ============================================================================

/**
 * Create a gateway at: https://dash.cloudflare.com/ai/ai-gateway
 * Use the gateway ID in your requests
 */

app.post('/gateway/basic', async (c) => {
  try {
    const { prompt } = await c.req.json<{ prompt: string }>();

    const response = await c.env.AI.run(
      '@cf/meta/llama-3.1-8b-instruct',
      {
        messages: [{ role: 'user', content: prompt }],
      },
      {
        gateway: {
          id: 'my-gateway', // Your gateway ID
        },
      }
    );

    // Access log ID for analytics
    const logId = c.env.AI.aiGatewayLogId;

    return c.json({
      success: true,
      response: response.response,
      logId, // Use for tracking and feedback
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
// AI Gateway with Caching
// ============================================================================

/**
 * AI Gateway can cache responses to reduce costs
 * Same prompt = cached response (no inference cost)
 */

app.post('/gateway/cached', async (c) => {
  try {
    const { prompt } = await c.req.json<{ prompt: string }>();

    const response = await c.env.AI.run(
      '@cf/meta/llama-3.1-8b-instruct',
      {
        messages: [{ role: 'user', content: prompt }],
      },
      {
        gateway: {
          id: 'my-gateway',
          skipCache: false, // Use cache (default)
        },
      }
    );

    return c.json({
      success: true,
      response: response.response,
      logId: c.env.AI.aiGatewayLogId,
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
// Skip Cache for Dynamic Content
// ============================================================================

app.post('/gateway/no-cache', async (c) => {
  try {
    const { prompt } = await c.req.json<{ prompt: string }>();

    const response = await c.env.AI.run(
      '@cf/meta/llama-3.1-8b-instruct',
      {
        messages: [{ role: 'user', content: prompt }],
      },
      {
        gateway: {
          id: 'my-gateway',
          skipCache: true, // Always fetch fresh response
        },
      }
    );

    return c.json({
      success: true,
      response: response.response,
      logId: c.env.AI.aiGatewayLogId,
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
// Send Feedback to AI Gateway
// ============================================================================

/**
 * Track user satisfaction with AI responses
 * Helps optimize prompts and model selection
 */

app.post('/gateway/feedback', async (c) => {
  try {
    const { logId, rating, comment } = await c.req.json<{
      logId: string;
      rating: number; // 1-5
      comment?: string;
    }>();

    const gateway = c.env.AI.gateway('my-gateway');

    await gateway.patchLog(logId, {
      feedback: {
        rating,
        comment,
      },
    });

    return c.json({
      success: true,
      message: 'Feedback recorded',
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
// Track Cost Per Request
// ============================================================================

/**
 * Monitor neurons usage per request
 * AI Gateway logs show cost breakdown
 */

app.post('/gateway/track-cost', async (c) => {
  try {
    const { prompt } = await c.req.json<{ prompt: string }>();

    const start = Date.now();

    const response = await c.env.AI.run(
      '@cf/meta/llama-3.1-8b-instruct',
      {
        messages: [{ role: 'user', content: prompt }],
      },
      {
        gateway: {
          id: 'my-gateway',
        },
      }
    );

    const duration = Date.now() - start;
    const logId = c.env.AI.aiGatewayLogId;

    return c.json({
      success: true,
      response: response.response,
      metrics: {
        logId,
        duration,
        // Check AI Gateway dashboard for neurons usage
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

// ============================================================================
// Multi-Model Gateway
// ============================================================================

/**
 * Use different models through the same gateway
 * Compare performance and costs
 */

app.post('/gateway/multi-model', async (c) => {
  try {
    const { prompt, model = '@cf/meta/llama-3.1-8b-instruct' } = await c.req.json<{
      prompt: string;
      model?: string;
    }>();

    const response = await c.env.AI.run(
      model,
      {
        messages: [{ role: 'user', content: prompt }],
      },
      {
        gateway: {
          id: 'my-gateway',
        },
      }
    );

    return c.json({
      success: true,
      model,
      response: response.response,
      logId: c.env.AI.aiGatewayLogId,
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
// Streaming with AI Gateway
// ============================================================================

app.post('/gateway/stream', async (c) => {
  try {
    const { prompt } = await c.req.json<{ prompt: string }>();

    const stream = await c.env.AI.run(
      '@cf/meta/llama-3.1-8b-instruct',
      {
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      },
      {
        gateway: {
          id: 'my-gateway',
        },
      }
    );

    // Log ID available after streaming starts
    const logId = c.env.AI.aiGatewayLogId;

    return new Response(stream, {
      headers: {
        'content-type': 'text/event-stream',
        'x-ai-gateway-log-id': logId || '',
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

// ============================================================================
// Request Analytics Middleware
// ============================================================================

/**
 * Log all AI requests for analytics
 */

app.use('/ai/*', async (c, next) => {
  const start = Date.now();
  const path = c.req.path;

  await next();

  const duration = Date.now() - start;
  const logId = c.env.AI.aiGatewayLogId;

  // Log to console (or send to analytics service)
  console.log({
    timestamp: new Date().toISOString(),
    path,
    duration,
    logId,
    status: c.res.status,
  });
});

app.post('/ai/chat', async (c) => {
  const { prompt } = await c.req.json<{ prompt: string }>();

  const response = await c.env.AI.run(
    '@cf/meta/llama-3.1-8b-instruct',
    {
      messages: [{ role: 'user', content: prompt }],
    },
    {
      gateway: { id: 'my-gateway' },
    }
  );

  return c.json({
    success: true,
    response: response.response,
  });
});

// ============================================================================
// Rate Limit Protection
// ============================================================================

/**
 * AI Gateway provides additional rate limiting
 * Configure in dashboard: https://dash.cloudflare.com/ai/ai-gateway
 */

app.post('/gateway/rate-limited', async (c) => {
  try {
    const { prompt } = await c.req.json<{ prompt: string }>();

    const response = await c.env.AI.run(
      '@cf/meta/llama-3.1-8b-instruct',
      {
        messages: [{ role: 'user', content: prompt }],
      },
      {
        gateway: {
          id: 'my-gateway',
        },
      }
    );

    return c.json({
      success: true,
      response: response.response,
    });
  } catch (error) {
    const message = (error as Error).message;

    // Check for rate limit error
    if (message.includes('429') || message.includes('rate limit')) {
      return c.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: 60, // seconds
        },
        429
      );
    }

    return c.json(
      {
        success: false,
        error: message,
      },
      500
    );
  }
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default app;
