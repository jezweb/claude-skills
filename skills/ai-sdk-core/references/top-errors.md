# AI SDK Core - Top 12 Errors & Solutions

Comprehensive guide to the most common AI SDK Core errors with actionable solutions.

---

## 1. AI_APICallError

**Type:** Network/API Error
**Frequency:** Very Common
**Severity:** High

### Cause

API request to provider failed due to:
- Invalid API key
- Network connectivity issues
- Rate limit exceeded
- Provider service outage

### Solution

```typescript
import { AI_APICallError } from 'ai';

try {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: 'Hello',
  });
} catch (error) {
  if (error instanceof AI_APICallError) {
    console.error('API call failed:', error.message);
    console.error('Status code:', error.statusCode);
    console.error('Response:', error.responseBody);

    // Handle specific status codes
    if (error.statusCode === 401) {
      // Invalid API key
      console.error('Check OPENAI_API_KEY environment variable');
    } else if (error.statusCode === 429) {
      // Rate limit - implement exponential backoff
      await wait(Math.pow(2, retryCount) * 1000);
      // retry...
    } else if (error.statusCode >= 500) {
      // Provider issue - retry later
      console.error('Provider service issue, retry in 1 minute');
    }
  }
}
```

### Prevention

- Validate API keys at application startup
- Implement retry logic with exponential backoff
- Monitor rate limits via response headers
- Handle network errors gracefully
- Set reasonable timeouts

### Resources

- Docs: https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-api-call-error

---

## 2. AI_NoObjectGeneratedError

**Type:** Generation Error
**Frequency:** Common
**Severity:** Medium

### Cause

Model didn't generate a valid object matching the Zod schema:
- Schema too complex for model
- Prompt doesn't provide enough context
- Model capabilities exceeded
- Safety filters triggered

### Solution

```typescript
import { AI_NoObjectGeneratedError } from 'ai';

try {
  const result = await generateObject({
    model: openai('gpt-4'),
    schema: z.object({
      // Complex schema
      name: z.string(),
      age: z.number(),
      nested: z.object({ /* ... */ }),
    }),
    prompt: 'Generate a person',
  });
} catch (error) {
  if (error instanceof AI_NoObjectGeneratedError) {
    console.error('No valid object generated');

    // Solutions:
    // 1. Simplify schema
    const simpler = z.object({
      name: z.string(),
      age: z.number(),
    });

    // 2. Add more context
    const betterPrompt = 'Generate a person profile with name (string) and age (number, 18-80)';

    // 3. Try different model
    const result2 = await generateObject({
      model: openai('gpt-4'), // GPT-4 better than 3.5 for complex objects
      schema: simpler,
      prompt: betterPrompt,
    });
  }
}
```

### Prevention

- Start with simple schemas, add complexity gradually
- Include examples in prompt: `"Generate like: { name: 'Alice', age: 30 }"`
- Use GPT-4 or Claude for complex structured output
- Test schemas with sample data first
- Add descriptions to schema fields using `.describe()`

### Resources

- Docs: https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-no-object-generated-error

---

## 3. Worker Startup Limit (270ms+)

**Type:** Cloudflare Workers Issue
**Frequency:** Common (Workers only)
**Severity:** High (blocks deployment)

### Cause

AI SDK v5 + Zod initialization overhead exceeds Cloudflare Workers startup limit (must be <400ms):
- Top-level imports of AI SDK packages
- Complex Zod schemas at module level
- Provider initialization at startup

### Solution

```typescript
// ❌ BAD: Top-level imports cause startup overhead
import { createWorkersAI } from 'workers-ai-provider';
import { generateText } from 'ai';
import { complexSchema } from './schemas'; // Heavy Zod schemas

const workersai = createWorkersAI({ binding: env.AI }); // Runs at startup!

// ✅ GOOD: Lazy initialization inside handler
export default {
  async fetch(request, env) {
    // Import inside handler
    const { createWorkersAI } = await import('workers-ai-provider');
    const { generateText } = await import('ai');

    const workersai = createWorkersAI({ binding: env.AI });

    const result = await generateText({
      model: workersai('@cf/meta/llama-3.1-8b-instruct'),
      prompt: 'Hello',
    });

    return new Response(result.text);
  }
};
```

