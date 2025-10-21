// React client using useAgent and useAgentChat hooks

import { useAgent } from "agents/react";
import { useAgentChat } from "agents/ai-react";
import { useState, useEffect } from "react";

// Example 1: useAgent with WebSocket connection
export function AgentConnection() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [messages, setMessages] = useState<any[]>([]);

  const connection = useAgent({
    agent: "chat-agent",           // Agent class name (kebab-case)
    name: "room-123",              // Agent instance name
    host: window.location.host,    // Optional: defaults to current host

    onOpen: () => {
      console.log("Connected");
      setStatus('connected');
    },

    onClose: () => {
      console.log("Disconnected");
      setStatus('disconnected');
    },

    onMessage: (event) => {
      const data = JSON.parse(event.data);
      console.log("Received:", data);

      if (data.type === 'message') {
        setMessages(prev => [...prev, data.message]);
      }
    },

    onError: (error) => {
      console.error("Connection error:", error);
    }
  });

  const sendMessage = (text: string) => {
    connection.send(JSON.stringify({
      type: 'chat',
      text,
      sender: 'user-123'
    }));
  };

  return (
    <div>
      <p>Status: {status}</p>

      <div>
        {messages.map((msg, i) => (
          <div key={i}>{msg.text}</div>
        ))}
      </div>

      <button onClick={() => sendMessage("Hello!")}>
        Send Message
      </button>
    </div>
  );
}

// Example 2: useAgent with state synchronization
export function Counter() {
  const [count, setCount] = useState(0);

  const agent = useAgent({
    agent: "counter-agent",
    name: "my-counter",

    onStateUpdate: (newState) => {
      // Automatically called when agent state changes
      setCount(newState.counter);
    }
  });

  const increment = () => {
    // Update agent state (syncs to all connected clients)
    agent.setState({ counter: count + 1 });
  };

  const decrement = () => {
    agent.setState({ counter: count - 1 });
  };

  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}

// Example 3: useAgentChat for AI chat interface
export function ChatInterface() {
  const {
    messages,           // All chat messages
    input,              // Current input value
    handleInputChange,  // Update input
    handleSubmit,       // Send message
    isLoading,          // Loading state
    error,              // Error state
    reload,             // Reload last response
    stop                // Stop generation
  } = useAgentChat({
    agent: "streaming-chat-agent",
    name: "chat-session-123",

    // Optional: Custom headers
    headers: {
      'Authorization': 'Bearer your-token'
    },

    // Optional: Initial messages
    initialMessages: [
      { role: 'system', content: 'You are a helpful assistant.' }
    ],

    // Optional: Called when message complete
    onFinish: (message) => {
      console.log('Message complete:', message);
    },

    // Optional: Called on error
    onError: (error) => {
      console.error('Chat error:', error);
    }
  });

  return (
    <div className="chat-container">
      {/* Message history */}
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <strong>{msg.role}:</strong>
            <p>{msg.content}</p>
          </div>
        ))}

        {isLoading && <div className="loading">Thinking...</div>}
        {error && <div className="error">{error.message}</div>}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
          disabled={isLoading}
        />

        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? "Sending..." : "Send"}
        </button>

        {isLoading && (
          <button type="button" onClick={stop}>
            Stop
          </button>
        )}
      </form>
    </div>
  );
}

// Example 4: Multiple agent connections
export function MultiAgentDemo() {
  const userAgent = useAgent({
    agent: "user-agent",
    name: "user-123"
  });

  const notificationAgent = useAgent({
    agent: "notification-agent",
    name: "user-123"
  });

  useEffect(() => {
    // Subscribe to notifications
    notificationAgent.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification') {
        alert(data.message);
      }
    });
  }, [notificationAgent]);

  return (
    <div>
      <h2>Multi-Agent Connection</h2>
      <p>Connected to multiple agents</p>
    </div>
  );
}

// Example 5: HTTP requests with agentFetch
import { agentFetch } from "agents/client";

export async function fetchAgentData() {
  try {
    const response = await agentFetch(
      {
        agent: "data-agent",
        name: "user-123"
      },
      {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch:", error);
    throw error;
  }
}

function getToken(): string {
  // Get auth token from storage or state
  return localStorage.getItem('auth-token') || '';
}
