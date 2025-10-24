# Top 8 Errors with OpenAI Responses API

**Last Updated**: 2025-10-25

This document covers the most common errors encountered when using the Responses API and their solutions.

---

## 1. Session State Not Persisting

**Error Symptom:**
Model doesn't remember previous conversation turns.

**Causes:**
- Not using conversation IDs
- Using different conversation IDs per turn
- Creating new conversation for each request

**Solution:**
```typescript
// ❌ BAD: New conversation each time
const response1 = await openai.responses.create({
  model: 'gpt-5',
  input: 'Question 1',
});
const response2 = await openai.responses.create({
  model: 'gpt-5',
  input: 'Question 2', // Model doesn't remember question 1
});

// ✅ GOOD: Reuse conversation ID
const conv = await openai.conversations.create();
const response1 = await openai.responses.create({
  model: 'gpt-5',
  conversation: conv.id, // ✅ Same ID
  input: 'Question 1',
});
const response2 = await openai.responses.create({
  model: 'gpt-5',
  conversation: conv.id, // ✅ Same ID - remembers previous
  input: 'Question 2',
});
```

**Prevention:**
- Create conversation once
- Store conversation ID (database, session, cookie)
- Reuse ID for all related turns

---

## 2. MCP Server Connection Failed

**Error:**
```json
{
  "error": {
    "type": "mcp_connection_error",
    "message": "Failed to connect to MCP server"
  }
}
```

**Causes:**
- Invalid server URL
- Missing or expired authorization token
- Server not responding
- Network issues

**Solutions:**
```typescript
// 1. Verify URL is correct
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Test MCP',
  tools: [
    {
      type: 'mcp',
      server_label: 'stripe',
      server_url: 'https://mcp.stripe.com', // ✅ Full HTTPS URL
      authorization: process.env.STRIPE_OAUTH_TOKEN, // ✅ Valid token
    },
  ],
});

// 2. Test server URL manually
const testResponse = await fetch('https://mcp.stripe.com');
console.log(testResponse.status); // Should be 200

// 3. Check token expiration
const tokenExpiry = parseJWT(token).exp;
if (Date.now() / 1000 > tokenExpiry) {
  console.error('Token expired, refresh it');
}
```

**Prevention:**
- Use environment variables for secrets
- Implement token refresh logic
- Add retry with exponential backoff
- Log connection attempts for debugging

---

## 3. Code Interpreter Timeout

**Error:**
```json
{
  "error": {
    "type": "code_interpreter_timeout",
    "message": "Code execution exceeded time limit"
  }
}
```

**Cause:**
Code runs longer than 30 seconds (standard mode limit)

**Solution:**
```typescript
// ❌ BAD: Long-running code in standard mode
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Process this massive dataset',
  tools: [{ type: 'code_interpreter' }], // Timeout after 30s
});

// ✅ GOOD: Use background mode for long tasks
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Process this massive dataset',
  background: true, // ✅ Up to 10 minutes
  tools: [{ type: 'code_interpreter' }],
});

// Poll for results
let result = await openai.responses.retrieve(response.id);
while (result.status === 'in_progress') {
  await new Promise(r => setTimeout(r, 5000));
  result = await openai.responses.retrieve(response.id);
}
console.log(result.output_text);
```

**Prevention:**
- Use `background: true` for tasks > 30 seconds
- Break large tasks into smaller chunks
- Optimize code for performance

---

## 4. Image Generation Rate Limit

**Error:**
```json
{
  "error": {
    "type": "rate_limit_error",
    "message": "DALL-E rate limit exceeded"
  }
}
```

**Cause:**
Too many image generation requests in short time

**Solution:**
```typescript
// Implement retry with exponential backoff
async function generateImageWithRetry(prompt: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await openai.responses.create({
        model: 'gpt-5',
        input: prompt,
        tools: [{ type: 'image_generation' }],
      });
    } catch (error: any) {
      if (error.type === 'rate_limit_error' && i < retries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

const response = await generateImageWithRetry('Create an image of a sunset');
```

**Prevention:**
- Implement rate limiting on your side
- Use exponential backoff for retries
- Queue image requests
- Monitor API usage

---

## 5. File Search Relevance Issues

**Problem:**
File search returns irrelevant or low-quality results

**Causes:**
- Vague queries
- Poor file quality (OCR errors, formatting)
- Not enough context

**Solutions:**
```typescript
// ❌ BAD: Vague query
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Find pricing', // Too vague
  tools: [{ type: 'file_search', file_ids: [fileId] }],
});

// ✅ GOOD: Specific query
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Find the monthly subscription pricing for the premium plan in the 2025 pricing document',
  tools: [{ type: 'file_search', file_ids: [fileId] }],
});

// ✅ ALSO GOOD: Filter low-confidence results
response.output.forEach(item => {
  if (item.type === 'file_search_call') {
    const highConfidence = item.results.filter(r => r.score > 0.7);
    console.log('High confidence results:', highConfidence);
  }
});
```

**Prevention:**
- Use specific, detailed queries
- Upload high-quality documents (PDFs, Markdown)
- Filter results by confidence score (> 0.7)
- Provide context in query

---

## 6. Variable Substitution Errors (Reusable Prompts)

**Error:**
Variables not replaced in prompt templates

