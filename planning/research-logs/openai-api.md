# OpenAI API Research Log

**Created**: 2025-10-25
**Skill**: openai-api
**Status**: Research Complete ✅
**Package Version**: openai@6.7.0 (latest)

---

## Research Summary

Comprehensive research on all core OpenAI APIs for creating a traditional/stateless API skill that complements the existing openai-responses skill (stateful/agentic workflows).

### APIs Covered
1. ✅ Chat Completions API
2. ✅ Embeddings API
3. ✅ Images API (DALL-E 3)
4. ✅ Audio API (Whisper + TTS)
5. ✅ Moderation API
6. ✅ Streaming (Server-Sent Events)
7. ✅ Rate Limits & Errors

---

## 1. Chat Completions API

**Endpoint**: `POST /v1/chat/completions`

### Models

#### GPT-5 Series (Released August 2025)
- **gpt-5**: Full-featured reasoning model
- **gpt-5-mini**: Cost-effective alternative
- **gpt-5-nano**: Smallest/fastest variant

**GPT-5 Unique Parameters**:
- `reasoning_effort`: "minimal" | "low" | "medium" | "high"
- `verbosity`: "low" | "medium" | "high"

**GPT-5 Limitations**:
- ❌ No `temperature` support
- ❌ No `top_p` support
- ❌ No `logprobs` support
- ❌ Does NOT pass Chain of Thought (CoT) between turns (use Responses API for that)

#### GPT-4o Series
- **gpt-4o**: Multimodal (text + vision)
- **gpt-4-turbo**: Fast GPT-4 variant

### Core Parameters
```json
{
  "model": "gpt-5",
  "messages": [
    {"role": "developer", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "reasoning_effort": "medium",
  "verbosity": "medium"
}
```

### Response Structure
```json
{
  "id": "chatcmpl-xyz",
  "object": "chat.completion",
  "created": 1741569952,
  "model": "gpt-4.1-2025-04-14",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I assist you today?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 19,
    "completion_tokens": 10,
    "total_tokens": 29
  }
}
```

### Function Calling (Tools)
```json
{
  "tools": [
    {
      "type": "custom",
      "custom": {
        "name": "code_exec",
        "description": "Executes arbitrary python code"
      }
    }
  ]
}
```

### Vision (GPT-4o)
Supports image understanding with GPT-4o:
```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "What's in this image?"},
        {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
      ]
    }
  ]
}
```

### Streaming
Set `stream: true` for Server-Sent Events (SSE):
```json
{
  "model": "gpt-5",
  "messages": [...],
  "stream": true
}
```

Returns SSE chunks:
```
data: {"choices": [{"delta": {"content": "Hello"}}]}
data: {"choices": [{"delta": {"content": " world"}}]}
data: [DONE]
```

---

## 2. Embeddings API

**Endpoint**: `POST /v1/embeddings`

### Models
- **text-embedding-3-large**: 3072 dimensions (default), highest quality
- **text-embedding-3-small**: 1536 dimensions (default), cost-effective
- **text-embedding-ada-002**: Legacy model (1536 dimensions)

### Key Features
- **Batch processing**: Multiple inputs in single request
- **Custom dimensions**: `dimensions` parameter for text-embedding-3 models
- **Token limits**:
  - 8192 tokens per input max
  - 300,000 tokens summed across all inputs per request
  - Arrays must be ≤2048 dimensions

### Request
```json
{
  "input": "The food was delicious and the waiter...",
  "model": "text-embedding-3-small",
  "dimensions": 256,
  "encoding_format": "float"
}
```

### Response
```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [0.0023064255, -0.009327292, ...],
      "index": 0
    }
  ],
  "model": "text-embedding-3-small",
  "usage": {
    "prompt_tokens": 8,
    "total_tokens": 8
  }
}
```

### Dimension Reduction Pattern
Can truncate embeddings post-generation:
```python
# Get full embedding
response = client.embeddings.create(
    model="text-embedding-3-small",
    input="Testing 123"
)
# Truncate to 256 dimensions
cut_dim = response.data[0].embedding[:256]
# Normalize (L2)
norm_dim = normalize_l2(cut_dim)
```

---

## 3. Images API

### DALL-E 3 Generation

**Endpoint**: `POST /v1/images/generations`

#### Request
```json
{
  "model": "dall-e-3",
  "prompt": "a white siamese cat",
  "size": "1024x1024",
  "quality": "standard",
  "style": "vivid",
  "response_format": "url",
  "n": 1
}
```

#### Parameters
- **size**: "1024x1024" | "1024x1536" | "1536x1024" | "1024x1792" | "1792x1024"
- **quality**: "standard" | "hd" (HD has finer details, costs more)
- **style**: "vivid" (hyper-real) | "natural" (less dramatic)
- **response_format**: "url" | "b64_json"
- **n**: 1-10 images (DALL-E 3 only supports n=1)

