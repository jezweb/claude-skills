# Top 12 Common Errors and Solutions

Complete reference for troubleshooting Claude API errors.

---

## Error #1: Rate Limit 429 - Too Many Requests

**Error Message:**
```
429 Too Many Requests: Number of request tokens has exceeded your per-minute rate limit
```

**Source**: https://docs.claude.com/en/api/errors

**Why It Happens:**
- Exceeded requests per minute (RPM)
- Exceeded tokens per minute (TPM)
- Exceeded daily token quota

**Solution:**
```typescript
async function handleRateLimit(requestFn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (error.status === 429) {
        const retryAfter = error.response?.headers?.['retry-after'];
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 1000 * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

**Prevention:**
- Implement exponential backoff
- Respect `retry-after` header
- Monitor rate limit headers
- Upgrade account tier for higher limits

---

## Error #2: Streaming SSE Parsing Errors

**Error Message:**
```
Incomplete chunks, malformed events, connection dropped
```

**Source**: Community reports, SDK issues

**Why It Happens:**
- Network interruptions
- Improper SSE event parsing
- Errors occur AFTER initial 200 response

**Solution:**
```typescript
const stream = anthropic.messages.stream({...});

stream
  .on('error', (error) => {
    console.error('Stream error:', error);
    // Implement retry or fallback
  })
  .on('abort', (error) => {
    console.warn('Stream aborted');
  })
  .on('end', () => {
    console.log('Stream completed');
  });

await stream.finalMessage();
```

**Prevention:**
- Always implement error event listeners
- Handle stream abortion
- Use SDK helpers (don't parse SSE manually)
- Implement reconnection logic

---

## Error #3: Prompt Caching Not Activating

**Error Message:**
```
High costs despite cache_control blocks
cache_read_input_tokens: 0
```

**Source**: https://docs.claude.com/en/docs/build-with-claude/prompt-caching

**Why It Happens:**
- `cache_control` not on last block
- Content below minimum tokens (1024/2048)
- Content changed (breaks cache match)
- Outside 5-minute TTL

**Solution:**
```typescript
// ❌ Wrong - cache_control not at end
{
  type: 'text',
  text: DOCUMENT,
  cache_control: { type: 'ephemeral' },  // Wrong position
},
{
  type: 'text',
  text: 'Additional text',
}

// ✅ Correct - cache_control at end
{
  type: 'text',
  text: DOCUMENT + '\n\nAdditional text',
  cache_control: { type: 'ephemeral' },  // Correct position
}
```

**Prevention:**
- Place `cache_control` on LAST block
- Ensure content >= 1024 tokens
- Keep cached content identical
- Monitor `cache_read_input_tokens`

---

## Error #4: Tool Use Response Format Errors

**Error Message:**
```
invalid_request_error: tools[0].input_schema is invalid
```

**Source**: API validation

**Why It Happens:**
- Invalid JSON Schema
- Missing required fields
- Incorrect tool_use_id in tool_result

**Solution:**
```typescript
// ✅ Valid tool schema
{
  name: 'get_weather',
  description: 'Get current weather',
  input_schema: {
    type: 'object',           // Must be 'object'
    properties: {
      location: {
        type: 'string',       // Valid JSON Schema types
        description: 'City'   // Optional but recommended
      }
    },
    required: ['location']    // List required fields
  }
}

// ✅ Valid tool result
{
  type: 'tool_result',
  tool_use_id: block.id,      // Must match tool_use id
  content: JSON.stringify(result)  // Convert to string
}
```

**Prevention:**
- Validate schemas with JSON Schema validator
- Match `tool_use_id` exactly
- Stringify tool results
- Test thoroughly before production

---

## Error #5: Vision Image Format Issues

**Error Message:**
```
invalid_request_error: image source must be base64 or url
```

**Source**: API documentation

**Why It Happens:**
- Unsupported image format
- Incorrect base64 encoding
- Invalid media_type

**Solution:**
```typescript
import fs from 'fs';

const imageData = fs.readFileSync('./image.jpg');
const base64Image = imageData.toString('base64');

// ✅ Correct format
{
  type: 'image',
  source: {
    type: 'base64',
    media_type: 'image/jpeg',  // Must match actual format
    data: base64Image          // Pure base64 (no data URI prefix)
  }
}
```

**Supported Formats:**
- image/jpeg
- image/png
- image/webp
- image/gif

**Prevention:**
- Validate format before encoding
- Use correct media_type
- Remove data URI prefix if present
- Keep images under 5MB

---

## Error #6: Token Counting Mismatches

**Error Message:**
```
invalid_request_error: messages: too many tokens
```

**Source**: Token counting differences

**Why It Happens:**
- Not accounting for special tokens
- Formatting adds hidden tokens
- Context window exceeded

**Solution:**
```typescript
// Monitor token usage
const response = await anthropic.messages.create({...});

console.log('Input tokens:', response.usage.input_tokens);
console.log('Output tokens:', response.usage.output_tokens);
console.log('Total:', response.usage.input_tokens + response.usage.output_tokens);

