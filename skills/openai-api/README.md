# openai-api

**OpenAI API Skill** for Claude Code CLI

**Status**: Production Ready ✅
**Latest SDK**: openai@6.7.0
**API Coverage**: Chat Completions, Embeddings, Images, Audio, Moderation

---

## What This Skill Does

This skill provides comprehensive knowledge for building applications with OpenAI's **traditional/stateless APIs** - Chat Completions, Embeddings, Images (DALL-E 3), Audio (Whisper + TTS), and Moderation.

### Key Capabilities

✅ **Chat Completions API** with GPT-5, GPT-4o, GPT-4 Turbo
✅ **GPT-5 specific parameters** (reasoning_effort, verbosity)
✅ **Streaming** with Server-Sent Events (SSE)
✅ **Function calling** (custom tools)
✅ **Structured outputs** (JSON schema validation)
✅ **Vision** (image understanding with GPT-4o)
✅ **Embeddings** (text-embedding-3-small/large with custom dimensions)
✅ **Images** (DALL-E 3 generation + editing with transparent backgrounds)
✅ **Audio** (Whisper transcription + TTS with 11 voices)
✅ **Moderation** (content safety checks)
✅ Both **Node.js SDK** and **fetch-based** (Cloudflare Workers) approaches

---

## Auto-Trigger Keywords

### Primary Keywords (Chat Completions)
- `openai api`
- `chat completions`
- `chatgpt api`
- `gpt-5`
- `gpt-5-mini`
- `gpt-5-nano`
- `gpt-4o`
- `gpt-4 turbo`
- `openai sdk`
- `openai npm`

### Streaming Keywords
- `openai streaming`
- `stream chat completions`
- `sse streaming openai`
- `server-sent events openai`
- `streaming tokens openai`

### Function Calling & Structured Output
- `function calling openai`
- `openai tools`
- `tool calling openai`
- `structured output openai`
- `json mode openai`
- `json schema openai`
- `openai validation`

### Vision Keywords
- `gpt-4o vision`
- `image understanding openai`
- `vision api openai`
- `analyze image gpt`
- `multimodal gpt`

### GPT-5 Specific
- `reasoning_effort`
- `verbosity openai`
- `gpt-5 parameters`
- `gpt-5 limitations`
- `no temperature gpt-5`
- `no top_p gpt-5`

### Embeddings Keywords
- `openai embeddings`
- `text-embedding-3-small`
- `text-embedding-3-large`
- `text-embedding-ada-002`
- `embeddings api`
- `vector embeddings openai`
- `custom dimensions embeddings`
- `embeddings batch processing`
- `embeddings rag`

### Images Keywords
- `dall-e 3`
- `dall-e-3`
- `image generation openai`
- `openai images`
- `generate image gpt`
- `dalle api`
- `image editing openai`
- `transparent background dalle`
- `dall-e quality`
- `dall-e hd`

### Audio Keywords
- `whisper api`
- `openai transcription`
- `audio transcription openai`
- `whisper transcription`
- `openai tts`
- `text to speech openai`
- `speech synthesis openai`
- `tts-1`
- `tts-1-hd`
- `gpt-4o-mini-tts`
- `openai voices`
- `alloy voice`
- `nova voice`

### Moderation Keywords
- `openai moderation`
- `content moderation openai`
- `moderation api`
- `content safety openai`
- `omni-moderation-latest`

### SDK & Implementation
- `openai node`
- `openai typescript`
- `openai javascript`
- `openai fetch`
- `openai cloudflare workers`
- `openai browser`

### Error Keywords
- `openai rate limit`
- `openai 429`
- `openai 401`
- `rate limit exceeded openai`
- `invalid api key openai`
- `function calling error openai`
- `tool schema invalid openai`
- `streaming parse error openai`
- `sse error openai`
- `embeddings dimension error`
- `whisper format error`
- `tts voice not found`
- `dall-e generation failed`
- `token limit exceeded openai`
- `api key exposure`

### Integration Keywords
- `nextjs openai`
- `react openai`
- `cloudflare workers openai`
- `vercel openai`
- `openai backend`
- `openai server`

### Comparison Keywords
- `openai vs responses api`
- `chat completions vs responses`
- `stateless openai`
- `traditional openai api`

---

## When to Use This Skill

### ✅ Use openai-api When:
- Building **traditional/stateless** AI integrations
- Simple **one-off text generation** or chat
- Implementing **embeddings** for RAG/search
- Generating **images** with DALL-E 3
- **Audio** processing (Whisper transcription, TTS)
- **Content moderation** checks
- Need **multi-provider** flexibility (can switch to Anthropic/Google later)
- Using **Cloudflare Workers** or other edge runtimes
- **No conversation state** management needed

### ❌ Don't Use openai-api When:
- Building **agentic workflows** (use openai-responses skill)
- Need **stateful conversations** with automatic state management
- Want **built-in tools** (Code Interpreter, File Search, Web Search)
- Need **MCP server integration**
- Want **preserved reasoning** across conversation turns
- Implementing **background mode** for long-running tasks

