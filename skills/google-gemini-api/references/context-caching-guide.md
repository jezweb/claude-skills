# Context Caching Guide

Complete guide to using context caching with Google Gemini API to reduce costs by up to 90%.

---

## What is Context Caching?

Context caching allows you to cache frequently used content (system instructions, large documents, videos) and reuse it across multiple requests, significantly reducing token costs and improving latency.

---

## How It Works

1. **Create a cache** with your repeated content (documents, videos, system instructions)
2. **Set TTL** (time-to-live) for cache expiration
3. **Reference the cache** in subsequent API calls
4. **Pay less** - cached tokens cost ~90% less than regular input tokens

---

## Benefits

### Cost Savings
- **Cached input tokens**: ~90% cheaper than regular tokens
- **Output tokens**: Same price (not cached)
- **Example**: 100K token document cached → ~10K token cost equivalent

### Performance
- **Reduced latency**: Cached content is preprocessed
- **Faster responses**: No need to reprocess large context
- **Consistent results**: Same context every time

### Use Cases
- Large documents analyzed repeatedly
- Long system instructions used across sessions
- Video/audio files queried multiple times
- Consistent conversation context

---

## Cache Creation

### Basic Cache (SDK)

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const cache = await ai.caches.create({
  model: 'gemini-2.5-flash-001', // Must use explicit version!
  config: {
    displayName: 'my-cache',
    systemInstruction: 'You are a helpful assistant.',
    contents: 'Large document content here...',
    ttl: '3600s', // 1 hour
  }
});
```

### Cache with Expiration Time

```typescript
// Set specific expiration time (timezone-aware)
const expirationTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

const cache = await ai.caches.create({
  model: 'gemini-2.5-flash-001',
  config: {
    displayName: 'my-cache',
    contents: documentText,
    expireTime: expirationTime, // Use expireTime instead of ttl
  }
});
```

---

## TTL (Time-To-Live) Guidelines

### Recommended TTL Values

| Use Case | TTL | Reason |
|----------|-----|--------|
| Quick analysis session | 300s (5 min) | Short-lived tasks |
| Extended conversation | 3600s (1 hour) | Standard session length |
| Daily batch processing | 86400s (24 hours) | Reuse across day |
| Long-term analysis | 604800s (7 days) | Maximum allowed |

### TTL vs Expiration Time

**TTL (time-to-live)**:
- Relative duration from cache creation
- Format: `"3600s"` (string with 's' suffix)
- Easy for session-based caching

**Expiration Time**:
- Absolute timestamp
- Must be timezone-aware Date object
- Precise control over cache lifetime

---

## Using a Cache

### Generate Content with Cache (SDK)

```typescript
// Use cache name as model parameter
const response = await ai.models.generateContent({
  model: cache.name, // Use cache.name, not original model name
  contents: 'Summarize the document'
});

console.log(response.text);
```

### Multiple Queries with Same Cache

```typescript
const queries = [
  'What are the key points?',
  'Who are the main characters?',
  'What is the conclusion?'
];

for (const query of queries) {
  const response = await ai.models.generateContent({
    model: cache.name,
    contents: query
  });
  console.log(`Q: ${query}`);
  console.log(`A: ${response.text}\n`);
}
```

---

## Cache Management

### Update Cache TTL

```typescript
// Extend cache lifetime before it expires
await ai.caches.update({
  name: cache.name,
  config: {
    ttl: '7200s' // Extend to 2 hours
  }
});
```

### List All Caches

```typescript
const caches = await ai.caches.list();
caches.forEach(cache => {
  console.log(`${cache.displayName}: ${cache.name}`);
  console.log(`Expires: ${cache.expireTime}`);
});
```

### Delete Cache

```typescript
// Delete when no longer needed
await ai.caches.delete({ name: cache.name });
```

---

## Advanced Use Cases

### Caching Video Files

```typescript
import fs from 'fs';

// 1. Upload video
const videoFile = await ai.files.upload({
  file: fs.createReadStream('./video.mp4')
});

// 2. Wait for processing
while (videoFile.state.name === 'PROCESSING') {
  await new Promise(resolve => setTimeout(resolve, 2000));
  videoFile = await ai.files.get({ name: videoFile.name });
}

// 3. Create cache with video
const cache = await ai.caches.create({
  model: 'gemini-2.5-flash-001',
  config: {
    displayName: 'video-cache',
    systemInstruction: 'Analyze this video.',
    contents: [videoFile],
    ttl: '600s'
  }
});

