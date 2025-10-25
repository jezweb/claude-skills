// Basic Chat Completion with GPT-5
// Simple example showing the minimal setup for chat completions

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function basicChatCompletion() {
  const completion = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      {
        role: 'user',
        content: 'What are the three laws of robotics?'
      }
    ],
  });

  console.log(completion.choices[0].message.content);
}

basicChatCompletion();
