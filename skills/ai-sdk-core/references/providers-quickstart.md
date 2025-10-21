# AI SDK Core - Providers Quick Start

Quick reference for setting up the top 4 AI providers with AI SDK v5.

---

## OpenAI

**Package:** `@ai-sdk/openai`
**Version:** 2.0.53+
**Maturity:** Excellent

### Setup

```bash
npm install @ai-sdk/openai
```

```bash
# .env
OPENAI_API_KEY=sk-...
```

### Usage

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const result = await generateText({
  model: openai('gpt-4-turbo'),
  prompt: 'Hello',
});
```

### Available Models

| Model | Use Case | Cost | Speed |
|-------|----------|------|-------|
| gpt-5 | Latest (if available) | High | Medium |
| gpt-4-turbo | Complex reasoning | High | Medium |
| gpt-4 | High quality | High | Slow |
| gpt-3.5-turbo | Simple tasks | Low | Fast |

### Common Errors

- **401 Unauthorized**: Invalid API key
- **429 Rate Limit**: Exceeded RPM/TPM limits
- **500 Server Error**: OpenAI service issue

### Links

- Docs: https://ai-sdk.dev/providers/ai-sdk-providers/openai
- API Keys: https://platform.openai.com/api-keys
- Rate Limits: https://platform.openai.com/account/rate-limits

---

## Anthropic

**Package:** `@ai-sdk/anthropic`
**Version:** 2.0.0+
**Maturity:** Excellent

### Setup

```bash
npm install @ai-sdk/anthropic
```

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
```

### Usage

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

const result = await generateText({
  model: anthropic('claude-3-5-sonnet-20241022'),
  prompt: 'Hello',
});
```

### Available Models

| Model | Use Case | Context | Speed |
|-------|----------|---------|-------|
| claude-3-5-sonnet-20241022 | Best balance | 200K | Medium |
| claude-3-opus-20240229 | Highest intelligence | 200K | Slow |
| claude-3-haiku-20240307 | Fast and cheap | 200K | Fast |

### Common Errors

- **authentication_error**: Invalid API key
- **rate_limit_error**: Rate limit exceeded
- **overloaded_error**: Service overloaded, retry

### Links

- Docs: https://ai-sdk.dev/providers/ai-sdk-providers/anthropic
- API Keys: https://console.anthropic.com/
- Model Details: https://docs.anthropic.com/en/docs/models-overview

---

## Google

**Package:** `@ai-sdk/google`
**Version:** 2.0.0+
**Maturity:** Excellent

### Setup

```bash
npm install @ai-sdk/google
```

```bash
# .env
GOOGLE_GENERATIVE_AI_API_KEY=...
```

### Usage

```typescript
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const result = await generateText({
  model: google('gemini-2.5-pro'),
  prompt: 'Hello',
});
```

### Available Models

| Model | Use Case | Context | Free Tier |
|-------|----------|---------|-----------|
| gemini-2.5-pro | Complex reasoning | 1M | Generous |
| gemini-2.5-flash | Fast & efficient | 1M | Generous |
| gemini-2.5-flash-lite | Ultra-fast | 1M | Generous |

### Common Errors

- **SAFETY**: Content filtered by safety settings
- **QUOTA_EXCEEDED**: Rate limit exceeded
- **INVALID_ARGUMENT**: Invalid parameters

### Links

- Docs: https://ai-sdk.dev/providers/ai-sdk-providers/google
- API Keys: https://aistudio.google.com/app/apikey
- Model Details: https://ai.google.dev/models/gemini

---

## Cloudflare Workers AI

**Package:** `workers-ai-provider`
**Version:** 2.0.0+
**Type:** Community Provider
**Maturity:** Good

### Setup

```bash
npm install workers-ai-provider
```

```jsonc
// wrangler.jsonc
{
  "ai": {
    "binding": "AI"
  }
}
```

### Usage

```typescript
import { createWorkersAI } from 'workers-ai-provider';
import { generateText } from 'ai';

