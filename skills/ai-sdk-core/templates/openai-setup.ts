// OpenAI provider configuration
// AI SDK Core - OpenAI setup and usage

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

async function main() {
  console.log('=== OpenAI Provider Setup ===\n');

  // Method 1: Use environment variable (recommended)
  // OPENAI_API_KEY=sk-...
  const model1 = openai('gpt-4-turbo');

  // Method 2: Explicit API key
  const model2 = openai('gpt-4', {
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Available models
  const models = {
    gpt4Turbo: openai('gpt-4-turbo'),
    gpt4: openai('gpt-4'),
    gpt35Turbo: openai('gpt-3.5-turbo'),
    gpt5: openai('gpt-5'), // If available in your account
  };

  // Example: Generate text with GPT-4
  console.log('Generating text with GPT-4 Turbo...\n');

  const result = await generateText({
    model: models.gpt4Turbo,
    prompt: 'Explain the difference between GPT-3.5 and GPT-4 in one sentence.',
    maxOutputTokens: 100,
  });

  console.log('Response:', result.text);
  console.log('\nUsage:');
  console.log('- Prompt tokens:', result.usage.promptTokens);
  console.log('- Completion tokens:', result.usage.completionTokens);
  console.log('- Total tokens:', result.usage.totalTokens);

  // Example: Error handling
  console.log('\n=== Error Handling ===\n');

  try {
    const result2 = await generateText({
      model: openai('gpt-4-turbo'),
      prompt: 'Hello',
    });
    console.log('Success:', result2.text);
  } catch (error: any) {
    if (error.statusCode === 401) {
      console.error('Error: Invalid API key');
    } else if (error.statusCode === 429) {
      console.error('Error: Rate limit exceeded');
    } else if (error.statusCode >= 500) {
      console.error('Error: OpenAI server issue');
    } else {
      console.error('Error:', error.message);
    }
  }

  // Model selection guide
  console.log('\n=== Model Selection Guide ===');
  console.log('- gpt-4-turbo: Best for complex reasoning, current model');
  console.log('- gpt-4: High quality, slightly older');
  console.log('- gpt-3.5-turbo: Fast and cost-effective for simple tasks');
  console.log('- gpt-5: Latest model (if available)');
}

main().catch(console.error);
