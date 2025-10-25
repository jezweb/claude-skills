---
name: Google Gemini API
description: |
  Complete guide for Google Gemini API using the CORRECT current SDK (@google/genai v1.27+, NOT the
  deprecated @google/generative-ai). Covers text generation, multimodal inputs (text + images + video +
  audio + PDFs), function calling, thinking mode, streaming, and system instructions with accurate 2025
  model information (Gemini 2.5 Pro/Flash/Flash-Lite with 1M input tokens, NOT 2M).

  Use when: integrating Gemini API, implementing multimodal AI applications, using thinking mode for
  complex reasoning, function calling with parallel execution, streaming responses, deploying to
  Cloudflare Workers, building chat applications, or encountering SDK deprecation warnings, context window
  errors, model not found errors, function calling failures, or multimodal format errors.

  Keywords: gemini api, @google/genai, gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite,
  multimodal gemini, thinking mode, google ai, genai sdk, function calling gemini, streaming gemini,
  gemini vision, gemini video, gemini audio, gemini pdf, system instructions, multi-turn chat,
  DEPRECATED @google/generative-ai, gemini context window, gemini models 2025, gemini 1m tokens,
  gemini tool use, parallel function calling, compositional function calling
license: MIT
---

# Google Gemini API - Complete Guide

**Version**: Phase 2 Complete ✅
**Package**: @google/genai@1.27.0 (⚠️ NOT @google/generative-ai)
**Last Updated**: 2025-10-25

---

## ⚠️ CRITICAL SDK MIGRATION WARNING

**DEPRECATED SDK**: `@google/generative-ai` (sunset November 30, 2025)
**CURRENT SDK**: `@google/genai` v1.27+

**If you see code using `@google/generative-ai`, it's outdated!**

This skill uses the **correct current SDK** and provides a complete migration guide.

---

## Status

**✅ Phase 1 Complete**:
- ✅ Text Generation (basic + streaming)
- ✅ Multimodal Inputs (images, video, audio, PDFs)
- ✅ Function Calling (basic + parallel execution)
- ✅ System Instructions & Multi-turn Chat
- ✅ Thinking Mode Configuration
- ✅ Generation Parameters (temperature, top-p, top-k, stop sequences)
- ✅ Both Node.js SDK (@google/genai) and fetch approaches

**✅ Phase 2 Complete**:
- ✅ Context Caching (cost optimization with TTL-based caching)
- ✅ Code Execution (built-in Python interpreter and sandbox)
- ✅ Grounding with Google Search (real-time web information + citations)

**📦 Separate Skills**:
- **Embeddings**: See `google-gemini-embeddings` skill for text-embedding-004

---

## Table of Contents

