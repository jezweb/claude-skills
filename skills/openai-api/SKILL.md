---
name: OpenAI API
description: |
  Complete guide for OpenAI's traditional/stateless APIs: Chat Completions (GPT-5, GPT-4o), Embeddings,
  Images (DALL-E 3), Audio (Whisper + TTS), and Moderation. Includes both Node.js SDK and fetch-based
  approaches for maximum compatibility.

  Use when: integrating OpenAI APIs, implementing chat completions with GPT-5/GPT-4o, generating text
  with streaming, using function calling/tools, creating structured outputs with JSON schemas,
  implementing embeddings for RAG, generating images with DALL-E 3, transcribing audio with Whisper,
  synthesizing speech with TTS, moderating content, deploying to Cloudflare Workers, or encountering
  errors like rate limits (429), invalid API keys (401), function calling failures, streaming parse
  errors, embeddings dimension mismatches, or token limit exceeded.

  Keywords: openai api, chat completions, gpt-5, gpt-5-mini, gpt-5-nano, gpt-4o, gpt-4-turbo,
  openai sdk, openai streaming, function calling, structured output, json schema, openai embeddings,
  text-embedding-3, dall-e-3, image generation, whisper api, openai tts, text-to-speech, moderation api,
  openai fetch, cloudflare workers openai, openai rate limit, openai 429, reasoning_effort, verbosity
license: MIT
---

# OpenAI API - Complete Guide

**Version**: Phase 1 Complete - Chat Completions Ready ✅
**Package**: openai@6.7.0
**Last Updated**: 2025-10-25

---

## Status

**✅ Phase 1 Complete**:
- Chat Completions API (GPT-5, GPT-4o, GPT-4 Turbo)
- Streaming patterns (SSE)
- Function calling basics
- Core templates and examples
- Both Node.js SDK and fetch approaches

