# Example: AI-Powered Research Assistant

This example shows planning docs for an AI-powered research assistant with agents and tools.

**User Request**: "I want to build an AI research assistant that can search the web, summarize articles, and help me organize research notes. Users should be able to chat with the AI and have it perform actions on their behalf."

---

## IMPLEMENTATION_PHASES.md (Excerpt)

# Implementation Phases: AI Research Assistant

**Project Type**: AI-Powered Web App with Agents
**Stack**: Cloudflare Workers + Vite + React + D1 + Clerk + OpenAI
**Estimated Total**: 30 hours (~30 minutes human time)
**Created**: 2025-10-25

---

## Phase 1-3: [Standard setup phases - Infrastructure, Database, Auth]

[Similar to auth-web-app.md example]

---

## Phase 4: OpenAI Integration
**Type**: Integration
**Estimated**: 3 hours
**Files**: `src/lib/openai-client.ts`, `src/routes/ai.ts`

### Tasks
- [ ] Create OpenAI account and get API key
- [ ] Install `openai` package
- [ ] Create AI client wrapper
- [ ] Test basic chat completion
- [ ] Implement streaming responses
- [ ] Add error handling and retries
- [ ] Test token usage tracking

### Verification Criteria
- [ ] Can send message to OpenAI
- [ ] Receives streaming response
- [ ] Streams correctly to frontend
- [ ] Errors handled gracefully (rate limits, API down)
- [ ] Token usage logged

### Exit Criteria
OpenAI integration working with streaming responses.

---

## Phase 5: AI Tools (Functions)
**Type**: Integration
**Estimated**: 5 hours
**Files**: `src/lib/ai-tools.ts`, `src/lib/web-search.ts`

