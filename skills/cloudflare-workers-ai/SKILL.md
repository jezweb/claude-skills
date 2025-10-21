---
name: Cloudflare Workers AI
description: |
  Complete knowledge domain for Cloudflare Workers AI - Run AI models on serverless GPUs across Cloudflare's global network.

  Use when: implementing AI inference on Workers, running LLM models, generating text/images with AI,
  configuring Workers AI bindings, implementing AI streaming, using AI Gateway, integrating with
  embeddings/RAG systems, or encountering "AI_ERROR", rate limit errors, model not found, token
  limit exceeded, or neurons exceeded errors.

  Keywords: workers ai, cloudflare ai, ai bindings, llm workers, @cf/meta/llama, workers ai models,
  ai inference, cloudflare llm, ai streaming, text generation ai, ai embeddings, image generation ai,
  workers ai rag, ai gateway, llama workers, flux image generation, stable diffusion workers,
  vision models ai, ai chat completion, AI_ERROR, rate limit ai, model not found, token limit exceeded,
  neurons exceeded, ai quota exceeded, streaming failed, model unavailable, workers ai hono,
  ai gateway workers, vercel ai sdk workers, openai compatible workers, workers ai vectorize
---

# Cloudflare Workers AI - Complete Reference

Production-ready knowledge domain for building AI-powered applications with Cloudflare Workers AI.

**Status**: Production Ready ✅
**Last Updated**: 2025-10-21
**Dependencies**: cloudflare-worker-base (for Worker setup)
**Latest Versions**: wrangler@4.43.0, @cloudflare/workers-types@4.20251014.0

---

## Table of Contents

1. [Quick Start (5 minutes)](#quick-start-5-minutes)
2. [Workers AI API Reference](#workers-ai-api-reference)
3. [Model Selection Guide](#model-selection-guide)
4. [Common Patterns](#common-patterns)
5. [AI Gateway Integration](#ai-gateway-integration)
6. [Rate Limits & Pricing](#rate-limits--pricing)
7. [Production Checklist](#production-checklist)

---

## Quick Start (5 minutes)

### 1. Add AI Binding

**wrangler.jsonc:**
```jsonc
{
  "ai": {
    "binding": "AI"
  }
}
```

### 2. Run Your First Model

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt: 'What is Cloudflare?',
    });

    return Response.json(response);
  },
};
```

### 3. Add Streaming (Recommended)

```typescript
const stream = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true, // Always use streaming for text generation!
});

return new Response(stream, {
  headers: { 'content-type': 'text/event-stream' },
});
```

**Why streaming?**
- Prevents buffering large responses in memory
- Faster time-to-first-token
- Better user experience for long-form content
- Avoids Worker timeout issues

---

## Workers AI API Reference

### `env.AI.run()`

Run an AI model inference.

**Signature:**
```typescript
async env.AI.run(
  model: string,
  inputs: ModelInputs,
  options?: { gateway?: { id: string; skipCache?: boolean } }
): Promise<ModelOutput | ReadableStream>
```

**Parameters:**

- `model` (string, required) - Model ID (e.g., `@cf/meta/llama-3.1-8b-instruct`)
- `inputs` (object, required) - Model-specific inputs
- `options` (object, optional) - Additional options
  - `gateway` (object) - AI Gateway configuration
    - `id` (string) - Gateway ID
    - `skipCache` (boolean) - Skip AI Gateway cache

**Returns:**

- Non-streaming: `Promise<ModelOutput>` - JSON response
- Streaming: `ReadableStream` - Server-sent events stream

---

### Text Generation Models

**Input Format:**
```typescript
{
  messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  prompt?: string; // Deprecated, use messages
  stream?: boolean; // Default: false
  max_tokens?: number; // Max tokens to generate
  temperature?: number; // 0.0-1.0, default varies by model
  top_p?: number; // 0.0-1.0
  top_k?: number;
}
```

**Output Format (Non-Streaming):**
```typescript
{
  response: string; // Generated text
}
```

**Example:**
```typescript
const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is TypeScript?' },
  ],
  stream: false,
});

console.log(response.response);
```

---

### Text Embeddings Models

**Input Format:**
```typescript
{
  text: string | string[]; // Single text or array of texts
}
```

**Output Format:**
```typescript
{
  shape: number[]; // [batch_size, embedding_dimensions]
  data: number[][]; // Array of embedding vectors
}
```

**Example:**
```typescript
const embeddings = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: ['Hello world', 'Cloudflare Workers'],
});

console.log(embeddings.shape); // [2, 768]
console.log(embeddings.data[0]); // [0.123, -0.456, ...]
```

---

### Image Generation Models

**Input Format:**
```typescript
{
  prompt: string; // Text description
  num_steps?: number; // Default: 20
  guidance?: number; // CFG scale, default: 7.5
  strength?: number; // For img2img, default: 1.0
  image?: number[][]; // For img2img (base64 or array)
}
```

**Output Format:**
- Binary image data (PNG/JPEG)

**Example:**
```typescript
const imageStream = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
  prompt: 'A beautiful sunset over mountains',
});

