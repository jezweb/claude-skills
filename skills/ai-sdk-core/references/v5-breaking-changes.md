# AI SDK v4 → v5 Migration Guide

Complete guide to breaking changes from AI SDK v4 to v5.

---

## Overview

AI SDK v5 introduced **extensive breaking changes** to improve consistency, type safety, and functionality. This guide covers all critical changes with before/after examples.

**Migration Effort:** Medium-High (2-8 hours depending on codebase size)

**Automated Migration Available:**
```bash
npx ai migrate
```

---

## Core API Changes

### 1. Parameter Renames

**Change:** `maxTokens` → `maxOutputTokens`, `providerMetadata` → `providerOptions`

**Before (v4):**
```typescript
const result = await generateText({
  model: openai.chat('gpt-4'),
  maxTokens: 500,
  providerMetadata: {
    openai: { user: 'user-123' }
  },
  prompt: 'Hello',
});
```

**After (v5):**
```typescript
const result = await generateText({
  model: openai('gpt-4'),
  maxOutputTokens: 500,
  providerOptions: {
    openai: { user: 'user-123' }
  },
  prompt: 'Hello',
});
```

**Why:** `maxOutputTokens` is clearer that it limits generated tokens, not prompt tokens. `providerOptions` better reflects that it's for provider-specific configuration.

---

### 2. Tool Definitions

**Change:** `parameters` → `inputSchema`, tool properties renamed

**Before (v4):**
```typescript
const tools = {
  weather: {
    description: 'Get weather',
    parameters: z.object({
      location: z.string(),
    }),
    execute: async (args) => {
      return { temp: 72, location: args.location };
    },
  },
};

// In tool call result:
console.log(toolCall.args);    // { location: "SF" }
console.log(toolCall.result);  // { temp: 72 }
```

**After (v5):**
```typescript
import { tool } from 'ai';

const tools = {
  weather: tool({
    description: 'Get weather',
    inputSchema: z.object({
      location: z.string(),
    }),
    execute: async ({ location }) => {
      return { temp: 72, location };
    },
  }),
};

// In tool call result:
console.log(toolCall.input);   // { location: "SF" }
console.log(toolCall.output);  // { temp: 72 }
```

**Why:** `inputSchema` clarifies it's a Zod schema. `input`/`output` are clearer than `args`/`result`.

---

### 3. Message Types

**Change:** `CoreMessage` → `ModelMessage`, `Message` → `UIMessage`

**Before (v4):**
```typescript
import { CoreMessage, convertToCoreMessages } from 'ai';

const messages: CoreMessage[] = [
  { role: 'user', content: 'Hello' },
];

const converted = convertToCoreMessages(uiMessages);
```

**After (v5):**
```typescript
import { ModelMessage, convertToModelMessages } from 'ai';

const messages: ModelMessage[] = [
  { role: 'user', content: 'Hello' },
];

const converted = convertToModelMessages(uiMessages);
```

**Why:** `ModelMessage` better reflects that these are messages for the model. `UIMessage` is for UI hooks.

---

### 4. Tool Error Handling

**Change:** `ToolExecutionError` removed, errors now appear as content parts

**Before (v4):**
```typescript
import { ToolExecutionError } from 'ai';

const tools = {
  risky: {
    execute: async (args) => {
      throw new ToolExecutionError({
        message: 'API failed',
        cause: originalError,
      });
    },
  },
};

// Error would stop execution
```

**After (v5):**
```typescript
const tools = {
  risky: tool({
    execute: async (input) => {
      // Just throw regular errors
      throw new Error('API failed');
    },
  }),
};

// Error appears as tool-error content part
// Model can see the error and retry or handle it
```

**Why:** Enables automated retry in multi-step scenarios. Model can see and respond to errors.

---

### 5. Multi-Step Execution

**Change:** `maxSteps` → `stopWhen` with conditions

**Before (v4):**
```typescript
const result = await generateText({
  model: openai.chat('gpt-4'),
  tools: { /* ... */ },
  maxSteps: 5,
  experimental_continueSteps: true,
  prompt: 'Complex task',
});
```

