# google-gemini-api

**Google Gemini API Skill** for Claude Code CLI

**Status**: Phase 2 Complete ✅
**Latest SDK**: @google/genai@1.27.0 (⚠️ NOT @google/generative-ai which is DEPRECATED)
**API Coverage**: Text Generation, Multimodal, Function Calling, Streaming, Thinking Mode, **Context Caching**, **Code Execution**, **Grounding with Google Search**

---

## ⚠️ CRITICAL: SDK Migration Warning

**DEPRECATED**: `@google/generative-ai` (sunset Nov 30, 2025)
**CURRENT**: `@google/genai` v1.27+ (use this!)

If you see code using `@google/generative-ai`, it's outdated! This skill uses the **correct current SDK**.

---

## What This Skill Does

This skill provides comprehensive knowledge for building applications with **Google Gemini API** using the **correct current SDK** (@google/genai v1.27+) and **accurate 2025 model information**.

### Key Capabilities

### Phase 1 - Core Features
✅ **Text Generation** with Gemini 2.5 Pro/Flash/Flash-Lite (GA models)
✅ **Streaming** with Server-Sent Events (SSE) and async iteration
✅ **Multimodal inputs** (text + images + video + audio + PDFs)
✅ **Function calling** (basic + parallel execution)
✅ **Thinking mode** (adaptive reasoning on 2.5 models)
✅ **System instructions** for behavior guidance
✅ **Multi-turn chat** (conversation history management)
✅ Both **Node.js SDK** (@google/genai) and **fetch-based** (Cloudflare Workers) approaches
✅ **Accurate context windows**: 1,048,576 input / 65,536 output tokens (NOT 2M for 2.5 models!)

### Phase 2 - Advanced Features
✅ **Context Caching** (cost optimization with TTL-based caching - up to 90% savings)
✅ **Code Execution** (built-in Python sandbox for data analysis and computation)
✅ **Grounding with Google Search** (real-time web information + citations)

---

## Auto-Trigger Keywords

### Primary Keywords (Core API)
- `gemini api`
- `google gemini`
- `@google/genai`
- `gemini-2.5-pro`
- `gemini-2.5-flash`
- `gemini-2.5-flash-lite`
- `genai sdk`
- `google ai`
- `gemini sdk`

### Model Names
- `gemini 2.5`
- `gemini 2.0`
- `gemini pro`
- `gemini flash`
- `gemini flash lite`

### Text Generation
- `gemini text generation`
- `generate content gemini`
- `gemini chat`
- `gemini completion`
- `gemini response`

### Streaming
- `gemini streaming`
- `stream gemini`
- `gemini sse`
- `server-sent events gemini`
- `async iteration gemini`
- `streaming tokens gemini`

### Multimodal Keywords
- `gemini multimodal`
- `gemini vision`
- `gemini image`
- `gemini video`
- `gemini audio`
- `gemini pdf`
- `image understanding gemini`
- `analyze image gemini`
- `video understanding gemini`
- `audio transcription gemini`
- `pdf parsing gemini`

### Function Calling
- `function calling gemini`
- `gemini tools`
- `tool calling gemini`
- `function declarations gemini`
- `parallel function calling gemini`
- `compositional function calling`
- `gemini tool use`

### Thinking Mode
- `thinking mode gemini`
- `gemini thinking`
- `adaptive reasoning gemini`
- `thinking budget gemini`
- `gemini reasoning`

### System Instructions & Chat
- `system instructions gemini`
- `gemini system prompt`
- `multi-turn gemini`
- `conversation history gemini`
- `chat history gemini`
- `gemini chat sdk`

### Configuration
- `gemini temperature`
- `gemini top-p`
- `gemini top-k`
- `stop sequences gemini`
- `generation config gemini`
- `response mime type gemini`

### Context Caching (Phase 2)
- `context caching gemini`
- `gemini caching`
- `gemini cache ttl`
- `prompt caching gemini`
- `cache tokens gemini`
- `gemini cost optimization`
- `reduce cost gemini`
- `gemini cache video`
- `cache documents gemini`
- `90% savings gemini`

### Code Execution (Phase 2)
- `code execution gemini`
- `gemini python`
- `gemini code interpreter`
- `run code gemini`
- `executable code gemini`
- `gemini data analysis`
- `gemini calculations`
- `gemini pandas`
- `gemini numpy`
- `gemini matplotlib`
- `generate and run code`

### Grounding with Google Search (Phase 2)
- `grounding gemini`
- `google search gemini`
- `gemini grounding`
- `real-time information gemini`
- `gemini search retrieval`
- `gemini citations`
- `fact-checking gemini`
- `gemini sources`
- `web search gemini`
- `current events gemini`

