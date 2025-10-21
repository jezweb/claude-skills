---
name: cloudflare-agents
description: |
  Comprehensive guide for the Cloudflare Agents SDK - build AI-powered autonomous agents on Workers + Durable Objects.

  Use when: building AI agents, creating stateful agents with WebSockets, implementing chat agents with streaming, scheduling tasks with cron/delays, running asynchronous workflows, building RAG (Retrieval Augmented Generation) systems with Vectorize, creating MCP (Model Context Protocol) servers, implementing human-in-the-loop workflows, browsing the web with Browser Rendering, managing agent state with SQL, syncing state between agents and clients, calling agents from Workers, building multi-agent systems, or encountering Agent configuration errors.

  Prevents 15+ documented issues: migrations not atomic, missing new_sqlite_classes, Agent class not exported, binding name mismatch, global uniqueness gotchas, WebSocket state handling, scheduled task callback errors, state size limits, workflow binding missing, browser binding required, vectorize index not found, MCP transport confusion, authentication bypassed, instance naming errors, and state sync failures.

  Keywords: Cloudflare Agents, agents sdk, cloudflare agents sdk, Agent class, Durable Objects agents, stateful agents, WebSocket agents, this.setState, this.sql, this.schedule, schedule tasks, cron agents, run workflows, agent workflows, browse web, puppeteer agents, browser rendering, rag agents, vectorize agents, embeddings, mcp server, McpAgent, mcp tools, model context protocol, routeAgentRequest, getAgentByName, useAgent hook, AgentClient, agentFetch, useAgentChat, AIChatAgent, chat agents, streaming chat, human in the loop, hitl agents, multi-agent, agent orchestration, autonomous agents, long-running agents, AI SDK, Workers AI, "Agent class must extend", "new_sqlite_classes", "migrations required", "binding not found", "agent not exported", "callback does not exist", "state limit exceeded"
license: MIT
---

# Cloudflare Agents SDK

**Status**: Production Ready ✅
**Last Updated**: 2025-10-21
**Dependencies**: cloudflare-worker-base (recommended)
**Latest Versions**: agents@latest, @modelcontextprotocol/sdk@latest
**Production Tested**: Cloudflare's own MCP servers (https://github.com/cloudflare/mcp-server-cloudflare)

---

## What is Cloudflare Agents?

The Cloudflare Agents SDK enables building AI-powered autonomous agents that run on Cloudflare Workers + Durable Objects. Agents can:

- **Communicate in real-time** via WebSockets and Server-Sent Events
- **Persist state** with built-in SQLite database (up to 1GB per agent)
- **Schedule tasks** using delays, specific dates, or cron expressions
- **Run workflows** by triggering asynchronous Cloudflare Workflows
- **Browse the web** using Browser Rendering API + Puppeteer
- **Implement RAG** with Vectorize vector database + Workers AI embeddings
- **Build MCP servers** implementing the Model Context Protocol
- **Support human-in-the-loop** patterns for review and approval
- **Scale to millions** of independent agent instances globally

Each agent instance is a **globally unique, stateful micro-server** that can run for seconds, minutes, or hours.

---

## Quick Start (10 Minutes)

### 1. Scaffold Project with Template

```bash
npm create cloudflare@latest my-agent -- \
  --template=cloudflare/agents-starter \
  --ts \
  --git \
  --deploy false
```

**What this creates:**
- Complete Agent project structure
- TypeScript configuration
- wrangler.jsonc with Durable Objects bindings
- Example chat agent implementation
- React client with useAgent hook

### 2. Or Add to Existing Worker

```bash
cd my-existing-worker
npm install agents
```

**Then create an Agent class:**

```typescript
// src/index.ts
import { Agent, AgentNamespace } from "agents";

export class MyAgent extends Agent {
  async onRequest(request: Request): Promise<Response> {
    return new Response("Hello from Agent!");
  }
}

export default MyAgent;
```

### 3. Configure Durable Objects Binding

Create or update `wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-agent",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-21",
  "compatibility_flags": ["nodejs_compat"],
  "durable_objects": {
    "bindings": [
      {
        "name": "MyAgent",        // MUST match class name
        "class_name": "MyAgent"   // MUST match exported class
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["MyAgent"]  // CRITICAL: Enables SQLite storage
    }
  ]
}
```

**CRITICAL Configuration Rules:**
- ✅ `name` and `class_name` **MUST be identical**
- ✅ `new_sqlite_classes` **MUST be in first migration** (cannot add later)
- ✅ Agent class **MUST be exported** (or binding will fail)
- ✅ Migration tags **CANNOT be reused** (each migration needs unique tag)

### 4. Deploy

```bash
npx wrangler@latest deploy
```

Your agent is now running at: `https://my-agent.<subdomain>.workers.dev`

---

## Configuration Deep Dive