// 4. Query video multiple times
const response1 = await ai.models.generateContent({
  model: cache.name,
  contents: 'What happens in the first minute?'
});

const response2 = await ai.models.generateContent({
  model: cache.name,
  contents: 'Who are the main people?'
});
```

### Caching with System Instructions

```typescript
const cache = await ai.caches.create({
  model: 'gemini-2.5-flash-001',
  config: {
    displayName: 'legal-expert-cache',
    systemInstruction: `
      You are a legal expert specializing in contract law.
      Always cite relevant sections when making claims.
      Use clear, professional language.
    `,
    contents: largeContractDocument,
    ttl: '3600s'
  }
});

// System instruction is part of cached context
const response = await ai.models.generateContent({
  model: cache.name,
  contents: 'Is this contract enforceable?'
});
```

---

## Important Notes

### Model Version Requirement

**⚠️ You MUST use explicit version suffixes when creating caches:**

```typescript
// ✅ CORRECT
model: 'gemini-2.5-flash-001'

// ❌ WRONG (will fail)
model: 'gemini-2.5-flash'
```

### Cache Expiration

- Caches are **automatically deleted** after TTL expires
- **Cannot recover** expired caches - must recreate
- Update TTL **before expiration** to extend lifetime

### Cost Calculation

```
Regular request: 100,000 input tokens = 100K token cost

With caching (after cache creation):
- Cached tokens: 100,000 × 0.1 (90% discount) = 10K equivalent cost
- New tokens: 1,000 × 1.0 = 1K cost
- Total: 11K equivalent (89% savings!)
```

### Limitations

- Maximum TTL: 7 days (604800s)
- Cache creation costs same as regular tokens (first time only)
- Subsequent uses get 90% discount
- Only input tokens are cached (output tokens never cached)

---

## Best Practices

### When to Use Caching

✅ **Good Use Cases:**
- Large documents queried repeatedly (legal docs, research papers)
- Video/audio files analyzed with different questions
- Long system instructions used across many requests
- Consistent context in multi-turn conversations

❌ **Bad Use Cases:**
- Single-use content (no benefit)
- Frequently changing content
- Short content (<1000 tokens) - minimal savings
- Content used only once per day (cache might expire)

### Optimization Tips

1. **Cache Early**: Create cache at session start
2. **Extend TTL**: Update before expiration if still needed
3. **Monitor Usage**: Track how often cache is reused
4. **Clean Up**: Delete unused caches to avoid clutter
5. **Combine Features**: Use caching with code execution, grounding for powerful workflows

### Cache Naming

Use descriptive `displayName` for easy identification:

```typescript
// ✅ Good names
displayName: 'financial-report-2024-q3'
displayName: 'legal-contract-acme-corp'
displayName: 'video-analysis-project-x'

// ❌ Vague names
displayName: 'cache1'
displayName: 'test'
```

---

## Troubleshooting

### "Invalid model name" Error

**Problem**: Using `gemini-2.5-flash` instead of `gemini-2.5-flash-001`

**Solution**: Always use explicit version suffix:

```typescript
model: 'gemini-2.5-flash-001' // Correct
```

### Cache Expired Error

**Problem**: Trying to use cache after TTL expired

**Solution**: Check expiration before use or extend TTL proactively:

```typescript
const cache = await ai.caches.get({ name: cacheName });
if (new Date(cache.expireTime) < new Date()) {
  // Cache expired, recreate it
  cache = await ai.caches.create({ ... });
}
```

### High Costs Despite Caching

**Problem**: Creating new cache for each request

**Solution**: Reuse the same cache across multiple requests:

```typescript
// ❌ Wrong - creates new cache each time
for (const query of queries) {
  const cache = await ai.caches.create({ ... }); // Expensive!
  const response = await ai.models.generateContent({ model: cache.name, ... });
}

// ✅ Correct - create once, use many times
const cache = await ai.caches.create({ ... }); // Create once
for (const query of queries) {
  const response = await ai.models.generateContent({ model: cache.name, ... });
}
```

---

## References

- Official Docs: https://ai.google.dev/gemini-api/docs/caching
- Cost Optimization: See "Cost Optimization" in main SKILL.md
- Templates: See `context-caching.ts` for working examples