// Check against context window
const contextWindow = 200000; // Claude 3.5 Sonnet
if (response.usage.input_tokens > contextWindow) {
  console.warn('Approaching context limit');
}
```

**Prevention:**
- Use official token counter
- Monitor usage headers
- Implement message pruning
- Use prompt caching for long context

---

## Error #7: System Prompt Ordering Issues

**Error Message:**
```
System prompt ignored or overridden
```

**Source**: API behavior

**Why It Happens:**
- System prompt placed after messages
- System prompt in wrong format

**Solution:**
```typescript
// ❌ Wrong
const message = await anthropic.messages.create({
  messages: [...],
  system: 'You are helpful',  // Wrong - after messages
});

// ✅ Correct
const message = await anthropic.messages.create({
  system: 'You are helpful',  // Correct - before messages
  messages: [...],
});
```

**Prevention:**
- Always place `system` before `messages`
- Use system prompt for behavior instructions
- Test system prompt effectiveness

---

## Error #8: Context Window Exceeded

**Error Message:**
```
invalid_request_error: messages: too many tokens (210000 > 200000)
```

**Source**: Model limits

**Why It Happens:**
- Long conversations
- Large documents
- Not pruning message history

**Solution:**
```typescript
function pruneMessages(messages, maxTokens = 150000) {
  // Keep most recent messages
  let totalTokens = 0;
  const prunedMessages = [];

  for (let i = messages.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(messages[i].content);
    if (totalTokens + msgTokens > maxTokens) break;
    prunedMessages.unshift(messages[i]);
    totalTokens += msgTokens;
  }

  return prunedMessages;
}
```

**Prevention:**
- Implement message history pruning
- Use summarization for old messages
- Use prompt caching
- Choose model with larger context (3.7 Sonnet: 2M tokens)

---

## Error #9: Extended Thinking on Wrong Model

**Error Message:**
```
No thinking blocks in response
```

**Source**: Model capabilities

**Why It Happens:**
- Using Claude 3.5 Sonnet (not supported)
- Should use Claude 3.7 Sonnet or Claude 4

**Solution:**
```typescript
// ❌ Wrong model - no extended thinking
model: 'claude-sonnet-4-5-20250929'

// ✅ Correct models for extended thinking
model: 'claude-3-7-sonnet-20250228'  // Has extended thinking
model: 'claude-opus-4-20250514'      // Has extended thinking
```

**Prevention:**
- Verify model capabilities
- Use 3.7 Sonnet or 4.x models for extended thinking
- Document model requirements

---

## Error #10: API Key Exposure in Client Code

**Error Message:**
```
CORS errors, security vulnerability
```

**Source**: Security best practices

**Why It Happens:**
- Making API calls from browser
- API key in client-side code

**Solution:**
```typescript
// ❌ Never do this
const anthropic = new Anthropic({
  apiKey: 'sk-ant-...',  // Exposed in browser!
});

// ✅ Use server-side endpoint
async function callClaude(messages) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  });
  return response.json();
}
```

**Prevention:**
- Server-side only
- Use environment variables
- Implement authentication
- Never expose API key

---

## Error #11: Rate Limit Tier Confusion

**Error Message:**
```
Lower limits than expected
```

**Source**: Account tier system

**Why It Happens:**
- Not understanding tier progression
- Expecting higher limits without usage history

**Solution:**
- Check current tier in Console
- Tiers auto-scale with usage ($10, $50, $500 spend)
- Monitor rate limit headers
- Contact support for custom limits

**Tier Progression:**
- Tier 1: 50 RPM, 40k TPM
- Tier 2: 1000 RPM, 100k TPM ($10 spend)
- Tier 3: 2000 RPM, 200k TPM ($50 spend)
- Tier 4: 4000 RPM, 400k TPM ($500 spend)

**Prevention:**
- Review tier requirements
- Plan for gradual scale-up
- Implement proper rate limiting

---

## Error #12: Message Batches Beta Headers Missing

**Error Message:**
```
invalid_request_error: unknown parameter: batches
```

**Source**: Beta API requirements

**Why It Happens:**
- Missing `anthropic-beta` header
- Using wrong endpoint

**Solution:**
```typescript
const response = await fetch('https://api.anthropic.com/v1/messages/batches', {
  method: 'POST',
  headers: {
    'x-api-key': API_KEY,
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'message-batches-2024-09-24',  // Required!
    'content-type': 'application/json',
  },
  body: JSON.stringify({...}),
});
```

**Prevention:**
- Include beta headers for beta features
- Check official docs for header requirements
- Test beta features in development first

---

## Quick Diagnosis Checklist

When encountering errors:

1. ✅ Check error status code (400, 401, 429, 500, etc.)
2. ✅ Read error message carefully
3. ✅ Verify API key is valid and in environment variable
4. ✅ Confirm model ID is correct
5. ✅ Check request format matches API spec
6. ✅ Monitor rate limit headers
7. ✅ Review recent code changes
8. ✅ Test with minimal example
9. ✅ Check official docs for breaking changes
10. ✅ Search GitHub issues for similar problems

---

## Getting Help

**Official Resources:**
- **Errors Reference**: https://docs.claude.com/en/api/errors
- **API Documentation**: https://docs.claude.com/en/api
- **Support**: https://support.claude.com/

**Community:**
- **GitHub Issues**: https://github.com/anthropics/anthropic-sdk-typescript/issues
- **Developer Forum**: https://support.claude.com/

**This Skill:**
- Check other reference files for detailed guides
- Review templates for working examples
- Verify setup checklist in SKILL.md
