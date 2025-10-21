// AIChatAgent with streaming responses

import { AIChatAgent } from "agents/ai-chat-agent";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

interface Env {
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
}

export class StreamingChatAgent extends AIChatAgent<Env> {
  // Handle incoming chat messages and stream response
  async onChatMessage(onFinish) {
    // Choose model based on available API keys
    const model = this.env.ANTHROPIC_API_KEY
      ? anthropic('claude-sonnet-4-5')
      : openai('gpt-4o-mini');

    // Stream text generation
    const result = streamText({
      model,
      messages: this.messages,  // Built-in message history
      onFinish,                  // Called when response complete
      temperature: 0.7,
      maxTokens: 1000
    });

    // Return streaming response
    return result.toTextStreamResponse();
  }

  // Optional: Customize state updates
  async onStateUpdate(state, source) {
    console.log('Chat updated:');
    console.log('  Messages:', this.messages.length);
    console.log('  Last message:', this.messages[this.messages.length - 1]?.content);
  }

  // Optional: Custom message persistence
  async onStart() {
    // Load previous messages from SQL if needed
    const saved = await this.sql`SELECT * FROM messages ORDER BY timestamp`;

    if (saved.length > 0) {
      // Restore message history
      console.log('Restored', saved.length, 'messages');
    }
  }
}

export default StreamingChatAgent;
