---
name: elevenlabs-agents
description: "Build conversational AI voice agents on the ElevenLabs platform. Configure agent + tools + knowledge base, integrate SDK (React / React Native / Swift / JS / server-side), test, deploy. Use whenever the user mentions ElevenLabs, building a voice agent, an AI phone system, an AI receptionist, conversational AI, or troubleshooting deprecated @11labs packages, webhook errors, CSP violations, localhost allowlist, or tool parsing errors."
compatibility: claude-code-only
---

# ElevenLabs Agent Builder

Build a production-ready conversational AI voice agent. Produces a configured agent with tools, knowledge base, and SDK integration.

## Packages

```bash
npm install @elevenlabs/react           # React SDK
npm install @elevenlabs/client          # JavaScript SDK (browser + server)
npm install @elevenlabs/react-native    # React Native SDK
npm install @elevenlabs/elevenlabs-js   # Full API (server only)
npm install -g @elevenlabs/agents-cli   # CLI ("Agents as Code")
```

**DEPRECATED:** `@11labs/react`, `@11labs/client` -- uninstall if present.

**Server-only warning:** `@elevenlabs/elevenlabs-js` uses Node.js `child_process` and won't work in browsers. Use `@elevenlabs/client` for browser environments, or create a proxy server.

## Workflow

### Step 1: Create Agent via Dashboard or CLI

**Dashboard:** https://elevenlabs.io/app/conversational-ai -> Create Agent

**CLI (Agents as Code):**
```bash
elevenlabs agents init
elevenlabs agents add "Support Bot" --template customer-service
# Edit agent_configs/support-bot.json
elevenlabs agents push --env dev
```

Templates: `default`, `minimal`, `voice-only`, `text-only`, `customer-service`, `assistant`.

Configure:
- **Voice** -- Choose from 5000+ voices or clone
- **LLM** -- GPT, Claude, Gemini, or custom
- **System prompt** -- Use the 6-component framework below
- **First message** -- What the agent says when conversation starts

### Step 2: Write the System Prompt

Use the 6-component framework for effective agent prompts:

**1. Personality** -- who the agent is:
```
You are [NAME], a [ROLE] at [COMPANY].
You have [EXPERIENCE]. Your traits: [LIST TRAITS].
```

**2. Environment** -- communication context:
```
You're communicating via [phone/chat/video].
Consider [environmental factors]. Adapt to [context].
```

**3. Tone** -- speech patterns and formality:
```
Tone: Professional yet warm. Use contractions for natural speech.
Avoid jargon. Keep responses to 2-3 sentences. Ask one question at a time.
```

**4. Goal** -- objectives and success criteria:
```
Primary Goal: Resolve customer issues on the first call.
Success: Customer verbally confirms issue is resolved.
```

**5. Guardrails** -- boundaries and ethics:
```
Never: provide medical/legal/financial advice, share confidential info.
Always: verify identity before account access, document interactions.
Escalation: customer requests manager, issue beyond knowledge base.
```

**6. Tools** -- available functions and when to use them:
```
1. lookup_order(order_id) -- Use when customer mentions an order.
2. transfer_to_supervisor() -- Use when issue requires manager approval.
Always explain what you're doing before calling a tool.
```

### Step 3: Add Tools

**Client-side tools (run in browser):**

```typescript
const clientTools = {
  updateCart: {
    description: "Add or remove items from the shopping cart",
    parameters: z.object({
      action: z.enum(['add', 'remove']),
      item: z.string(),
      quantity: z.number().min(1)
    }),
    handler: async ({ action, item, quantity }) => {
      const cart = getCart();
      action === 'add' ? cart.add(item, quantity) : cart.remove(item, quantity);
      return { success: true, total: cart.total, items: cart.items.length };
    }
  },
  navigate: {
    description: "Navigate user to a different page",
    parameters: z.object({ url: z.string().url() }),
    handler: async ({ url }) => { window.location.href = url; return { success: true }; }
  }
};
```

**Server-side tools (webhooks):**

```json
{
  "name": "get_weather",
  "description": "Fetch current weather for a city",
  "url": "https://api.weather.com/v1/current",
  "method": "GET",
  "parameters": {
    "type": "object",
    "properties": {
      "city": { "type": "string", "description": "City name" }
    },
    "required": ["city"]
  },
  "headers": {
    "Authorization": "Bearer {{secret__weather_api_key}}"
  }
}
```