**Phase 1 - Core Features**:
1. [Quick Start](#quick-start)
2. [Current Models (2025)](#current-models-2025)
3. [SDK vs Fetch Approaches](#sdk-vs-fetch-approaches)
4. [Text Generation](#text-generation)
5. [Streaming](#streaming)
6. [Multimodal Inputs](#multimodal-inputs)
7. [Function Calling](#function-calling)
8. [System Instructions](#system-instructions)
9. [Multi-turn Chat](#multi-turn-chat)
10. [Thinking Mode](#thinking-mode)
11. [Generation Configuration](#generation-configuration)

**Phase 2 - Advanced Features**:
12. [Context Caching](#context-caching)
13. [Code Execution](#code-execution)
14. [Grounding with Google Search](#grounding-with-google-search)

**Common Reference**:
15. [Error Handling](#error-handling)
16. [Rate Limits](#rate-limits)
17. [SDK Migration Guide](#sdk-migration-guide)
18. [Production Best Practices](#production-best-practices)

---

## Quick Start

### Installation

**CORRECT SDK:**
```bash
npm install @google/genai@1.27.0
```

**❌ WRONG (DEPRECATED):**
```bash
npm install @google/generative-ai  # DO NOT USE!
```

### Environment Setup

```bash
export GEMINI_API_KEY="..."
```

Or create `.env` file:
```
GEMINI_API_KEY=...
```

### First Text Generation (Node.js SDK)

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Explain quantum computing in simple terms'
});

console.log(response.text);
```

### First Text Generation (Fetch - Cloudflare Workers)

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Explain quantum computing in simple terms' }] }]
    }),
  }
);

const data = await response.json();
console.log(data.candidates[0].content.parts[0].text);
```

---

## Current Models (2025)

### Gemini 2.5 Series (General Availability)

#### gemini-2.5-pro
- **Context**: 1,048,576 input tokens / 65,536 output tokens
- **Description**: State-of-the-art thinking model for complex reasoning
- **Best for**: Code, math, STEM, complex problem-solving
- **Features**: Thinking mode (default on), function calling, multimodal, streaming
- **Knowledge cutoff**: January 2025

#### gemini-2.5-flash
- **Context**: 1,048,576 input tokens / 65,536 output tokens
- **Description**: Best price-performance workhorse model
- **Best for**: Large-scale processing, low-latency, high-volume, agentic use cases
- **Features**: Thinking mode (default on), function calling, multimodal, streaming
- **Knowledge cutoff**: January 2025

#### gemini-2.5-flash-lite
- **Context**: 1,048,576 input tokens / 65,536 output tokens
- **Description**: Cost-optimized, fastest 2.5 model
- **Best for**: High throughput, cost-sensitive applications
- **Features**: Thinking mode (default on), multimodal, streaming
- **⚠️ Limitations**: **NO function calling support**
- **Knowledge cutoff**: January 2025

### Model Feature Matrix

| Feature | Pro | Flash | Flash-Lite |
|---------|-----|-------|------------|
| Thinking Mode | ✅ Default ON | ✅ Default ON | ✅ Default ON |
| Function Calling | ✅ | ✅ | ❌ **NOT SUPPORTED** |
| Multimodal | ✅ | ✅ | ✅ |
| Streaming | ✅ | ✅ | ✅ |
| System Instructions | ✅ | ✅ | ✅ |
| Context Window | 1,048,576 in | 1,048,576 in | 1,048,576 in |
| Output Tokens | 65,536 max | 65,536 max | 65,536 max |

### ⚠️ Context Window Correction

**ACCURATE**: Gemini 2.5 models support **1,048,576 input tokens** (NOT 2M!)
**OUTDATED**: Only Gemini 1.5 Pro (previous generation) had 2M token context window

**Common mistake**: Claiming Gemini 2.5 has 2M tokens. It doesn't. This skill prevents this error.

---

## SDK vs Fetch Approaches

### Node.js SDK (@google/genai)

**Pros:**
- Type-safe with TypeScript
- Easier API (simpler syntax)
- Built-in chat helpers
- Automatic SSE parsing for streaming
- Better error handling

**Cons:**
- Requires Node.js or compatible runtime
- Larger bundle size
- May not work in all edge runtimes

**Use when:** Building Node.js apps, Next.js Server Actions/Components, or any environment with Node.js compatibility

### Fetch-based (Direct REST API)

**Pros:**
- Works in **any** JavaScript environment (Cloudflare Workers, Deno, Bun, browsers)
- Minimal dependencies
- Smaller bundle size
- Full control over requests

**Cons:**
- More verbose syntax
- Manual SSE parsing for streaming
- No built-in chat helpers
- Manual error handling

**Use when:** Deploying to Cloudflare Workers, browser clients, or lightweight edge runtimes

---

## Text Generation

### Basic Text Generation (SDK)

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Write a haiku about artificial intelligence'
});

console.log(response.text);
```

### Basic Text Generation (Fetch)

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: 'Write a haiku about artificial intelligence' }
          ]
        }
      ]
    }),
  }
);

const data = await response.json();
console.log(data.candidates[0].content.parts[0].text);
```

### Response Structure

```typescript
{
  text: string,                  // Convenience accessor for text content
  candidates: [
    {
      content: {
        parts: [
          { text: string }       // Generated text
        ],
        role: string             // "model"
      },
      finishReason: string,      // "STOP" | "MAX_TOKENS" | "SAFETY" | "OTHER"
      index: number
    }
  ],
  usageMetadata: {
    promptTokenCount: number,
    candidatesTokenCount: number,
    totalTokenCount: number
  }
}
```

---

## Streaming

### Streaming with SDK (Async Iteration)

```typescript
const response = await ai.models.generateContentStream({
  model: 'gemini-2.5-flash',
  contents: 'Write a 200-word story about time travel'
});

for await (const chunk of response) {
  process.stdout.write(chunk.text);
}
```

### Streaming with Fetch (SSE Parsing)

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Write a 200-word story about time travel' }] }]
    }),
  }
);

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (line.trim() === '' || line.startsWith('data: [DONE]')) continue;
    if (!line.startsWith('data: ')) continue;

    try {
      const data = JSON.parse(line.slice(6));
      const text = data.candidates[0]?.content?.parts[0]?.text;
      if (text) {
        process.stdout.write(text);
      }
    } catch (e) {
      // Skip invalid JSON
    }
  }
}
```

**Key Points:**
- Use `streamGenerateContent` endpoint (not `generateContent`)
- Parse Server-Sent Events (SSE) format: `data: {json}\n\n`
- Handle incomplete chunks in buffer
- Skip empty lines and `[DONE]` markers

---

## Multimodal Inputs

Gemini 2.5 models support text + images + video + audio + PDFs in the same request.

### Images (Vision)

#### SDK Approach

```typescript
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// From file
const imageData = fs.readFileSync('/path/to/image.jpg');
const base64Image = imageData.toString('base64');

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [
    {
      parts: [
        { text: 'What is in this image?' },
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg'
          }
        }
      ]
    }
  ]
});

console.log(response.text);
```

#### Fetch Approach

```typescript
const imageData = fs.readFileSync('/path/to/image.jpg');
const base64Image = imageData.toString('base64');

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: 'What is in this image?' },
            {
              inlineData: {
                data: base64Image,
                mimeType: 'image/jpeg'
              }
            }
          ]
        }
      ]
    }),
  }
);

const data = await response.json();
console.log(data.candidates[0].content.parts[0].text);
```

**Supported Image Formats:**
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)
- HEIC (`.heic`)
- HEIF (`.heif`)

**Max Image Size**: 20MB per image

### Video

```typescript
// Video must be < 2 minutes for inline data
const videoData = fs.readFileSync('/path/to/video.mp4');
const base64Video = videoData.toString('base64');

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [
    {
      parts: [
        { text: 'Describe what happens in this video' },
        {
          inlineData: {
            data: base64Video,
            mimeType: 'video/mp4'
          }
        }
      ]
    }
  ]
});

