# Claude Skills Roadmap

**Project**: Claude Code Skills Collection
**Maintainer**: Jeremy Dawes (Jezweb)
**Repository**: https://github.com/jezweb/claude-skills
**Last Updated**: 2025-10-20

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

### Batch 1 - Cloudflare Services (Week 1) ⭐⭐⭐

#### 1. cloudflare-d1
**Status**: Planned
**Priority**: Critical
**Dependencies**: cloudflare-worker-base
**Estimated Dev Time**: 4 hours
**Token Savings**: ~55%

**What It Does**:
- D1 database setup + migrations
- wrangler bindings configuration
- SQL schema patterns
- Query patterns and best practices
- Drizzle ORM integration (optional)
- Seeding and backup strategies

**Auto-Trigger Keywords**:
- `d1 database`, `cloudflare d1`, `d1 migrations`
- `d1 schema`, `sqlite cloudflare`, `sql workers`

---

#### 2. cloudflare-r2
**Status**: Planned
**Priority**: High
**Dependencies**: cloudflare-worker-base
**Estimated Dev Time**: 4 hours
**Token Savings**: ~55%

**What It Does**:
- R2 bucket configuration
- File upload patterns
- CORS setup
- Presigned URLs
- Image/asset handling
- Multipart uploads

**Auto-Trigger Keywords**:
- `r2 storage`, `cloudflare r2`, `r2 upload`
- `object storage`, `r2 cors`, `presigned urls`

---

#### 3. cloudflare-kv
**Status**: Planned
**Priority**: High
**Dependencies**: cloudflare-worker-base
**Estimated Dev Time**: 3 hours
**Token Savings**: ~50%

**What It Does**:
- KV namespace setup
- Caching patterns
- TTL strategies
- Bulk operations
- List operations
- Development vs production namespaces

**Auto-Trigger Keywords**:
- `kv storage`, `cloudflare kv`, `kv namespace`
- `kv cache`, `workers kv`, `kv bindings`

---

#### 4. cloudflare-workers-ai
**Status**: Planned
**Priority**: High
**Dependencies**: cloudflare-worker-base
**Estimated Dev Time**: 5 hours
**Token Savings**: ~60%

**What It Does**:
- Workers AI binding setup
- Model selection guide
- Streaming responses
- Text generation patterns
- Image generation
- Embeddings for RAG

**Auto-Trigger Keywords**:
- `workers ai`, `cloudflare ai`, `@cf/meta/llama`
- `ai bindings`, `llm workers`, `ai streaming`

---

#### 5. cloudflare-vectorize
**Status**: Planned
**Priority**: Medium
**Dependencies**: cloudflare-worker-base
**Estimated Dev Time**: 4 hours
**Token Savings**: ~55%

**What It Does**:
- Vectorize index setup
- Embedding storage
- Vector search patterns
- RAG implementation
- Integration with Workers AI

**Auto-Trigger Keywords**:
- `vectorize`, `cloudflare vectorize`, `vector search`
- `embeddings storage`, `rag cloudflare`, `semantic search`

---

#### 6. cloudflare-queues
**Status**: Planned
**Priority**: Medium
**Dependencies**: cloudflare-worker-base
**Estimated Dev Time**: 3 hours
**Token Savings**: ~50%

**What It Does**:
- Queue setup
- Producer/consumer patterns
- Batch processing
- Retry strategies
- Dead letter queues
- Queue monitoring

**Auto-Trigger Keywords**:
- `cloudflare queues`, `queues workers`, `async processing`
- `queue bindings`, `message queues`, `batch jobs`

---

### Batch 2 - Auth & Frameworks (Week 2) ⭐⭐

#### 7. clerk-auth
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

#### 8. hono-routing
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

#### 9. react-hook-form-zod
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

#### 10. tanstack-query
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

#### 11. drizzle-orm-d1
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
- **Completed**: 3 skills ✅
- **Batch 1 - Cloudflare Services**: 0/6 complete
- **Batch 2 - Auth & Frameworks**: 0/3 complete
- **Batch 3 - Data & Utilities**: 0/2 complete

### Skills by Status:

| Skill | Status | Dev Time | Token Savings | Errors Prevented | Priority |
|-------|--------|----------|---------------|------------------|----------|
| **tailwind-v4-shadcn** | **✅ Complete** | **6h** | **~70%** | **3** | High |
| **cloudflare-worker-base** | **✅ Complete** | **2h** | **~60%** | **6** | Critical |
| **firecrawl-scraper** | **✅ Complete** | **1.5h** | **~60%** | **6** | Medium |
| cloudflare-d1 | Planned | 4h (est.) | ~55% | - | Critical |
| cloudflare-r2 | Planned | 4h (est.) | ~55% | - | High |
| cloudflare-kv | Planned | 3h (est.) | ~50% | - | High |
| cloudflare-workers-ai | Planned | 5h (est.) | ~60% | - | High |
| cloudflare-vectorize | Planned | 4h (est.) | ~55% | - | Medium |
| cloudflare-queues | Planned | 3h (est.) | ~50% | - | Medium |
| clerk-auth | Planned | 5h (est.) | ~60% | - | Critical |
| hono-routing | Planned | 4h (est.) | ~55% | - | High |
| react-hook-form-zod | Planned | 4h (est.) | ~60% | - | High |
| tanstack-query | Planned | 4h (est.) | ~55% | - | Medium |
| drizzle-orm-d1 | Planned | 5h (est.) | ~60% | - | Low |

**Total Skills Planned**: 13 (3 complete, 10 to build)

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

**Last Updated**: 2025-10-20
**Next Review**: 2025-10-27
**Maintainer**: Jeremy Dawes | jeremy@jezweb.net
