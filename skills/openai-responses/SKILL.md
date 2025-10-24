---
name: openai-responses
description: |
  This skill provides comprehensive knowledge for working with OpenAI's Responses API, the unified stateful API for building agentic applications. It should be used when building AI agents that preserve reasoning across turns, integrating MCP servers for external tools, using built-in tools (Code Interpreter, File Search, Web Search, Image Generation), managing stateful conversations, implementing background processing, or migrating from Chat Completions API.

  Use when building agentic workflows, conversational AI with memory, tools-based applications, RAG systems, data analysis agents, or any application requiring OpenAI's reasoning models with persistent state. Covers both Node.js SDK and Cloudflare Workers implementations.

  Keywords: responses api, openai responses, stateful openai, openai mcp, code interpreter openai, file search openai, web search openai, image generation openai, reasoning preservation, agentic workflows, conversation state, background mode, chat completions migration, gpt-5, polymorphic outputs
license: MIT
---

# OpenAI Responses API

**Status**: Production Ready
**Last Updated**: 2025-10-25
**API Launch**: March 2025
**Dependencies**: openai@5.19.1+ (Node.js) or fetch API (Cloudflare Workers)

---

## What Is the Responses API?

The Responses API (`/v1/responses`) is OpenAI's unified interface for building agentic applications, launched in March 2025. It fundamentally changes how you interact with OpenAI models by providing **stateful conversations** and a **structured loop for reasoning and acting**.

### Key Innovation: Preserved Reasoning State

Unlike Chat Completions where reasoning is discarded between turns, Responses **keeps the notebook open**. The model's step-by-step thought processes survive into the next turn, improving performance by approximately **5% on TAUBench** and enabling better multi-turn interactions.

### Why Use Responses Over Chat Completions?

| Feature | Chat Completions | Responses API | Benefit |
|---------|-----------------|---------------|---------|
| **State Management** | Manual (you track history) | Automatic (conversation IDs) | Simpler code, less error-prone |
| **Reasoning** | Dropped between turns | Preserved across turns | Better multi-turn performance |
| **Tools** | Client-side round trips | Server-side hosted | Lower latency, simpler code |
| **Output Format** | Single message | Polymorphic (messages, reasoning, tool calls) | Richer debugging, better UX |
| **Cache Utilization** | Baseline | 40-80% better | Lower costs, faster responses |
| **MCP Support** | Manual integration | Built-in | Easy external tool connections |

---

## Quick Start (5 Minutes)

### 1. Get API Key

```bash
# Sign up at https://platform.openai.com/
# Navigate to API Keys section
# Create new key and save securely
export OPENAI_API_KEY="sk-proj-..."
```

**Why this matters:**
- API key required for all requests
- Keep secure (never commit to git)
- Use environment variables

### 2. Install SDK (Node.js)

```bash
npm install openai
```

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'What are the 5 Ds of dodgeball?',
});

console.log(response.output_text);
```

**CRITICAL:**
- Always use server-side (never expose API key in client code)
- Model defaults to `gpt-5` (can use `gpt-5-mini`, `gpt-4o`, etc.)
- `input` can be string or array of messages

### 3. Or Use Direct API (Cloudflare Workers)

```typescript
// No SDK needed - use fetch()
const response = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-5',
    input: 'Hello, world!',
  }),
});