Use `{{secret__key_name}}` for API keys in webhook headers -- never hardcode.

**MCP Tools -- CRITICAL COMPATIBILITY NOTE:**

ElevenLabs labels their MCP integration as "Streamable HTTP" but does NOT support the actual MCP 2025-03-26 Streamable HTTP spec (SSE responses). ElevenLabs expects:

- Plain JSON responses (`application/json`), NOT SSE (`text/event-stream`)
- Protocol version `2024-11-05`, NOT `2025-03-26`
- Simple JSON-RPC over HTTP with direct JSON responses

What does NOT work:
- Official MCP SDK's `createMcpHandler` (returns SSE)
- Cloudflare Agents SDK `McpServer.serve()` (returns SSE)
- Any server returning `Content-Type: text/event-stream`

Working MCP server pattern for ElevenLabs:

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const tools = [{
  name: "my_tool",
  description: "Tool description",
  inputSchema: {
    type: "object",
    properties: { param1: { type: "string", description: "Description" } },
    required: ["param1"]
  }
}];

async function handleMCPRequest(request, env) {
  const { id, method, params } = request;
  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: '2024-11-05',  // MUST be 2024-11-05
          serverInfo: { name: 'my-mcp', version: '1.0.0' },
          capabilities: { tools: {} }
        }
      };
    case 'tools/list':
      return { jsonrpc: '2.0', id, result: { tools } };
    case 'tools/call':
      const result = await handleTool(params.name, params.arguments, env);
      return { jsonrpc: '2.0', id, result };
    default:
      return { jsonrpc: '2.0', id, error: { code: -32601, message: `Unknown: ${method}` } };
  }
}

const app = new Hono();
app.use('/*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'OPTIONS'] }));
app.post('/mcp', async (c) => {
  const body = await c.req.json();
  return c.json(await handleMCPRequest(body, c.env));  // Plain JSON, NOT SSE
});
export default app;
```

### Step 4: Add Knowledge Base (RAG)

Upload documents for the agent to reference:
- PDFs, text files, web URLs
- Configure via dashboard: Agent -> Knowledge Base -> Upload
- Or via API: `POST /v1/convai/knowledge-base/upload` (multipart/form-data)
- Agent automatically searches knowledge base during conversation

### Step 5: Integrate SDK

**React** -- copy and customise `assets/react-sdk-boilerplate.tsx`:

```typescript
import { useConversation } from '@elevenlabs/react';

const { startConversation, stopConversation, status } = useConversation({
  agentId: 'your-agent-id',
  signedUrl: '/api/elevenlabs/auth',
  clientTools,
  dynamicVariables: {
    user_name: 'John',
    account_type: 'premium',
  },
  onEvent: (event) => { /* transcript, agent_response, tool_call */ },
});
```

System prompt references dynamic variables as `{{user_name}}`.

**React Native** -- see `assets/react-native-boilerplate.tsx`
**Widget embed** -- see `assets/widget-embed-template.html`
**Swift** -- see `assets/swift-sdk-boilerplate.swift`

### Step 6: Test

**CLI testing:**

```bash
# Run all tests for an agent
elevenlabs agents test "Support Agent"

# Add a test scenario
elevenlabs tests add "Refund Request" --template basic-llm
```

**Test configuration:**

```json
{
  "name": "Refund Request Test",
  "scenario": "Customer requests refund for defective product",
  "user_input": "I want a refund for order #12345. The product arrived broken.",
  "success_criteria": [
    "Agent acknowledges the issue empathetically",
    "Agent asks for or uses provided order number",
    "Agent verifies order details",
    "Agent provides clear next steps or refund timeline"
  ],
  "evaluation_type": "llm"
}
```

**Tool call testing:**

```json
{
  "name": "Order Lookup Test",
  "scenario": "Customer asks about order status",
  "user_input": "What's the status of order ORD-12345?",
  "expected_tool_call": {
    "tool_name": "lookup_order",
    "parameters": { "order_id": "ORD-12345" }
  }
}
```

**API simulation:**

```typescript
const simulation = await client.agents.simulate({
  agent_id: 'agent_123',
  scenario: 'Customer requests refund',
  user_messages: [
    "I want a refund for order #12345",
    "It arrived broken",
    "Yes, process the refund"
  ],
  success_criteria: [
    "Agent shows empathy",
    "Agent verifies order",
    "Agent provides timeline"
  ]
});
console.log('Passed:', simulation.passed);
```

**CI/CD integration:**

```yaml
name: Test Agent
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install -g @elevenlabs/cli
      - run: elevenlabs tests push
        env:
          ELEVENLABS_API_KEY: ${{ secrets.ELEVENLABS_API_KEY }}
      - run: elevenlabs agents test "Support Agent"
        env:
          ELEVENLABS_API_KEY: ${{ secrets.ELEVENLABS_API_KEY }}
```

### Step 7: Deploy

```bash
# Dry run first (always)
elevenlabs agents push --env prod --dry-run

# Deploy to production
elevenlabs agents push --env prod
```

Multi-environment workflow:
```bash
elevenlabs agents push --env dev       # Development
elevenlabs agents push --env staging   # Staging
elevenlabs agents test "Agent Name"    # Test in staging
elevenlabs agents push --env prod      # Production
```

---

## Critical Patterns

### Signed URLs (Security)

Never expose API keys in client code. Use a server endpoint:

```typescript
app.get('/api/elevenlabs/auth', async (req, res) => {
  const response = await fetch(
    'https://api.elevenlabs.io/v1/convai/conversation/get-signed-url',
    {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
      body: JSON.stringify({ agent_id: 'your-agent-id' }),
      method: 'POST'
    }
  );
  const { signed_url } = await response.json();
  res.json({ signed_url });
});
```

### Agent Versioning (A/B Testing)

Dashboard: Agent -> Versions -> Create Branch. Compare metrics, promote winner.

### Post-Call Webhook

```json
{
  "type": "post_call_transcription",
  "data": {
    "conversation_id": "conv_xyz789",
    "transcript": "...",
    "duration_seconds": 120,
    "analysis": { "sentiment": "positive", "resolution": true }
  }
}
```

Verify with HMAC SHA-256:
```typescript
const hmac = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET)
  .update(JSON.stringify(request.body)).digest('hex');