### Alternative Solution (Move Schemas Inside Routes)

```typescript
// ❌ BAD: Top-level schema
import { z } from 'zod';
const PersonSchema = z.object({ /* complex schema */ });

// ✅ GOOD: Schema inside handler
export default {
  async fetch(request, env) {
    const { z } = await import('zod');
    const PersonSchema = z.object({ /* complex schema */ });

    // Use schema here
  }
};
```

### Prevention

- Never initialize AI SDK at module top-level in Workers
- Move all imports inside route handlers
- Minimize top-level Zod schemas
- Monitor Worker startup time: `wrangler deploy` shows startup duration
- Target < 270ms startup time to be safe (limit is 400ms)

### Resources

- Cloudflare Workers AI Docs: https://developers.cloudflare.com/workers-ai/configuration/ai-sdk/
- GitHub: Search "Workers startup limit" in Vercel AI SDK issues

---

## 4. streamText Fails Silently

**Type:** Streaming Error
**Frequency:** Occasional
**Severity:** Medium (hard to debug)

### Cause

Stream errors are swallowed by `createDataStreamResponse()` or framework response handling:
- Error occurs during streaming
- Error handler not set up
- Response already committed
- Client disconnects

### Solution

```typescript
// ✅ GOOD: Add explicit error handling
const stream = streamText({
  model: openai('gpt-4'),
  prompt: 'Hello',
});

try {
  for await (const chunk of stream.textStream) {
    process.stdout.write(chunk);
  }
} catch (error) {
  // Error may not reach here if stream swallows it
  console.error('Stream error:', error);
}

// ✅ BETTER: Always log on server side
console.log('Starting stream...');
const stream = streamText({
  model: openai('gpt-4'),
  prompt: 'Hello',
});

stream.result.then(
  (result) => console.log('Stream success:', result.usage),
  (error) => console.error('Stream failed:', error) // This will catch errors!
);

return stream.toDataStreamResponse();
```

### Prevention

- Always check server logs for stream errors
- Implement server-side error monitoring (e.g., Sentry)
- Test stream error handling explicitly
- Use `try-catch` around stream consumption
- Monitor for unexpected stream terminations

### Resources

- GitHub Issue: #4726

---

## 5. AI_LoadAPIKeyError

**Type:** Configuration Error
**Frequency:** Very Common (setup)
**Severity:** High (blocks usage)

### Cause

API key missing or invalid:
- `.env` file not loaded
- Wrong environment variable name
- API key format invalid
- Environment variable not set in deployment

### Solution

```typescript
import { AI_LoadAPIKeyError } from 'ai';

try {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: 'Hello',
  });
} catch (error) {
  if (error instanceof AI_LoadAPIKeyError) {
    console.error('API key error:', error.message);

    // Debugging steps:
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    console.log('Key starts with sk-:', process.env.OPENAI_API_KEY?.startsWith('sk-'));

    // Common issues:
    // 1. .env not loaded → use dotenv or similar
    // 2. Wrong variable name → check provider docs
    // 3. Key format wrong → verify in provider dashboard
  }
}
```

### Prevention

```typescript
// Validate at startup
function validateEnv() {
  const required = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY'];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

validateEnv();
```

### Environment Variable Names

| Provider | Variable Name |
|----------|---------------|
| OpenAI | `OPENAI_API_KEY` |
| Anthropic | `ANTHROPIC_API_KEY` |
| Google | `GOOGLE_GENERATIVE_AI_API_KEY` |

### Resources

- Docs: https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-load-api-key-error

---

## 6. AI_InvalidArgumentError

**Type:** Validation Error
**Frequency:** Common (development)
**Severity:** Low (easy to fix)

### Cause

Invalid parameters passed to AI SDK function:
- Negative `maxOutputTokens`
- Invalid temperature (must be 0-2)
- Wrong parameter types
- Missing required parameters

