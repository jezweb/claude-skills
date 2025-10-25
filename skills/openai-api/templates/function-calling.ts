// Function Calling (Tool Use) with GPT-5
// Complete example showing tool definition, execution, and multi-turn flow

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define available tools/functions
const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city name, e.g., San Francisco'
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'Temperature unit'
          }
        },
        required: ['location']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_web',
      description: 'Search the web for information',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query'
          }
        },
        required: ['query']
      }
    }
  }
];

// Implement the actual functions
async function getWeather(location: string, unit: string = 'fahrenheit'): Promise<string> {
  // In production, call a real weather API
  return JSON.stringify({
    location,
    temperature: 72,
    unit,
    condition: 'sunny',
    forecast: 'Clear skies throughout the day'
  });
}

async function searchWeb(query: string): Promise<string> {
  // In production, call a real search API
  return JSON.stringify({
    query,
    results: [
      { title: 'Example Result 1', snippet: 'This is a sample search result...' },
      { title: 'Example Result 2', snippet: 'Another sample result...' }
    ]
  });
}

// Execute function based on name
async function executeFunction(name: string, argumentsJson: string): Promise<string> {
  const args = JSON.parse(argumentsJson);

  switch (name) {
    case 'get_weather':
      return await getWeather(args.location, args.unit);
    case 'search_web':
      return await searchWeb(args.query);
    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

async function chatWithTools(userMessage: string) {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'user',
      content: userMessage
    }
  ];

  console.log('User:', userMessage);

  // Keep looping until model doesn't call any tools
  while (true) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: messages,
      tools: tools,
    });

    const message = completion.choices[0].message;
    messages.push(message);

    // If no tool calls, we're done
    if (!message.tool_calls) {
      console.log('Assistant:', message.content);
      return message.content;
    }

    // Execute all tool calls
    console.log(`\nCalling ${message.tool_calls.length} tool(s)...`);

    for (const toolCall of message.tool_calls) {
      console.log(`- ${toolCall.function.name}(${toolCall.function.arguments})`);

      const result = await executeFunction(
        toolCall.function.name,
        toolCall.function.arguments
      );

      console.log(`  Result: ${result}`);

      // Add tool result to conversation
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result
      });
    }

    console.log('\nModel processing tool results...\n');
  }
}

// Example usage
async function main() {
  await chatWithTools('What is the weather in San Francisco in celsius?');

  console.log('\n---\n');

  await chatWithTools('Search for the latest TypeScript features');
}

main();
