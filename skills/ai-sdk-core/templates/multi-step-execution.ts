// Multi-step execution with stopWhen conditions
// AI SDK Core - Control multi-step workflows

import { generateText, tool, stopWhen, stepCountIs, hasToolCall } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

async function example1_stepCount() {
  console.log('=== Example 1: Stop after N steps ===\n');

  const result = await generateText({
    model: openai('gpt-4'),
    tools: {
      research: tool({
        description: 'Research a topic',
        inputSchema: z.object({ topic: z.string() }),
        execute: async ({ topic }) => {
          console.log(`[Tool] Researching ${topic}...`);
          return { info: `Research data about ${topic}` };
        },
      }),
      analyze: tool({
        description: 'Analyze research data',
        inputSchema: z.object({ data: z.string() }),
        execute: async ({ data }) => {
          console.log(`[Tool] Analyzing data...`);
          return { analysis: `Analysis of ${data}` };
        },
      }),
    },
    prompt: 'Research TypeScript and analyze the findings.',
    stopWhen: stepCountIs(3), // Stop after 3 steps
  });

  console.log('\nResult:', result.text);
  console.log('Steps taken:', result.steps);
}

async function example2_specificTool() {
  console.log('\n=== Example 2: Stop when specific tool called ===\n');

  const result = await generateText({
    model: openai('gpt-4'),
    tools: {
      search: tool({
        description: 'Search for information',
        inputSchema: z.object({ query: z.string() }),
        execute: async ({ query }) => {
          console.log(`[Tool] Searching for: ${query}`);
          return { results: `Search results for ${query}` };
        },
      }),
      summarize: tool({
        description: 'Create final summary',
        inputSchema: z.object({ content: z.string() }),
        execute: async ({ content }) => {
          console.log(`[Tool] Creating summary...`);
          return { summary: `Summary of ${content}` };
        },
      }),
    },
    prompt: 'Search for information about AI and create a summary.',
    stopWhen: hasToolCall('summarize'), // Stop when summarize is called
  });

  console.log('\nResult:', result.text);
  console.log('Final tool called:', result.toolCalls?.[result.toolCalls.length - 1]?.toolName);
}

async function example3_customCondition() {
  console.log('\n=== Example 3: Custom stop condition ===\n');

  const result = await generateText({
    model: openai('gpt-4'),
    tools: {
      calculate: tool({
        description: 'Perform calculation',
        inputSchema: z.object({ expression: z.string() }),
        execute: async ({ expression }) => {
          console.log(`[Tool] Calculating: ${expression}`);
          return { result: 42 };
        },
      }),
      finish: tool({
        description: 'Mark task as complete',
        inputSchema: z.object({ status: z.string() }),
        execute: async ({ status }) => {
          console.log(`[Tool] Finishing with status: ${status}`);
          return { done: true };
        },
      }),
    },
    prompt: 'Solve a math problem and finish.',
    stopWhen: (step) => {
      // Stop if:
      // - More than 5 steps, OR
      // - 'finish' tool was called
      return step.stepCount > 5 || step.hasToolCall('finish');
    },
  });

  console.log('\nResult:', result.text);
  console.log('Stopped at step:', result.steps);
}

async function main() {
  await example1_stepCount();
  await example2_specificTool();
  await example3_customCondition();
}

main().catch(console.error);
