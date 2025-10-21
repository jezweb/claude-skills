# Cloudflare Workers AI - Best Practices

Production-tested patterns for building reliable, cost-effective AI applications with Workers AI.

---

## Table of Contents

1. [Streaming Best Practices](#streaming-best-practices)
2. [Error Handling](#error-handling)
3. [Cost Optimization](#cost-optimization)
4. [Performance Optimization](#performance-optimization)
5. [Security](#security)
6. [Monitoring & Observability](#monitoring--observability)
7. [Production Checklist](#production-checklist)

---

## Streaming Best Practices

### Why Streaming is Essential

**❌ Without streaming:**
- Buffers entire response in memory
- Higher latency (wait for complete response)
- Risk of Worker timeout (30s default)
- Poor user experience for long content

**✅ With streaming:**
- Immediate first token
- Lower memory usage
- Better UX (progressive rendering)
- No timeout issues

### Implementation

```typescript
// Always use stream: true for text generation
const stream = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
  messages: [{ role: 'user', content: prompt }],
  stream: true, // CRITICAL
});

return new Response(stream, {
  headers: { 'content-type': 'text/event-stream' },
});
```

### Client-Side Handling

```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ prompt }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  // Update UI with chunk
}
```

---

## Error Handling

### 1. Rate Limit Errors (429)

**Pattern: Exponential Backoff**

```typescript
async function runWithRetry(
  ai: Ai,
  model: string,
  inputs: any,
  maxRetries = 3
): Promise<any> {
  let delay = 1000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await ai.run(model, inputs);
    } catch (error) {
      const message = (error as Error).message.toLowerCase();

      if (message.includes('429') || message.includes('rate limit')) {
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff: 1s, 2s, 4s
          continue;
        }
      }

      throw error;
    }
  }
}
```

### 2. Model Unavailable

**Pattern: Fallback Models**

```typescript
const models = [
  '@cf/meta/llama-3.1-8b-instruct', // Primary
  '@cf/meta/llama-3.2-1b-instruct', // Fallback (faster)
  '@cf/qwen/qwen1.5-7b-chat-awq', // Fallback (alternative)
];

async function runWithFallback(ai: Ai, inputs: any): Promise<any> {
  for (const model of models) {
    try {
      return await ai.run(model, inputs);
    } catch (error) {
      const message = (error as Error).message.toLowerCase();
      if (!message.includes('unavailable')) throw error;
      // Try next model
    }
  }

  throw new Error('All models unavailable');
}
```

### 3. Token Limit Exceeded

**Pattern: Input Validation**

```typescript
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function validateInput(text: string, maxTokens = 2048): void {
  const tokens = estimateTokens(text);

  if (tokens > maxTokens) {
    throw new Error(
      `Input too long: ${tokens} tokens (max: ${maxTokens})`
    );
  }
}

// Usage
try {
  validateInput(userInput);
  const response = await env.AI.run(model, { prompt: userInput });
} catch (error) {
  return c.json({ error: (error as Error).message }, 400);
}
```

---

## Cost Optimization

### 1. Use AI Gateway for Caching

**Without AI Gateway:**
- Same prompt = new inference = cost

**With AI Gateway:**
- Same prompt = cached response = free

```typescript
const response = await env.AI.run(
  '@cf/meta/llama-3.1-8b-instruct',
  { messages },
  { gateway: { id: 'my-gateway' } } // Enable caching
);
```

**Savings**: 50-90% for repeated queries

### 2. Choose the Right Model

**Cost Comparison** (per 1M output tokens):

| Model | Cost | Use Case |
|-------|------|----------|
| Llama 3.2 1B | $0.201 | Simple tasks, high volume |
| Llama 3.1 8B | $0.606 | General purpose |
| Qwen 1.5 14B | $1.20+ | Complex reasoning |

**Strategy**: Use smallest model that meets quality requirements

### 3. Limit Output Length

```typescript
const response = await env.AI.run(model, {
  messages,
  max_tokens: 256, // Limit output (default: varies)
});
```

### 4. Batch Embeddings

```typescript
// ❌ Bad: 100 separate requests
for (const text of texts) {
  await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [text] });
}

// ✅ Good: 1 batch request
await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: texts, // Up to 100 texts per request
});
```

### 5. Monitor Neurons Usage

```typescript
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();

  console.log({
    path: c.req.path,
    duration: Date.now() - start,
    logId: c.env.AI.aiGatewayLogId, // Check dashboard for neurons
  });
});
```

---

## Performance Optimization

### 1. Use Faster Models When Appropriate

**Speed Ranking** (fastest to slowest):

1. `@cf/qwen/qwen1.5-0.5b-chat` (1500/min limit)
2. `@cf/meta/llama-3.2-1b-instruct`
3. `@cf/tinyllama/tinyllama-1.1b-chat-v1.0` (720/min)
4. `@hf/thebloke/mistral-7b-instruct-v0.1-awq` (400/min)
5. `@cf/meta/llama-3.1-8b-instruct`
6. `@cf/qwen/qwen1.5-14b-chat-awq` (150/min)

### 2. Parallel Requests

```typescript
// Process multiple tasks in parallel
const [summary, keywords, sentiment] = await Promise.all([
  env.AI.run(model, { prompt: `Summarize: ${text}` }),
  env.AI.run(model, { prompt: `Extract keywords: ${text}` }),
  env.AI.run(model, { prompt: `Sentiment: ${text}` }),
]);
```

### 3. Edge Caching for Static Prompts

```typescript
// Cache AI responses in KV
const cacheKey = `ai:${hash(prompt)}`;

let response = await env.CACHE.get(cacheKey);
if (!response) {
  const result = await env.AI.run(model, { prompt });
  response = result.response;
  await env.CACHE.put(cacheKey, response, { expirationTtl: 3600 });
}
```

---

## Security

### 1. Never Expose API Keys

**❌ Bad:**
```typescript
const openai = new OpenAI({
  apiKey: 'sk-1234...', // Hardcoded!
});
```

**✅ Good:**
```typescript
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY, // Environment variable
});
```

### 2. Input Sanitization

```typescript
function sanitizeInput(text: string): string {
  // Remove potential prompt injection attempts
  return text
    .replace(/\{system\}/gi, '')
    .replace(/\{assistant\}/gi, '')
    .trim();
}

const prompt = sanitizeInput(userInput);
```

### 3. Rate Limiting Per User

```typescript
import { RateLimiter } from '@/lib/rate-limiter';

const limiter = new RateLimiter({
  requests: 10,
  window: 60, // 10 requests per minute
});

app.post('/chat', async (c) => {
  const userId = c.req.header('x-user-id');

  if (!await limiter.check(userId)) {
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }

  // Process request...
});
```

### 4. Content Filtering

```typescript
const BLOCKED_PATTERNS = [
  /generate.*exploit/i,
  /create.*malware/i,
  /hack/i,
];

function isSafePrompt(prompt: string): boolean {
  return !BLOCKED_PATTERNS.some((pattern) => pattern.test(prompt));
}
```

---

## Monitoring & Observability

### 1. Structured Logging

```typescript
interface AILog {
  timestamp: string;
  model: string;
  duration: number;
  success: boolean;
  error?: string;
  logId?: string;
}

async function logAIRequest(log: AILog): Promise<void> {
  console.log(JSON.stringify(log));
  // Or send to logging service (Datadog, Sentry, etc.)
}
```

### 2. Error Tracking

```typescript
app.onError((err, c) => {
  console.error({
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    timestamp: new Date().toISOString(),
  });

  return c.json({ error: 'Internal server error' }, 500);
});
```

### 3. Performance Metrics

```typescript
const metrics = {
  requests: 0,
  errors: 0,
  totalDuration: 0,
};

app.use('*', async (c, next) => {
  metrics.requests++;
  const start = Date.now();

  try {
    await next();
  } catch (error) {
    metrics.errors++;
    throw error;
  } finally {
    metrics.totalDuration += Date.now() - start;
  }
});

app.get('/metrics', (c) => {
  return c.json({
    ...metrics,
    avgDuration: metrics.totalDuration / metrics.requests,
    errorRate: (metrics.errors / metrics.requests) * 100,
  });
});
```

---

## Production Checklist

### Before Deploying

- [ ] **Streaming enabled** for all text generation endpoints
- [ ] **AI Gateway configured** for cost tracking and caching
- [ ] **Error handling** with retry logic for rate limits
- [ ] **Input validation** to prevent token limit errors
- [ ] **Rate limiting** implemented per user
- [ ] **Monitoring** and logging configured
- [ ] **Model selection** optimized for cost/quality balance
- [ ] **Fallback models** configured for high availability
- [ ] **Security** review completed (input sanitization, content filtering)
- [ ] **Load testing** completed with expected traffic
- [ ] **Cost estimation** based on expected usage
- [ ] **Documentation** for API endpoints and error codes

### Cost Planning

**Estimate your costs:**

1. Expected requests/day: _____
2. Avg tokens per request (input + output): _____
3. Model neurons cost: _____
4. Daily neurons = requests × tokens × neurons_per_token
5. Daily cost = (daily neurons - 10,000 free) / 1,000 × $0.011

**Example:**
- 10,000 requests/day
- 500 tokens/request (avg)
- Llama 3.1 8B: ~50 neurons/1K tokens
- Daily neurons: 10,000 × 0.5K × 50 = 250,000
- Daily cost: (250,000 - 10,000) / 1,000 × $0.011 = **$2.64**

### Performance Targets

- **Time to first token**: <500ms
- **Avg response time**: <2s (streaming)
- **Error rate**: <1%
- **Cache hit rate**: >50% (with AI Gateway)

---

## Common Patterns

### 1. RAG Pattern

```typescript
// 1. Generate query embedding
const embeddings = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: [query],
});

// 2. Search Vectorize
const results = await env.VECTORIZE.query(embeddings.data[0], {
  topK: 3,
});

// 3. Build context
const context = results.matches.map((m) => m.metadata.text).join('\n\n');

// 4. Generate response with context
const stream = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
  messages: [
    { role: 'system', content: `Context:\n${context}` },
    { role: 'user', content: query },
  ],
  stream: true,
});
```

### 2. Multi-Model Consensus

```typescript
const models = [
  '@cf/meta/llama-3.1-8b-instruct',
  '@cf/qwen/qwen1.5-7b-chat-awq',
  '@hf/thebloke/mistral-7b-instruct-v0.1-awq',
];

const responses = await Promise.all(
  models.map((model) => env.AI.run(model, { prompt }))
);

// Combine or compare responses
```

### 3. Progressive Enhancement

```typescript
// Start with fast model, upgrade if needed
let response = await env.AI.run('@cf/meta/llama-3.2-1b-instruct', {
  prompt,
});

// Check quality (length, coherence, etc.)
if (response.response.length < 50) {
  // Retry with better model
  response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    prompt,
  });
}
```

---

## References

- [Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [AI Gateway](https://developers.cloudflare.com/ai-gateway/)
- [Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Limits](https://developers.cloudflare.com/workers-ai/platform/limits/)
- [Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
