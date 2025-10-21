/**
 * Cloudflare Workers AI - Text Generation Examples
 *
 * This template demonstrates:
 * - Basic text generation (prompt and messages)
 * - Streaming responses (RECOMMENDED for production)
 * - Chat completions with conversation history
 * - Structured output with JSON
 * - Error handling and retry logic
 * - Rate limit management
 */

import { Hono } from 'hono';

type Bindings = {
  AI: Ai;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Basic Text Generation
// ============================================================================

// Simple prompt (deprecated pattern, use messages instead)
app.post('/simple', async (c) => {
  try {
    const { prompt } = await c.req.json<{ prompt: string }>();

    const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt,
    });

    return c.json({
      success: true,
      response: response.response,
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
// Streaming Text Generation (RECOMMENDED)
// ============================================================================

/**
 * Streaming is ESSENTIAL for production:
 * - Prevents buffering large responses in memory
 * - Faster time-to-first-token
 * - Better user experience
 * - Avoids Worker timeout issues
 */

app.post('/stream', async (c) => {
  try {
    const { prompt } = await c.req.json<{ prompt: string }>();

    const stream = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      stream: true, // Enable streaming
    });

    return new Response(stream, {
      headers: {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
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
// Chat Completions with History
// ============================================================================

app.post('/chat', async (c) => {
  try {
    const { messages } = await c.req.json<{
      messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    }>();

    // Validate messages
    if (!messages || messages.length === 0) {
      return c.json({ error: 'Messages array is required' }, 400);
    }

    const stream = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages,
      stream: true,
      max_tokens: 512, // Limit response length
    });

    return new Response(stream, {
      headers: { 'content-type': 'text/event-stream' },
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
// Streaming with Custom Parameters
// ============================================================================

app.post('/stream/custom', async (c) => {
  try {
    const { prompt, temperature = 0.7, max_tokens = 512 } = await c.req.json<{
      prompt: string;
      temperature?: number;
      max_tokens?: number;
    }>();

    const stream = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      stream: true,
      max_tokens,
      temperature, // Controls randomness (0.0-1.0)
    });

    return new Response(stream, {
      headers: { 'content-type': 'text/event-stream' },
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
// Structured Output (JSON)
// ============================================================================

/**
 * Generate structured JSON output
 * Useful for extracting data, generating schemas, etc.
 */

app.post('/structured', async (c) => {
  try {
    const { topic } = await c.req.json<{ topic: string }>();

    const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that ONLY returns valid JSON. Never include explanations or markdown, just raw JSON.',
        },
        {
          role: 'user',
          content: `Generate a recipe for ${topic}. Return JSON with keys: name, ingredients (array), instructions (array), prepTime (number in minutes)`,
        },
      ],
      max_tokens: 1024,
    });

    // Parse JSON response
    const data = JSON.parse(response.response);

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
// Model Comparison
// ============================================================================

/**
 * Compare different models side-by-side
 */

app.post('/compare', async (c) => {
  try {
    const { prompt } = await c.req.json<{ prompt: string }>();

    const models = [
      '@cf/meta/llama-3.1-8b-instruct', // Balanced
      '@cf/meta/llama-3.2-1b-instruct', // Fast
      '@cf/qwen/qwen1.5-14b-chat-awq', // High quality
    ];

    const results = await Promise.all(
      models.map(async (model) => {
        const start = Date.now();
        const response = await c.env.AI.run(model, {
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 256,
        });
        const duration = Date.now() - start;

        return {
          model,
          response: response.response,
          duration,
        };
      })
    );

    return c.json({
      success: true,
      results,
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
// Error Handling with Retry
// ============================================================================

/**
 * Retry logic for rate limits and transient errors
 */

async function runWithRetry(
  ai: Ai,
  model: string,
  inputs: any,
  maxRetries = 3
): Promise<any> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await ai.run(model, inputs);
    } catch (error) {
      lastError = error as Error;
      const message = lastError.message.toLowerCase();

      // Rate limit (429) - retry with exponential backoff
      if (message.includes('429') || message.includes('rate limit')) {
        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
          console.log(`Rate limited. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      // Model unavailable - try fallback model
      if (message.includes('model') && message.includes('unavailable')) {
        if (i === 0) {
          console.log('Model unavailable, trying fallback...');
          model = '@cf/meta/llama-3.2-1b-instruct'; // Faster fallback
          continue;
        }
      }

      // Other errors - throw immediately
      throw error;
    }
  }

  throw lastError!;
}

app.post('/reliable', async (c) => {
  try {
    const { prompt } = await c.req.json<{ prompt: string }>();

    const response = await runWithRetry(c.env.AI, '@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
    });

    return c.json({
      success: true,
      response: response.response,
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
// Token Length Validation
// ============================================================================

/**
 * Validate input length to prevent token limit errors
 * Approximate: 1 token ≈ 4 characters
 */

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

app.post('/validate', async (c) => {
  try {
    const { prompt } = await c.req.json<{ prompt: string }>();

    const estimatedTokens = estimateTokens(prompt);
    const maxInputTokens = 2048; // Most models support 2K-128K

    if (estimatedTokens > maxInputTokens) {
      return c.json(
        {
          success: false,
          error: `Input too long: ${estimatedTokens} tokens (max: ${maxInputTokens})`,
        },
        400
      );
    }

    const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
    });

    return c.json({
      success: true,
      response: response.response,
      estimatedTokens,
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
// System Prompts & Personas
// ============================================================================

const PERSONAS = {
  helpful: 'You are a helpful AI assistant.',
  concise: 'You are a concise AI assistant. Keep responses brief.',
  technical: 'You are a technical AI assistant. Provide detailed, accurate information.',
  creative: 'You are a creative AI assistant. Be imaginative and original.',
};

app.post('/persona/:persona', async (c) => {
  try {
    const persona = c.req.param('persona') as keyof typeof PERSONAS;
    const { prompt } = await c.req.json<{ prompt: string }>();

    if (!PERSONAS[persona]) {
      return c.json({ error: 'Invalid persona' }, 400);
    }

    const stream = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: PERSONAS[persona] },
        { role: 'user', content: prompt },
      ],
      stream: true,
    });

    return new Response(stream, {
      headers: { 'content-type': 'text/event-stream' },
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
// Health Check
// ============================================================================

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default app;
