# Assistants API v2 - Complete Overview

**Version**: v2 (v1 deprecated Dec 18, 2024)
**Status**: Production (Deprecated H1 2026)
**Replacement**: [Responses API](../../openai-responses/SKILL.md)

---

## Architecture

The Assistants API provides stateful conversational AI through four main objects:

```
Assistant (configured AI entity)
    ↓
Thread (conversation container)
    ↓
Messages (user + assistant messages)
    ↓
Runs (execution on thread)
```

---

## Core Objects

### 1. Assistants

Configured AI entities with:
- **Instructions**: System prompt (max 256k characters)
- **Model**: gpt-4o, gpt-5, etc.
- **Tools**: code_interpreter, file_search, functions
- **Tool Resources**: Vector stores, files
- **Metadata**: Custom key-value pairs

**Lifecycle**: Create once, reuse many times.

### 2. Threads

Conversation containers:
- **Persistent**: Store entire conversation history
- **Capacity**: Up to 100,000 messages
- **Reusable**: One thread per user for continuity
- **Metadata**: Track ownership, session info

### 3. Messages

Individual conversation turns:
- **Roles**: user, assistant
- **Content**: Text, images, files
- **Attachments**: Files with tool associations
- **Metadata**: Custom tracking info

### 4. Runs

Asynchronous execution:
- **States**: queued → in_progress → completed/failed/requires_action
- **Streaming**: Real-time SSE events
- **Tool Calls**: Automatic handling or requires_action
- **Timeouts**: 10-minute max execution

---

## Workflow Patterns

### Basic Pattern

```typescript
// 1. Create assistant (once)
const assistant = await openai.beta.assistants.create({...});

// 2. Create thread (per conversation)
const thread = await openai.beta.threads.create();

// 3. Add message
await openai.beta.threads.messages.create(thread.id, {...});

// 4. Run
const run = await openai.beta.threads.runs.create(thread.id, {
  assistant_id: assistant.id,
});

// 5. Poll for completion
while (run.status !== 'completed') {
  await sleep(1000);
  run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
}

// 6. Get response
const messages = await openai.beta.threads.messages.list(thread.id);
```

### Streaming Pattern

```typescript
const stream = await openai.beta.threads.runs.stream(thread.id, {
  assistant_id: assistant.id,
});

for await (const event of stream) {
  if (event.event === 'thread.message.delta') {
    process.stdout.write(event.data.delta.content?.[0]?.text?.value || '');
  }
}
```

---

## Tools

### 1. Code Interpreter

- **Purpose**: Execute Python code
- **Capabilities**: Data analysis, charts, file processing
- **File Support**: CSV, JSON, images, etc.
- **Outputs**: Text logs, image files

### 2. File Search

- **Purpose**: Semantic search over documents
- **Capacity**: Up to 10,000 files per assistant
- **Technology**: Vector + keyword search
- **Pricing**: $0.10/GB/day (first 1GB free)

### 3. Function Calling

- **Purpose**: Custom tools integration
- **Pattern**: requires_action → submit_tool_outputs
- **Timeout**: Must respond within 10 minutes
- **Parallel**: Multiple functions can be called at once

---

## Key Limits

| Resource | Limit |
|----------|-------|
| Assistant instructions | 256,000 characters |
| Thread messages | 100,000 per thread |
| Tools per assistant | 128 tools |
| Vector store files | 10,000 per assistant |
| File size | 512 MB per file |
| Run execution time | 10 minutes |
| Metadata pairs | 16 per object |

---

## Pricing

### API Calls
- Same as Chat Completions (pay per token)
- Run usage reported in `run.usage`

### Vector Stores
- **Storage**: $0.10/GB/day
- **Free tier**: First 1GB
- **Auto-expiration**: Configurable

---

## Migration Timeline

- **✅ Dec 18, 2024**: v1 deprecated (no longer accessible)
- **⏳ H1 2026**: v2 planned sunset
- **✅ Now**: Responses API available (recommended replacement)

**Action**: Plan migration to Responses API for new projects.

---

## Best Practices

1. **Reuse Assistants**: Create once, use many times
2. **One Thread Per User**: Maintain conversation continuity
3. **Check Active Runs**: Before creating new runs
4. **Stream for UX**: Better user experience than polling
5. **Set Timeouts**: Prevent infinite polling
6. **Clean Up**: Delete old threads and vector stores
7. **Monitor Costs**: Track token usage and storage

---

## Common Patterns

### Multi-User Chatbot
```typescript
const userThreads = new Map<string, string>();

async function getUserThread(userId: string) {
  if (!userThreads.has(userId)) {
    const thread = await openai.beta.threads.create({
      metadata: { user_id: userId },
    });
    userThreads.set(userId, thread.id);
  }
  return userThreads.get(userId)!;
}
```

### RAG Application
```typescript
// 1. Create vector store with documents
const vectorStore = await openai.beta.vectorStores.create({...});
await openai.beta.vectorStores.fileBatches.create(vectorStore.id, {...});

// 2. Create assistant with file_search
const assistant = await openai.beta.assistants.create({
  tools: [{ type: "file_search" }],
  tool_resources: {
    file_search: { vector_store_ids: [vectorStore.id] },
  },
});
```

### Data Analysis
```typescript
const assistant = await openai.beta.assistants.create({
  tools: [{ type: "code_interpreter" }],
});

// Upload data
const file = await openai.files.create({...});

// Attach to message
await openai.beta.threads.messages.create(thread.id, {
  content: "Analyze this data",
  attachments: [{ file_id: file.id, tools: [{ type: "code_interpreter" }] }],
});
```

---

## Official Documentation

- **API Reference**: https://platform.openai.com/docs/api-reference/assistants
- **Overview**: https://platform.openai.com/docs/assistants/overview
- **Tools**: https://platform.openai.com/docs/assistants/tools
- **Migration**: https://platform.openai.com/docs/assistants/whats-new

---

**Last Updated**: 2025-10-25
