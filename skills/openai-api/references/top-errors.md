# Top OpenAI API Errors & Solutions

**Last Updated**: 2025-10-25
**Skill**: openai-api
**Status**: Phase 1 Complete

---

## Overview

This document covers the 10 most common errors encountered when using OpenAI APIs, with causes, solutions, and code examples.

---

## 1. Rate Limit Error (429)

### Cause
Too many requests or tokens per minute/day.

### Error Response
```json
{
  "error": {
    "message": "Rate limit reached",
    "type": "rate_limit_error",
    "code": "rate_limit_exceeded"
  }
}
```

### Solution
Implement exponential backoff:

```typescript
async function completionWithRetry(params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await openai.chat.completions.create(params);
    } catch (error: any) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

---

## 2. Invalid API Key (401)

### Cause
Missing or incorrect `OPENAI_API_KEY`.

### Error Response
```json
{
  "error": {
    "message": "Incorrect API key provided",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

### Solution
Verify environment variable:

```bash
# Check if set
echo $OPENAI_API_KEY

# Set in .env
OPENAI_API_KEY=sk-...
```

```typescript
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

---

## 3. Function Calling Schema Mismatch

### Cause
Tool definition doesn't match model expectations or arguments are invalid.

### Error Response
```json
{
  "error": {
    "message": "Invalid schema for function 'get_weather'",
    "type": "invalid_request_error"
  }
}
```

### Solution
Validate JSON schema:

```typescript
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get weather for a location', // Required
      parameters: { // Required
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City name' // Add descriptions
          }
        },
        required: ['location'] // Specify required fields
      }
    }
  }
];
```

---

## 4. Streaming Parse Error

### Cause
Incomplete or malformed SSE (Server-Sent Events) chunks.

### Symptom
```
SyntaxError: Unexpected end of JSON input
```

### Solution
Properly handle SSE format:

```typescript
const lines = chunk.split('\n').filter(line => line.trim() !== '');

for (const line of lines) {
  if (line.startsWith('data: ')) {
    const data = line.slice(6);

    if (data === '[DONE]') {
      break;
    }

    try {
      const json = JSON.parse(data);
      const content = json.choices[0]?.delta?.content || '';
      console.log(content);
    } catch (e) {
      // Skip invalid JSON - don't crash
      console.warn('Skipping invalid JSON chunk');
    }
  }
}
```

---

## 5. Vision Image Encoding Error

### Cause
Invalid base64 encoding or unsupported image format.

### Error Response
```json
{
  "error": {
    "message": "Invalid image format",
    "type": "invalid_request_error"
  }
}
```

### Solution
Ensure proper base64 encoding:

```typescript
import fs from 'fs';

// Read and encode image
const imageBuffer = fs.readFileSync('./image.jpg');
const base64Image = imageBuffer.toString('base64');

// Use with correct MIME type
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is in this image?' },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}` // Include MIME type
          }
        }
      ]
    }
  ]
});
```

---

## 6. Token Limit Exceeded

### Cause
Input + output tokens exceed model's context window.

### Error Response
```json
{
  "error": {
    "message": "This model's maximum context length is 128000 tokens",
    "type": "invalid_request_error",
    "code": "context_length_exceeded"
  }
}
```

### Solution
Truncate input or reduce max_tokens:

```typescript
function truncateMessages(messages, maxTokens = 120000) {
  // Rough estimate: 1 token ≈ 4 characters
  const maxChars = maxTokens * 4;
  let totalChars = 0;

  const truncated = [];
  for (const msg of messages.reverse()) {
    const msgChars = msg.content.length;
    if (totalChars + msgChars > maxChars) break;
    truncated.unshift(msg);
    totalChars += msgChars;
  }

  return truncated;
}

const completion = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: truncateMessages(messages),
  max_tokens: 8000, // Limit output tokens
});
```

---

## 7. GPT-5 Temperature Not Supported

### Cause
Using `temperature` parameter with GPT-5 models.

### Error Response
```json
{
  "error": {
    "message": "temperature is not supported for gpt-5",
    "type": "invalid_request_error"
  }
}
```

### Solution
Use `reasoning_effort` instead or switch to GPT-4o:

```typescript
// ❌ Bad - GPT-5 doesn't support temperature
const completion = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [...],
  temperature: 0.7, // NOT SUPPORTED
});

// ✅ Good - Use reasoning_effort for GPT-5
const completion = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [...],
  reasoning_effort: 'medium',
});

// ✅ Or use GPT-4o if you need temperature
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [...],
  temperature: 0.7,
});
```

---

## 8. Streaming Not Closed Properly

### Cause
Stream not properly terminated, causing resource leaks.

### Symptom
Memory leaks, hanging connections.

### Solution
Always close streams:

```typescript
const stream = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [...],
  stream: true,
});

try {
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    process.stdout.write(content);
  }
} finally {
  // Stream is automatically closed when iteration completes
  // But handle errors explicitly
}

// For fetch-based streaming:
const reader = response.body?.getReader();
try {
  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;
    // Process chunk
  }
} finally {
  reader!.releaseLock(); // Important!
}
```

---

## 9. API Key Exposure in Client-Side Code

### Cause
Including API key in frontend JavaScript.

### Risk
API key visible to all users, can be stolen and abused.

### Solution
Use server-side proxy:

```typescript
// ❌ Bad - Client-side (NEVER DO THIS)
const apiKey = 'sk-...'; // Exposed to all users!
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});

// ✅ Good - Server-side proxy
// Frontend:
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello' }),
});

// Backend (e.g., Express):
app.post('/api/chat', async (req, res) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [{ role: 'user', content: req.body.message }],
  });
  res.json(completion);
});
```

---

## 10. Embeddings Dimension Mismatch

### Cause
Using wrong dimensions for embedding model.

### Error Response
```json
{
  "error": {
    "message": "dimensions must be less than or equal to 3072 for text-embedding-3-large",
    "type": "invalid_request_error"
  }
}
```

### Solution
Use correct dimensions for each model:

```typescript
// text-embedding-3-small: default 1536, max 1536
const embedding1 = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'Hello world',
  // dimensions: 256, // Optional: reduce from default 1536
});

// text-embedding-3-large: default 3072, max 3072
const embedding2 = await openai.embeddings.create({
  model: 'text-embedding-3-large',
  input: 'Hello world',
  // dimensions: 1024, // Optional: reduce from default 3072
});

// text-embedding-ada-002: fixed 1536 (no dimensions parameter)
const embedding3 = await openai.embeddings.create({
  model: 'text-embedding-ada-002',
  input: 'Hello world',
  // No dimensions parameter supported
});
```

---

## Quick Reference Table

| Error Code | HTTP Status | Primary Cause | Quick Fix |
|------------|-------------|---------------|-----------|
| `rate_limit_exceeded` | 429 | Too many requests | Exponential backoff |
| `invalid_api_key` | 401 | Wrong/missing key | Check OPENAI_API_KEY |
| `invalid_request_error` | 400 | Bad parameters | Validate schema/params |
| `context_length_exceeded` | 400 | Too many tokens | Truncate input |
| `model_not_found` | 404 | Invalid model name | Use correct model ID |
| `insufficient_quota` | 429 | No credits left | Add billing/credits |

---

## Additional Resources

- **Official Error Codes**: https://platform.openai.com/docs/guides/error-codes
- **Rate Limits Guide**: https://platform.openai.com/docs/guides/rate-limits
- **Best Practices**: https://platform.openai.com/docs/guides/production-best-practices

---

**Phase 1 Complete** ✅
**Phase 2**: Additional errors for Embeddings, Images, Audio, Moderation (next session)