// In Cloudflare Worker handler
const workersai = createWorkersAI({ binding: env.AI });

const result = await generateText({
  model: workersai('@cf/meta/llama-3.1-8b-instruct'),
  prompt: 'Hello',
});
```

### Available Models

| Model | Use Case | Notes |
|-------|----------|-------|
| @cf/meta/llama-3.1-8b-instruct | General purpose | Recommended |
| @cf/meta/llama-3.1-70b-instruct | Complex tasks | Slower |
| @cf/mistral/mistral-7b-instruct-v0.1 | Alternative | Good quality |

### Common Issues

- **Startup Limit**: Move imports inside handlers
- **270ms+**: Lazy-load AI SDK to avoid startup overhead

### Important Notes

1. **Startup Optimization Required:**
   ```typescript
   // BAD: Top-level import causes startup overhead
   const workersai = createWorkersAI({ binding: env.AI });

   // GOOD: Lazy initialization
   export default {
     async fetch(request, env) {
       const workersai = createWorkersAI({ binding: env.AI });
       // Use here
     }
   }
   ```

2. **When to Use:**
   - Multi-provider scenarios (OpenAI + Workers AI)
   - Using AI SDK UI hooks
   - Need consistent API across providers

3. **When to Use Native Binding:**
   - Cloudflare-only deployment
   - Maximum performance
   - See: `cloudflare-workers-ai` skill

### Links

- Docs: https://ai-sdk.dev/providers/community-providers/cloudflare-workers-ai
- Models: https://developers.cloudflare.com/workers-ai/models/
- GitHub: https://github.com/cloudflare/ai/tree/main/packages/workers-ai-provider

---

## Provider Comparison

| Feature | OpenAI | Anthropic | Google | Cloudflare |
|---------|--------|-----------|--------|------------|
| **Quality** | Excellent | Excellent | Excellent | Good |
| **Speed** | Medium | Medium | Fast | Fast |
| **Cost** | Medium | Medium | Low | Lowest |
| **Context** | 128K | 200K | 1M | 128K |
| **Structured Output** | ✅ | ✅ | ✅ | ⚠️ |
| **Tool Calling** | ✅ | ✅ | ✅ | ⚠️ |
| **Streaming** | ✅ | ✅ | ✅ | ✅ |
| **Free Tier** | ❌ | ❌ | ✅ | ✅ |

---

## Multi-Provider Setup

```typescript
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

// Use different providers for different tasks
const complexTask = await generateText({
  model: openai('gpt-4'),  // Best reasoning
  prompt: 'Complex analysis...',
});

const longContext = await generateText({
  model: anthropic('claude-3-5-sonnet-20241022'),  // Long context
  prompt: 'Document: ' + longDocument,
});

const fastTask = await generateText({
  model: google('gemini-2.5-flash'),  // Fast and cheap
  prompt: 'Quick summary...',
});
```

---

## Fallback Pattern

```typescript
async function generateWithFallback(prompt: string) {
  try {
    return await generateText({ model: openai('gpt-4'), prompt });
  } catch (error) {
    console.error('OpenAI failed, trying Anthropic...');
    try {
      return await generateText({ model: anthropic('claude-3-5-sonnet-20241022'), prompt });
    } catch (error2) {
      console.error('Anthropic failed, trying Google...');
      return await generateText({ model: google('gemini-2.5-pro'), prompt });
    }
  }
}
```

---

## All Providers

AI SDK supports 25+ providers. See full list:
https://ai-sdk.dev/providers/overview

**Other Official Providers:**
- xAI (Grok)
- Mistral
- Azure OpenAI
- Amazon Bedrock
- DeepSeek
- Groq

**Community Providers:**
- Ollama (local models)
- FriendliAI
- Portkey
- LM Studio
- Baseten

---

**Last Updated:** 2025-10-21
