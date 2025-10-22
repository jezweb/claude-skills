# useChat v4 → v5 Migration Guide

Complete guide to migrating from AI SDK v4 to v5 for UI hooks.

**Last Updated**: 2025-10-22
**Applies to**: AI SDK v5.0.76+

---

## Critical Breaking Change

**BREAKING: useChat no longer manages input state!**

In v4, `useChat` provided `input`, `handleInputChange`, and `handleSubmit`. In v5, you must manage input state manually using `useState`.

---

## Quick Migration Checklist

- [ ] Replace `input`, `handleInputChange`, `handleSubmit` with manual state
- [ ] Change `append()` to `sendMessage()`
- [ ] Replace `onResponse` with `onFinish`
- [ ] Move `initialMessages` to controlled mode with `messages` prop
- [ ] Remove `maxSteps` (handle server-side)
- [ ] Update message rendering for parts structure (if using tools)

---

## 1. Input State Management (CRITICAL)

### v4 (OLD)

```tsx
import { useChat } from 'ai/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
  });

  return (
    <div>
      {messages.map(m => <div key={m.id}>{m.content}</div>)}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
      </form>
    </div>
  );
}
```

### v5 (NEW)

```tsx
import { useChat } from 'ai/react';
import { useState, FormEvent } from 'react';

export default function Chat() {
  const { messages, sendMessage } = useChat({
    api: '/api/chat',
  });

  // Manual input state
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage({ content: input });
    setInput('');
  };

  return (
    <div>
      {messages.map(m => <div key={m.id}>{m.content}</div>)}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </form>
    </div>
  );
}
```

**Why?**
- More control over input handling
- Easier to add features like debouncing, validation, etc.
- Consistent with React patterns

---

## 2. append() → sendMessage()

### v4 (OLD)

```tsx
const { append } = useChat();

// Append a message
append({
  role: 'user',
  content: 'Hello',
});
```

### v5 (NEW)

```tsx
const { sendMessage } = useChat();

// Send a message (role is assumed to be 'user')
sendMessage({
  content: 'Hello',
});

// With attachments
sendMessage({
  content: 'Analyze this image',
  experimental_attachments: [
    { name: 'image.png', contentType: 'image/png', url: 'blob:...' },
  ],
});
```

**Why?**
- Clearer API: `sendMessage` is more intuitive than `append`
- Supports attachments natively
- Role is always 'user' (no need to specify)

---

## 3. onResponse → onFinish

### v4 (OLD)

```tsx
const { messages } = useChat({
  onResponse: (response) => {
    console.log('Response received:', response);
  },
});
```

### v5 (NEW)

```tsx
const { messages } = useChat({
  onFinish: (message, options) => {
    console.log('Response finished:', message);
    console.log('Finish reason:', options.finishReason);
    console.log('Usage:', options.usage);
  },
});
```

**Why?**
- `onResponse` fired too early (when response started)
- `onFinish` fires when response is complete
- Provides more context (usage, finish reason)

---

## 4. initialMessages → Controlled Mode

### v4 (OLD)

```tsx
const { messages } = useChat({
  initialMessages: [
    { role: 'system', content: 'You are a helpful assistant.' },
  ],
});
```

### v5 (NEW - Option 1: Uncontrolled)

```tsx
const { messages } = useChat({
  // Use initialMessages for read-only initialization
  initialMessages: [
    { role: 'system', content: 'You are a helpful assistant.' },
  ],
});
```

### v5 (NEW - Option 2: Controlled)

```tsx
const [messages, setMessages] = useState([
  { role: 'system', content: 'You are a helpful assistant.' },
]);

const { sendMessage } = useChat({
  messages,  // Pass messages for controlled mode
  onUpdate: ({ messages }) => {
    setMessages(messages);  // Sync state
  },
});
```

**Why?**
- Clearer distinction between controlled and uncontrolled
- Easier to persist messages to database

---

## 5. maxSteps Removed

### v4 (OLD)

```tsx
const { messages } = useChat({
  maxSteps: 5,  // Limit agent steps
});
```

### v5 (NEW)

