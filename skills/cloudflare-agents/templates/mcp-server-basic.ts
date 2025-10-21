// Model Context Protocol (MCP) Server with Agents SDK

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

interface Env {
  // Add bindings (AI, DB, etc.)
}

// Stateless MCP Server (basic tools)
export class BasicMCP extends McpAgent {
  server = new McpServer({
    name: "BasicMCP",
    version: "1.0.0"
  });

  async init() {
    // Tool 1: Add numbers
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

    // Tool 2: Get current time
    this.server.tool(
      "get-time",
      "Get the current server time",
      {},
      async () => ({
        content: [{
          type: "text",
          text: new Date().toISOString()
        }]
      })
    );

    // Tool 3: Echo message
    this.server.tool(
      "echo",
      "Echo back a message",
      {
        message: z.string().describe("Message to echo")
      },
      async ({ message }) => ({
        content: [{ type: "text", text: message }]
      })
    );
  }
}

// Stateful MCP Server (with Agent state)
type CounterState = {
  counter: number;
  operations: string[];
};

export class StatefulMCP extends McpAgent<Env, CounterState> {
  server = new McpServer({
    name: "StatefulMCP",
    version: "1.0.0"
  });

  initialState: CounterState = {
    counter: 0,
    operations: []
  };

  async init() {
    // Resource: Counter value
    this.server.resource(
      "counter",
      "mcp://resource/counter",
      (uri) => ({
        contents: [{
          uri: uri.href,
          text: String(this.state.counter)
        }]
      })
    );

    // Resource: Operations history
    this.server.resource(
      "history",
      "mcp://resource/history",
      (uri) => ({
        contents: [{
          uri: uri.href,
          text: JSON.stringify(this.state.operations, null, 2)
        }]
      })
    );

    // Tool: Increment counter
    this.server.tool(
      "increment",
      "Increment the counter by a specified amount",
      {
        amount: z.number().describe("Amount to increment")
      },
      async ({ amount }) => {
        const newCounter = this.state.counter + amount;

        this.setState({
          counter: newCounter,
          operations: [
            ...this.state.operations,
            `increment(${amount}) = ${newCounter}`
          ]
        });

        return {
          content: [{
            type: "text",
            text: `Counter is now ${newCounter}`
          }]
        };
      }
    );

    // Tool: Reset counter
    this.server.tool(
      "reset",
      "Reset the counter to zero",
      {},
      async () => {
        this.setState({
          counter: 0,
          operations: [...this.state.operations, "reset() = 0"]
        });

        return {
          content: [{ type: "text", text: "Counter reset to 0" }]
        };
      }
    );
  }

  // React to state updates
  onStateUpdate(state: CounterState) {
    console.log('MCP State updated:', state);
  }
}

// Export with Hono for routing
import { Hono } from 'hono';

const app = new Hono();

// Mount MCP servers
// Streamable HTTP transport (modern, recommended)
app.mount('/mcp', BasicMCP.serve('/mcp').fetch, { replaceRequest: false });

// SSE transport (legacy, deprecated)
app.mount('/sse', BasicMCP.serveSSE('/sse').fetch, { replaceRequest: false });

// Stateful MCP server
app.mount('/stateful/mcp', StatefulMCP.serve('/stateful/mcp').fetch, { replaceRequest: false });

export default app;

// With OAuth (optional)
/*
import { OAuthProvider } from '@cloudflare/workers-oauth-provider';

export default new OAuthProvider({
  apiHandlers: {
    '/sse': BasicMCP.serveSSE('/sse'),
    '/mcp': BasicMCP.serve('/mcp')
  },
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  // ... other OAuth config
});
*/
