// Next.js API Routes for Claude API

// ============================================
// App Router (app/api/chat/route.ts)
// ============================================

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// POST /api/chat - Non-streaming
export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages,
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Chat error:', error);

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// App Router with Streaming (app/api/stream/route.ts)
// ============================================

export async function POST_STREAMING(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages,
    });

    // Convert to ReadableStream
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const text = event.delta.text;
              controller.enqueue(new TextEncoder().encode(text));
            }

            if (event.type === 'message_stop') {
              controller.close();
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Stream setup error:', error);
    return NextResponse.json({ error: 'Stream failed' }, { status: 500 });
  }
}

// ============================================
// Pages Router (pages/api/chat.ts)
// ============================================

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages,
    });

    res.status(200).json(message);
  } catch (error) {
    console.error('API error:', error);

    if (error instanceof Anthropic.APIError) {
      return res.status(error.status || 500).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================
// Pages Router with Streaming (pages/api/stream.ts)
// ============================================

export async function streamHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages,
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    stream.on('error', (error) => {
      console.error('Stream error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    });

    stream.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

    await stream.finalMessage();
  } catch (error) {
    console.error('Stream setup error:', error);
    res.status(500).json({ error: 'Stream failed' });
  }
}

// ============================================
// With Tool Use (App Router)
// ============================================

export async function POST_WITH_TOOLS(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const tools: Anthropic.Tool[] = [
      {
        name: 'get_weather',
        description: 'Get the current weather',
        input_schema: {
          type: 'object',
          properties: {
            location: { type: 'string' },
          },
          required: ['location'],
        },
      },
    ];

    let conversationMessages = messages;

    while (true) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        tools,
        messages: conversationMessages,
      });

      conversationMessages.push({
        role: 'assistant',
        content: response.content,
      });

      if (response.stop_reason === 'tool_use') {
        const toolResults = [];

        for (const block of response.content) {
          if (block.type === 'tool_use') {
            // Execute tool
            const result = await executeToolFunction(block.name, block.input);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });
          }
        }

        conversationMessages.push({
          role: 'user',
          content: toolResults,
        });
      } else {
        // Final response
        return NextResponse.json(response);
      }
    }
  } catch (error) {
    console.error('Tool use error:', error);
    return NextResponse.json({ error: 'Tool execution failed' }, { status: 500 });
  }
}

async function executeToolFunction(name: string, input: any): Promise<any> {
  if (name === 'get_weather') {
    // Mock implementation
    return { temperature: 72, condition: 'Sunny' };
  }
  return { error: 'Unknown tool' };
}

// ============================================
// With Prompt Caching (App Router)
// ============================================

export async function POST_WITH_CACHING(request: NextRequest) {
  try {
    const { messages, systemPrompt } = await request.json();

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages,
    });

    return NextResponse.json({
      message,
      usage: message.usage,
    });
  } catch (error) {
    console.error('Caching error:', error);
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}

// ============================================
// Middleware for Rate Limiting
// ============================================

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});

export async function POST_WITH_RATE_LIMIT(request: NextRequest) {
  // Get identifier (IP or user ID)
  const identifier = request.ip ?? 'anonymous';

  const { success } = await ratelimit.limit(identifier);

  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Continue with normal handler
  return POST(request);
}