console.log(response.text);
```

**Supported Video Formats:**
- MP4 (`.mp4`)
- MPEG (`.mpeg`)
- MOV (`.mov`)
- AVI (`.avi`)
- FLV (`.flv`)
- MPG (`.mpg`)
- WebM (`.webm`)
- WMV (`.wmv`)

**Max Video Length (inline)**: 2 minutes
**Max Video Size**: 2GB (use File API for larger files - Phase 2)

### Audio

```typescript
const audioData = fs.readFileSync('/path/to/audio.mp3');
const base64Audio = audioData.toString('base64');

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [
    {
      parts: [
        { text: 'Transcribe and summarize this audio' },
        {
          inlineData: {
            data: base64Audio,
            mimeType: 'audio/mp3'
          }
        }
      ]
    }
  ]
});

console.log(response.text);
```

**Supported Audio Formats:**
- MP3 (`.mp3`)
- WAV (`.wav`)
- FLAC (`.flac`)
- AAC (`.aac`)
- OGG (`.ogg`)
- OPUS (`.opus`)

**Max Audio Size**: 20MB

### PDFs

```typescript
const pdfData = fs.readFileSync('/path/to/document.pdf');
const base64Pdf = pdfData.toString('base64');

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [
    {
      parts: [
        { text: 'Summarize the key points in this PDF' },
        {
          inlineData: {
            data: base64Pdf,
            mimeType: 'application/pdf'
          }
        }
      ]
    }
  ]
});

console.log(response.text);
```

**Max PDF Size**: 30MB
**PDF Limitations**: Text-based PDFs work best; scanned images may have lower accuracy

### Multiple Inputs

You can combine multiple modalities in one request:

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [
    {
      parts: [
        { text: 'Compare these two images and describe the differences:' },
        { inlineData: { data: base64Image1, mimeType: 'image/jpeg' } },
        { inlineData: { data: base64Image2, mimeType: 'image/jpeg' } }
      ]
    }
  ]
});
```

---

## Function Calling

Gemini supports function calling (tool use) to connect models with external APIs and systems.

**⚠️ Important**: Gemini 2.5 Flash-Lite does **NOT** support function calling!

### Basic Function Calling (SDK)

```typescript
import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Define function declarations
const getCurrentWeather = {
  name: 'get_current_weather',
  description: 'Get the current weather for a location',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name, e.g. San Francisco'
      },
      unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit']
      }
    },
    required: ['location']
  }
};

// Make request with tools
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'What\'s the weather in Tokyo?',
  config: {
    tools: [
      { functionDeclarations: [getCurrentWeather] }
    ]
  }
});

// Check if model wants to call a function
const functionCall = response.candidates[0].content.parts[0].functionCall;

if (functionCall) {
  console.log('Function to call:', functionCall.name);
  console.log('Arguments:', functionCall.args);

  // Execute the function (your implementation)
  const weatherData = await fetchWeather(functionCall.args.location);

  // Send function result back to model
  const finalResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      'What\'s the weather in Tokyo?',
      response.candidates[0].content, // Original assistant response with function call
      {
        parts: [
          {
            functionResponse: {
              name: functionCall.name,
              response: weatherData
            }
          }
        ]
      }
    ],
    config: {
      tools: [
        { functionDeclarations: [getCurrentWeather] }
      ]
    }
  });

  console.log(finalResponse.text);
}
```

### Function Calling (Fetch)

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        { parts: [{ text: 'What\'s the weather in Tokyo?' }] }
      ],
      tools: [
        {
          functionDeclarations: [
            {
              name: 'get_current_weather',
              description: 'Get the current weather for a location',
              parameters: {
                type: 'object',
                properties: {
                  location: {
                    type: 'string',
                    description: 'City name'
                  }
                },
                required: ['location']
              }
            }
          ]
        }
      ]
    }),
  }
);

const data = await response.json();
const functionCall = data.candidates[0]?.content?.parts[0]?.functionCall;

if (functionCall) {
  // Execute function and send result back (same flow as SDK)
}
```

### Parallel Function Calling

Gemini can call multiple independent functions simultaneously:

```typescript
const tools = [
  {
    functionDeclarations: [
      {
        name: 'get_weather',
        description: 'Get weather for a location',
        parametersJsonSchema: {
          type: 'object',
          properties: {
            location: { type: 'string' }
          },
          required: ['location']
        }
      },
      {
        name: 'get_population',
        description: 'Get population of a city',
        parametersJsonSchema: {
          type: 'object',
          properties: {
            city: { type: 'string' }
          },
          required: ['city']
        }
      }
    ]
  }
];

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'What is the weather and population of Tokyo?',
  config: { tools }
});

// Model may return MULTIPLE function calls in parallel
const functionCalls = response.candidates[0].content.parts.filter(
  part => part.functionCall
);

console.log(`Model wants to call ${functionCalls.length} functions in parallel`);
```

### Function Calling Modes

```typescript
import { FunctionCallingConfigMode } from '@google/genai';

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'What\'s the weather?',
  config: {
    tools: [{ functionDeclarations: [getCurrentWeather] }],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.ANY, // Force function call
        // mode: FunctionCallingConfigMode.AUTO, // Model decides (default)
        // mode: FunctionCallingConfigMode.NONE, // Never call functions
        allowedFunctionNames: ['get_current_weather'] // Optional: restrict to specific functions
      }
    }
  }
});
```

**Modes:**
- `AUTO` (default): Model decides whether to call functions
- `ANY`: Force model to call at least one function
- `NONE`: Disable function calling for this request

---

## System Instructions

System instructions guide the model's behavior and set context. They are **separate** from the conversation messages.

### SDK Approach

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  systemInstruction: 'You are a helpful AI assistant that always responds in the style of a pirate. Use nautical terminology and end sentences with "arrr".',
  contents: 'Explain what a database is'
});

console.log(response.text);
// Output: "Ahoy there! A database be like a treasure chest..."
```

