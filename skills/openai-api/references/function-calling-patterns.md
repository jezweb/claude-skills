# Function Calling Patterns

**Last Updated**: 2025-10-25

Advanced patterns for implementing function calling (tool calling) with OpenAI's Chat Completions API.

---

## Basic Pattern

```typescript
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
        },
        required: ['location'],
      },
    },
  },
];
```

---

## Advanced Patterns

### 1. Parallel Tool Calls

The model can call multiple tools simultaneously:

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [
    { role: 'user', content: 'What is the weather in SF and NYC?' }
  ],
  tools: tools,
});

// Model may return multiple tool_calls
const toolCalls = completion.choices[0].message.tool_calls;

// Execute all in parallel
const results = await Promise.all(
  toolCalls.map(call => executeFunction(call.function.name, call.function.arguments))
);
```

### 2. Dynamic Tool Generation

Generate tools based on runtime context:

```typescript
function generateTools(database: Database) {
  const tables = database.getTables();

  return tables.map(table => ({
    type: 'function',
    function: {
      name: `query_${table.name}`,
      description: `Query the ${table.name} table`,
      parameters: {
        type: 'object',
        properties: table.columns.reduce((acc, col) => ({
          ...acc,
          [col.name]: { type: col.type, description: col.description },
        }), {}),
      },
    },
  }));
}
```

### 3. Tool Chaining

Chain tool results:

```typescript
async function chatWithToolChaining(userMessage: string) {
  let messages = [{ role: 'user', content: userMessage }];

  while (true) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5',
      messages,
      tools,
    });

    const message = completion.choices[0].message;
    messages.push(message);

    if (!message.tool_calls) {
      return message.content; // Final answer
    }

    // Execute tool calls and add results
    for (const toolCall of message.tool_calls) {
      const result = await executeFunction(
        toolCall.function.name,
        toolCall.function.arguments
      );

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }
}
```

### 4. Error Handling in Tools

```typescript
async function executeFunction(name: string, argsString: string) {
  try {
    const args = JSON.parse(argsString);

    switch (name) {
      case 'get_weather':
        return await getWeather(args.location, args.unit);

      default:
        return { error: `Unknown function: ${name}` };
    }
  } catch (error: any) {
    return { error: error.message };
  }
}
```

### 5. Streaming with Tools

```typescript
const stream = await openai.chat.completions.create({
  model: 'gpt-5',
  messages,
  tools,
  stream: true,
});

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta;

  // Check for tool calls in streaming
  if (delta?.tool_calls) {
    // Accumulate tool call data
    console.log('Tool call chunk:', delta.tool_calls);
  }
}
```

---

## Best Practices

✅ **Schema Design**:
- Provide clear descriptions for each parameter
- Use enum when options are limited
- Mark required vs optional parameters

✅ **Error Handling**:
- Return structured error objects
- Don't throw exceptions from tool functions
- Let the model handle error recovery

✅ **Performance**:
- Execute independent tool calls in parallel
- Cache tool results when appropriate
- Limit recursion depth to avoid infinite loops

❌ **Don't**:
- Expose sensitive internal functions
- Allow unlimited recursion
- Skip parameter validation
- Return unstructured error messages

---

**See Also**: Official Function Calling Guide (https://platform.openai.com/docs/guides/function-calling)
