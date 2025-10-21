// Streaming chat with messages
// AI SDK Core - streamText() with chat messages

import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

async function main() {
  const stream = streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that writes concise responses.',
      },
      {
        role: 'user',
        content: 'Tell me a short story about AI and humanity working together.',
      },
    ],
    maxOutputTokens: 500,
  });

  console.log('Streaming response:');
  console.log('---');

  // Stream text chunks to console
  for await (const chunk of stream.textStream) {
    process.stdout.write(chunk);
  }

  console.log('\n---');

  // Get final result with metadata
  const result = await stream.result;
  console.log('\nTokens used:', result.usage.totalTokens);
  console.log('Finish reason:', result.finishReason);
}

main().catch(console.error);
