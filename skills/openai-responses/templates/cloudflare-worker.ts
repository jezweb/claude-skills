/**
 * Cloudflare Workers Example
 *
 * Demonstrates using the Responses API in Cloudflare Workers without the SDK.
 * Uses native fetch API for zero dependencies.
 */

export interface Env {
  OPENAI_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { input } = await request.json<{ input: string }>();

      // Basic response
      const response = await createResponse(env.OPENAI_API_KEY, {
        model: 'gpt-5',
        input,
      });

      return new Response(JSON.stringify(response), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

// Helper: Create response
async function createResponse(apiKey: string, params: any) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  return response.json();
}

// Example: Stateful conversation
export const conversationWorker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { conversationId, input } = await request.json<{
      conversationId?: string;
      input: string;
    }>();

    // Create or use existing conversation
    let convId = conversationId;
    if (!convId) {
      const conv = await createConversation(env.OPENAI_API_KEY);
      convId = conv.id;
    }

    // Create response with conversation
    const response = await createResponse(env.OPENAI_API_KEY, {
      model: 'gpt-5',
      conversation: convId,
      input,
    });

    return new Response(
      JSON.stringify({
        conversationId: convId,
        output: response.output_text,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
};

// Helper: Create conversation
async function createConversation(apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/conversations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  return response.json();
}

// Example: With MCP tools
export const mcpWorker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { input } = await request.json<{ input: string }>();

    const response = await createResponse(env.OPENAI_API_KEY, {
      model: 'gpt-5',
      input,
      tools: [
        {
          type: 'mcp',
          server_label: 'stripe',
          server_url: 'https://mcp.stripe.com',
          authorization: env.STRIPE_OAUTH_TOKEN,
        },
      ],
    });

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

// Example: With Code Interpreter
export const codeInterpreterWorker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { input } = await request.json<{ input: string }>();

    const response = await createResponse(env.OPENAI_API_KEY, {
      model: 'gpt-5',
      input,
      tools: [{ type: 'code_interpreter' }],
    });

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

// Example: With File Search
export const fileSearchWorker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { input, fileIds } = await request.json<{
      input: string;
      fileIds: string[];
    }>();

    const response = await createResponse(env.OPENAI_API_KEY, {
      model: 'gpt-5',
      input,
      tools: [{ type: 'file_search', file_ids: fileIds }],
    });

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

// Example: With Web Search
export const webSearchWorker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { input } = await request.json<{ input: string }>();

    const response = await createResponse(env.OPENAI_API_KEY, {
      model: 'gpt-5',
      input,
      tools: [{ type: 'web_search' }],
    });

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

// Example: Background mode
export const backgroundWorker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { input, responseId } = await request.json<{
      input?: string;
      responseId?: string;
    }>();

    // Start background task
    if (input) {
      const response = await createResponse(env.OPENAI_API_KEY, {
        model: 'gpt-5',
        input,
        background: true,
      });

      return new Response(
        JSON.stringify({
          responseId: response.id,
          status: response.status,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check status
    if (responseId) {
      const response = await fetch(
        `https://api.openai.com/v1/responses/${responseId}`,
        {
          headers: {
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          },
        }
      );

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Invalid request', { status: 400 });
  },
};

// Example: Error handling
export const errorHandlingWorker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const { input } = await request.json<{ input: string }>();

      const response = await createResponse(env.OPENAI_API_KEY, {
        model: 'gpt-5',
        input,
      });

      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      // Handle specific errors
      if (error.type === 'rate_limit_error') {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded', retry_after: error.retry_after }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (error.type === 'mcp_connection_error') {
        return new Response(
          JSON.stringify({ error: 'MCP server connection failed' }),
          {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Generic error
      return new Response(
        JSON.stringify({ error: error.message || 'Internal error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

// Example: Polymorphic outputs
export const polymorphicWorker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { input } = await request.json<{ input: string }>();

    const response = await createResponse(env.OPENAI_API_KEY, {
      model: 'gpt-5',
      input,
      tools: [{ type: 'code_interpreter' }, { type: 'web_search' }],
    });

    // Process different output types
    const processedOutput: any = {
      text: response.output_text,
      reasoning: [],
      toolCalls: [],
    };

    response.output.forEach((item: any) => {
      if (item.type === 'reasoning') {
        processedOutput.reasoning.push(item.summary[0].text);
      }
      if (item.type === 'code_interpreter_call') {
        processedOutput.toolCalls.push({
          type: 'code_interpreter',
          input: item.input,
          output: item.output,
        });
      }
      if (item.type === 'web_search_call') {
        processedOutput.toolCalls.push({
          type: 'web_search',
          query: item.query,
          results: item.results,
        });
      }
    });

    return new Response(JSON.stringify(processedOutput), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
