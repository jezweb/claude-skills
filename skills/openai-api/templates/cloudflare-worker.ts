// Complete Cloudflare Worker with OpenAI Integration
// Supports both streaming and non-streaming chat completions

interface Env {
  OPENAI_API_KEY: string;
}

interface ChatRequest {
  message: string;
  stream?: boolean;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { message, stream } = await request.json() as ChatRequest;

      if (!message) {
        return new Response(
          JSON.stringify({ error: 'Message is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Call OpenAI
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5',
          messages: [
            { role: 'user', content: message }
          ],
          stream: stream || false,
          reasoning_effort: 'medium',
          max_tokens: 500,
        }),
      });

      if (!openaiResponse.ok) {
        const error = await openaiResponse.text();
        return new Response(
          JSON.stringify({ error: `OpenAI API error: ${error}` }),
          { status: openaiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Streaming response
      if (stream) {
        return new Response(openaiResponse.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }

      // Non-streaming response
      const data = await openaiResponse.json();
      return new Response(
        JSON.stringify({
          response: data.choices[0].message.content,
          usage: data.usage,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );

    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: error.message || 'Internal server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};
