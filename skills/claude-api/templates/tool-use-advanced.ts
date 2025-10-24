import Anthropic from '@anthropic-ai/sdk';
import { betaZodTool } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Example 1: Using Zod schemas with betaZodTool
const weatherTool = betaZodTool({
  name: 'get_weather',
  inputSchema: z.object({
    location: z.string().describe('The city and state, e.g. San Francisco, CA'),
    unit: z.enum(['celsius', 'fahrenheit']).optional().describe('Temperature unit'),
  }),
  description: 'Get the current weather in a given location',
  run: async (input) => {
    // Mock implementation - replace with actual API call
    console.log(`Fetching weather for ${input.location}...`);
    const temp = input.unit === 'celsius' ? 22 : 72;
    return `The weather in ${input.location} is sunny and ${temp}°${input.unit || 'F'}`;
  },
});

const searchTool = betaZodTool({
  name: 'search_web',
  inputSchema: z.object({
    query: z.string().describe('The search query'),
    max_results: z.number().int().min(1).max(10).optional().describe('Maximum number of results'),
  }),
  description: 'Search the web for information',
  run: async (input) => {
    console.log(`Searching for: ${input.query}...`);
    // Mock implementation
    return `Found ${input.max_results || 5} results for "${input.query}":
1. Example result 1
2. Example result 2
3. Example result 3`;
  },
});

const calculatorTool = betaZodTool({
  name: 'calculate',
  inputSchema: z.object({
    expression: z.string().describe('Mathematical expression to evaluate'),
  }),
  description: 'Evaluate a mathematical expression',
  run: async (input) => {
    try {
      // WARNING: eval is dangerous - this is just for demonstration
      // In production, use a safe math parser like math.js
      const result = eval(input.expression);
      return `${input.expression} = ${result}`;
    } catch (error) {
      throw new Error(`Invalid expression: ${input.expression}`);
    }
  },
});

// Example 2: Using toolRunner for automatic execution
async function automaticToolExecution() {
  const finalMessage = await anthropic.beta.messages.toolRunner({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: 'What is the weather in Tokyo? Also, search for "best sushi restaurants in Tokyo"',
      },
    ],
    tools: [weatherTool, searchTool],
  });

  console.log('\nFinal response:');
  for (const block of finalMessage.content) {
    if (block.type === 'text') {
      console.log(block.text);
    }
  }

  return finalMessage;
}

// Example 3: Streaming with tools
async function streamingWithTools() {
  const runner = anthropic.beta.messages.toolRunner({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: 'Calculate 123 * 456, then tell me about the result',
      },
    ],
    tools: [calculatorTool],
    stream: true,
  });

  console.log('Streaming response:');

  // Iterate through messages as they arrive
  for await (const messageStream of runner) {
    // Each message can have multiple events
    for await (const event of messageStream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        process.stdout.write(event.delta.text);
      }
    }

    console.log('\n\nMessage completed');
  }

  // Get final result
  const result = await runner;
  console.log('\nFinal result:', result);
}

// Example 4: Complex tool chain
const databaseTool = betaZodTool({
  name: 'query_database',
  inputSchema: z.object({
    query: z.string().describe('SQL query to execute'),
  }),
  description: 'Query the database',
  run: async (input) => {
    console.log(`Executing SQL: ${input.query}`);
    // Mock database response
    return JSON.stringify([
      { id: 1, name: 'Product A', price: 29.99 },
      { id: 2, name: 'Product B', price: 49.99 },
    ]);
  },
});

const emailTool = betaZodTool({
  name: 'send_email',
  inputSchema: z.object({
    to: z.string().email().describe('Recipient email address'),
    subject: z.string().describe('Email subject'),
    body: z.string().describe('Email body'),
  }),
  description: 'Send an email',
  run: async (input) => {
    console.log(`Sending email to ${input.to}...`);
    // Mock email sending
    return `Email sent successfully to ${input.to}`;
  },
});

async function complexToolChain() {
  const finalMessage = await anthropic.beta.messages.toolRunner({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content:
          'Query the database for all products, calculate their average price, and send me an email with the results to test@example.com',
      },
    ],
    tools: [databaseTool, calculatorTool, emailTool],
  });

  console.log('\nTool chain completed');
  for (const block of finalMessage.content) {
    if (block.type === 'text') {
      console.log(block.text);
    }
  }
}

// Example 5: Tool with max iterations limit
async function toolsWithMaxIterations() {
  try {
    const finalMessage = await anthropic.beta.messages.toolRunner({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1000,
      max_iterations: 3, // Limit tool execution loops
      messages: [
        {
          role: 'user',
          content: 'Search for "quantum computing" and then search for each result',
        },
      ],
      tools: [searchTool],
    });

    console.log('Completed with max_iterations limit');
    for (const block of finalMessage.content) {
      if (block.type === 'text') {
        console.log(block.text);
      }
    }
  } catch (error) {
    console.error('Max iterations reached or error occurred:', error);
  }
}

// Example 6: Custom tool runner with manual control
async function manualToolRunner() {
  const runner = anthropic.beta.messages.toolRunner({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: 'What is 15 * 27?',
      },
    ],
    tools: [calculatorTool],
  });

  // Manually iterate through messages
  for await (const message of runner) {
    console.log('\nReceived message');
    console.log('Stop reason:', message.stop_reason);

    // Generate tool response if needed
    const toolResponse = await runner.generateToolResponse();
    if (toolResponse) {
      console.log('Tool results:', toolResponse.content);
    }

    // Can inspect and modify the conversation here
    console.log('Current params:', runner.params);
  }

  // Wait for completion
  const finalMessage = await runner.done();
  console.log('\nFinal message:', finalMessage);
}

// Example 7: Error recovery in tools
const unreliableTool = betaZodTool({
  name: 'unreliable_api',
  inputSchema: z.object({
    data: z.string(),
  }),
  description: 'An API that sometimes fails',
  run: async (input) => {
    // Randomly fail to demonstrate error handling
    if (Math.random() < 0.3) {
      throw new Error('API temporarily unavailable');
    }
    return `Processed: ${input.data}`;
  },
});

async function toolWithErrorRecovery() {
  try {
    const finalMessage = await anthropic.beta.messages.toolRunner({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: 'Process this data with the unreliable API: "test data"',
        },
      ],
      tools: [unreliableTool],
    });

    console.log('Success:', finalMessage.content);
  } catch (error) {
    console.error('Tool execution failed:', error);
    // Implement retry logic or fallback
  }
}

// Run examples
if (require.main === module) {
  console.log('=== Automatic Tool Execution ===\n');
  automaticToolExecution()
    .then(() => {
      console.log('\n\n=== Streaming with Tools ===\n');
      return streamingWithTools();
    })
    .then(() => {
      console.log('\n\n=== Complex Tool Chain ===\n');
      return complexToolChain();
    })
    .then(() => {
      console.log('\n\n=== Manual Tool Runner ===\n');
      return manualToolRunner();
    })
    .catch(console.error);
}

export {
  automaticToolExecution,
  streamingWithTools,
  complexToolChain,
  toolsWithMaxIterations,
  manualToolRunner,
  toolWithErrorRecovery,
};
