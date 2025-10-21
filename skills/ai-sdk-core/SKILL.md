---
name: AI SDK Core
description: |
  Backend AI functionality with Vercel AI SDK v5 - text generation, structured output with Zod,
  tool calling, and agents. Multi-provider support for OpenAI, Anthropic, Google, and Cloudflare Workers AI.

  Use when: implementing server-side AI features, generating text/chat completions, creating structured
  AI outputs with Zod schemas, building AI agents with tools, streaming AI responses, integrating
  OpenAI/Anthropic/Google/Cloudflare providers, or encountering AI SDK errors like AI_APICallError,
  AI_NoObjectGeneratedError, streaming failures, or worker startup limits.

  Keywords: ai sdk core, vercel ai sdk, generateText, streamText, generateObject, streamObject,
  ai sdk node, ai sdk server, zod ai schema, ai tools calling, ai agent class, openai sdk, anthropic sdk,
  google gemini sdk, workers-ai-provider, ai streaming backend, multi-provider ai, ai sdk errors,
  AI_APICallError, AI_NoObjectGeneratedError, streamText fails, worker startup limit ai
license: MIT
---

# AI SDK Core

Production-ready backend AI with Vercel AI SDK v5.

## Quick Start (5 Minutes)

### Installation

```bash
# Core package
npm install ai

# Provider packages (install what you need)
npm install @ai-sdk/openai       # OpenAI (GPT-4, GPT-3.5, gpt-5)
npm install @ai-sdk/anthropic    # Anthropic (Claude 3.5 Sonnet, Opus, Haiku)
npm install @ai-sdk/google       # Google (Gemini 2.5 Pro/Flash)
npm install workers-ai-provider  # Cloudflare Workers AI

# Schema validation
npm install zod
```

### Environment Variables

```bash
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

### First Example: Generate Text

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = await generateText({
  model: openai('gpt-4-turbo'),
  prompt: 'What is TypeScript?',
});

console.log(result.text);
```

### First Example: Streaming Chat

```typescript
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const stream = streamText({
  model: anthropic('claude-3-5-sonnet-20241022'),
  messages: [
    { role: 'user', content: 'Tell me a story' },
  ],
});

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

### First Example: Structured Output

```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const result = await generateObject({
  model: openai('gpt-4'),
  schema: z.object({
    name: z.string(),
    age: z.number(),
    skills: z.array(z.string()),
  }),
  prompt: 'Generate a person profile for a software engineer',
});

console.log(result.object);
// { name: "Alice", age: 28, skills: ["TypeScript", "React"] }
```

---

## Core Functions

### generateText()

Generate text completion with optional tools and multi-step execution.

**Signature:**

```typescript
async function generateText(options: {
  model: LanguageModel;
  prompt?: string;
  messages?: Array<ModelMessage>;
  system?: string;
  tools?: Record<string, Tool>;
  maxOutputTokens?: number;
  temperature?: number;
  stopWhen?: StopCondition;
  // ... other options
}): Promise<GenerateTextResult>
```

**Basic Usage:**

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = await generateText({
  model: openai('gpt-4-turbo'),
  prompt: 'Explain quantum computing',
  maxOutputTokens: 500,
  temperature: 0.7,
});

console.log(result.text);
console.log(`Tokens: ${result.usage.totalTokens}`);
```

**With Messages (Chat Format):**

```typescript
const result = await generateText({
  model: openai('gpt-4-turbo'),
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the weather?' },
    { role: 'assistant', content: 'I need your location.' },
    { role: 'user', content: 'San Francisco' },
  ],
});
```

**With Tools:**

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const result = await generateText({
  model: openai('gpt-4'),
  tools: {
    weather: tool({
      description: 'Get the weather for a location',
      inputSchema: z.object({
        location: z.string(),
      }),
      execute: async ({ location }) => {
        // API call here
        return { temperature: 72, condition: 'sunny' };
      },
    }),
  },
  prompt: 'What is the weather in Tokyo?',
});
```

**When to Use:**
- Need final response (not streaming)
- Want to wait for tool executions to complete
- Simpler code when streaming not needed
- Building batch/scheduled tasks

**Error Handling:**

```typescript
import { AI_APICallError, AI_NoContentGeneratedError } from 'ai';

try {
  const result = await generateText({
    model: openai('gpt-4-turbo'),
    prompt: 'Hello',
  });
  console.log(result.text);
} catch (error) {
  if (error instanceof AI_APICallError) {
    console.error('API call failed:', error.message);
    // Check rate limits, API key, network
  } else if (error instanceof AI_NoContentGeneratedError) {
    console.error('No content generated');
    // Prompt may have been filtered
  } else {
    console.error('Unknown error:', error);
  }
}
```

---

### streamText()

Stream text completion with real-time chunks.

**Signature:**

```typescript
function streamText(options: {
  model: LanguageModel;
  prompt?: string;
  messages?: Array<ModelMessage>;
  system?: string;
  tools?: Record<string, Tool>;
  maxOutputTokens?: number;
  temperature?: number;
  stopWhen?: StopCondition;
  // ... other options
}): StreamTextResult
```

**Basic Streaming:**

```typescript
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const stream = streamText({
  model: anthropic('claude-3-5-sonnet-20241022'),
  prompt: 'Write a poem about AI',
});

// Stream to console
for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}

