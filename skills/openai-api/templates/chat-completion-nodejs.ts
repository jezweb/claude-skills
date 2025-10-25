// Complete Chat Completion Example (Node.js SDK)
// Shows multi-turn conversation, GPT-5 parameters, and error handling

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function chatWithGPT5() {
  try {
    // Multi-turn conversation
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: 'You are a helpful assistant that explains complex topics simply.'
      },
      {
        role: 'user',
        content: 'Explain quantum computing to a 10-year-old'
      }
    ];

    // First turn with GPT-5 specific parameters
    const completion1 = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: messages,
      reasoning_effort: 'medium', // GPT-5 parameter
      verbosity: 'high',          // GPT-5 parameter
      max_tokens: 500,
    });

    const assistantMessage = completion1.choices[0].message;
    console.log('Assistant:', assistantMessage.content);

    // Add assistant response to conversation
    messages.push(assistantMessage);

    // Follow-up question
    messages.push({
      role: 'user',
      content: 'Can you give me an example?'
    });

    // Second turn
    const completion2 = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: messages,
      reasoning_effort: 'medium',
      verbosity: 'medium',
      max_tokens: 300,
    });

    console.log('Assistant:', completion2.choices[0].message.content);

    // Token usage
    console.log('\nToken usage:');
    console.log('- Prompt tokens:', completion2.usage?.prompt_tokens);
    console.log('- Completion tokens:', completion2.usage?.completion_tokens);
    console.log('- Total tokens:', completion2.usage?.total_tokens);

  } catch (error: any) {
    if (error.status === 401) {
      console.error('Invalid API key. Check OPENAI_API_KEY environment variable.');
    } else if (error.status === 429) {
      console.error('Rate limit exceeded. Please wait and try again.');
    } else {
      console.error('Error:', error.message);
    }
  }
}

chatWithGPT5();
