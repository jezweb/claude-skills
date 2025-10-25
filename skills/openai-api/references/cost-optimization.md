# Cost Optimization Guide

**Last Updated**: 2025-10-25

Strategies to minimize OpenAI API costs while maintaining quality.

---

## Model Selection Strategies

### 1. Model Cascading

Start with cheaper models, escalate only when needed:

```typescript
async function smartCompletion(prompt: string) {
  // Try gpt-5-nano first
  const nanoResult = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [{ role: 'user', content: prompt }],
  });

  // Validate quality
  if (isGoodEnough(nanoResult)) {
    return nanoResult;
  }

  // Escalate to gpt-5-mini
  const miniResult = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [{ role: 'user', content: prompt }],
  });

  if (isGoodEnough(miniResult)) {
    return miniResult;
  }

  // Final escalation to gpt-5
  return await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [{ role: 'user', content: prompt }],
  });
}
```

### 2. Task-Based Model Selection

| Task | Model | Why |
|------|-------|-----|
| Simple chat | gpt-5-nano | Fast, cheap, sufficient |
| Summarization | gpt-5-mini | Good quality, cost-effective |
| Code generation | gpt-5 | Best reasoning, worth the cost |
| Data extraction | gpt-4o + structured output | Reliable, accurate |
| Vision tasks | gpt-4o | Only model with vision |

---

## Token Optimization

### 1. Limit max_tokens

```typescript
// ❌ No limit: May generate unnecessarily long responses
{
  model: 'gpt-5',
  messages,
}

// ✅ Set reasonable limit
{
  model: 'gpt-5',
  messages,
  max_tokens: 500, // Prevent runaway generation
}
```

### 2. Trim Conversation History

```typescript
function trimHistory(messages: Message[], maxTokens: number = 4000) {
  // Keep system message and recent messages
  const system = messages.find(m => m.role === 'system');
  const recent = messages.slice(-10); // Last 10 messages

  return [system, ...recent].filter(Boolean);
}
```

### 3. Use Shorter Prompts

```typescript
// ❌ Verbose
"Please analyze the following text and provide a detailed summary of the main points, including any key takeaways and important details..."

// ✅ Concise
"Summarize key points:"
```

---

## Caching Strategies

### 1. Cache Embeddings

```typescript
const embeddingCache = new Map<string, number[]>();

async function getCachedEmbedding(text: string) {
  if (embeddingCache.has(text)) {
    return embeddingCache.get(text)!;
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  const embedding = response.data[0].embedding;
  embeddingCache.set(text, embedding);

  return embedding;
}
```

### 2. Cache Common Completions

```typescript
const completionCache = new Map<string, string>();

async function getCachedCompletion(prompt: string) {
  const cacheKey = `${model}:${prompt}`;

  if (completionCache.has(cacheKey)) {
    return completionCache.get(cacheKey)!;
  }

  const result = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [{ role: 'user', content: prompt }],
  });

  const content = result.choices[0].message.content;
  completionCache.set(cacheKey, content!);

  return content;
}
```

---

## Batch Processing

### 1. Use Embeddings Batch API

```typescript
// ❌ Individual requests (expensive)
for (const doc of documents) {
  await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: doc,
  });
}

// ✅ Batch request (cheaper)
const response = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: documents, // Array of up to 2048 documents
});
```

### 2. Group Similar Requests

```typescript
// Process non-urgent requests in batches during off-peak hours
const batchQueue: string[] = [];

function queueForBatch(prompt: string) {
  batchQueue.push(prompt);

  if (batchQueue.length >= 10) {
    processBatch();
  }
}

async function processBatch() {
  // Process all at once
  const results = await Promise.all(
    batchQueue.map(prompt =>
      openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [{ role: 'user', content: prompt }],
      })
    )
  );

  batchQueue.length = 0;
  return results;
}
```

---

## Feature-Specific Optimization

### Embeddings

1. **Use custom dimensions**: 256 instead of 1536 = 6x storage reduction
2. **Use text-embedding-3-small**: Cheaper than large, good for most use cases
3. **Batch requests**: Up to 2048 documents per request

### Images

1. **Use standard quality**: Unless HD is critical
2. **Use smaller sizes**: Generate 1024x1024 instead of 1792x1024 when possible
3. **Use natural style**: Cheaper than vivid

### Audio

1. **Use tts-1 for real-time**: Cheaper than tts-1-hd
2. **Use opus format**: Smaller files, good quality
3. **Cache generated audio**: Deterministic for same input

---

## Monitoring and Alerts

```typescript
interface CostTracker {
  totalTokens: number;
  totalCost: number;
  requestCount: number;
}

const tracker: CostTracker = {
  totalTokens: 0,
  totalCost: 0,
  requestCount: 0,
};

async function trackCosts(fn: () => Promise<any>) {
  const result = await fn();

  if (result.usage) {
    tracker.totalTokens += result.usage.total_tokens;
    tracker.requestCount++;

    // Estimate cost (adjust rates based on actual pricing)
    const cost = estimateCost(result.model, result.usage.total_tokens);
    tracker.totalCost += cost;

    // Alert if threshold exceeded
    if (tracker.totalCost > 100) {
      console.warn('Cost threshold exceeded!', tracker);
    }
  }

  return result;
}
```

---

## Cost Reduction Checklist

- [ ] Use cheapest model that meets requirements
- [ ] Set max_tokens limits
- [ ] Trim conversation history
- [ ] Cache embeddings and common queries
- [ ] Batch requests when possible
- [ ] Use custom embedding dimensions (256-512)
- [ ] Monitor token usage
- [ ] Implement rate limiting
- [ ] Use structured outputs to avoid retries
- [ ] Compress prompts (remove unnecessary words)

---

**Estimated Savings**: Following these practices can reduce costs by 40-70% while maintaining quality.
