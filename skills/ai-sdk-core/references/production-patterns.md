# AI SDK Core - Production Patterns

Best practices for deploying AI SDK Core in production environments.

---

## Performance Optimization

### 1. Streaming for Long-Form Content

**Always use streaming for user-facing long-form content:**

```typescript
// ✅ GOOD: User-facing (better perceived performance)
app.post('/chat', async (req, res) => {
  const stream = streamText({
    model: openai('gpt-4'),
    prompt: req.body.message,
  });

  return stream.toDataStreamResponse();
});

// ❌ BAD: User waits for entire response
app.post('/chat', async (req, res) => {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: req.body.message,
  });

  return res.json({ response: result.text });
});

// ✅ GOOD: Background tasks (no user waiting)
async function processDocument(doc: string) {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: `Analyze: ${doc}`,
  });

  await saveToDatabase(result.text);
}
```

### 2. Set Appropriate maxOutputTokens

```typescript
// ✅ GOOD: Limit token usage based on use case
const shortSummary = await generateText({
  model: openai('gpt-4'),
  prompt: 'Summarize in 2 sentences',
  maxOutputTokens: 100,  // Prevents over-generation
});

const article = await generateText({
  model: openai('gpt-4'),
  prompt: 'Write article',
  maxOutputTokens: 2000,  // Appropriate for long-form
});

// ❌ BAD: No limit (can waste tokens/money)
const unlimited = await generateText({
  model: openai('gpt-4'),
  prompt: 'Write something',
  // No maxOutputTokens
});
```

### 3. Cache Provider Instances

```typescript
// ✅ GOOD: Reuse provider instances
const gpt4 = openai('gpt-4-turbo');
const claude = anthropic('claude-3-5-sonnet-20241022');

app.post('/chat', async (req, res) => {
  const result = await generateText({
    model: gpt4,  // Reuse
    prompt: req.body.message,
  });
  return res.json({ response: result.text });
});

// ❌ BAD: Create new instance every time
app.post('/chat', async (req, res) => {
  const result = await generateText({
    model: openai('gpt-4-turbo'),  // New instance each call
    prompt: req.body.message,
  });
});
```

### 4. Optimize Zod Schemas (Especially in Workers)

```typescript
// ❌ BAD: Complex schema at top level (slow startup)
const ComplexSchema = z.object({
  // 50+ fields with deep nesting
});

// ✅ GOOD: Define schemas inside functions
function generateStructuredData() {
  const schema = z.object({
    // Schema definition here
  });

  return generateObject({ model: openai('gpt-4'), schema, prompt: '...' });
}

// ✅ GOOD: Split into smaller reusable schemas
const AddressSchema = z.object({ street: z.string(), city: z.string() });
const PersonSchema = z.object({ name: z.string(), address: AddressSchema });
```

---

## Error Handling

### 1. Wrap All AI Calls in Try-Catch

```typescript
async function generateSafely(prompt: string) {
  try {
    const result = await generateText({
      model: openai('gpt-4'),
      prompt,
    });

    return { success: true, data: result.text };
  } catch (error) {
    if (error instanceof AI_APICallError) {
      console.error('API call failed:', error.statusCode, error.message);
      return { success: false, error: 'AI service temporarily unavailable' };
    } else if (error instanceof AI_NoContentGeneratedError) {
      console.error('No content generated');
      return { success: false, error: 'Unable to generate response' };
    } else {
      console.error('Unknown error:', error);
      return { success: false, error: 'An error occurred' };
    }
  }
}
```

### 2. Handle Specific Error Types

```typescript
import {
  AI_APICallError,
  AI_NoObjectGeneratedError,
  AI_TypeValidationError,
  AI_RetryError,
} from 'ai';

async function robustGeneration(prompt: string) {
  try {
    return await generateText({ model: openai('gpt-4'), prompt });
  } catch (error) {
    switch (error.constructor) {
      case AI_APICallError:
        if (error.statusCode === 429) {
          // Rate limit - wait and retry
          await wait(5000);
          return retry();
        } else if (error.statusCode >= 500) {
          // Provider issue - try fallback
          return generateText({ model: anthropic('claude-3-5-sonnet-20241022'), prompt });
        }
        break;

      case AI_RetryError:
        // All retries failed - use fallback provider
        return generateText({ model: google('gemini-2.5-pro'), prompt });

      case AI_NoContentGeneratedError:
        // Content filtered - return safe message
        return { text: 'Unable to generate response for this input.' };

      default:
        throw error;
    }
  }
}
```