const data = await response.json();
console.log(data.output_text);
```

**Why fetch?**
- No dependencies in edge environments
- Full control over request/response
- Works in Cloudflare Workers, Deno, Bun

---

## Responses vs Chat Completions: Complete Comparison

### When to Use Each

**Use Responses API when:**
- ✅ Building agentic applications (reasoning + actions)
- ✅ Need preserved reasoning state across turns
- ✅ Want built-in tools (Code Interpreter, File Search, Web Search)
- ✅ Using MCP servers for external integrations
- ✅ Implementing conversational AI with automatic state management
- ✅ Background processing for long-running tasks
- ✅ Need polymorphic outputs (messages, reasoning, tool calls)

**Use Chat Completions when:**
- ✅ Simple one-off text generation
- ✅ Fully stateless interactions (no conversation continuity needed)
- ✅ Legacy integrations (existing Chat Completions code)
- ✅ Very simple use cases without tools

### Architecture Differences

**Chat Completions Flow:**
```
User Input → Model → Single Message → Done
(Reasoning discarded, state lost)
```

**Responses API Flow:**
```
User Input → Model (preserved reasoning) → Polymorphic Outputs
            ↓ (server-side tools)
    Tool Call → Tool Result → Model → Final Response
(Reasoning preserved, state maintained)
```

### Performance Benefits

**Cache Utilization:**
- Chat Completions: Baseline performance
- Responses API: **40-80% better cache utilization**
- Result: Lower latency + reduced costs

**Reasoning Performance:**
- Chat Completions: Reasoning dropped between turns
- Responses API: Reasoning preserved across turns
- Result: **5% better on TAUBench** (GPT-5 with Responses vs Chat Completions)

---

## Stateful Conversations

### Automatic State Management

The Responses API can automatically manage conversation state using **conversation IDs**.

#### Creating a Conversation

```typescript
// Create conversation with initial message
const conversation = await openai.conversations.create({
  metadata: { user_id: 'user_123' },
  items: [
    {
      type: 'message',
      role: 'user',
      content: 'Hello!',
    },
  ],
});

console.log(conversation.id); // "conv_abc123..."
```

#### Using Conversation ID

```typescript
// First turn
const response1 = await openai.responses.create({
  model: 'gpt-5',
  conversation: 'conv_abc123',
  input: 'What are the 5 Ds of dodgeball?',
});

console.log(response1.output_text);

// Second turn - model remembers previous context
const response2 = await openai.responses.create({
  model: 'gpt-5',
  conversation: 'conv_abc123',
  input: 'Tell me more about the first one',
});

console.log(response2.output_text);
// Model automatically knows "first one" refers to first D from previous turn
```

**Why this matters:**
- No manual history tracking required
- Reasoning state preserved between turns
- Automatic context management
- Lower risk of context errors

### Manual State Management (Alternative)

If you need full control, you can manually manage history:

```typescript
let history = [
  { role: 'user', content: 'Tell me a joke' },
];

const response = await openai.responses.create({
  model: 'gpt-5',
  input: history,
  store: true, // Optional: store for retrieval later
});

// Add response to history
history = [
  ...history,
  ...response.output.map(el => ({
    role: el.role,
    content: el.content,
  })),
];

// Next turn
history.push({ role: 'user', content: 'Tell me another' });

const secondResponse = await openai.responses.create({
  model: 'gpt-5',
  input: history,
});
```

**When to use manual management:**
- Need custom history pruning logic
- Want to modify conversation history programmatically
- Implementing custom caching strategies

---

## Built-in Tools (Server-Side)

The Responses API includes **server-side hosted tools** that eliminate costly backend round trips.

### Available Tools

| Tool | Purpose | Use Case |
|------|---------|----------|
| **Code Interpreter** | Execute Python code | Data analysis, calculations, charts |
| **File Search** | RAG without vector stores | Search uploaded files for answers |
| **Web Search** | Real-time web information | Current events, fact-checking |
| **Image Generation** | DALL-E integration | Create images from descriptions |
| **MCP** | Connect external tools | Stripe, databases, custom APIs |

### Code Interpreter

Execute Python code server-side for data analysis, calculations, and visualizations.

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Calculate the mean, median, and mode of: 10, 20, 30, 40, 50',
  tools: [{ type: 'code_interpreter' }],
});

console.log(response.output_text);
// Model writes and executes Python code, returns results
```

**Advanced Example: Data Analysis**

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Analyze this sales data and create a bar chart showing monthly revenue: [data here]',
  tools: [{ type: 'code_interpreter' }],
});

