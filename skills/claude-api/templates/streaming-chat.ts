import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Method 1: Using SDK stream helper with event listeners
async function streamWithEvents() {
  console.log('Claude:');

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: 'Write a short poem about coding.',
      },
    ],
  });

  stream
    .on('text', (text) => {
      process.stdout.write(text);
    })
    .on('message', (message) => {
      console.log('\n\nFinal message:', message);
      console.log('Stop reason:', message.stop_reason);
    })
    .on('error', (error) => {
      console.error('\nStream error:', error);
    })
    .on('abort', (error) => {
      console.warn('\nStream aborted:', error);
    })
    .on('end', () => {
      console.log('\n\nStream ended');
    });

  // Wait for stream to complete
  const finalMessage = await stream.finalMessage();
  return finalMessage;
}

// Method 2: Manual iteration over stream events
async function streamWithManualIteration() {
  console.log('Claude:');

  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: 'Explain quantum computing in simple terms.',
      },
    ],
    stream: true,
  });

  let fullText = '';

  try {
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const text = event.delta.text;
        fullText += text;
        process.stdout.write(text);
      }

      if (event.type === 'message_stop') {
        console.log('\n\nStream complete');
      }
    }
  } catch (error) {
    console.error('\nStream error:', error);
    throw error;
  }

  return fullText;
}

// Method 3: Streaming with abort control
async function streamWithAbort() {
  console.log('Claude (can be aborted):');

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: 'Write a long essay about the history of computers.',
      },
    ],
  });

  let charCount = 0;
  const maxChars = 200; // Abort after 200 characters

  stream.on('text', (text) => {
    process.stdout.write(text);
    charCount += text.length;

    // Abort stream after reaching limit
    if (charCount >= maxChars) {
      console.log('\n\n[Aborting stream after', charCount, 'characters]');
      stream.abort();
    }
  });

  stream.on('abort', () => {
    console.log('Stream was aborted successfully');
  });

  stream.on('error', (error) => {
    console.error('Stream error:', error);
  });

  try {
    await stream.done();
  } catch (error) {
    // Handle abort error
    if (error.name === 'APIUserAbortError') {
      console.log('Stream aborted by user');
    } else {
      throw error;
    }
  }
}

// Method 4: Streaming with retry logic
async function streamWithRetry(maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const stream = anthropic.messages.stream({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: 'Tell me a fun fact about space.',
          },
        ],
      });

      let fullText = '';

      stream.on('text', (text) => {
        fullText += text;
        process.stdout.write(text);
      });

      stream.on('error', (error) => {
        console.error(`\nStream error on attempt ${attempt + 1}:`, error);
        throw error;
      });

      await stream.finalMessage();
      console.log('\n\nStream completed successfully');
      return fullText;
    } catch (error) {
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`\nRetrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('\nMax retries exceeded');
        throw error;
      }
    }
  }
}

// Run examples
if (require.main === module) {
  console.log('=== Stream with Events ===\n');
  streamWithEvents()
    .then(() => {
      console.log('\n\n=== Stream with Manual Iteration ===\n');
      return streamWithManualIteration();
    })
    .then(() => {
      console.log('\n\n=== Stream with Abort ===\n');
      return streamWithAbort();
    })
    .then(() => {
      console.log('\n\n=== Stream with Retry ===\n');
      return streamWithRetry();
    })
    .catch(console.error);
}

export { streamWithEvents, streamWithManualIteration, streamWithAbort, streamWithRetry };
