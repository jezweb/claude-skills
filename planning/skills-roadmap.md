# Claude Skills Roadmap

**Project**: Claude Code Skills Collection
**Maintainer**: Jeremy Dawes (Jezweb)
**Repository**: https://github.com/jezweb/claude-skills
**Last Updated**: 2025-10-23

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

#### 7. cloudflare-cron-triggers
**Status**: ✅ Complete (2025-10-23)
**Priority**: Medium
**Dependencies**: cloudflare-worker-base
**Actual Dev Time**: 1.5 hours
**Token Savings**: ~60%
**Errors Prevented**: 6

**What It Does**:
- Scheduled Worker execution using cron expressions
- Scheduled handler setup (ES modules format required)
- Cron expression syntax (5-field format, UTC only)
- ScheduledController API (cron, type, scheduledTime properties)
- Multiple cron schedules with switch routing
- Integration with all Cloudflare bindings (D1, R2, KV, AI, Queues, Workflows)
- Testing workflow (--test-scheduled flag, /__scheduled endpoint)
- Green Compute configuration (renewable energy data centers)
- UTC timezone conversion guide
- 15-minute propagation delay handling

**Files Created**:
- README.md (comprehensive auto-trigger keywords)
- SKILL.md (complete API reference, 900+ lines)
- templates/basic-scheduled.ts (minimal scheduled Worker)
- templates/hono-with-scheduled.ts (combined HTTP + scheduled handlers)
- templates/multiple-crons.ts (multiple schedules with routing)
- templates/scheduled-with-bindings.ts (all Cloudflare bindings examples)
- templates/wrangler-cron-config.jsonc (complete configuration patterns)
- references/cron-expressions-reference.md (complete cron syntax, 50+ patterns)
- references/common-patterns.md (12 real-world use cases)

**Known Issues Prevented**:
1. 15-minute propagation delay confusion
2. Wrong handler name errors (must be 'scheduled')
3. UTC timezone confusion (no local timezone support)
4. Invalid cron expression syntax (6-field not supported)
5. ES modules format requirement (no Service Worker format)
6. CPU time limit errors (default 30s, max 5min)

**Production Validated**: Cloudflare official documentation examples

**Auto-Trigger Keywords**:
- `cloudflare cron`, `cron triggers`, `scheduled workers`, `scheduled handler`
- `scheduled() handler`, `ScheduledController`, `wrangler crons`, `periodic tasks`
- `scheduled tasks`, `maintenance tasks`, `background jobs`, `cron expression`
- `green compute`, `workflow triggers`, `UTC timezone`
- Error keywords: `"scheduled handler not found"`, `"cron expression invalid"`, `"changes not propagating"`

---

#### 8. cloudflare-agents
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
**Status**: ✅ Complete (2025-10-22)
**Priority**: High
**Dependencies**: None
**Actual Dev Time**: 4 hours
**Token Savings**: ~56%
**Errors Prevented**: 8

**What It Does**:
- Complete Hono routing patterns (route params, query, wildcards, grouping)
- Middleware composition (built-in middleware, custom middleware, chaining)
- Request validation (Zod, Valibot, Typia, ArkType with hooks)
- Typed routes (RPC pattern with type-safe client/server)
- Error handling (HTTPException, onError, custom errors)
- Context extension (c.set/c.get, type-safe variables)

**Files Created**:
- README.md (comprehensive auto-trigger keywords)
- SKILL.md (complete documentation, 1000+ lines)
- 8 templates (routing, middleware, validation, RPC, errors, context, client, package.json)
- 4 references (middleware-catalog.md, validation-libraries.md, rpc-guide.md, top-errors.md)
- scripts/check-versions.sh

**Production Validated**: Templates tested, all 8 documented errors with solutions

**Auto-Trigger Keywords**:
- `hono`, `hono routing`, `hono middleware`
- `hono validation`, `hono rpc`, `typed routes`, `hono validator`
- `zod validator hono`, `valibot validator hono`, `c.req.valid`
- Error keywords: `middleware response not typed`, `hono rpc type inference`, `validation hook hono`

---

#### 12. react-hook-form-zod
**Status**: ✅ Complete (2025-10-23)
**Priority**: High
**Dependencies**: None
**Actual Dev Time**: 4 hours
**Token Savings**: ~60%
**Errors Prevented**: 12

**What It Does**:
- Complete React Hook Form API (useForm, register, Controller, useFieldArray, useWatch)
- Zod schema patterns (all data types, refinements, transforms, error customization)
- shadcn/ui Form component integration
- Client + server validation with single source of truth
- Advanced patterns (dynamic fields, multi-step forms, async validation, nested objects, arrays)
- Accessible error handling (WCAG compliance, ARIA attributes)
- Performance optimization (form modes, validation strategies, re-render optimization)
- Type-safe validation with TypeScript inference