// Check output for code execution results
response.output.forEach(item => {
  if (item.type === 'code_interpreter_call') {
    console.log('Code executed:', item.input);
    console.log('Result:', item.output);
  }
});
```

**Why this matters:**
- No need to run Python locally
- Sandboxed execution environment
- Automatic chart generation
- Can process uploaded files

### File Search (RAG Without Vector Stores)

Search through uploaded files without building your own RAG pipeline.

```typescript
// 1. Upload files first (one-time setup)
const file = await openai.files.create({
  file: fs.createReadStream('knowledge-base.pdf'),
  purpose: 'assistants',
});

// 2. Use file search
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'What does the document say about pricing?',
  tools: [
    {
      type: 'file_search',
      file_ids: [file.id],
    },
  ],
});

console.log(response.output_text);
// Model searches file and provides answer with citations
```

**Supported File Types:**
- PDFs, Word docs, text files
- Markdown, HTML
- Code files (Python, JavaScript, etc.)
- Max: 512MB per file

### Web Search

Get real-time information from the web.

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'What are the latest updates on GPT-5?',
  tools: [{ type: 'web_search' }],
});

console.log(response.output_text);
// Model searches web and provides current information with sources
```

**Why this matters:**
- No cutoff date limitations
- Automatic source citations
- Real-time data access
- No need for external search APIs

### Image Generation (DALL-E)

Generate images directly in the Responses API.

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Create an image of a futuristic cityscape at sunset',
  tools: [{ type: 'image_generation' }],
});

// Find image in output
response.output.forEach(item => {
  if (item.type === 'image_generation_call') {
    console.log('Image URL:', item.output.url);
  }
});
```

**Models Available:**
- DALL-E 3 (default)
- Various sizes and quality options

---

## MCP Server Integration

The Responses API has built-in support for **Model Context Protocol (MCP)** servers, allowing you to connect external tools.

### What Is MCP?

MCP is an open protocol that standardizes how applications provide context to LLMs. It allows you to:
- Connect to external APIs (Stripe, databases, CRMs)
- Use hosted MCP servers
- Build custom tool integrations

### Basic MCP Integration

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Roll 2d6 dice',
  tools: [
    {
      type: 'mcp',
      server_label: 'dice',
      server_url: 'https://example.com/mcp',
    },
  ],
});

// Model discovers available tools on MCP server and uses them
console.log(response.output_text);
```

### MCP with Authentication (OAuth)

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Create a $20 payment link',
  tools: [
    {
      type: 'mcp',
      server_label: 'stripe',
      server_url: 'https://mcp.stripe.com',
      authorization: process.env.STRIPE_OAUTH_TOKEN,
    },
  ],
});

console.log(response.output_text);
// Model uses Stripe MCP server to create payment link
```

**CRITICAL:**
- API does NOT store authorization tokens
- Must provide token with each request
- Use environment variables for security

### Polymorphic Output: MCP Tool Calls

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Roll 2d4+1',
  tools: [
    {
      type: 'mcp',
      server_label: 'dice',
      server_url: 'https://dmcp.example.com',
    },
  ],
});

// Inspect tool calls
response.output.forEach(item => {
  if (item.type === 'mcp_call') {
    console.log('Tool:', item.name);
    console.log('Arguments:', item.arguments);
    console.log('Output:', item.output);
  }
  if (item.type === 'mcp_list_tools') {
    console.log('Available tools:', item.tools);
  }
});
```

**Output Types:**
- `mcp_list_tools` - Tools discovered on server
- `mcp_call` - Tool invocation and result
- `message` - Final response to user

---

## Reasoning Preservation

### How It Works

The Responses API preserves the model's **internal reasoning state** across turns, unlike Chat Completions which discards it.

**Visual Analogy:**
- **Chat Completions**: Model has a scratchpad, writes reasoning, then **tears out the page** before responding
- **Responses API**: Model keeps the scratchpad open, **previous reasoning visible** for next turn

