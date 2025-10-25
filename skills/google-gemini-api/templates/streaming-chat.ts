/**
 * Streaming Text Generation with Gemini API (Node.js SDK)
 *
 * Demonstrates:
 * - Streaming responses with async iteration
 * - Real-time token delivery for better UX
 * - Handling partial chunks
 * - Multi-turn chat with streaming
 *
 * Prerequisites:
 * - npm install @google/genai@1.27.0
 * - export GEMINI_API_KEY="..."
 */

import { GoogleGenAI } from '@google/genai';

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  try {
    // Example 1: Basic streaming
    console.log('Example 1: Basic Streaming\n');
    console.log('Prompt: Write a 200-word story about time travel\n');

    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: 'Write a 200-word story about time travel'
    });

    // Stream chunks as they arrive
    for await (const chunk of response) {
      // Each chunk may contain partial text
      if (chunk.text) {
        process.stdout.write(chunk.text);
      }
    }

    console.log('\n\n---\n');

    // Example 2: Streaming with chat
    console.log('Example 2: Streaming Chat\n');

    const chat = await ai.models.createChat({
      model: 'gemini-2.5-flash',
      systemInstruction: 'You are a helpful coding assistant.'
    });

    // First turn with streaming
    console.log('User: What is TypeScript?\n');
    const response1 = await chat.sendMessageStream('What is TypeScript?');

    console.log('Assistant: ');
    for await (const chunk of response1) {
      process.stdout.write(chunk.text);
    }

    console.log('\n\n');

    // Second turn with streaming (context maintained)
    console.log('User: How do I install it?\n');
    const response2 = await chat.sendMessageStream('How do I install it?');

    console.log('Assistant: ');
    for await (const chunk of response2) {
      process.stdout.write(chunk.text);
    }

    console.log('\n\n');

    // Get full chat history
    const history = chat.getHistory();
    console.log(`Total messages in history: ${history.length}`);

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

main();
