# Tool Use Patterns

Common patterns for using tools (function calling) with Claude API.

## Basic Pattern

```typescript
const tools = [{
  name: 'get_weather',
  description: 'Get current weather',
  input_schema: {
    type: 'object',
    properties: {
      location: { type: 'string' }
    },
    required: ['location']
  }
}];

// 1. Send request with tools
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  tools,
  messages: [{ role: 'user', content: 'Weather in NYC?' }]
});

// 2. Check if Claude wants to use tools
if (response.stop_reason === 'tool_use') {
  for (const block of response.content) {
    if (block.type === 'tool_use') {
      // 3. Execute tool
      const result = await executeToolFunction(block.name, block.input);

      // 4. Return result
      const toolResult = {
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result)
      };
    }
  }
}
```

## Tool Execution Loop

```typescript
async function chatWithTools(userMessage) {
  const messages = [{ role: 'user', content: userMessage }];

  while (true) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      tools,
      messages,
    });

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'tool_use') {
      // Execute tools and continue
      const toolResults = await executeAllTools(response.content);
      messages.push({ role: 'user', content: toolResults });
    } else {
      // Final response
      return response.content.find(b => b.type === 'text')?.text;
    }
  }
}
```

## With Zod Validation

```typescript
import { betaZodTool } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

const weatherTool = betaZodTool({
  name: 'get_weather',
  inputSchema: z.object({
    location: z.string(),
    unit: z.enum(['celsius', 'fahrenheit']).optional(),
  }),
  description: 'Get weather',
  run: async (input) => {
    return `Weather in ${input.location}: 72°F`;
  },
});

// Automatic execution
const finalMessage = await anthropic.beta.messages.toolRunner({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1000,
  messages: [{ role: 'user', content: 'Weather in SF?' }],
  tools: [weatherTool],
});
```

## Error Handling in Tools

```typescript
{
  type: 'tool_result',
  tool_use_id: block.id,
  content: 'Error: API unavailable',
  is_error: true  // Mark as error
}
```

## Official Docs

https://docs.claude.com/en/docs/build-with-claude/tool-use