**⏳ Phase 2 Pending** (next session):
- Embeddings API (detailed guide)
- Images API (DALL-E 3 generation + editing)
- Audio API (Whisper + TTS)
- Moderation API
- Additional templates and reference docs

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Chat Completions API](#chat-completions-api)
3. [GPT-5 Series Models](#gpt-5-series-models)
4. [Streaming Patterns](#streaming-patterns)
5. [Function Calling](#function-calling)
6. [Structured Outputs](#structured-outputs)
7. [Vision (GPT-4o)](#vision-gpt-4o)
8. [Embeddings API](#embeddings-api) *(Phase 2)*
9. [Images API](#images-api) *(Phase 2)*
10. [Audio API](#audio-api) *(Phase 2)*
11. [Moderation API](#moderation-api) *(Phase 2)*
12. [Error Handling](#error-handling)
13. [Rate Limits](#rate-limits)
14. [Production Best Practices](#production-best-practices)
15. [Relationship to openai-responses](#relationship-to-openai-responses)

---

## Quick Start

### Installation

```bash
npm install openai@6.7.0
```

### Environment Setup

```bash
export OPENAI_API_KEY="sk-..."
```

Or create `.env` file:
```
OPENAI_API_KEY=sk-...
```

### First Chat Completion (Node.js SDK)

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const completion = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [
    { role: 'user', content: 'What are the three laws of robotics?' }
  ],
});

console.log(completion.choices[0].message.content);
```

### First Chat Completion (Fetch - Cloudflare Workers)

```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-5',
    messages: [
      { role: 'user', content: 'What are the three laws of robotics?' }
    ],
  }),
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

---

## Chat Completions API

**Endpoint**: `POST /v1/chat/completions`

The Chat Completions API is the core interface for interacting with OpenAI's language models. It supports conversational AI, text generation, function calling, structured outputs, and vision capabilities.

### Supported Models

#### GPT-5 Series (Released August 2025)
- **gpt-5**: Full-featured reasoning model with advanced capabilities
- **gpt-5-mini**: Cost-effective alternative with good performance
- **gpt-5-nano**: Smallest/fastest variant for simple tasks

#### GPT-4o Series
- **gpt-4o**: Multimodal model with vision capabilities
- **gpt-4-turbo**: Fast GPT-4 variant

#### GPT-4 Series
- **gpt-4**: Original GPT-4 model

### Basic Request Structure

```typescript
{
  model: string,              // Model to use (e.g., "gpt-5")
  messages: Message[],        // Conversation history
  reasoning_effort?: string,  // GPT-5 only: "minimal" | "low" | "medium" | "high"
  verbosity?: string,         // GPT-5 only: "low" | "medium" | "high"
  temperature?: number,       // NOT supported by GPT-5
  max_tokens?: number,        // Max tokens to generate
  stream?: boolean,           // Enable streaming
  tools?: Tool[],             // Function calling tools
}
```

### Response Structure

```typescript
{
  id: string,                 // Unique completion ID
  object: "chat.completion",
  created: number,            // Unix timestamp
  model: string,              // Model used
  choices: [{
    index: number,
    message: {
      role: "assistant",
      content: string,        // Generated text
      tool_calls?: ToolCall[] // If function calling
    },
    finish_reason: string     // "stop" | "length" | "tool_calls"
  }],
  usage: {
    prompt_tokens: number,
    completion_tokens: number,
    total_tokens: number
  }
}
```

### Message Roles

OpenAI supports three message roles:

1. **system** (formerly "developer"): Set behavior and context
2. **user**: User input
3. **assistant**: Model responses

```typescript
const messages = [
  {
    role: 'system',
    content: 'You are a helpful assistant that explains complex topics simply.'
  },
  {
    role: 'user',
    content: 'Explain quantum computing to a 10-year-old.'
  }
];
```

### Multi-turn Conversations

Build conversation history by appending messages:

```typescript
const messages = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'What is TypeScript?' },
  { role: 'assistant', content: 'TypeScript is a superset of JavaScript...' },
  { role: 'user', content: 'How do I install it?' }
];

const completion = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: messages,
});
```

**Important**: Chat Completions API is **stateless**. You must send full conversation history with each request. For stateful conversations, use the `openai-responses` skill.

---

## GPT-5 Series Models

GPT-5 models (released August 2025) introduce new parameters and capabilities:

### Unique GPT-5 Parameters

#### reasoning_effort
Controls the depth of reasoning:
- **"minimal"**: Quick responses, less reasoning
- **"low"**: Basic reasoning
- **"medium"**: Balanced reasoning (default)
- **"high"**: Deep reasoning for complex problems

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [{ role: 'user', content: 'Solve this complex math problem...' }],
  reasoning_effort: 'high', // Deep reasoning
});
```

#### verbosity
Controls output length and detail:
- **"low"**: Concise responses
- **"medium"**: Balanced detail (default)
- **"high"**: Verbose, detailed responses

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [{ role: 'user', content: 'Explain quantum mechanics' }],
  verbosity: 'high', // Detailed explanation
});
```

### GPT-5 Limitations

**NOT Supported with GPT-5**:
- ❌ `temperature` parameter
- ❌ `top_p` parameter
- ❌ `logprobs` parameter
- ❌ Chain of Thought (CoT) persistence between turns

**If you need these features**:
- Use GPT-4o or GPT-4 Turbo for temperature/top_p/logprobs
- Use `openai-responses` skill for stateful CoT preservation

### GPT-5 vs GPT-4o Comparison

| Feature | GPT-5 | GPT-4o |
|---------|-------|--------|
| Reasoning control | ✅ reasoning_effort | ❌ |
| Verbosity control | ✅ verbosity | ❌ |
| Temperature | ❌ | ✅ |
| Top-p | ❌ | ✅ |
| Vision | ❌ | ✅ |
| Function calling | ✅ | ✅ |
| Streaming | ✅ | ✅ |

**When to use GPT-5**: Complex reasoning tasks, mathematical problems, logic puzzles, code generation
**When to use GPT-4o**: Vision tasks, when you need temperature control, multimodal inputs

---

## Streaming Patterns

Streaming allows real-time token-by-token delivery, improving perceived latency for long responses.

### Enable Streaming

Set `stream: true`:

```typescript
const stream = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true,
});
```

### Streaming with Node.js SDK

```typescript
import OpenAI from 'openai';

const openai = new OpenAI();

const stream = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [{ role: 'user', content: 'Write a poem about coding' }],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  process.stdout.write(content);
}
```

### Streaming with Fetch (Cloudflare Workers)

```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-5',
    messages: [{ role: 'user', content: 'Write a poem' }],
    stream: true,
  }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader!.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n').filter(line => line.trim() !== '');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;

      try {
        const json = JSON.parse(data);
        const content = json.choices[0]?.delta?.content || '';
        console.log(content);
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
}
```

### Server-Sent Events (SSE) Format

Streaming uses Server-Sent Events:

```
data: {"id":"chatcmpl-xyz","choices":[{"delta":{"role":"assistant"}}]}

data: {"id":"chatcmpl-xyz","choices":[{"delta":{"content":"Hello"}}]}

data: {"id":"chatcmpl-xyz","choices":[{"delta":{"content":" world"}}]}

data: {"id":"chatcmpl-xyz","choices":[{"finish_reason":"stop"}]}

data: [DONE]
```

### Streaming Best Practices

✅ **Always handle**:
- Incomplete chunks (buffer partial data)
- `[DONE]` signal
- Network errors and retries
- Invalid JSON (skip gracefully)

✅ **Performance**:
- Use streaming for responses >100 tokens
- Don't stream if you need the full response before processing

❌ **Don't**:
- Assume chunks are always complete JSON
- Forget to close the stream on errors
- Buffer entire response in memory (defeats streaming purpose)

---

## Function Calling

Function calling (also called "tool calling") allows models to invoke external functions/tools based on conversation context.

### Basic Tool Definition

```typescript
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City name, e.g., San Francisco'
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'Temperature unit'
          }
        },
        required: ['location']
      }
    }
  }
];
```

### Making a Request with Tools

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [
    { role: 'user', content: 'What is the weather in San Francisco?' }
  ],
  tools: tools,
});
```

### Handling Tool Calls

```typescript
const message = completion.choices[0].message;

if (message.tool_calls) {
  // Model wants to call a function
  for (const toolCall of message.tool_calls) {
    if (toolCall.function.name === 'get_weather') {
      const args = JSON.parse(toolCall.function.arguments);

      // Execute your function
      const weatherData = await getWeather(args.location, args.unit);

      // Send result back to model
      const followUp = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          ...messages,
          message, // Assistant's tool call
          {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(weatherData)
          }
        ],
        tools: tools,
      });
    }
  }
}
```

### Complete Function Calling Flow

```typescript
async function chatWithTools(userMessage: string) {
  let messages = [
    { role: 'user', content: userMessage }
  ];

  while (true) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: messages,
      tools: tools,
    });

    const message = completion.choices[0].message;
    messages.push(message);

    // If no tool calls, we're done
    if (!message.tool_calls) {
      return message.content;
    }

    // Execute all tool calls
    for (const toolCall of message.tool_calls) {
      const result = await executeFunction(toolCall.function.name, toolCall.function.arguments);

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });
    }
  }
}
```

### Multiple Tools

You can define multiple tools:

```typescript
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get weather for a location',
      parameters: { /* schema */ }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_web',
      description: 'Search the web',
      parameters: { /* schema */ }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculate',
      description: 'Perform calculations',
      parameters: { /* schema */ }
    }
  }
];
```

The model will choose which tool(s) to call based on the conversation.

---

## Structured Outputs

Structured outputs allow you to enforce JSON schema validation on model responses.

### Using JSON Schema

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o', // Note: Structured outputs best supported on GPT-4o
  messages: [
    { role: 'user', content: 'Generate a person profile' }
  ],
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'person_profile',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          skills: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['name', 'age', 'skills'],
        additionalProperties: false
      }
    }
  }
});

const person = JSON.parse(completion.choices[0].message.content);
// { name: "Alice", age: 28, skills: ["TypeScript", "React"] }
```