**Files Created**:
- README.md (comprehensive auto-trigger keywords, 200+ lines)
- SKILL.md (complete documentation, 1,000+ lines)
- 9 templates (basic-form, advanced-form, shadcn-form, server-validation, async-validation, dynamic-fields, multi-step-form, custom-error-display, package.json)
- 8 references (zod-schemas-guide.md, rhf-api-reference.md, error-handling.md, accessibility.md, performance-optimization.md, shadcn-integration.md, top-errors.md, links-to-official-docs.md)
- scripts/check-versions.sh

**Known Issues Prevented**:
1. Zod v4 type inference errors (#13109)
2. Uncontrolled to controlled warnings
3. Nested object validation errors
4. Array field re-renders
5. Async validation race conditions
6. Server error mapping issues
7. Default values not applied
8. Controller field not updating
9. useFieldArray key warnings
10. Schema refinement error paths
11. Transform vs preprocess confusion
12. Multiple resolver conflicts

**Production Validated**: Templates tested with TypeScript strict mode

**Auto-Trigger Keywords**:
- `react-hook-form`, `useForm`, `zod validation`, `form validation`
- `zodResolver`, `@hookform/resolvers`, `rhf`, `form schema`, `zod schema`
- `register form`, `handleSubmit`, `formState errors`, `useFieldArray`
- `shadcn form`, `Field component shadcn`, `async validation`
- Error keywords: `resolver not found`, `zod type inference`, `uncontrolled to controlled`

---

### Batch 3 - Cloudflare Advanced Services ⭐

#### cloudflare-hyperdrive
**Status**: ✅ Complete (2025-10-22) - See detailed entry above

---

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
**Status**: ✅ Complete (2025-10-22)
**Priority**: High
**Dependencies**: cloudflare-worker-base (recommended)
**Actual Dev Time**: 5 hours
**Token Savings**: ~58%
**Errors Prevented**: 10

**What It Does**:
- Complete Hyperdrive knowledge (PostgreSQL & MySQL support)
- Connection pooling patterns (pg.Pool, postgres.js, mysql2)
- Query caching optimization
- TLS/SSL certificate configuration (server certs, client certs, mTLS)
- Drizzle ORM and Prisma ORM integration
- Local development setup (localConnectionString, env vars)
- Wrangler CLI commands (create, update, delete, cert upload)
- Private database access via Cloudflare Tunnel
- All 10+ documented errors with solutions

**Files Created**:
- README.md (comprehensive auto-trigger keywords)
- SKILL.md (complete guide, 1000+ lines)
- 9 templates (wrangler config, postgres, mysql, Drizzle, Prisma, local setup)
- 8 references (troubleshooting, wrangler commands, supported databases, connection pooling, query caching, TLS/SSL setup, Drizzle integration, Prisma integration)
- scripts/check-versions.sh

**Production Validated**: Based on official Cloudflare documentation

**Auto-Trigger Keywords**:
- `hyperdrive`, `cloudflare hyperdrive`, `postgres workers`, `mysql workers`
- `node-postgres hyperdrive`, `postgres.js workers`, `mysql2 workers`
- `drizzle hyperdrive`, `prisma hyperdrive`, `connection pooling cloudflare`
- Error keywords: `Failed to acquire a connection`, `TLS not supported`, `nodejs_compat missing`

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
**Status**: ✅ Complete (2025-10-24)
**Priority**: High
**Dependencies**: cloudflare-d1, cloudflare-worker-base
**Actual Dev Time**: 5.5 hours
**Token Savings**: ~60%
**Errors Prevented**: 12

**What It Does**:
- Drizzle ORM setup for D1
- Schema definition with relations
- Type-safe queries with full TypeScript inference
- Migrations workflow (generate, test local, apply remote)
- D1 batch API transactions (not SQL BEGIN/COMMIT)
- Prepared statements with placeholders
- Query builder patterns
- Complete Hono Worker integration

**Production Validated**: Blog schema with users, posts, comments

**Auto-Trigger Keywords**:
- `drizzle orm`, `drizzle d1`, `orm cloudflare`
- `type-safe sql`, `drizzle schema`, `drizzle migrations`
- `d1 transaction error`, `foreign key constraint drizzle`

---

### Batch 5 - AI API/SDK Suite ⭐⭐⭐

**Overview**: Direct API integration skills for major AI providers (OpenAI, Anthropic Claude, Google Gemini). These complement existing ai-sdk-core/ai-sdk-ui skills by providing direct API access for use cases requiring provider-specific features, full control, or edge deployment without abstraction layers.

**Build Order**: Claude → OpenAI → Google
**Total Skills**: 9
**Total Dev Time**: 50-64 hours
**Average Token Savings**: ~60%
**Total Errors Prevented**: 90+

---

#### 18. claude-api
**Status**: Planned
**Priority**: Critical
**Dependencies**: None
**Estimated Dev Time**: 5-6 hours
**Token Savings**: ~62%
**Errors Prevented**: 10+

**What It Does**:
- Anthropic Messages API (v1/messages)
- Streaming responses with Server-Sent Events (SSE)
- Extended context (200k tokens for Claude 3.5 Sonnet)
- Prompt caching for cost optimization (up to 90% savings on repeated prompts)
- System prompts and multi-turn conversations
- Tool use (function calling with JSON schemas)
- Vision (image understanding with base64 or URLs)
- Thinking mode (extended reasoning for complex problems)
- Both Cloudflare Workers (fetch-based) and Node.js (@anthropic-ai/sdk)
- Rate limit handling (429 errors) and retry strategies

**Files to Create**:
- README.md (comprehensive auto-trigger keywords)
- SKILL.md (complete API reference, 800+ lines)
- templates/basic-chat.ts
- templates/streaming-chat.ts
- templates/prompt-caching.ts
- templates/tool-use.ts
- templates/vision.ts
- templates/thinking-mode.ts
- templates/cloudflare-worker.ts
- templates/nodejs-example.ts
- templates/package.json
- references/api-reference.md
- references/prompt-caching-guide.md
- references/tool-use-patterns.md
- references/vision-capabilities.md
- references/error-handling.md
- references/top-errors.md (10 common issues)
- scripts/check-versions.sh

**Known Issues to Prevent**:
1. Streaming SSE parsing errors (incorrect event format handling)
2. Prompt caching not activating (cache_control block placement)
3. Tool use response format errors (JSON schema mismatches)
4. Vision image format issues (base64 encoding requirements)
5. Rate limit handling (429 errors without exponential backoff)
6. Token counting mismatches for billing
7. System prompt ordering issues (must be first message)
8. Multi-turn conversation context management
9. Thinking mode not available on all models (only Claude 3.5 Sonnet+)
10. CORS errors in browser contexts (API key exposure)

**Production Validated**: Based on official Anthropic documentation and Claude API usage patterns

**Auto-Trigger Keywords**:
- `claude api`, `anthropic api`, `messages api`, `@anthropic-ai/sdk`
- `claude streaming`, `prompt caching claude`, `claude tool use`, `claude vision`
- `claude thinking mode`, `claude function calling`, `anthropic messages`
- Error keywords: `claude streaming error`, `prompt cache not working`, `anthropic 429`

---

#### 19. claude-agent-sdk
**Status**: Planned
**Priority**: High
**Dependencies**: claude-api (recommended)
**Estimated Dev Time**: 6-8 hours
**Token Savings**: ~65%
**Errors Prevented**: 12+

**What It Does**:
- Anthropic's Agent SDK for building production AI agents
- Agent orchestration patterns (plan → execute → reflect loops)
- Tool integration and tool chaining (sequential tool calls)
- Multi-step reasoning workflows with state persistence
- State management across agent runs (memory between executions)
- Memory and context persistence (long-term conversation tracking)
- Agentic loops with error recovery
- Comparison with cloudflare-agents (different architectures and use cases)
- Both Cloudflare Workers and Node.js environments

**Files to Create**:
- README.md (comprehensive auto-trigger keywords)
- SKILL.md (complete guide, 1000+ lines)
- templates/basic-agent.ts
- templates/agent-with-tools.ts
- templates/multi-step-agent.ts
- templates/stateful-agent.ts
- templates/agent-orchestration.ts
- templates/memory-agent.ts
- templates/cloudflare-worker-agent.ts
- templates/package.json
- references/agent-patterns.md
- references/tool-integration.md
- references/state-management.md
- references/comparison-with-cloudflare-agents.md
- references/best-practices.md
- references/top-errors.md (12 common issues)
- scripts/check-versions.sh

**Known Issues to Prevent**:
1. Agent loop infinite recursion (missing termination conditions)
2. Tool calling timeout errors (long-running tool executions)
3. State persistence failures (storage quota limits)
4. Memory overflow with long conversations (context window exceeded)
5. Tool response format mismatches (schema validation errors)
6. Agent handoff coordination issues (state transfer failures)
7. Streaming in multi-step workflows (buffer management)
8. Error recovery in agent loops (retry logic for tool failures)
9. Debugging agent reasoning (lack of observability)
10. Cost optimization for multi-turn agents (caching strategies)
11. Prompt engineering for agent behaviors (instruction clarity)
12. Context window management across steps (pruning strategies)

**Production Validated**: Based on Anthropic's Agent SDK documentation and best practices

**Auto-Trigger Keywords**:
- `claude agent sdk`, `anthropic agent`, `claude agents`, `agent orchestration`
- `claude multi-step`, `agent tools claude`, `stateful agent`, `agent memory`
- `agentic workflow`, `agent reasoning`, `claude agent loop`
- Error keywords: `agent loop infinite`, `agent timeout`, `agent state lost`

---

#### 20. openai-api
**Status**: Planned
**Priority**: Critical
**Dependencies**: None
**Estimated Dev Time**: 6-8 hours
**Token Savings**: ~60%
**Errors Prevented**: 10+

**What It Does**:
- Core OpenAI API endpoints:
  - Chat Completions (GPT-5, GPT-5-mini, GPT-5-nano, GPT-4o, o1, o3)
  - Embeddings (text-embedding-3-small, text-embedding-3-large)
  - Images (DALL-E 3 generation and editing)
  - Audio (Whisper transcription, TTS voices)
  - Moderation (content safety checks)
- Streaming with Server-Sent Events (SSE)
- Function calling (tool use with JSON schemas)
- Structured outputs with JSON schema (guaranteed valid JSON)
- Vision (image understanding with GPT-4o)
- Both Cloudflare Workers (fetch-based) and Node.js (openai SDK)

**Files to Create**:
- README.md (comprehensive auto-trigger keywords)
- SKILL.md (complete API reference, 900+ lines)
- templates/chat-completion.ts
- templates/streaming-chat.ts
- templates/function-calling.ts
- templates/structured-output.ts
- templates/embeddings.ts
- templates/image-generation.ts
- templates/vision.ts
- templates/audio-transcription.ts
- templates/text-to-speech.ts
- templates/moderation.ts
- templates/cloudflare-worker.ts
- templates/package.json
- references/models-guide.md (GPT-5, GPT-4o, o1, o3 comparison)
- references/function-calling-patterns.md
- references/structured-output-guide.md
- references/error-handling.md
- references/rate-limits.md
- references/cost-optimization.md
- references/top-errors.md (10 common issues)
- scripts/check-versions.sh

**Known Issues to Prevent**:
1. Rate limit errors (429) without exponential backoff
2. Function calling schema validation failures
3. Streaming SSE parsing errors (incomplete chunks)
4. Structured output JSON schema mismatches
5. Vision image encoding issues (base64 format)
6. Embeddings dimension mismatches (1536 vs 3072)
7. Audio file format incompatibility (Whisper requirements)
8. TTS voice availability errors (model-specific voices)
9. Token counting for billing accuracy
10. API key exposure in client-side code

**Production Validated**: Based on official OpenAI documentation and production usage patterns

**Auto-Trigger Keywords**:
- `openai api`, `gpt-5`, `gpt-5-mini`, `chatgpt api`, `openai sdk`
- `openai streaming`, `function calling openai`, `openai embeddings`, `dall-e 3`
- `whisper api`, `openai tts`, `gpt-4o`, `o1 model`, `o3 model`
- Error keywords: `openai rate limit`, `openai 429`, `function calling error`

---

#### 21. openai-responses ⭐ NEW!
**Status**: Planned
**Priority**: Critical
**Dependencies**: openai-api (recommended)
**Estimated Dev Time**: 5-6 hours
**Token Savings**: ~65%
**Errors Prevented**: 8+

**What It Does**:
- NEW unified Responses API (launched March 2025)
- Stateful conversations (vs stateless Chat Completions)
- Built-in Model Context Protocol (MCP) server integration
- Code Interpreter tool (integrated, no separate API)
- Image generation (integrated DALL-E support)
- File search capabilities (RAG without vector stores)
- Reusable prompts with variables (template system)
- Session management (automatic conversation history)
- Both Cloudflare Workers (fetch-based) and Node.js environments

**Files to Create**:
- README.md (comprehensive auto-trigger keywords emphasizing "new unified API")
- SKILL.md (complete guide, 700+ lines)
- templates/basic-response.ts
- templates/stateful-conversation.ts
- templates/mcp-server-integration.ts
- templates/code-interpreter.ts
- templates/image-generation-integrated.ts
- templates/file-search.ts
- templates/reusable-prompts.ts
- templates/package.json
- references/responses-vs-chat-completions.md
- references/mcp-integration-guide.md
- references/code-interpreter-patterns.md
- references/session-management.md
- references/migration-from-chat-completions.md
- references/top-errors.md (8 common issues)
- scripts/check-versions.sh

**Known Issues to Prevent**:
1. Session state not persisting across requests
2. MCP server connection failures (authentication errors)
3. Code Interpreter timeout errors (long executions)
4. Image generation rate limits (DALL-E quotas)
5. File search relevance issues (query optimization)
6. Reusable prompt variable substitution errors
7. Migration from Chat Completions API (breaking changes)
8. Cost tracking differences (stateful vs stateless pricing)

**Production Validated**: Based on official OpenAI Responses API documentation (March 2025 release)

**Auto-Trigger Keywords**:
- `openai responses api`, `responses api`, `stateful openai`, `openai mcp`
- `code interpreter openai`, `openai sessions`, `reusable prompts`, `unified api`
- `openai march 2025`, `responses vs chat completions`
- Error keywords: `responses api error`, `mcp server failed`, `session not found`

---

#### 22. openai-assistants
**Status**: Planned
**Priority**: High
**Dependencies**: openai-api (recommended)
**Estimated Dev Time**: 5-6 hours
**Token Savings**: ~55%
**Errors Prevented**: 12+

**What It Does**:
- Assistants API v2 (threads, runs, messages)
- Built-in tools:
  - Code Interpreter (data analysis, code execution, chart generation)
  - File Search (RAG with vector stores, up to 10,000 files per assistant)
  - Function Calling (custom tools with JSON schemas)
- Thread management (conversation persistence across sessions)
- Runs and streaming runs (real-time execution updates)
- Vector stores for file search (automatic embeddings)
- File uploads and management (up to 512MB per file)
- Both Cloudflare Workers (fetch-based) and Node.js (openai SDK)

**Files to Create**:
- README.md (comprehensive auto-trigger keywords)
- SKILL.md (complete guide, 900+ lines)
- templates/basic-assistant.ts
- templates/code-interpreter-assistant.ts
- templates/file-search-assistant.ts
- templates/function-calling-assistant.ts
- templates/streaming-assistant.ts
- templates/thread-management.ts
- templates/vector-store-setup.ts
- templates/file-uploads.ts
- templates/package.json
- references/assistants-api-v2.md
- references/code-interpreter-guide.md
- references/file-search-rag-guide.md
- references/thread-lifecycle.md
- references/vector-stores.md
- references/migration-from-v1.md
- references/top-errors.md (12 common issues)
- scripts/check-versions.sh

**Known Issues to Prevent**:
1. Assistant run status polling timeout errors
2. Vector store indexing delays (async processing)
3. File search relevance issues (chunking strategy)
4. Code Interpreter file output not found
5. Thread message limit exceeded (max 100k messages)
6. Function calling tool timeout errors
7. Streaming run interruption handling
8. Vector store quota limits (storage and retrieval)
9. File upload format compatibility issues
10. Assistant instructions token limit (32k max)
11. Run cancellation race conditions
12. Thread deletion while run is active

**Production Validated**: Based on official OpenAI Assistants API v2 documentation

**Auto-Trigger Keywords**:
- `openai assistants`, `assistants api`, `openai threads`, `openai runs`
- `code interpreter assistant`, `file search openai`, `vector store openai`
- `openai rag`, `assistant streaming`, `thread persistence`
- Error keywords: `assistant run failed`, `vector store error`, `thread not found`

---

#### 23. openai-realtime
**Status**: Planned
**Priority**: Medium
**Dependencies**: None
**Estimated Dev Time**: 4-5 hours
**Token Savings**: ~50%
**Errors Prevented**: 8+

**What It Does**:
- Realtime API for low-latency audio streaming
- Speech-to-speech (direct audio-to-audio processing)
- WebSocket connection patterns (persistent bidirectional)
- Audio input/output handling (PCM16 at 24kHz, Opus codec)
- Low-latency conversational AI (sub-second responses)
- Model Context Protocol (MCP) server support
- Image input support (multimodal with audio)
- SIP calling integration for phone systems (optional)
- Server-side WebSocket for Cloudflare Workers
- Client-side WebSocket for browsers

**Files to Create**:
- README.md (comprehensive auto-trigger keywords)
- SKILL.md (complete guide, 800+ lines)
- templates/realtime-client.ts (browser WebSocket)
- templates/realtime-server.ts (server WebSocket)
- templates/speech-to-speech.ts
- templates/audio-handling.ts
- templates/mcp-integration.ts
- templates/image-input.ts
- templates/cloudflare-worker-websocket.ts
- templates/package.json
- references/realtime-api-reference.md
- references/audio-formats.md
- references/websocket-patterns.md
- references/latency-optimization.md
- references/sip-calling-guide.md
- references/top-errors.md (8 common issues)
- scripts/check-versions.sh

**Known Issues to Prevent**:
1. WebSocket connection establishment failures
2. Audio format incompatibility (sample rate, codec)
3. PCM16 encoding errors (incorrect byte order)
4. WebSocket message buffering issues (latency spikes)
5. Audio chunk synchronization problems
6. MCP server connection timeout errors
7. Image input encoding for multimodal requests
8. SIP calling authentication failures

**Production Validated**: Based on official OpenAI Realtime API documentation

**Auto-Trigger Keywords**:
- `openai realtime`, `realtime api`, `speech to speech openai`, `audio streaming`
- `websocket openai`, `voice ai openai`, `low latency voice`, `sip calling`
- Error keywords: `realtime connection failed`, `audio format error`, `websocket closed`

---

#### 24. openai-batch
**Status**: Planned
**Priority**: Medium
**Dependencies**: openai-api (recommended)
**Estimated Dev Time**: 3-4 hours
**Token Savings**: ~50%
**Errors Prevented**: 6+

**What It Does**:
- Batch API for async processing (non-urgent workloads)
- 50% cost discount vs real-time API calls
- 24-hour result delivery (results available within 1 day)
- Bulk processing patterns (thousands of requests in one batch)
- JSONL file format (JSON Lines for batch input/output)
- Status polling and result retrieval
- Use cases: model evaluations, classification, synthetic data generation, summarization
- Both Cloudflare Workers (fetch-based) and Node.js environments

**Files to Create**:
- README.md (comprehensive auto-trigger keywords)
- SKILL.md (complete guide, 600+ lines)
- templates/create-batch.ts
- templates/poll-status.ts
- templates/retrieve-results.ts
- templates/jsonl-formatter.ts
- templates/evaluation-batch.ts
- templates/classification-batch.ts
- templates/package.json
- references/batch-api-reference.md
- references/jsonl-format.md
- references/use-cases.md
- references/cost-optimization.md
- references/top-errors.md (6 common issues)
- scripts/check-versions.sh

**Known Issues to Prevent**:
1. JSONL formatting errors (invalid line structure)
2. Batch file size limits (max 100MB)
3. Batch request limit exceeded (max 50k requests per batch)
4. Status polling timeout (24-hour window)
5. Result retrieval before batch completion
6. Custom ID collisions (duplicate IDs in batch)

**Production Validated**: Based on official OpenAI Batch API documentation

**Auto-Trigger Keywords**:
- `openai batch`, `batch api`, `async openai`, `bulk processing openai`
- `openai jsonl`, `batch jobs openai`, `cost optimization openai`, `50% discount`
- Error keywords: `batch failed`, `jsonl format error`, `batch status error`

---

#### 25. openai-agents-sdk ⚠️ Python-only
**Status**: Planned
**Priority**: Low (Python-specific)
**Dependencies**: None
**Estimated Dev Time**: 6-8 hours
**Token Savings**: ~60%
**Errors Prevented**: 10+

**What It Does**:
- OpenAI Agents SDK (Python framework, MIT license)
- Multi-agent workflows and orchestration (coordinated agent teams)
- Agent handoffs (transfer control between specialized agents)
- Guardrails (input/output validation with custom rules)
- Sessions (automatic conversation history management)
- Tracing and observability (visualize agent execution)
- Comparison with Responses API (TypeScript alternative for web projects)
- Python 3.9+ required

**Files to Create**:
- README.md (comprehensive auto-trigger keywords, note Python-only)
- SKILL.md (complete guide, 900+ lines)
- templates/basic-agent.py
- templates/multi-agent-workflow.py
- templates/handoffs.py
- templates/guardrails.py
- templates/sessions.py
- templates/tracing.py
- templates/requirements.txt
- references/agents-sdk-reference.md
- references/multi-agent-patterns.md
- references/handoff-strategies.md
- references/guardrails-guide.md
- references/tracing-observability.md
- references/typescript-alternatives.md (Responses API comparison)
- references/top-errors.md (10 common issues)
- scripts/check-versions.sh (Python version check)

**Known Issues to Prevent**:
1. Agent handoff state transfer failures
2. Guardrail validation rule conflicts
3. Session storage quota limits
4. Tracing data not persisting
5. Multi-agent coordination deadlocks
6. Python version compatibility issues (3.9+ required)
7. Dependency conflicts with openai SDK
8. Agent timeout in long workflows
9. Handoff loop detection failures
10. Observability data volume limits

**Production Validated**: Based on official OpenAI Agents SDK (openai-agents-python) documentation

**Auto-Trigger Keywords**:
- `openai agents sdk`, `openai-agents`, `openai agents python`, `multi-agent openai`
- `agent handoffs`, `guardrails openai`, `agent sessions`, `openai tracing`
- Error keywords: `agent handoff failed`, `guardrail validation error`, `session not found`

---

#### 26. google-gemini-api
**Status**: Planned
**Priority**: Critical
**Dependencies**: None
**Estimated Dev Time**: 8-10 hours
**Token Savings**: ~65%
**Errors Prevented**: 15+

**What It Does**:
- Complete Google GenAI SDK coverage (@google/generative-ai)
- Models: Gemini 2.5 Pro (2M context), Gemini 2.5 Flash, Gemini 2.5 Lite
- Text generation with streaming (real-time token delivery)
- Multimodal inputs (text + images + video + audio + PDFs in one prompt):
  - Images (JPEG, PNG, WebP, up to 20MB)
  - Video (MP4, MOV, AVI, up to 2GB)
  - Audio (WAV, MP3, FLAC, up to 20MB)
  - PDFs (native parsing, up to 30MB)
- File API (upload/manage large files up to 2GB)
- Long context (2M tokens for Pro model - entire codebases or books)
- Structured output (JSON mode with schema validation)
- Function calling (tool use with parallel execution)
- Embeddings (text-embedding-004 with 768 dimensions)
- Code execution (built-in Python code interpreter)
- Safety settings (harm categories: harassment, hate speech, sexually explicit, dangerous content)
- Grounding with Google Search (real-time web information)
- Context caching (cost optimization, up to 90% savings)
- Both Cloudflare Workers (fetch-based) and Node.js (@google/generative-ai)

**Files to Create**:
- README.md (comprehensive auto-trigger keywords)
- SKILL.md (complete API reference, 1200+ lines)
- templates/text-generation.ts
- templates/streaming-chat.ts
- templates/vision.ts
- templates/video-understanding.ts
- templates/audio-understanding.ts
- templates/pdf-parsing.ts
- templates/file-api.ts
- templates/long-context.ts
- templates/structured-output.ts
- templates/function-calling.ts
- templates/embeddings.ts
- templates/code-execution.ts
- templates/safety-settings.ts
- templates/grounding.ts
- templates/context-caching.ts
- templates/cloudflare-worker.ts
- templates/package.json
- references/models-guide.md (Pro/Flash/Lite comparison)
- references/multimodal-guide.md
- references/file-api-guide.md
- references/long-context-patterns.md
- references/structured-output-guide.md
- references/function-calling-patterns.md
- references/embeddings-guide.md
- references/code-execution-guide.md
- references/safety-settings-guide.md
- references/grounding-guide.md
- references/cost-optimization.md
- references/top-errors.md (15 common issues)
- scripts/check-versions.sh

**Known Issues to Prevent**:
1. File API quota limits (storage and upload rate)
2. Long context token counting errors (2M tokens)
3. Multimodal format issues (video/audio encoding)
4. PDF parsing failures (unsupported layouts)
5. JSON schema validation errors (structured output)
6. Function calling format mismatches (tool schemas)
7. Safety filter blocking responses (strict settings)
8. Context caching not activating (cache key mismatches)
9. Grounding quota limits (Google Search API)
10. Code execution security issues (sandboxing)
11. Embedding dimensions mismatch (768 dimensions)
12. Rate limit handling (429 errors)
13. Video processing timeout errors (large files)
14. Audio format incompatibility (codec support)
15. Large file upload failures (network interruptions)

**Production Validated**: Based on official Google AI documentation and Gemini API usage patterns

**Auto-Trigger Keywords**:
- `google gemini`, `gemini api`, `gemini 2.5`, `genai sdk`, `@google/generative-ai`
- `gemini vision`, `gemini video`, `gemini audio`, `gemini pdf`, `long context gemini`
- `gemini function calling`, `gemini embeddings`, `gemini code execution`, `gemini grounding`
- `2m tokens`, `context caching gemini`, `structured output gemini`, `multimodal gemini`
- Error keywords: `gemini rate limit`, `gemini safety filter`, `file api error`, `context too long`

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
- **Completed**: 29 skills ✅ (includes 10 skills not listed in main table)
- **In Main Table**: 19/32 complete (59%)
- **Additional Complete Skills**: cloudflare-full-stack-scaffold, cloudflare-full-stack-integration, cloudflare-email-routing, cloudflare-turnstile, cloudflare-cron-triggers, cloudflare-browser-rendering, sveltia-cms, tinacms, session-handoff-protocol, zustand-state-management
- **Batch 1 - Cloudflare Foundation**: 9/9 complete (100%) 🎯
- **Batch 2 - AI SDK & Auth & Frameworks**: 4/6 complete (67%)
- **Batch 3 - Cloudflare Advanced**: 3/6 complete (50%) 🎯
- **Batch 4 - Data & Utilities**: 2/2 complete (100%) 🎯
- **Batch 5 - AI API/SDK Suite**: 0/9 planned (0%) ⭐ NEW!

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
| **hono-routing** | **✅ Complete** | **4h** | **~56%** | **8** | High |
| **react-hook-form-zod** | **✅ Complete** | **4h** | **~60%** | **12** | High |
| **cloudflare-workflows** | **✅ Complete** | **4h** | **~67%** | **5** | Critical |
| **cloudflare-hyperdrive** | **✅ Complete** | **5h** | **~58%** | **10** | High |
| cloudflare-browser-rendering | Planned | 5-6h (est.) | ~50% | 8+ | Medium |
| cloudflare-cron-triggers | Planned | 3-4h (est.) | ~40% | 6+ | Medium |
| cloudflare-email-workers | Planned | 4-5h (est.) | ~45% | 7+ | Medium |
| **tanstack-query** | **✅ Complete** | **4h** | **~55%** | **8** | Medium |
| **drizzle-orm-d1** | **✅ Complete** | **5.5h** | **~60%** | **12** | High |
| claude-api | Planned | 5-6h (est.) | ~62% | 10+ | Critical |
| claude-agent-sdk | Planned | 6-8h (est.) | ~65% | 12+ | High |
| openai-api | Planned | 6-8h (est.) | ~60% | 10+ | Critical |
| openai-responses | Planned | 5-6h (est.) | ~65% | 8+ | Critical |
| openai-assistants | Planned | 5-6h (est.) | ~55% | 12+ | High |
| openai-realtime | Planned | 4-5h (est.) | ~50% | 8+ | Medium |
| openai-batch | Planned | 3-4h (est.) | ~50% | 6+ | Medium |
| openai-agents-sdk | Planned | 6-8h (est.) | ~60% | 10+ | Low |
| google-gemini-api | Planned | 8-10h (est.) | ~65% | 15+ | Critical |

**Total Skills In Table**: 32 (19 complete, 13 to build)
**Total Skills In Repo**: 29 (all complete)
**Batch 5 (Planned)**: 9 skills - AI API/SDK Suite (Claude, OpenAI, Google Gemini)

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

### Planned Enhancement: cloudflare-full-stack-scaffold v2.0

**Status**: Planned (2025-10-24)
**Type**: Major enhancement to existing skill
**Priority**: High
**Estimated Dev Time**: 12-15 hours

**Goal**: Make the full-stack scaffold more comprehensive with real-time features, advanced AI pipelines, and production-ready file uploads.

**Approach**: Opt-in scripts (maintain current pattern like enable-auth.sh)

**Features to Add**:

**1. Real-time Features** (3 opt-in scripts):
- `enable-realtime-chat.sh` - Durable Objects chat room with WebSocket Hibernation, message history, presence tracking
- `enable-collaborative-editing.sh` - Multi-user document editing with operational transforms, conflict resolution
- `enable-live-notifications.sh` - Server-sent events for real-time updates (messages, status changes, job completion)

**2. AI Capability Pipelines** (4 opt-in scripts):
- `enable-rag-pipeline.sh` - Complete RAG: Upload docs → Vectorize embeddings → Workers AI retrieval → Stream response with sources
- `enable-multi-agent.sh` - Multi-agent orchestration using cloudflare-agents SDK (research → writer → editor)
- `enable-ai-database.sh` - Natural language → SQL queries, AI-powered data analysis, chat with D1 database
- `enable-ai-vision.sh` - Image/video/audio processing → text extraction → embeddings → multimodal search

**3. Comprehensive File Uploads** (1 opt-in script):
- `enable-file-uploads.sh` - Drag-drop, multiple files, previews (images/PDFs), progress bars, error handling, presigned URLs, client-side R2 uploads

**New Backend Routes** (8 total):
- `backend/routes/realtime-chat.ts` (Durable Object)
- `backend/routes/collaborative-editing.ts` (Durable Object)
- `backend/routes/live-notifications.ts` (SSE)
- `backend/routes/rag-pipeline.ts` (Vectorize + Workers AI)
- `backend/routes/multi-agent.ts` (cloudflare-agents SDK)
- `backend/routes/ai-database.ts` (natural language → SQL)
- `backend/routes/ai-vision.ts` (multimodal processing)
- `backend/routes/file-uploads.ts` (R2 presigned URLs)

**New Frontend Components** (8 total):
- `src/components/RealtimeChat.tsx`
- `src/components/CollaborativeEditor.tsx`
- `src/components/LiveNotifications.tsx`
- `src/components/FileUploader.tsx`
- `src/pages/RAGDemo.tsx`
- `src/pages/MultiAgentDemo.tsx`
- `src/pages/AIDatabaseChat.tsx`
- `src/pages/VisionDemo.tsx`

**Documentation Updates**:
- Update `docs/ARCHITECTURE.md` with real-time and AI pipeline patterns
- Update `scaffold/README.md` with all new features
- Add comprehensive examples to SKILL.md
- Update token savings metrics (estimated ~85% vs building from scratch)

**Why These Features**:
- **Real-time**: Essential for modern collaborative apps, chat interfaces, live dashboards
- **AI pipelines**: Showcase integration between multiple Cloudflare services (D1 + Vectorize + Workers AI + R2)
- **File uploads**: Missing UI component despite R2 being configured - common requirement
- **All opt-in**: Keeps base scaffold simple, users enable only what they need

**Token Savings**: ~85% (estimated) vs building these features from scratch
**Production Value**: Transforms scaffold from "starter" to "production-ready for AI-powered SaaS"

---

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

**Last Updated**: 2025-10-24 (Added: Batch 5 - AI API/SDK Suite - 9 new skills planned)
**Next Review**: 2025-10-31
**Maintainer**: Jeremy Dawes | jeremy@jezweb.net
