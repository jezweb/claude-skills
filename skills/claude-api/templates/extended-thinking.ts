import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * IMPORTANT: Extended thinking is ONLY available in:
 * - Claude 3.7 Sonnet (claude-3-7-sonnet-20250228)
 * - Claude 4 models (Opus 4, Sonnet 4)
 *
 * NOT available in Claude 3.5 Sonnet
 */

// Example 1: Basic extended thinking
async function basicExtendedThinking() {
  const message = await anthropic.messages.create({
    model: 'claude-3-7-sonnet-20250228', // Must use 3.7 or 4.x
    max_tokens: 4096, // Higher token limit for thinking
    messages: [
      {
        role: 'user',
        content: `A ball is thrown upward with an initial velocity of 20 m/s.
        How high does it go? (Use g = 9.8 m/s²)`,
      },
    ],
  });

  console.log('=== Response with Extended Thinking ===\n');

  // Display thinking blocks separately from answer
  for (const block of message.content) {
    if (block.type === 'thinking') {
      console.log('🤔 Claude is thinking:');
      console.log(block.text);
      console.log('\n' + '='.repeat(50) + '\n');
    } else if (block.type === 'text') {
      console.log('💡 Final Answer:');
      console.log(block.text);
    }
  }

  console.log('\nStop reason:', message.stop_reason);
  console.log('Token usage:', message.usage);
}

// Example 2: Complex problem solving
async function complexProblemSolving() {
  const message = await anthropic.messages.create({
    model: 'claude-3-7-sonnet-20250228',
    max_tokens: 8192, // Even higher for complex reasoning
    messages: [
      {
        role: 'user',
        content: `Debug this Python code and explain what's wrong:

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-1)

print(fibonacci(10))

Why is it slow and what's the correct implementation?`,
      },
    ],
  });

  for (const block of message.content) {
    if (block.type === 'thinking') {
      console.log('🔍 Debugging process:');
      console.log(block.text);
      console.log();
    } else if (block.type === 'text') {
      console.log('✅ Solution:');
      console.log(block.text);
    }
  }
}

// Example 3: Multi-step reasoning
async function multiStepReasoning() {
  const message = await anthropic.messages.create({
    model: 'claude-3-7-sonnet-20250228',
    max_tokens: 6144,
    messages: [
      {
        role: 'user',
        content: `I have a 10-liter jug and a 6-liter jug. How can I measure exactly 8 liters of water?
        Think through this step by step.`,
      },
    ],
  });

  for (const block of message.content) {
    if (block.type === 'thinking') {
      console.log('🧠 Reasoning steps:');
      console.log(block.text);
      console.log();
    } else if (block.type === 'text') {
      console.log('📝 Final solution:');
      console.log(block.text);
    }
  }
}

// Example 4: Comparing with and without extended thinking
async function compareThinkingModes() {
  const problem = 'What is the sum of all prime numbers less than 100?';

  // Without extended thinking (Claude 3.5 Sonnet)
  console.log('=== Without Extended Thinking (Claude 3.5 Sonnet) ===\n');

  const response1 = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    messages: [{ role: 'user', content: problem }],
  });

  const text1 = response1.content.find(b => b.type === 'text');
  if (text1 && text1.type === 'text') {
    console.log(text1.text);
  }
  console.log('\nTokens used:', response1.usage.input_tokens + response1.usage.output_tokens);

  // With extended thinking (Claude 3.7 Sonnet)
  console.log('\n\n=== With Extended Thinking (Claude 3.7 Sonnet) ===\n');

  const response2 = await anthropic.messages.create({
    model: 'claude-3-7-sonnet-20250228',
    max_tokens: 4096,
    messages: [{ role: 'user', content: problem }],
  });

  for (const block of response2.content) {
    if (block.type === 'thinking') {
      console.log('🤔 Thinking process:');
      console.log(block.text);
      console.log();
    } else if (block.type === 'text') {
      console.log('💡 Answer:');
      console.log(block.text);
    }
  }
  console.log('\nTokens used:', response2.usage.input_tokens + response2.usage.output_tokens);
}

