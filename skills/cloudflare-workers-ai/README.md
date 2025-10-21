# Cloudflare Workers AI

Complete knowledge domain for Cloudflare Workers AI - Run AI models on serverless GPUs across Cloudflare's global network.

---

## Auto-Trigger Keywords

### Primary Keywords
- workers ai
- cloudflare ai
- ai bindings
- llm workers
- @cf/meta/llama
- workers ai models
- ai inference
- cloudflare llm

### Secondary Keywords
- ai streaming
- text generation ai
- ai embeddings
- image generation ai
- workers ai rag
- ai gateway
- llama workers
- flux image generation
- stable diffusion workers
- vision models ai
- ai chat completion

### Error-Based Keywords
- AI_ERROR
- rate limit ai
- model not found
- token limit exceeded
- neurons exceeded
- ai quota exceeded
- streaming failed
- model unavailable

### Framework Integration Keywords
- workers ai hono
- ai gateway workers
- vercel ai sdk workers
- openai compatible workers
- workers ai vectorize
- ai bindings wrangler
- workers ai streaming

---

## What This Skill Does

This skill provides complete Workers AI knowledge including:

- ✅ **Text Generation (LLMs)** - Llama 3.1/3.2, Qwen, Mistral, DeepSeek (50+ models)
- ✅ **Streaming Responses** - Real-time text generation without buffering
- ✅ **Text Embeddings** - BGE models for RAG and semantic search
- ✅ **Image Generation** - Flux, Stable Diffusion XL for text-to-image
- ✅ **Vision Models** - Llama 3.2 Vision for image understanding
- ✅ **AI Gateway Integration** - Caching, logging, and cost tracking
- ✅ **OpenAI Compatibility** - Drop-in replacement for OpenAI API
- ✅ **RAG Patterns** - Complete Retrieval Augmented Generation examples
- ✅ **Function Calling** - Embedded function calling with tools
- ✅ **Vercel AI SDK** - Integration with workers-ai-provider

---

## Known Issues Prevented

| Issue | Description | Prevention |
|-------|-------------|------------|
| **Rate limit errors (429)** | Text generation exceeds 300 req/min | Implement exponential backoff retry |
| **Response buffering** | Large responses timeout without streaming | Always use `stream: true` for text generation |
| **Token limit exceeded** | Input exceeds model context window | Validate prompt length before inference |
| **Model not found** | Invalid model ID | Use correct @cf/ or @hf/ prefixes from catalog |
| **Missing cost tracking** | Production costs unmonitored | Always use AI Gateway for logging |
| **Free tier exhaustion** | Exceeds 10,000 neurons/day | Plan for Workers Paid ($0.011/1000 neurons) |

---

## Quick Example

```typescript
import { Hono } from 'hono';

type Bindings = {
  AI: Ai;
};

const app = new Hono<{ Bindings: Bindings }>();

// Text generation with streaming
app.post('/chat', async (c) => {
  const { prompt } = await c.req.json<{ prompt: string }>();

  const stream = await c.env.AI.run(
    '@cf/meta/llama-3.1-8b-instruct',
    {
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    }
  );

  return new Response(stream, {
    headers: { 'content-type': 'text/event-stream' },
  });
});

export default app;
```

**wrangler.jsonc:**
```jsonc
{
  "ai": {
    "binding": "AI"
  }
}
```

---

## Token Efficiency

**Without this skill:**
- 15-20 documentation lookups for model selection
- 10+ searches for rate limits and pricing
- 8-12 examples for different task types
- ~8,000 tokens of repetitive context

**With this skill:**
- 1 skill invocation with complete knowledge
- ~3,200 tokens of focused, battle-tested patterns
- **~60% token savings**

---

## Coverage

### Models Catalog
- **Text Generation**: 20+ LLMs (Llama, Qwen, Mistral, DeepSeek, Gemma)
- **Text Embeddings**: BGE-base, BGE-large, BGE-small
- **Image Generation**: Flux, Stable Diffusion XL, DreamShaper
- **Vision Models**: Llama 3.2 11B Vision Instruct
- **Translation**: M2M100, Opus MT
- **Classification**: DistilBERT, RoBERTa
- **Speech Recognition**: Whisper models

### Patterns
- Chat completions with message history
- RAG (Retrieval Augmented Generation)
- Structured output with Zod schemas
- Function calling with tools
- Image generation and storage
- Vision model image understanding
- AI Gateway caching and logging

### Production Topics
- Rate limits by task type
- Neurons-based pricing
- Streaming best practices
- Error handling strategies
- OpenAI API compatibility
- Vercel AI SDK integration
- Cost optimization

---

## When to Use This Skill

Use this skill when you see keywords like:
- "integrate Workers AI"
- "add LLM to my Worker"
- "generate embeddings for RAG"
- "create AI image generator"
- "stream AI responses"
- "setup AI Gateway"
- "OpenAI compatible API"
- "model rate limit"
- "Workers AI pricing"

---

## References

- [Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
- [AI Gateway](https://developers.cloudflare.com/ai-gateway/)
- [Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Rate Limits](https://developers.cloudflare.com/workers-ai/platform/limits/)