### Complete wrangler.jsonc Example

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-agent",
  "main": "src/index.ts",
  "account_id": "YOUR_ACCOUNT_ID",
  "compatibility_date": "2025-10-21",
  "compatibility_flags": ["nodejs_compat"],

  // Durable Objects configuration (REQUIRED)
  "durable_objects": {
    "bindings": [
      {
        "name": "MyAgent",
        "class_name": "MyAgent"
      }
    ]
  },

  // Migrations (REQUIRED)
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["MyAgent"]  // Enables state persistence
    }
  ],

  // Optional: Workers AI binding (for AI model calls)
  "ai": {
    "binding": "AI"
  },

  // Optional: Vectorize binding (for RAG)
  "vectorize": {
    "bindings": [
      {
        "binding": "VECTORIZE",
        "index_name": "my-agent-vectors"
      }
    ]
  },

  // Optional: Browser Rendering binding (for web browsing)
  "browser": {
    "binding": "BROWSER"
  },

  // Optional: Workflows binding (for async workflows)
  "workflows": [
    {
      "name": "MY_WORKFLOW",
      "class_name": "MyWorkflow",
      "script_name": "my-workflow-script"  // If in different project
    }
  ],

  // Optional: D1 binding (for additional persistent data)
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-agent-db",
      "database_id": "your-database-id"
    }
  ],

  // Optional: R2 binding (for file storage)
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "my-agent-files"
    }
  ],

  // Optional: Environment variables
  "vars": {
    "ENVIRONMENT": "production"
  },

  // Optional: Secrets (set with: wrangler secret put KEY)
  // OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.

  // Observability
  "observability": {
    "enabled": true
  }
}
```

### Migrations Best Practices

**Atomic Deployments**: Migrations are **atomic operations** - they cannot be gradually deployed.

```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["MyAgent"]  // Initial: enable SQLite
    },
    {
      "tag": "v2",
      "renamed_classes": [
        {"from": "MyAgent", "to": "MyRenamedAgent"}
      ]
    },
    {
      "tag": "v3",
      "deleted_classes": ["OldAgent"]
    },
    {
      "tag": "v4",
      "transferred_classes": [
        {
          "from": "AgentInOldScript",
          "from_script": "old-worker",
          "to": "AgentInNewScript"
        }
      ]
    }
  ]
}
```

**Migration Rules:**
- ✅ Each migration needs a unique `tag`
- ✅ Cannot enable SQLite on existing deployed class (must be in first migration)
- ✅ Migrations apply in order during deployment
- ✅ Cannot edit or remove previous migration tags
- ❌ Never deploy new migrations gradually (atomic only)

### Environment-Specific Migrations

```jsonc
{
  "migrations": [{"tag": "v1", "new_sqlite_classes": ["MyAgent"]}],
  "env": {
    "staging": {
      "migrations": [
        {"tag": "v1", "new_sqlite_classes": ["MyAgent"]},
        {"tag": "v2-staging", "renamed_classes": [{"from": "MyAgent", "to": "StagingAgent"}]}
      ]
    }
  }
}
```

---

## Agent Class API

The `Agent` class is the foundation of the Agents SDK. Extend it to create your agent.

### Basic Agent Structure

```typescript
import { Agent } from "agents";

interface Env {
  // Environment variables and bindings
  OPENAI_API_KEY: string;
  AI: Ai;
  VECTORIZE: Vectorize;
  DB: D1Database;
}

interface State {
  // Your agent's persistent state
  counter: number;
  messages: string[];
  lastUpdated: Date | null;
}

export class MyAgent extends Agent<Env, State> {
  // Optional: Set initial state (first time agent is created)
  initialState: State = {
    counter: 0,
    messages: [],
    lastUpdated: null
  };

  // Optional: Called when agent instance starts or wakes from hibernation
  async onStart() {
    console.log('Agent started:', this.name, 'State:', this.state);
  }

  // Handle HTTP requests
  async onRequest(request: Request): Promise<Response> {
    return Response.json({ message: "Hello from Agent", state: this.state });
  }

  // Handle WebSocket connections (optional)
  async onConnect(connection: Connection, ctx: ConnectionContext) {
    console.log('Client connected:', connection.id);
    // Connections are automatically accepted
  }

  // Handle WebSocket messages (optional)
  async onMessage(connection: Connection, message: WSMessage) {
    if (typeof message === 'string') {
      connection.send(`Echo: ${message}`);
    }
  }

  // Handle WebSocket errors (optional)
  async onError(connection: Connection, error: unknown): Promise<void> {
    console.error('Connection error:', error);
  }

  // Handle WebSocket close (optional)
  async onClose(connection: Connection, code: number, reason: string, wasClean: boolean): Promise<void> {
    console.log('Connection closed:', code, reason);
  }

  // Called when state is updated from any source (optional)
  onStateUpdate(state: State, source: "server" | Connection) {
    console.log('State updated:', state, 'Source:', source);
  }

  // Custom methods (call from any handler)
  async customMethod(data: any) {
    this.setState({
      ...this.state,
      counter: this.state.counter + 1,
      lastUpdated: new Date()
    });
  }
}
```

### Accessing Agent Properties

Within any Agent method:

```typescript
export class MyAgent extends Agent<Env, State> {
  async someMethod() {
    // Access environment variables and bindings
    const apiKey = this.env.OPENAI_API_KEY;
    const ai = this.env.AI;

    // Access current state (read-only)
    const counter = this.state.counter;

    // Update state (persisted automatically)
    this.setState({ ...this.state, counter: counter + 1 });

    // Access SQL database
    const results = await this.sql`SELECT * FROM users`;

    // Get agent instance name
    const instanceName = this.name;  // e.g., "user-123"

    // Schedule tasks
    await this.schedule(60, "runLater", { data: "example" });

    // Call other methods
    await this.customMethod({ foo: "bar" });
  }
}
```

---

## HTTP & Server-Sent Events

### HTTP Request Handling

```typescript
export class MyAgent extends Agent<Env> {
  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    if (method === "POST" && url.pathname === "/increment") {
      const counter = (this.state.counter || 0) + 1;
      this.setState({ ...this.state, counter });
      return Response.json({ counter });
    }

    if (method === "GET" && url.pathname === "/status") {
      return Response.json({ state: this.state, name: this.name });
    }

    return new Response("Not Found", { status: 404 });
  }
}
```

### Server-Sent Events (SSE) Streaming

```typescript
export class MyAgent extends Agent<Env> {
  async onRequest(request: Request): Promise<Response> {
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Send events to client
        controller.enqueue(encoder.encode('data: {"message": "Starting"}\n\n'));

        await new Promise(resolve => setTimeout(resolve, 1000));

        controller.enqueue(encoder.encode('data: {"message": "Processing"}\n\n'));

        await new Promise(resolve => setTimeout(resolve, 1000));

        controller.enqueue(encoder.encode('data: {"message": "Complete"}\n\n'));

        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  }
}
```

**SSE vs WebSockets:**

| Feature | SSE | WebSockets |
|---------|-----|------------|
| Direction | Server → Client only | Bi-directional |
| Protocol | HTTP | ws:// or wss:// |
| Reconnection | Automatic | Manual |
| Binary Data | Limited | Full support |
| Use Case | Streaming responses, notifications | Chat, real-time collaboration |

**Recommendation**: Use WebSockets for most agent applications (full duplex, better for long sessions).

---

## WebSockets

### Complete WebSocket Example

```typescript
import { Agent, Connection, ConnectionContext, WSMessage } from "agents";

interface ChatState {
  messages: Array<{ id: string; text: string; sender: string; timestamp: number }>;
  participants: string[];
}

export class ChatAgent extends Agent<Env, ChatState> {
  initialState: ChatState = {
    messages: [],
    participants: []
  };

