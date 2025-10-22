# AI SDK UI - Streaming Best Practices

UI patterns and best practices for streaming AI responses.

**Last Updated**: 2025-10-22

---

## Performance

### Always Use Streaming for Long-Form Content

```tsx
// ✅ GOOD: Streaming provides better perceived performance
const { messages } = useChat({ api: '/api/chat' });

// ❌ BAD: Blocking - user waits for entire response
const response = await fetch('/api/chat', { method: 'POST' });
```

**Why?**
- Users see tokens as they arrive
- Perceived performance is much faster
- Users can start reading before response completes
- Can stop generation early

---

## UX Patterns

### 1. Show Loading States

```tsx
const { messages, isLoading } = useChat();

{isLoading && (
  <div className="flex space-x-2">
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
  </div>
)}
```

### 2. Provide Stop Button

```tsx
const { isLoading, stop } = useChat();

{isLoading && (
  <button onClick={stop} className="bg-red-500 text-white px-4 py-2 rounded">
    Stop Generation
  </button>
)}
```

### 3. Auto-Scroll to Latest Message

```tsx
const messagesEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

<div ref={messagesEndRef} />
```

### 4. Disable Input While Loading

```tsx
<input
  value={input}
  onChange={(e) => setInput(e.target.value)}
  disabled={isLoading}  // Prevent new messages while generating
  className="disabled:bg-gray-100"
/>
```

### 5. Handle Empty States

```tsx
{messages.length === 0 ? (
  <div className="text-center">
    <h2>Start a conversation</h2>
    <p>Ask me anything!</p>
  </div>
) : (
  // Messages list
)}
```

---

## Error Handling

### 1. Display Errors to Users

```tsx
const { error } = useChat();

{error && (
  <div className="p-4 bg-red-50 text-red-700 rounded">
    <strong>Error:</strong> {error.message}
  </div>
)}
```

### 2. Provide Retry Functionality

```tsx
const { error, reload } = useChat();

{error && (
  <div className="flex items-center justify-between p-4 bg-red-50">
    <span>{error.message}</span>
    <button onClick={reload} className="px-3 py-1 border rounded">
      Retry
    </button>
  </div>
)}
```

### 3. Handle Network Failures Gracefully

```tsx
useChat({
  onError: (error) => {
    console.error('Chat error:', error);
    // Log to monitoring service (Sentry, etc.)
    // Show user-friendly message
  },
});
```

### 4. Log Errors for Debugging

```tsx
useChat({
  onError: (error) => {
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      url: window.location.href,
    };
    console.error('AI SDK Error:', errorLog);
    // Send to Sentry/Datadog/etc.
  },
});
```

---

## Message Rendering

### 1. Support Markdown

Use `react-markdown` for rich content:

```tsx
import ReactMarkdown from 'react-markdown';

{messages.map(m => (
  <ReactMarkdown>{m.content}</ReactMarkdown>
))}
```

### 2. Handle Code Blocks

```tsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

<ReactMarkdown
  components={{
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter language={match[1]}>
          {String(children)}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  }}
>
  {message.content}
</ReactMarkdown>
```

### 3. Display Tool Calls Visually

```tsx
{message.toolInvocations?.map((tool, idx) => (
  <div key={idx} className="bg-blue-50 border border-blue-200 p-3 rounded">
    <div className="font-semibold">Tool: {tool.toolName}</div>
    <div className="text-sm">Args: {JSON.stringify(tool.args)}</div>
    {tool.result && (
      <div className="text-sm">Result: {JSON.stringify(tool.result)}</div>
    )}
  </div>
))}
```

### 4. Show Timestamps

```tsx
<div className="text-xs text-gray-500">
  {new Date(message.createdAt).toLocaleTimeString()}
</div>
```

### 5. Group Messages by Role

```tsx
{messages.reduce((groups, message, idx) => {
  const prevMessage = messages[idx - 1];
  const showRole = !prevMessage || prevMessage.role !== message.role;

  return [
    ...groups,
    <div key={message.id}>
      {showRole && <div className="font-bold">{message.role}</div>}
      <div>{message.content}</div>
    </div>
  ];
}, [])}
```

---

## State Management

### 1. Persist Chat History

```tsx
const chatId = 'chat-123';

const { messages } = useChat({
  id: chatId,
  initialMessages: loadFromLocalStorage(chatId),
});

useEffect(() => {
  saveToLocalStorage(chatId, messages);
}, [messages, chatId]);
```

### 2. Clear Chat Functionality

```tsx
const { setMessages } = useChat();

const clearChat = () => {
  if (confirm('Clear chat history?')) {
    setMessages([]);
  }
};
```

### 3. Export/Import Conversations

```tsx
const exportChat = () => {
  const json = JSON.stringify(messages, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chat-${Date.now()}.json`;
  a.click();
};

const importChat = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const imported = JSON.parse(e.target?.result as string);
    setMessages(imported);
  };
  reader.readAsText(file);
};
```

### 4. Handle Multiple Chats (Routing)

```tsx
// Use URL params for chat ID
const searchParams = useSearchParams();
const chatId = searchParams.get('chatId') || 'default';

const { messages } = useChat({
  id: chatId,
  initialMessages: loadMessages(chatId),
});

// Navigation
<Link href={`/chat?chatId=${newChatId}`}>New Chat</Link>
```

---

## Advanced Patterns

### 1. Debounced Input for Completions

```tsx
import { useDebouncedCallback } from 'use-debounce';

const { complete } = useCompletion();

const debouncedComplete = useDebouncedCallback((value) => {
  complete(value);
}, 500);

<input onChange={(e) => debouncedComplete(e.target.value)} />
```

### 2. Optimistic Updates

```tsx
const { messages, sendMessage } = useChat();

const optimisticSend = (content: string) => {
  // Add user message immediately
  const tempMessage = {
    id: `temp-${Date.now()}`,
    role: 'user',
    content,
  };

  setMessages([...messages, tempMessage]);

  // Send to server
  sendMessage({ content });
};
```

### 3. Custom Message Formatting

```tsx
const formatMessage = (content: string) => {
  // Replace @mentions
  content = content.replace(/@(\w+)/g, '<span class="mention">@$1</span>');

  // Replace URLs
  content = content.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank">$1</a>'
  );

  return content;
};

<div dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
```

### 4. Typing Indicators

```tsx
const [isTyping, setIsTyping] = useState(false);

useChat({
  onFinish: () => setIsTyping(false),
});

const handleSend = (content: string) => {
  setIsTyping(true);
  sendMessage({ content });
};

{isTyping && <div className="text-gray-500 italic">AI is typing...</div>}
```

---

## Performance Optimization

### 1. Virtualize Long Message Lists

```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={100}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      {messages[index].content}
    </div>
  )}
</FixedSizeList>
```

### 2. Lazy Load Message History

```tsx
const [page, setPage] = useState(1);
const messagesPerPage = 50;

const visibleMessages = messages.slice(
  (page - 1) * messagesPerPage,
  page * messagesPerPage
);
```

### 3. Memoize Message Rendering

```tsx
import { memo } from 'react';

const MessageComponent = memo(({ message }: { message: Message }) => {
  return <div>{message.content}</div>;
});

{messages.map(m => <MessageComponent key={m.id} message={m} />)}
```

---

## Official Documentation

- **AI SDK UI Overview**: https://ai-sdk.dev/docs/ai-sdk-ui/overview
- **Streaming Protocols**: https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocols
- **Message Metadata**: https://ai-sdk.dev/docs/ai-sdk-ui/message-metadata

---

**Last Updated**: 2025-10-22