### Performance Impact

**TAUBench Results (GPT-5):**
- Chat Completions: Baseline score
- Responses API: **+5% better** (purely from preserved reasoning)

**Why This Matters:**
- Better multi-turn problem solving
- More coherent long conversations
- Improved step-by-step reasoning
- Fewer context errors

### Reasoning Summaries (Free!)

The Responses API provides **reasoning summaries** at no additional cost.

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Solve this complex math problem: [problem]',
});

// Inspect reasoning
response.output.forEach(item => {
  if (item.type === 'reasoning') {
    console.log('Model reasoning:', item.summary[0].text);
  }
  if (item.type === 'message') {
    console.log('Final answer:', item.content[0].text);
  }
});
```

**Use Cases:**
- Debugging model decisions
- Audit trails for compliance
- Understanding model thought process
- Building transparent AI systems

---

## Background Mode (Long-Running Tasks)

For tasks that take longer than standard timeout limits, use **background mode**.

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Analyze this 500-page document and summarize key findings',
  background: true,
  tools: [{ type: 'file_search', file_ids: [fileId] }],
});

// Returns immediately with status
console.log(response.status); // "in_progress"
console.log(response.id); // Use to check status later

// Poll for completion
const checkStatus = async (responseId) => {
  const result = await openai.responses.retrieve(responseId);
  if (result.status === 'completed') {
    console.log(result.output_text);
  } else if (result.status === 'failed') {
    console.error('Task failed:', result.error);
  } else {
    // Still running, check again later
    setTimeout(() => checkStatus(responseId), 5000);
  }
};

checkStatus(response.id);
```

**When to Use:**
- Large file processing
- Complex calculations
- Multi-step research tasks
- Data analysis on large datasets

**Timeout Limits:**
- Standard mode: 60 seconds
- Background mode: Up to 10 minutes

---

## Polymorphic Outputs

The Responses API returns **multiple output types** instead of a single message.

### Output Types

| Type | Description | Example |
|------|-------------|---------|
| `message` | Text response to user | Final answer, explanation |
| `reasoning` | Model's internal thought process | Step-by-step reasoning summary |
| `code_interpreter_call` | Code execution | Python code + results |
| `mcp_call` | Tool invocation | Tool name, args, output |
| `mcp_list_tools` | Available tools | Tool definitions from MCP server |
| `file_search_call` | File search results | Matched chunks, citations |
| `web_search_call` | Web search results | URLs, snippets |
| `image_generation_call` | Image generation | Image URL |

### Processing Polymorphic Outputs

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Search the web for the latest AI news and summarize',
  tools: [{ type: 'web_search' }],
});

// Process different output types
response.output.forEach(item => {
  switch (item.type) {
    case 'reasoning':
      console.log('Reasoning:', item.summary[0].text);
      break;
    case 'web_search_call':
      console.log('Searched:', item.query);
      console.log('Sources:', item.results);
      break;
    case 'message':
      console.log('Response:', item.content[0].text);
      break;
  }
});

// Or use helper for text-only
console.log(response.output_text);
```

**Why This Matters:**
- Better debugging (see all steps)
- Audit trails (track all tool calls)
- Richer UX (show progress to users)
- Compliance (log all actions)

---

## Migration from Chat Completions

### Breaking Changes

| Feature | Chat Completions | Responses API | Migration |
|---------|-----------------|---------------|-----------|
| **Endpoint** | `/v1/chat/completions` | `/v1/responses` | Update URL |
| **Parameter** | `messages` | `input` | Rename parameter |
| **State** | Manual (`messages` array) | Automatic (`conversation` ID) | Use conversation IDs |
| **Tools** | `tools` array with functions | Built-in types + MCP | Update tool definitions |
| **Output** | `choices[0].message.content` | `output_text` or `output` array | Update response parsing |
| **Streaming** | `data: {"choices":[...]}` | SSE with multiple item types | Update stream parser |

### Migration Example

**Before (Chat Completions):**
```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
  ],
});

