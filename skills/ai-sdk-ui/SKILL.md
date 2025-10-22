---
name: AI SDK UI
description: |
  Frontend React hooks for AI-powered chat interfaces, completions, and streaming UIs with Vercel AI SDK v5.
  Includes useChat, useCompletion, and useObject hooks for building interactive AI applications.

  Use when: building React chat interfaces, implementing AI completions in UI, streaming AI responses to frontend,
  handling chat message state, building Next.js AI apps, managing file attachments with AI, or encountering
  errors like "useChat failed to parse stream", "useChat no response", unclosed streams, or streaming issues.

  Keywords: ai sdk ui, useChat hook, useCompletion hook, useObject hook, react ai chat, ai chat interface,
  streaming ai ui, nextjs ai chat, vercel ai ui, react streaming, ai sdk react, chat message state,
  ai file attachments, message persistence, useChat error, streaming failed ui, parse stream error,
  useChat no response, react ai hooks, nextjs app router ai, nextjs pages router ai
license: MIT
---

# AI SDK UI - Frontend React Hooks

Frontend React hooks for AI-powered user interfaces with Vercel AI SDK v5.

**Version**: AI SDK v5.0.76+ (Stable)
**Framework**: React 18+, Next.js 14+
**Last Updated**: 2025-10-22

---

## Quick Start (5 Minutes)

### Installation

```bash
npm install ai @ai-sdk/openai
```

### Basic Chat Component (v5)

```tsx
// app/chat/page.tsx
'use client';
import { useChat } from 'ai/react';
import { useState, FormEvent } from 'react';

export default function Chat() {
  const { messages, sendMessage, isLoading } = useChat({
    api: '/api/chat',
  });
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage({ content: input });
    setInput('');
  };

  return (
    <div>
      <div>
        {messages.map(m => (
          <div key={m.id}>
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
        />
      </form>
    </div>
  );
}
```

### API Route (Next.js App Router)

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
  });

  return result.toDataStreamResponse();
}
```

**Result**: A functional chat interface with streaming AI responses in ~10 lines of frontend code.

---

## useChat Hook - Complete Reference

### Basic Usage (v5 Pattern)

```tsx
'use client';
import { useChat } from 'ai/react';
import { useState, FormEvent } from 'react';