  async onConnect(connection: Connection, ctx: ConnectionContext) {
    // Access original HTTP request for auth
    const authHeader = ctx.request.headers.get('Authorization');
    const userId = ctx.request.headers.get('X-User-ID') || 'anonymous';

    // Connections are automatically accepted
    // Optionally close connection if unauthorized:
    // if (!authHeader) {
    //   connection.close(401, "Unauthorized");
    //   return;
    // }

    // Add to participants
    this.setState({
      ...this.state,
      participants: [...this.state.participants, userId]
    });

    // Send welcome message
    connection.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to chat',
      participants: this.state.participants
    }));
  }

  async onMessage(connection: Connection, message: WSMessage) {
    if (typeof message === 'string') {
      try {
        const data = JSON.parse(message);

        if (data.type === 'chat') {
          // Add message to state
          const newMessage = {
            id: crypto.randomUUID(),
            text: data.text,
            sender: data.sender || 'anonymous',
            timestamp: Date.now()
          };

          this.setState({
            ...this.state,
            messages: [...this.state.messages, newMessage]
          });

          // Broadcast to this connection (state sync will broadcast to all)
          connection.send(JSON.stringify({
            type: 'message_added',
            message: newMessage
          }));
        }
      } catch (e) {
        connection.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    }
  }

  async onError(connection: Connection, error: unknown): Promise<void> {
    console.error('WebSocket error:', error);
    // Optionally log to external monitoring
  }

  async onClose(connection: Connection, code: number, reason: string, wasClean: boolean): Promise<void> {
    console.log(`Connection ${connection.id} closed:`, code, reason, wasClean);
    // Clean up connection-specific state if needed
  }
}
```

### Connection Management

```typescript
export class MyAgent extends Agent {
  async onMessage(connection: Connection, message: WSMessage) {
    // Connection properties
    const connId = connection.id;  // Unique connection ID
    const connState = connection.state;  // Connection-specific state

    // Update connection state (not agent state)
    connection.setState({ ...connection.state, lastActive: Date.now() });

    // Send to this connection only
    connection.send("Message to this client");

    // Close connection programmatically
    connection.close(1000, "Goodbye");
  }
}
```

---

## State Management

### Using setState()

```typescript
interface UserState {
  name: string;
  email: string;
  preferences: { theme: string; notifications: boolean };
  loginCount: number;
  lastLogin: Date | null;
}

export class UserAgent extends Agent<Env, UserState> {
  initialState: UserState = {
    name: "",
    email: "",
    preferences: { theme: "dark", notifications: true },
    loginCount: 0,
    lastLogin: null
  };

  async onRequest(request: Request): Promise<Response> {
    if (request.method === "POST" && new URL(request.url).pathname === "/login") {
      // Update state
      this.setState({
        ...this.state,
        loginCount: this.state.loginCount + 1,
        lastLogin: new Date()
      });

      // State is automatically persisted and synced to connected clients
      return Response.json({ success: true, state: this.state });
    }

    return Response.json({ state: this.state });
  }