console.log(response.choices[0].message.content);
```

**After (Responses):**
```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: [
    { role: 'developer', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
  ],
});

console.log(response.output_text);
```

**Key Differences:**
1. `chat.completions.create` → `responses.create`
2. `messages` → `input`
3. `system` role → `developer` role
4. `choices[0].message.content` → `output_text`

### When to Migrate

**Migrate now if:**
- ✅ Building new applications
- ✅ Need stateful conversations
- ✅ Using agentic patterns (reasoning + tools)
- ✅ Want better performance (preserved reasoning)

**Stay on Chat Completions if:**
- ✅ Simple one-off generations
- ✅ Legacy integrations
- ✅ No need for state management

---

## Error Handling

### Common Errors and Solutions

#### 1. Session State Not Persisting

**Error:**
```
Conversation state not maintained between turns
```

**Cause:**
- Not using conversation IDs
- Using different conversation IDs per turn

**Solution:**
```typescript
// Create conversation once
const conv = await openai.conversations.create();

// Reuse conversation ID for all turns
const response1 = await openai.responses.create({
  model: 'gpt-5',
  conversation: conv.id, // ✅ Same ID
  input: 'First message',
});

const response2 = await openai.responses.create({
  model: 'gpt-5',
  conversation: conv.id, // ✅ Same ID
  input: 'Follow-up message',
});
```

#### 2. MCP Server Connection Failed

**Error:**
```json
{
  "error": {
    "type": "mcp_connection_error",
    "message": "Failed to connect to MCP server"
  }
}
```

**Causes:**
- Invalid server URL
- Missing or expired authorization token
- Server not responding

**Solutions:**
```typescript
// 1. Verify URL is correct
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Test MCP',
  tools: [
    {
      type: 'mcp',
      server_label: 'test',
      server_url: 'https://api.example.com/mcp', // ✅ Full URL
      authorization: process.env.AUTH_TOKEN, // ✅ Valid token
    },
  ],
});

// 2. Test server URL manually
const testResponse = await fetch('https://api.example.com/mcp');
console.log(testResponse.status); // Should be 200

// 3. Check token expiration
console.log('Token expires:', parseJWT(token).exp);
```

#### 3. Code Interpreter Timeout

**Error:**
```json
{
  "error": {
    "type": "code_interpreter_timeout",
    "message": "Code execution exceeded time limit"
  }
}
```

**Cause:**
- Code runs longer than 30 seconds

**Solution:**
```typescript
// Use background mode for long-running code
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Process this large dataset',
  background: true, // ✅ Extended timeout
  tools: [{ type: 'code_interpreter' }],
});

// Poll for results
const result = await openai.responses.retrieve(response.id);
```

#### 4. Image Generation Rate Limit

**Error:**
```json
{
  "error": {
    "type": "rate_limit_error",
    "message": "DALL-E rate limit exceeded"
  }
}
```

**Cause:**
- Too many image generation requests

**Solution:**
```typescript
// Implement retry with exponential backoff
const generateImage = async (prompt, retries = 3) => {
  try {
    return await openai.responses.create({
      model: 'gpt-5',
      input: prompt,
      tools: [{ type: 'image_generation' }],
    });
  } catch (error) {
    if (error.type === 'rate_limit_error' && retries > 0) {
      const delay = (4 - retries) * 1000; // 1s, 2s, 3s
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateImage(prompt, retries - 1);
    }
    throw error;
  }
};
```

#### 5. File Search Relevance Issues

**Problem:**
- File search returns irrelevant results

**Solution:**
```typescript
// Use more specific queries
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Find sections about pricing in Q4 2024 specifically', // ✅ Specific
  // NOT: 'Find pricing' (too vague)
  tools: [{ type: 'file_search', file_ids: [fileId] }],
});