export default function ChatComponent() {
  const { messages, sendMessage, isLoading, error } = useChat({
    api: '/api/chat',
  });
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage({ content: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={message.role === 'user' ? 'text-right' : 'text-left'}
          >
            <div className="inline-block p-2 rounded bg-gray-100">
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-gray-500">AI is thinking...</div>}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
          className="w-full p-2 border rounded"
        />
      </form>

      {/* Error */}
      {error && <div className="text-red-500 p-4">{error.message}</div>}
    </div>
  );
}
```

### Full API Reference

```typescript
const {
  // Messages
  messages,           // Message[] - Chat history
  setMessages,        // (messages: Message[]) => void - Update messages

  // Actions
  sendMessage,        // (message: { content: string }) => void - Send message (v5)
  reload,             // () => void - Reload last response
  stop,               // () => void - Stop current generation

  // State
  isLoading,          // boolean - Is AI responding?
  error,              // Error | undefined - Error if any

  // Data
  data,               // any[] - Custom data from stream
  metadata,           // object - Response metadata
} = useChat({
  // Required
  api: '/api/chat',   // API endpoint

  // Optional
  id: 'chat-1',       // Chat ID for persistence
  initialMessages: [], // Initial messages (controlled mode)

  // Callbacks
  onFinish: (message, options) => {},  // Called when response completes
  onError: (error) => {},              // Called on error

  // Configuration
  headers: {},        // Custom headers
  body: {},           // Additional body data
  credentials: 'same-origin', // Fetch credentials

  // Streaming
  streamProtocol: 'data', // 'data' | 'text' (default: 'data')
});
```

### v4 → v5 Breaking Changes

**CRITICAL: useChat no longer manages input state in v5!**

**v4 (OLD - DON'T USE):**
```tsx
const { messages, input, handleInputChange, handleSubmit, append } = useChat();

<form onSubmit={handleSubmit}>
  <input value={input} onChange={handleInputChange} />
</form>
```

**v5 (NEW - CORRECT):**
```tsx
const { messages, sendMessage } = useChat();
const [input, setInput] = useState('');

<form onSubmit={(e) => {
  e.preventDefault();
  sendMessage({ content: input });
  setInput('');
}}>
  <input value={input} onChange={(e) => setInput(e.target.value)} />
</form>
```

**Summary of v5 Changes:**
1. **Input management removed**: `input`, `handleInputChange`, `handleSubmit` no longer exist
2. **`append()` → `sendMessage()`**: New method for sending messages
3. **`onResponse` removed**: Use `onFinish` instead
4. **`initialMessages` → controlled mode**: Use `messages` prop for full control
5. **`maxSteps` removed**: Handle on server-side only

See `references/use-chat-migration.md` for complete migration guide.

### Tool Calling in UI

When your API uses tools, useChat automatically handles tool invocations in the message stream:

```tsx
'use client';
import { useChat } from 'ai/react';

export default function ChatWithTools() {
  const { messages } = useChat({ api: '/api/chat' });

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          {/* Text content */}
          {message.content && <p>{message.content}</p>}

          {/* Tool invocations */}
          {message.toolInvocations?.map((tool, idx) => (
            <div key={idx} className="bg-blue-50 p-2 rounded my-2">
              <div className="font-bold">Tool: {tool.toolName}</div>
              <div className="text-sm">
                <strong>Args:</strong> {JSON.stringify(tool.args, null, 2)}
              </div>
              {tool.result && (
                <div className="text-sm">
                  <strong>Result:</strong> {JSON.stringify(tool.result, null, 2)}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### File Attachments

Upload files (images, PDFs, etc.) alongside messages:

```tsx
'use client';
import { useChat } from 'ai/react';
import { useState, FormEvent } from 'react';

export default function ChatWithAttachments() {
  const { messages, sendMessage, isLoading } = useChat({ api: '/api/chat' });
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    sendMessage({
      content: input,
      experimental_attachments: files
        ? Array.from(files).map(file => ({
            name: file.name,
            contentType: file.type,
            url: URL.createObjectURL(file),
          }))
        : undefined,
    });

    setInput('');
    setFiles(null);
  };

  return (
    <div>
      {/* Messages */}
      {messages.map(m => (
        <div key={m.id}>
          {m.content}
          {m.experimental_attachments?.map((att, idx) => (
            <div key={idx}>
              <img src={att.url} alt={att.name} />
            </div>
          ))}
        </div>
      ))}

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(e.target.files)}
          accept="image/*"
        />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}
```

### Message Persistence

Save and load chat history to localStorage:

```tsx
'use client';
import { useChat } from 'ai/react';
import { useEffect } from 'react';

export default function PersistentChat() {
  const chatId = 'my-chat-1';

  const { messages, setMessages, sendMessage } = useChat({
    api: '/api/chat',
    id: chatId,
    initialMessages: loadMessages(chatId),
  });

  // Save messages whenever they change
  useEffect(() => {
    saveMessages(chatId, messages);
  }, [messages, chatId]);

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>{m.role}: {m.content}</div>
      ))}
      {/* Input form... */}
    </div>
  );
}

// Helper functions
function loadMessages(chatId: string) {
  const stored = localStorage.getItem(`chat-${chatId}`);
  return stored ? JSON.parse(stored) : [];
}

function saveMessages(chatId: string, messages: any[]) {
  localStorage.setItem(`chat-${chatId}`, JSON.stringify(messages));
}
```

---

## useCompletion Hook - Complete Reference

### Basic Usage

```tsx
'use client';
import { useCompletion } from 'ai/react';
import { useState, FormEvent } from 'react';

export default function Completion() {
  const { completion, complete, isLoading, error } = useCompletion({
    api: '/api/completion',
  });
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    complete(input);
    setInput('');
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a prompt..."
          rows={4}
          className="w-full p-2 border rounded"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
      </form>

      {completion && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3>Result:</h3>
          <p>{completion}</p>
        </div>
      )}

      {error && <div className="text-red-500">{error.message}</div>}
    </div>
  );
}
```

### Full API Reference

```typescript
const {
  completion,         // string - Current completion text
  complete,           // (prompt: string) => void - Trigger completion
  setCompletion,      // (completion: string) => void - Update completion
  isLoading,          // boolean - Is generating?
  error,              // Error | undefined - Error if any
  stop,               // () => void - Stop generation
} = useCompletion({
  api: '/api/completion',
  id: 'completion-1',

  // Callbacks
  onFinish: (prompt, completion) => {},
  onError: (error) => {},

  // Configuration
  headers: {},
  body: {},
});
```

### API Route for useCompletion

```typescript
// app/api/completion/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamText({
    model: openai('gpt-3.5-turbo'),
    prompt,
    maxOutputTokens: 500,
  });

  return result.toDataStreamResponse();
}
```

---

## useObject Hook - Complete Reference

### Basic Usage

Stream structured data (e.g., forms, JSON objects) with live updates:

```tsx
'use client';
import { useObject } from 'ai/react';
import { z } from 'zod';

const recipeSchema = z.object({
  recipe: z.object({
    name: z.string(),
    ingredients: z.array(z.string()),
    instructions: z.array(z.string()),
  }),
});

export default function RecipeGenerator() {
  const { object, submit, isLoading, error } = useObject({
    api: '/api/recipe',
    schema: recipeSchema,
  });

  return (
    <div>
      <button onClick={() => submit('pasta carbonara')} disabled={isLoading}>
        Generate Recipe
      </button>

      {isLoading && <div>Generating recipe...</div>}

      {object?.recipe && (
        <div className="mt-4">
          <h2 className="text-2xl font-bold">{object.recipe.name}</h2>

          <h3 className="text-xl mt-4">Ingredients:</h3>
          <ul>
            {object.recipe.ingredients?.map((ingredient, idx) => (
              <li key={idx}>{ingredient}</li>
            ))}
          </ul>

          <h3 className="text-xl mt-4">Instructions:</h3>
          <ol>
            {object.recipe.instructions?.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {error && <div className="text-red-500">{error.message}</div>}
    </div>
  );
}
```

### Full API Reference

```typescript
const {
  object,             // Partial<T> - Partial object (updates as stream progresses)
  submit,             // (input: string) => void - Trigger generation
  isLoading,          // boolean - Is generating?
  error,              // Error | undefined - Error if any
  stop,               // () => void - Stop generation
} = useObject({
  api: '/api/object',
  schema: zodSchema,  // Zod schema

  // Callbacks
  onFinish: (object) => {},
  onError: (error) => {},
});
```

### API Route for useObject

```typescript
// app/api/recipe/route.ts
import { streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamObject({
    model: openai('gpt-4'),
    schema: z.object({
      recipe: z.object({
        name: z.string(),
        ingredients: z.array(z.string()),
        instructions: z.array(z.string()),
      }),
    }),
    prompt: `Generate a recipe for ${prompt}`,
  });

  return result.toTextStreamResponse();
}
```

---

## Next.js Integration

### App Router Complete Example

**Directory Structure:**
```
app/
├── api/
│   └── chat/
│       └── route.ts      # Chat API endpoint
├── chat/
│   └── page.tsx          # Chat page
└── layout.tsx
```

**Chat Page:**
```tsx
// app/chat/page.tsx
'use client';
import { useChat } from 'ai/react';
import { useState, FormEvent, useRef, useEffect } from 'react';

export default function ChatPage() {
  const { messages, sendMessage, isLoading, error } = useChat({
    api: '/api/chat',
  });
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage({ content: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 p-3 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border-t border-red-200 text-red-700">
          Error: {error.message}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
```

**API Route:**
```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
    system: 'You are a helpful AI assistant.',
    maxOutputTokens: 1000,
  });

  return result.toDataStreamResponse();
}
```

### Pages Router Complete Example

**Directory Structure:**
```
pages/
├── api/
│   └── chat.ts           # Chat API endpoint
└── chat.tsx              # Chat page
```

**Chat Page:**
```tsx
// pages/chat.tsx
import { useChat } from 'ai/react';
import { useState, FormEvent } from 'react';

export default function ChatPage() {
  const { messages, sendMessage, isLoading } = useChat({
    api: '/api/chat',
  });
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage({ content: input });
    setInput('');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Chat</h1>

      <div className="border rounded p-4 h-96 overflow-y-auto mb-4">
        {messages.map(m => (
          <div key={m.id} className="mb-4">
            <strong>{m.role === 'user' ? 'You' : 'AI'}:</strong> {m.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
          className="flex-1 p-2 border rounded"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

**API Route:**
```typescript
// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { messages } = req.body;

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
  });

  // Pages Router uses pipeDataStreamToResponse
  return result.pipeDataStreamToResponse(res);
}
```

**Key Difference**: App Router uses `toDataStreamResponse()`, Pages Router uses `pipeDataStreamToResponse()`.

---

## Top UI Errors & Solutions

See `references/top-ui-errors.md` for complete documentation. Quick reference:

### 1. useChat Failed to Parse Stream

**Error**: `SyntaxError: Unexpected token in JSON at position X`

**Cause**: API route not returning proper stream format.

**Solution**:
```typescript
// ✅ CORRECT
return result.toDataStreamResponse();

// ❌ WRONG
return new Response(result.textStream);
```

### 2. useChat No Response

**Cause**: API route not streaming correctly.

**Solution**:
```typescript
// App Router - use toDataStreamResponse()
export async function POST(req: Request) {
  const result = streamText({ /* ... */ });
  return result.toDataStreamResponse(); // ✅
}

// Pages Router - use pipeDataStreamToResponse()
export default async function handler(req, res) {
  const result = streamText({ /* ... */ });
  return result.pipeDataStreamToResponse(res); // ✅
}
```

### 3. Streaming Not Working When Deployed

**Cause**: Deployment platform buffering responses.

**Solution**: Vercel auto-detects streaming. Other platforms may need configuration.

### 4. Stale Body Values with useChat

**Cause**: `body` option captured at first render only.

**Solution**:
```typescript
// ❌ WRONG - body captured once
const { userId } = useUser();
const { messages } = useChat({
  body: { userId },  // Stale!
});

// ✅ CORRECT - use controlled mode
const { userId } = useUser();
const { messages, sendMessage } = useChat();

sendMessage({
  content: input,
  data: { userId },  // Fresh on each send
});
```

### 5. React Maximum Update Depth

**Cause**: Infinite loop in useEffect.

**Solution**:
```typescript
// ❌ WRONG
useEffect(() => {
  saveMessages(messages);
}, [messages, saveMessages]); // saveMessages triggers re-render!

// ✅ CORRECT
useEffect(() => {
  saveMessages(messages);
}, [messages]); // Only depend on messages
```

See `references/top-ui-errors.md` for 7 more common errors.

---

## Streaming Best Practices

### Performance

**Always use streaming for better UX:**
```tsx
// ✅ GOOD - Streaming (shows tokens as they arrive)
const { messages } = useChat({ api: '/api/chat' });

// ❌ BAD - Non-streaming (user waits for full response)
const response = await fetch('/api/chat', { method: 'POST' });
```

### UX Patterns

**Show loading states:**
```tsx
{isLoading && <div>AI is typing...</div>}
```

**Provide stop button:**
```tsx
{isLoading && <button onClick={stop}>Stop</button>}
```

**Auto-scroll to latest message:**
```tsx
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);
```

**Disable input while loading:**
```tsx
<input disabled={isLoading} />
```

See `references/streaming-patterns.md` for comprehensive best practices.

---

## When to Use This Skill

### Use ai-sdk-ui When:
- Building React chat interfaces
- Implementing AI completions in UI
- Streaming AI responses to frontend
- Building Next.js AI applications
- Handling chat message state
- Displaying tool calls in UI
- Managing file attachments with AI
- Migrating from v4 to v5 (UI hooks)
- Encountering useChat/useCompletion errors

### Don't Use When:
- Need backend AI functionality → Use **ai-sdk-core** instead
- Building non-React frontends (Svelte, Vue) → Check official docs
- Need Generative UI / RSC → See https://ai-sdk.dev/docs/ai-sdk-rsc
- Building native apps → Different SDK required

### Related Skills:
- **ai-sdk-core** - Backend text generation, structured output, tools, agents
- Compose both for full-stack AI applications

---

## Package Versions

**Required:**
```json
{
  "dependencies": {
    "ai": "^5.0.76",
    "@ai-sdk/openai": "^2.0.53",
    "react": "^18.2.0",
    "zod": "^3.23.8"
  }
}
```

**Next.js:**
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

**Version Notes:**
- AI SDK v5.0.76+ (stable)
- React 18+ (React 19 supported)
- Next.js 14+ recommended (13.4+ works)
- Zod 3.23.8+ for schema validation

---

## Links to Official Documentation

**Core UI Hooks:**
- AI SDK UI Overview: https://ai-sdk.dev/docs/ai-sdk-ui/overview
- useChat: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
- useCompletion: https://ai-sdk.dev/docs/ai-sdk-ui/completion
- useObject: https://ai-sdk.dev/docs/ai-sdk-ui/object-generation

**Advanced Topics (Link Only):**
- Generative UI (RSC): https://ai-sdk.dev/docs/ai-sdk-rsc/overview
- Stream Protocols: https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocols
- Message Metadata: https://ai-sdk.dev/docs/ai-sdk-ui/message-metadata

**Next.js Integration:**
- Next.js App Router: https://ai-sdk.dev/docs/getting-started/nextjs-app-router
- Next.js Pages Router: https://ai-sdk.dev/docs/getting-started/nextjs-pages-router

**Migration & Troubleshooting:**
- v4→v5 Migration: https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0
- Troubleshooting: https://ai-sdk.dev/docs/troubleshooting
- Common Issues: https://ai-sdk.dev/docs/troubleshooting/common-issues

**Vercel Deployment:**
- Vercel Functions: https://vercel.com/docs/functions
- Streaming on Vercel: https://vercel.com/docs/functions/streaming

---

## Templates

This skill includes the following templates in `templates/`:

1. **use-chat-basic.tsx** - Basic chat with manual input (v5 pattern)
2. **use-chat-tools.tsx** - Chat with tool calling UI rendering
3. **use-chat-attachments.tsx** - File attachments support
4. **use-completion-basic.tsx** - Basic text completion
5. **use-object-streaming.tsx** - Streaming structured data
6. **nextjs-chat-app-router.tsx** - Next.js App Router complete example
7. **nextjs-chat-pages-router.tsx** - Next.js Pages Router complete example
8. **nextjs-api-route.ts** - API route for both App and Pages Router
9. **message-persistence.tsx** - Save/load chat history
10. **custom-message-renderer.tsx** - Custom message components with markdown
11. **package.json** - Dependencies template

## Reference Documents

See `references/` for:

- **use-chat-migration.md** - Complete v4→v5 migration guide
- **streaming-patterns.md** - UI streaming best practices
- **top-ui-errors.md** - 12 common UI errors with solutions
- **nextjs-integration.md** - Next.js setup patterns
- **links-to-official-docs.md** - Organized links to official docs

---

**Production Tested**: WordPress Auditor (https://wordpress-auditor.webfonts.workers.dev)
**Last Updated**: 2025-10-22