// Or get final result
const finalResult = await stream.result;
console.log(finalResult.text);
```

**Streaming with Tools:**

```typescript
const stream = streamText({
  model: openai('gpt-4'),
  tools: {
    // ... tools definition
  },
  prompt: 'What is the weather?',
});

// Stream text chunks
for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

**Handling the Stream:**

```typescript
const stream = streamText({
  model: openai('gpt-4-turbo'),
  prompt: 'Explain AI',
});

// Option 1: Text stream
for await (const text of stream.textStream) {
  console.log(text);
}

// Option 2: Full stream (includes metadata)
for await (const part of stream.fullStream) {
  if (part.type === 'text-delta') {
    console.log(part.textDelta);
  } else if (part.type === 'tool-call') {
    console.log('Tool called:', part.toolName);
  }
}

// Option 3: Wait for final result
const result = await stream.result;
console.log(result.text, result.usage);
```

**When to Use:**
- Real-time user-facing responses
- Long-form content generation
- Want to show progress
- Better perceived performance

**Production Pattern:**

```typescript
// Next.js API Route
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = streamText({
    model: openai('gpt-4-turbo'),
    messages,
  });

  // Return stream to client
  return stream.toDataStreamResponse();
}
```

**Error Handling:**

```typescript
try {
  const stream = streamText({
    model: openai('gpt-4-turbo'),
    prompt: 'Hello',
  });

  for await (const chunk of stream.textStream) {
    process.stdout.write(chunk);
  }
} catch (error) {
  // Note: Stream errors may be swallowed by createDataStreamResponse
  // Always check server logs for stream errors
  console.error('Stream error:', error);
}
```

---

### generateObject()

Generate structured output validated by Zod schema.

**Signature:**

```typescript
async function generateObject<T>(options: {
  model: LanguageModel;
  schema: z.Schema<T>;
  prompt?: string;
  messages?: Array<ModelMessage>;
  system?: string;
  mode?: 'auto' | 'json' | 'tool';
  // ... other options
}): Promise<GenerateObjectResult<T>>
```

**Basic Usage:**

```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const result = await generateObject({
  model: openai('gpt-4'),
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.object({
        name: z.string(),
        amount: z.string(),
      })),
      instructions: z.array(z.string()),
    }),
  }),
  prompt: 'Generate a recipe for chocolate chip cookies',
});

console.log(result.object.recipe);
```

**Nested Schemas:**

```typescript
const PersonSchema = z.object({
  name: z.string(),
  age: z.number(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    country: z.string(),
  }),
  hobbies: z.array(z.string()),
});

const result = await generateObject({
  model: openai('gpt-4'),
  schema: PersonSchema,
  prompt: 'Generate a person profile',
});
```

**Arrays and Unions:**

```typescript
// Array of objects
const result = await generateObject({
  model: openai('gpt-4'),
  schema: z.object({
    people: z.array(z.object({
      name: z.string(),
      role: z.enum(['engineer', 'designer', 'manager']),
    })),
  }),
  prompt: 'Generate a team of 5 people',
});

// Union types
const result = await generateObject({
  model: openai('gpt-4'),
  schema: z.discriminatedUnion('type', [
    z.object({ type: z.literal('text'), content: z.string() }),
    z.object({ type: z.literal('image'), url: z.string() }),
  ]),
  prompt: 'Generate content',
});
```

**When to Use:**
- Need structured data (JSON, forms, etc.)
- Validation is critical
- Extracting data from unstructured input
- Building AI workflows that consume JSON

**Error Handling:**

```typescript
import { AI_NoObjectGeneratedError, AI_TypeValidationError } from 'ai';

try {
  const result = await generateObject({
    model: openai('gpt-4'),
    schema: z.object({ name: z.string() }),
    prompt: 'Generate a person',
  });
} catch (error) {
  if (error instanceof AI_NoObjectGeneratedError) {
    console.error('Model did not generate valid object');
    // Try simplifying schema or adding examples
  } else if (error instanceof AI_TypeValidationError) {
    console.error('Zod validation failed:', error.message);
    // Schema doesn't match output
  }
}
```

---

### streamObject()

Stream structured output with partial updates.

**Signature:**

```typescript
function streamObject<T>(options: {
  model: LanguageModel;
  schema: z.Schema<T>;
  prompt?: string;
  messages?: Array<ModelMessage>;
  mode?: 'auto' | 'json' | 'tool';
  // ... other options
}): StreamObjectResult<T>
```

**Basic Usage:**

```typescript
import { streamObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const stream = streamObject({
  model: google('gemini-2.5-pro'),
  schema: z.object({
    characters: z.array(z.object({
      name: z.string(),
      class: z.string(),
      stats: z.object({
        hp: z.number(),
        mana: z.number(),
      }),
    })),
  }),
  prompt: 'Generate 3 RPG characters',
});

// Stream partial updates
for await (const partialObject of stream.partialObjectStream) {
  console.log(partialObject);
  // { characters: [{ name: "Aria" }] }
  // { characters: [{ name: "Aria", class: "Mage" }] }
  // { characters: [{ name: "Aria", class: "Mage", stats: { hp: 100 } }] }
  // ...
}
```

**UI Integration Pattern:**