return new Response(imageStream, {
  headers: { 'content-type': 'image/png' },
});
```

---

### Vision Models

**Input Format:**
```typescript
{
  messages: Array<{
    role: 'user' | 'assistant';
    content: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
  }>;
}
```

**Example:**
```typescript
const response = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is in this image?' },
        { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBOR...' } },
      ],
    },
  ],
});
```

---

## Model Selection Guide

### Text Generation (LLMs)

| Model | Best For | Rate Limit | Size |
|-------|----------|------------|------|
| `@cf/meta/llama-3.1-8b-instruct` | General purpose, fast | 300/min | 8B |
| `@cf/meta/llama-3.2-1b-instruct` | Ultra-fast, simple tasks | 300/min | 1B |
| `@cf/qwen/qwen1.5-14b-chat-awq` | High quality, complex reasoning | 150/min | 14B |
| `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` | Coding, technical content | 300/min | 32B |
| `@hf/thebloke/mistral-7b-instruct-v0.1-awq` | Fast, efficient | 400/min | 7B |

### Text Embeddings

| Model | Dimensions | Best For | Rate Limit |
|-------|-----------|----------|------------|
| `@cf/baai/bge-base-en-v1.5` | 768 | General purpose RAG | 3000/min |
| `@cf/baai/bge-large-en-v1.5` | 1024 | High accuracy search | 1500/min |
| `@cf/baai/bge-small-en-v1.5` | 384 | Fast, low storage | 3000/min |

### Image Generation

| Model | Best For | Rate Limit | Speed |
|-------|----------|------------|-------|
| `@cf/black-forest-labs/flux-1-schnell` | High quality, photorealistic | 720/min | Fast |
| `@cf/stabilityai/stable-diffusion-xl-base-1.0` | General purpose | 720/min | Medium |
| `@cf/lykon/dreamshaper-8-lcm` | Artistic, stylized | 720/min | Fast |

### Vision Models

| Model | Best For | Rate Limit |
|-------|----------|------------|
| `@cf/meta/llama-3.2-11b-vision-instruct` | Image understanding | 720/min |
| `@cf/unum/uform-gen2-qwen-500m` | Fast image captioning | 720/min |

---

## Common Patterns

### Pattern 1: Chat Completion with History

```typescript
app.post('/chat', async (c) => {
  const { messages } = await c.req.json<{
    messages: Array<{ role: string; content: string }>;
  }>();

  const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages,
    stream: true,
  });

  return new Response(response, {
    headers: { 'content-type': 'text/event-stream' },
  });
});
```

---

### Pattern 2: RAG (Retrieval Augmented Generation)

```typescript
// Step 1: Generate embeddings
const embeddings = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: [userQuery],
});

const vector = embeddings.data[0];

// Step 2: Search Vectorize
const matches = await env.VECTORIZE.query(vector, { topK: 3 });

// Step 3: Build context from matches
const context = matches.matches.map((m) => m.metadata.text).join('\n\n');

// Step 4: Generate response with context
const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
  messages: [
    {
      role: 'system',
      content: `Answer using this context:\n${context}`,
    },
    { role: 'user', content: userQuery },
  ],
  stream: true,
});

return new Response(response, {
  headers: { 'content-type': 'text/event-stream' },
});
```

---

### Pattern 3: Structured Output with Zod

```typescript
import { z } from 'zod';

const RecipeSchema = z.object({
  name: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
  prepTime: z.number(),
});

app.post('/recipe', async (c) => {
  const { dish } = await c.req.json<{ dish: string }>();

  const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      {
        role: 'user',
        content: `Generate a recipe for ${dish}. Return ONLY valid JSON matching this schema: ${JSON.stringify(RecipeSchema.shape)}`,
      },
    ],
  });

  // Parse and validate
  const recipe = RecipeSchema.parse(JSON.parse(response.response));

  return c.json(recipe);
});
```

---

### Pattern 4: Image Generation + R2 Storage

```typescript
app.post('/generate-image', async (c) => {
  const { prompt } = await c.req.json<{ prompt: string }>();

  // Generate image
  const imageStream = await c.env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
    prompt,
  });

  const imageBytes = await new Response(imageStream).bytes();

  // Store in R2
  const key = `images/${Date.now()}.png`;
  await c.env.BUCKET.put(key, imageBytes, {
    httpMetadata: { contentType: 'image/png' },
  });

  return c.json({
    success: true,
    url: `https://your-domain.com/${key}`,
  });
});
```

---

## AI Gateway Integration

AI Gateway provides caching, logging, and analytics for AI requests.

**Setup:**
```typescript
const response = await env.AI.run(
  '@cf/meta/llama-3.1-8b-instruct',
  { prompt: 'Hello' },
  {
    gateway: {
      id: 'my-gateway', // Your gateway ID
      skipCache: false, // Use cache
    },
  }
);
```

**Benefits:**
- ✅ **Cost Tracking** - Monitor neurons usage per request
- ✅ **Caching** - Reduce duplicate inference costs
- ✅ **Logging** - Debug and analyze AI requests
- ✅ **Rate Limiting** - Additional layer of protection
- ✅ **Analytics** - Request patterns and performance

**Access Gateway Logs:**
```typescript
const gateway = env.AI.gateway('my-gateway');
const logId = env.AI.aiGatewayLogId;