### Fetch Approach

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          { text: 'You are a helpful AI assistant that always responds in the style of a pirate.' }
        ]
      },
      contents: [
        { parts: [{ text: 'Explain what a database is' }] }
      ]
    }),
  }
);
```

**Key Points:**
- System instructions are **NOT** part of `contents` array
- They are set once at the **top level** of the request
- They persist for the entire conversation (when using multi-turn chat)
- They don't count as user or model messages

---

## Multi-turn Chat

For conversations with history, use the SDK's chat helpers or manually manage conversation state.

### SDK Chat Helpers (Recommended)

```typescript
const chat = await ai.models.createChat({
  model: 'gemini-2.5-flash',
  systemInstruction: 'You are a helpful coding assistant.',
  history: [] // Start empty or with previous messages
});

// Send first message
const response1 = await chat.sendMessage('What is TypeScript?');
console.log('Assistant:', response1.text);

// Send follow-up (context is automatically maintained)
const response2 = await chat.sendMessage('How do I install it?');
console.log('Assistant:', response2.text);

// Get full chat history
const history = chat.getHistory();
console.log('Full conversation:', history);
```

### Manual Chat Management (Fetch)

```typescript
const conversationHistory = [];

// First turn
const response1 = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: 'What is TypeScript?' }]
        }
      ]
    }),
  }
);

const data1 = await response1.json();
const assistantReply1 = data1.candidates[0].content.parts[0].text;

// Add to history
conversationHistory.push(
  { role: 'user', parts: [{ text: 'What is TypeScript?' }] },
  { role: 'model', parts: [{ text: assistantReply1 }] }
);

// Second turn (include full history)
const response2 = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        ...conversationHistory,
        { role: 'user', parts: [{ text: 'How do I install it?' }] }
      ]
    }),
  }
);
```

**Message Roles:**
- `user`: User messages
- `model`: Assistant responses

**⚠️ Important**: Chat helpers are **SDK-only**. With fetch, you must manually manage conversation history.

---

## Thinking Mode

Gemini 2.5 models have **thinking mode enabled by default** for enhanced quality. You can configure the thinking budget.

### Configure Thinking Budget (SDK)

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Solve this complex math problem: ...',
  config: {
    thinkingConfig: {
      thinkingBudget: 8192 // Max tokens for thinking (default: model-dependent)
    }
  }
});
```

### Configure Thinking Budget (Fetch)

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Solve this complex math problem: ...' }] }],
      generationConfig: {
        thinkingConfig: {
          thinkingBudget: 8192
        }
      }
    }),
  }
);
```

**Key Points:**
- Thinking mode is **always enabled** on Gemini 2.5 models (cannot be disabled)
- Higher thinking budgets allow more internal reasoning (may increase latency)
- Default budget varies by model (usually sufficient for most tasks)
- Only increase budget for very complex reasoning tasks

---

## Generation Configuration

Customize model behavior with generation parameters.

### All Configuration Options (SDK)

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Write a creative story',
  config: {
    temperature: 0.9,           // Randomness (0.0-2.0, default: 1.0)
    topP: 0.95,                 // Nucleus sampling (0.0-1.0)
    topK: 40,                   // Top-k sampling
    maxOutputTokens: 2048,      // Max tokens to generate
    stopSequences: ['END'],     // Stop generation if these appear
    responseMimeType: 'text/plain', // Or 'application/json' for JSON mode
    candidateCount: 1           // Number of response candidates (usually 1)
  }
});
```

### All Configuration Options (Fetch)

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Write a creative story' }] }],
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
        stopSequences: ['END'],
        responseMimeType: 'text/plain',
        candidateCount: 1
      }
    }),
  }
);
```

### Parameter Guidelines

| Parameter | Range | Default | Use Case |
|-----------|-------|---------|----------|
| **temperature** | 0.0-2.0 | 1.0 | Lower = more focused, higher = more creative |
| **topP** | 0.0-1.0 | 0.95 | Nucleus sampling threshold |
| **topK** | 1-100+ | 40 | Limit to top K tokens |
| **maxOutputTokens** | 1-65536 | Model max | Control response length |
| **stopSequences** | Array | None | Stop generation at specific strings |

**Tips:**
- For **factual tasks**: Use low temperature (0.0-0.3)
- For **creative tasks**: Use high temperature (0.7-1.5)
- **topP** and **topK** both control randomness; use one or the other (not both)
- Always set **maxOutputTokens** to prevent excessive generation

---

## Context Caching

Context caching allows you to cache frequently used content (like system instructions, large documents, or video files) to reduce costs by **up to 90%** and improve latency.

### How It Works

1. **Create a cache** with your repeated content
2. **Reference the cache** in subsequent requests
3. **Save tokens** - cached tokens cost significantly less
4. **TTL management** - caches expire after specified time

### Benefits

- **Cost savings**: Up to 90% reduction on cached tokens
- **Reduced latency**: Faster responses by reusing processed content
- **Consistent context**: Same large context across multiple requests

### Cache Creation (SDK)

```typescript
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Create a cache for a large document
const documentText = fs.readFileSync('./large-document.txt', 'utf-8');