Handle `maxSteps` (or `stopWhen`) on the **server-side** only:

```typescript
// app/api/chat/route.ts
import { streamText, stopWhen } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4'),
    messages,
    maxSteps: 5,  // Handle on server
  });

  return result.toDataStreamResponse();
}
```

**Why?**
- Server has more control over costs
- Prevents client-side bypass
- Consistent with v5 architecture

---

## 6. Message Structure (for Tools)

### v4 (OLD)

```tsx
// Simple message structure
{
  id: '1',
  role: 'assistant',
  content: 'The weather is sunny',
  toolCalls: [...]  // Tool calls as separate property
}
```

### v5 (NEW)

```tsx
// Parts-based structure
{
  id: '1',
  role: 'assistant',
  content: 'The weather is sunny',  // Still exists for simple messages
  parts: [
    { type: 'text', content: 'The weather is' },
    { type: 'tool-call', toolName: 'getWeather', args: { location: 'SF' } },
    { type: 'tool-result', toolName: 'getWeather', result: { temp: 72 } },
    { type: 'text', content: 'sunny' },
  ]
}
```

**Rendering v5 Messages:**

```tsx
messages.map(message => {
  // For simple text messages, use content
  if (message.content) {
    return <div>{message.content}</div>;
  }

  // For tool calls, use toolInvocations
  if (message.toolInvocations) {
    return message.toolInvocations.map(tool => (
      <div key={tool.toolCallId}>
        Tool: {tool.toolName}
        Args: {JSON.stringify(tool.args)}
        Result: {JSON.stringify(tool.result)}
      </div>
    ));
  }
});
```

---

## 7. Other Removed/Changed Properties

### Removed in v5

- `input` - Use manual `useState`
- `handleInputChange` - Use `onChange={(e) => setInput(e.target.value)}`
- `handleSubmit` - Use custom submit handler
- `onResponse` - Use `onFinish` instead

### Renamed in v5

- `append()` → `sendMessage()`
- `initialMessages` → Still exists, but use `messages` prop for controlled mode

### Added in v5

- `sendMessage()` - New way to send messages
- `experimental_attachments` - File attachments support
- `toolInvocations` - Simplified tool call rendering

---

## Common Migration Patterns

### Pattern 1: Basic Chat

**v4:**
```tsx
const { messages, input, handleInputChange, handleSubmit } = useChat();
<form onSubmit={handleSubmit}>
  <input value={input} onChange={handleInputChange} />
</form>
```

**v5:**
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

### Pattern 2: With Initial Messages

**v4:**
```tsx
const { messages } = useChat({
  initialMessages: loadFromStorage(),
});
```

**v5:**
```tsx
const { messages } = useChat({
  initialMessages: loadFromStorage(),  // Still works
});
```

### Pattern 3: With Response Callback

**v4:**
```tsx
useChat({
  onResponse: (res) => console.log('Started'),
});
```

**v5:**
```tsx
useChat({
  onFinish: (msg, opts) => {
    console.log('Finished');
    console.log('Tokens:', opts.usage.totalTokens);
  },
});
```

---

## Migration Troubleshooting

### Error: "input is undefined"

**Cause**: You're using v5 but trying to access `input` from `useChat`.

**Fix**: Add manual input state:
```tsx
const [input, setInput] = useState('');
```

### Error: "append is not a function"

**Cause**: `append()` was renamed to `sendMessage()` in v5.

**Fix**: Replace all instances of `append()` with `sendMessage()`.

### Error: "handleSubmit is undefined"

**Cause**: v5 doesn't provide `handleSubmit`.

**Fix**: Create custom submit handler:
```tsx
const handleSubmit = (e: FormEvent) => {
  e.preventDefault();
  sendMessage({ content: input });
  setInput('');
};
```

### Warning: "onResponse is deprecated"

**Cause**: v5 removed `onResponse`.

**Fix**: Use `onFinish` instead.

---

## Official Migration Resources

- **v5 Migration Guide**: https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0
- **useChat API Reference**: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
- **v5 Release Notes**: https://vercel.com/blog/ai-sdk-5

---

**Last Updated**: 2025-10-22
