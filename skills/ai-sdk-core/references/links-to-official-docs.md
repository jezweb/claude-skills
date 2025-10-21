# AI SDK Core - Official Documentation Links

Organized links to official AI SDK and provider documentation.

---

## AI SDK Core Documentation

### Getting Started

- **Introduction:** https://ai-sdk.dev/docs/introduction
- **AI SDK Core Overview:** https://ai-sdk.dev/docs/ai-sdk-core/overview
- **Foundations:** https://ai-sdk.dev/docs/foundations/overview

### Core Functions

- **Generating Text:** https://ai-sdk.dev/docs/ai-sdk-core/generating-text
- **Streaming Text:** https://ai-sdk.dev/docs/ai-sdk-core/streaming-text
- **Generating Structured Data:** https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
- **Streaming Structured Data:** https://ai-sdk.dev/docs/ai-sdk-core/streaming-structured-data

### Tool Calling & Agents

- **Tools and Tool Calling:** https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
- **Agents Overview:** https://ai-sdk.dev/docs/agents/overview
- **Building Agents:** https://ai-sdk.dev/docs/agents/building-agents

### Advanced Topics (Not Replicated in This Skill)

- **Embeddings:** https://ai-sdk.dev/docs/ai-sdk-core/embeddings
- **Image Generation:** https://ai-sdk.dev/docs/ai-sdk-core/generating-images
- **Transcription (Audio to Text):** https://ai-sdk.dev/docs/ai-sdk-core/generating-transcriptions
- **Speech (Text to Audio):** https://ai-sdk.dev/docs/ai-sdk-core/generating-speech
- **MCP Tools:** https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools
- **Telemetry:** https://ai-sdk.dev/docs/ai-sdk-core/telemetry
- **Generative UI (RSC):** https://ai-sdk.dev/docs/ai-sdk-rsc

---

## Migration & Troubleshooting

- **v4 → v5 Migration Guide:** https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0
- **All Error Types (28 total):** https://ai-sdk.dev/docs/reference/ai-sdk-errors
- **Troubleshooting Guide:** https://ai-sdk.dev/docs/troubleshooting
- **Common Issues:** https://ai-sdk.dev/docs/troubleshooting/common-issues
- **Slow Type Checking:** https://ai-sdk.dev/docs/troubleshooting/common-issues/slow-type-checking

---

## Provider Documentation

### Provider Overview

- **All Providers:** https://ai-sdk.dev/providers/overview
- **Provider Selection Guide:** https://ai-sdk.dev/providers/overview#provider-selection

### OpenAI

- **OpenAI Provider Docs:** https://ai-sdk.dev/providers/ai-sdk-providers/openai
- **OpenAI Platform:** https://platform.openai.com/
- **API Keys:** https://platform.openai.com/api-keys
- **Rate Limits:** https://platform.openai.com/account/rate-limits
- **Pricing:** https://openai.com/api/pricing/

### Anthropic

- **Anthropic Provider Docs:** https://ai-sdk.dev/providers/ai-sdk-providers/anthropic
- **Anthropic Console:** https://console.anthropic.com/
- **Claude Models:** https://docs.anthropic.com/en/docs/models-overview
- **Rate Limits:** https://docs.anthropic.com/en/api/rate-limits
- **Pricing:** https://www.anthropic.com/pricing

### Google

- **Google Provider Docs:** https://ai-sdk.dev/providers/ai-sdk-providers/google
- **Google AI Studio:** https://aistudio.google.com/
- **API Keys:** https://aistudio.google.com/app/apikey
- **Gemini Models:** https://ai.google.dev/models/gemini
- **Pricing:** https://ai.google.dev/pricing

### Cloudflare Workers AI

