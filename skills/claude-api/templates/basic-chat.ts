import Anthropic from '@anthropic-ai/sdk';

// Initialize the client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

async function basicChat() {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: 'Hello, Claude! Tell me a fun fact about TypeScript.',
        },
      ],
    });

    // Extract text from response
    const textContent = message.content.find(block => block.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log('Claude:', textContent.text);
    }

    // Log usage information
    console.log('\nUsage:');
    console.log('- Input tokens:', message.usage.input_tokens);
    console.log('- Output tokens:', message.usage.output_tokens);
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(`API Error [${error.status}]:`, error.message);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Multi-turn conversation example
async function multiTurnChat() {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // First turn
  messages.push({
    role: 'user',
    content: 'What is the capital of France?',
  });

  const response1 = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages,
  });

  const text1 = response1.content.find(b => b.type === 'text');
  if (text1 && text1.type === 'text') {
    messages.push({ role: 'assistant', content: text1.text });
    console.log('Claude:', text1.text);
  }

  // Second turn
  messages.push({
    role: 'user',
    content: 'What is its population?',
  });

  const response2 = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages,
  });

  const text2 = response2.content.find(b => b.type === 'text');
  if (text2 && text2.type === 'text') {
    console.log('Claude:', text2.text);
  }
}

// System prompt example
async function chatWithSystemPrompt() {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: 'You are a helpful Python coding assistant. Always provide type hints and docstrings.',
    messages: [
      {
        role: 'user',
        content: 'Write a function to calculate the factorial of a number.',
      },
    ],
  });

  const textContent = message.content.find(block => block.type === 'text');
  if (textContent && textContent.type === 'text') {
    console.log(textContent.text);
  }
}

// Run examples
if (require.main === module) {
  console.log('=== Basic Chat ===\n');
  basicChat()
    .then(() => {
      console.log('\n=== Multi-turn Chat ===\n');
      return multiTurnChat();
    })
    .then(() => {
      console.log('\n=== Chat with System Prompt ===\n');
      return chatWithSystemPrompt();
    })
    .catch(console.error);
}

export { basicChat, multiTurnChat, chatWithSystemPrompt };