if (signature !== hmac) { /* reject */ }
```

---

## Cost Optimisation

Model lineups and pricing rot fast — check the live list in the ElevenLabs dashboard (Agent → LLM dropdown) or docs before picking, and don't hardcode a model id you haven't verified this session. The durable picks: a current cheap-fast model for most agents (upgrade only where quality demands it), a long-context model when the knowledge base is large.

Key savings:
- **LLM caching**: up to 90% on repeated prompts (enable in config)
- **Prompt length**: 150 tokens > 500 tokens for same instructions
- **RAG over context**: use knowledge base instead of stuffing system prompt
- **Duration limits**: set `max_duration_seconds` to prevent runaway conversations
- **Turn mode**: "patient" mode = fewer LLM calls = lower cost

---

## CLI Quick Reference

```bash
elevenlabs auth login                              # Authenticate
elevenlabs agents init                             # Init project
elevenlabs agents add "Name" --template default    # Add agent
elevenlabs agents push --env dev                   # Deploy to dev
elevenlabs agents push --env prod --dry-run        # Preview prod deploy
elevenlabs agents push --env prod                  # Deploy to prod
elevenlabs agents pull                             # Pull from platform
elevenlabs agents test "Name"                      # Run tests
elevenlabs agents list                             # List agents
elevenlabs agents status                           # Check sync status
elevenlabs agents widget "Name"                    # Generate widget
elevenlabs tools add-webhook "Name" --config-path tool.json  # Add tool
elevenlabs tests add "Name" --template basic-llm   # Add test
```

Environment: `ELEVENLABS_API_KEY` for CI/CD.

---

## Optional References

For specialised use cases, see:
- `references/api-reference.md` -- full REST API for programmatic agent management
- `references/compliance-guide.md` -- GDPR, HIPAA, PCI DSS, data residency
- `references/workflow-examples.md` -- multi-agent routing, escalation, multi-language

---

## Asset Files

- `assets/react-sdk-boilerplate.tsx` -- React integration template
- `assets/react-native-boilerplate.tsx` -- React Native template
- `assets/swift-sdk-boilerplate.swift` -- Swift/iOS template
- `assets/javascript-sdk-boilerplate.js` -- Vanilla JS template
- `assets/widget-embed-template.html` -- Embeddable widget
- `assets/system-prompt-template.md` -- System prompt guide
- `assets/agent-config-schema.json` -- Config schema reference
- `assets/ci-cd-example.yml` -- CI/CD pipeline template
