# Prompt Caching Guide

Complete guide to using prompt caching for cost optimization.

## Overview

Prompt caching reduces costs by up to 90% and latency by up to 85% by caching frequently used context.

### Benefits

- **Cost Savings**: Cache reads = 10% of input token price
- **Latency Reduction**: 85% faster time to first token
- **Use Cases**: Long documents, codebases, system instructions, conversation history

### Pricing

| Operation | Cost (per MTok) | vs Regular Input |
|-----------|-----------------|------------------|
| Regular input | $3 | 100% |
| Cache write | $3.75 | 125% |
| Cache read | $0.30 | 10% |

**Example**: 100k tokens cached, used 10 times
- Without caching: 100k × $3/MTok × 10 = $3.00
- With caching: (100k × $3.75/MTok) + (100k × $0.30/MTok × 9) = $0.375 + $0.27 = $0.645
- **Savings: $2.355 (78.5%)**

## Requirements

### Minimum Cacheable Content

- **Claude 3.5 Sonnet**: 1,024 tokens minimum
- **Claude 3.5 Haiku**: 2,048 tokens minimum
- **Claude 3.7 Sonnet**: 1,024 tokens minimum

### Cache Lifetime

- **Default**: 5 minutes
- **Extended**: 1 hour (configurable)
- Refreshes on each use

### Cache Matching

Cache hits require:
- ✅ **Identical content** (byte-for-byte)
- ✅ **Same position** in request
- ✅ **Within TTL** (5 min or 1 hour)

## Implementation

### Basic System Prompt Caching

```typescript
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  system: [
    {
      type: 'text',
      text: LARGE_SYSTEM_INSTRUCTIONS, // >= 1024 tokens
      cache_control: { type: 'ephemeral' },
    },
  ],
  messages: [
    { role: 'user', content: 'Your question here' }
  ],
});
```

### Caching in User Messages

```typescript
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Analyze this document:',
        },
        {
          type: 'text',
          text: LARGE_DOCUMENT, // >= 1024 tokens
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: 'What are the main themes?',
        },
      ],
    },
  ],
});
```

### Multi-Turn Conversation Caching

```typescript
// Turn 1 - Creates cache
const response1 = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  system: [
    {
      type: 'text',
      text: SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' },
    },
  ],
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
});

// Turn 2 - Hits cache (same system prompt)
const response2 = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  system: [
    {
      type: 'text',
      text: SYSTEM_PROMPT, // Identical - cache hit
      cache_control: { type: 'ephemeral' },
    },
  ],
  messages: [
    { role: 'user', content: 'Hello!' },
    { role: 'assistant', content: response1.content[0].text },
    { role: 'user', content: 'Tell me more' },
  ],
});
```

### Caching Conversation History

```typescript
const messages = [
  { role: 'user', content: 'Message 1' },
  { role: 'assistant', content: 'Response 1' },
  { role: 'user', content: 'Message 2' },
  { role: 'assistant', content: 'Response 2' },
];

// Cache last assistant message
messages[messages.length - 1] = {
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: 'Response 2',
      cache_control: { type: 'ephemeral' },
    },
  ],
};

messages.push({ role: 'user', content: 'Message 3' });

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  messages,
});
```

## Best Practices

### ✅ Do

- Place `cache_control` on the **last block** of cacheable content
- Cache content >= 1024 tokens (3.5 Sonnet) or >= 2048 tokens (3.5 Haiku)
- Use caching for repeated context (system prompts, documents, code)
- Monitor cache usage in response headers
- Cache conversation history in long chats

### ❌ Don't

- Cache content below minimum token threshold
- Place `cache_control` in the middle of text
- Change cached content (breaks cache matching)
- Cache rarely used content (not cost-effective)
- Expect caching to work across different API keys

## Monitoring Cache Usage

