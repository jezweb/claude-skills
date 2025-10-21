// Simple text generation with OpenAI
// AI SDK Core - generateText() basic example

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

async function main() {
  const result = await generateText({
    model: openai('gpt-4-turbo'),
    prompt: 'What is TypeScript? Explain in 2 sentences.',
    maxOutputTokens: 100,
    temperature: 0.7,
  });

  console.log('Generated text:', result.text);
  console.log('Tokens used:', result.usage.totalTokens);
  console.log('Finish reason:', result.finishReason);
}

main().catch(console.error);