### Solution

```typescript
import { AI_InvalidArgumentError } from 'ai';

try {
  const result = await generateText({
    model: openai('gpt-4'),
    maxOutputTokens: -1,  // ❌ Invalid!
    temperature: 3.0,      // ❌ Must be 0-2
    prompt: 'Hello',
  });
} catch (error) {
  if (error instanceof AI_InvalidArgumentError) {
    console.error('Invalid argument:', error.message);
    // Fix: Check parameter types and values
  }
}
```

### Prevention

- Use TypeScript for compile-time type checking
- Validate inputs before calling AI SDK functions
- Read function signatures carefully
- Check official docs for parameter constraints
- Use IDE autocomplete

### Resources

- Docs: https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-invalid-argument-error

---

## 7. AI_NoContentGeneratedError

**Type:** Generation Error
**Frequency:** Occasional
**Severity:** Medium

### Cause

Model generated no content:
- Safety filters blocked output
- Prompt triggered content policy
- Model configuration issue
- Empty prompt

### Solution

```typescript
import { AI_NoContentGeneratedError } from 'ai';

try {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: 'Some potentially problematic prompt',
  });
} catch (error) {
  if (error instanceof AI_NoContentGeneratedError) {
    console.error('No content generated');

    // Return user-friendly message
    return {
      text: 'Unable to generate response. Please try different input.',
      error: true,
    };
  }
}
```

### Prevention

- Sanitize user inputs
- Avoid prompts that may trigger safety filters
- Have fallback messaging
- Log occurrences for analysis
- Test with edge cases

### Resources

- Docs: https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-no-content-generated-error

---

## 8. AI_TypeValidationError

**Type:** Validation Error
**Frequency:** Common (with generateObject)
**Severity:** Medium

### Cause

Zod schema validation failed on generated output:
- Model output doesn't match schema
- Schema too strict
- Model misunderstood schema
- Invalid JSON generated

### Solution

```typescript
import { AI_TypeValidationError } from 'ai';

try {
  const result = await generateObject({
    model: openai('gpt-4'),
    schema: z.object({
      age: z.number().min(0).max(120),  // Strict validation
      email: z.string().email(),         // Strict format
    }),
    prompt: 'Generate person',
  });
} catch (error) {
  if (error instanceof AI_TypeValidationError) {
    console.error('Validation failed:', error.message);

    // Solutions:
    // 1. Relax schema
    const relaxed = z.object({
      age: z.number(),  // Remove min/max
      email: z.string().optional(),  // Make optional
    });

    // 2. Add guidance in prompt
    const better = await generateObject({
      model: openai('gpt-4'),
      schema: relaxed,
      prompt: 'Generate person with age 18-80 and valid email',
    });
  }
}
```

### Prevention

- Start with lenient schemas, tighten gradually
- Use `.optional()` for unreliable fields
- Add validation hints in field descriptions
- Test with various prompts
- Use mode: 'json' when available

### Resources

- Docs: https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-type-validation-error

---

## 9. AI_RetryError

**Type:** Network Error
**Frequency:** Occasional
**Severity:** High

### Cause

All retry attempts failed:
- Persistent network issue
- Provider outage
- Invalid configuration
- Unreachable API endpoint

### Solution

```typescript
import { AI_RetryError } from 'ai';

try {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: 'Hello',
    maxRetries: 3,  // Default is 2
  });
} catch (error) {
  if (error instanceof AI_RetryError) {
    console.error('All retries failed');
    console.error('Last error:', error.lastError);
    console.error('Retry count:', error.retryCount);

    // Implement circuit breaker
    if (isProviderDown()) {
      switchToFallbackProvider();
    }
  }
}
```

### Prevention

- Investigate root cause of failures
- Adjust retry configuration if needed
- Implement circuit breaker pattern
- Have fallback providers
- Monitor provider status pages

### Resources

- Docs: https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-retry-error

---

## 10. Rate Limiting Errors

