/**
 * Function Calling Assistant
 *
 * Demonstrates:
 * - Defining custom functions
 * - Handling requires_action state
 * - Submitting tool outputs
 * - Multiple function calls
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mock weather API
async function getWeather(location: string, unit: 'celsius' | 'fahrenheit' = 'celsius') {
  // In production, call a real weather API
  const temps = { celsius: 22, fahrenheit: 72 };
  return {
    location,
    temperature: temps[unit],
    unit,
    conditions: "Partly cloudy",
    humidity: 65,
  };
}

// Mock stock price API
async function getStockPrice(symbol: string) {
  // In production, call a real stock API
  const prices: Record<string, number> = {
    AAPL: 185.50,
    GOOGL: 142.75,
    MSFT: 420.30,
  };

  return {
    symbol,
    price: prices[symbol] || 100.00,
    currency: 'USD',
    timestamp: new Date().toISOString(),
  };
}

async function main() {
  console.log('🛠️  Creating Function Calling Assistant...\n');

  // 1. Create assistant with functions
  const assistant = await openai.beta.assistants.create({
    name: "Multi-Tool Assistant",
    instructions: "You are a helpful assistant that can check weather and stock prices. Use the available functions to answer user questions.",
    tools: [
      {
        type: "function",
        function: {
          name: "get_weather",
          description: "Get the current weather for a location",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The city name, e.g., 'San Francisco'",
              },
              unit: {
                type: "string",
                enum: ["celsius", "fahrenheit"],
                description: "Temperature unit",
              },
            },
            required: ["location"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_stock_price",
          description: "Get the current stock price for a symbol",
          parameters: {
            type: "object",
            properties: {
              symbol: {
                type: "string",
                description: "Stock symbol, e.g., 'AAPL' for Apple",
              },
            },
            required: ["symbol"],
          },
        },
      },
    ],
    model: "gpt-4o",
  });

  console.log(`✅ Assistant created: ${assistant.id}\n`);

  // 2. Create thread
  const thread = await openai.beta.threads.create({
    messages: [{
      role: "user",
      content: "What's the weather in London and what's Apple's stock price?",
    }],
  });

  console.log(`✅ Thread created: ${thread.id}\n`);
  console.log('❓ User: What\'s the weather in London and what\'s Apple\'s stock price?\n');

  // 3. Create run
  let run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistant.id,
  });

  console.log('🏃 Running assistant...\n');

  // 4. Poll and handle function calls
  while (true) {
    run = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    console.log(`   Status: ${run.status}`);

    if (run.status === 'completed') {
      break;
    }

    if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
      console.error(`❌ Run ${run.status}:`, run.last_error);
      process.exit(1);
    }

    if (run.status === 'requires_action') {
      console.log('\n🔧 Function calls required:\n');

      const toolCalls = run.required_action!.submit_tool_outputs.tool_calls;
      const toolOutputs = [];

      for (const toolCall of toolCalls) {
        console.log(`   Function: ${toolCall.function.name}`);
        console.log(`   Arguments: ${toolCall.function.arguments}`);

        const args = JSON.parse(toolCall.function.arguments);
        let output;

        // Execute the function
        if (toolCall.function.name === 'get_weather') {
          output = await getWeather(args.location, args.unit);
          console.log(`   Result: ${output.temperature}°${output.unit === 'celsius' ? 'C' : 'F'}, ${output.conditions}`);
        } else if (toolCall.function.name === 'get_stock_price') {
          output = await getStockPrice(args.symbol);
          console.log(`   Result: $${output.price}`);
        }

        toolOutputs.push({
          tool_call_id: toolCall.id,
          output: JSON.stringify(output),
        });

        console.log('');
      }

      // Submit tool outputs
      console.log('📤 Submitting tool outputs...\n');
      run = await openai.beta.threads.runs.submitToolOutputs(
        thread.id,
        run.id,
        { tool_outputs: toolOutputs }
      );
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n✅ Run completed!\n');

  // 5. Retrieve final response
  const messages = await openai.beta.threads.messages.list(thread.id);
  const response = messages.data[0];

  console.log('💬 Assistant Response:\n');
  for (const content of response.content) {
    if (content.type === 'text') {
      console.log(content.text.value);
    }
  }

  // Ask another question
  console.log('\n---\n');
  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: "How about Microsoft's stock?",
  });

  console.log('❓ User: How about Microsoft\'s stock?\n');

  run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistant.id,
  });

  // Handle function calls again
  while (true) {
    run = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    if (run.status === 'completed') {
      break;
    }

    if (run.status === 'requires_action') {
      const toolCalls = run.required_action!.submit_tool_outputs.tool_calls;
      const toolOutputs = [];

      for (const toolCall of toolCalls) {
        const args = JSON.parse(toolCall.function.arguments);

        if (toolCall.function.name === 'get_stock_price') {
          const output = await getStockPrice(args.symbol);
          console.log(`   🔧 Called get_stock_price(${args.symbol}): $${output.price}`);
          toolOutputs.push({
            tool_call_id: toolCall.id,
            output: JSON.stringify(output),
          });
        }
      }

      run = await openai.beta.threads.runs.submitToolOutputs(
        thread.id,
        run.id,
        { tool_outputs: toolOutputs }
      );
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const messages2 = await openai.beta.threads.messages.list(thread.id);
  const response2 = messages2.data[0];

  console.log('\n💬 Assistant Response:\n');
  for (const content of response2.content) {
    if (content.type === 'text') {
      console.log(content.text.value);
    }
  }
}

main().catch(console.error);