### 3. Implement Retry Logic

```typescript
async function generateWithRetry(prompt: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateText({
        model: openai('gpt-4'),
        prompt,
        maxRetries: 2,  // Built-in retry
      });
    } catch (error) {
      if (i === maxRetries - 1) throw error; // Last attempt failed

      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### 4. Log Errors Properly

```typescript
function logAIError(error: any, context: Record<string, any>) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    type: error.constructor.name,
    message: error.message,
    statusCode: error.statusCode,
    responseBody: error.responseBody,
    context,
    stack: error.stack,
  };

  // Send to monitoring service (e.g., Sentry, Datadog)
  console.error('AI SDK Error:', JSON.stringify(errorLog));

  // Track metrics
  metrics.increment('ai.error', {
    type: error.constructor.name,
    statusCode: error.statusCode,
  });
}

try {
  const result = await generateText({ model: openai('gpt-4'), prompt });
} catch (error) {
  logAIError(error, { prompt, model: 'gpt-4' });
  throw error;
}
```

---

## Cost Optimization

### 1. Choose Appropriate Models

```typescript
// Model selection based on task complexity
async function generateWithCostOptimization(prompt: string, complexity: 'simple' | 'medium' | 'complex') {
  const models = {
    simple: openai('gpt-3.5-turbo'),     // $0.50 / 1M tokens
    medium: openai('gpt-4-turbo'),       // $10 / 1M tokens
    complex: openai('gpt-4'),            // $30 / 1M tokens
  };

  return generateText({
    model: models[complexity],
    prompt,
  });
}

// Usage
await generateWithCostOptimization('Translate to Spanish', 'simple');
await generateWithCostOptimization('Analyze sentiment', 'medium');
await generateWithCostOptimization('Complex reasoning task', 'complex');
```

### 2. Set Token Limits

```typescript
// Prevent runaway costs
const result = await generateText({
  model: openai('gpt-4'),
  prompt: 'Write essay',
  maxOutputTokens: 500,  // Hard limit
});

// Adjust limits per use case
const limits = {
  chatMessage: 200,
  summary: 300,
  article: 2000,
  analysis: 1000,
};
```

### 3. Cache Results

```typescript
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, string>({
  max: 1000,  // Max 1000 items
  ttl: 1000 * 60 * 60,  // 1 hour TTL
});

