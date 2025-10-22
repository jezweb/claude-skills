# Claude Skills Roadmap

**Project**: Claude Code Skills Collection
**Maintainer**: Jeremy Dawes (Jezweb)
**Repository**: https://github.com/jezweb/claude-skills
**Last Updated**: 2025-10-22

---

## 🎯 Project Goals

### Primary Objectives:
1. **Reduce token usage** by 50-70% for common development tasks
2. **Eliminate errors** from known issues and misconfigurations
3. **Speed up project setup** from hours to minutes
4. **Share knowledge** with the Claude Code community
5. **Build atomic, composable skills** following Claude Code philosophy

### Success Metrics:
- ✅ 12+ production-ready atomic skills
- ✅ 50%+ token savings vs manual setup
- ✅ Zero errors for covered use cases
- ✅ Public GitHub repo with community contributions
- ✅ Auto-discovery working reliably
- ✅ Skills are composable and domain-focused

---

## 🧩 Atomic Skills Architecture

**Philosophy**: Each skill is a focused **knowledge domain** that Claude discovers and composes automatically.

### Why Atomic?
- ✅ **Composability** - Claude combines multiple skills for complex tasks
- ✅ **Reusability** - Same skill works across different frameworks
- ✅ **Maintainability** - Update once, benefits all use cases
- ✅ **Token efficiency** - Only load relevant knowledge
- ✅ **Flexibility** - Users pick their own stack

### Example Composition:
```
User: "Build a Cloudflare full-stack app with auth and database"
↓
Claude discovers and uses:
- cloudflare-worker-base (Hono + Vite)
- cloudflare-d1 (database)
- clerk-auth (authentication)
- tailwind-v4-shadcn (UI)
↓
Result: Integrated solution from atomic skills
```

---

## 📊 Skill Priority Matrix

### ✅ Completed Skills

#### tailwind-v4-shadcn
**Status**: ✅ Complete (2025-10-20)
**Priority**: High
**Dependencies**: None
**Actual Dev Time**: 6 hours
**Token Savings**: ~70%
**Errors Prevented**: 3

**What It Does**:
- Tailwind CSS v4 + shadcn/ui integration
- Vite plugin setup
- Dark mode with ThemeProvider
- @theme inline pattern
- Complete component library setup

**Production Validated**: WordPress Auditor

---

#### cloudflare-worker-base
**Status**: ✅ Complete (2025-10-20)
**Priority**: Critical
**Dependencies**: None
**Actual Dev Time**: 2 hours
**Token Savings**: ~60%
**Errors Prevented**: 6

**What It Does**:
- Scaffolds Cloudflare Workers project
- Hono routing framework
- Workers Static Assets configuration
- @cloudflare/vite-plugin setup
- wrangler.jsonc template
- Local dev + deployment workflow

**Production Validated**: https://cloudflare-worker-base-test.webfonts.workers.dev

---

#### firecrawl-scraper
**Status**: ✅ Complete (2025-10-20)
**Priority**: Medium
**Dependencies**: None
**Actual Dev Time**: 1.5 hours
**Token Savings**: ~60%
**Errors Prevented**: 6

**What It Does**:
- Firecrawl v2 API integration
- Single page scraping (/v2/scrape)
- Full site crawling (/v2/crawl)
- URL discovery (/v2/map)
- Structured data extraction (/v2/extract)
- Python SDK (firecrawl-py v4.5.0+)
- TypeScript SDK (firecrawl-js v1.7.x+)
- Error handling and retry patterns

**Production Validated**: Templates tested with working examples

---

#### cloudflare-d1
**Status**: ✅ Complete (2025-10-21)
**Priority**: Critical
**Dependencies**: cloudflare-worker-base
**Actual Dev Time**: 2.5 hours
**Token Savings**: ~58%
**Errors Prevented**: 6

**What It Does**:
- D1 database creation and setup with wrangler
- SQL migrations system (create, list, apply)
- D1 bindings configuration in wrangler.jsonc
- Complete D1 Workers API (prepare, bind, batch, exec)
- Prepared statements for SQL injection prevention
- Batch queries for performance optimization
- Indexes and query optimization patterns
- Error handling and retry strategies
- Production-ready schema examples
- Local and remote development workflows

**Production Validated**: Templates tested with working examples

---

### Batch 1 - Cloudflare Services (Week 1) ⭐⭐⭐

#### 2. cloudflare-r2
**Status**: ✅ Complete (2025-10-21)
**Priority**: High
**Dependencies**: cloudflare-worker-base
**Actual Dev Time**: 2.5 hours
**Token Savings**: ~60%
**Errors Prevented**: 6

**What It Does**:
- R2 bucket creation and configuration with wrangler
- Complete R2 Workers API (put, get, head, delete, list)
- Multipart uploads for large files (>100MB)
- Presigned URLs for client-side uploads/downloads
- CORS configuration examples
- HTTP metadata (content-type, cache-control, etc.)
- Custom metadata support
- Batch operations (bulk delete up to 1000 keys)
- S3 API compatibility guide
- Common patterns (image uploads, versioning, backups)
- Error handling and retry strategies

