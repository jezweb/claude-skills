/**
 * WebSocket Hibernation Example: Chat Room
 *
 * Demonstrates:
 * - WebSocket Hibernation API
 * - ctx.acceptWebSocket() for cost savings
 * - WebSocket handler methods (webSocketMessage, webSocketClose, webSocketError)
 * - serializeAttachment / deserializeAttachment for metadata persistence
 * - State restoration in constructor after hibernation
 */

import { DurableObject, DurableObjectState } from 'cloudflare:workers';

interface Env {
  CHAT_ROOM: DurableObjectNamespace<ChatRoom>;
}

interface SessionMetadata {
  userId: string;
  username: string;
}

export class ChatRoom extends DurableObject<Env> {
  // In-memory state (restored after hibernation)
  sessions: Map<WebSocket, SessionMetadata>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Restore WebSocket connections after hibernation
    this.sessions = new Map();

    // Get all active WebSockets and restore their metadata
    ctx.getWebSockets().forEach((ws) => {
      // Deserialize metadata (persisted via serializeAttachment)
      const metadata = ws.deserializeAttachment<SessionMetadata>();
      this.sessions.set(ws, metadata);
    });

    console.log(`ChatRoom constructor: restored ${this.sessions.size} connections`);
  }

  /**
   * Accept WebSocket connections
   */
  async fetch(request: Request): Promise<Response> {
    // Expect WebSocket upgrade request
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    if (request.method !== 'GET') {
      return new Response('Expected GET method', { status: 400 });
    }

    // Get user info from URL parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'anonymous';
    const username = url.searchParams.get('username') || 'Anonymous';

    // Create WebSocket pair
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // CRITICAL: Use ctx.acceptWebSocket (NOT ws.accept())
    // This enables hibernation to save costs
    this.ctx.acceptWebSocket(server);

    // Serialize metadata to persist across hibernation
    const metadata: SessionMetadata = { userId, username };
    server.serializeAttachment(metadata);

    // Track in-memory (will be restored after hibernation)
    this.sessions.set(server, metadata);

    // Notify others that user joined
    this.broadcast({
      type: 'system',
      text: `${username} joined the room`,
      timestamp: Date.now(),
    }, server);

    // Send welcome message to new user
    server.send(JSON.stringify({
      type: 'system',
      text: `Welcome to the chat room! ${this.sessions.size} user(s) online.`,
      timestamp: Date.now(),
    }));

    // Return client WebSocket to browser
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * Called when WebSocket receives a message
   * This method is called even if the DO was hibernated
   */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const session = this.sessions.get(ws);

    if (!session) {
      console.error('WebSocket not found in sessions');
      return;
    }

    // Handle text messages
    if (typeof message === 'string') {
      try {
        const data = JSON.parse(message);

        if (data.type === 'chat') {
          // Broadcast chat message to all connections
          this.broadcast({
            type: 'chat',
            userId: session.userId,
            username: session.username,
            text: data.text,
            timestamp: Date.now(),
          });
        }

        if (data.type === 'typing') {
          // Broadcast typing indicator to others
          this.broadcast({
            type: 'typing',
            userId: session.userId,
            username: session.username,
          }, ws);
        }

      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    }
  }

  /**
   * Called when WebSocket closes
   */
  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    const session = this.sessions.get(ws);

    // Close the WebSocket
    ws.close(code, 'Durable Object closing WebSocket');

    // Remove from sessions
    this.sessions.delete(ws);

    // Notify others
    if (session) {
      this.broadcast({
        type: 'system',
        text: `${session.username} left the room`,
        timestamp: Date.now(),
      });
    }

    console.log(`WebSocket closed: ${session?.username || 'unknown'}, code: ${code}, clean: ${wasClean}`);
  }

  /**
   * Called on WebSocket errors
   */
  async webSocketError(ws: WebSocket, error: any): Promise<void> {
    console.error('WebSocket error:', error);

    const session = this.sessions.get(ws);
    this.sessions.delete(ws);

    if (session) {
      this.broadcast({
        type: 'system',
        text: `${session.username} disconnected (error)`,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Broadcast message to all connections (except sender)
   */
  private broadcast(message: any, except?: WebSocket): void {
    const messageStr = JSON.stringify(message);

    this.sessions.forEach((session, ws) => {
      if (ws !== except && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }
}

// CRITICAL: Export the class
export default ChatRoom;

/**
 * Worker that creates and routes to chat rooms
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Extract room ID from path (e.g., /room/abc123)
    const match = url.pathname.match(/^\/room\/([^/]+)/);

    if (!match) {
      return new Response('Usage: /room/{roomId}?userId={userId}&username={username}', {
        status: 400,
      });
    }

    const roomId = match[1];

    // Get or create chat room DO
    const id = env.CHAT_ROOM.idFromName(roomId);
    const stub = env.CHAT_ROOM.get(id);

    // Forward request to DO
    return stub.fetch(request);
  },
};