```typescript
const response = await anthropic.messages.create({...});

console.log('Input tokens:', response.usage.input_tokens);
console.log('Cache creation:', response.usage.cache_creation_input_tokens);
console.log('Cache read:', response.usage.cache_read_input_tokens);
console.log('Output tokens:', response.usage.output_tokens);

// First request
// input_tokens: 1000
// cache_creation_input_tokens: 5000
// cache_read_input_tokens: 0

// Subsequent requests (within 5 min)
// input_tokens: 1000
// cache_creation_input_tokens: 0
// cache_read_input_tokens: 5000  // 90% cost savings!
```

## Common Patterns

### Pattern 1: Document Analysis Chatbot

```typescript
const document = fs.readFileSync('./document.txt', 'utf-8'); // 10k tokens

// All requests use same cached document
for (const question of questions) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Document:' },
          {
            type: 'text',
            text: document,
            cache_control: { type: 'ephemeral' },
          },
          { type: 'text', text: `Question: ${question}` },
        ],
      },
    ],
  });

  // First request: cache_creation_input_tokens: 10000
  // Subsequent: cache_read_input_tokens: 10000 (90% savings)
}
```

### Pattern 2: Code Review with Codebase Context

```typescript
const codebase = await loadCodebase(); // 50k tokens

const review = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 2048,
  system: [
    { type: 'text', text: 'You are a code reviewer.' },
    {
      type: 'text',
      text: `Codebase context:\n${codebase}`,
      cache_control: { type: 'ephemeral' },
    },
  ],
  messages: [
    { role: 'user', content: 'Review this PR: ...' }
  ],
});
```

### Pattern 3: Customer Support with Knowledge Base

```typescript
const knowledgeBase = await loadKB(); // 20k tokens

// Cache persists across all customer queries
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  system: [
    { type: 'text', text: 'You are a customer support agent.' },
    {
      type: 'text',
      text: knowledgeBase,
      cache_control: { type: 'ephemeral' },
    },
  ],
  messages: customerConversation,
});
```

## Troubleshooting

### Cache Not Activating

**Problem**: `cache_read_input_tokens` is 0

**Solutions**:
1. Ensure content >= 1024 tokens (or 2048 for Haiku)
2. Verify `cache_control` is on **last block**
3. Check content is byte-for-byte identical
4. Confirm requests within 5-minute window

### Unexpected Cache Misses

**Problem**: Cache hits intermittently

**Solutions**:
1. Ensure content doesn't change (even whitespace)
2. Check TTL hasn't expired
3. Verify using same API key
4. Monitor cache headers in responses

### High Cache Creation Costs

**Problem**: Frequent `cache_creation_input_tokens`

**Solutions**:
1. Increase request frequency (use cache before expiry)
2. Consider if caching is cost-effective (need 2+ uses)
3. Extend cache TTL to 1 hour if supported

## Cost Calculator

```typescript
function calculateCachingSavings(
  cachedTokens: number,
  uncachedTokens: number,
  requestCount: number
): {
  withoutCaching: number;
  withCaching: number;
  savings: number;
  savingsPercent: number;
} {
  const inputCostPerMTok = 3;
  const cacheCostPerMTok = 3.75;
  const cacheReadCostPerMTok = 0.3;

  const withoutCaching = ((cachedTokens + uncachedTokens) / 1_000_000) *
    inputCostPerMTok * requestCount;

  const cacheWrite = (cachedTokens / 1_000_000) * cacheCostPerMTok;
  const cacheReads = (cachedTokens / 1_000_000) * cacheReadCostPerMTok * (requestCount - 1);
  const uncachedInput = (uncachedTokens / 1_000_000) * inputCostPerMTok * requestCount;
  const withCaching = cacheWrite + cacheReads + uncachedInput;

  const savings = withoutCaching - withCaching;
  const savingsPercent = (savings / withoutCaching) * 100;

  return { withoutCaching, withCaching, savings, savingsPercent };
}

// Example: 10k cached tokens, 1k uncached, 20 requests
const result = calculateCachingSavings(10000, 1000, 20);
console.log(`Savings: $${result.savings.toFixed(4)} (${result.savingsPercent.toFixed(1)}%)`);
```

## Official Documentation

- **Prompt Caching Guide**: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
- **Pricing**: https://www.anthropic.com/pricing
- **API Reference**: https://docs.claude.com/en/api/messages
