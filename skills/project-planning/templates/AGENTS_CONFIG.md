# AI Agents Configuration: [Project Name]

**AI Provider**: [OpenAI / Claude / Gemini / Cloudflare AI]
**Framework**: [Vercel AI SDK / Custom / Cloudflare Workers AI]
**Agent Architecture**: [Single agent / Multi-agent / Agentic workflows]
**Last Updated**: [Date]

---

## Overview

This document defines AI agents, their capabilities, tools, and workflows for this project.

**Agent Philosophy**:
- **Purpose-built agents** - Each agent has a specific, well-defined role
- **Tool-equipped** - Agents have access to functions they need
- **Conversational** - Agents can ask clarifying questions
- **Stateful when needed** - Use Durable Objects for long-running conversations
- **Fail gracefully** - Always have fallback responses

---

## AI Provider Configuration

### Primary Provider: [Provider Name]

**Model**: [e.g., gpt-5, claude-sonnet-4-5, gemini-2.5-pro]
**API Key**: Stored in environment variable `[KEY_NAME]`
**Base URL**: [API endpoint]

**Configuration**:
```typescript
// src/lib/ai-config.ts
export const aiConfig = {
  provider: '[provider]',
  model: '[model-name]',
  apiKey: process.env.[KEY_NAME],
  temperature: 0.7,
  maxTokens: 2000,
  topP: 1.0
}
```

**Fallback Provider** (optional): [Secondary provider if primary fails]

---

## Agents

### Agent 1: [Agent Name]

**Purpose**: [What this agent does]
**Model**: [Specific model if different from default]
**Context Window**: [Token limit for this agent]

**Capabilities**:
- [Capability 1]
- [Capability 2]
- [Capability 3]

**System Prompt**:
```
You are [agent role]. Your goal is to [agent purpose].

Guidelines:
- [Guideline 1]
- [Guideline 2]
- [Guideline 3]

When you need information you don't have:
- Use available tools
- Ask the user clarifying questions
- Provide your best answer with caveats

Response format:
- Be concise and actionable
- Use markdown for formatting
- Include code examples when helpful
```

**Available Tools**:
- `[tool_name]` - [Description]
- `[tool_name]` - [Description]

**Example Conversation**:
```
User: [Example input]
Agent: [Example response]

User: [Follow-up]
Agent: [Agent uses tool and responds]
```

**Endpoint**: `POST /api/agents/[agent-name]`

**Request**:
```json
{
  "message": "User message",
  "conversationId": "optional-conversation-id",
  "context": { "optional": "context" }
}
```

**Response** (streaming):
```
data: {"type":"text","content":"Agent response..."}
data: {"type":"tool_call","name":"search","args":{"query":"..."}}
data: {"type":"tool_result","result":{...}}
data: {"type":"done"}
```

---

### Agent 2: [Agent Name]

**Purpose**: [What this agent does]

[... repeat structure from Agent 1 ...]

---

## Tools (Functions)

AI agents can call these functions to perform actions or retrieve information.

### Tool: `[tool_name]`

**Purpose**: [What this tool does]

**Parameters**:
```typescript
{
  param1: string,  // Description
  param2: number,  // Description
  param3?: boolean // Optional description
}
```

**Implementation**:
```typescript
// src/lib/ai-tools.ts
export async function [tool_name](params: ToolParams, context: Context) {
  // Tool logic
  const result = await performAction(params)
  return result
}
```

**Example**:
```typescript
// Agent calls tool
const result = await [tool_name]({
  param1: "value",
  param2: 42
})

// Tool returns
{
  success: true,
  data: { /* result */ }
}
```

**Failure Handling**: [How tool handles errors]

---

### Tool: `search_database`

**Purpose**: Search the database for user-specific information

**Parameters**:
```typescript
{
  query: string,      // Natural language search query
  table: string,      // Which table to search
  limit?: number      // Max results (default 5)
}
```

**Implementation**:
```typescript
export async function search_database(
  { query, table, limit = 5 }: SearchParams,
  context: Context
) {
  const userId = context.get('userId')

  // Convert natural language to SQL (simplified example)
  const results = await context.env.DB.prepare(
    `SELECT * FROM ${table} WHERE user_id = ? LIMIT ?`
  ).bind(userId, limit).all()

  return {
    success: true,
    data: results.results
  }
}
```

---

## Agent Workflows

### Workflow: [Workflow Name]

**Purpose**: [What this workflow accomplishes]

**Agents Involved**:
1. [Agent 1] - [Role in workflow]
2. [Agent 2] - [Role in workflow]

**Flow**:
```
1. User submits [input]
   ↓
2. [Agent 1] analyzes input
   ↓
3. [Agent 1] calls tool: [tool_name]
   ↓
4. Tool returns data
   ↓
5. [Agent 1] generates response
   ↓
6. If needed: Hand off to [Agent 2]
   ↓
7. [Agent 2] completes task
   ↓
8. Return final result to user
```

**Example**:
```
User: "Find all high-priority tasks and create a summary report"

[Planner Agent] → Calls search_database(query="high priority tasks")
                → Receives 5 tasks
                → Hands off to [Writer Agent] with task data

[Writer Agent] → Generates formatted report
               → Returns markdown report to user
```

---

## Conversation State

### Stateless Agents (Default)

**When to use**: Single-turn interactions, no context needed

**Implementation**: Each request is independent

**Example**: Simple Q&A, content generation

---

### Stateful Agents (Durable Objects)

**When to use**: Multi-turn conversations, context retention

**Implementation**: Store conversation history in Durable Object