#### Response
```json
{
  "created": 1700000000,
  "data": [
    {
      "url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
      "revised_prompt": "A pristine white Siamese cat with striking blue eyes..."
    }
  ]
}
```

### Image Editing

**Endpoint**: `POST /v1/images/edits`

#### Request (multipart/form-data)
```
model: gpt-image-1
image: [woman.jpg binary]
image_2: [logo.png binary]
prompt: "Add the logo to the woman's top, as if stamped into the fabric."
input_fidelity: high
size: 1024x1024
quality: auto
format: png
background: transparent
output_compression: 50
```

#### Advanced Features
- **Transparent backgrounds**: Set `background: "transparent"` (works with png/webp)
- **Multiple images**: Can provide mask/overlay images
- **Compression**: `output_compression` for jpeg/webp (0-100%)

---

## 4. Audio API

### Whisper Transcription

**Endpoint**: `POST /v1/audio/transcriptions`

**Models**: whisper-1

**Supported Formats**: mp3, mp4, mpeg, mpga, m4a, wav, webm

### Text-to-Speech (TTS)

**Endpoint**: `POST /v1/audio/speech`

#### Models
- **tts-1**: Standard quality, optimized for real-time
- **tts-1-hd**: High definition quality
- **gpt-4o-mini-tts**: Latest model with instruction support

#### Voices (11 total)
- alloy
- ash
- ballad
- coral
- echo
- fable
- onyx
- nova
- sage
- shimmer
- verse

#### Request
```json
{
  "model": "gpt-4o-mini-tts",
  "input": "The quick brown fox jumped over the lazy dog.",
  "voice": "alloy",
  "instructions": "Speak in a calm, soothing tone.",
  "response_format": "mp3",
  "speed": 1.0,
  "stream_format": "audio"
}
```

#### Parameters
- **input**: Text to convert (max 4096 chars)
- **voice**: One of 11 voices
- **instructions**: Voice control (NOT supported by tts-1/tts-1-hd)
- **response_format**: mp3 | opus | aac | flac | wav | pcm
- **speed**: 0.25 to 4.0 (default 1.0)
- **stream_format**: "sse" | "audio" (sse NOT supported by tts-1/tts-1-hd)

---

## 5. Moderation API

**Endpoint**: `POST /v1/moderations`

### Request
```json
{
  "input": "I want to kill them.",
  "model": "omni-moderation-latest"
}
```

### Response
```json
{
  "id": "modr-AB8CjOTu2jiq12hp1AQPfeqFWaORR",
  "model": "text-moderation-007",
  "results": [
    {
      "flagged": true,
      "categories": {
        "sexual": false,
        "hate": false,
        "harassment": true,
        "self-harm": false,
        "sexual/minors": false,
        "hate/threatening": false,
        "violence/graphic": false,
        "self-harm/intent": false,
        "self-harm/instructions": false,
        "harassment/threatening": true,
        "violence": true
      },
      "category_scores": {
        "sexual": 0.000011726,
        "hate": 0.2270666,
        "harassment": 0.5215635,
        "violence": 0.9971135
      }
    }
  ]
}
```

### Categories
- sexual
- hate
- harassment
- self-harm
- sexual/minors
- hate/threatening
- violence/graphic
- self-harm/intent
- self-harm/instructions
- harassment/threatening
- violence

---

## 6. Streaming (Server-Sent Events)

### SSE Format
```
event: thread.created
data: {"id": "thread_123", "object": "thread", ...}

event: done
data: [DONE]

event: error
data: {"error": {"message": "..."}}
```

### Chat Completions Streaming
When `stream: true`:
```
data: {"choices": [{"delta": {"role": "assistant"}}]}
data: {"choices": [{"delta": {"content": "Hello"}}]}
data: {"choices": [{"delta": {"content": " world"}}]}
data: {"choices": [{"finish_reason": "stop"}]}
data: [DONE]
```

### Image Generation Streaming
```json
{
  "type": "image_generation.partial_image",
  "b64_json": "...",
  "partial_image_index": 0,
  "created_at": 1620000000,
  "size": "1024x1024",
  "quality": "high"
}
```

---

## 7. Rate Limits & Errors

### Rate Limit Tiers
- **RPM**: Requests Per Minute
- **TPM**: Tokens Per Minute
- **IPM**: Images Per Minute
- **Audio MB/min**: Audio megabytes per minute
- **Batch tokens/day**: For batch API

### Common Limits (varies by tier)
- Free tier: Very limited
- Tier 1-5: Increasing limits based on usage/payment

### Rate Limit Headers
```
x-ratelimit-limit-requests
x-ratelimit-limit-tokens
x-ratelimit-remaining-requests
x-ratelimit-remaining-tokens
x-ratelimit-reset-requests
x-ratelimit-reset-tokens
```

### 429 Rate Limit Error
```json
{
  "error": {
    "message": "Rate limit reached",
    "type": "rate_limit_error",
    "code": "rate_limit_exceeded"
  }
}
```