  onStateUpdate(state: UserState, source: "server" | Connection) {
    console.log('State updated:', state);
    console.log('Source:', source);  // "server" or Connection object

    // React to state changes
    if (state.loginCount > 10) {
      console.log('Frequent user!');
    }
  }
}
```

**State Rules:**
- ✅ State is JSON-serializable (objects, arrays, strings, numbers, booleans, null)
- ✅ State persists across agent restarts
- ✅ State is immediately consistent within the agent
- ✅ State automatically syncs to connected WebSocket clients
- ❌ State cannot contain functions or circular references
- ❌ Total state size limited by database size (1GB max per agent)

### Using SQL Database

Each agent has a built-in SQLite database accessible via `this.sql`:

```typescript
export class MyAgent extends Agent {
  async onStart() {
    // Create tables on first start
    await this.sql`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await this.sql`
      CREATE INDEX IF NOT EXISTS idx_email ON users(email)
    `;
  }

  async addUser(name: string, email: string) {
    // Insert with prepared statement (prevents SQL injection)
    const result = await this.sql`
      INSERT INTO users (name, email)
      VALUES (${name}, ${email})
    `;

    return result;
  }

  async getUser(email: string) {
    // Query returns array of results
    const users = await this.sql`
      SELECT * FROM users WHERE email = ${email}
    `;

    return users[0] || null;
  }

  async getAllUsers() {
    const users = await this.sql`
      SELECT * FROM users ORDER BY created_at DESC
    `;

    return users;
  }

  async updateUser(id: number, name: string) {
    await this.sql`
      UPDATE users SET name = ${name} WHERE id = ${id}
    `;
  }

  async deleteUser(id: number) {
    await this.sql`
      DELETE FROM users WHERE id = ${id}
    `;
  }
}
```

**SQL Best Practices:**
- ✅ Use tagged template literals (prevents SQL injection)
- ✅ Create indexes for frequently queried columns
- ✅ Use transactions for multiple related operations
- ✅ Query results are always arrays (even for single row)
- ❌ Don't construct SQL strings manually
- ❌ Be mindful of 1GB database size limit

---

## Schedule Tasks

Agents can schedule tasks to run in the future using `this.schedule()`.

### Delay (Seconds)

```typescript
export class MyAgent extends Agent {
  async onRequest(request: Request): Promise<Response> {
    // Schedule task to run in 60 seconds
    const { id } = await this.schedule(60, "checkStatus", { requestId: "123" });

    return Response.json({ scheduledTaskId: id });
  }

  // This method will be called in 60 seconds
  async checkStatus(data: { requestId: string }) {
    console.log('Checking status for request:', data.requestId);
    // Perform check, update state, send notification, etc.
  }
}
```

### Specific Date

```typescript
export class MyAgent extends Agent {
  async scheduleReminder(reminderDate: string) {
    const date = new Date(reminderDate);

    const { id } = await this.schedule(date, "sendReminder", {
      message: "Time for your appointment!"
    });

    return id;
  }

  async sendReminder(data: { message: string }) {
    console.log('Sending reminder:', data.message);
    // Send email, push notification, etc.
  }
}
```

### Cron Expressions

```typescript
export class MyAgent extends Agent {
  async setupRecurringTasks() {
    // Every 10 minutes
    await this.schedule("*/10 * * * *", "checkUpdates", {});

    // Every day at 8 AM
    await this.schedule("0 8 * * *", "dailyReport", {});

    // Every Monday at 9 AM
    await this.schedule("0 9 * * 1", "weeklyReport", {});

    // Every hour on the hour
    await this.schedule("0 * * * *", "hourlyCheck", {});
  }

  async checkUpdates(data: any) {
    console.log('Checking for updates...');
  }

  async dailyReport(data: any) {
    console.log('Generating daily report...');
  }

  async weeklyReport(data: any) {
    console.log('Generating weekly report...');
  }

  async hourlyCheck(data: any) {
    console.log('Running hourly check...');
  }
}
```

### Managing Scheduled Tasks

```typescript
export class MyAgent extends Agent {
  async manageSchedules() {
    // Get all scheduled tasks
    const allTasks = this.getSchedules();
    console.log('Total tasks:', allTasks.length);

    // Get specific task by ID
    const taskId = "some-task-id";
    const task = await this.getSchedule(taskId);

    if (task) {
      console.log('Task:', task.callback, 'at', new Date(task.time));
      console.log('Payload:', task.payload);
      console.log('Type:', task.type);  // "scheduled" | "delayed" | "cron"

      // Cancel the task
      const cancelled = await this.cancelSchedule(taskId);
      console.log('Cancelled:', cancelled);
    }

    // Get tasks in time range
    const upcomingTasks = this.getSchedules({
      timeRange: {
        start: new Date(),
        end: new Date(Date.now() + 24 * 60 * 60 * 1000)  // Next 24 hours
      }
    });

    console.log('Upcoming tasks:', upcomingTasks.length);

    // Filter by type
    const cronTasks = this.getSchedules({ type: "cron" });
    const delayedTasks = this.getSchedules({ type: "delayed" });
  }
}
```

**Scheduling Constraints:**
- Each task maps to a SQL database row (max 2 MB per task)
- Total tasks limited by: `(task_size * count) + other_state < 1GB`
- Cron tasks continue running until explicitly cancelled
- Callback method MUST exist on Agent class (throws error if missing)

**CRITICAL ERROR**: If callback method doesn't exist:
```typescript
// ❌ BAD: Method doesn't exist
await this.schedule(60, "nonExistentMethod", {});

// ✅ GOOD: Method exists
await this.schedule(60, "existingMethod", {});

async existingMethod(data: any) {
  // Implementation
}
```

---

## Run Workflows

Agents can trigger asynchronous [Cloudflare Workflows](https://developers.cloudflare.com/workflows/).

### Workflow Binding Configuration

`wrangler.jsonc`:

```jsonc
{
  "workflows": [
    {
      "name": "MY_WORKFLOW",
      "class_name": "MyWorkflow"
    }
  ]
}
```

If Workflow is in a different script:

```jsonc
{
  "workflows": [
    {
      "name": "EMAIL_WORKFLOW",
      "class_name": "EmailWorkflow",
      "script_name": "email-workflows"  // Different project
    }
  ]
}
```

### Triggering a Workflow

```typescript
import { Agent } from "agents";
import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers";

interface Env {
  MY_WORKFLOW: Workflow;
  MyAgent: AgentNamespace<MyAgent>;
}

export class MyAgent extends Agent<Env> {
  async onRequest(request: Request): Promise<Response> {
    const userId = new URL(request.url).searchParams.get('userId');

    // Trigger a workflow immediately
    const instance = await this.env.MY_WORKFLOW.create({
      id: `user-${userId}`,
      params: { userId, action: "process" }
    });

    // Or schedule a delayed workflow trigger
    await this.schedule(300, "runWorkflow", { userId });

    return Response.json({ workflowId: instance.id });
  }

  async runWorkflow(data: { userId: string }) {
    const instance = await this.env.MY_WORKFLOW.create({
      id: `delayed-${data.userId}`,
      params: data
    });

    // Monitor workflow status periodically
    await this.schedule("*/5 * * * *", "checkWorkflowStatus", { id: instance.id });
  }

  async checkWorkflowStatus(data: { id: string }) {
    // Check workflow status (see Workflows docs for details)
    console.log('Checking workflow:', data.id);
  }
}

// Workflow definition (can be in same or different file/project)
export class MyWorkflow extends WorkflowEntrypoint<Env> {
  async run(event: WorkflowEvent<{ userId: string }>, step: WorkflowStep) {
    // Workflow implementation
    const result = await step.do('process-data', async () => {
      return { processed: true };
    });

    return result;
  }
}
```

### Agents vs Workflows

| Feature | Agents | Workflows |
|---------|--------|-----------|
| **Purpose** | Interactive, user-facing | Background processing |
| **Duration** | Seconds to hours | Minutes to hours |
| **State** | SQLite database | Step-based checkpoints |
| **Interaction** | WebSockets, HTTP | No direct interaction |
| **Retry** | Manual | Automatic per step |
| **Use Case** | Chat, real-time UI | ETL, batch processing |

**Best Practice**: Use Agents to **coordinate** multiple Workflows. Agents can trigger, monitor, and respond to Workflow results while maintaining user interaction.

---

## Browse the Web

Agents can browse the web using [Browser Rendering](https://developers.cloudflare.com/browser-rendering/).

### Browser Rendering Binding

`wrangler.jsonc`:

```jsonc
{
  "browser": {
    "binding": "BROWSER"
  }
}
```

### Installation

```bash
npm install @cloudflare/puppeteer
```

### Web Scraping Example

```typescript
import { Agent } from "agents";
import puppeteer from "@cloudflare/puppeteer";

interface Env {
  BROWSER: Fetcher;
  OPENAI_API_KEY: string;
}

export class BrowserAgent extends Agent<Env> {
  async browse(urls: string[]) {
    const responses = [];

    for (const url of urls) {
      const browser = await puppeteer.launch(this.env.BROWSER);
      const page = await browser.newPage();

      await page.goto(url);
      await page.waitForSelector("body");

      const bodyContent = await page.$eval("body", el => el.innerHTML);

      // Extract data with AI
      const data = await this.extractData(bodyContent);
      responses.push({ url, data });

      await browser.close();
    }

    return responses;
  }

  async extractData(html: string): Promise<any> {
    // Use OpenAI or Workers AI to extract structured data
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Extract product info from HTML: ${html.slice(0, 4000)}`
        }],
        response_format: { type: "json_object" }
      })
    });

    const result = await response.json();
    return JSON.parse(result.choices[0].message.content);
  }

  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url).searchParams.get('url');
    if (!url) {
      return new Response("Missing url parameter", { status: 400 });
    }

    const results = await this.browse([url]);
    return Response.json(results);
  }
}
```

### Screenshot Capture

```typescript
export class ScreenshotAgent extends Agent<Env> {
  async captureScreenshot(url: string): Promise<Buffer> {
    const browser = await puppeteer.launch(this.env.BROWSER);
    const page = await browser.newPage();

    await page.goto(url);
    const screenshot = await page.screenshot({ fullPage: true });

    await browser.close();

    return screenshot;
  }
}
```

---

## Retrieval Augmented Generation (RAG)

Implement RAG using Vectorize + Workers AI embeddings.

### Vectorize Binding

`wrangler.jsonc`:

```jsonc
{
  "ai": {
    "binding": "AI"
  },
  "vectorize": {
    "bindings": [
      {
        "binding": "VECTORIZE",
        "index_name": "my-agent-vectors"
      }
    ]
  }
}
```

### Create Index

```bash
npx wrangler vectorize create my-agent-vectors \
  --dimensions=768 \
  --metric=cosine