// Or filter results manually
response.output.forEach(item => {
  if (item.type === 'file_search_call') {
    const relevantChunks = item.results.filter(
      chunk => chunk.score > 0.7 // ✅ Only high-confidence matches
    );
  }
});
```

#### 6. Cost Tracking Confusion

**Problem:**
- Billing different than expected

**Explanation:**
- Responses API bills for: input tokens + output tokens + tool usage + stored conversations
- Chat Completions bills only: input tokens + output tokens

**Solution:**
```typescript
// Monitor usage
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Hello',
  store: false, // ✅ Don't store if not needed
});

console.log('Usage:', response.usage);
// {
//   prompt_tokens: 10,
//   completion_tokens: 20,
//   tool_tokens: 5,
//   total_tokens: 35
// }
```

#### 7. Conversation Not Found

**Error:**
```json
{
  "error": {
    "type": "invalid_request_error",
    "message": "Conversation conv_xyz not found"
  }
}
```

**Causes:**
- Conversation ID typo
- Conversation deleted
- Conversation expired (90 days)

**Solution:**
```typescript
// Verify conversation exists before using
const conversations = await openai.conversations.list();
const exists = conversations.data.some(c => c.id === 'conv_xyz');

if (!exists) {
  // Create new conversation
  const newConv = await openai.conversations.create();
  // Use newConv.id
}
```

#### 8. Tool Output Parsing Failed

**Problem:**
- Can't access tool outputs correctly

**Solution:**
```typescript
// Use helper methods
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Search for AI news',
  tools: [{ type: 'web_search' }],
});

// Helper: Get text-only output
console.log(response.output_text);

// Manual: Inspect all outputs
response.output.forEach(item => {
  console.log('Type:', item.type);
  console.log('Content:', item);
});
```

---

## Production Patterns

### Cost Optimization

**1. Use Conversation IDs (Cache Benefits)**
```typescript
// ✅ GOOD: Reuse conversation ID
const conv = await openai.conversations.create();
const response1 = await openai.responses.create({
  model: 'gpt-5',
  conversation: conv.id,
  input: 'Question 1',
});
// 40-80% better cache utilization