**Type:** API Limit Error
**Frequency:** Common (production)
**Severity:** High

### Cause

Exceeded provider rate limits:
- RPM (Requests Per Minute) exceeded
- TPM (Tokens Per Minute) exceeded
- Concurrent request limit hit
- Free tier limits reached

### Solution

```typescript
// Implement exponential backoff
async function generateWithBackoff(prompt: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await generateText({
        model: openai('gpt-4'),
        prompt,
      });
    } catch (error: any) {
      if (error.statusCode === 429) {
        const delay = Math.pow(2, i) * 1000;  // 1s, 2s, 4s, 8s...
        console.log(`Rate limited, waiting ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Rate limit retries exhausted');
}

// Or use queue
import PQueue from 'p-queue';

const queue = new PQueue({ concurrency: 5, interval: 60000, intervalCap: 50 });

async function generateQueued(prompt: string) {
  return queue.add(() => generateText({ model: openai('gpt-4'), prompt }));
}
```

### Prevention

- Monitor rate limit headers in responses
- Queue requests to stay under limits
- Upgrade provider tier if needed
- Implement request throttling
- Cache results when possible

### Resources

- OpenAI Rate Limits: https://platform.openai.com/account/rate-limits
- Anthropic Rate Limits: https://docs.anthropic.com/en/api/rate-limits

---

## 11. TypeScript Performance with Zod

**Type:** Development Issue
**Frequency:** Occasional
**Severity:** Low (annoying)

### Cause

Complex Zod schemas slow down TypeScript type checking:
- Deeply nested schemas
- Many union types
- Recursive types
- Top-level complex schemas

### Solution

```typescript
// ❌ BAD: Complex schema at top level
const ComplexSchema = z.object({
  // 100+ fields with nested objects...
});

// ✅ GOOD: Define inside function
function generateData() {
  const schema = z.object({
    // Complex schema here
  });

  return generateObject({ model: openai('gpt-4'), schema, prompt: '...' });
}

// ✅ GOOD: Use z.lazy() for recursive
type Category = { name: string; subcategories?: Category[] };

const CategorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    name: z.string(),
    subcategories: z.array(CategorySchema).optional(),
  })
);

// ✅ GOOD: Split large schemas
const AddressSchema = z.object({ /* ... */ });
const PersonSchema = z.object({
  address: AddressSchema, // Reuse smaller schema
});
```

### Prevention

- Avoid top-level complex schemas
- Use `z.lazy()` for recursive types
- Split large schemas into smaller ones
- Use type assertions where appropriate
- Enable `skipLibCheck` in tsconfig.json if desperate

### Resources

- Troubleshooting: https://ai-sdk.dev/docs/troubleshooting/common-issues/slow-type-checking

---

## 12. Invalid JSON Response (Provider-Specific)

**Type:** Provider Issue
**Frequency:** Rare
**Severity:** Medium

### Cause

Some models occasionally return invalid JSON:
- Model error
- Provider API issue
- Specific model version bug (e.g., Imagen 3.0)

### Solution

```typescript
// Use built-in retry and mode selection
try {
  const result = await generateObject({
    model: openai('gpt-4'),
    schema: mySchema,
    prompt: 'Generate data',
    mode: 'json',  // Force JSON mode (GPT-4 supports this)
    maxRetries: 3,  // Retry on invalid JSON
  });
} catch (error) {
  // Fallback to different model
  console.error('GPT-4 failed, trying Claude...');
  const result2 = await generateObject({
    model: anthropic('claude-3-5-sonnet-20241022'),
    schema: mySchema,
    prompt: 'Generate data',
  });
}
```

### Prevention

- Use `mode: 'json'` when available
- Prefer GPT-4/Claude for structured output
- Implement retry logic
- Validate responses
- Have fallback models

### Resources

- GitHub Issue: #4302 (Imagen 3.0 Invalid JSON)

---

## For More Errors

See complete error reference (28 total error types):
https://ai-sdk.dev/docs/reference/ai-sdk-errors

---

**Last Updated:** 2025-10-21