const cache = await ai.caches.create({
  model: 'gemini-2.5-flash',
  config: {
    displayName: 'large-doc-cache', // Identifier for the cache
    systemInstruction: 'You are an expert at analyzing legal documents.',
    contents: documentText,
    ttl: '3600s', // Cache for 1 hour
  }
});

console.log('Cache created:', cache.name);
console.log('Expires at:', cache.expireTime);
```

### Cache Creation (Fetch)

```typescript
const response = await fetch(
  'https://generativelanguage.googleapis.com/v1beta/cachedContents',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      model: 'models/gemini-2.5-flash',
      displayName: 'large-doc-cache',
      systemInstruction: {
        parts: [{ text: 'You are an expert at analyzing legal documents.' }]
      },
      contents: [
        { parts: [{ text: documentText }] }
      ],
      ttl: '3600s'
    }),
  }
);

const cache = await response.json();
console.log('Cache created:', cache.name);
```

### Using a Cache (SDK)

```typescript
// Generate content using the cache
const response = await ai.models.generateContent({
  model: cache.name, // Use cache name as model
  contents: 'Summarize the key points in the document'
});

console.log(response.text);
```

### Using a Cache (Fetch)

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/${cache.name}:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        { parts: [{ text: 'Summarize the key points in the document' }] }
      ]
    }),
  }
);

const data = await response.json();
console.log(data.candidates[0].content.parts[0].text);
```

### Update Cache TTL (SDK)

```typescript
import { UpdateCachedContentConfig } from '@google/genai';

await ai.caches.update({
  name: cache.name,
  config: {
    ttl: '7200s' // Extend to 2 hours
  }
});
```

### Update Cache with Expiration Time (SDK)

```typescript
// Set specific expiration time (must be timezone-aware)
const in10Minutes = new Date(Date.now() + 10 * 60 * 1000);

await ai.caches.update({
  name: cache.name,
  config: {
    expireTime: in10Minutes
  }
});
```

### List and Delete Caches (SDK)

```typescript
// List all caches
const caches = await ai.caches.list();
for (const cache of caches) {
  console.log(cache.name, cache.displayName);
}

// Delete a specific cache
await ai.caches.delete({ name: cache.name });
```

### Caching with Video Files

```typescript
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Upload video file
const videoFile = await ai.files.upload({
  file: fs.createReadStream('./video.mp4')
});

// Wait for processing
while (videoFile.state.name === 'PROCESSING') {
  await new Promise(resolve => setTimeout(resolve, 2000));
  videoFile = await ai.files.get({ name: videoFile.name });
}

// Create cache with video
const cache = await ai.caches.create({
  model: 'gemini-2.5-flash',
  config: {
    displayName: 'video-analysis-cache',
    systemInstruction: 'You are an expert video analyzer.',
    contents: [videoFile],
    ttl: '300s' // 5 minutes
  }
});

// Use cache for multiple queries
const response1 = await ai.models.generateContent({
  model: cache.name,
  contents: 'What happens in the first minute?'
});

const response2 = await ai.models.generateContent({
  model: cache.name,
  contents: 'Describe the main characters'
});
```

### Key Points

**When to Use Caching:**
- Large system instructions used repeatedly
- Long documents analyzed multiple times
- Video/audio files queried with different prompts
- Consistent context across conversation sessions

**TTL Guidelines:**
- Short sessions: 300s (5 min) to 3600s (1 hour)
- Long sessions: 3600s (1 hour) to 86400s (24 hours)
- Maximum: 7 days

**Cost Savings:**
- Cached input tokens: ~90% cheaper than regular tokens
- Output tokens: Same price (not cached)

**Important:**
- You must use explicit model version suffixes (e.g., `gemini-2.5-flash-001`, NOT just `gemini-2.5-flash`)
- Caches are automatically deleted after TTL expires
- Update TTL before expiration to extend cache lifetime

---

## Code Execution

Gemini models can generate and execute Python code to solve problems requiring computation, data analysis, or visualization.

### How It Works

1. Model generates executable Python code
2. Code runs in secure sandbox
3. Results are returned to the model
4. Model incorporates results into response

### Supported Operations

- Mathematical calculations
- Data analysis and statistics
- File processing (CSV, JSON, etc.)
- Chart and graph generation
- Algorithm implementation
- Data transformations

### Available Python Packages

**Standard Library:**
- `math`, `statistics`, `random`, `datetime`, `json`, `csv`, `re`
- `collections`, `itertools`, `functools`

**Data Science:**
- `numpy`, `pandas`, `scipy`

**Visualization:**
- `matplotlib`, `seaborn`

**Note**: Limited package availability compared to full Python environment

### Basic Code Execution (SDK)

```typescript
import { GoogleGenAI, Tool, ToolCodeExecution } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'What is the sum of the first 50 prime numbers? Generate and run code for the calculation.',
  config: {
    tools: [{ codeExecution: {} }]
  }
});

// Parse response parts
for (const part of response.candidates[0].content.parts) {
  if (part.text) {
    console.log('Text:', part.text);
  }
  if (part.executableCode) {
    console.log('Generated Code:', part.executableCode.code);
  }
  if (part.codeExecutionResult) {
    console.log('Execution Output:', part.codeExecutionResult.output);
  }
}
```

### Basic Code Execution (Fetch)

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      tools: [{ code_execution: {} }],
      contents: [
        {
          parts: [
            { text: 'What is the sum of the first 50 prime numbers? Generate and run code.' }
          ]
        }
      ]
    }),
  }
);

