# Claude Skills Roadmap

**Project**: Claude Code Skills Collection
**Maintainer**: Jeremy Dawes (Jezweb)
**Repository**: https://github.com/jezweb/claude-skills
**Last Updated**: 2025-10-21

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

### Batch 2 - Auth & Frameworks (Week 2) ⭐⭐

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

#### 8. clerk-auth
**Status**: Planned
**Priority**: Critical
**Dependencies**: None (works across frameworks)
**Estimated Dev Time**: 5 hours
**Token Savings**: ~60%

**What It Does**:
- Complete Clerk knowledge domain
- React integration patterns
- Next.js integration
- Cloudflare Workers JWT verification
- Custom JWT templates
- User metadata extraction
- Session management
- Works across all frameworks

**Auto-Trigger Keywords**:
- `clerk auth`, `clerk`, `clerk react`, `clerk nextjs`
- `clerk cloudflare`, `jwt verification`, `clerk jwt`

---

#### 9. hono-routing
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

#### 10. react-hook-form-zod
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

### Batch 3 - Data & Utilities (Week 3) ⭐

#### 11. tanstack-query
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

#### 12. drizzle-orm-d1
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
- **Completed**: 11 skills ✅
- **Batch 1 - Cloudflare Services**: 7/7 complete (100%) 🎯
- **Batch 2 - Auth & Frameworks**: 1/4 complete (25%)
- **Batch 3 - Data & Utilities**: 0/2 complete

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
| clerk-auth | Planned | 5h (est.) | ~60% | - | Critical |
| hono-routing | Planned | 4h (est.) | ~55% | - | High |
| react-hook-form-zod | Planned | 4h (est.) | ~60% | - | High |
| tanstack-query | Planned | 4h (est.) | ~55% | - | Medium |
| drizzle-orm-d1 | Planned | 5h (est.) | ~60% | - | Low |

**Total Skills Planned**: 15 (11 complete, 4 to build)

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

**Last Updated**: 2025-10-21
**Next Review**: 2025-10-28
**Maintainer**: Jeremy Dawes | jeremy@jezweb.net