// ❌ BAD: New manual history each time
const response2 = await openai.responses.create({
  model: 'gpt-5',
  input: [...previousHistory, newMessage],
});
// No cache benefits
```

**2. Disable Storage When Not Needed**
```typescript
// For one-off requests
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Quick question',
  store: false, // ✅ Don't store conversation
});
```

**3. Use Smaller Models When Possible**
```typescript
// For simple tasks
const response = await openai.responses.create({
  model: 'gpt-5-mini', // ✅ 50% cheaper
  input: 'Summarize this paragraph',
});
```

### Rate Limit Handling

```typescript
const createResponseWithRetry = async (params, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await openai.responses.create(params);
    } catch (error) {
      if (error.type === 'rate_limit_error' && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        console.log(`Rate limited, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};
```

### Monitoring and Logging

```typescript
const monitoredResponse = async (input) => {
  const startTime = Date.now();

  try {
    const response = await openai.responses.create({
      model: 'gpt-5',
      input,
    });

    // Log success metrics
    console.log({
      status: 'success',
      latency: Date.now() - startTime,
      tokens: response.usage.total_tokens,
      model: response.model,
      conversation: response.conversation_id,
    });

    return response;
  } catch (error) {
    // Log error metrics
    console.error({
      status: 'error',
      latency: Date.now() - startTime,
      error: error.message,
      type: error.type,
    });
    throw error;
  }
};
```

---

## Node.js vs Cloudflare Workers

### Node.js Implementation

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handleRequest(input: string) {
  const response = await openai.responses.create({
    model: 'gpt-5',
    input,
    tools: [{ type: 'web_search' }],
  });

  return response.output_text;
}
```

**Pros:**
- Full SDK support
- Type safety
- Streaming helpers

**Cons:**
- Requires Node.js runtime
- Larger bundle size

### Cloudflare Workers Implementation

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { input } = await request.json();

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        input,
        tools: [{ type: 'web_search' }],
      }),
    });

    const data = await response.json();

    return new Response(data.output_text, {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};
```

**Pros:**
- No dependencies
- Edge deployment
- Faster cold starts

**Cons:**
- Manual request building
- No type safety without custom types

---

## Always Do / Never Do

### ✅ Always Do

1. **Use conversation IDs for multi-turn interactions**
   ```typescript
   const conv = await openai.conversations.create();
   // Reuse conv.id for all related turns
   ```

2. **Handle all output types in polymorphic responses**
   ```typescript
   response.output.forEach(item => {
     if (item.type === 'reasoning') { /* log */ }
     if (item.type === 'message') { /* display */ }
   });
   ```

3. **Use background mode for long-running tasks**
   ```typescript
   const response = await openai.responses.create({
     background: true, // ✅ For tasks >30s
     ...
   });
   ```

4. **Provide authorization tokens for MCP servers**
   ```typescript
   tools: [{
     type: 'mcp',
     authorization: process.env.TOKEN, // ✅ Required
   }]
   ```

5. **Monitor token usage for cost control**
   ```typescript
   console.log(response.usage.total_tokens);
   ```

### ❌ Never Do

1. **Never expose API keys in client-side code**
   ```typescript
   // ❌ DANGER: API key in browser
   const response = await fetch('https://api.openai.com/v1/responses', {
     headers: { 'Authorization': 'Bearer sk-proj-...' }
   });
   ```

2. **Never assume single message output**
   ```typescript
   // ❌ BAD: Ignores reasoning, tool calls
   console.log(response.output[0].content);

   // ✅ GOOD: Use helper or check all types
   console.log(response.output_text);
   ```

3. **Never reuse conversation IDs across users**
   ```typescript
   // ❌ DANGER: User A sees User B's conversation
   const sharedConv = 'conv_123';
   ```

4. **Never ignore error types**
   ```typescript
   // ❌ BAD: Generic error handling
   try { ... } catch (e) { console.log('error'); }

   // ✅ GOOD: Type-specific handling
   catch (e) {
     if (e.type === 'rate_limit_error') { /* retry */ }
     if (e.type === 'mcp_connection_error') { /* alert */ }
   }
   ```

5. **Never poll faster than 1 second for background tasks**
   ```typescript
   // ❌ BAD: Too frequent
   setInterval(() => checkStatus(), 100);

   // ✅ GOOD: Reasonable interval
   setInterval(() => checkStatus(), 5000);
   ```

---

## References

### Official Documentation
- **Responses API Guide**: https://platform.openai.com/docs/guides/responses
- **API Reference**: https://platform.openai.com/docs/api-reference/responses
- **MCP Integration**: https://platform.openai.com/docs/guides/tools-connectors-mcp
- **Blog Post (Why Responses API)**: https://developers.openai.com/blog/responses-api/
- **Starter App**: https://github.com/openai/openai-responses-starter-app

### Skill Resources
- `templates/` - Working code examples
- `references/responses-vs-chat-completions.md` - Feature comparison
- `references/mcp-integration-guide.md` - MCP server setup
- `references/built-in-tools-guide.md` - Tool usage patterns
- `references/stateful-conversations.md` - Conversation management
- `references/migration-guide.md` - Chat Completions → Responses
- `references/top-errors.md` - Common errors and solutions

---

## Next Steps

1. ✅ Read `templates/basic-response.ts` - Simple example
2. ✅ Try `templates/stateful-conversation.ts` - Multi-turn chat
3. ✅ Explore `templates/mcp-integration.ts` - External tools
4. ✅ Review `references/top-errors.md` - Avoid common pitfalls
5. ✅ Check `references/migration-guide.md` - If migrating from Chat Completions

**Happy building with the Responses API!** 🚀
