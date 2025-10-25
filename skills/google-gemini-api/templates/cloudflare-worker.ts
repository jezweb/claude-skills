/**
 * Complete Cloudflare Worker with Gemini API
 *
 * Demonstrates:
 * - Fetch-based Gemini API integration (no SDK dependencies)
 * - Streaming responses to client
 * - Multi-turn chat with session storage
 * - Error handling for production
 * - CORS configuration
 *
 * Deploy:
 * - npx wrangler deploy
 * - Set GEMINI_API_KEY in Cloudflare dashboard or wrangler.toml
 */

interface Env {
  GEMINI_API_KEY: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export default {
  /**
   * Main request handler
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    try {
      // Route: POST /api/chat (non-streaming)
      if (url.pathname === '/api/chat' && request.method === 'POST') {
        return await handleChat(request, env, corsHeaders);
      }

      // Route: POST /api/chat/stream (streaming)
      if (url.pathname === '/api/chat/stream' && request.method === 'POST') {
        return await handleChatStream(request, env, corsHeaders);
      }

      // Route: GET / (health check)
      if (url.pathname === '/' && request.method === 'GET') {
        return new Response(
          JSON.stringify({ status: 'ok', service: 'Gemini API Worker' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 404 for unknown routes
      return new Response('Not Found', { status: 404, headers: corsHeaders });

    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
};

/**
 * Handle non-streaming chat request
 */
async function handleChat(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  const { message, history = [] } = await request.json() as {
    message: string;
    history?: ChatMessage[];
  };

  // Build contents array with history
  const contents: ChatMessage[] = [
    ...history,
    { role: 'user', parts: [{ text: message }] }
  ];

  // Call Gemini API
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY,
      },
      body: JSON.stringify({ contents }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Gemini API error');
  }

  const data = await response.json();
  const assistantReply = data.candidates[0]?.content?.parts[0]?.text;

  // Return response with updated history
  return new Response(
    JSON.stringify({
      reply: assistantReply,
      history: [
        ...history,
        { role: 'user', parts: [{ text: message }] },
        { role: 'model', parts: [{ text: assistantReply }] }
      ],
      usage: data.usageMetadata
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Handle streaming chat request
 */
async function handleChatStream(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  const { message, history = [] } = await request.json() as {
    message: string;
    history?: ChatMessage[];
  };

  const contents: ChatMessage[] = [
    ...history,
    { role: 'user', parts: [{ text: message }] }
  ];

  // Create a TransformStream to stream to client
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Start streaming in background
  (async () => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': env.GEMINI_API_KEY,
          },
          body: JSON.stringify({ contents }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || line.startsWith('data: [DONE]')) continue;
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));
            const text = data.candidates[0]?.content?.parts[0]?.text;

            if (text) {
              await writer.write(encoder.encode(text));
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      await writer.close();

    } catch (error: any) {
      await writer.write(encoder.encode(`\n\nError: ${error.message}`));
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}

/**
 * Example Client Usage (JavaScript):
 *
 * // Non-streaming
 * const response = await fetch('https://your-worker.workers.dev/api/chat', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     message: 'What is quantum computing?',
 *     history: []
 *   })
 * });
 * const data = await response.json();
 * console.log(data.reply);
 *
 * // Streaming
 * const response = await fetch('https://your-worker.workers.dev/api/chat/stream', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     message: 'Write a story',
 *     history: []
 *   })
 * });
 * const reader = response.body.getReader();
 * const decoder = new TextDecoder();
 * while (true) {
 *   const { done, value } = await reader.read();
 *   if (done) break;
 *   console.log(decoder.decode(value));
 * }
 */