**Setup**:
```typescript
// src/durable-objects/conversation.ts
export class Conversation implements DurableObject {
  private messages: Message[] = []

  async fetch(request: Request) {
    const { message } = await request.json()

    // Add user message to history
    this.messages.push({ role: 'user', content: message })

    // Call AI with full conversation history
    const response = await callAI({
      messages: this.messages,
      tools: availableTools
    })

    // Add assistant response to history
    this.messages.push({ role: 'assistant', content: response })

    return new Response(JSON.stringify({ response }))
  }
}
```

**Wrangler Config**:
```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "CONVERSATIONS",
        "class_name": "Conversation",
        "script_name": "app"
      }
    ]
  }
}
```

**Usage**:
```typescript
// Create/get conversation
const conversationId = crypto.randomUUID()
const durableObjectId = env.CONVERSATIONS.idFromName(conversationId)
const stub = env.CONVERSATIONS.get(durableObjectId)

// Send message to conversation
const response = await stub.fetch(request)
```

---

## Streaming Responses

**Why stream**: Better UX, appears faster, shows progress

**Implementation** (Server-Sent Events):
```typescript
// src/routes/agents.ts
app.post('/api/agents/:agentName', async (c) => {
  const { message } = await c.req.json()

  const stream = await streamAIResponse({
    message,
    agent: c.req.param('agentName')
  })

  return c.newResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
})
```

**Client** (Vercel AI SDK):
```typescript
import { useChat } from '@ai-sdk/react'

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/agents/chat'
  })

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>{m.content}</div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
      </form>
    </div>
  )
}
```

---

## Prompt Engineering

### System Prompt Best Practices

**Structure**:
1. **Role definition** - "You are a [role]"
2. **Capabilities** - What the agent can do
3. **Constraints** - What the agent cannot do
4. **Tone/style** - How the agent should respond
5. **Output format** - Markdown, JSON, etc

**Example**:
```
You are a helpful task management assistant.

Your capabilities:
- Search user's tasks
- Create, update, delete tasks
- Generate task summaries and reports
- Set reminders and priorities

Your constraints:
- Never access other users' data
- Always confirm before deleting tasks
- Ask for clarification if user intent is unclear

Response style:
- Be concise and actionable
- Use bullet points for lists
- Include task IDs for reference

Output format:
- Use markdown formatting
- Bold important information
- Use code blocks for task IDs
```

---

## Token Management

**Cost Optimization**:
- Use smaller models for simple tasks (gpt-5-mini, claude-haiku-4-5)
- Use larger models only when needed (gpt-5, claude-sonnet-4-5)
- Limit conversation history (keep last N messages)
- Summarize long conversations to reduce tokens

**Token Budgets**:
```typescript
const TOKEN_BUDGETS = {
  'simple-qa': {
    model: 'gpt-5-mini',
    maxInputTokens: 500,
    maxOutputTokens: 500
  },
  'complex-analysis': {
    model: 'gpt-5',
    maxInputTokens: 4000,
    maxOutputTokens: 2000
  }
}
```

---

## Error Handling

### AI Provider Failures

**Handle**:
- Rate limits (retry with backoff)
- API errors (fallback provider or error message)
- Timeout (abort and inform user)

**Example**:
```typescript
try {
  const response = await callAI({ message, tools })
  return response
} catch (error) {
  if (error.code === 'rate_limit') {
    // Retry with exponential backoff
    await sleep(2000)
    return await callAI({ message, tools })
  } else {
    // Return graceful error
    return {
      error: true,
      message: "I'm having trouble processing that right now. Please try again."
    }
  }
}
```

---

## Testing AI Agents

### Unit Tests (Tool Functions)

Test each tool independently:
```typescript
describe('search_database tool', () => {
  it('returns user-specific results', async () => {
    const result = await search_database({
      query: 'high priority',
      table: 'tasks'
    }, mockContext)

    expect(result.success).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
  })
})
```

---

### Integration Tests (Agent Endpoints)

Test agent responses:
```typescript
describe('POST /api/agents/assistant', () => {
  it('responds to simple query', async () => {
    const res = await app.request('/api/agents/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token'
      },
      body: JSON.stringify({
        message: 'List my tasks'
      })
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.response).toContain('task')
  })
})
```

---

### Manual Testing

**Test Prompts**:
- Simple queries: "What tasks do I have?"
- Tool usage: "Create a new task called 'Review PR'"
- Edge cases: "Delete all my tasks" (should confirm first)
- Unclear input: "Do the thing" (should ask for clarification)
- Multi-step: "Find high-priority tasks and summarize them"

---

## Monitoring and Observability

**Metrics to track**:
- Agent invocations per day
- Average response time
- Token usage (input + output)
- Tool call frequency
- Error rate

**Logging**:
```typescript
console.log('[Agent]', {
  agent: 'assistant',
  userId: context.get('userId'),
  message: message.substring(0, 50),
  tokensUsed: response.usage.total_tokens,
  toolsCalled: toolCalls.map(t => t.name),
  responseTime: Date.now() - startTime
})
```

**Cloudflare Workers Analytics Engine** (optional):
```typescript
await env.ANALYTICS.writeDataPoint({
  indexes: [userId],
  doubles: [responseTime, tokensUsed],
  blobs: [agentName, toolsCalled]
})
```

---

## Future Agent Enhancements

- [ ] Add [agent name] for [purpose]
- [ ] Integrate [tool name] for [capability]
- [ ] Implement [workflow name]
- [ ] Add voice input/output
- [ ] Multi-modal support (images, files)

---

## Revision History

**v1.0** ([Date]): Initial agent configuration
**v1.1** ([Date]): [Changes made]
