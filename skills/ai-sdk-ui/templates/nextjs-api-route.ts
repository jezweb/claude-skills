/**
 * Next.js API Routes for useChat
 *
 * Shows both App Router and Pages Router patterns.
 *
 * Key Difference:
 * - App Router: Use toDataStreamResponse()
 * - Pages Router: Use pipeDataStreamToResponse()
 *
 * This file includes both patterns for reference.
 */

// ============================================================================
// APP ROUTER (Next.js 13+)
// ============================================================================
// Location: app/api/chat/route.ts

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
    system: 'You are a helpful AI assistant.',
    maxOutputTokens: 1000,
    temperature: 0.7,
  });

  // App Router: Use toDataStreamResponse()
  return result.toDataStreamResponse();
}

// ============================================================================
// PAGES ROUTER (Next.js 12 and earlier)
// ============================================================================
// Location: pages/api/chat.ts

/*
import type { NextApiRequest, NextApiResponse } from 'next';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
    system: 'You are a helpful AI assistant.',
  });

  // Pages Router: Use pipeDataStreamToResponse()
  return result.pipeDataStreamToResponse(res);
}
*/

// ============================================================================
// WITH ANTHROPIC (Claude)
// ============================================================================

/*
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    messages,
  });

  return result.toDataStreamResponse();
}
*/

// ============================================================================
// WITH GOOGLE (Gemini)
// ============================================================================

/*
import { google } from '@ai-sdk/google';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-1.5-pro'),
    messages,
  });

  return result.toDataStreamResponse();
}
*/

// ============================================================================
// WITH CLOUDFLARE WORKERS AI
// ============================================================================

/*
// Requires: workers-ai-provider
import { createWorkersAI } from 'workers-ai-provider';

// For Cloudflare Workers (not Next.js):
export default {
  async fetch(request, env) {
    const { messages } = await request.json();
    const workersai = createWorkersAI({ binding: env.AI });

    const result = streamText({
      model: workersai('@cf/meta/llama-3.1-8b-instruct'),
      messages,
    });

    return result.toDataStreamResponse();
  },
};
*/

// ============================================================================
// WITH ERROR HANDLING
// ============================================================================

/*
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: openai('gpt-4-turbo'),
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({
        error: 'An error occurred while processing your request.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
*/

// ============================================================================
// WITH TOOLS
// ============================================================================

/*
import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
    tools: {
      getWeather: tool({
        description: 'Get the current weather for a location',
        inputSchema: z.object({
          location: z.string().describe('The city name'),
        }),
        execute: async ({ location }) => {
          // Simulated weather API call
          return {
            location,
            temperature: 72,
            condition: 'sunny',
          };
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
*/

// ============================================================================
// FOR useCompletion
// ============================================================================
// Location: app/api/completion/route.ts

/*
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamText({
    model: openai('gpt-3.5-turbo'),
    prompt,
    maxOutputTokens: 500,
  });

  return result.toDataStreamResponse();
}
*/

// ============================================================================
// FOR useObject
// ============================================================================
// Location: app/api/recipe/route.ts

/*
import { streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamObject({
    model: openai('gpt-4'),
    schema: z.object({
      recipe: z.object({
        name: z.string(),
        ingredients: z.array(z.string()),
        instructions: z.array(z.string()),
      }),
    }),
    prompt: `Generate a recipe for ${prompt}`,
  });

  return result.toTextStreamResponse();
}
*/
