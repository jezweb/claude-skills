// Streaming Chat Completion (Node.js SDK)
// Real-time token-by-token delivery for better UX

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function streamingChat() {
  console.log('Streaming response:\n');

  const stream = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      {
        role: 'system',
        content: 'You are a creative writer.'
      },
      {
        role: 'user',
        content: 'Write a short poem about coding'
      }
    ],
    stream: true,
    max_tokens: 200,
  });

  // Process stream chunks
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    process.stdout.write(content);
  }

  console.log('\n\nStream complete!');
}

streamingChat();
