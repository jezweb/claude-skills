// WebSocket Agent with real-time bidirectional communication

import { Agent, Connection, ConnectionContext, WSMessage } from "agents";

interface Env {
  // Add bindings here
}

interface ChatState {
  messages: Array<{
    id: string;
    text: string;
    sender: string;
    timestamp: number;
  }>;
  participants: string[];
  createdAt: number;
}

export class ChatAgent extends Agent<Env, ChatState> {
  initialState: ChatState = {
    messages: [],
    participants: [],
    createdAt: Date.now()
  };

  // Called when a client connects via WebSocket
  async onConnect(connection: Connection, ctx: ConnectionContext) {
    // Access original HTTP request for authentication
    const userId = ctx.request.headers.get('X-User-ID') || 'anonymous';
    const authToken = ctx.request.headers.get('Authorization');

    // Optional: Close connection if unauthorized
    if (!authToken) {
      connection.close(401, "Unauthorized");
      return;
    }

    console.log(`Client ${connection.id} connected as ${userId}`);

    // Add to participants
    if (!this.state.participants.includes(userId)) {
      this.setState({
        ...this.state,
        participants: [...this.state.participants, userId]
      });
    }

    // Send welcome message to this connection
    connection.send(JSON.stringify({
      type: 'welcome',
      message: `Welcome, ${userId}!`,
      participants: this.state.participants,
      messageCount: this.state.messages.length
    }));

    // Broadcast participant joined to all connected clients (via state sync)
    connection.send(JSON.stringify({
      type: 'user_joined',
      userId,
      participants: this.state.participants
    }));
  }

  // Called for each message received
  async onMessage(connection: Connection, message: WSMessage) {
    // Handle string messages (most common)
    if (typeof message === 'string') {
      try {
        const data = JSON.parse(message);

        // Handle chat message
        if (data.type === 'chat') {
          const newMessage = {
            id: crypto.randomUUID(),
            text: data.text,
            sender: data.sender || 'anonymous',
            timestamp: Date.now()
          };

          // Add to state (will sync to all connections)
          this.setState({
            ...this.state,
            messages: [...this.state.messages, newMessage]
          });

          // Send acknowledgement to sender
          connection.send(JSON.stringify({
            type: 'message_sent',
            messageId: newMessage.id
          }));
        }

        // Handle typing indicator
        if (data.type === 'typing') {
          // Broadcast to all except sender
          connection.send(JSON.stringify({
            type: 'user_typing',
            userId: data.sender
          }));
        }
      } catch (e) {
        // Handle parse error
        connection.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    }

    // Handle binary messages (ArrayBuffer or ArrayBufferView)
    if (message instanceof ArrayBuffer) {
      console.log('Received binary message:', message.byteLength, 'bytes');
      // Process binary data...
    }
  }

  // Called when connection has an error
  async onError(connection: Connection, error: unknown): Promise<void> {
    console.error('WebSocket error:', error);

    // Send error message to client
    connection.send(JSON.stringify({
      type: 'error',
      message: 'Connection error occurred'
    }));
  }

  // Called when connection closes
  async onClose(connection: Connection, code: number, reason: string, wasClean: boolean): Promise<void> {
    console.log(`Connection ${connection.id} closed:`, code, reason, wasClean);

    // Clean up connection-specific state if needed
    // Note: Agent state persists even after all connections close
  }

  // React to state updates (from any source)
  onStateUpdate(state: ChatState, source: "server" | Connection) {
    console.log('Chat state updated');
    console.log('Message count:', state.messages.length);
    console.log('Participants:', state.participants);
  }
}

export default ChatAgent;