### Handling Rate Limits
**Exponential Backoff Pattern** (Python example):
```python
import backoff
import openai
from openai import OpenAI
client = OpenAI()

@backoff.on_exception(backoff.expo, openai.RateLimitError)
def completions_with_backoff(**kwargs):
    return client.completions.create(**kwargs)
```

---

## 8. SDK vs Fetch Comparison

### Node.js SDK
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const completion = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [{ role: 'user', content: 'Hello' }],
});
```

### Fetch-based (Cloudflare Workers)
```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-5',
    messages: [{ role: 'user', content: 'Hello' }],
  }),
});

const data = await response.json();
```

---

## 9. Known Errors to Document

### Top 10 Common Errors

1. **Rate Limit Error (429)**
   - Cause: Too many requests
   - Solution: Implement exponential backoff

2. **Invalid API Key (401)**
   - Cause: Missing/incorrect OPENAI_API_KEY
   - Solution: Verify environment variable

3. **Function Calling Schema Mismatch**
   - Cause: Tool definition doesn't match model expectations
   - Solution: Validate JSON schema

4. **Streaming Parse Error**
   - Cause: Incomplete SSE chunks
   - Solution: Proper SSE parsing logic

5. **Vision Image Encoding Error**
   - Cause: Invalid base64 format
   - Solution: Ensure proper base64 encoding

6. **Embeddings Dimension Mismatch**
   - Cause: Using wrong dimension (1536 vs 3072)
   - Solution: Check model documentation

7. **Audio Format Error**
   - Cause: Unsupported audio format
   - Solution: Use supported formats (mp3, wav, etc.)

8. **TTS Voice Not Found**
   - Cause: Invalid voice name
   - Solution: Use one of 11 supported voices

9. **Token Limit Exceeded**
   - Cause: Input too long
   - Solution: Truncate or chunk input

10. **API Key Exposure**
    - Cause: API key in client-side code
    - Solution: Use server-side proxy

---

## 10. Relationship to openai-responses Skill

### openai-api (This Skill)
**Use when**:
- Traditional stateless API calls
- Simple one-off text generation
- Embeddings for RAG
- Image generation (DALL-E)
- Audio (Whisper/TTS)
- Moderation checks
- No conversation state needed

### openai-responses Skill
**Use when**:
- Stateful conversations (automatic state management)
- Agentic workflows (reasoning + actions)
- Built-in tools (Code Interpreter, File Search, Web Search)
- MCP server integration
- Preserved reasoning across turns
- Background mode for long tasks

### Key Differences
| Feature | Chat Completions | Responses API |
|---------|------------------|---------------|
| State | Stateless | Stateful |
| CoT | No persistence | Preserved across turns |
| Tools | Custom only | Built-in + Custom + MCP |
| Use case | Simple requests | Agentic workflows |
| API | /v1/chat/completions | /v1/responses |

---

## 11. Token Efficiency Analysis

### Estimated Token Savings

**Manual Implementation** (no skill):
- Research OpenAI APIs: ~5000 tokens
- Understand GPT-5 differences: ~2000 tokens
- Learn embeddings API: ~2000 tokens
- Learn images API: ~2000 tokens
- Learn audio API: ~2000 tokens
- Implement streaming: ~2000 tokens
- Handle errors: ~3000 tokens
- Debug issues: ~3000 tokens
- **Total: ~21,000 tokens**

**With Skill**:
- Skill discovery: ~500 tokens
- Read relevant sections: ~4000 tokens
- Copy templates: ~2000 tokens
- Customize: ~2000 tokens
- **Total: ~8,500 tokens**

**Savings: ~59% (12,500 tokens saved)**

---

## 12. Package Information

### Latest Version
```bash
npm view openai version
# 6.7.0
```

### Installation
```bash
npm install openai@latest
```

### TypeScript Support
Fully typed with TypeScript definitions included.

---

## 13. Production Notes

### Security
- ✅ Never expose API keys in client-side code
- ✅ Use environment variables
- ✅ Implement server-side proxy for browser apps
- ✅ Validate all user inputs
- ✅ Use moderation API for user-generated content

### Performance
- ✅ Use streaming for long-form content
- ✅ Batch embeddings requests
- ✅ Cache embeddings/responses when possible
- ✅ Monitor token usage

### Cost Optimization
- ✅ Choose appropriate models (gpt-5-mini vs gpt-5)
- ✅ Use embeddings dimension reduction
- ✅ Implement caching strategies
- ✅ Use batch API for non-urgent requests

---

## 14. Next Steps

1. ✅ Research Complete
2. ⏳ Create skill structure
3. ⏳ Write SKILL.md (900-1000 lines)
4. ⏳ Create 14 templates (both SDK and fetch)
5. ⏳ Create 10 reference docs
6. ⏳ Test and verify
7. ⏳ Commit to git

---

**Research Duration**: ~2.5 hours
**Documentation Quality**: Comprehensive ✅
**Ready for Implementation**: Yes ✅