```typescript
// Server endpoint
export async function POST(request: Request) {
  const { prompt } = await request.json();

  const stream = streamObject({
    model: openai('gpt-4'),
    schema: z.object({
      summary: z.string(),
      keyPoints: z.array(z.string()),
    }),
    prompt,
  });

  return stream.toTextStreamResponse();
}

// Client (with useObject hook from ai-sdk-ui)
const { object, isLoading } = useObject({
  api: '/api/analyze',
  schema: /* same schema */,
});

// Render partial object as it streams
{object?.summary && <p>{object.summary}</p>}
{object?.keyPoints?.map(point => <li key={point}>{point}</li>)}
```

**When to Use:**
- Real-time structured data (forms, dashboards)
- Show progressive completion
- Large structured outputs
- Better UX for slow generations

---

## Provider Setup & Configuration

### OpenAI

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

// API key from environment (recommended)
// OPENAI_API_KEY=sk-...
const model = openai('gpt-4-turbo');

// Or explicit API key
const model = openai('gpt-4', {
  apiKey: process.env.OPENAI_API_KEY,
});

// Available models
const gpt4 = openai('gpt-4-turbo');
const gpt35 = openai('gpt-3.5-turbo');
const gpt5 = openai('gpt-5');  // If available

const result = await generateText({
  model: gpt4,
  prompt: 'Hello',
});
```

**Common Errors:**
- `AI_LoadAPIKeyError`: Check `OPENAI_API_KEY` environment variable
- `429 Rate Limit`: Implement exponential backoff, upgrade tier
- `401 Unauthorized`: Invalid API key format

**Rate Limiting:**
OpenAI enforces RPM (requests per minute) and TPM (tokens per minute) limits. Implement retry logic:

```typescript
const result = await generateText({
  model: openai('gpt-4'),
  prompt: 'Hello',
  maxRetries: 3,  // Built-in retry
});
```

---

### Anthropic

```typescript
import { anthropic } from '@ai-sdk/anthropic';

// ANTHROPIC_API_KEY=sk-ant-...
const claude = anthropic('claude-3-5-sonnet-20241022');

// Available models
const sonnet = anthropic('claude-3-5-sonnet-20241022');
const opus = anthropic('claude-3-opus-20240229');
const haiku = anthropic('claude-3-haiku-20240307');

const result = await generateText({
  model: sonnet,
  prompt: 'Explain quantum entanglement',
});
```

**Common Errors:**
- `AI_LoadAPIKeyError`: Check `ANTHROPIC_API_KEY` environment variable
- `overloaded_error`: Retry with exponential backoff
- `rate_limit_error`: Wait and retry

**Best Practices:**
- Claude excels at long-context tasks (200K+ tokens)
- Use Sonnet for balance of speed/quality
- Use Haiku for fast, simple tasks
- Use Opus for highest quality reasoning

---

### Google

```typescript
import { google } from '@ai-sdk/google';

// GOOGLE_GENERATIVE_AI_API_KEY=...
const gemini = google('gemini-2.5-pro');

// Available models
const pro = google('gemini-2.5-pro');
const flash = google('gemini-2.5-flash');
const lite = google('gemini-2.5-flash-lite');  // If available

const result = await generateText({
  model: pro,
  prompt: 'Analyze this data',
});
```

**Common Errors:**
- `AI_LoadAPIKeyError`: Check `GOOGLE_GENERATIVE_AI_API_KEY`
- `SAFETY`: Content filtered by safety settings
- `QUOTA_EXCEEDED`: Rate limit hit

**Best Practices:**
- Gemini Pro: Best for reasoning and analysis
- Gemini Flash: Fast, cost-effective for most tasks
- Free tier has generous limits
- Good for multimodal tasks (combine with image inputs)

---

### Cloudflare Workers AI

```typescript
import { Hono } from 'hono';
import { generateText } from 'ai';
import { createWorkersAI } from 'workers-ai-provider';

interface Env {
  AI: Ai;
}

const app = new Hono<{ Bindings: Env }>();

app.post('/chat', async (c) => {
  // Create provider inside handler (avoid startup overhead)
  const workersai = createWorkersAI({ binding: c.env.AI });

  const result = await generateText({
    model: workersai('@cf/meta/llama-3.1-8b-instruct'),
    prompt: 'What is Cloudflare?',
  });

  return c.json({ response: result.text });
});

export default app;
```

**wrangler.jsonc:**

```jsonc
{
  "name": "ai-sdk-worker",
  "compatibility_date": "2025-10-21",
  "ai": {
    "binding": "AI"
  }
}
```

**Important Notes:**

**Startup Optimization:**
AI SDK v5 + Zod can cause >270ms startup time in Workers. Solutions:

1. **Move imports inside handler:**
```typescript
// BAD (startup overhead)
import { createWorkersAI } from 'workers-ai-provider';
const workersai = createWorkersAI({ binding: env.AI });