const data = await response.json();

for (const part of data.candidates[0].content.parts) {
  if (part.text) {
    console.log('Text:', part.text);
  }
  if (part.executableCode) {
    console.log('Code:', part.executableCode.code);
  }
  if (part.codeExecutionResult) {
    console.log('Result:', part.codeExecutionResult.output);
  }
}
```

### Chat with Code Execution (SDK)

```typescript
const chat = await ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    tools: [{ codeExecution: {} }]
  }
});

let response = await chat.sendMessage('I have a math question for you.');
console.log(response.text);

response = await chat.sendMessage(
  'Calculate the Fibonacci sequence up to the 20th number and sum them.'
);

// Model will generate and execute code, then provide answer
for (const part of response.candidates[0].content.parts) {
  if (part.text) console.log(part.text);
  if (part.executableCode) console.log('Code:', part.executableCode.code);
  if (part.codeExecutionResult) console.log('Output:', part.codeExecutionResult.output);
}
```

### Data Analysis Example

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: `
    Analyze this sales data and calculate:
    1. Total revenue
    2. Average sale price
    3. Best-selling month

    Data (CSV format):
    month,sales,revenue
    Jan,150,45000
    Feb,200,62000
    Mar,175,53000
    Apr,220,68000
  `,
  config: {
    tools: [{ codeExecution: {} }]
  }
});

// Model will generate pandas/numpy code to analyze data
for (const part of response.candidates[0].content.parts) {
  if (part.text) console.log(part.text);
  if (part.executableCode) console.log('Analysis Code:', part.executableCode.code);
  if (part.codeExecutionResult) console.log('Results:', part.codeExecutionResult.output);
}
```

### Visualization Example

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Create a bar chart showing the distribution of prime numbers under 100 by their last digit. Generate the chart and describe the pattern.',
  config: {
    tools: [{ codeExecution: {} }]
  }
});

// Model generates matplotlib code, executes it, and describes results
for (const part of response.candidates[0].content.parts) {
  if (part.text) console.log(part.text);
  if (part.executableCode) console.log('Chart Code:', part.executableCode.code);
  if (part.codeExecutionResult) {
    // Note: Chart image data would be in output
    console.log('Execution completed');
  }
}
```

### Response Structure

```typescript
{
  candidates: [
    {
      content: {
        parts: [
          { text: "I'll calculate that for you." },
          {
            executableCode: {
              language: "PYTHON",
              code: "def is_prime(n):\n  if n <= 1:\n    return False\n  ..."
            }
          },
          {
            codeExecutionResult: {
              outcome: "OUTCOME_OK", // or "OUTCOME_FAILED"
              output: "5117\n"
            }
          },
          { text: "The sum of the first 50 prime numbers is 5117." }
        ]
      }
    }
  ]
}
```

### Error Handling

```typescript
for (const part of response.candidates[0].content.parts) {
  if (part.codeExecutionResult) {
    if (part.codeExecutionResult.outcome === 'OUTCOME_FAILED') {
      console.error('Code execution failed:', part.codeExecutionResult.output);
    } else {
      console.log('Success:', part.codeExecutionResult.output);
    }
  }
}
```

### Key Points

**When to Use Code Execution:**
- Complex mathematical calculations
- Data analysis and statistics
- Algorithm implementations
- File parsing and processing
- Chart generation
- Computational problems

**Limitations:**
- Sandbox environment (limited file system access)
- Limited Python package availability
- Execution timeout limits
- No network access from code
- No persistent state between executions

**Best Practices:**
- Specify what calculation or analysis you need clearly
- Request code generation explicitly ("Generate and run code...")
- Check `outcome` field for errors
- Use for deterministic computations, not for general programming

**Important:**
- Code Execution is NOT available on `gemini-2.5-flash-lite`
- Only works with Gemini 2.5 models (Pro, Flash)
- Code runs in isolated sandbox for security

---

## Grounding with Google Search

Grounding connects the model to real-time web information, reducing hallucinations and providing up-to-date, fact-checked responses with citations.

### How It Works

1. Model determines if it needs current information
2. Automatically performs Google Search
3. Processes search results
4. Incorporates findings into response
5. Provides citations and source URLs

### Benefits

- **Real-time information**: Access to current events and data
- **Reduced hallucinations**: Answers grounded in web sources
- **Verifiable**: Citations allow fact-checking
- **Up-to-date**: Not limited to model's training cutoff

### Two Grounding APIs

#### 1. Google Search (`googleSearch`) - Recommended for Gemini 2.5

```typescript
const groundingTool = {
  googleSearch: {}
};
```

**Features:**
- Simple configuration
- Automatic search when needed
- Available on all Gemini 2.5 models

#### 2. Google Search Retrieval (`googleSearchRetrieval`) - Legacy (Gemini 1.5)

```typescript
const retrievalTool = {
  googleSearchRetrieval: {
    dynamicRetrievalConfig: {
      mode: 'MODE_DYNAMIC',
      dynamicThreshold: 0.7 // Only search if confidence < 70%
    }
  }
};
```

**Features:**
- Dynamic threshold control
- Used with Gemini 1.5 models
- More configuration options

### Basic Grounding (SDK) - Gemini 2.5

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Who won the euro 2024?',
  config: {
    tools: [{ googleSearch: {} }]
  }
});

console.log(response.text);

// Check if grounding was used
if (response.candidates[0].groundingMetadata) {
  console.log('Search was performed!');
  console.log('Sources:', response.candidates[0].groundingMetadata);
}
```