**Production Validated**: Templates tested with working examples

**Auto-Trigger Keywords**:
- `r2 storage`, `cloudflare r2`, `r2 upload`, `r2 bucket`
- `object storage`, `r2 cors`, `presigned urls`, `multipart upload`

---

#### 3. cloudflare-kv
**Status**: ✅ Complete (2025-10-21)
**Priority**: High
**Dependencies**: cloudflare-worker-base
**Actual Dev Time**: 3 hours
**Token Savings**: ~55%
**Errors Prevented**: 6

**What It Does**:
- KV namespace creation and configuration with wrangler
- Complete KV Workers API (get, put, delete, list)
- Bulk operations (bulk reads, pagination)
- Metadata storage (up to 1024 bytes)
- TTL & expiration (relative and absolute)
- CacheTtl optimization for edge caching
- List operations with cursor pagination
- Prefix filtering and search
- Caching patterns (cache-aside, write-through, stale-while-revalidate)
- Error handling and retry strategies
- Rate limit handling (1 write/sec per key)

**Production Validated**: Templates tested with working examples

**Auto-Trigger Keywords**:
- `kv storage`, `cloudflare kv`, `kv namespace`
- `kv cache`, `workers kv`, `kv bindings`, `kv ttl`, `kv metadata`

---

#### 4. cloudflare-workers-ai
**Status**: ✅ Complete (2025-10-21)
**Priority**: High
**Dependencies**: cloudflare-worker-base
**Actual Dev Time**: 5 hours
**Token Savings**: ~60%
**Errors Prevented**: 6

**What It Does**:
- Workers AI binding setup (wrangler.jsonc configuration)
- Complete models catalog (50+ models across 10+ task types)
- Text generation with streaming (LLMs: Llama, Qwen, Mistral, DeepSeek)
- Text embeddings for RAG (BGE models with Vectorize integration)
- Image generation (Flux, Stable Diffusion XL, DreamShaper)
- Vision models (Llama 3.2 Vision for image understanding)
- AI Gateway integration (caching, logging, cost tracking)
- Production patterns (error handling, retry logic, rate limits)

**Files Created**:
- README.md (auto-trigger keywords, quick example)
- SKILL.md (comprehensive API reference, 500+ lines)
- templates/wrangler-ai-config.jsonc
- templates/ai-text-generation.ts (streaming, chat, structured output)
- templates/ai-embeddings-rag.ts (complete RAG pattern)
- templates/ai-image-generation.ts (Flux, SDXL, storage in R2)
- templates/ai-vision-models.ts (Llama Vision, image understanding)
- templates/ai-gateway-integration.ts (caching, feedback, analytics)
- reference/models-catalog.md (complete model listing by task type)
- reference/best-practices.md (production patterns, cost optimization)

**Auto-Trigger Keywords**:
- `workers ai`, `cloudflare ai`, `@cf/meta/llama`, `ai bindings`
- `llm workers`, `ai streaming`, `embeddings`, `image generation`
- `vision models`, `ai gateway`, `rag pattern`, `text generation`

---

#### 5. cloudflare-vectorize
**Status**: ✅ Complete (2025-10-21)
**Priority**: Medium
**Dependencies**: cloudflare-worker-base
**Actual Dev Time**: 3 hours
**Token Savings**: ~65%
**Errors Prevented**: 8

**What It Does**:
- Vectorize index creation (dimensions, metrics)
- Metadata indexes (BEFORE vector insertion - critical timing)
- Vector operations (insert, upsert, query, delete, list)
- Metadata filtering (10 operators, 10 indexes per index)
- Workers AI integration (@cf/baai/bge-base-en-v1.5)
- OpenAI embeddings (text-embedding-3-small/large)
- RAG patterns (complete chat with context retrieval)
- Document chunking and ingestion pipelines
- Namespace-based multi-tenancy

**Files Created**:
- README.md (comprehensive auto-trigger keywords)
- SKILL.md (complete API reference with examples)
- templates/basic-search.ts (simple semantic search)
- templates/rag-chat.ts (full RAG chatbot with streaming)
- templates/document-ingestion.ts (chunking + batch processing)
- templates/metadata-filtering.ts (advanced filtering examples)
- reference/wrangler-commands.md (complete CLI reference)
- reference/index-operations.md (index creation guide)
- reference/vector-operations.md (insert/query/delete operations)
- reference/metadata-guide.md (filtering operators and patterns)
- reference/embedding-models.md (Workers AI + OpenAI comparison)
- examples/workers-ai-bge-base.md (768 dimensions integration)
- examples/openai-embeddings.md (1536/3072 dimensions integration)

**Production Validated**: Templates tested with working examples

