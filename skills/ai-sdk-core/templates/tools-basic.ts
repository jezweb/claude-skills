// Basic tool calling example
// AI SDK Core - Tool calling with generateText()

import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

async function main() {
  const result = await generateText({
    model: openai('gpt-4'),
    tools: {
      weather: tool({
        description: 'Get the current weather for a location',
        inputSchema: z.object({
          location: z.string().describe('City name, e.g. "San Francisco"'),
          unit: z.enum(['celsius', 'fahrenheit']).optional().describe('Temperature unit'),
        }),
        execute: async ({ location, unit = 'fahrenheit' }) => {
          // Simulate API call to weather service
          console.log(`[Tool] Fetching weather for ${location}...`);

          // In production, call real weather API here
          const mockWeather = {
            location,
            temperature: unit === 'celsius' ? 22 : 72,
            condition: 'sunny',
            humidity: 65,
            unit,
          };

          return mockWeather;
        },
      }),
      convertTemperature: tool({
        description: 'Convert temperature between Celsius and Fahrenheit',
        inputSchema: z.object({
          value: z.number(),
          from: z.enum(['celsius', 'fahrenheit']),
          to: z.enum(['celsius', 'fahrenheit']),
        }),
        execute: async ({ value, from, to }) => {
          console.log(`[Tool] Converting ${value}°${from} to ${to}...`);

          if (from === to) return { value, unit: to };

          let result: number;
          if (from === 'celsius' && to === 'fahrenheit') {
            result = (value * 9 / 5) + 32;
          } else {
            result = (value - 32) * 5 / 9;
          }

          return { value: Math.round(result * 10) / 10, unit: to };
        },
      }),
    },
    prompt: 'What is the weather in Tokyo? Please tell me in Celsius.',
    maxOutputTokens: 200,
  });

  console.log('\n--- AI Response ---');
  console.log(result.text);

  console.log('\n--- Tool Calls ---');
  console.log('Number of tool calls:', result.toolCalls?.length || 0);
  if (result.toolCalls) {
    result.toolCalls.forEach((call, i) => {
      console.log(`\n${i + 1}. ${call.toolName}`);
      console.log('   Input:', JSON.stringify(call.input));
      console.log('   Output:', JSON.stringify(call.output));
    });
  }
}

main().catch(console.error);
