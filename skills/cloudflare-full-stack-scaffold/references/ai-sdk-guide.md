# AI SDK Integration Guide

This scaffold includes AI SDK Core + UI for building AI-powered applications.

---

## Three Approaches to AI

### 1. Direct Workers AI Binding (Fastest, Free)

```typescript
// backend/src/index.ts
app.post('/api/ai/direct', async (c) => {
  const result = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
    messages: [{ role: 'user', content: 'Hello' }]
  })
  return c.json(result)
})
```

**Pros**: Fastest, no API key needed, runs on Cloudflare
**Cons**: Cloudflare models only

### 2. AI SDK with Workers AI (Portable)

```typescript
import { streamText } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'

app.post('/api/ai/sdk-workers', async (c) => {
  const workersai = createWorkersAI({ binding: c.env.AI })

  const result = await streamText({
    model: workersai('@cf/meta/llama-3-8b-instruct'),
    messages: [{ role: 'user', content: 'Hello' }]
  })

  return result.toTextStreamResponse()
})
```

**Pros**: Portable code, same infrastructure, streaming support
**Cons**: Cloudflare models only

### 3. AI SDK with External Providers

```typescript
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'

// Switch providers in 1 line!
const result = await streamText({
  model: openai('gpt-4o'),  // or anthropic('claude-sonnet-4-5')
  messages: [{ role: 'user', content: 'Hello' }]
})
```

**Pros**: Access to best models (GPT-4o, Claude, Gemini)
**Cons**: Requires API key, costs money

---

## Provider Switching

Change AI provider in one line:

```typescript
// Workers AI
model: workersai('@cf/meta/llama-3-8b-instruct')

// OpenAI
model: openai('gpt-4o')

// Anthropic
model: anthropic('claude-sonnet-4-5')

// Google
model: google('gemini-2.5-flash')
```

---

## Streaming Responses

```typescript
import { streamText } from 'ai'

const result = await streamText({
  model: openai('gpt-4o'),
  messages: [{ role: 'user', content: 'Write a story' }]
})

return result.toTextStreamResponse()
```

---

## Chat Interface (AI SDK UI)

```bash
./scripts/enable-ai-chat.sh
```

This uncomments the ChatInterface component and Chat page.

---

## RAG Pattern

```typescript
// 1. Generate embedding
const embedding = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: ['search query']
})

// 2. Search Vectorize
const matches = await c.env.VECTORIZE.query(embedding.data[0], {
  topK: 5
})

// 3. Inject context into prompt
const result = await streamText({
  model: openai('gpt-4o'),
  messages: [{
    role: 'user',
    content: `Context: ${matches.matches.map(m => m.metadata.text).join('\n\n')}\n\nQuestion: ${query}`
  }]
})
```

---

See official docs:
- AI SDK: https://ai-sdk.dev
- Workers AI: https://developers.cloudflare.com/workers-ai
