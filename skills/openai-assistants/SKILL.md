---
name: openai-assistants
description: |
  Complete guide for OpenAI's Assistants API v2: stateful conversational AI with built-in tools
  (Code Interpreter, File Search, Function Calling), vector stores for RAG (up to 10,000 files),
  thread/run lifecycle management, and streaming patterns. Both Node.js SDK and fetch approaches.

  ⚠️ DEPRECATION NOTICE: OpenAI plans to sunset Assistants API in H1 2026 in favor of Responses API.
  This skill remains valuable for existing apps and migration planning.

  Use when: building stateful chatbots with OpenAI, implementing RAG with vector stores, executing
  Python code with Code Interpreter, using file search for document Q&A, managing conversation threads,
  streaming assistant responses, or encountering errors like "thread already has active run", vector
  store indexing delays, run polling timeouts, or file upload issues.

  Keywords: openai assistants, assistants api, openai threads, openai runs, code interpreter assistant,
  file search openai, vector store openai, openai rag, assistant streaming, thread persistence,
  stateful chatbot, thread already has active run, run status polling, vector store error
license: MIT
---

# OpenAI Assistants API v2

**Status**: Production Ready (Deprecated H1 2026)
**Package**: openai@6.7.0
**Last Updated**: 2025-10-25
**v1 Deprecated**: December 18, 2024
**v2 Sunset**: H1 2026 (migrate to Responses API)

---

## ⚠️ Important: Deprecation Notice

**OpenAI announced that the Assistants API will be deprecated in favor of the [Responses API](../openai-responses/SKILL.md).**

**Timeline:**
- ✅ **Dec 18, 2024**: Assistants API v1 deprecated
- ⏳ **H1 2026**: Planned sunset of Assistants API v2
- ✅ **Now**: Responses API available (recommended for new projects)

**Should you still use this skill?**
- ✅ **Yes, if**: You have existing Assistants API code (12-18 month migration window)
- ✅ **Yes, if**: You need to maintain legacy applications
- ✅ **Yes, if**: Planning migration from Assistants → Responses
- ❌ **No, if**: Starting a new project (use openai-responses skill instead)

