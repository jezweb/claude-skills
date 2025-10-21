// Anthropic provider configuration
// AI SDK Core - Anthropic (Claude) setup and usage

import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

async function main() {
  console.log('=== Anthropic (Claude) Provider Setup ===\n');

  // Method 1: Use environment variable (recommended)
  // ANTHROPIC_API_KEY=sk-ant-...
  const model1 = anthropic('claude-3-5-sonnet-20241022');

  // Method 2: Explicit API key
  const model2 = anthropic('claude-3-5-sonnet-20241022', {
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Available models
  const models = {
    sonnet35: anthropic('claude-3-5-sonnet-20241022'), // Best balance
    opus: anthropic('claude-3-opus-20240229'), // Highest intelligence
    haiku: anthropic('claude-3-haiku-20240307'), // Fastest
  };

  // Example: Generate text with Claude
  console.log('Generating text with Claude 3.5 Sonnet...\n');

  const result = await generateText({
    model: models.sonnet35,
    prompt: 'Explain what makes Claude different from other AI assistants in 2 sentences.',
    maxOutputTokens: 150,
  });

  console.log('Response:', result.text);
  console.log('\nUsage:');
  console.log('- Prompt tokens:', result.usage.promptTokens);
  console.log('- Completion tokens:', result.usage.completionTokens);
  console.log('- Total tokens:', result.usage.totalTokens);

  // Example: Long context handling
  console.log('\n=== Long Context Example ===\n');

  const longContextResult = await generateText({
    model: models.sonnet35,
    messages: [
      {
        role: 'user',
        content: 'I will give you a long document to analyze. Here it is: ' + 'Lorem ipsum '.repeat(1000),
      },
      {
        role: 'user',
        content: 'Now summarize the key points.',
      },
    ],
    maxOutputTokens: 200,
  });

  console.log('Long context summary:', longContextResult.text);

  // Model selection guide
  console.log('\n=== Model Selection Guide ===');
  console.log('- Claude 3.5 Sonnet: Best balance of intelligence, speed, and cost');
  console.log('- Claude 3 Opus: Highest intelligence, best for complex reasoning');
  console.log('- Claude 3 Haiku: Fastest and most cost-effective');
  console.log('\nAll Claude models support 200K+ token context windows');
}

main().catch(console.error);