---

## Quick Example

### Chat Completion (Node.js SDK)
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const completion = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [
    { role: 'user', content: 'What are the three laws of robotics?' }
  ],
  reasoning_effort: 'medium',
});

console.log(completion.choices[0].message.content);
```

### Chat Completion (Fetch - Cloudflare Workers)
```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-5',
    messages: [
      { role: 'user', content: 'What are the three laws of robotics?' }
    ],
    reasoning_effort: 'medium',
  }),
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

---

## Known Issues Prevented

| Issue | Cause | Solution |
|-------|-------|----------|
| Rate limit 429 errors | Too many requests | Exponential backoff pattern |
| Invalid API key (401) | Missing OPENAI_API_KEY | Environment variable setup |
| Function schema errors | Invalid tool definition | JSON schema validation |
| Streaming parse errors | Incomplete SSE chunks | Proper SSE parsing |
| Vision encoding errors | Invalid base64 | Correct image encoding |
| Embeddings dimension mismatch | Wrong model dimensions | Verify model specs |
| Audio format errors | Unsupported format | Use mp3/wav/etc |
| TTS voice not found | Invalid voice name | Use one of 11 voices |
| Token limit exceeded | Input too long | Truncate or chunk |
| API key exposure | Client-side key | Server-side proxy |

---

## Relationship to openai-responses

### openai-api (This Skill)
**Traditional/stateless API** for:
- Simple chat completions
- Embeddings
- Images (DALL-E)
- Audio (Whisper/TTS)
- Moderation

### openai-responses Skill
**Stateful/agentic API** for:
- Automatic conversation state
- Preserved reasoning across turns
- Built-in tools (Code Interpreter, File Search, Web Search, Image Generation)
- MCP server integration
- Background mode

**Use both**: openai-api for simple tasks, openai-responses for complex agentic workflows

---

## Token Efficiency

### Without Skill
- Research all APIs: ~21,000 tokens
- Implementation + debugging: Hours of trial and error

### With Skill
- Skill discovery + templates: ~8,500 tokens
- Copy-paste ready code: Minutes to working implementation

**Savings: ~59% (12,500 tokens)**

---

## What You Get

### SKILL.md Content
- Complete API reference (900+ lines)
- GPT-5 specific guidance
- Streaming patterns
- Function calling
- Structured outputs
- Vision examples
- Embeddings guide
- Images guide
- Audio guide
- Moderation guide
- Top 10 errors with solutions
- Production best practices

### 14 Templates
1. chat-completion-basic.ts
2. chat-completion-nodejs.ts
3. streaming-chat.ts
4. streaming-fetch.ts
5. function-calling.ts
6. structured-output.ts
7. vision-gpt4o.ts
8. embeddings.ts
9. image-generation.ts
10. image-editing.ts
11. audio-transcription.ts
12. text-to-speech.ts
13. moderation.ts
14. cloudflare-worker.ts
15. package.json

### 10 Reference Docs
1. models-guide.md (GPT-5/4o/4-turbo comparison)
2. function-calling-patterns.md
3. structured-output-guide.md
4. embeddings-guide.md
5. images-guide.md
6. audio-guide.md
7. error-handling.md
8. rate-limits.md
9. cost-optimization.md
10. top-errors.md

### 1 Script
- check-versions.sh (verify package versions)

---

## Installation

```bash
# From claude-skills repo root
./scripts/install-skill.sh openai-api

# Verify installation
ls -la ~/.claude/skills/openai-api
```

---

## Quick Reference

### Package Version
```bash
npm install openai@6.7.0
```

### Environment Variables
```bash
export OPENAI_API_KEY="sk-..."
```

### Models Overview
- **GPT-5**: gpt-5, gpt-5-mini, gpt-5-nano (reasoning_effort, verbosity)
- **GPT-4o**: gpt-4o (vision capable)
- **GPT-4 Turbo**: gpt-4-turbo
- **Embeddings**: text-embedding-3-small (1536), text-embedding-3-large (3072)
- **Images**: dall-e-3
- **Audio**: whisper-1 (transcription), tts-1/tts-1-hd/gpt-4o-mini-tts (speech)
- **Moderation**: omni-moderation-latest

---

## Official Documentation

- **Chat Completions**: https://platform.openai.com/docs/api-reference/chat/create
- **Embeddings**: https://platform.openai.com/docs/api-reference/embeddings/create
- **Images**: https://platform.openai.com/docs/api-reference/images
- **Audio**: https://platform.openai.com/docs/api-reference/audio
- **Moderation**: https://platform.openai.com/docs/api-reference/moderations/create
- **GPT-5 Guide**: https://platform.openai.com/docs/guides/latest-model
- **Rate Limits**: https://platform.openai.com/docs/guides/rate-limits
- **Error Reference**: https://platform.openai.com/docs/guides/error-codes

---

**Production Validated**: Templates tested with openai@6.7.0
**Last Updated**: 2025-10-25
**Maintainer**: Jeremy Dawes | Jezweb
