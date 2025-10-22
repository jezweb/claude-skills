# AI SDK UI - Next.js Integration

Complete guide for integrating AI SDK UI with Next.js.

**Last Updated**: 2025-10-22

---

## App Router (Next.js 13+)

### Directory Structure

```
app/
├── api/
│   └── chat/
│       └── route.ts      # API route
├── chat/
│   └── page.tsx          # Chat page (Client Component)
└── layout.tsx
```

### Chat Page (Client Component)

```tsx
// app/chat/page.tsx
'use client';  // REQUIRED

import { useChat } from 'ai/react';
import { useState } from 'react';

export default function ChatPage() {
  const { messages, sendMessage, isLoading } = useChat({
    api: '/api/chat',
  });
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage({ content: input });
    setInput('');
  };

  return (
    <div>
      {messages.map(m => <div key={m.id}>{m.content}</div>)}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={(e) => setInput(e.target.value)} />
      </form>
    </div>
  );
}
```

### API Route

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

  return result.toDataStreamResponse();  // App Router method
}
```

---

## Pages Router (Next.js 12 and earlier)

### Directory Structure

```
pages/
├── api/
│   └── chat.ts           # API route
└── chat.tsx              # Chat page
```

### Chat Page

```tsx
// pages/chat.tsx
import { useChat } from 'ai/react';
import { useState } from 'react';

export default function ChatPage() {
  const { messages, sendMessage, isLoading } = useChat({
    api: '/api/chat',
  });
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage({ content: input });
    setInput('');
  };

  return (
    <div>
      {messages.map(m => <div key={m.id}>{m.content}</div>)}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={(e) => setInput(e.target.value)} />
      </form>
    </div>
  );
}
```

### API Route

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

  return result.pipeDataStreamToResponse(res);  // Pages Router method
}
```

---

## Key Differences

| Feature | App Router | Pages Router |
|---------|------------|--------------|
| Route Handler | `app/api/chat/route.ts` | `pages/api/chat.ts` |
| Stream Method | `toDataStreamResponse()` | `pipeDataStreamToResponse()` |
| Client Directive | Requires `'use client'` | Not required |
| Server Components | Supported | Not supported |

---

## Environment Variables

### .env.local

```bash
# Required
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...

# Optional
NODE_ENV=development
```

### Accessing in API Routes

```typescript
// App Router
export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  // ...
}

// Pages Router
export default async function handler(req, res) {
  const apiKey = process.env.OPENAI_API_KEY;
  // ...
}
```

---

## Deployment to Vercel

### 1. Add Environment Variables

In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Add `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.
3. Select environments (Production, Preview, Development)

### 2. Deploy

```bash
npm run build
vercel deploy
```

Vercel auto-detects streaming and configures appropriately.

### 3. Verify Streaming

Check response headers:
- `Transfer-Encoding: chunked`
- `X-Vercel-Streaming: true`

**Docs**: https://vercel.com/docs/functions/streaming

---

## Common Issues

### Issue: "useChat is not defined"

**Cause**: Not importing from correct package.

**Fix**:
```tsx
import { useChat } from 'ai/react';  // ✅ Correct
import { useChat } from 'ai';  // ❌ Wrong
```

### Issue: "Cannot use 'use client' directive"

**Cause**: Using `'use client'` in Pages Router.

**Fix**: Remove `'use client'` - only needed in App Router.

### Issue: "API route returns 405 Method Not Allowed"

**Cause**: Using GET instead of POST.

**Fix**: Ensure API route exports `POST` function (App Router) or checks `req.method === 'POST'` (Pages Router).

---

## Official Documentation

- **App Router**: https://ai-sdk.dev/docs/getting-started/nextjs-app-router
- **Pages Router**: https://ai-sdk.dev/docs/getting-started/nextjs-pages-router
- **Next.js Docs**: https://nextjs.org/docs

---

**Last Updated**: 2025-10-22