async function generateWithCache(prompt: string) {
  const cacheKey = `ai:${hash(prompt)}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('Cache hit');
    return { text: cached, cached: true };
  }

  // Generate
  const result = await generateText({
    model: openai('gpt-4'),
    prompt,
  });

  // Store in cache
  cache.set(cacheKey, result.text);

  return { text: result.text, cached: false };
}
```

### 4. Monitor Usage

```typescript
// Track token usage
let totalTokensUsed = 0;
let totalCost = 0;

async function generateWithTracking(prompt: string) {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt,
  });

  // Track tokens
  totalTokensUsed += result.usage.totalTokens;

  // Estimate cost (GPT-4: $30/1M tokens)
  const cost = (result.usage.totalTokens / 1_000_000) * 30;
  totalCost += cost;

  console.log(`Tokens: ${result.usage.totalTokens}, Cost: $${cost.toFixed(4)}`);
  console.log(`Total tokens: ${totalTokensUsed}, Total cost: $${totalCost.toFixed(2)}`);

  return result;
}
```

---

## Cloudflare Workers Best Practices

### 1. Lazy Initialization

```typescript
// ✅ GOOD: Import inside handler
export default {
  async fetch(request, env) {
    const { generateText } = await import('ai');
    const { createWorkersAI } = await import('workers-ai-provider');

    const workersai = createWorkersAI({ binding: env.AI });

    const result = await generateText({
      model: workersai('@cf/meta/llama-3.1-8b-instruct'),
      prompt: 'Hello',
    });

    return new Response(result.text);
  }
};

// ❌ BAD: Top-level imports (startup overhead)
import { generateText } from 'ai';
const workersai = createWorkersAI({ binding: env.AI }); // Runs at startup!
```

### 2. Monitor Startup Time

```bash
# Wrangler reports startup time
npx wrangler deploy

# Output shows:
# Startup Time: 287ms (must be <400ms)
```

### 3. Handle Streaming Properly

```typescript
app.post('/chat/stream', async (c) => {
  const workersai = createWorkersAI({ binding: c.env.AI });

  const stream = streamText({
    model: workersai('@cf/meta/llama-3.1-8b-instruct'),
    prompt: 'Hello',
  });

  // Return ReadableStream for Workers
  return new Response(stream.toTextStream(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});
```

---

## Next.js / Vercel Best Practices

### 1. Server Actions for Mutations

```typescript
// app/actions.ts
'use server';

export async function generateContent(input: string) {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: input,
    maxOutputTokens: 500,
  });

  return result.text;
}

// app/page.tsx (Client Component)
'use client';

import { generateContent } from './actions';

export default function Page() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await generateContent(formData.get('input') as string);
    setLoading(false);
  }

  return <form action={handleSubmit}>...</form>;
}
```

### 2. Server Components for Initial Loads

```typescript
// app/page.tsx (Server Component)
export default async function Page() {
  // Generate on server
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: 'Welcome message',
  });

  // No loading state needed
  return <div>{result.text}</div>;
}
```

### 3. API Routes for Streaming

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = streamText({
    model: openai('gpt-4-turbo'),
    messages,
  });

  return stream.toDataStreamResponse();
}
```

---

## Monitoring and Logging

### 1. Track Key Metrics

```typescript
// Token usage
metrics.gauge('ai.tokens.total', result.usage.totalTokens);
metrics.gauge('ai.tokens.prompt', result.usage.promptTokens);
metrics.gauge('ai.tokens.completion', result.usage.completionTokens);

// Response time
const startTime = Date.now();
const result = await generateText({ model: openai('gpt-4'), prompt });
metrics.timing('ai.response_time', Date.now() - startTime);

// Error rate
metrics.increment('ai.errors', { type: error.constructor.name });
```

### 2. Structured Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

logger.info('AI generation started', {
  model: 'gpt-4',
  promptLength: prompt.length,
  userId: user.id,
});

const result = await generateText({ model: openai('gpt-4'), prompt });

logger.info('AI generation completed', {
  model: 'gpt-4',
  tokensUsed: result.usage.totalTokens,
  responseLength: result.text.length,
  duration: Date.now() - startTime,
});
```

---

## Rate Limiting

### 1. Queue Requests

```typescript
import PQueue from 'p-queue';

// Limit: 50 requests per minute
const queue = new PQueue({
  concurrency: 5,
  interval: 60000,
  intervalCap: 50,
});

async function generateQueued(prompt: string) {
  return queue.add(() =>
    generateText({ model: openai('gpt-4'), prompt })
  );
}
```

### 2. Monitor Rate Limits

```typescript
async function generateWithRateCheck(prompt: string) {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt,
  });

  // Check rate limit headers (provider-specific)
  console.log('Remaining requests:', response.headers['x-ratelimit-remaining']);
  console.log('Resets at:', response.headers['x-ratelimit-reset']);

  return result;
}
```

---

## Security

### 1. Sanitize User Inputs

```typescript
function sanitizePrompt(userInput: string): string {
  // Remove potential prompt injections
  return userInput
    .replace(/system:/gi, '')
    .replace(/ignore previous/gi, '')
    .slice(0, 1000);  // Limit length
}

const result = await generateText({
  model: openai('gpt-4'),
  prompt: sanitizePrompt(req.body.message),
});
```

### 2. Validate API Keys

```typescript
// Startup validation
function validateEnv() {
  const required = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY'];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing: ${key}`);
    }

    if (!process.env[key].match(/^sk-/)) {
      throw new Error(`Invalid format: ${key}`);
    }
  }
}

validateEnv();
```

---

## Deployment

See Vercel's official deployment documentation:
https://vercel.com/docs/functions

For Cloudflare Workers:
https://developers.cloudflare.com/workers/

---

**Last Updated:** 2025-10-21