### Tasks
- [ ] Define tool: `search_web` (using Brave Search API or similar)
- [ ] Define tool: `save_note` (save to user's notes in D1)
- [ ] Define tool: `search_notes` (search user's existing notes)
- [ ] Define tool: `summarize_url` (fetch and summarize webpage)
- [ ] Implement tool execution logic
- [ ] Add tool result formatting
- [ ] Test each tool independently

### Verification Criteria
- [ ] `search_web` returns relevant results
- [ ] `save_note` creates note in database
- [ ] `search_notes` finds user's notes
- [ ] `summarize_url` fetches and summarizes content
- [ ] Tools work when called by AI
- [ ] Tool errors handled (404, timeout, etc)

### Exit Criteria
All AI tools implemented and tested.

---

## Phase 6: Research Agent
**Type**: Integration
**Estimated**: 4 hours
**Files**: `src/agents/research-agent.ts`, `src/routes/agents.ts`

### Tasks
- [ ] Design research agent system prompt
- [ ] Implement agent with tool calling
- [ ] Add conversation state (Durable Object or in-memory)
- [ ] Implement streaming tool calls to frontend
- [ ] Add agent endpoint: POST /api/agents/research
- [ ] Test multi-step research workflow

### Verification Criteria
- [ ] Agent responds to questions
- [ ] Agent calls tools when needed
- [ ] Tool results incorporated into response
- [ ] Multi-turn conversation works
- [ ] Streaming updates show tool usage to user

### Exit Criteria
Research agent working with tool integration.

---

## Phase 7: Notes Management
**Type**: API + UI
**Estimated**: 6 hours
**Files**: `src/routes/notes.ts`, `src/components/NotesList.tsx`, etc.

### Tasks
- [ ] Create notes CRUD API
- [ ] Build notes list UI
- [ ] Build note viewer/editor
- [ ] Add markdown rendering
- [ ] Add note search functionality
- [ ] Integrate AI-saved notes with manual notes

### Verification Criteria
- [ ] Can view all notes
- [ ] Can create/edit/delete notes manually
- [ ] AI-saved notes appear in list
- [ ] Markdown renders correctly
- [ ] Search finds notes

### Exit Criteria
Complete notes management system.

---

## Phase 8: Chat Interface
**Type**: UI
**Estimated**: 8 hours
**Files**: `src/components/ChatInterface.tsx`, `src/components/Message.tsx`, etc.

### Tasks
- [ ] Install Vercel AI SDK (`@ai-sdk/react`)
- [ ] Build chat UI with message list
- [ ] Implement message input with auto-resize
- [ ] Add streaming message display
- [ ] Show tool call indicators (loading states)
- [ ] Display tool results inline
- [ ] Add conversation history persistence
- [ ] Style with shadcn/ui components

### Verification Criteria
- [ ] Messages stream correctly
- [ ] Tool calls show loading indicators
- [ ] Tool results displayed clearly
- [ ] Can continue conversation
- [ ] Conversation history persists
- [ ] UI handles errors gracefully

### Exit Criteria
Polished chat interface with full AI interaction.

---

## AGENTS_CONFIG.md (Excerpt)

# AI Agents Configuration: AI Research Assistant

**AI Provider**: OpenAI
**Model**: gpt-5
**Framework**: Vercel AI SDK

---

## Agents

### Research Agent

**Purpose**: Help users research topics by searching the web, summarizing content, and organizing notes.

**Model**: gpt-5 (for complex reasoning, tool use)

**System Prompt**:
```
You are a research assistant helping users gather and organize information.

Your capabilities:
- Search the web for information on any topic
- Summarize articles and web pages
- Save important findings as notes
- Search through saved notes
- Provide citations and sources

Your workflow:
1. When asked about a topic, search the web for recent information
2. Summarize key findings concisely
3. Offer to save important information as notes
4. Always cite sources with URLs

Guidelines:
- Be thorough but concise
- Verify information from multiple sources when possible
- Organize information logically
- Ask clarifying questions if user request is vague
- Always provide sources for claims

Response format:
- Use markdown for structure
- Use bullet points for lists
- Bold important findings
- Include clickable links to sources
```

**Available Tools**:
- `search_web` - Search the web using Brave Search API
- `summarize_url` - Fetch and summarize a specific webpage
- `save_note` - Save information as a note in user's database
- `search_notes` - Search user's existing notes

**Example Conversation**:
```
User: "What are the latest developments in quantum computing?"

Agent: I'll search for recent information on quantum computing.

[Calls: search_web({ query: "latest quantum computing developments 2025" })]

Based on recent sources, here are the latest developments:

1. **IBM's 1000-qubit processor** - Announced in Q3 2025
   - Source: [IBM Research](https://...)

2. **Google's error correction breakthrough** - Published in Nature
   - Reduced error rates by 50%
   - Source: [Nature article](https://...)

3. **Commercial applications emerging**
   - Drug discovery (Pfizer partnership)
   - Financial modeling (Goldman Sachs)

Would you like me to save any of these findings as notes?

User: "Yes, save the IBM development"

Agent: [Calls: save_note({ title: "IBM 1000-qubit processor", content: "...", source: "..." })]

✓ Saved note: "IBM 1000-qubit processor"
```

---

## Tools

### Tool: `search_web`

**Purpose**: Search the web for information

**Parameters**:
```typescript
{
  query: string,       // Search query
  limit?: number       // Max results (default 5)
}
```

**Implementation**:
```typescript
export async function search_web(
  { query, limit = 5 }: SearchWebParams,
  context: Context
) {
  const response = await fetch('https://api.search.brave.com/res/v1/web/search', {
    headers: {
      'X-Subscription-Token': context.env.BRAVE_API_KEY
    },
    params: { q: query, count: limit }
  })

  const data = await response.json()

  return {
    success: true,
    results: data.web.results.map(r => ({
      title: r.title,
      url: r.url,
      description: r.description
    }))
  }
}
```

**Example**:
```typescript
// Agent calls
const results = await search_web({
  query: "quantum computing 2025",
  limit: 5
})

// Returns
{
  success: true,
  results: [
    {
      title: "IBM announces 1000-qubit processor",
      url: "https://...",
      description: "IBM has unveiled..."
    }
  ]
}
```

---

### Tool: `summarize_url`

**Purpose**: Fetch and summarize a webpage

**Parameters**:
```typescript
{
  url: string          // URL to fetch and summarize
}
```

**Implementation**:
```typescript
export async function summarize_url(
  { url }: SummarizeUrlParams,
  context: Context
) {
  // Fetch webpage
  const response = await fetch(url)
  const html = await response.text()

  // Extract main content (simplified - use Readability or similar in production)
  const text = extractMainContent(html)

  // Summarize with OpenAI
  const summary = await context.env.AI.run('@cf/meta/llama-3-8b-instruct', {
    prompt: `Summarize this article in 3-5 bullet points:\n\n${text}`
  })

  return {
    success: true,
    summary: summary.response,
    url
  }
}
```

---

### Tool: `save_note`

**Purpose**: Save information as a note

**Parameters**:
```typescript
{
  title: string,       // Note title
  content: string,     // Note content (markdown)
  source?: string,     // Optional source URL
  tags?: string[]      // Optional tags
}
```

**Implementation**:
```typescript
export async function save_note(
  { title, content, source, tags }: SaveNoteParams,
  context: Context
) {
  const userId = context.get('userId')

  const result = await context.env.DB.prepare(`
    INSERT INTO notes (user_id, title, content, source, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(userId, title, content, source, Date.now(), Date.now()).run()

  // Add tags if provided
  if (tags?.length) {
    // ... insert tag associations
  }

  return {
    success: true,
    noteId: result.meta.last_row_id
  }
}
```

---

### Tool: `search_notes`

**Purpose**: Search user's existing notes

**Parameters**:
```typescript
{
  query: string,       // Search query
  limit?: number       // Max results (default 5)
}
```

**Implementation**:
```typescript
export async function search_notes(
  { query, limit = 5 }: SearchNotesParams,
  context: Context
) {
  const userId = context.get('userId')

  // Simple full-text search (use Vectorize for semantic search in production)
  const results = await context.env.DB.prepare(`
    SELECT id, title, content, source, created_at
    FROM notes
    WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(userId, `%${query}%`, `%${query}%`, limit).all()

  return {
    success: true,
    notes: results.results
  }
}
```

---

## Streaming Responses

**Server** (POST /api/agents/research):
```typescript
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

app.post('/api/agents/research', async (c) => {
  const { message, conversationId } = await c.req.json()
  const userId = c.get('userId')

  // Get conversation history (from Durable Object or DB)
  const history = await getConversationHistory(conversationId)

  const result = await streamText({
    model: openai('gpt-5'),
    messages: [
      { role: 'system', content: RESEARCH_AGENT_PROMPT },
      ...history,
      { role: 'user', content: message }
    ],
    tools: {
      search_web,
      summarize_url,
      save_note,
      search_notes
    },
    onFinish: async ({ text }) => {
      // Save conversation
      await saveMessage(conversationId, { role: 'assistant', content: text })
    }
  })

  return result.toAIStreamResponse()
})
```

**Client** (React):
```typescript
import { useChat } from '@ai-sdk/react'

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/agents/research'
  })

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <Message key={m.id} message={m} />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4">
        <textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Ask me anything..."
          className="w-full p-2 border rounded"
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  )
}
```

**Tool Call Display**:
```typescript
function Message({ message }) {
  return (
    <div className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[80%] rounded-lg p-4 bg-muted">
        <ReactMarkdown>{message.content}</ReactMarkdown>

        {message.toolInvocations?.map((tool, i) => (
          <div key={i} className="mt-2 text-sm border-l-2 pl-2">
            <span className="font-semibold">🔧 {tool.toolName}</span>
            {tool.state === 'result' && (
              <div className="text-muted-foreground">
                ✓ {tool.result.success ? 'Success' : 'Failed'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## DATABASE_SCHEMA.md (Additions)

### `notes`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PRIMARY KEY | |
| `user_id` | INTEGER | FOREIGN KEY | References users(id) |
| `title` | TEXT | NOT NULL | Note title |
| `content` | TEXT | NOT NULL | Note content (markdown) |
| `source` | TEXT | NULL | Source URL if from web |
| `created_at` | INTEGER | NOT NULL | |
| `updated_at` | INTEGER | NOT NULL | |

### `conversations`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PRIMARY KEY | |
| `user_id` | INTEGER | FOREIGN KEY | References users(id) |
| `title` | TEXT | NULL | Auto-generated from first message |
| `created_at` | INTEGER | NOT NULL | |
| `updated_at` | INTEGER | NOT NULL | |

### `messages`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PRIMARY KEY | |
| `conversation_id` | INTEGER | FOREIGN KEY | References conversations(id) |
| `role` | TEXT | NOT NULL | 'user' or 'assistant' |
| `content` | TEXT | NOT NULL | Message content |
| `tool_calls` | TEXT | NULL | JSON array of tool calls |
| `created_at` | INTEGER | NOT NULL | |

---

## INTEGRATION.md (Additions)

### OpenAI

**Purpose**: AI-powered chat and tool use

**Environment Variables**:
```env
OPENAI_API_KEY=sk-...
```

**API Client**:
```typescript
import { openai } from '@ai-sdk/openai'

const model = openai('gpt-5')
```

**Rate Limits**: 10,000 requests/minute (Tier 5)

**Token Management**:
- Use `gpt-5-mini` for simple tasks (cheaper)
- Use `gpt-5` for complex research (better reasoning)
- Limit conversation history to last 20 messages
- Track token usage per user (optional billing)

---

### Brave Search API

**Purpose**: Web search for research agent

**Environment Variables**:
```env
BRAVE_API_KEY=...
```

**Rate Limits**: 15,000 queries/month (free tier)

---

**Note**: This example demonstrates a complete AI-powered application with agents, tools, and streaming responses. Adjust complexity based on actual requirements.