**Cause:**
Incorrect variable syntax or missing values

**Solution:**
```typescript
// ❌ BAD: Incorrect variable syntax
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Hello {username}', // Not supported directly
});

// ✅ GOOD: Use template literals
const username = 'Alice';
const response = await openai.responses.create({
  model: 'gpt-5',
  input: `Hello ${username}`, // ✅ JavaScript template literal
});

// ✅ ALSO GOOD: Build message dynamically
function buildPrompt(vars: Record<string, string>) {
  return `Hello ${vars.username}, your order ${vars.orderId} is ready.`;
}

const response = await openai.responses.create({
  model: 'gpt-5',
  input: buildPrompt({ username: 'Alice', orderId: '12345' }),
});
```

**Prevention:**
- Use JavaScript template literals
- Validate all variables before substitution
- Provide defaults for optional variables

---

## 7. Chat Completions Migration Breaking Changes

**Errors:**
- `messages parameter not found`
- `choices is undefined`
- `system role not recognized`

**Cause:**
Using Chat Completions syntax with Responses API

**Solution:**
```typescript
// ❌ BAD: Chat Completions syntax
const response = await openai.responses.create({
  model: 'gpt-5',
  messages: [{ role: 'system', content: 'You are helpful.' }], // Wrong
});
console.log(response.choices[0].message.content); // Wrong

// ✅ GOOD: Responses syntax
const response = await openai.responses.create({
  model: 'gpt-5',
  input: [{ role: 'developer', content: 'You are helpful.' }], // ✅
});
console.log(response.output_text); // ✅
```

**Breaking Changes:**
| Chat Completions | Responses API |
|-----------------|---------------|
| `messages` | `input` |
| `system` role | `developer` role |
| `choices[0].message.content` | `output_text` |
| `/v1/chat/completions` | `/v1/responses` |

**Prevention:**
- Read migration guide: `references/migration-guide.md`
- Update all references systematically
- Test thoroughly after migration

---

## 8. Cost Tracking Confusion

**Problem:**
Billing different than expected

**Cause:**
Not accounting for tool tokens and conversation storage

**Explanation:**
- **Chat Completions**: input tokens + output tokens
- **Responses API**: input tokens + output tokens + tool tokens + conversation storage

**Solution:**
```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Hello',
  store: false, // ✅ Disable storage if not needed
  tools: [{ type: 'code_interpreter' }],
});

// Monitor usage
console.log('Input tokens:', response.usage.prompt_tokens);
console.log('Output tokens:', response.usage.completion_tokens);
console.log('Tool tokens:', response.usage.tool_tokens);
console.log('Total tokens:', response.usage.total_tokens);

// Calculate cost
const inputCost = response.usage.prompt_tokens * 0.00001; // Example rate
const outputCost = response.usage.completion_tokens * 0.00003;
const toolCost = response.usage.tool_tokens * 0.00002;
const totalCost = inputCost + outputCost + toolCost;
console.log('Estimated cost: $' + totalCost.toFixed(4));
```

**Prevention:**
- Monitor `usage.tool_tokens` in responses
- Set `store: false` for one-off requests
- Track conversation count (storage costs)
- Implement cost alerts

---

## Common Error Response Formats

### Authentication Error
```json
{
  "error": {
    "type": "authentication_error",
    "message": "Invalid API key"
  }
}
```

### Rate Limit Error
```json
{
  "error": {
    "type": "rate_limit_error",
    "message": "Rate limit exceeded",
    "retry_after": 5
  }
}
```

### Invalid Request Error
```json
{
  "error": {
    "type": "invalid_request_error",
    "message": "Conversation conv_xyz not found"
  }
}
```

### Server Error
```json
{
  "error": {
    "type": "server_error",
    "message": "Internal server error"
  }
}
```

---

## General Error Handling Pattern

```typescript
async function handleResponsesAPI(input: string) {
  try {
    const response = await openai.responses.create({
      model: 'gpt-5',
      input,
    });

    return response.output_text;
  } catch (error: any) {
    // Handle specific errors
    switch (error.type) {
      case 'rate_limit_error':
        console.error('Rate limited, retry after:', error.retry_after);
        break;
      case 'mcp_connection_error':
        console.error('MCP server failed:', error.message);
        break;
      case 'code_interpreter_timeout':
        console.error('Code execution timed out, use background mode');
        break;
      case 'authentication_error':
        console.error('Invalid API key');
        break;
      default:
        console.error('Unexpected error:', error.message);
    }

    throw error; // Re-throw or handle
  }
}
```

---

## Prevention Checklist

- [ ] Use conversation IDs for multi-turn interactions
- [ ] Provide valid MCP server URLs and tokens
- [ ] Use `background: true` for tasks > 30 seconds
- [ ] Implement exponential backoff for rate limits
- [ ] Use specific queries for file search
- [ ] Use template literals for variable substitution
- [ ] Update Chat Completions syntax to Responses syntax
- [ ] Monitor `usage.tool_tokens` and conversation count

---

## Getting Help

If you encounter an error not covered here:

1. Check official docs: https://platform.openai.com/docs/api-reference/responses
2. Search OpenAI Community: https://community.openai.com
3. Contact OpenAI Support: https://help.openai.com

---

**Last Updated**: 2025-10-25