// GOOD (lazy init)
app.post('/chat', async (c) => {
  const { createWorkersAI } = await import('workers-ai-provider');
  const workersai = createWorkersAI({ binding: c.env.AI });
  // ...
});
```

2. **Minimize top-level Zod schemas:**
```typescript
// Move complex schemas into route handlers
```

**When to Use workers-ai-provider:**
- Multi-provider scenarios (OpenAI + Workers AI)
- Using AI SDK UI hooks with Workers AI
- Need consistent API across providers

**When to Use Native Binding:**
For Cloudflare-only deployments without multi-provider support, use the `cloudflare-workers-ai` skill instead for maximum performance.

---

## Tool Calling & Agents

### Basic Tool Definition

```typescript
import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const result = await generateText({
  model: openai('gpt-4'),
  tools: {
    weather: tool({
      description: 'Get the weather for a location',
      inputSchema: z.object({
        location: z.string().describe('The city and country, e.g. "Paris, France"'),
        unit: z.enum(['celsius', 'fahrenheit']).optional(),
      }),
      execute: async ({ location, unit = 'celsius' }) => {
        // Simulate API call
        const data = await fetch(`https://api.weather.com/${location}`);
        return { temperature: 72, condition: 'sunny', unit };
      },
    }),
    convertTemperature: tool({
      description: 'Convert temperature between units',
      inputSchema: z.object({
        value: z.number(),
        from: z.enum(['celsius', 'fahrenheit']),
        to: z.enum(['celsius', 'fahrenheit']),
      }),
      execute: async ({ value, from, to }) => {
        if (from === to) return { value };
        if (from === 'celsius' && to === 'fahrenheit') {
          return { value: (value * 9/5) + 32 };
        }
        return { value: (value - 32) * 5/9 };
      },
    }),
  },
  prompt: 'What is the weather in Tokyo in Fahrenheit?',
});

console.log(result.text);
// Model will call weather tool, potentially convertTemperature, then answer
```

**v5 Tool Changes:**
- `parameters` → `inputSchema` (Zod schema)
- Tool properties: `args` → `input`, `result` → `output`
- `ToolExecutionError` removed (now `tool-error` content parts)

---

### Agent Class

The Agent class simplifies multi-step execution with tools.

```typescript
import { Agent, tool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const weatherAgent = new Agent({
  model: anthropic('claude-3-5-sonnet-20241022'),
  system: 'You are a weather assistant. Always convert temperatures to the user\'s preferred unit.',
  tools: {
    getWeather: tool({
      description: 'Get current weather for a location',
      inputSchema: z.object({
        location: z.string(),
      }),
      execute: async ({ location }) => {
        return { temp: 72, condition: 'sunny', unit: 'fahrenheit' };
      },
    }),
    convertTemp: tool({
      description: 'Convert temperature between units',
      inputSchema: z.object({
        fahrenheit: z.number(),
      }),
      execute: async ({ fahrenheit }) => {
        return { celsius: (fahrenheit - 32) * 5/9 };
      },
    }),
  },
});

const result = await weatherAgent.run({
  messages: [
    { role: 'user', content: 'What is the weather in SF in Celsius?' },
  ],
});

console.log(result.text);
// Agent will call getWeather, then convertTemp, then respond
```

**When to Use Agent vs Raw generateText:**
- **Use Agent when:** Multiple tools, complex workflows, multi-step reasoning
- **Use generateText when:** Simple single-step, one or two tools, full control needed

---

### Multi-Step Execution

Control when multi-step execution stops with `stopWhen` conditions.

```typescript
import { generateText, stopWhen, stepCountIs, hasToolCall } from 'ai';
import { openai } from '@ai-sdk/openai';

// Stop after specific number of steps
const result = await generateText({
  model: openai('gpt-4'),
  tools: { /* ... */ },
  prompt: 'Research TypeScript and create a summary',
  stopWhen: stepCountIs(5),  // Max 5 steps (tool calls + responses)
});

// Stop when specific tool is called
const result = await generateText({
  model: openai('gpt-4'),
  tools: {
    research: tool({ /* ... */ }),
    finalize: tool({ /* ... */ }),
  },
  prompt: 'Research and finalize a report',
  stopWhen: hasToolCall('finalize'),  // Stop when finalize is called
});

// Combine conditions
const result = await generateText({
  model: openai('gpt-4'),
  tools: { /* ... */ },
  prompt: 'Complex task',
  stopWhen: (step) => step.stepCount >= 10 || step.hasToolCall('finish'),
});
```

**v5 Change:**
`maxSteps` parameter removed. Use `stopWhen(stepCountIs(n))` instead.

---

### Dynamic Tools (v5 New Feature)

Add tools at runtime based on context:

```typescript
const result = await generateText({
  model: openai('gpt-4'),
  tools: (context) => {
    // Context includes messages, step count, etc.
    const baseTool = {
      search: tool({ /* ... */ }),
    };

    // Add tools based on context
    if (context.messages.some(m => m.content.includes('weather'))) {
      baseTool.weather = tool({ /* ... */ });
    }

    return baseTools;
  },
  prompt: 'Help me with my task',
});
```

---

## Critical v4→v5 Migration

AI SDK v5 introduced extensive breaking changes. If migrating from v4, follow this guide.

### Breaking Changes Overview

1. **Parameter Renames**
   - `maxTokens` → `maxOutputTokens`
   - `providerMetadata` → `providerOptions`

2. **Tool Definitions**
   - `parameters` → `inputSchema`
   - Tool properties: `args` → `input`, `result` → `output`

3. **Message Types**
   - `CoreMessage` → `ModelMessage`
   - `Message` → `UIMessage`
   - `convertToCoreMessages` → `convertToModelMessages`

4. **Tool Error Handling**
   - `ToolExecutionError` class removed
   - Now `tool-error` content parts
   - Enables automated retry

5. **Multi-Step Execution**
   - `maxSteps` → `stopWhen`
   - Use `stepCountIs()` or `hasToolCall()`

6. **Message Structure**
   - Simple `content` string → `parts` array
   - Parts: text, file, reasoning, tool-call, tool-result

7. **Streaming Architecture**
   - Single chunk → start/delta/end lifecycle
   - Unique IDs for concurrent streams

8. **Tool Streaming**
   - Enabled by default
   - `toolCallStreaming` option removed

9. **Package Reorganization**
   - `ai/rsc` → `@ai-sdk/rsc`
   - `ai/react` → `@ai-sdk/react`
   - `LangChainAdapter` → `@ai-sdk/langchain`

### Migration Examples

**Before (v4):**
```typescript
import { generateText } from 'ai';

const result = await generateText({
  model: openai.chat('gpt-4'),
  maxTokens: 500,
  providerMetadata: { openai: { user: 'user-123' } },
  tools: {
    weather: {
      description: 'Get weather',
      parameters: z.object({ location: z.string() }),
      execute: async (args) => { /* args.location */ },
    },
  },
  maxSteps: 5,
});
```

**After (v5):**
```typescript
import { generateText, tool, stopWhen, stepCountIs } from 'ai';

const result = await generateText({
  model: openai('gpt-4'),
  maxOutputTokens: 500,
  providerOptions: { openai: { user: 'user-123' } },
  tools: {
    weather: tool({
      description: 'Get weather',
      inputSchema: z.object({ location: z.string() }),
      execute: async ({ location }) => { /* input.location */ },
    }),
  },
  stopWhen: stepCountIs(5),
});
```

### Migration Checklist

- [ ] Update all `maxTokens` to `maxOutputTokens`
- [ ] Update `providerMetadata` to `providerOptions`
- [ ] Convert tool `parameters` to `inputSchema`
- [ ] Update tool execute functions: `args` → `input`
- [ ] Replace `maxSteps` with `stopWhen(stepCountIs(n))`
- [ ] Update message types: `CoreMessage` → `ModelMessage`
- [ ] Remove `ToolExecutionError` handling
- [ ] Update package imports (`ai/rsc` → `@ai-sdk/rsc`)
- [ ] Test streaming behavior (architecture changed)
- [ ] Update TypeScript types

### Automated Migration

AI SDK provides a migration tool:

```bash
npx ai migrate
```

This will update most breaking changes automatically. Review changes carefully.

**Official Migration Guide:**
https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0

---

## Top 12 Errors & Solutions

### 1. AI_APICallError

**Cause:** API request failed (network, auth, rate limit).

**Solution:**
```typescript
import { AI_APICallError } from 'ai';

try {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: 'Hello',
  });
} catch (error) {
  if (error instanceof AI_APICallError) {
    console.error('API call failed:', error.message);
    console.error('Status code:', error.statusCode);
    console.error('Response:', error.responseBody);

    // Check common causes
    if (error.statusCode === 401) {
      // Invalid API key
    } else if (error.statusCode === 429) {
      // Rate limit - implement backoff
    } else if (error.statusCode >= 500) {
      // Provider issue - retry
    }
  }
}
```

**Prevention:**
- Validate API keys at startup
- Implement retry logic with exponential backoff
- Monitor rate limits
- Handle network errors gracefully

---

### 2. AI_NoObjectGeneratedError

**Cause:** Model didn't generate valid object matching schema.

**Solution:**
```typescript
import { AI_NoObjectGeneratedError } from 'ai';

