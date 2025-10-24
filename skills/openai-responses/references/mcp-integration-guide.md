# MCP Integration Guide

**Last Updated**: 2025-10-25

Guide for integrating external tools using Model Context Protocol (MCP).

---

## What Is MCP?

MCP (Model Context Protocol) is an open protocol that standardizes how applications provide context to LLMs. It allows connecting external tools like Stripe, databases, and custom APIs.

**Key Benefits:**
- ✅ Built into Responses API (no separate setup)
- ✅ Automatic tool discovery
- ✅ OAuth authentication support
- ✅ No additional cost (billed as output tokens)

---

## Basic MCP Integration

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Roll 2d6 dice',
  tools: [
    {
      type: 'mcp',
      server_label: 'dice',
      server_url: 'https://dmcp.example.com',
    },
  ],
});
```

---

## Authentication

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Create payment link',
  tools: [
    {
      type: 'mcp',
      server_label: 'stripe',
      server_url: 'https://mcp.stripe.com',
      authorization: process.env.STRIPE_OAUTH_TOKEN, // ✅
    },
  ],
});
```

**Important:** API does NOT store tokens. Provide with each request.

---

## Popular MCP Servers

- **Stripe**: https://mcp.stripe.com
- **Database MCP**: Custom servers for PostgreSQL, MySQL, MongoDB
- **Custom APIs**: Build your own MCP server

---

## Building Custom MCP Server

MCP server must implement:

### 1. List Tools Endpoint

```typescript
// POST /mcp/list_tools
{
  tools: [
    {
      name: 'get_weather',
      description: 'Get weather for a city',
      input_schema: {
        type: 'object',
        properties: {
          city: { type: 'string' },
        },
        required: ['city'],
      },
    },
  ],
}
```

### 2. Call Tool Endpoint

```typescript
// POST /mcp/call_tool
Request: {
  name: 'get_weather',
  arguments: { city: 'San Francisco' }
}

Response: {
  result: {
    temperature: 72,
    condition: 'sunny',
  }
}
```

---

## Error Handling

```typescript
try {
  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Use tool',
    tools: [{ type: 'mcp', server_url: '...', authorization: '...' }],
  });
} catch (error: any) {
  if (error.type === 'mcp_connection_error') {
    console.error('Server connection failed');
  }
  if (error.type === 'mcp_authentication_error') {
    console.error('Invalid token');
  }
}
```

---

**Official MCP Docs**: https://platform.openai.com/docs/guides/tools-connectors-mcp
