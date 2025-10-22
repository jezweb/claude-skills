# AI SDK UI - Top 12 Errors & Solutions

Common AI SDK UI errors with actionable solutions.

**Last Updated**: 2025-10-22

---

## 1. useChat Failed to Parse Stream

**Error**: `SyntaxError: Unexpected token in JSON at position X`

**Cause**: API route not returning proper stream format.

**Solution**:
```typescript
// ✅ CORRECT (App Router)
export async function POST(req: Request) {
  const result = streamText({ /* ... */ });
  return result.toDataStreamResponse();  // Correct method
}

// ✅ CORRECT (Pages Router)
export default async function handler(req, res) {
  const result = streamText({ /* ... */ });
  return result.pipeDataStreamToResponse(res);  // Correct method
}

// ❌ WRONG
return new Response(result.textStream);  // Missing stream protocol
```

---

## 2. useChat No Response

**Cause**: API route not streaming correctly or wrong method.

**Solution**:
```typescript
// Check 1: Are you using the right method?
// App Router: toDataStreamResponse()
// Pages Router: pipeDataStreamToResponse()

// Check 2: Is your API route returning a Response?
export async function POST(req: Request) {
  const result = streamText({ model: openai('gpt-4'), messages });
  return result.toDataStreamResponse();  // Must return this!
}

// Check 3: Check network tab - is the request completing?
// If status is 200 but no data: likely streaming issue
```

---

## 3. Unclosed Streams

**Cause**: Stream not properly closed in API.

**Solution**:
```typescript
// ✅ GOOD: SDK handles closing automatically
export async function POST(req: Request) {
  const result = streamText({ model: openai('gpt-4'), messages });
  return result.toDataStreamResponse();
}

// ❌ BAD: Manual stream handling (error-prone)
const encoder = new TextEncoder();
const stream = new ReadableStream({
  async start(controller) {
    // ...must manually close!
    controller.close();
  }
});
```

**GitHub Issue**: #4123

---

## 4. Streaming Not Working When Deployed

**Cause**: Deployment platform buffering responses.

**Solution**:
- **Vercel**: Auto-detects streaming (no config needed)
- **Netlify**: Ensure Edge Functions enabled
- **Cloudflare Workers**: Use `toDataStreamResponse()`
- **Other platforms**: Check for response buffering settings

```typescript
// Vercel - works out of the box
export async function POST(req: Request) {
  const result = streamText({ /* ... */ });
  return result.toDataStreamResponse();
}
```

**Docs**: https://vercel.com/docs/functions/streaming

---

## 5. Streaming Not Working When Proxied

**Cause**: Proxy (nginx, Cloudflare, etc.) buffering responses.

**Solution**:

**Nginx**:
```nginx
location /api/ {
    proxy_pass http://localhost:3000;
    proxy_buffering off;  # Disable buffering
    proxy_cache off;
}
```

**Cloudflare**: Disable "Auto Minify" in dashboard

---

## 6. Strange Stream Output (0:... characters)

**Error**: Seeing raw stream protocol like `0:"Hello"` in browser.

**Cause**: Not using correct hook or consuming stream directly.

**Solution**:
```tsx
// ✅ CORRECT: Use useChat hook
const { messages } = useChat({ api: '/api/chat' });

// ❌ WRONG: Consuming stream directly
const response = await fetch('/api/chat');
const reader = response.body.getReader();  // Don't do this!
```

---

## 7. Stale Body Values with useChat

**Cause**: `body` captured at first render only.

**Solution**:
```tsx
// ❌ BAD: body captured once
const { userId } = useUser();
const { messages } = useChat({
  body: { userId },  // Stale! Won't update if userId changes
});

// ✅ GOOD: Use data in sendMessage
const { userId } = useUser();
const { messages, sendMessage } = useChat();

sendMessage({
  content: input,
  data: { userId },  // Fresh value on each send
});
```

---

## 8. Custom Headers Not Working with useChat

**Cause**: Headers not passed correctly.

**Solution**:
```tsx
// ✅ CORRECT
const { messages } = useChat({
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Custom-Header': 'value',
  },
});

// OR use fetch options
const { messages } = useChat({
  fetch: (url, options) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });
  },
});
```

---

## 9. React Maximum Update Depth

**Error**: `Maximum update depth exceeded`

**Cause**: Infinite loop in useEffect.

**Solution**:
```tsx
// ❌ BAD: Infinite loop
const saveMessages = (messages) => { /* ... */ };

useEffect(() => {
  saveMessages(messages);
}, [messages, saveMessages]);  // saveMessages changes every render!

// ✅ GOOD: Only depend on messages
useEffect(() => {
  localStorage.setItem('messages', JSON.stringify(messages));
}, [messages]);  // saveMessages not needed in deps
```

---

## 10. Repeated Assistant Messages

**Cause**: Duplicate message handling or multiple sendMessage calls.

**Solution**:
```tsx
// ❌ BAD: Calling sendMessage multiple times
const handleSubmit = (e) => {
  e.preventDefault();
  sendMessage({ content: input });
  sendMessage({ content: input });  // Duplicate!
};

// ✅ GOOD: Single call
const handleSubmit = (e) => {
  e.preventDefault();
  if (!input.trim()) return;  // Guard
  sendMessage({ content: input });
  setInput('');
};
```

---

## 11. onFinish Not Called When Stream Aborted

**Cause**: Stream abort doesn't trigger onFinish callback.

**Solution**:
```tsx
const { stop } = useChat({
  onFinish: (message) => {
    console.log('Finished:', message);
  },
});

// Handle abort separately
const handleStop = () => {
  stop();
  console.log('Stream aborted by user');
  // Do cleanup here
};
```

---

## 12. Type Error with Message Parts (v5)

**Error**: `Property 'parts' does not exist on type 'Message'`

**Cause**: v5 changed message structure for tool calls.

**Solution**:
```tsx
// ✅ CORRECT (v5)
messages.map(message => {
  // Use content for simple messages
  if (message.content) {
    return <div>{message.content}</div>;
  }

  // Use toolInvocations for tool calls
  if (message.toolInvocations) {
    return message.toolInvocations.map(tool => (
      <div key={tool.toolCallId}>
        Tool: {tool.toolName}
      </div>
    ));
  }
});

// ❌ WRONG (v4 style)
message.toolCalls  // Doesn't exist in v5
```

---

## For More Errors

See complete error reference (28 total types):
https://ai-sdk.dev/docs/reference/ai-sdk-errors

---

**Last Updated**: 2025-10-22