### SDK Migration
- `@google/generative-ai deprecated`
- `migrate gemini sdk`
- `gemini sdk migration`
- `generative-ai deprecated`
- `update gemini sdk`

### Context Window
- `gemini context window`
- `gemini token limit`
- `gemini 1m tokens`
- `gemini 2m tokens` (⚠️ only Gemini 1.5 Pro has 2M, NOT 2.5 models!)
- `context length gemini`

### Error Keywords
- `gemini api error`
- `gemini 401`
- `gemini 429`
- `gemini rate limit`
- `invalid api key gemini`
- `model not found gemini`
- `gemini context window exceeded`
- `function calling error gemini`
- `tool schema invalid gemini`
- `streaming parse error gemini`
- `multimodal format error gemini`
- `thinking mode not supported`
- `deprecated sdk error`
- `@google/generative-ai not found`

### Error Keywords - Phase 2
- `cache not found gemini`
- `cache ttl expired`
- `invalid model version gemini`
- `code execution failed gemini`
- `execution timeout gemini`
- `python package not available gemini`
- `grounding requires google cloud`
- `grounding not working gemini`
- `no grounding metadata`

### Integration Keywords
- `nextjs gemini`
- `react gemini`
- `cloudflare workers gemini`
- `vercel gemini`
- `gemini backend`
- `gemini server`
- `gemini edge runtime`

### Comparison Keywords
- `gemini vs openai`
- `gemini vs claude`
- `gemini vs gpt`
- `google ai vs openai`

---

## When to Use This Skill

### ✅ Use google-gemini-api When:
- Building **AI applications** with Google's Gemini models
- Need **multimodal AI** (text + images + video + audio + PDFs)
- Implementing **long-context applications** (1M+ tokens)
- Using **thinking mode** for complex reasoning
- Need **function calling** with parallel execution
- Want **streaming responses** for better UX
- Deploying to **Cloudflare Workers** or other edge runtimes
- Building **chat applications** with conversation history
- Need to **migrate from deprecated** @google/generative-ai

### ❌ Don't Use google-gemini-api When:
- You specifically need **embeddings** (see separate `google-gemini-embeddings` skill for text-embedding-004)
- You're using a different AI API provider (OpenAI, Anthropic Claude, etc.)

---

## Quick Example

### Text Generation (Node.js SDK)
```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Explain quantum computing in simple terms'
});

console.log(response.text);
```

### Text Generation (Fetch - Cloudflare Workers)
```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Explain quantum computing in simple terms' }] }]
    }),
  }
);

const data = await response.json();
console.log(data.candidates[0].content.parts[0].text);
```

### Streaming
```typescript
const response = await ai.models.generateContentStream({
  model: 'gemini-2.5-flash',
  contents: 'Write a 200-word story about AI'
});

for await (const chunk of response) {
  process.stdout.write(chunk.text);
}
```

---

## Known Issues Prevented

| Issue | Cause | Solution in Skill |
|-------|-------|-------------------|
| Using deprecated SDK | Installing @google/generative-ai | Prominent warnings + migration guide |
| Wrong context window claims | Claiming 2M tokens for 2.5 models | Accurate: 1,048,576 input tokens |
| Model not found errors | Using old/wrong model names | Current model list (gemini-2.5-pro/flash/flash-lite) |
| Chat not working with fetch | Chat is SDK-only feature | Document SDK requirement for chat helpers |
| Function calling on Flash-Lite | Model doesn't support it | Model capabilities matrix |
| Invalid API key (401) | Missing GEMINI_API_KEY | Environment setup guide |
| Rate limit errors (429) | Too many requests | Exponential backoff pattern |
| Streaming parse errors | Incorrect SSE parsing | Complete SSE implementation |
| Multimodal format errors | Wrong image/video encoding | Base64/URL examples |
| Function schema errors | Invalid OpenAPI subset | Schema validation examples |
| Thinking mode on old models | Only 2.5 models support it | Model feature matrix |
| Parameter conflicts | Using unsupported params | Generation config reference |
| Token counting errors | Multimodal token estimation | Token counting guide |
| System instruction placement | Wrong position in request | Correct structure examples |
| Parallel function call errors | Dependencies not handled | Compositional vs parallel guide |

---

## Current Models (2025)

### Gemini 2.5 Series (General Availability)
- **gemini-2.5-pro**: State-of-the-art thinking model (1,048,576 input / 65,536 output tokens)
- **gemini-2.5-flash**: Best price-performance (1,048,576 input / 65,536 output tokens)
- **gemini-2.5-flash-lite**: Cost-optimized, fastest (1,048,576 input / 65,536 output tokens)