**Auto-Trigger Keywords**:
- `vectorize`, `cloudflare vectorize`, `vector search`, `vector database`
- `embeddings storage`, `rag cloudflare`, `semantic search`, `similarity search`
- `bge-base`, `workers ai embeddings`, `metadata filtering`, `topK search`

---

#### 6. cloudflare-queues
**Status**: ✅ Complete (2025-10-21)
**Priority**: Medium
**Dependencies**: cloudflare-worker-base
**Actual Dev Time**: 3 hours
**Token Savings**: ~50%
**Errors Prevented**: 8

**What It Does**:
- Queue creation and management with wrangler
- Complete Producer API (send, sendBatch, delays)
- Complete Consumer API (batch, message, ack/retry)
- Batching configuration (max_batch_size, max_batch_timeout)
- Retry strategies (implicit, explicit, exponential backoff)
- Dead Letter Queues (DLQ) for failed messages
- Explicit acknowledgement patterns
- Message delays (up to 12 hours)
- Consumer concurrency (auto-scaling up to 250)
- Error handling and best practices

**Files Created**:
- README.md (comprehensive auto-trigger keywords)
- SKILL.md (complete API reference, 800+ lines)
- templates/wrangler-queues-config.jsonc
- templates/queues-producer.ts (send, sendBatch, delays)
- templates/queues-consumer-basic.ts (implicit ack)
- templates/queues-consumer-explicit-ack.ts (non-idempotent ops)
- templates/queues-dlq-pattern.ts (dead letter queue consumer)
- templates/queues-retry-with-delay.ts (exponential backoff)
- reference/wrangler-commands.md (complete CLI reference)
- reference/producer-api.md (send/sendBatch deep dive)
- reference/consumer-api.md (queue handler, batch/message operations)
- reference/best-practices.md (patterns, concurrency, optimization)

**Production Validated**: Templates tested with working examples

**Auto-Trigger Keywords**:
- `cloudflare queues`, `queues workers`, `message queue`, `async processing`
- `queue bindings`, `background jobs`, `batch processing`, `dead letter queue`
- `queue ack`, `message retry`, `consumer concurrency`

---

#### 7. cloudflare-agents
**Status**: ✅ Complete (2025-10-21)
**Priority**: Critical
**Dependencies**: cloudflare-worker-base (recommended)
**Actual Dev Time**: 18 hours
**Token Savings**: ~65%
**Errors Prevented**: 15

**What It Does**:
- Complete Cloudflare Agents SDK knowledge (all 17 API surfaces)
- Agent Class API (onRequest, onConnect, onMessage, onStart)
- WebSocket & Server-Sent Events (real-time bidirectional communication)
- State management (this.setState, this.sql, state sync)
- Task scheduling (this.schedule with delays, dates, cron)
- Workflow integration (triggering Cloudflare Workflows)
- Browser Rendering (web scraping with Puppeteer)
- RAG implementation (Vectorize + Workers AI embeddings)
- MCP servers (Model Context Protocol with McpAgent)
- Human-in-the-loop patterns (approval workflows)
- Client APIs (AgentClient, useAgent, useAgentChat hooks)
- Multi-agent communication and orchestration
- Durable Objects configuration and migrations

**Files Created**:
- README.md (comprehensive auto-trigger keywords)
- SKILL.md (1300+ lines covering all APIs)
- 13 templates (wrangler config, agents, workers, clients, MCP)
- templates/wrangler-agents-config.jsonc
- templates/basic-agent.ts
- templates/websocket-agent.ts
- templates/state-sync-agent.ts
- templates/scheduled-agent.ts
- templates/workflow-agent.ts
- templates/browser-agent.ts
- templates/rag-agent.ts
- templates/chat-agent-streaming.ts
- templates/calling-agents-worker.ts
- templates/react-useagent-client.tsx
- templates/mcp-server-basic.ts
- templates/hitl-agent.ts

**Production Validated**: Cloudflare's own MCP servers (https://github.com/cloudflare/mcp-server-cloudflare)

**Auto-Trigger Keywords**:
- `cloudflare agents`, `agents sdk`, `Agent class`, `Durable Objects agents`
- `this.setState`, `this.sql`, `this.schedule`, `run workflows`
- `browse web agents`, `rag agents`, `mcp server`, `McpAgent`
- `useAgent hook`, `AgentClient`, `routeAgentRequest`, `getAgentByName`
- `stateful agents`, `WebSocket agents`, `streaming chat agent`
- `human in the loop`, `multi-agent`, `agent orchestration`
- Error keywords: `"new_sqlite_classes"`, `"migrations required"`, `"binding not found"`

---

### Batch 2 - AI SDK & Auth & Frameworks (Week 2-3) ⭐⭐⭐

#### 7. cloudflare-nextjs
**Status**: ✅ Complete (2025-10-21)
**Priority**: High
**Dependencies**: None
**Actual Dev Time**: 4 hours
**Token Savings**: ~59%
**Errors Prevented**: 10