```

### Complete RAG Implementation

```typescript
import { Agent } from "agents";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

interface Env {
  AI: Ai;
  VECTORIZE: Vectorize;
  OPENAI_API_KEY: string;
}

export class RAGAgent extends Agent<Env> {
  // Ingest documents
  async ingestDocuments(documents: Array<{ id: string; text: string; metadata: any }>) {
    const vectors = [];

    for (const doc of documents) {
      // Generate embedding with Workers AI
      const { data } = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
        text: [doc.text]
      });

      vectors.push({
        id: doc.id,
        values: data[0],
        metadata: { ...doc.metadata, text: doc.text }
      });
    }

    // Insert into Vectorize
    await this.env.VECTORIZE.upsert(vectors);

    return { ingested: vectors.length };
  }

  // Query knowledge base
  async queryKnowledge(userQuery: string, topK: number = 5) {
    // Generate query embedding
    const { data } = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [userQuery]
    });

    // Search Vectorize
    const results = await this.env.VECTORIZE.query(data[0], { topK });

    // Extract relevant documents
    const context = results.matches.map(match => match.metadata.text).join('\n\n');

    return context;
  }

  // RAG Chat
  async chat(userMessage: string) {
    // Retrieve relevant context
    const context = await this.queryKnowledge(userMessage);

    // Generate response with context
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant. Use the following context to answer questions:\n\n${context}`
        },
        {
          role: 'user',
          content: userMessage
        }
      ]
    });

    return { response: text, context };
  }

  async onRequest(request: Request): Promise<Response> {
    const { message } = await request.json();
    const result = await this.chat(message);
    return Response.json(result);
  }
}
```

### Metadata Filtering

```typescript
// Create metadata indexes BEFORE inserting vectors
await this.env.VECTORIZE.createMetadataIndex("category");
await this.env.VECTORIZE.createMetadataIndex("language");

// Query with filters
const results = await this.env.VECTORIZE.query(queryVector, {
  topK: 10,
  filter: {
    category: { $eq: "documentation" },
    language: { $eq: "en" }
  }
});
```

**See**: [cloudflare-vectorize skill](../cloudflare-vectorize/) for complete Vectorize guide.

---

## Using AI Models

### AI SDK (Vercel)

```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic
```

```typescript
import { Agent } from "agents";
import { generateText, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

export class AIAgent extends Agent {
  // Simple text generation
  async generateResponse(prompt: string) {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt
    });

    return text;
  }

  // Streaming response
  async streamResponse(prompt: string): Promise<Response> {
    const result = streamText({
      model: anthropic('claude-sonnet-4-5'),
      prompt
    });

    return result.toTextStreamResponse();
  }

  // Structured output
  async extractData(text: string) {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({
        name: z.string(),
        email: z.string().email(),
        age: z.number().optional()
      }),
      prompt: `Extract user info from: ${text}`
    });

    return object;
  }
}
```

### Workers AI

```typescript
interface Env {
  AI: Ai;
}

export class WorkersAIAgent extends Agent<Env> {
  async generateText(prompt: string) {
    const response = await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ role: 'user', content: prompt }]
    });

    return response;
  }

  async generateImage(prompt: string) {
    const response = await this.env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
      prompt
    });

    return response;
  }
}
```

**See**: [cloudflare-workers-ai skill](../cloudflare-workers-ai/) for complete Workers AI guide.

---

## Calling Agents

### Using routeAgentRequest

Automatically route requests to agents based on URL pattern `/agents/:agent/:name`:

```typescript
import { Agent, AgentNamespace, routeAgentRequest } from 'agents';

interface Env {
  MyAgent: AgentNamespace<MyAgent>;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Routes to: /agents/my-agent/user-123
    const response = await routeAgentRequest(request, env);

    if (response) {
      return response;
    }

    return new Response("Not Found", { status: 404 });
  }
} satisfies ExportedHandler<Env>;

export class MyAgent extends Agent<Env> {
  async onRequest(request: Request): Promise<Response> {
    return Response.json({ agent: this.name });
  }
}
```

**URL Pattern**: `/agents/my-agent/user-123`
- `my-agent` = class name in kebab-case
- `user-123` = agent instance name

### Using getAgentByName

For custom routing or calling agents from Workers:

```typescript
import { Agent, AgentNamespace, getAgentByName } from 'agents';

interface Env {
  MyAgent: AgentNamespace<MyAgent>;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const userId = new URL(request.url).searchParams.get('userId') || 'anonymous';

    // Get or create agent instance
    const agent = getAgentByName<Env, MyAgent>(env.MyAgent, `user-${userId}`);

    // Pass request to agent
    return (await agent).fetch(request);
  }
} satisfies ExportedHandler<Env>;

export class MyAgent extends Agent<Env> {
  // Agent implementation
}
```

### Calling Agent Methods Directly

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const agent = getAgentByName<Env, MyAgent>(env.MyAgent, 'user-123');

    // Call custom methods on agent using RPC
    const result = await (await agent).customMethod({ data: "example" });

    return Response.json({ result });
  }
}