### Basic Grounding (Fetch) - Gemini 2.5

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        { parts: [{ text: 'Who won the euro 2024?' }] }
      ],
      tools: [
        { google_search: {} }
      ]
    }),
  }
);

const data = await response.json();
console.log(data.candidates[0].content.parts[0].text);

if (data.candidates[0].groundingMetadata) {
  console.log('Grounding metadata:', data.candidates[0].groundingMetadata);
}
```

### Dynamic Retrieval (SDK) - Gemini 1.5

```typescript
import { GoogleGenAI, DynamicRetrievalConfigMode } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: 'gemini-1.5-flash',
  contents: 'Who won the euro 2024?',
  config: {
    tools: [
      {
        googleSearchRetrieval: {
          dynamicRetrievalConfig: {
            mode: DynamicRetrievalConfigMode.MODE_DYNAMIC,
            dynamicThreshold: 0.7 // Search only if confidence < 70%
          }
        }
      }
    ]
  }
});

console.log(response.text);

if (!response.candidates[0].groundingMetadata) {
  console.log('Model answered from its own knowledge (high confidence)');
}
```

### Grounding Metadata Structure

```typescript
{
  groundingMetadata: {
    searchQueries: [
      { text: "euro 2024 winner" }
    ],
    webPages: [
      {
        url: "https://example.com/euro-2024-results",
        title: "UEFA Euro 2024 Final Results",
        snippet: "Spain won UEFA Euro 2024..."
      }
    ],
    citations: [
      {
        startIndex: 42,
        endIndex: 47,
        uri: "https://example.com/euro-2024-results"
      }
    ],
    retrievalQueries: [
      {
        query: "who won euro 2024 final"
      }
    ]
  }
}
```

### Chat with Grounding (SDK)

```typescript
const chat = await ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    tools: [{ googleSearch: {} }]
  }
});

let response = await chat.sendMessage('What are the latest developments in quantum computing?');
console.log(response.text);

// Check grounding sources
if (response.candidates[0].groundingMetadata) {
  const sources = response.candidates[0].groundingMetadata.webPages || [];
  console.log(`Sources used: ${sources.length}`);
  sources.forEach(source => {
    console.log(`- ${source.title}: ${source.url}`);
  });
}

// Follow-up still has grounding enabled
response = await chat.sendMessage('Which company made the biggest breakthrough?');
console.log(response.text);
```

### Combining Grounding with Function Calling

```typescript
const weatherFunction = {
  name: 'get_current_weather',
  description: 'Get current weather for a location',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      location: { type: 'string', description: 'City name' }
    },
    required: ['location']
  }
};

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'What is the weather like in the city that won Euro 2024?',
  config: {
    tools: [
      { googleSearch: {} },
      { functionDeclarations: [weatherFunction] }
    ]
  }
});

// Model will:
// 1. Use Google Search to find Euro 2024 winner
// 2. Call get_current_weather function with the city
// 3. Combine both results in response
```

### Checking if Grounding was Used

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'What is 2+2?', // Model knows this without search
  config: {
    tools: [{ googleSearch: {} }]
  }
});

if (!response.candidates[0].groundingMetadata) {
  console.log('Model answered from its own knowledge (no search needed)');
} else {
  console.log('Search was performed');
}
```

### Key Points

**When to Use Grounding:**
- Current events and news
- Real-time data (stock prices, sports scores, weather)
- Fact-checking and verification
- Questions about recent developments
- Information beyond model's training cutoff

**When NOT to Use:**
- General knowledge questions
- Mathematical calculations
- Code generation
- Creative writing
- Tasks requiring internal reasoning only

**Cost Considerations:**
- Grounding adds latency (search takes time)
- Additional token costs for retrieved content
- Use `dynamicThreshold` to control when searches happen (Gemini 1.5)

**Important Notes:**
- Grounding requires **Google Cloud project** (not just API key)
- Search results quality depends on query phrasing
- Citations may not cover all facts in response
- Search is performed automatically based on confidence

**Gemini 2.5 vs 1.5:**
- **Gemini 2.5**: Use `googleSearch` (simple, recommended)
- **Gemini 1.5**: Use `googleSearchRetrieval` with `dynamicThreshold`

**Best Practices:**
- Always check `groundingMetadata` to see if search was used
- Display citations to users for transparency
- Use specific, well-phrased questions for better search results
- Combine with function calling for hybrid workflows

---

## Error Handling

### Common Errors

#### 1. Invalid API Key (401)

```typescript
{
  error: {
    code: 401,
    message: 'API key not valid. Please pass a valid API key.',
    status: 'UNAUTHENTICATED'
  }
}
```

**Solution**: Verify `GEMINI_API_KEY` environment variable is set correctly.

#### 2. Rate Limit Exceeded (429)

```typescript
{
  error: {
    code: 429,
    message: 'Resource has been exhausted (e.g. check quota).',
    status: 'RESOURCE_EXHAUSTED'
  }
}
```

**Solution**: Implement exponential backoff retry strategy.

#### 3. Model Not Found (404)

```typescript
{
  error: {
    code: 404,
    message: 'models/gemini-3.0-flash is not found',
    status: 'NOT_FOUND'
  }
}
```

**Solution**: Use correct model names: `gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-2.5-flash-lite`

#### 4. Context Length Exceeded (400)