- **Workers AI Provider (Community):** https://ai-sdk.dev/providers/community-providers/cloudflare-workers-ai
- **Cloudflare Workers AI Docs:** https://developers.cloudflare.com/workers-ai/
- **AI SDK Configuration:** https://developers.cloudflare.com/workers-ai/configuration/ai-sdk/
- **Available Models:** https://developers.cloudflare.com/workers-ai/models/
- **GitHub (workers-ai-provider):** https://github.com/cloudflare/ai/tree/main/packages/workers-ai-provider
- **Pricing:** https://developers.cloudflare.com/workers-ai/platform/pricing/

### Community Providers

- **Community Providers List:** https://ai-sdk.dev/providers/community-providers
- **Ollama:** https://ai-sdk.dev/providers/community-providers/ollama
- **FriendliAI:** https://ai-sdk.dev/providers/community-providers/friendliai
- **LM Studio:** https://ai-sdk.dev/providers/community-providers/lmstudio

---

## Framework Integration

### Next.js

- **Next.js App Router Integration:** https://ai-sdk.dev/docs/getting-started/nextjs-app-router
- **Next.js Pages Router Integration:** https://ai-sdk.dev/docs/getting-started/nextjs-pages-router
- **Next.js Documentation:** https://nextjs.org/docs

### Node.js

- **Node.js Integration:** https://ai-sdk.dev/docs/getting-started/nodejs

### Vercel Deployment

- **Vercel Functions:** https://vercel.com/docs/functions
- **Vercel Streaming:** https://vercel.com/docs/functions/streaming
- **Vercel Environment Variables:** https://vercel.com/docs/projects/environment-variables

### Cloudflare Workers

- **Cloudflare Workers Docs:** https://developers.cloudflare.com/workers/
- **Wrangler CLI:** https://developers.cloudflare.com/workers/wrangler/
- **Workers Configuration:** https://developers.cloudflare.com/workers/wrangler/configuration/

---

## API Reference

- **generateText:** https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text
- **streamText:** https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text
- **generateObject:** https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object
- **streamObject:** https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-object
- **Tool:** https://ai-sdk.dev/docs/reference/ai-sdk-core/tool
- **Agent:** https://ai-sdk.dev/docs/reference/ai-sdk-core/agent

---

## GitHub & Community

- **GitHub Repository:** https://github.com/vercel/ai
- **GitHub Issues:** https://github.com/vercel/ai/issues
- **GitHub Discussions:** https://github.com/vercel/ai/discussions
- **Discord Community:** https://discord.gg/vercel

---

## Blog Posts & Announcements

- **AI SDK 5.0 Release:** https://vercel.com/blog/ai-sdk-5
- **Vercel AI Blog:** https://vercel.com/blog/category/ai
- **Engineering Blog (Agents):** https://www.anthropic.com/engineering

---

## TypeScript & Zod

- **Zod Documentation:** https://zod.dev/
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/

---

## Complementary Skills

For complete AI SDK coverage, also see:

- **ai-sdk-ui skill:** Frontend React hooks (useChat, useCompletion, useObject)
- **cloudflare-workers-ai skill:** Native Cloudflare Workers AI binding (no multi-provider)

---

## Quick Navigation

### I want to...

**Generate text:**
- Docs: https://ai-sdk.dev/docs/ai-sdk-core/generating-text
- Template: `templates/generate-text-basic.ts`

**Stream text:**
- Docs: https://ai-sdk.dev/docs/ai-sdk-core/streaming-text
- Template: `templates/stream-text-chat.ts`

**Generate structured output:**
- Docs: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
- Template: `templates/generate-object-zod.ts`

**Use tools:**
- Docs: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
- Template: `templates/tools-basic.ts`

**Build an agent:**
- Docs: https://ai-sdk.dev/docs/agents/overview
- Template: `templates/agent-with-tools.ts`

**Migrate from v4:**
- Docs: https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0
- Reference: `references/v5-breaking-changes.md`

**Fix an error:**
- Docs: https://ai-sdk.dev/docs/reference/ai-sdk-errors
- Reference: `references/top-errors.md`

**Set up a provider:**
- Reference: `references/providers-quickstart.md`

**Deploy to production:**
- Reference: `references/production-patterns.md`

---

**Last Updated:** 2025-10-21
