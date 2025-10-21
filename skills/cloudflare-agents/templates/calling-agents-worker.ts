// Worker that calls Agents using routeAgentRequest and getAgentByName

import { Agent, AgentNamespace, routeAgentRequest, getAgentByName } from 'agents';

interface Env {
  MyAgent: AgentNamespace<MyAgent>;
  ChatAgent: AgentNamespace<ChatAgent>;
}

// Worker fetch handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Pattern 1: Automatic routing with routeAgentRequest
    // Routes to: /agents/:agent-name/:instance-name
    // Example: /agents/my-agent/user-123
    if (url.pathname.startsWith('/agents/')) {
      const response = await routeAgentRequest(request, env);

      if (response) {
        return response;
      }

      return new Response("Agent not found", { status: 404 });
    }

    // Pattern 2: Custom routing with getAgentByName
    // Example: /user/:userId/profile
    if (url.pathname.startsWith('/user/')) {
      const userId = url.pathname.split('/')[2];

      // Authenticate first (CRITICAL)
      const authHeader = request.headers.get('Authorization');
      if (!authHeader) {
        return new Response("Unauthorized", { status: 401 });
      }

      // Verify token and get authenticated userId
      const authenticatedUserId = await verifyToken(authHeader);
      if (!authenticatedUserId || authenticatedUserId !== userId) {
        return new Response("Forbidden", { status: 403 });
      }

      // Get or create agent for this user
      const agent = getAgentByName<Env, MyAgent>(env.MyAgent, `user-${userId}`);

      // Pass request to agent
      return (await agent).fetch(request);
    }

    // Pattern 3: Call agent methods directly (RPC)
    if (url.pathname === '/api/process') {
      const { userId, data } = await request.json();

      const agent = getAgentByName<Env, MyAgent>(env.MyAgent, `user-${userId}`);

      // Call custom method on agent
      const result = await (await agent).processData(data);

      return Response.json({ result });
    }

    // Pattern 4: Multi-agent communication
    if (url.pathname === '/api/chat-with-context') {
      const { userId, message } = await request.json();

      // Get user agent
      const userAgent = getAgentByName<Env, MyAgent>(env.MyAgent, `user-${userId}`);

      // Get chat agent
      const chatAgent = getAgentByName<Env, ChatAgent>(env.ChatAgent, `chat-${userId}`);

      // User agent prepares context
      const context = await (await userAgent).getContext();

      // Chat agent generates response
      const response = await (await chatAgent).chat(message, context);

      return Response.json({ response });
    }

    return new Response("Not Found", { status: 404 });
  }
} satisfies ExportedHandler<Env>;

// Helper: Verify JWT token
async function verifyToken(token: string): Promise<string | null> {
  try {
    // Implement your token verification logic
    // Example: JWT verification, session validation, etc.
    return "user-123";  // Return userId if valid
  } catch (e) {
    return null;
  }
}

// Agent definitions

export class MyAgent extends Agent<Env> {
  async onRequest(request: Request): Promise<Response> {
    return Response.json({
      agent: this.name,
      message: "Hello from MyAgent"
    });
  }

  async processData(data: any): Promise<any> {
    return { processed: true, data };
  }

  async getContext(): Promise<any> {
    return { user: this.name, preferences: this.state };
  }
}

export class ChatAgent extends Agent<Env> {
  async onRequest(request: Request): Promise<Response> {
    return Response.json({ agent: this.name });
  }

  async chat(message: string, context: any): Promise<string> {
    return `Response to: ${message} (with context: ${JSON.stringify(context)})`;
  }
}