**What It Does**:
- Deploy Next.js (App Router and Pages Router) to Cloudflare Workers
- OpenNext Cloudflare adapter (`@opennextjs/cloudflare`) setup
- New and existing project migration patterns
- wrangler.jsonc and open-next.config.ts configuration
- Development workflow (dev + preview modes)
- Integration with Cloudflare services (D1, R2, KV, Workers AI)
- Comprehensive error prevention (10+ documented errors)
- Security (CVE-2025-6087 mitigation)

**Files Created**:
- README.md (comprehensive auto-trigger keywords, 200+ lines)
- SKILL.md (complete guide, 800+ lines)
- scripts/setup-new-project.sh (C3 scaffold)
- scripts/setup-existing-project.sh (adapter migration)
- scripts/analyze-bundle.sh (worker size debugging)
- references/wrangler.jsonc (complete configuration)
- references/open-next.config.ts (adapter config)
- references/package.json (scripts template)
- references/.env (build configuration)
- references/database-client-example.ts (request-scoped pattern)
- references/troubleshooting.md (all errors and solutions)
- references/feature-support.md (feature compatibility matrix)
- assets/workflow-diagram.md (development workflow)

**Production Validated**: Official Cloudflare support, OpenNext adapter maintained

**Auto-Trigger Keywords**:
- `next.js cloudflare`, `nextjs workers`, `opennext adapter`
- `next.js ssr cloudflare`, `next.js isr workers`, `server components cloudflare`
- `migrate next.js to cloudflare`, `nextjs d1`, `nextjs workers ai`
- Error keywords: `worker size limit nextjs`, `finalizationregistry nextjs`, `cannot perform i/o nextjs`

---

#### 8. ai-sdk-core
**Status**: ✅ Complete (2025-10-22)
**Priority**: Critical
**Dependencies**: None
**Actual Dev Time**: 6 hours
**Token Savings**: ~58%
**Errors Prevented**: 12

**What It Does**:
- Backend AI functionality with Vercel AI SDK v5 (stable)
- Text generation (generateText, streamText) with multi-provider support
- Structured output (generateObject, streamObject) with Zod validation
- Tool calling and Agent class for multi-step execution
- stopWhen conditions for workflow control (replaces maxSteps)
- Multi-provider support (OpenAI, Anthropic, Google, Cloudflare Workers AI)
- Critical v4→v5 migration guide (15+ breaking changes documented)
- Node.js, Cloudflare Workers, Next.js Server Components/Actions integration
- Production patterns for error handling, cost optimization, and performance

**Files Created**:
- README.md (comprehensive auto-trigger keywords)
- SKILL.md (931 lines - complete API reference)
- templates/generate-text-basic.ts (simple text generation)
- templates/stream-text-chat.ts (streaming chat with messages)
- templates/generate-object-zod.ts (structured output with Zod)
- templates/stream-object-zod.ts (streaming structured data)
- templates/tools-basic.ts (tool calling basics)
- templates/agent-with-tools.ts (Agent class usage)
- templates/multi-step-execution.ts (stopWhen patterns)
- templates/openai-setup.ts (OpenAI provider configuration)
- templates/anthropic-setup.ts (Anthropic provider configuration)
- templates/google-setup.ts (Google provider configuration)
- templates/cloudflare-worker-integration.ts (Workers AI integration)
- templates/nextjs-server-action.ts (Next.js Server Actions)
- templates/package.json (dependencies template)
- references/providers-quickstart.md (top 4 providers setup)
- references/v5-breaking-changes.md (complete migration guide)
- references/top-errors.md (12 errors with solutions)
- references/production-patterns.md (best practices)
- references/links-to-official-docs.md (organized documentation links)
- scripts/check-versions.sh (package version checker)

**Production Validated**: Templates tested, all files complete

**Auto-Trigger Keywords**:
- `ai sdk core`, `vercel ai sdk`, `generateText`, `streamText`, `generateObject`
- `ai tools calling`, `ai agent class`, `openai sdk`, `anthropic sdk`, `google gemini sdk`
- `multi-provider ai`, `zod ai schema`, `ai streaming backend`
- Error keywords: `AI_APICallError`, `AI_NoObjectGeneratedError`, `worker startup limit ai`

---

#### 9. ai-sdk-ui
**Status**: ✅ Complete (2025-10-22)
**Priority**: Critical
**Dependencies**: None (complements ai-sdk-core)
**Actual Dev Time**: 6 hours
**Token Savings**: ~55%
**Errors Prevented**: 12

**What It Does**:
- Frontend React hooks for AI-powered UIs with Vercel AI SDK v5
- useChat hook (chat interfaces with streaming)
- useCompletion hook (text completions)
- useObject hook (streaming structured data)
- v4→v5 migration (especially useChat input management)
- Next.js App Router and Pages Router integration
- Message rendering, persistence, tool calling UI
- React, Next.js, and other React frameworks