**Migration Path:**
See `references/migration-to-responses.md` for complete migration guide.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Assistants](#assistants)
4. [Threads](#threads)
5. [Messages](#messages)
6. [Runs](#runs)
7. [Streaming Runs](#streaming-runs)
8. [Tools](#tools)
   - [Code Interpreter](#code-interpreter)
   - [File Search](#file-search)
   - [Function Calling](#function-calling)
9. [Vector Stores](#vector-stores)
10. [File Uploads](#file-uploads)
11. [Thread Lifecycle Management](#thread-lifecycle-management)
12. [Error Handling](#error-handling)
13. [Production Best Practices](#production-best-practices)
14. [Relationship to Other Skills](#relationship-to-other-skills)

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

### Basic Assistant (Node.js SDK)

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 1. Create an assistant
const assistant = await openai.beta.assistants.create({
  name: "Math Tutor",
  instructions: "You are a personal math tutor. Write and run code to answer math questions.",
  tools: [{ type: "code_interpreter" }],
  model: "gpt-4o",
});

// 2. Create a thread
const thread = await openai.beta.threads.create();

// 3. Add a message to the thread
await openai.beta.threads.messages.create(thread.id, {
  role: "user",
  content: "I need to solve the equation `3x + 11 = 14`. Can you help me?",
});

// 4. Create a run
const run = await openai.beta.threads.runs.create(thread.id, {
  assistant_id: assistant.id,
});

// 5. Poll for completion
let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

while (runStatus.status !== 'completed') {
  await new Promise(resolve => setTimeout(resolve, 1000));
  runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
}

// 6. Retrieve messages
const messages = await openai.beta.threads.messages.list(thread.id);
console.log(messages.data[0].content[0].text.value);
```

### Basic Assistant (Fetch - Cloudflare Workers)

```typescript
// 1. Create assistant
const assistant = await fetch('https://api.openai.com/v1/assistants', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
    'OpenAI-Beta': 'assistants=v2',
  },
  body: JSON.stringify({
    name: "Math Tutor",
    instructions: "You are a helpful math tutor.",
    model: "gpt-4o",
  }),
});

const assistantData = await assistant.json();

// 2. Create thread
const thread = await fetch('https://api.openai.com/v1/threads', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
    'OpenAI-Beta': 'assistants=v2',
  },
});

const threadData = await thread.json();

// 3. Add message and create run
const run = await fetch(`https://api.openai.com/v1/threads/${threadData.id}/runs`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
    'OpenAI-Beta': 'assistants=v2',
  },
  body: JSON.stringify({
    assistant_id: assistantData.id,
    additional_messages: [{
      role: "user",
      content: "What is 3x + 11 = 14?",
    }],
  }),
});

// Poll for completion...
```

---

## Core Concepts

The Assistants API uses four main objects:

### 1. **Assistants**
Configured AI entities with:
- Instructions (system prompt, max 256k characters)
- Model (gpt-4o, gpt-5, etc.)
- Tools (Code Interpreter, File Search, Functions)
- File attachments
- Metadata

### 2. **Threads**
Conversation containers that:
- Store message history
- Persist across runs
- Can have metadata
- Support up to 100,000 messages

### 3. **Messages**
Individual messages in a thread:
- User messages (input)
- Assistant messages (output)
- Can include file attachments
- Support text and image content

### 4. **Runs**
Execution of an assistant on a thread:
- Asynchronous processing
- Multiple states (queued, in_progress, completed, failed, etc.)
- Can stream results
- Handle tool calls automatically

---

## Assistants

### Create an Assistant

```typescript
const assistant = await openai.beta.assistants.create({
  name: "Data Analyst",
  instructions: "You are a data analyst. Use code interpreter to analyze data and create visualizations.",
  model: "gpt-4o",
  tools: [
    { type: "code_interpreter" },
    { type: "file_search" },
  ],
  tool_resources: {
    file_search: {
      vector_store_ids: ["vs_abc123"],
    },
  },
  metadata: {
    department: "analytics",
    version: "1.0",
  },
});
```

**Parameters:**
- `model` (required): Model ID (gpt-4o, gpt-5, gpt-4-turbo)
- `instructions`: System prompt (max 256k characters in v2, was 32k in v1)
- `name`: Assistant name (max 256 characters)
- `description`: Description (max 512 characters)
- `tools`: Array of tools (max 128 tools)
- `tool_resources`: Resources for tools (vector stores, files)
- `temperature`: 0-2 (default 1)
- `top_p`: 0-1 (default 1)
- `response_format`: "auto", "json_object", or JSON schema
- `metadata`: Key-value pairs (max 16 pairs)

### Retrieve an Assistant

```typescript
const assistant = await openai.beta.assistants.retrieve("asst_abc123");
```

### Update an Assistant

```typescript
const updatedAssistant = await openai.beta.assistants.update("asst_abc123", {
  instructions: "Updated instructions",
  tools: [{ type: "code_interpreter" }, { type: "file_search" }],
});
```

### Delete an Assistant

```typescript
await openai.beta.assistants.del("asst_abc123");
```

### List Assistants

```typescript
const assistants = await openai.beta.assistants.list({
  limit: 20,
  order: "desc",
});
```

---

## Threads

Threads store conversation history and persist across runs.

### Create a Thread

```typescript
// Empty thread
const thread = await openai.beta.threads.create();

// Thread with initial messages
const thread = await openai.beta.threads.create({
  messages: [
    {
      role: "user",
      content: "Hello! I need help with Python.",
      metadata: { source: "web" },
    },
  ],
  metadata: {
    user_id: "user_123",
    session_id: "session_456",
  },
});
```

### Retrieve a Thread

```typescript
const thread = await openai.beta.threads.retrieve("thread_abc123");
```

### Update Thread Metadata

```typescript
const thread = await openai.beta.threads.update("thread_abc123", {
  metadata: {
    user_id: "user_123",
    last_active: new Date().toISOString(),
  },
});
```

### Delete a Thread

```typescript
await openai.beta.threads.del("thread_abc123");
```

**⚠️ Warning**: Deleting a thread also deletes all messages and runs. Cannot be undone.

---

## Messages

### Add a Message to a Thread

```typescript
const message = await openai.beta.threads.messages.create("thread_abc123", {
  role: "user",
  content: "Can you analyze this data?",
  attachments: [
    {
      file_id: "file_abc123",
      tools: [{ type: "code_interpreter" }],
    },
  ],
  metadata: {
    timestamp: new Date().toISOString(),
  },
});
```

**Parameters:**
- `role`: "user" only (assistant messages created by runs)
- `content`: Text or array of content blocks
- `attachments`: Files with associated tools
- `metadata`: Key-value pairs

### Retrieve a Message

```typescript
const message = await openai.beta.threads.messages.retrieve(
  "thread_abc123",
  "msg_abc123"
);
```

### List Messages

```typescript
const messages = await openai.beta.threads.messages.list("thread_abc123", {
  limit: 20,
  order: "desc", // "asc" or "desc"
});

// Iterate through messages
for (const message of messages.data) {
  console.log(`${message.role}: ${message.content[0].text.value}`);
}
```

### Update Message Metadata

```typescript
const message = await openai.beta.threads.messages.update(
  "thread_abc123",
  "msg_abc123",
  {
    metadata: {
      edited: "true",
      edit_timestamp: new Date().toISOString(),
    },
  }
);
```

### Delete a Message

```typescript
await openai.beta.threads.messages.del("thread_abc123", "msg_abc123");
```

---

## Runs

Runs execute an assistant on a thread.

### Create a Run

```typescript
const run = await openai.beta.threads.runs.create("thread_abc123", {
  assistant_id: "asst_abc123",
  instructions: "Please address the user as Jane Doe.",
  additional_messages: [
    {
      role: "user",
      content: "Can you help me with this?",
    },
  ],
});
```

**Parameters:**
- `assistant_id` (required): Assistant to use
- `instructions`: Override assistant instructions
- `additional_messages`: Add messages before running
- `tools`: Override assistant tools
- `metadata`: Key-value pairs
- `temperature`: Override temperature
- `top_p`: Override top_p
- `max_prompt_tokens`: Limit input tokens
- `max_completion_tokens`: Limit output tokens

### Retrieve a Run

```typescript
const run = await openai.beta.threads.runs.retrieve(
  "thread_abc123",
  "run_abc123"
);

console.log(run.status); // queued, in_progress, requires_action, completed, failed, etc.
```

### Run States

| State | Description |
|-------|-------------|
| `queued` | Run is waiting to start |
| `in_progress` | Run is executing |
| `requires_action` | Function calling needs your input |
| `cancelling` | Cancellation in progress |
| `cancelled` | Run was cancelled |
| `failed` | Run failed (check `last_error`) |
| `completed` | Run finished successfully |
| `expired` | Run expired (max 10 minutes) |

### Polling Pattern

```typescript
async function pollRunCompletion(threadId: string, runId: string) {
  let run = await openai.beta.threads.runs.retrieve(threadId, runId);

  while (['queued', 'in_progress', 'cancelling'].includes(run.status)) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    run = await openai.beta.threads.runs.retrieve(threadId, runId);
  }

  if (run.status === 'failed') {
    throw new Error(`Run failed: ${run.last_error?.message}`);
  }

  if (run.status === 'requires_action') {
    // Handle function calling (see Function Calling section)
    return run;
  }

  return run; // completed
}

const run = await openai.beta.threads.runs.create(threadId, { assistant_id: assistantId });
const completedRun = await pollRunCompletion(threadId, run.id);
```

### Cancel a Run

```typescript
const run = await openai.beta.threads.runs.cancel("thread_abc123", "run_abc123");
```

**⚠️ Important**: Cancellation is asynchronous. Check `status` becomes `cancelled`.

### List Runs

```typescript
const runs = await openai.beta.threads.runs.list("thread_abc123", {
  limit: 10,
  order: "desc",
});
```

---

## Streaming Runs

Stream run events in real-time using Server-Sent Events (SSE).

### Basic Streaming

```typescript
const stream = await openai.beta.threads.runs.stream("thread_abc123", {
  assistant_id: "asst_abc123",
});

for await (const event of stream) {
  if (event.event === 'thread.message.delta') {
    const delta = event.data.delta.content?.[0]?.text?.value;
    if (delta) {
      process.stdout.write(delta);
    }
  }
}
```

### Stream Event Types

| Event | Description |
|-------|-------------|
| `thread.run.created` | Run was created |
| `thread.run.in_progress` | Run started |
| `thread.run.step.created` | Step created (tool call, message creation) |
| `thread.run.step.delta` | Step progress update |
| `thread.message.created` | Message created |
| `thread.message.delta` | Message content streaming |
| `thread.message.completed` | Message finished |
| `thread.run.completed` | Run finished |
| `thread.run.failed` | Run failed |
| `thread.run.requires_action` | Function calling needed |

### Complete Streaming Example

```typescript
async function streamAssistantResponse(threadId: string, assistantId: string) {
  const stream = await openai.beta.threads.runs.stream(threadId, {
    assistant_id: assistantId,
  });

  for await (const event of stream) {
    switch (event.event) {
      case 'thread.run.created':
        console.log('\\nRun started...');
        break;

      case 'thread.message.delta':
        const delta = event.data.delta.content?.[0];
        if (delta?.type === 'text' && delta.text?.value) {
          process.stdout.write(delta.text.value);
        }
        break;

      case 'thread.run.step.delta':
        const toolCall = event.data.delta.step_details;
        if (toolCall?.type === 'tool_calls') {
          const codeInterpreter = toolCall.tool_calls?.[0]?.code_interpreter;
          if (codeInterpreter?.input) {
            console.log('\\nExecuting code:', codeInterpreter.input);
          }
        }
        break;

      case 'thread.run.completed':
        console.log('\\n\\nRun completed!');
        break;

      case 'thread.run.failed':
        console.error('\\nRun failed:', event.data.last_error);
        break;

      case 'thread.run.requires_action':
        // Handle function calling
        console.log('\\nFunction calling required');
        break;
    }
  }
}
```

---

## Tools

Assistants API supports three types of tools:

### Code Interpreter

Executes Python code in a sandboxed environment.

**Capabilities:**
- Run Python code
- Generate charts/graphs
- Process files (CSV, JSON, text, images, etc.)
- Return file outputs (images, data files)
- Install packages (limited set available)

**Example:**

```typescript
const assistant = await openai.beta.assistants.create({
  name: "Data Analyst",
  instructions: "You are a data analyst. Use Python to analyze data and create visualizations.",
  model: "gpt-4o",
  tools: [{ type: "code_interpreter" }],
});

// Upload a file
const file = await openai.files.create({
  file: fs.createReadStream("sales_data.csv"),
  purpose: "assistants",
});

// Create thread with file
const thread = await openai.beta.threads.create({
  messages: [{
    role: "user",
    content: "Analyze this sales data and create a visualization.",
    attachments: [{
      file_id: file.id,
      tools: [{ type: "code_interpreter" }],
    }],
  }],
});

// Run
const run = await openai.beta.threads.runs.create(thread.id, {
  assistant_id: assistant.id,
});

// Poll for completion and retrieve outputs
```

**Output Files:**

Code Interpreter can generate files (images, CSVs, etc.). Access them via:

```typescript
const messages = await openai.beta.threads.messages.list(thread.id);
const message = messages.data[0];

for (const content of message.content) {
  if (content.type === 'image_file') {
    const fileId = content.image_file.file_id;
    const fileContent = await openai.files.content(fileId);
    // Save or process file
  }
}
```

### File Search

Semantic search over uploaded documents using vector stores.

**Key Features:**
- Up to 10,000 files per assistant (500x more than v1)
- Automatic chunking and embedding
- Vector + keyword search
- Parallel queries with multi-threading
- Advanced reranking

**Pricing:**
- $0.10/GB/day for vector storage
- First 1GB free

**Example:**

```typescript
// 1. Create vector store
const vectorStore = await openai.beta.vectorStores.create({
  name: "Product Documentation",
  metadata: { category: "docs" },
});

// 2. Upload files to vector store
const file = await openai.files.create({
  file: fs.createReadStream("product_guide.pdf"),
  purpose: "assistants",
});

await openai.beta.vectorStores.files.create(vectorStore.id, {
  file_id: file.id,
});

// 3. Create assistant with file search
const assistant = await openai.beta.assistants.create({
  name: "Product Support",
  instructions: "Use file search to answer questions about our products.",
  model: "gpt-4o",
  tools: [{ type: "file_search" }],
  tool_resources: {
    file_search: {
      vector_store_ids: [vectorStore.id],
    },
  },
});

// 4. Create thread and run
const thread = await openai.beta.threads.create({
  messages: [{
    role: "user",
    content: "How do I install the product?",
  }],
});

const run = await openai.beta.threads.runs.create(thread.id, {
  assistant_id: assistant.id,
});
```

**Best Practices:**
- Wait for vector store status to be `completed` before using
- Use metadata for filtering (coming soon)
- Chunk large documents appropriately
- Monitor storage costs

### Function Calling

Define custom functions for the assistant to call.

**Example:**

```typescript
const assistant = await openai.beta.assistants.create({
  name: "Weather Assistant",
  instructions: "You help users get weather information.",
  model: "gpt-4o",
  tools: [{
    type: "function",
    function: {
      name: "get_weather",
      description: "Get the current weather for a location",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "City name, e.g., 'San Francisco'",
          },
          unit: {
            type: "string",
            enum: ["celsius", "fahrenheit"],
            description: "Temperature unit",
          },
        },
        required: ["location"],
      },
    },
  }],
});

// Create thread and run
const thread = await openai.beta.threads.create({
  messages: [{
    role: "user",
    content: "What's the weather in San Francisco?",
  }],
});

let run = await openai.beta.threads.runs.create(thread.id, {
  assistant_id: assistant.id,
});

// Poll until requires_action
while (run.status === 'in_progress' || run.status === 'queued') {
  await new Promise(resolve => setTimeout(resolve, 1000));
  run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
}

if (run.status === 'requires_action') {
  const toolCalls = run.required_action.submit_tool_outputs.tool_calls;

  const toolOutputs = [];
  for (const toolCall of toolCalls) {
    if (toolCall.function.name === 'get_weather') {
      const args = JSON.parse(toolCall.function.arguments);
      // Call your actual weather API
      const weather = await getWeatherAPI(args.location, args.unit);

      toolOutputs.push({
        tool_call_id: toolCall.id,
        output: JSON.stringify(weather),
      });
    }
  }

  // Submit tool outputs
  run = await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, {
    tool_outputs: toolOutputs,
  });

  // Continue polling...
}
```

---

## Vector Stores

Vector stores enable efficient semantic search over large document collections.

### Create a Vector Store

```typescript
const vectorStore = await openai.beta.vectorStores.create({
  name: "Legal Documents",
  metadata: {
    department: "legal",
    category: "contracts",
  },
  expires_after: {
    anchor: "last_active_at",
    days: 7, // Auto-delete 7 days after last use
  },
});
```

### Add Files to Vector Store

**Single File:**

```typescript
const file = await openai.files.create({
  file: fs.createReadStream("contract.pdf"),
  purpose: "assistants",
});

await openai.beta.vectorStores.files.create(vectorStore.id, {
  file_id: file.id,
});
```

**Batch Upload:**

```typescript
const fileBatch = await openai.beta.vectorStores.fileBatches.create(vectorStore.id, {
  file_ids: ["file_abc123", "file_def456", "file_ghi789"],
});

// Poll for batch completion
let batch = await openai.beta.vectorStores.fileBatches.retrieve(vectorStore.id, fileBatch.id);
while (batch.status === 'in_progress') {
  await new Promise(resolve => setTimeout(resolve, 1000));
  batch = await openai.beta.vectorStores.fileBatches.retrieve(vectorStore.id, fileBatch.id);
}
```

### Check Vector Store Status

```typescript
const vectorStore = await openai.beta.vectorStores.retrieve("vs_abc123");

console.log(vectorStore.status); // "in_progress", "completed", "failed"
console.log(vectorStore.file_counts); // { in_progress: 0, completed: 50, failed: 0 }
```

**⚠️ Important**: Wait for `status: "completed"` before using with file search.

### List Vector Stores

```typescript
const stores = await openai.beta.vectorStores.list({
  limit: 20,
  order: "desc",
});
```

### Update Vector Store

```typescript
const vectorStore = await openai.beta.vectorStores.update("vs_abc123", {
  name: "Updated Name",
  metadata: { updated: "true" },
});
```

### Delete Vector Store

```typescript
await openai.beta.vectorStores.del("vs_abc123");
```

---

## File Uploads

Upload files for use with Code Interpreter or File Search.

### Upload a File

```typescript
import fs from 'fs';

const file = await openai.files.create({
  file: fs.createReadStream("document.pdf"),
  purpose: "assistants",
});

console.log(file.id); // file_abc123
```

**Supported Formats:**
- **Code Interpreter**: .c, .cpp, .csv, .docx, .html, .java, .json, .md, .pdf, .php, .pptx, .py, .rb, .tex, .txt, .css, .jpeg, .jpg, .js, .gif, .png, .tar, .ts, .xlsx, .xml, .zip
- **File Search**: .c, .cpp, .docx, .html, .java, .json, .md, .pdf, .php, .pptx, .py, .rb, .tex, .txt, .css, .js, .ts, .go

**Size Limits:**
- Code Interpreter: 512 MB per file
- File Search: 512 MB per file
- Vector Store: Up to 10,000 files

### Retrieve File Info

```typescript
const file = await openai.files.retrieve("file_abc123");
```

### Download File Content

```typescript
const content = await openai.files.content("file_abc123");
// Returns binary content
```

### Delete a File

```typescript
await openai.files.del("file_abc123");
```

### List Files

```typescript
const files = await openai.files.list({
  purpose: "assistants",
});
```

---

## Thread Lifecycle Management

Proper thread lifecycle management prevents common errors.

### Pattern 1: One Thread Per User

```typescript
async function getOrCreateUserThread(userId: string): Promise<string> {
  // Check if thread exists in your database
  let threadId = await db.getThreadIdForUser(userId);

  if (!threadId) {
    // Create new thread
    const thread = await openai.beta.threads.create({
      metadata: { user_id: userId },
    });
    threadId = thread.id;
    await db.saveThreadIdForUser(userId, threadId);
  }

  return threadId;
}
```

### Pattern 2: Active Run Check

```typescript
async function ensureNoActiveRun(threadId: string) {
  const runs = await openai.beta.threads.runs.list(threadId, {
    limit: 1,
    order: "desc",
  });

  const latestRun = runs.data[0];
  if (latestRun && ['queued', 'in_progress', 'cancelling'].includes(latestRun.status)) {
    throw new Error('Thread already has an active run. Wait or cancel first.');
  }
}

// Before creating new run
await ensureNoActiveRun(threadId);
const run = await openai.beta.threads.runs.create(threadId, { assistant_id });
```

### Pattern 3: Thread Cleanup

```typescript
async function cleanupOldThreads(maxAgeHours = 24) {
  const threads = await openai.beta.threads.list({ limit: 100 });

  for (const thread of threads.data) {
    const createdAt = new Date(thread.created_at * 1000);
    const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

    if (ageHours > maxAgeHours) {
      await openai.beta.threads.del(thread.id);
    }
  }
}
```

---

## Error Handling

### Common Errors and Solutions

**1. Thread Already Has Active Run**

```
Error: 400 Can't add messages to thread_xxx while a run run_xxx is active.
```

**Solution:**
```typescript
// Wait for run to complete or cancel it
const run = await openai.beta.threads.runs.retrieve(threadId, runId);
if (['queued', 'in_progress'].includes(run.status)) {
  await openai.beta.threads.runs.cancel(threadId, runId);
  // Wait for cancellation
  while (run.status !== 'cancelled') {
    await new Promise(resolve => setTimeout(resolve, 500));
    run = await openai.beta.threads.runs.retrieve(threadId, runId);
  }
}
```

**2. Run Polling Timeout**

Long-running tasks may exceed reasonable polling windows.

**Solution:**
```typescript
async function pollWithTimeout(threadId: string, runId: string, maxSeconds = 300) {
  const startTime = Date.now();

  while (true) {
    const run = await openai.beta.threads.runs.retrieve(threadId, runId);

    if (!['queued', 'in_progress'].includes(run.status)) {
      return run;
    }

    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed > maxSeconds) {
      await openai.beta.threads.runs.cancel(threadId, runId);
      throw new Error('Run exceeded timeout');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

**3. Vector Store Not Ready**

Using vector store before indexing completes.

**Solution:**
```typescript
async function waitForVectorStore(vectorStoreId: string) {
  let store = await openai.beta.vectorStores.retrieve(vectorStoreId);

  while (store.status === 'in_progress') {
    await new Promise(resolve => setTimeout(resolve, 2000));
    store = await openai.beta.vectorStores.retrieve(vectorStoreId);
  }

  if (store.status === 'failed') {
    throw new Error('Vector store indexing failed');
  }

  return store;
}
```

**4. File Upload Format Issues**

Unsupported file formats cause errors.

**Solution:**
```typescript
const SUPPORTED_FORMATS = {
  code_interpreter: ['.csv', '.json', '.pdf', '.txt', '.py', '.js', '.xlsx'],
  file_search: ['.pdf', '.docx', '.txt', '.md', '.html'],
};

function validateFile(filename: string, tool: string) {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  if (!SUPPORTED_FORMATS[tool].includes(ext)) {
    throw new Error(`Unsupported file format for ${tool}: ${ext}`);
  }
}
```

See `references/top-errors.md` for complete error catalog.

---

## Production Best Practices

### 1. Use Assistant IDs (Don't Recreate)

**❌ Bad:**
```typescript
// Creates new assistant on every request!
const assistant = await openai.beta.assistants.create({ ... });
```

**✅ Good:**
```typescript
// Create once, store ID, reuse
const ASSISTANT_ID = process.env.ASSISTANT_ID || await createAssistant();

async function createAssistant() {
  const assistant = await openai.beta.assistants.create({ ... });
  console.log('Save this ID:', assistant.id);
  return assistant.id;
}
```

### 2. Implement Proper Error Handling

```typescript
async function createRunWithRetry(threadId: string, assistantId: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
      });
    } catch (error) {
      if (error.status === 429) {
        // Rate limit - wait and retry
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        continue;
      }

      if (error.message?.includes('active run')) {
        // Wait for active run to complete
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }

      throw error; // Other errors
    }
  }

  throw new Error('Max retries exceeded');
}
```

### 3. Monitor Costs

```typescript
// Track usage
const run = await openai.beta.threads.runs.retrieve(threadId, runId);
console.log('Tokens used:', run.usage);
// { prompt_tokens: 150, completion_tokens: 200, total_tokens: 350 }

// Set limits
const run = await openai.beta.threads.runs.create(threadId, {
  assistant_id: assistantId,
  max_prompt_tokens: 1000,
  max_completion_tokens: 500,
});
```

### 4. Clean Up Resources

```typescript
// Delete old threads
async function cleanupUserThread(userId: string) {
  const threadId = await db.getThreadIdForUser(userId);
  if (threadId) {
    await openai.beta.threads.del(threadId);
    await db.deleteThreadIdForUser(userId);
  }
}

// Delete unused vector stores
async function cleanupVectorStores(keepDays = 30) {
  const stores = await openai.beta.vectorStores.list({ limit: 100 });

  for (const store of stores.data) {
    const ageSeconds = Date.now() / 1000 - store.created_at;
    const ageDays = ageSeconds / (60 * 60 * 24);

    if (ageDays > keepDays) {
      await openai.beta.vectorStores.del(store.id);
    }
  }
}
```

### 5. Use Streaming for Better UX

```typescript
// Show progress in real-time
async function streamToUser(threadId: string, assistantId: string) {
  const stream = await openai.beta.threads.runs.stream(threadId, {
    assistant_id: assistantId,
  });

  for await (const event of stream) {
    if (event.event === 'thread.message.delta') {
      const delta = event.data.delta.content?.[0]?.text?.value;
      if (delta) {
        // Send to user immediately
        sendToClient(delta);
      }
    }
  }
}
```

---

## Relationship to Other Skills

### vs. openai-api Skill

**openai-api** (Chat Completions):
- Stateless requests
- Manual history management
- Direct responses
- Use for: Simple text generation, function calling

**openai-assistants**:
- Stateful conversations (threads)
- Automatic history management
- Built-in tools (Code Interpreter, File Search)
- Use for: Chatbots, data analysis, RAG

### vs. openai-responses Skill

**openai-responses** (Responses API):
- ✅ **Recommended for new projects**
- Better reasoning preservation
- Modern MCP integration
- Active development

**openai-assistants**:
- ⚠️ **Deprecated in H1 2026**
- Use for legacy apps
- Migration path available

**Migration:** See `references/migration-to-responses.md`

---

## Migration from v1 to v2

**v1 deprecated**: December 18, 2024

**Key Changes:**
1. **Retrieval → File Search**: `retrieval` tool replaced with `file_search`
2. **Vector Stores**: Files now organized in vector stores (10,000 file limit)
3. **Instructions Limit**: Increased from 32k to 256k characters
4. **File Attachments**: Now message-level instead of assistant-level

See `references/migration-from-v1.md` for complete guide.

---

## Next Steps

**Templates:**
- `templates/basic-assistant.ts` - Simple math tutor
- `templates/code-interpreter-assistant.ts` - Data analysis
- `templates/file-search-assistant.ts` - RAG with vector stores
- `templates/function-calling-assistant.ts` - Custom tools
- `templates/streaming-assistant.ts` - Real-time streaming

**References:**
- `references/top-errors.md` - 12 common errors and solutions
- `references/thread-lifecycle.md` - Thread management patterns
- `references/vector-stores.md` - Vector store deep dive

**Related Skills:**
- `openai-responses` - Modern replacement (recommended)
- `openai-api` - Chat Completions (stateless)

---

**Last Updated**: 2025-10-25
**Package Version**: openai@6.7.0
**Status**: Production Ready (Deprecated H1 2026)