try {
  const result = await generateObject({
    model: openai('gpt-4'),
    schema: z.object({ /* complex schema */ }),
    prompt: 'Generate data',
  });
} catch (error) {
  if (error instanceof AI_NoObjectGeneratedError) {
    console.error('No valid object generated');

    // Solutions:
    // 1. Simplify schema
    // 2. Add more context to prompt
    // 3. Provide examples in prompt
    // 4. Try different model (gpt-4 better than gpt-3.5 for complex objects)
  }
}
```

**Prevention:**
- Start with simple schemas, add complexity incrementally
- Include examples in prompt: "Generate a person like: { name: 'Alice', age: 30 }"
- Use GPT-4 for complex structured output
- Test schemas with sample data first

---

### 3. Worker Startup Limit (270ms+)

**Cause:** AI SDK v5 + Zod initialization overhead in Cloudflare Workers exceeds startup limits.

**Solution:**
```typescript
// BAD: Top-level imports cause startup overhead
import { createWorkersAI } from 'workers-ai-provider';
import { complexSchema } from './schemas';

const workersai = createWorkersAI({ binding: env.AI });

// GOOD: Lazy initialization inside handler
export default {
  async fetch(request, env) {
    const { createWorkersAI } = await import('workers-ai-provider');
    const workersai = createWorkersAI({ binding: env.AI });

    // Use workersai here
  }
}
```

**Prevention:**
- Move AI SDK imports inside route handlers
- Minimize top-level Zod schemas
- Monitor Worker startup time (must be <400ms)
- Use Wrangler's startup time reporting

**GitHub Issue:** Search for "Workers startup limit" in Vercel AI SDK issues

---

### 4. streamText Fails Silently

**Cause:** Stream errors swallowed by `createDataStreamResponse`.

**Solution:**
```typescript
// Add explicit error handling
const stream = streamText({
  model: openai('gpt-4'),
  prompt: 'Hello',
});

try {
  for await (const chunk of stream.textStream) {
    process.stdout.write(chunk);
  }
} catch (error) {
  console.error('Stream error:', error);
  // Check server logs - errors may not reach client
}