export class MyAgent extends Agent<Env> {
  async customMethod(params: { data: string }): Promise<any> {
    return { processed: params.data };
  }
}
```

### Multi-Agent Communication

```typescript
interface Env {
  AgentA: AgentNamespace<AgentA>;
  AgentB: AgentNamespace<AgentB>;
}

export class AgentA extends Agent<Env> {
  async processData(data: any) {
    // Call another agent
    const agentB = getAgentByName<Env, AgentB>(this.env.AgentB, 'processor-1');
    const result = await (await agentB).analyze(data);

    return result;
  }
}

export class AgentB extends Agent<Env> {
  async analyze(data: any) {
    return { analyzed: true, data };
  }
}
```

### Authentication Patterns

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Authenticate BEFORE invoking agent
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = await verifyToken(authHeader);
    if (!userId) {
      return new Response("Forbidden", { status: 403 });
    }

    // Only create/access agent for authenticated users
    const agent = getAgentByName<Env, MyAgent>(env.MyAgent, `user-${userId}`);
    return (await agent).fetch(request);
  }
}
```

**CRITICAL**: Always authenticate in Worker, **NOT** in Agent. Agents should assume the caller is authorized.

---

## Client APIs

### AgentClient (Browser)

```typescript
import { AgentClient } from "agents/client";

// Connect to agent instance
const client = new AgentClient({
  agent: "chat-agent",        // Class name in kebab-case
  name: "room-123",           // Instance name
  host: window.location.host
});

client.onopen = () => {
  console.log("Connected");
  client.send(JSON.stringify({ type: "join", user: "alice" }));
};

client.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Received:", data);
};

client.onclose = () => {
  console.log("Disconnected");
};
```

### agentFetch (HTTP Requests)

```typescript
import { agentFetch } from "agents/client";

async function getData() {
  const response = await agentFetch(
    { agent: "my-agent", name: "user-123" },
    {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    }
  );

  const data = await response.json();
  return data;
}
```

### useAgent Hook (React)

```typescript
import { useAgent } from "agents/react";
import { useState } from "react";

function ChatUI() {
  const [messages, setMessages] = useState([]);

  const connection = useAgent({
    agent: "chat-agent",
    name: "room-123",
    onMessage: (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        setMessages(prev => [...prev, data.message]);
      }
    },
    onOpen: () => console.log("Connected"),
    onClose: () => console.log("Disconnected")
  });

  const sendMessage = (text: string) => {
    connection.send(JSON.stringify({ type: 'chat', text }));
  };

  return (
    <div>
      {messages.map((msg, i) => <div key={i}>{msg.text}</div>)}
      <button onClick={() => sendMessage("Hello")}>Send</button>
    </div>
  );
}
```

### State Synchronization

```typescript
import { useAgent } from "agents/react";
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  const agent = useAgent({
    agent: "counter-agent",
    name: "my-counter",
    onStateUpdate: (newState) => {
      setCount(newState.counter);
    }
  });

  const increment = () => {
    agent.setState({ counter: count + 1 });
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

### useAgentChat Hook

```typescript
import { useAgentChat } from "agents/ai-react";

function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useAgentChat({
    agent: "ai-chat-agent",
    name: "chat-session-123"
  });

  return (
    <div>
      <div>
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Thinking..." : "Send"}
        </button>
      </form>
    </div>
  );
}
```

---

## Model Context Protocol (MCP)

Build MCP servers using the Agents SDK.

### MCP Server Setup

```bash
npm install @modelcontextprotocol/sdk agents
```

### Basic MCP Server

```typescript
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export class MyMCP extends McpAgent {
  server = new McpServer({ name: "Demo", version: "1.0.0" });

  async init() {
    // Define a tool
    this.server.tool(
      "add",
      "Add two numbers together",
      {
        a: z.number().describe("First number"),
        b: z.number().describe("Second number")
      },
      async ({ a, b }) => ({
        content: [{ type: "text", text: String(a + b) }]
      })
    );
  }
}
```

### Stateful MCP Server

```typescript
type State = { counter: number };

export class StatefulMCP extends McpAgent<Env, State> {
  server = new McpServer({ name: "Counter", version: "1.0.0" });

  initialState: State = { counter: 0 };

  async init() {
    // Resource
    this.server.resource(
      "counter",
      "mcp://resource/counter",
      (uri) => ({
        contents: [{ uri: uri.href, text: String(this.state.counter) }]
      })
    );

    // Tool
    this.server.tool(
      "increment",
      "Increment the counter",
      { amount: z.number() },
      async ({ amount }) => {
        this.setState({
          ...this.state,
          counter: this.state.counter + amount
        });

        return {
          content: [{
            type: "text",
            text: `Counter is now ${this.state.counter}`
          }]
        };
      }
    );
  }
}
```

### MCP Transport Configuration

```typescript
import { Hono } from 'hono';

const app = new Hono();

// Modern streamable HTTP transport (recommended)
app.mount('/mcp', MyMCP.serve('/mcp').fetch, { replaceRequest: false });

// Legacy SSE transport (deprecated)
app.mount('/sse', MyMCP.serveSSE('/sse').fetch, { replaceRequest: false });

export default app;
```

**Transport Comparison:**
- **/mcp**: Streamable HTTP (modern, recommended)
- **/sse**: Server-Sent Events (legacy, deprecated)

### MCP with OAuth

```typescript
import { OAuthProvider } from '@cloudflare/workers-oauth-provider';

export default new OAuthProvider({
  apiHandlers: {
    '/sse': MyMCP.serveSSE('/sse'),
    '/mcp': MyMCP.serve('/mcp')
  },
  // OAuth configuration
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  // ... other OAuth settings
});
```

### Testing MCP Server

```bash
# Run MCP inspector
npx @modelcontextprotocol/inspector@latest

