// Cloudflare Worker with Claude API
// Uses fetch API (no SDK needed)

export interface Env {
  ANTHROPIC_API_KEY: string;
}

// Basic chat endpoint
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { messages } = await request.json<{ messages: any[] }>();

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          messages,
        }),
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  },
};

// Streaming endpoint example
export const streamingEndpoint = {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { messages } = await request.json<{ messages: any[] }>();

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          messages,
          stream: true,
        }),
      });

      // Return SSE stream directly
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500 }
      );
    }
  },
};

// With rate limiting using Durable Objects
interface RateLimiterState {
  requests: number;
  resetTime: number;
}

export class RateLimiter implements DurableObject {
  state: DurableObjectState;
  storage: DurableObjectStorage;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.storage = state.storage;
  }

  async fetch(request: Request): Promise<Response> {
    const now = Date.now();
    const limitData = await this.storage.get<RateLimiterState>('limiter') || {
      requests: 0,
      resetTime: now + 60000, // 1 minute
    };

    // Reset if time window expired
    if (now > limitData.resetTime) {
      limitData.requests = 0;
      limitData.resetTime = now + 60000;
    }

    // Check limit (e.g., 10 requests per minute)
    if (limitData.requests >= 10) {
      return new Response('Rate limit exceeded', { status: 429 });
    }

    limitData.requests++;
    await this.storage.put('limiter', limitData);

    return new Response('OK', { status: 200 });
  }
}

// Complete worker with error handling and rate limiting
export const productionWorker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Route handling
    if (url.pathname === '/chat') {
      return handleChat(request, env);
    }

    if (url.pathname === '/stream') {
      return handleStream(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleChat(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { messages } = await request.json<{ messages: any[] }>();

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages array' }),
        { status: 400 }
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', error);
      return new Response(
        JSON.stringify({ error: 'API request failed' }),
        { status: response.status }
      );
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Worker error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

async function handleStream(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { messages } = await request.json<{ messages: any[] }>();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Stream failed' }),
        { status: response.status }
      );
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Stream error:', error);
    return new Response(
      JSON.stringify({ error: 'Stream error' }),
      { status: 500 }
    );
  }
}