// In production, always log on server side
```

**Prevention:**
- Always check server logs for stream errors
- Implement server-side error monitoring
- Test stream error handling explicitly
- Use try-catch around stream consumption

**GitHub Issue:** #4726

---

### 5. AI_LoadAPIKeyError

**Cause:** Missing or invalid API key.

**Solution:**
```typescript
import { AI_LoadAPIKeyError } from 'ai';

try {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: 'Hello',
  });
} catch (error) {
  if (error instanceof AI_LoadAPIKeyError) {
    console.error('API key error:', error.message);

    // Check:
    // 1. .env file exists and loaded
    // 2. Correct env variable name (OPENAI_API_KEY)
    // 3. Key format is valid (starts with sk-)
  }
}
```

**Prevention:**
- Validate API keys at application startup
- Use environment variable validation (e.g., zod)
- Provide clear error messages in development
- Document required environment variables

---

### 6. AI_InvalidArgumentError

**Cause:** Invalid parameters passed to function.

**Solution:**
```typescript
import { AI_InvalidArgumentError } from 'ai';

try {
  const result = await generateText({
    model: openai('gpt-4'),
    maxOutputTokens: -1,  // Invalid!
    prompt: 'Hello',
  });
} catch (error) {
  if (error instanceof AI_InvalidArgumentError) {
    console.error('Invalid argument:', error.message);
    // Check parameter types and values
  }
}
```

**Prevention:**
- Use TypeScript for type checking
- Validate inputs before calling AI SDK functions
- Read function signatures carefully
- Check official docs for parameter constraints

---

### 7. AI_NoContentGeneratedError

**Cause:** Model generated no content (safety filters, etc.).

**Solution:**
```typescript
import { AI_NoContentGeneratedError } from 'ai';

try {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: 'Some prompt',
  });
} catch (error) {
  if (error instanceof AI_NoContentGeneratedError) {
    console.error('No content generated');

    // Possible causes:
    // 1. Safety filters blocked output
    // 2. Prompt triggered content policy
    // 3. Model configuration issue

    // Handle gracefully:
    return { text: 'Unable to generate response. Please try different input.' };
  }
}
```

**Prevention:**
- Sanitize user inputs
- Avoid prompts that may trigger safety filters
- Have fallback messaging
- Log occurrences for analysis

---

### 8. AI_TypeValidationError

**Cause:** Zod schema validation failed on generated output.

**Solution:**
```typescript
import { AI_TypeValidationError } from 'ai';

try {
  const result = await generateObject({
    model: openai('gpt-4'),
    schema: z.object({
      age: z.number().min(0).max(120),  // Strict validation
    }),
    prompt: 'Generate person',
  });
} catch (error) {
  if (error instanceof AI_TypeValidationError) {
    console.error('Validation failed:', error.message);

    // Solutions:
    // 1. Relax schema constraints
    // 2. Add more guidance in prompt
    // 3. Use .optional() for unreliable fields
  }
}
```

**Prevention:**
- Start with lenient schemas, tighten gradually
- Use `.optional()` for fields that may not always be present
- Add validation hints in field descriptions
- Test with various prompts

---

### 9. AI_RetryError

**Cause:** All retry attempts failed.

**Solution:**
```typescript
import { AI_RetryError } from 'ai';