**Files Created**:
- SKILL.md (774 lines)
- README.md (comprehensive keywords)
- 11 templates (useChat variations, useCompletion, useObject, Next.js examples, persistence, custom renderer, package.json)
- 5 references (use-chat-migration.md, streaming-patterns.md, top-ui-errors.md, nextjs-integration.md, links-to-official-docs.md)
- scripts/check-versions.sh

**Production Validated**: WordPress Auditor (https://wordpress-auditor.webfonts.workers.dev)

**Auto-Trigger Keywords**:
- `ai sdk ui`, `useChat`, `useCompletion`, `useObject`, `react ai chat`
- `nextjs ai chat`, `streaming ai ui`, `ai chat interface`, `vercel ai ui`
- `chat message state`, `message persistence`, `ai file attachments`
- Error keywords: `useChat failed to parse`, `useChat no response`, `unclosed streams`

---

#### 10. clerk-auth
**Status**: ✅ Complete (2025-10-22)
**Priority**: Critical
**Dependencies**: None (works across frameworks)
**Actual Dev Time**: 6 hours
**Token Savings**: ~67%
**Errors Prevented**: 10

**What It Does**:
- Complete Clerk authentication for React, Next.js, Cloudflare Workers
- JWT verification with @clerk/backend
- Custom JWT templates and claims extraction
- Protected routes and middleware patterns
- User metadata and session management
- Organization permissions and RBAC
- shadcn/ui integration with Clerk components
- Webhook signature verification

**Files Created**:
- README.md (comprehensive auto-trigger keywords)
- SKILL.md (complete guide with all frameworks)
- Templates for React, Next.js, Cloudflare Workers
- JWT verification examples
- Custom JWT templates
- Protected route patterns
- Webhook handlers

**Production Validated**: Multiple framework implementations tested

**Auto-Trigger Keywords**:
- `clerk auth`, `clerk`, `@clerk/nextjs`, `@clerk/backend`, `@clerk/clerk-react`
- `clerkMiddleware`, `verifyToken`, `JWT verification`, `protected routes`
- `useUser`, `useAuth`, `SignInButton`, `UserButton`, `custom JWT claims`
- Error keywords: `Missing Clerk Secret Key`, `Invalid session token`, `Clerk webhook failed`

---

#### 11. hono-routing
**Status**: Planned
**Priority**: High
**Dependencies**: None
**Estimated Dev Time**: 4 hours
**Token Savings**: ~55%

**What It Does**:
- Hono routing patterns
- Middleware composition
- Request validation
- Typed routes
- RPC pattern
- Error handling
- Context sharing

**Auto-Trigger Keywords**:
- `hono`, `hono routing`, `hono middleware`
- `hono validation`, `hono rpc`, `typed routes`

---

#### 12. react-hook-form-zod
**Status**: Planned
**Priority**: High
**Dependencies**: None
**Estimated Dev Time**: 4 hours
**Token Savings**: ~60%

**What It Does**:
- React Hook Form setup
- Zod schema validation
- Client + server validation
- Form components
- Error handling
- Accessibility patterns
- shadcn/ui form integration

**Auto-Trigger Keywords**:
- `react hook form`, `zod validation`, `form validation`
- `react forms`, `rhf`, `zod schema`

---

### Batch 3 - Cloudflare Advanced Services ⭐

#### 10. cloudflare-durable-objects
**Status**: ✅ Complete (2025-10-22)
**Priority**: Critical
**Dependencies**: cloudflare-worker-base
**Actual Dev Time**: 8 hours
**Token Savings**: ~66%
**Errors Prevented**: 18

**What It Does**:
- Durable Objects class structure (DurableObject base class, constructor patterns)
- State API (SQL + KV storage, transactions, PITR)
- WebSocket Hibernation API for real-time connections
- Alarms API for scheduled tasks
- RPC vs HTTP fetch patterns
- Location hints and jurisdiction restrictions
- Migration patterns (new, rename, delete, transfer)
- Rate limiting, session management, leader election
- Real-time applications (chat rooms, multiplayer games, collaboration)
- Multi-DO coordination patterns

**Files Created**:
- README.md (comprehensive auto-trigger keywords)
- SKILL.md (1760+ lines covering all APIs)
- 8 templates (wrangler config, basic DO, WebSocket hibernation, state API, alarms, RPC/fetch, location hints, multi-DO coordination, package.json)
- 7 references (wrangler commands, state API, WebSocket hibernation, alarms, migrations, RPC patterns, best practices, top errors)
- scripts/check-versions.sh

**Production Validated**: Templates tested, all 18 documented errors with solutions

**Auto-Trigger Keywords**:
- `durable objects`, `cloudflare do`, `websocket hibernation`
- `do state api`, `ctx.storage.sql`, `ctx.acceptWebSocket`, `durable objects alarm`
- `do migrations`, `location hints`, `RPC methods`, `idFromName`, `getByName`
- `real-time cloudflare`, `websocket workers`, `multiplayer cloudflare`
- Error keywords: `do class export`, `new_sqlite_classes`, `migrations required`, `alarm api error`

---

#### 11. cloudflare-workflows
**Status**: ✅ Complete (2025-10-22)
**Priority**: Critical
**Dependencies**: cloudflare-worker-base
**Actual Dev Time**: 4 hours
**Token Savings**: ~67%
**Errors Prevented**: 5

**What It Does**:
- WorkflowEntrypoint API (run, step.do, step.sleep, step.sleepUntil, step.waitForEvent)
- Automatic retries with configurable backoff (exponential, linear, constant)
- State persistence between steps
- Long-running workflows (hours/days)
- Event-driven patterns (human-in-the-loop, approvals)
- Error handling (NonRetryableError, try-catch)
- Workflow chaining and coordination

**Files Created**:
- README.md (comprehensive auto-trigger keywords)
- SKILL.md (complete guide, 1100+ lines)
- 6 templates (basic, retries, scheduled, events, trigger, wrangler config)
- 2 references (common-issues.md with 5 errors, workflow-patterns.md)
- Research log: planning/research-logs/cloudflare-workflows.md

**Production Validated**: Based on official Cloudflare docs (Workflows launched Oct 2024)

**Auto-Trigger Keywords**:
- `cloudflare workflows`, `workflows workers`, `durable execution`, `workflow step`
- `WorkflowEntrypoint`, `step.do`, `step.sleep`, `step.sleepUntil`, `step.waitForEvent`
- `workflow retries`, `NonRetryableError`, `long-running tasks`, `workflow events`
- Error keywords: `I/O context`, `workflow execution failed`, `serialization error`

---

#### 12. cloudflare-hyperdrive
**Status**: Planned
**Priority**: High
**Dependencies**: cloudflare-worker-base
**Estimated Dev Time**: 4-5 hours
**Token Savings**: ~55%
**Errors Prevented**: 8+

**What It Does**:
- PostgreSQL connection setup and configuration
- Connection pooling for performance
- Query patterns and optimization
- Migration from traditional servers to Workers
- Binding configuration in wrangler
- Hybrid architectures (Workers + existing databases)
- MySQL support patterns

**Auto-Trigger Keywords**:
- `cloudflare hyperdrive`, `workers postgresql`, `workers mysql`
- `hyperdrive connection`, `database pooling cloudflare`, `postgres workers`
- `migrate to cloudflare`, `hybrid cloudflare architecture`

---

#### 13. cloudflare-browser-rendering
**Status**: Planned
**Priority**: Medium
**Dependencies**: cloudflare-worker-base, cloudflare-r2 (optional for storage)
**Estimated Dev Time**: 5-6 hours
**Token Savings**: ~50%
**Errors Prevented**: 8+

**What It Does**:
- Puppeteer in Cloudflare Workers
- Screenshot generation
- PDF generation from HTML
- Web scraping patterns
- Form automation
- Navigation and waiting patterns
- Error handling for browser operations
- Integration with R2 for storing screenshots/PDFs

**Auto-Trigger Keywords**:
- `cloudflare browser`, `puppeteer workers`, `browser rendering cloudflare`
- `screenshot cloudflare`, `pdf generation workers`, `web scraping cloudflare`
- `cloudflare automation`, `headless browser workers`

---

#### 14. cloudflare-cron-triggers
**Status**: Planned
**Priority**: Medium
**Dependencies**: cloudflare-worker-base
**Estimated Dev Time**: 3-4 hours
**Token Savings**: ~40%
**Errors Prevented**: 6+

**What It Does**:
- Cron syntax and scheduling patterns
- Scheduled Workers configuration
- Error handling for cron jobs
- Idempotency patterns
- Integration with D1, KV, R2 for data operations
- Daily reports, cache warming, cleanup jobs, data sync, backup automation

**Auto-Trigger Keywords**:
- `cloudflare cron`, `scheduled workers`, `cron triggers cloudflare`
- `workers scheduler`, `daily job cloudflare`, `cache warming`
- `cleanup job`, `scheduled task workers`

---

#### 15. cloudflare-email-workers
**Status**: Planned
**Priority**: Medium
**Dependencies**: cloudflare-worker-base
**Estimated Dev Time**: 4-5 hours
**Token Savings**: ~45%
**Errors Prevented**: 7+

**What It Does**:
- Email routing configuration
- Parsing email content and headers
- Attachment handling and extraction
- Forwarding patterns and rules
- Integration with D1 for storage, KV for config
- Email-to-ticket systems, support automation
- Spam filtering patterns

**Auto-Trigger Keywords**:
- `cloudflare email`, `email workers`, `email routing cloudflare`
- `parse email workers`, `email attachment`, `email-to-ticket`
- `email forwarding cloudflare`, `receive email workers`

---

### Batch 4 - Data & Utilities ⭐

#### 16. tanstack-query
**Status**: Planned
**Priority**: Medium
**Dependencies**: None
**Estimated Dev Time**: 4 hours
**Token Savings**: ~55%

**What It Does**:
- TanStack Query setup
- Query patterns
- Mutation patterns
- Cache management
- Optimistic updates
- Infinite queries
- SSR patterns

**Auto-Trigger Keywords**:
- `tanstack query`, `react query`, `query cache`
- `mutations`, `optimistic updates`, `server state`

---

#### 17. drizzle-orm-d1
**Status**: Planned (Optional)
**Priority**: Low
**Dependencies**: cloudflare-d1
**Estimated Dev Time**: 5 hours
**Token Savings**: ~60%

**What It Does**:
- Drizzle ORM setup for D1
- Schema definition
- Type-safe queries
- Migrations
- Relations
- Query builder patterns

**Auto-Trigger Keywords**:
- `drizzle orm`, `drizzle d1`, `orm cloudflare`
- `type-safe sql`, `drizzle schema`

---

## 🏗️ Development Workflow

### Step-by-Step Process:

1. **Plan** (30 min)
   - Define auto-trigger keywords
   - List known issues to prevent
   - Sketch template structure

2. **Build** (3-8 hours)
   - Create README.md with keywords
   - Write SKILL.md documentation
   - Develop templates
   - Add examples (optional)
   - Create automation scripts (optional)

3. **Test** (1 hour)
   - Symlink to ~/.claude/skills/
   - Test auto-discovery with Claude
   - Verify templates work
   - Measure token savings

4. **Document** (30 min)
   - Update this roadmap
   - Add to main README.md
   - Document token metrics

5. **Deploy** (15 min)
   - Commit to git
   - Push to GitHub
   - Verify public repo updated

---

## 📦 Skill Template Standard

Every skill MUST include:

### Required Files:
```
skills/[skill-name]/
├── README.md              # Auto-trigger keywords
├── SKILL.md               # Complete docs
└── templates/             # File templates
```

### Optional Files:
```
├── examples/              # Working examples
├── scripts/               # Automation
└── reference/             # Deep-dive docs
```

### README.md Structure:
- Auto-trigger keywords (Primary, Secondary, Error-based)
- What the skill does (bullet points)
- Known issues prevented (table)
- When to use / when not to use
- Quick usage example
- Token efficiency metrics

### SKILL.md Structure:
- Detailed setup instructions
- Configuration examples
- Critical rules (Always Do / Never Do)
- Common issues & fixes
- Dependencies list
- Reference links

---

## 🧪 Testing Protocol

For each skill, verify:

### 1. Auto-Discovery Test
```
1. Start fresh Claude Code session
2. Ask: "Set up [trigger keyword]"
3. Verify: Claude finds and suggests skill
4. Measure: Tokens used to suggest skill
```

### 2. Template Test
```
1. Copy templates to new project
2. Run: pnpm install (if applicable)
3. Run: pnpm dev or pnpm build
4. Verify: No errors, everything works
```

### 3. Token Efficiency Test
```
Manual Setup:
1. Fresh chat, no skill
2. Ask Claude to set up [technology]
3. Note: Total tokens used
4. Count: Errors encountered

With Skill:
1. Fresh chat, skill installed
2. Ask Claude to set up [technology]
3. Note: Total tokens used
4. Count: Errors encountered

Calculate:
- Savings % = ((Manual - Skill) / Manual) × 100
- Error reduction = Manual errors - Skill errors
```

---

## 📈 Progress Tracking

### Overall Progress:
- **Completed**: 16 skills ✅
- **Batch 1 - Cloudflare Foundation**: 9/9 complete (100%) 🎯
- **Batch 2 - AI SDK & Auth**: 3/6 complete (50%)
- **Batch 3 - Cloudflare Advanced**: 2/6 complete (33%) 🎯
- **Batch 4 - Data & Utilities**: 0/2 complete (0%)

### Skills by Status:

| Skill | Status | Dev Time | Token Savings | Errors Prevented | Priority |
|-------|--------|----------|---------------|------------------|----------|
| **tailwind-v4-shadcn** | **✅ Complete** | **6h** | **~70%** | **3** | High |
| **cloudflare-worker-base** | **✅ Complete** | **2h** | **~60%** | **6** | Critical |
| **firecrawl-scraper** | **✅ Complete** | **1.5h** | **~60%** | **6** | Medium |
| **cloudflare-d1** | **✅ Complete** | **2.5h** | **~58%** | **6** | Critical |
| **cloudflare-r2** | **✅ Complete** | **2.5h** | **~60%** | **6** | High |
| **cloudflare-kv** | **✅ Complete** | **3h** | **~55%** | **6** | High |
| **cloudflare-workers-ai** | **✅ Complete** | **5h** | **~60%** | **6** | High |
| **cloudflare-vectorize** | **✅ Complete** | **3h** | **~65%** | **8** | Medium |
| **cloudflare-queues** | **✅ Complete** | **3h** | **~50%** | **8** | Medium |
| **cloudflare-agents** | **✅ Complete** | **18h** | **~65%** | **15** | Critical |
| **cloudflare-nextjs** | **✅ Complete** | **4h** | **~59%** | **10** | High |
| **ai-sdk-core** | **✅ Complete** | **6h** | **~58%** | **12** | Critical |
| **ai-sdk-ui** | **✅ Complete** | **6h** | **~55%** | **12** | Critical |
| **cloudflare-durable-objects** | **✅ Complete** | **8h** | **~66%** | **18** | Critical |
| **clerk-auth** | **✅ Complete** | **6h** | **~67%** | **10** | Critical |
| hono-routing | Planned | 4h (est.) | ~55% | - | High |
| react-hook-form-zod | Planned | 4h (est.) | ~60% | - | High |
| **cloudflare-workflows** | **✅ Complete** | **4h** | **~67%** | **5** | Critical |
| cloudflare-hyperdrive | Planned | 4-5h (est.) | ~55% | 8+ | High |
| cloudflare-browser-rendering | Planned | 5-6h (est.) | ~50% | 8+ | Medium |
| cloudflare-cron-triggers | Planned | 3-4h (est.) | ~40% | 6+ | Medium |
| cloudflare-email-workers | Planned | 4-5h (est.) | ~45% | 7+ | Medium |
| tanstack-query | Planned | 4h (est.) | ~55% | - | Medium |
| drizzle-orm-d1 | Planned | 5h (est.) | ~60% | - | Low |

**Total Skills Planned**: 23 (16 complete, 7 to build)

---

## 🎯 Success Criteria

A skill is considered "complete" when:

✅ README.md has comprehensive auto-trigger keywords
✅ SKILL.md provides step-by-step instructions
✅ Templates are tested and work without errors
✅ Token savings >= 50% vs manual setup
✅ Auto-discovery works reliably
✅ Known errors are prevented
✅ Production-tested in real project
✅ Committed to Git + pushed to GitHub

---

## 🔄 Maintenance Plan

### Weekly:
- Check for dependency updates
- Test skills with latest Claude Code
- Review community issues

### Monthly:
- Update outdated templates
- Add new auto-trigger keywords based on usage
- Improve documentation based on feedback

### Quarterly:
- Major version bumps for dependencies
- Add new skills based on demand
- Archive deprecated skills

---

## 🚀 Future Skills (Backlog)

### High Demand:
- **stripe-payments**: Stripe integration (webhooks, subscriptions, checkout)
- **resend-email**: Email with Resend API (templates, transactional)
- **cloudflare-images**: Image optimization and transformations
- **authjs-auth**: Auth.js integration (alternative to Clerk)

### Medium Demand:
- **vitest-testing**: Testing with Vitest (unit, integration)
- **playwright-e2e**: E2E testing setup
- **sentry-monitoring**: Error tracking and performance monitoring
- **posthog-analytics**: Product analytics integration
- **vite-react**: Standalone Vite + React (no Cloudflare)

### Low Demand:
- **cloudflare-browser-rendering**: Puppeteer on Workers
- **cloudflare-durable-objects**: Durable Objects patterns
- **nextjs-setup**: Next.js best practices
- **prisma-d1**: Prisma ORM for D1 (if Drizzle not sufficient)

### Composite Skills (After Atomic Skills Complete):
- **cloudflare-full-stack-starter**: References multiple atomic skills for quick starts
- **saas-starter**: Complete SaaS stack (auth + db + payments + email)

---

## 📞 Community Feedback

### How to Suggest Skills:
1. Open GitHub issue with "Skill Request" label
2. Describe the problem it solves
3. Estimate token savings potential
4. Provide example use case

### How to Report Issues:
1. Open GitHub issue with "Skill Bug" label
2. Specify which skill
3. Describe the problem
4. Include steps to reproduce

---

## 📊 Metrics Dashboard

### Token Efficiency (Atomic Skills):
- Manual setup (per service): 8,000-15,000 tokens
- With atomic skill: 3,000-5,000 tokens
- **Average savings per skill: ~55-60%**

### Composite Task Efficiency:
- Manual full-stack setup: 50,000-70,000 tokens
- With 4-5 atomic skills composed: 15,000-25,000 tokens
- **Total savings: ~65-70%**

### Error Prevention:
- Manual setup: 2-4 errors average per service
- With atomic skills: 0 errors
- **Error reduction: 100%**

### Time Savings:
- Manual setup: 2-4 hours per service
- With atomic skills: 15-30 minutes
- **Time savings: ~85%**

### Atomic Architecture Benefits:
- ✅ Skills are reusable across different stacks
- ✅ Update once, benefit everywhere
- ✅ Claude composes skills automatically
- ✅ Users only load what they need

---

**Last Updated**: 2025-10-22 (Updated: clerk-auth + cloudflare-workflows marked complete - 16/23 skills complete, 70% done)
**Next Review**: 2025-10-28
**Maintainer**: Jeremy Dawes | jeremy@jezweb.net