# Connect to: http://localhost:8788/mcp
```

**Cloudflare's MCP Servers**: See [reference](https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/) for production examples.

---

## Patterns & Concepts

### Chat Agents (AIChatAgent)

```typescript
import { AIChatAgent } from "agents/ai-chat-agent";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export class MyChatAgent extends AIChatAgent<Env> {
  async onChatMessage(onFinish) {
    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: this.messages,
      onFinish
    });

    return result.toTextStreamResponse();
  }

  // Optional: Customize message persistence
  async onStateUpdate(state, source) {
    console.log('Chat state updated:', this.messages.length, 'messages');
  }
}
```

### Human-in-the-Loop (HITL)

```typescript
export class ApprovalAgent extends Agent {
  async processRequest(data: any) {
    // Process automatically
    const processed = await this.autoProcess(data);

    // If confidence low, request human review
    if (processed.confidence < 0.8) {
      this.setState({
        ...this.state,
        pendingReview: {
          data: processed,
          requestedAt: Date.now(),
          status: 'pending'
        }
      });

      // Send notification to human
      await this.notifyHuman(processed);

      return { status: 'pending_review', id: processed.id };
    }

    // High confidence, proceed automatically
    return this.complete(processed);
  }

  async approveReview(id: string, approved: boolean) {
    const pending = this.state.pendingReview;

    if (approved) {
      await this.complete(pending.data);
    } else {
      await this.reject(pending.data);
    }

    this.setState({
      ...this.state,
      pendingReview: null
    });
  }
}
```

### Tools Concept

Tools enable agents to interact with external services:

```typescript
export class ToolAgent extends Agent {
  // Tool: Search flights
  async searchFlights(from: string, to: string, date: string) {
    const response = await fetch(`https://api.flights.com/search`, {
      method: 'POST',
      body: JSON.stringify({ from, to, date })
    });
    return response.json();
  }

  // Tool: Book flight
  async bookFlight(flightId: string, passengers: any[]) {
    const response = await fetch(`https://api.flights.com/book`, {
      method: 'POST',
      body: JSON.stringify({ flightId, passengers })
    });
    return response.json();
  }

  // Tool: Send confirmation email
  async sendEmail(to: string, subject: string, body: string) {
    // Use email service
    return { sent: true };
  }

  // Orchestrate tools
  async bookTrip(params: any) {
    const flights = await this.searchFlights(params.from, params.to, params.date);
    const booking = await this.bookFlight(flights[0].id, params.passengers);
    await this.sendEmail(params.email, "Booking Confirmed", `Booking ID: ${booking.id}`);

    return booking;
  }
}
```

### Multi-Agent Orchestration

```typescript
interface Env {
  ResearchAgent: AgentNamespace<ResearchAgent>;
  WriterAgent: AgentNamespace<WriterAgent>;
  EditorAgent: AgentNamespace<EditorAgent>;
}