### Feature Matrix
| Feature | Pro | Flash | Flash-Lite |
|---------|-----|-------|------------|
| Thinking Mode | ✅ | ✅ | ✅ |
| Function Calling | ✅ | ✅ | ❌ |
| Multimodal | ✅ | ✅ | ✅ |
| Streaming | ✅ | ✅ | ✅ |
| System Instructions | ✅ | ✅ | ✅ |

**⚠️ Note**: Gemini 2.5 Flash-Lite does NOT support function calling!

---

## Token Efficiency

### Without Skill
- Research APIs + SDK: ~22,000 tokens
- Fall into deprecated SDK trap: +5,000 tokens (debugging)
- Context window confusion: +3,000 tokens (debugging)
- **Total: ~30,000 tokens**

### With Skill
- Skill discovery + implementation: ~10,500 tokens
- Zero debugging (all errors prevented)
- **Total: ~10,500 tokens**

**Savings: ~65% (19,500 tokens)**

---

## What You Get

### SKILL.md Content
- Complete API reference (1200+ lines)
- Gemini 2.5 specific guidance
- Streaming patterns (SDK + fetch)
- Function calling (basic + parallel)
- Multimodal examples (images, video, audio, PDFs)
- Thinking mode configuration
- System instructions & chat
- SDK migration guide
- Top 15 errors with solutions
- Production best practices

### 11 Templates
1. package.json (dependencies)
2. text-generation-basic.ts (SDK)
3. text-generation-fetch.ts (Cloudflare Workers)
4. streaming-chat.ts (SDK with async iteration)
5. streaming-fetch.ts (SSE parsing)
6. multimodal-image.ts (vision)
7. multimodal-video-audio.ts (video/audio understanding)
8. function-calling-basic.ts (tool use)
9. function-calling-parallel.ts (parallel execution)
10. thinking-mode.ts (configure thinking budget)
11. cloudflare-worker.ts (complete Worker example)

### 8 Reference Docs
1. models-guide.md (2.5 Pro/Flash/Flash-Lite comparison with ACCURATE context windows)
2. sdk-migration-guide.md (complete migration from deprecated SDK)
3. function-calling-patterns.md (tool use best practices)
4. multimodal-guide.md (images, video, audio, PDFs)
5. thinking-mode-guide.md (when to use, budget configuration)
6. generation-config.md (all parameters explained)
7. streaming-patterns.md (SSE implementation for SDK + fetch)
8. top-errors.md (15+ documented errors with solutions)

### 1 Script
- check-versions.sh (verify @google/genai version, warn if using deprecated SDK)

---

## Installation

```bash
# From claude-skills repo root
./scripts/install-skill.sh google-gemini-api

# Verify installation
ls -la ~/.claude/skills/google-gemini-api
```

---

## Quick Reference

### Package Version
```bash
npm install @google/genai@1.27.0
```

⚠️ **NOT**:
```bash
npm install @google/generative-ai  # DEPRECATED!
```

### Environment Variables
```bash
export GEMINI_API_KEY="..."
```

### Models Overview (2025)
- **Gemini 2.5 Pro**: `gemini-2.5-pro` (thinking, function calling, multimodal)
- **Gemini 2.5 Flash**: `gemini-2.5-flash` (best price-performance)
- **Gemini 2.5 Flash-Lite**: `gemini-2.5-flash-lite` (fastest, no function calling)

### Context Windows (ACCURATE)
- **Gemini 2.5 models**: 1,048,576 input / 65,536 output tokens
- **NOT 2M tokens** (only Gemini 1.5 Pro has 2M, which is an older model)

---

## Official Documentation

- **Gemini API Overview**: https://ai.google.dev/gemini-api/docs
- **@google/genai SDK**: https://github.com/googleapis/js-genai
- **Models Guide**: https://ai.google.dev/gemini-api/docs/models
- **Text Generation**: https://ai.google.dev/gemini-api/docs/text-generation
- **Function Calling**: https://ai.google.dev/gemini-api/docs/function-calling
- **Multimodal**: https://ai.google.dev/gemini-api/docs/vision
- **Streaming**: https://ai.google.dev/gemini-api/docs/streaming
- **Migration Guide**: https://ai.google.dev/gemini-api/docs/migrate-to-genai

---

**Production Validated**: Templates tested with @google/genai@1.27.0
**Last Updated**: 2025-10-25
**Maintainer**: Jeremy Dawes | Jezweb
