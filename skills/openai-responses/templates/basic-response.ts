/**
 * Basic Response Example
 *
 * Simple text generation using the OpenAI Responses API.
 * This is the simplest way to use the Responses API.
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function basicResponse() {
  // Simple text input
  const response = await openai.responses.create({
    model: 'gpt-5', // or 'gpt-5-mini', 'gpt-4o'
    input: 'What are the 5 Ds of dodgeball?',
  });

  // Get text output
  console.log(response.output_text);

  // Or inspect full output array
  response.output.forEach((item) => {
    console.log('Type:', item.type);
    if (item.type === 'message') {
      console.log('Content:', item.content);
    }
  });

  // Check usage
  console.log('Tokens used:', response.usage.total_tokens);
}

async function basicResponseWithMessages() {
  // Using message array format (like Chat Completions)
  const response = await openai.responses.create({
    model: 'gpt-5',
    input: [
      { role: 'developer', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Explain quantum computing in one sentence.' },
    ],
  });

  console.log(response.output_text);
}

async function basicResponseWithOptions() {
  // With additional options
  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Write a haiku about coding',
    store: false, // Don't store conversation (saves costs)
    temperature: 0.7, // Creativity level (0-2)
  });

  console.log(response.output_text);
}

// Run examples
basicResponse();
// basicResponseWithMessages();
// basicResponseWithOptions();