export class OrchestratorAgent extends Agent<Env> {
  async createArticle(topic: string) {
    // 1. Research agent gathers information
    const researcher = getAgentByName<Env, ResearchAgent>(
      this.env.ResearchAgent,
      `research-${topic}`
    );
    const research = await (await researcher).research(topic);

    // 2. Writer agent creates draft
    const writer = getAgentByName<Env, WriterAgent>(
      this.env.WriterAgent,
      `writer-${topic}`
    );
    const draft = await (await writer).write(research);

    // 3. Editor agent reviews
    const editor = getAgentByName<Env, EditorAgent>(
      this.env.EditorAgent,
      `editor-${topic}`
    );
    const final = await (await editor).edit(draft);

    return final;
  }
}
```

---

## Critical Rules

### Always Do ✅

1. **Export Agent class** - Must be exported for binding to work
2. **Include new_sqlite_classes in v1 migration** - Cannot add SQLite later
3. **Match binding name to class name** - Prevents "binding not found" errors
4. **Authenticate in Worker, not Agent** - Security best practice
5. **Use tagged template literals for SQL** - Prevents SQL injection
6. **Handle WebSocket disconnections** - State persists, connections don't
7. **Verify scheduled task callback exists** - Throws error if method missing
8. **Use global unique instance names** - Same name = same agent globally
9. **Check state size limits** - Max 1GB total per agent
10. **Monitor task payload size** - Max 2MB per scheduled task
11. **Use workflow bindings correctly** - Must be configured in wrangler.jsonc
12. **Create Vectorize indexes before inserting** - Required for metadata filtering
13. **Close browser instances** - Prevent resource leaks
14. **Use setState() for persistence** - Don't just modify this.state
15. **Test migrations locally first** - Migrations are atomic, can't rollback

### Never Do ❌

1. **Don't add SQLite to existing deployed class** - Must be in first migration
2. **Don't gradually deploy migrations** - Atomic only
3. **Don't skip authentication in Worker** - Always auth before agent access
4. **Don't construct SQL strings manually** - Use tagged templates
5. **Don't exceed 1GB state per agent** - Hard limit
6. **Don't schedule tasks with non-existent callbacks** - Runtime error
7. **Don't assume same name = different agent** - Global uniqueness
8. **Don't use SSE for MCP** - Deprecated, use /mcp transport
9. **Don't forget browser binding** - Required for web browsing
10. **Don't modify this.state directly** - Use setState() instead

---

## Known Issues Prevention

This skill prevents **15+** documented issues:

### Issue 1: Migrations Not Atomic
**Error**: "Cannot gradually deploy migration"
**Source**: https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/
**Why**: Migrations apply to all instances simultaneously
**Prevention**: Deploy migrations independently of code changes, use `npx wrangler versions deploy`

### Issue 2: Missing new_sqlite_classes
**Error**: "Cannot enable SQLite on existing class"
**Source**: https://developers.cloudflare.com/agents/api-reference/configuration/
**Why**: SQLite must be enabled in first migration
**Prevention**: Include `new_sqlite_classes` in tag "v1" migration

### Issue 3: Agent Class Not Exported
**Error**: "Binding not found" or "Cannot access undefined"
**Source**: https://developers.cloudflare.com/agents/api-reference/agents-api/
**Why**: Durable Objects require exported class
**Prevention**: `export class MyAgent extends Agent` (with export keyword)

### Issue 4: Binding Name Mismatch
**Error**: "Binding 'X' not found"
**Source**: https://developers.cloudflare.com/agents/api-reference/configuration/
**Why**: Binding name must match class name exactly
**Prevention**: Ensure `name` and `class_name` are identical in wrangler.jsonc

### Issue 5: Global Uniqueness Not Understood
**Error**: Unexpected behavior with agent instances
**Source**: https://developers.cloudflare.com/agents/api-reference/agents-api/
**Why**: Same name always returns same agent instance globally
**Prevention**: Use unique identifiers (userId, sessionId) for instance names

### Issue 6: WebSocket State Not Persisted
**Error**: Connection state lost after disconnect
**Source**: https://developers.cloudflare.com/agents/api-reference/websockets/
**Why**: WebSocket connections don't persist, but agent state does
**Prevention**: Store important data in agent state via setState(), not connection state

### Issue 7: Scheduled Task Callback Doesn't Exist
**Error**: "Method X does not exist on Agent"
**Source**: https://developers.cloudflare.com/agents/api-reference/schedule-tasks/
**Why**: this.schedule() calls method that isn't defined
**Prevention**: Ensure callback method exists before scheduling

### Issue 8: State Size Limit Exceeded
**Error**: "Maximum database size exceeded"
**Source**: https://developers.cloudflare.com/agents/api-reference/store-and-sync-state/
**Why**: Agent state + scheduled tasks exceed 1GB
**Prevention**: Monitor state size, use external storage (D1, R2) for large data

### Issue 9: Scheduled Task Too Large
**Error**: "Task payload exceeds 2MB"
**Source**: https://developers.cloudflare.com/agents/api-reference/schedule-tasks/
**Why**: Each task maps to database row with 2MB limit
**Prevention**: Keep task payloads minimal, store large data in agent state/SQL

### Issue 10: Workflow Binding Missing
**Error**: "Cannot read property 'create' of undefined"
**Source**: https://developers.cloudflare.com/agents/api-reference/run-workflows/
**Why**: Workflow binding not configured in wrangler.jsonc
**Prevention**: Add workflow binding before using this.env.WORKFLOW

### Issue 11: Browser Binding Required
**Error**: "BROWSER binding undefined"
**Source**: https://developers.cloudflare.com/agents/api-reference/browse-the-web/
**Why**: Browser Rendering requires explicit binding
**Prevention**: Add `"browser": { "binding": "BROWSER" }` to wrangler.jsonc

### Issue 12: Vectorize Index Not Found
**Error**: "Index does not exist"
**Source**: https://developers.cloudflare.com/agents/api-reference/rag/
**Why**: Vectorize index must be created before use
**Prevention**: Run `wrangler vectorize create` before deploying agent

### Issue 13: MCP Transport Confusion
**Error**: "SSE transport deprecated"
**Source**: https://developers.cloudflare.com/agents/model-context-protocol/transport/
**Why**: SSE transport is legacy, streamable HTTP is recommended
**Prevention**: Use `/mcp` endpoint with `MyMCP.serve('/mcp')`, not `/sse`

### Issue 14: Authentication Bypass
**Error**: Security vulnerability
**Source**: https://developers.cloudflare.com/agents/api-reference/calling-agents/
**Why**: Authentication done in Agent instead of Worker
**Prevention**: Always authenticate in Worker before calling getAgentByName()

### Issue 15: Instance Naming Errors
**Error**: Cross-user data leakage
**Source**: https://developers.cloudflare.com/agents/api-reference/calling-agents/
**Why**: Poor instance naming allows access to wrong agent
**Prevention**: Use namespaced names like `user-${userId}`, validate ownership

---

## Dependencies

### Required
- **cloudflare-worker-base** - Foundation (Hono, Vite, Workers setup)

### Optional (by feature)
- **cloudflare-workers-ai** - For Workers AI model calls
- **cloudflare-vectorize** - For RAG with Vectorize
- **cloudflare-d1** - For additional persistent storage beyond agent state
- **cloudflare-r2** - For file storage
- **cloudflare-queues** - For message queues

### NPM Packages
- `agents` - Agents SDK (required)
- `@modelcontextprotocol/sdk` - For building MCP servers
- `@cloudflare/puppeteer` - For web browsing
- `ai` - AI SDK for model calls
- `@ai-sdk/openai` - OpenAI models
- `@ai-sdk/anthropic` - Anthropic models

---

## Official Documentation

- **Agents SDK**: https://developers.cloudflare.com/agents/
- **API Reference**: https://developers.cloudflare.com/agents/api-reference/
- **Durable Objects**: https://developers.cloudflare.com/durable-objects/
- **Workflows**: https://developers.cloudflare.com/workflows/
- **Vectorize**: https://developers.cloudflare.com/vectorize/
- **Browser Rendering**: https://developers.cloudflare.com/browser-rendering/
- **Model Context Protocol**: https://modelcontextprotocol.io/
- **Cloudflare MCP Servers**: https://github.com/cloudflare/mcp-server-cloudflare

---

## Bundled Resources

### Templates (templates/)
- `wrangler-agents-config.jsonc` - Complete configuration example
- `basic-agent.ts` - Minimal HTTP agent
- `websocket-agent.ts` - WebSocket handlers
- `state-sync-agent.ts` - State management patterns
- `scheduled-agent.ts` - Task scheduling
- `workflow-agent.ts` - Workflow integration
- `browser-agent.ts` - Web browsing
- `rag-agent.ts` - RAG implementation
- `chat-agent-streaming.ts` - Streaming chat
- `calling-agents-worker.ts` - Agent routing
- `react-useagent-client.tsx` - React client
- `mcp-server-basic.ts` - MCP server
- `hitl-agent.ts` - Human-in-the-loop

### References (references/)
- `agent-class-api.md` - Complete Agent class reference
- `client-api-reference.md` - Browser client APIs
- `state-management-guide.md` - State and SQL deep dive
- `websockets-sse.md` - WebSocket vs SSE comparison
- `scheduling-api.md` - Task scheduling details
- `workflows-integration.md` - Workflows guide
- `browser-rendering.md` - Web browsing patterns
- `rag-patterns.md` - RAG best practices
- `mcp-server-guide.md` - MCP server development
- `mcp-tools-reference.md` - MCP tools API
- `hitl-patterns.md` - Human-in-the-loop workflows
- `best-practices.md` - Production patterns

### Examples (examples/)
- `chat-bot-complete.md` - Full chat agent
- `multi-agent-workflow.md` - Agent orchestration
- `scheduled-reports.md` - Recurring tasks
- `browser-scraper-agent.md` - Web scraping
- `rag-knowledge-base.md` - RAG system
- `mcp-remote-server.md` - Production MCP server

---

**Last Verified**: 2025-10-21
**Package Versions**: agents@latest
**Compliance**: Cloudflare Agents SDK official documentation