**After (v5):**
```typescript
import { stopWhen, stepCountIs } from 'ai';

const result = await generateText({
  model: openai('gpt-4'),
  tools: { /* ... */ },
  stopWhen: stepCountIs(5),
  prompt: 'Complex task',
});

// Or stop on specific tool:
stopWhen: hasToolCall('finalize')

// Or custom condition:
stopWhen: (step) => step.stepCount > 5 || step.hasToolCall('finish')
```

**Why:** More flexible control over when multi-step execution stops. `experimental_continueSteps` no longer needed.

---

### 6. Message Structure

**Change:** Simple `content` string → `parts` array

**Before (v4):**
```typescript
const message = {
  role: 'user',
  content: 'Hello',
};

// Tool calls embedded in message differently
```

**After (v5):**
```typescript
const message = {
  role: 'user',
  content: [
    { type: 'text', text: 'Hello' },
  ],
};

// Tool calls as parts:
const messageWithTool = {
  role: 'assistant',
  content: [
    { type: 'text', text: 'Let me check...' },
    {
      type: 'tool-call',
      toolCallId: '123',
      toolName: 'weather',
      args: { location: 'SF' },
    },
  ],
};
```

**Part Types:**
- `text`: Text content
- `file`: File attachments
- `reasoning`: Extended thinking (Claude)
- `tool-call`: Tool invocation
- `tool-result`: Tool result
- `tool-error`: Tool error (new in v5)

**Why:** Unified structure for all content types. Enables richer message formats.

---

### 7. Streaming Architecture

**Change:** Single chunk format → start/delta/end lifecycle

**Before (v4):**
```typescript
stream.on('chunk', (chunk) => {
  console.log(chunk.text);
});
```

**After (v5):**
```typescript
for await (const part of stream.fullStream) {
  if (part.type === 'text-delta') {
    console.log(part.textDelta);
  } else if (part.type === 'finish') {
    console.log('Stream finished:', part.finishReason);
  }
}

// Or use simplified textStream:
for await (const text of stream.textStream) {
  console.log(text);
}
```

**Stream Event Types:**
- `text-delta`: Text chunk
- `tool-call-delta`: Tool call chunk
- `tool-result`: Tool result
- `finish`: Stream complete
- `error`: Stream error

**Why:** Better structure for concurrent streaming and metadata.

---

### 8. Tool Streaming

**Change:** Enabled by default

**Before (v4):**
```typescript
const result = await generateText({
  model: openai.chat('gpt-4'),
  tools: { /* ... */ },
  toolCallStreaming: true,  // Opt-in
});
```

**After (v5):**
```typescript
const result = await generateText({
  model: openai('gpt-4'),
  tools: { /* ... */ },
  // Tool streaming enabled by default
});
```

**Why:** Better UX. Tools stream by default for real-time feedback.

---

### 9. Package Reorganization

**Change:** Separate packages for RSC and React

**Before (v4):**
```typescript
import { streamUI } from 'ai/rsc';
import { useChat } from 'ai/react';
import { LangChainAdapter } from 'ai';
```

**After (v5):**
```typescript
import { streamUI } from '@ai-sdk/rsc';
import { useChat } from '@ai-sdk/react';
import { LangChainAdapter } from '@ai-sdk/langchain';
```

**Install:**
```bash
npm install @ai-sdk/rsc @ai-sdk/react @ai-sdk/langchain
```

**Why:** Cleaner package structure. Easier to tree-shake unused functionality.

---

## UI Hook Changes (See ai-sdk-ui Skill)

Brief summary (detailed in `ai-sdk-ui` skill):

1. **useChat Input Management:** No longer managed by hook
2. **useChat Actions:** `append()` → `sendMessage()`
3. **useChat Props:** `initialMessages` → `messages` (controlled)
4. **StreamData Removed:** Replaced by message streams

See: `ai-sdk-ui` skill for complete UI migration guide

---

## Provider-Specific Changes