// Example 5: Extended thinking with tools
async function extendedThinkingWithTools() {
  const tools: Anthropic.Tool[] = [
    {
      name: 'calculate',
      description: 'Perform mathematical calculations',
      input_schema: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'Mathematical expression to evaluate',
          },
        },
        required: ['expression'],
      },
    },
  ];

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content:
        'Calculate the compound interest on $1000 invested at 5% annual interest for 10 years, compounded monthly',
    },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-3-7-sonnet-20250228',
    max_tokens: 4096,
    tools,
    messages,
  });

  console.log('=== Extended Thinking with Tools ===\n');

  for (const block of response.content) {
    if (block.type === 'thinking') {
      console.log('🤔 Planning:');
      console.log(block.text);
      console.log();
    } else if (block.type === 'tool_use') {
      console.log('🔧 Tool use:', block.name);
      console.log('Parameters:', block.input);
      console.log();
    } else if (block.type === 'text') {
      console.log('💡 Response:');
      console.log(block.text);
    }
  }
}

// Example 6: Error when using wrong model
async function demonstrateWrongModelError() {
  try {
    console.log('=== Attempting extended thinking on Claude 3.5 Sonnet ===\n');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929', // Wrong model!
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: 'Solve this complex math problem step by step',
        },
      ],
    });

    // No thinking blocks will be present
    const hasThinking = message.content.some(block => block.type === 'thinking');

    if (!hasThinking) {
      console.log('⚠️ No thinking blocks found!');
      console.log('Extended thinking is only available in Claude 3.7 Sonnet or Claude 4 models.');
    }

    for (const block of message.content) {
      if (block.type === 'text') {
        console.log('Regular response:', block.text);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 7: Check model capabilities
function getModelCapabilities(modelId: string): {
  supportsExtendedThinking: boolean;
  contextWindow: number;
} {
  const models: Record<
    string,
    { supportsExtendedThinking: boolean; contextWindow: number }
  > = {
    'claude-sonnet-4-5-20250929': {
      supportsExtendedThinking: false,
      contextWindow: 200_000,
    },
    'claude-3-7-sonnet-20250228': {
      supportsExtendedThinking: true,
      contextWindow: 2_000_000,
    },
    'claude-opus-4-20250514': {
      supportsExtendedThinking: true,
      contextWindow: 200_000,
    },
    'claude-3-5-haiku-20241022': {
      supportsExtendedThinking: false,
      contextWindow: 200_000,
    },
  };

  return (
    models[modelId] || {
      supportsExtendedThinking: false,
      contextWindow: 200_000,
    }
  );
}

// Helper: Validate model for extended thinking
function validateModelForExtendedThinking(modelId: string): void {
  const capabilities = getModelCapabilities(modelId);

  if (!capabilities.supportsExtendedThinking) {
    throw new Error(
      `Model ${modelId} does not support extended thinking. Use Claude 3.7 Sonnet or Claude 4 models.`
    );
  }

  console.log(`✅ Model ${modelId} supports extended thinking`);
  console.log(`Context window: ${capabilities.contextWindow.toLocaleString()} tokens`);
}

// Run examples
if (require.main === module) {
  console.log('=== Extended Thinking Examples ===\n');

  // Validate model first
  try {
    validateModelForExtendedThinking('claude-3-7-sonnet-20250228');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  basicExtendedThinking()
    .then(() => {
      console.log('\n\n=== Complex Problem ===\n');
      return complexProblemSolving();
    })
    .then(() => {
      console.log('\n\n=== Multi-step Reasoning ===\n');
      return multiStepReasoning();
    })
    .then(() => {
      console.log('\n\n=== Wrong Model Demo ===\n');
      return demonstrateWrongModelError();
    })
    .catch(console.error);
}

export {
  basicExtendedThinking,
  complexProblemSolving,
  multiStepReasoning,
  compareThinkingModes,
  extendedThinkingWithTools,
  demonstrateWrongModelError,
  getModelCapabilities,
  validateModelForExtendedThinking,
};
