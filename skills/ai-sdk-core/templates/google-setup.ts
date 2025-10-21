// Google provider configuration
// AI SDK Core - Google (Gemini) setup and usage

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

async function main() {
  console.log('=== Google (Gemini) Provider Setup ===\n');

  // Method 1: Use environment variable (recommended)
  // GOOGLE_GENERATIVE_AI_API_KEY=...
  const model1 = google('gemini-2.5-pro');

  // Method 2: Explicit API key
  const model2 = google('gemini-2.5-pro', {
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  // Available models
  const models = {
    pro: google('gemini-2.5-pro'), // Best for reasoning
    flash: google('gemini-2.5-flash'), // Fast and efficient
    flashLite: google('gemini-2.5-flash-lite'), // Ultra-fast (if available)
  };

  // Example: Generate text with Gemini
  console.log('Generating text with Gemini 2.5 Pro...\n');

  const result = await generateText({
    model: models.pro,
    prompt: 'Explain what makes Gemini good at multimodal tasks in 2 sentences.',
    maxOutputTokens: 150,
  });

  console.log('Response:', result.text);
  console.log('\nUsage:');
  console.log('- Prompt tokens:', result.usage.promptTokens);
  console.log('- Completion tokens:', result.usage.completionTokens);
  console.log('- Total tokens:', result.usage.totalTokens);

  // Example: Structured output with Gemini
  console.log('\n=== Structured Output Example ===\n');

  const { generateObject } = await import('ai');
  const { z } = await import('zod');

  const structuredResult = await generateObject({
    model: models.pro,
    schema: z.object({
      title: z.string(),
      summary: z.string(),
      keyPoints: z.array(z.string()),
    }),
    prompt: 'Summarize the benefits of using Gemini AI.',
  });

  console.log('Structured output:');
  console.log(JSON.stringify(structuredResult.object, null, 2));

  // Error handling example
  console.log('\n=== Error Handling ===\n');

  try {
    const result2 = await generateText({
      model: google('gemini-2.5-pro'),
      prompt: 'Hello',
    });
    console.log('Success:', result2.text);
  } catch (error: any) {
    if (error.message?.includes('SAFETY')) {
      console.error('Error: Content filtered by safety settings');
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      console.error('Error: API quota exceeded');
    } else {
      console.error('Error:', error.message);
    }
  }

  // Model selection guide
  console.log('\n=== Model Selection Guide ===');
  console.log('- Gemini 2.5 Pro: Best for complex reasoning and analysis');
  console.log('- Gemini 2.5 Flash: Fast and cost-effective for most tasks');
  console.log('- Gemini 2.5 Flash Lite: Ultra-fast for simple tasks');
  console.log('\nGemini has generous free tier limits and excels at multimodal tasks');
}

main().catch(console.error);