```typescript
{
  error: {
    code: 400,
    message: 'Request payload size exceeds the limit',
    status: 'INVALID_ARGUMENT'
  }
}
```

**Solution**: Reduce input size. Gemini 2.5 models support 1,048,576 input tokens max.

### Exponential Backoff Pattern

```typescript
async function generateWithRetry(request, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await ai.models.generateContent(request);
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

### Free Tier (Gemini API)
- **Requests per minute**: 15 RPM
- **Tokens per minute**: 1 million TPM
- **Requests per day**: 1,500 RPD

### Paid Tier
- **Requests per minute**: 360 RPM
- **Tokens per minute**: 4 million TPM
- **Requests per day**: Unlimited

**Tips:**
- Implement rate limit handling with exponential backoff
- Use batch processing for high-volume tasks
- Monitor usage in Google AI Studio

---

## SDK Migration Guide

### From @google/generative-ai to @google/genai

#### 1. Update Package

```bash
# Remove deprecated SDK
npm uninstall @google/generative-ai

# Install current SDK
npm install @google/genai@1.27.0
```

#### 2. Update Imports

**Old (DEPRECATED):**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
```

**New (CURRENT):**
```typescript
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey });
// Use ai.models.generateContent() directly
```

#### 3. Update API Calls

**Old:**
```typescript
const result = await model.generateContent(prompt);
const response = await result.response;
const text = response.text();
```

**New:**
```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: prompt
});
const text = response.text;
```

#### 4. Update Streaming

**Old:**
```typescript
const result = await model.generateContentStream(prompt);
for await (const chunk of result.stream) {
  console.log(chunk.text());
}
```

**New:**
```typescript
const response = await ai.models.generateContentStream({
  model: 'gemini-2.5-flash',
  contents: prompt
});
for await (const chunk of response) {
  console.log(chunk.text);
}
```

#### 5. Update Chat

**Old:**
```typescript
const chat = model.startChat();
const result = await chat.sendMessage(message);
const response = await result.response;
```

**New:**
```typescript
const chat = await ai.models.createChat({ model: 'gemini-2.5-flash' });
const response = await chat.sendMessage(message);
// response.text is directly available
```

---

## Production Best Practices

### 1. Always Do

✅ **Use @google/genai** (NOT @google/generative-ai)
✅ **Set maxOutputTokens** to prevent excessive generation
✅ **Implement rate limit handling** with exponential backoff
✅ **Use environment variables** for API keys (never hardcode)
✅ **Validate inputs** before sending to API (save costs)
✅ **Use streaming** for better UX on long responses
✅ **Check model capabilities** (Flash-Lite has no function calling)
✅ **Handle errors gracefully** with try-catch
✅ **Monitor token usage** for cost control
✅ **Use correct model names**: gemini-2.5-pro/flash/flash-lite

### 2. Never Do

❌ **Never use @google/generative-ai** (deprecated!)
❌ **Never hardcode API keys** in code
❌ **Never claim 2M context** for Gemini 2.5 (it's 1,048,576 input tokens)
❌ **Never expose API keys** in client-side code
❌ **Never skip error handling** (always try-catch)
❌ **Never use Flash-Lite** for function calling (not supported)
❌ **Never send PII** without user consent
❌ **Never trust user input** without validation
❌ **Never ignore rate limits** (will get 429 errors)
❌ **Never use old model names** like gemini-1.5-pro (use 2.5 models)

### 3. Security

- **API Key Storage**: Use environment variables or secret managers
- **Server-Side Only**: Never expose API keys in browser JavaScript
- **Input Validation**: Sanitize all user inputs before API calls
- **Rate Limiting**: Implement your own rate limits to prevent abuse
- **Error Messages**: Don't expose API keys or sensitive data in error logs

### 4. Cost Optimization

- **Choose Right Model**: Use Flash for most tasks, Pro only when needed
- **Set Token Limits**: Use maxOutputTokens to control costs
- **Batch Requests**: Process multiple items efficiently
- **Cache Results**: Store responses when appropriate
- **Monitor Usage**: Track token consumption in Google Cloud Console

### 5. Performance

- **Use Streaming**: Better perceived latency for long responses
- **Parallel Requests**: Use Promise.all() for independent calls
- **Edge Deployment**: Deploy to Cloudflare Workers for low latency
- **Connection Pooling**: Reuse HTTP connections when possible

---

## Quick Reference

### Installation
```bash
npm install @google/genai@1.27.0
```

### Environment
```bash
export GEMINI_API_KEY="..."
```

### Models (2025)
- `gemini-2.5-pro` (1,048,576 in / 65,536 out)
- `gemini-2.5-flash` (1,048,576 in / 65,536 out)
- `gemini-2.5-flash-lite` (1,048,576 in / 65,536 out, NO function calling)

### Basic Generation
```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Your prompt here'
});
console.log(response.text);
```

### Streaming
```typescript
const response = await ai.models.generateContentStream({...});
for await (const chunk of response) {
  console.log(chunk.text);
}
```

### Multimodal
```typescript
contents: [
  {
    parts: [
      { text: 'What is this?' },
      { inlineData: { data: base64Image, mimeType: 'image/jpeg' } }
    ]
  }
]
```

### Function Calling
```typescript
config: {
  tools: [{ functionDeclarations: [...] }]
}
```

---

**Last Updated**: 2025-10-25
**Production Validated**: All features tested with @google/genai@1.27.0
**Phase**: 2 Complete ✅ (All Core + Advanced Features)