### JSON Mode (Simple)

For simpler use cases without strict schema validation:

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [
    { role: 'user', content: 'List 3 programming languages as JSON' }
  ],
  response_format: { type: 'json_object' }
});

const data = JSON.parse(completion.choices[0].message.content);
```

**Important**: When using `response_format`, include "JSON" in your prompt to guide the model.

---

## Vision (GPT-4o)

GPT-4o supports image understanding alongside text.

### Image via URL

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is in this image?' },
        {
          type: 'image_url',
          image_url: {
            url: 'https://example.com/image.jpg'
          }
        }
      ]
    }
  ]
});
```

### Image via Base64

```typescript
import fs from 'fs';

const imageBuffer = fs.readFileSync('./image.jpg');
const base64Image = imageBuffer.toString('base64');

const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe this image in detail' },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`
          }
        }
      ]
    }
  ]
});
```

### Multiple Images

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Compare these two images' },
        { type: 'image_url', image_url: { url: 'https://example.com/image1.jpg' } },
        { type: 'image_url', image_url: { url: 'https://example.com/image2.jpg' } }
      ]
    }
  ]
});
```

---

## Embeddings API

**Status**: ⏳ Phase 2 - To be completed in next session

*This section will cover*:
- text-embedding-3-small and text-embedding-3-large models
- Custom dimensions
- Batch processing
- RAG patterns
- Dimension reduction techniques