try {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: 'Hello',
    maxRetries: 3,  // Default is 2
  });
} catch (error) {
  if (error instanceof AI_RetryError) {
    console.error('All retries failed');
    console.error('Last error:', error.lastError);

    // Check root cause:
    // - Persistent network issue
    // - Provider outage
    // - Invalid configuration
  }
}
```

**Prevention:**
- Investigate root cause of failures
- Adjust retry configuration if needed
- Implement circuit breaker pattern for provider outages
- Have fallback providers

---

### 10. Rate Limiting Errors

**Cause:** Exceeded provider rate limits (RPM/TPM).

**Solution:**
```typescript
// Implement exponential backoff
async function generateWithBackoff(prompt: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await generateText({
        model: openai('gpt-4'),
        prompt,
      });
    } catch (error) {
      if (error instanceof AI_APICallError && error.statusCode === 429) {
        const delay = Math.pow(2, i) * 1000;  // Exponential backoff
        console.log(`Rate limited, waiting ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Rate limit retries exhausted');
}
```

**Prevention:**
- Monitor rate limit headers
- Queue requests to stay under limits
- Upgrade provider tier if needed
- Implement request throttling

---

### 11. TypeScript Performance with Zod

**Cause:** Complex Zod schemas slow down TypeScript type checking.

**Solution:**
```typescript
// Instead of deeply nested schemas at top level:
// const complexSchema = z.object({ /* 100+ fields */ });

// Define inside functions or use type assertions:
function generateData() {
  const schema = z.object({ /* complex schema */ });
  return generateObject({ model: openai('gpt-4'), schema, prompt: '...' });
}

// Or use z.lazy() for recursive schemas:
type Category = { name: string; subcategories?: Category[] };
const CategorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    name: z.string(),
    subcategories: z.array(CategorySchema).optional(),
  })
);
```

**Prevention:**
- Avoid top-level complex schemas
- Use `z.lazy()` for recursive types
- Split large schemas into smaller ones
- Use type assertions where appropriate

**Official Docs:**
https://ai-sdk.dev/docs/troubleshooting/common-issues/slow-type-checking

---

### 12. Invalid JSON Response (Provider-Specific)

**Cause:** Some models occasionally return invalid JSON.

**Solution:**
```typescript
// Use built-in retry and mode selection
const result = await generateObject({
  model: openai('gpt-4'),
  schema: mySchema,
  prompt: 'Generate data',
  mode: 'json',  // Force JSON mode (supported by GPT-4)
  maxRetries: 3,  // Retry on invalid JSON
});

// Or catch and retry manually:
try {
  const result = await generateObject({
    model: openai('gpt-4'),
    schema: mySchema,
    prompt: 'Generate data',
  });
} catch (error) {
  // Retry with different model
  const result = await generateObject({
    model: openai('gpt-4-turbo'),
    schema: mySchema,
    prompt: 'Generate data',
  });
}
```

**Prevention:**
- Use `mode: 'json'` when available
- Prefer GPT-4 for structured output
- Implement retry logic
- Validate responses

**GitHub Issue:** #4302 (Imagen 3.0 Invalid JSON)

---

**For More Errors:**
See complete error reference at https://ai-sdk.dev/docs/reference/ai-sdk-errors

---

## Production Best Practices

### Performance

**1. Always use streaming for long-form content:**
```typescript
// User-facing: Use streamText
const stream = streamText({ model: openai('gpt-4'), prompt: 'Long essay' });
return stream.toDataStreamResponse();

// Background tasks: Use generateText
const result = await generateText({ model: openai('gpt-4'), prompt: 'Analyze data' });
```

**2. Set appropriate maxOutputTokens:**
```typescript
const result = await generateText({
  model: openai('gpt-4'),
  prompt: 'Short answer',
  maxOutputTokens: 100,  // Limit tokens to save cost
});
```

**3. Cache provider instances:**
```typescript
// Good: Reuse provider instances
const gpt4 = openai('gpt-4-turbo');
const result1 = await generateText({ model: gpt4, prompt: 'Hello' });
const result2 = await generateText({ model: gpt4, prompt: 'World' });
```

**4. Optimize Zod schemas:**
```typescript
// Avoid complex nested schemas at top level in Workers
// Move into route handlers to prevent startup overhead
```

### Error Handling

**1. Wrap all AI calls in try-catch:**
```typescript
try {
  const result = await generateText({ /* ... */ });
} catch (error) {
  // Handle specific errors
  if (error instanceof AI_APICallError) { /* ... */ }
  else if (error instanceof AI_NoContentGeneratedError) { /* ... */ }
  else { /* ... */ }
}
```

**2. Implement retry logic:**
```typescript
const result = await generateText({
  model: openai('gpt-4'),
  prompt: 'Hello',
  maxRetries: 3,
});
```

**3. Log errors properly:**
```typescript
console.error('AI SDK Error:', {
  type: error.constructor.name,
  message: error.message,
  statusCode: error.statusCode,
  timestamp: new Date().toISOString(),
});
```

### Cost Optimization

**1. Choose appropriate models:**
```typescript
// Simple tasks: Use cheaper models
const simple = await generateText({ model: openai('gpt-3.5-turbo'), prompt: 'Hello' });

// Complex reasoning: Use GPT-4
const complex = await generateText({ model: openai('gpt-4'), prompt: 'Analyze...' });
```

**2. Set maxOutputTokens appropriately:**
```typescript
const result = await generateText({
  model: openai('gpt-4'),
  prompt: 'Summarize in 2 sentences',
  maxOutputTokens: 100,  // Prevent over-generation
});
```

**3. Cache results when possible:**
```typescript
const cache = new Map();

async function getCachedResponse(prompt: string) {
  if (cache.has(prompt)) return cache.get(prompt);

  const result = await generateText({ model: openai('gpt-4'), prompt });
  cache.set(prompt, result.text);
  return result.text;
}
```

### Cloudflare Workers Specific

**1. Move imports inside handlers:**
```typescript
// Avoid startup overhead
export default {
  async fetch(request, env) {
    const { generateText } = await import('ai');
    const { openai } = await import('@ai-sdk/openai');
    // Use here
  }
}
```

**2. Monitor startup time:**
```bash
# Wrangler reports startup time
wrangler deploy
# Check output for startup duration (must be <400ms)
```

**3. Handle streaming properly:**
```typescript
// Return ReadableStream for streaming responses
const stream = streamText({ model: openai('gpt-4'), prompt: 'Hello' });
return new Response(stream.toTextStream(), {
  headers: { 'Content-Type': 'text/plain; charset=utf-8' },
});
```

### Next.js / Vercel Specific

**1. Use Server Actions for mutations:**
```typescript
'use server';

export async function generateContent(input: string) {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: input,
  });
  return result.text;
}
```

**2. Use Server Components for initial loads:**
```typescript
// app/page.tsx
export default async function Page() {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: 'Welcome message',
  });

  return <div>{result.text}</div>;
}
```

**3. Implement loading states:**
```typescript
'use client';

import { useState } from 'react';
import { generateContent } from './actions';

export default function Form() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await generateContent(formData.get('input'));
    setLoading(false);
  }

  return (
    <form action={handleSubmit}>
      <input name="input" />
      <button disabled={loading}>
        {loading ? 'Generating...' : 'Submit'}
      </button>
    </form>
  );
}
```

**4. For deployment:**
See Vercel's official deployment documentation: https://vercel.com/docs/functions

---

## When to Use This Skill

### Use ai-sdk-core when:

- Building backend AI features (server-side text generation)
- Implementing server-side text generation (Node.js, Workers, Next.js)
- Creating structured AI outputs (JSON, forms, data extraction)
- Building AI agents with tools (multi-step workflows)
- Integrating multiple AI providers (OpenAI, Anthropic, Google, Cloudflare)
- Migrating from AI SDK v4 to v5
- Encountering AI SDK errors (AI_APICallError, AI_NoObjectGeneratedError, etc.)
- Using AI in Cloudflare Workers (with workers-ai-provider)
- Using AI in Next.js Server Components/Actions
- Need consistent API across different LLM providers

### Don't use this skill when:

- Building React chat UIs (use **ai-sdk-ui** skill instead)
- Need frontend hooks like useChat (use **ai-sdk-ui** skill instead)
- Need advanced topics like embeddings or image generation (check official docs)
- Building native Cloudflare Workers AI apps without multi-provider (use **cloudflare-workers-ai** skill instead)
- Need Generative UI / RSC (see https://ai-sdk.dev/docs/ai-sdk-rsc)

---

## Dependencies & Versions

```json
{
  "dependencies": {
    "ai": "^5.0.76",
    "@ai-sdk/openai": "^2.0.53",
    "@ai-sdk/anthropic": "^2.0.0",
    "@ai-sdk/google": "^2.0.0",
    "workers-ai-provider": "^2.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3"
  }
}
```

**Version Notes:**
- AI SDK v5.0.76+ (stable, focus on v5)
- v6 is in beta (6.0.0-beta.66) - not covered in this skill
- Zod 3.23.8+ required for schemas
- Provider packages at 2.0+ for v5 compatibility

**Check Latest Versions:**
```bash
npm view ai version
npm view @ai-sdk/openai version
npm view @ai-sdk/anthropic version
npm view @ai-sdk/google version
npm view workers-ai-provider version
```

---

## Links to Official Documentation

### Core Documentation

- **AI SDK Introduction:** https://ai-sdk.dev/docs/introduction
- **AI SDK Core Overview:** https://ai-sdk.dev/docs/ai-sdk-core/overview
- **Generating Text:** https://ai-sdk.dev/docs/ai-sdk-core/generating-text
- **Generating Structured Data:** https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
- **Tools and Tool Calling:** https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
- **Agents Overview:** https://ai-sdk.dev/docs/agents/overview
- **Foundations:** https://ai-sdk.dev/docs/foundations/overview

### Advanced Topics (Not Replicated in This Skill)

- **Embeddings:** https://ai-sdk.dev/docs/ai-sdk-core/embeddings
- **Image Generation:** https://ai-sdk.dev/docs/ai-sdk-core/generating-images
- **Transcription:** https://ai-sdk.dev/docs/ai-sdk-core/generating-transcriptions
- **Speech:** https://ai-sdk.dev/docs/ai-sdk-core/generating-speech
- **MCP Tools:** https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools
- **Telemetry:** https://ai-sdk.dev/docs/ai-sdk-core/telemetry
- **Generative UI:** https://ai-sdk.dev/docs/ai-sdk-rsc

### Migration & Troubleshooting

- **v4→v5 Migration Guide:** https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0
- **All Error Types (28 total):** https://ai-sdk.dev/docs/reference/ai-sdk-errors
- **Troubleshooting Guide:** https://ai-sdk.dev/docs/troubleshooting

### Provider Documentation

- **OpenAI Provider:** https://ai-sdk.dev/providers/ai-sdk-providers/openai
- **Anthropic Provider:** https://ai-sdk.dev/providers/ai-sdk-providers/anthropic
- **Google Provider:** https://ai-sdk.dev/providers/ai-sdk-providers/google
- **All Providers (25+):** https://ai-sdk.dev/providers/overview
- **Community Providers:** https://ai-sdk.dev/providers/community-providers

### Cloudflare Integration

- **Workers AI Provider (Community):** https://ai-sdk.dev/providers/community-providers/cloudflare-workers-ai
- **Cloudflare Workers AI Docs:** https://developers.cloudflare.com/workers-ai/
- **workers-ai-provider GitHub:** https://github.com/cloudflare/ai/tree/main/packages/workers-ai-provider
- **Cloudflare AI SDK Configuration:** https://developers.cloudflare.com/workers-ai/configuration/ai-sdk/

### Vercel / Next.js Integration

- **Vercel AI SDK 5.0 Blog:** https://vercel.com/blog/ai-sdk-5
- **Next.js App Router Integration:** https://ai-sdk.dev/docs/getting-started/nextjs-app-router
- **Next.js Pages Router Integration:** https://ai-sdk.dev/docs/getting-started/nextjs-pages-router
- **Vercel Functions:** https://vercel.com/docs/functions
- **Vercel Streaming:** https://vercel.com/docs/functions/streaming

### GitHub & Community

- **GitHub Repository:** https://github.com/vercel/ai
- **GitHub Issues:** https://github.com/vercel/ai/issues
- **Discord Community:** https://discord.gg/vercel

---

## Templates & References

This skill includes:

- **13 Templates:** Ready-to-use code examples in `templates/`
- **5 Reference Docs:** Detailed guides in `references/`
- **1 Script:** Version checker in `scripts/`

All files are optimized for copy-paste into your project.

---

**Last Updated:** 2025-10-21
**Skill Version:** 1.0.0
**AI SDK Version:** 5.0.76+