### OpenAI

**Change:** Default API changed

**Before (v4):**
```typescript
const model = openai.chat('gpt-4');  // Uses Chat Completions API
```

**After (v5):**
```typescript
const model = openai('gpt-4');  // Uses Responses API
// strictSchemas: true → strictJsonSchema: true
```

**Why:** Responses API is newer and has better features.

---

### Google

**Change:** Search grounding moved to tool

**Before (v4):**
```typescript
const model = google.generativeAI('gemini-pro', {
  googleSearchRetrieval: true,
});
```

**After (v5):**
```typescript
import { google, googleSearchRetrieval } from '@ai-sdk/google';

const result = await generateText({
  model: google('gemini-pro'),
  tools: {
    search: googleSearchRetrieval(),
  },
  prompt: 'Search for...',
});
```

**Why:** More flexible. Search is now a tool like others.

---

## Migration Checklist

- [ ] Update package versions (`ai@^5.0.76`, `@ai-sdk/openai@^2.0.53`, etc.)
- [ ] Run automated migration: `npx ai migrate`
- [ ] Review automated changes
- [ ] Update all `maxTokens` → `maxOutputTokens`
- [ ] Update `providerMetadata` → `providerOptions`
- [ ] Convert tool `parameters` → `inputSchema`
- [ ] Update tool properties: `args` → `input`, `result` → `output`
- [ ] Replace `maxSteps` with `stopWhen(stepCountIs(n))`
- [ ] Update message types: `CoreMessage` → `ModelMessage`
- [ ] Remove `ToolExecutionError` handling (just throw errors)
- [ ] Update package imports (`ai/rsc` → `@ai-sdk/rsc`)
- [ ] Test streaming behavior
- [ ] Update TypeScript types
- [ ] Test tool calling
- [ ] Test multi-step execution
- [ ] Check for message structure changes in your code
- [ ] Update any custom error handling
- [ ] Test with real API calls

---

## Common Migration Errors

### Error: "maxTokens is not a valid parameter"

**Solution:** Change to `maxOutputTokens`

### Error: "ToolExecutionError is not exported from 'ai'"

**Solution:** Remove ToolExecutionError, just throw regular errors

### Error: "Cannot find module 'ai/rsc'"

**Solution:** Install and import from `@ai-sdk/rsc`
```bash
npm install @ai-sdk/rsc
import { streamUI } from '@ai-sdk/rsc';
```

### Error: "model.chat is not a function"

**Solution:** Remove `.chat()` call
```typescript
// Before: openai.chat('gpt-4')
// After:  openai('gpt-4')
```

### Error: "maxSteps is not a valid parameter"

**Solution:** Use `stopWhen(stepCountIs(n))`

---

## Testing After Migration

```typescript
// Test basic generation
const test1 = await generateText({
  model: openai('gpt-4'),
  prompt: 'Hello',
});
console.log('✅ Basic generation:', test1.text);

// Test streaming
const test2 = streamText({
  model: openai('gpt-4'),
  prompt: 'Hello',
});
for await (const chunk of test2.textStream) {
  process.stdout.write(chunk);
}
console.log('\n✅ Streaming works');

// Test structured output
const test3 = await generateObject({
  model: openai('gpt-4'),
  schema: z.object({ name: z.string() }),
  prompt: 'Generate a person',
});
console.log('✅ Structured output:', test3.object);

// Test tools
const test4 = await generateText({
  model: openai('gpt-4'),
  tools: {
    test: tool({
      description: 'Test tool',
      inputSchema: z.object({ value: z.string() }),
      execute: async ({ value }) => ({ result: value }),
    }),
  },
  prompt: 'Use the test tool with value "hello"',
});
console.log('✅ Tools work');
```

---

## Resources

- **Official Migration Guide:** https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0
- **Automated Migration:** `npx ai migrate`
- **GitHub Discussions:** https://github.com/vercel/ai/discussions
- **v5 Release Blog:** https://vercel.com/blog/ai-sdk-5

---

**Last Updated:** 2025-10-21