See `references/embeddings-guide.md` when complete.

---

## Images API

**Status**: ⏳ Phase 2 - To be completed in next session

*This section will cover*:
- DALL-E 3 image generation
- Quality settings (standard vs HD)
- Style options (vivid vs natural)
- Image editing
- Transparent backgrounds
- Compression options

See `references/images-guide.md` when complete.

---

## Audio API

**Status**: ⏳ Phase 2 - To be completed in next session

*This section will cover*:
- Whisper transcription
- Text-to-Speech (TTS) with 11 voices
- Audio format support
- Speed control
- Voice instructions (gpt-4o-mini-tts)
- Streaming audio

See `references/audio-guide.md` when complete.

---

## Moderation API

**Status**: ⏳ Phase 2 - To be completed in next session

*This section will cover*:
- Content safety categories
- Scoring thresholds
- Multi-modal moderation
- Batch moderation

See `references/moderation-guide.md` when complete.

---

## Error Handling

### Common HTTP Status Codes

- **200**: Success
- **400**: Bad Request (invalid parameters)
- **401**: Unauthorized (invalid API key)
- **429**: Rate Limit Exceeded
- **500**: Server Error
- **503**: Service Unavailable

### Rate Limit Error (429)

```typescript
try {
  const completion = await openai.chat.completions.create({ /* ... */ });
} catch (error) {
  if (error.status === 429) {
    // Rate limit exceeded - implement exponential backoff
    console.error('Rate limit exceeded. Retry after delay.');
  }
}
```

### Invalid API Key (401)

```typescript
try {
  const completion = await openai.chat.completions.create({ /* ... */ });
} catch (error) {
  if (error.status === 401) {
    console.error('Invalid API key. Check OPENAI_API_KEY environment variable.');
  }
}
```

### Exponential Backoff Pattern

```typescript
async function completionWithRetry(params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await openai.chat.completions.create(params);
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

---

## Rate Limits

### Understanding Rate Limits

OpenAI enforces rate limits based on:
- **RPM**: Requests Per Minute
- **TPM**: Tokens Per Minute
- **IPM**: Images Per Minute (for DALL-E)

Limits vary by:
- Usage tier (Free, Tier 1-5)
- Model (GPT-5 has different limits than GPT-4)
- Organization settings

### Checking Rate Limit Headers

```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ /* ... */ }),
});

console.log(response.headers.get('x-ratelimit-limit-requests'));
console.log(response.headers.get('x-ratelimit-remaining-requests'));
console.log(response.headers.get('x-ratelimit-reset-requests'));
```

### Best Practices

✅ **Implement exponential backoff** for 429 errors
✅ **Monitor rate limit headers** to avoid hitting limits
✅ **Batch requests** when possible (e.g., embeddings)
✅ **Use appropriate models** (don't use GPT-5 for simple tasks)
✅ **Cache responses** when appropriate

---

## Production Best Practices

### Security

✅ **Never expose API keys in client-side code**
```typescript
// ❌ Bad - API key in browser
const apiKey = 'sk-...'; // Visible to users!

// ✅ Good - Server-side proxy
// Client calls your backend, which calls OpenAI
```

✅ **Use environment variables**
```bash
export OPENAI_API_KEY="sk-..."
```

✅ **Implement server-side proxy for browser apps**
```typescript
// Your backend endpoint
app.post('/api/chat', async (req, res) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: req.body.messages,
  });
  res.json(completion);
});
```

### Performance

✅ **Use streaming** for long-form content (>100 tokens)
✅ **Set appropriate max_tokens** to control costs and latency
✅ **Cache responses** when queries are repeated
✅ **Choose appropriate models**:
- GPT-5-nano for simple tasks
- GPT-5 for complex reasoning
- GPT-4o for vision tasks

### Cost Optimization

✅ **Select right model**:
- gpt-5-nano: Cheapest, fastest
- gpt-5-mini: Balance of cost/quality
- gpt-5: Best quality, most expensive

✅ **Limit max_tokens**:
```typescript
{
  max_tokens: 500, // Don't generate more than needed
}
```

✅ **Use caching**:
```typescript
const cache = new Map();

