import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Define tools
const tools: Anthropic.Tool[] = [
  {
    name: 'get_weather',
    description: 'Get the current weather in a given location',
    input_schema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city and state, e.g. San Francisco, CA',
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'The unit of temperature, either "celsius" or "fahrenheit"',
        },
      },
      required: ['location'],
    },
  },
  {
    name: 'get_time',
    description: 'Get the current time in a given timezone',
    input_schema: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'The IANA timezone name, e.g. America/Los_Angeles',
        },
      },
      required: ['timezone'],
    },
  },
];

// Mock tool implementations
function executeWeatherTool(location: string, unit?: string): string {
  // In production, call actual weather API
  const temp = unit === 'celsius' ? 22 : 72;
  return `The weather in ${location} is sunny and ${temp}°${unit === 'celsius' ? 'C' : 'F'}`;
}

function executeTimeTool(timezone: string): string {
  // In production, get actual time for timezone
  const time = new Date().toLocaleTimeString('en-US', { timeZone: timezone });
  return `The current time in ${timezone} is ${time}`;
}

// Example 1: Basic tool use detection
async function basicToolUse() {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    tools,
    messages: [
      {
        role: 'user',
        content: 'What is the weather like in San Francisco?',
      },
    ],
  });

  console.log('Stop reason:', message.stop_reason);

  if (message.stop_reason === 'tool_use') {
    console.log('\nClaude wants to use tools:');

    for (const block of message.content) {
      if (block.type === 'tool_use') {
        console.log(`- Tool: ${block.name}`);
        console.log(`  ID: ${block.id}`);
        console.log(`  Input:`, block.input);
      }
    }
  }

  return message;
}

// Example 2: Tool execution loop
async function toolExecutionLoop(userMessage: string) {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ];

  while (true) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      tools,
      messages,
    });

    console.log('\nStop reason:', response.stop_reason);

    // Add assistant response to messages
    messages.push({
      role: 'assistant',
      content: response.content,
    });

    // Check if Claude wants to use tools
    if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      // Execute each tool
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          console.log(`\nExecuting tool: ${block.name}`);
          console.log('Input:', block.input);

          let result: string;

          // Execute the appropriate tool
          if (block.name === 'get_weather') {
            result = executeWeatherTool(
              block.input.location as string,
              block.input.unit as string | undefined
            );
          } else if (block.name === 'get_time') {
            result = executeTimeTool(block.input.timezone as string);
          } else {
            result = `Unknown tool: ${block.name}`;
          }

          console.log('Result:', result);

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      // Add tool results to messages
      messages.push({
        role: 'user',
        content: toolResults,
      });
    } else {
      // Final response - no more tools needed
      const textBlock = response.content.find(block => block.type === 'text');
      if (textBlock && textBlock.type === 'text') {
        console.log('\nFinal response:', textBlock.text);
        return textBlock.text;
      }
      break;
    }
  }
}

// Example 3: Multiple tools in one turn
async function multipleToolsInOneTurn() {
  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: 'What is the weather in New York and what time is it in Tokyo?',
    },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    tools,
    messages,
  });

  console.log('Claude requested', response.content.filter(b => b.type === 'tool_use').length, 'tools');

  if (response.stop_reason === 'tool_use') {
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type === 'tool_use') {
        console.log(`\n- ${block.name}:`, block.input);

        let result: string;
        if (block.name === 'get_weather') {
          result = executeWeatherTool(block.input.location as string);
        } else if (block.name === 'get_time') {
          result = executeTimeTool(block.input.timezone as string);
        } else {
          result = 'Unknown tool';
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result,
        });
      }
    }

    // Continue conversation with tool results
    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });

    const finalResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      tools,
      messages,
    });

    const textBlock = finalResponse.content.find(b => b.type === 'text');
    if (textBlock && textBlock.type === 'text') {
      console.log('\nFinal answer:', textBlock.text);
    }
  }
}

// Example 4: Error handling in tool execution
async function toolExecutionWithErrorHandling(userMessage: string) {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      tools,
      messages,
    });

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === 'tool_use') {
          try {
            let result: string;

            if (block.name === 'get_weather') {
              result = executeWeatherTool(block.input.location as string);
            } else if (block.name === 'get_time') {
              result = executeTimeTool(block.input.timezone as string);
            } else {
              throw new Error(`Unknown tool: ${block.name}`);
            }

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: result,
            });
          } catch (error) {
            // Return error to Claude
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Error executing tool: ${error.message}`,
              is_error: true,
            });
          }
        }
      }

      messages.push({ role: 'user', content: toolResults });

      // Get final response
      const finalResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        tools,
        messages,
      });

      const textBlock = finalResponse.content.find(b => b.type === 'text');
      if (textBlock && textBlock.type === 'text') {
        console.log('Final response:', textBlock.text);
      }
    }
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}

// Run examples
if (require.main === module) {
  console.log('=== Basic Tool Use ===\n');
  basicToolUse()
    .then(() => {
      console.log('\n\n=== Tool Execution Loop ===\n');
      return toolExecutionLoop('What is the weather in London and what time is it there?');
    })
    .then(() => {
      console.log('\n\n=== Multiple Tools ===\n');
      return multipleToolsInOneTurn();
    })
    .then(() => {
      console.log('\n\n=== Error Handling ===\n');
      return toolExecutionWithErrorHandling('What is the weather in Mars?');
    })
    .catch(console.error);
}

export { basicToolUse, toolExecutionLoop, multipleToolsInOneTurn, toolExecutionWithErrorHandling };