// Send feedback
await gateway.patchLog(logId, {
  feedback: { rating: 1, comment: 'Great response' },
});
```

---

## Rate Limits & Pricing

### Rate Limits (per minute)

| Task Type | Default Limit | Notes |
|-----------|---------------|-------|
| **Text Generation** | 300/min | Some fast models: 400-1500/min |
| **Text Embeddings** | 3000/min | BGE-large: 1500/min |
| **Image Generation** | 720/min | All image models |
| **Vision Models** | 720/min | Image understanding |
| **Translation** | 720/min | M2M100, Opus MT |
| **Classification** | 2000/min | Text classification |
| **Speech Recognition** | 720/min | Whisper models |

### Pricing (Neurons-Based)

**Free Tier:**
- 10,000 neurons per day
- Resets daily at 00:00 UTC

**Paid Tier:**
- $0.011 per 1,000 neurons
- 10,000 neurons/day included
- Unlimited usage above free allocation

**Example Costs:**

| Model | Input (1M tokens) | Output (1M tokens) |
|-------|-------------------|-------------------|
| Llama 3.2 1B | $0.027 | $0.201 |
| Llama 3.1 8B | $0.088 | $0.606 |
| BGE-base embeddings | $0.005 | N/A |
| Flux image generation | ~$0.011/image | N/A |

---

## Production Checklist

### Before Deploying

- [ ] **Enable AI Gateway** for cost tracking and logging
- [ ] **Implement streaming** for all text generation endpoints
- [ ] **Add rate limit retry** with exponential backoff
- [ ] **Validate input length** to prevent token limit errors
- [ ] **Set appropriate timeouts** (Workers: 30s CPU default, 5m max)
- [ ] **Monitor neurons usage** in Cloudflare dashboard
- [ ] **Test error handling** for model unavailable, rate limits
- [ ] **Add input sanitization** to prevent prompt injection
- [ ] **Configure CORS** if using from browser
- [ ] **Plan for scale** - upgrade to Paid plan if needed

### Error Handling

```typescript
async function runAIWithRetry(
  env: Env,
  model: string,
  inputs: any,
  maxRetries = 3
): Promise<any> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await env.AI.run(model, inputs);
    } catch (error) {
      lastError = error as Error;
      const message = lastError.message.toLowerCase();

      // Rate limit - retry with backoff
      if (message.includes('429') || message.includes('rate limit')) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Other errors - throw immediately
      throw error;
    }
  }

  throw lastError!;
}
```

### Monitoring

```typescript
app.use('*', async (c, next) => {
  const start = Date.now();

  await next();

  // Log AI usage
  console.log({
    path: c.req.path,
    duration: Date.now() - start,
    logId: c.env.AI.aiGatewayLogId,
  });
});
```

---

## OpenAI Compatibility

Workers AI supports OpenAI-compatible endpoints.

**Using OpenAI SDK:**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: env.CLOUDFLARE_API_KEY,
  baseURL: `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`,
});

// Chat completions
const completion = await openai.chat.completions.create({
  model: '@cf/meta/llama-3.1-8b-instruct',
  messages: [{ role: 'user', content: 'Hello!' }],
});

// Embeddings
const embeddings = await openai.embeddings.create({
  model: '@cf/baai/bge-base-en-v1.5',
  input: 'Hello world',
});
```

**Endpoints:**
- `/v1/chat/completions` - Text generation
- `/v1/embeddings` - Text embeddings

---

## Vercel AI SDK Integration

```bash
npm install workers-ai-provider ai
```

```typescript
import { createWorkersAI } from 'workers-ai-provider';
import { generateText, streamText } from 'ai';

const workersai = createWorkersAI({ binding: env.AI });

// Generate text
const result = await generateText({
  model: workersai('@cf/meta/llama-3.1-8b-instruct'),
  prompt: 'Write a poem',
});

// Stream text
const stream = streamText({
  model: workersai('@cf/meta/llama-3.1-8b-instruct'),
  prompt: 'Tell me a story',
});
```

---

## Limits Summary

| Feature | Limit |
|---------|-------|
| Concurrent requests | No hard limit (rate limits apply) |
| Max input tokens | Varies by model (typically 2K-128K) |
| Max output tokens | Varies by model (typically 512-2048) |
| Streaming chunk size | ~1 KB |
| Image size (output) | ~5 MB |
| Request timeout | Workers timeout applies (30s default, 5m max CPU) |
| Daily free neurons | 10,000 |
| Rate limits | See "Rate Limits & Pricing" section |

---

## References

- [Workers AI Docs](https://developers.cloudflare.com/workers-ai/)
- [Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
- [AI Gateway](https://developers.cloudflare.com/ai-gateway/)
- [Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Limits](https://developers.cloudflare.com/workers-ai/platform/limits/)
- [REST API](https://developers.cloudflare.com/workers-ai/get-started/rest-api/)
