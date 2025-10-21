// Agent class with multiple tools
// AI SDK Core - Agent class for multi-step execution

import { Agent, tool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

// Create agent with tools
const weatherAgent = new Agent({
  model: anthropic('claude-3-5-sonnet-20241022'),
  system: 'You are a weather assistant. Always provide temperature in the user\'s preferred unit.',
  tools: {
    getWeather: tool({
      description: 'Get current weather for a location',
      inputSchema: z.object({
        location: z.string(),
      }),
      execute: async ({ location }) => {
        console.log(`[Tool] Getting weather for ${location}...`);
        // Simulate API call
        return {
          location,
          temperature: 72,
          condition: 'sunny',
          humidity: 65,
          unit: 'fahrenheit',
        };
      },
    }),

    convertTemp: tool({
      description: 'Convert temperature between Fahrenheit and Celsius',
      inputSchema: z.object({
        fahrenheit: z.number(),
      }),
      execute: async ({ fahrenheit }) => {
        console.log(`[Tool] Converting ${fahrenheit}°F to Celsius...`);
        const celsius = Math.round(((fahrenheit - 32) * 5 / 9) * 10) / 10;
        return { celsius };
      },
    }),

    getAirQuality: tool({
      description: 'Get air quality index for a location',
      inputSchema: z.object({
        location: z.string(),
      }),
      execute: async ({ location }) => {
        console.log(`[Tool] Getting air quality for ${location}...`);
        // Simulate API call
        return {
          location,
          aqi: 42,
          level: 'good',
          pollutants: {
            pm25: 8,
            pm10: 15,
            o3: 35,
          },
        };
      },
    }),
  },
});

async function main() {
  console.log('Starting agent conversation...\n');

  const result = await weatherAgent.run({
    messages: [
      {
        role: 'user',
        content: 'What is the weather in San Francisco? Tell me in Celsius and include air quality.',
      },
    ],
  });

  console.log('\n--- Agent Response ---');
  console.log(result.text);

  console.log('\n--- Execution Summary ---');
  console.log('Total steps:', result.steps);
  console.log('Tools used:', result.toolCalls?.map(tc => tc.toolName).join(', ') || 'none');
}

main().catch(console.error);