async function getCachedCompletion(prompt) {
  if (cache.has(prompt)) {
    return cache.get(prompt);
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [{ role: 'user', content: prompt }],
  });

  cache.set(prompt, completion);
  return completion;
}
```

### Error Handling

✅ **Wrap all API calls** in try-catch
✅ **Provide user-friendly error messages**
✅ **Log errors** for debugging
✅ **Implement retries** for transient failures

```typescript
try {
  const completion = await openai.chat.completions.create({ /* ... */ });
} catch (error) {
  console.error('OpenAI API error:', error);

  // User-friendly message
  return {
    error: 'Sorry, I encountered an issue. Please try again.',
  };
}
```

---

## Relationship to openai-responses

### openai-api (This Skill)

**Traditional/stateless API** for:
- ✅ Simple chat completions
- ✅ Embeddings for RAG/search
- ✅ Images (DALL-E 3)
- ✅ Audio (Whisper/TTS)
- ✅ Content moderation
- ✅ One-off text generation
- ✅ Cloudflare Workers / edge deployment

**Characteristics**:
- Stateless (you manage conversation history)
- No built-in tools
- Maximum flexibility
- Works everywhere (Node.js, browsers, Workers, etc.)

### openai-responses Skill

**Stateful/agentic API** for:
- ✅ Automatic conversation state management
- ✅ Preserved reasoning (Chain of Thought) across turns
- ✅ Built-in tools (Code Interpreter, File Search, Web Search, Image Generation)
- ✅ MCP server integration
- ✅ Background mode for long tasks
- ✅ Polymorphic outputs

**Characteristics**:
- Stateful (OpenAI manages conversation)
- Built-in tools included
- Better for agentic workflows
- Higher-level abstraction

### When to Use Which?

| Use Case | Use openai-api | Use openai-responses |
|----------|----------------|---------------------|
| Simple chat | ✅ | ❌ |
| RAG/embeddings | ✅ | ❌ |
| Image generation | ✅ | ✅ |
| Audio processing | ✅ | ❌ |
| Agentic workflows | ❌ | ✅ |
| Multi-turn reasoning | ❌ | ✅ |
| Background tasks | ❌ | ✅ |
| Custom tools only | ✅ | ❌ |
| Built-in + custom tools | ❌ | ✅ |

**Use both**: Many apps use openai-api for embeddings/images/audio and openai-responses for conversational agents.

---

## Dependencies

### Package Installation

```bash
npm install openai@6.7.0
```

### TypeScript Types

Fully typed with included TypeScript definitions:

```typescript
import OpenAI from 'openai';
import type { ChatCompletionMessage, ChatCompletionCreateParams } from 'openai/resources/chat';
```

### Required Environment Variables

```bash
OPENAI_API_KEY=sk-...
```

---

## Official Documentation

### Core APIs
- **Chat Completions**: https://platform.openai.com/docs/api-reference/chat/create
- **Embeddings**: https://platform.openai.com/docs/api-reference/embeddings
- **Images**: https://platform.openai.com/docs/api-reference/images
- **Audio**: https://platform.openai.com/docs/api-reference/audio
- **Moderation**: https://platform.openai.com/docs/api-reference/moderations

### Guides
- **GPT-5 Guide**: https://platform.openai.com/docs/guides/latest-model
- **Function Calling**: https://platform.openai.com/docs/guides/function-calling
- **Structured Outputs**: https://platform.openai.com/docs/guides/structured-outputs
- **Vision**: https://platform.openai.com/docs/guides/vision
- **Rate Limits**: https://platform.openai.com/docs/guides/rate-limits
- **Error Codes**: https://platform.openai.com/docs/guides/error-codes

### SDKs
- **Node.js SDK**: https://github.com/openai/openai-node
- **Python SDK**: https://github.com/openai/openai-python

---

## What's Next?

**Phase 1 Complete** ✅:
- Chat Completions API fully documented
- GPT-5 series coverage
- Streaming patterns
- Function calling basics
- Core templates available

**Phase 2 Tasks** ⏳:
1. Complete Embeddings API section
2. Complete Images API section
3. Complete Audio API section
4. Complete Moderation API section
5. Add remaining templates (9 more)
6. Add remaining reference docs (7 more)
7. Final testing and validation

See `/planning/research-logs/openai-api.md` for complete research notes.

---

**Production Ready**: Phase 1 (Chat Completions) ✅
**Full Completion**: Phase 2 (next session)
**Estimated Time**: 3-4 hours for Phase 2
