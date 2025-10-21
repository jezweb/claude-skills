// Basic Cloudflare Agent with HTTP request handling

import { Agent } from "agents";

interface Env {
  // Add environment variables and bindings here
  // Example: OPENAI_API_KEY: string;
}

interface State {
  counter: number;
  messages: string[];
  lastUpdated: Date | null;
}

export class MyAgent extends Agent<Env, State> {
  // Set initial state (first time agent is created)
  initialState: State = {
    counter: 0,
    messages: [],
    lastUpdated: null
  };

  // Called when agent starts or wakes from hibernation
  async onStart() {
    console.log('Agent started:', this.name);
    console.log('Current state:', this.state);
  }

  // Handle HTTP requests
  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // GET /status - Return current state
    if (method === "GET" && url.pathname === "/status") {
      return Response.json({
        agent: this.name,
        state: this.state,
        timestamp: new Date().toISOString()
      });
    }

    // POST /increment - Increment counter
    if (method === "POST" && url.pathname === "/increment") {
      const newCounter = this.state.counter + 1;

      this.setState({
        ...this.state,
        counter: newCounter,
        lastUpdated: new Date()
      });

      return Response.json({
        success: true,
        counter: newCounter
      });
    }

    // POST /message - Add message
    if (method === "POST" && url.pathname === "/message") {
      const { message } = await request.json();

      this.setState({
        ...this.state,
        messages: [...this.state.messages, message],
        lastUpdated: new Date()
      });

      return Response.json({
        success: true,
        messageCount: this.state.messages.length
      });
    }

    // POST /reset - Reset state
    if (method === "POST" && url.pathname === "/reset") {
      this.setState(this.initialState);

      return Response.json({ success: true, message: "State reset" });
    }

    // 404 for unknown routes
    return new Response("Not Found", { status: 404 });
  }

  // Optional: React to state updates
  onStateUpdate(state: State, source: "server" | Connection) {
    console.log('State updated:', state);
    console.log('Update source:', source);
  }
}

export default MyAgent;
