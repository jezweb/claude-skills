# Migration Guide: Chat Completions → Responses API

**Last Updated**: 2025-10-25

Quick guide for migrating from Chat Completions to Responses API.

---

## Breaking Changes Summary

| Chat Completions | Responses API | Migration |
|-----------------|---------------|-----------|
| **Endpoint** | `/v1/chat/completions` | `/v1/responses` | Update URL |
| **Parameter** | `messages` | `input` | Rename |
| **Role** | `system` | `developer` | Update role name |
| **Output** | `choices[0].message.content` | `output_text` | Update accessor |
| **State** | Manual (messages array) | Automatic (conversation ID) | Use conversations |
| **Tools** | `tools` array with functions | Built-in types + MCP | Update tool definitions |

---

## Step-by-Step Migration

### Step 1: Update Endpoint

**Before:**
```typescript
const response = await openai.chat.completions.create({...});
```

**After:**
```typescript
const response = await openai.responses.create({...});
```

### Step 2: Rename `messages` to `input`

**Before:**
```typescript
{
  messages: [
    { role: 'system', content: '...' },
    { role: 'user', content: '...' }
  ]
}
```

**After:**
```typescript
{
  input: [
    { role: 'developer', content: '...' },
    { role: 'user', content: '...' }
  ]
}
```

### Step 3: Update Response Access

**Before:**
```typescript
const text = response.choices[0].message.content;
```

**After:**
```typescript
const text = response.output_text;
```

### Step 4: Use Conversation IDs (Optional but Recommended)

**Before (Manual History):**
```typescript
let messages = [...previousMessages, newMessage];
const response = await openai.chat.completions.create({
  model: 'gpt-5',
  messages,
});
```

**After (Automatic):**
```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  conversation: conv.id, // ✅ Automatic state
  input: newMessage,
});
```

---

## Complete Example

**Before (Chat Completions):**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let messages = [
  { role: 'system', content: 'You are a helpful assistant.' },
];

async function chat(userMessage: string) {
  messages.push({ role: 'user', content: userMessage });

  const response = await openai.chat.completions.create({
    model: 'gpt-5',
    messages,
  });

  const assistantMessage = response.choices[0].message;
  messages.push(assistantMessage);

  return assistantMessage.content;
}

// Usage
await chat('Hello');
await chat('Tell me a joke');
```

**After (Responses):**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const conversation = await openai.conversations.create({
  items: [
    { type: 'message', role: 'developer', content: 'You are a helpful assistant.' },
  ],
});

async function chat(userMessage: string) {
  const response = await openai.responses.create({
    model: 'gpt-5',
    conversation: conversation.id,
    input: userMessage,
  });

  return response.output_text;
}

// Usage
await chat('Hello');
await chat('Tell me a joke'); // Remembers previous turn automatically
```

---

## Tool Migration

### Chat Completions Functions → Responses Built-in Tools

**Before (Custom Function):**
```typescript
{
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get weather',
        parameters: { /* schema */ }
      }
    }
  ]
}
```

**After (Built-in or MCP):**
```typescript
{
  tools: [
    { type: 'web_search' },        // Built-in
    { type: 'code_interpreter' },  // Built-in
    {
      type: 'mcp',                 // External tools
      server_label: 'weather',
      server_url: 'https://weather-mcp.example.com'
    }
  ]
}
```

---

## Streaming Migration

**Before:**
```typescript
const stream = await openai.chat.completions.create({
  model: 'gpt-5',
  messages,
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

**After:**
```typescript
const stream = await openai.responses.create({
  model: 'gpt-5',
  input,
  stream: true,
});

for await (const chunk of stream) {
  // Handle polymorphic outputs
  if (chunk.type === 'message_delta') {
    process.stdout.write(chunk.content || '');
  }
}
```

---

## Testing Checklist

- [ ] Update all endpoint calls
- [ ] Rename `messages` to `input`
- [ ] Update `system` role to `developer`
- [ ] Update response access (`choices[0]` → `output_text`)
- [ ] Implement conversation management
- [ ] Update tool definitions
- [ ] Test multi-turn conversations
- [ ] Verify streaming works
- [ ] Check cost tracking (tool tokens)

---

**Official Docs**: https://platform.openai.com/docs/guides/responses
