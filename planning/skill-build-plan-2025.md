# Comprehensive Skill Build Plan
**Date**: 2025-10-24
**Status**: Ready for Implementation
**Total Skills**: 13 (1 exists, 12 to build)

---

## 🔍 Documentation Audit Results

### Critical Findings

**Skills That Exist But Aren't in Repo:**
1. ✅ **tailwind-v4-shadcn** - EXISTS in `~/.claude/skills/` but NOT in repo
   - Status: Production ready, fully complete
   - Action needed: Move to repo and commit

**Skills Marked Incomplete But Are Complete:**
2. ✅ **cloudflare-full-stack-scaffold** - 100% complete (roadmap says 40%)
3. ✅ **tanstack-query** - 100% complete (roadmap says planned)

**Skills Actually Missing:**
- zustand, drizzle-orm-d1, stripe-payments, resend-email, mastra-ai, openrouter, vitest, authjs, playwright, sentry, cloudflare-images, react-email

---

## 📋 Master Build Plan

### Phase 1: Documentation Fixes (30 minutes)
**Priority**: URGENT
**Tasks**:
1. Move tailwind-v4-shadcn from ~/.claude/skills/ to repo
2. Update roadmap: cloudflare-full-stack-scaffold = 100%
3. Update roadmap: tanstack-query = ✅ Complete
4. Commit all three with proper messages

---

### Phase 2: Quick Wins (Week 1-2)

#### Skill 1: tailwind-v4-shadcn ✅ (Already Exists)
**Status**: Complete - Just needs to be added to repo
**Action**: 
```bash
# Copy from ~/.claude/skills/ to repo
cp -r ~/.claude/skills/tailwind-v4-shadcn /home/jez/Documents/claude-skills/skills/
git add skills/tailwind-v4-shadcn
git commit -m "Add tailwind-v4-shadcn skill (production-tested)"
```

---

#### Skill 2: zustand (State Management)
**Priority**: HIGH
**Estimated Time**: 3-4 hours
**Token Savings**: ~50%
**Errors Prevented**: 4-5

**Why Build This:**
- You explicitly mention using Zustand for client state
- Complements tanstack-query (server state)
- Simple, atomic skill
- High frequency use in React apps

**Scope:**
- Store creation patterns
- TypeScript setup with immer middleware
- Persist middleware (localStorage)
- Selectors and performance optimization
- DevTools integration
- Slices pattern for large stores
- Common mistakes (mutation warnings)

**Templates to Create (7 files):**
1. `basic-store.ts` - Simple counter/toggle examples
2. `typescript-store.ts` - Full type-safe store
3. `immer-middleware.ts` - Nested state updates
4. `persist-middleware.ts` - localStorage integration
5. `slices-pattern.ts` - Large store organization
6. `selectors-pattern.ts` - Performance optimization
7. `package.json` - Dependencies

**References to Create (5 files):**
1. `middleware-guide.md` - All middleware options
2. `typescript-patterns.md` - Type inference, strict mode
3. `devtools-setup.md` - Redux DevTools integration
4. `common-errors.md` - 5 documented errors
5. `links-to-official-docs.md`

**Known Errors to Document:**
1. Direct mutation warnings (use immer)
2. Selector re-render issues
3. Persist middleware hydration timing
4. TypeScript inference errors
5. DevTools not connecting

**Package Versions:**
- `zustand@5.0.2` (latest)
- `immer@10.1.1` (for immer middleware)

**Auto-Trigger Keywords:**
- `zustand`, `zustand store`, `global state`, `client state management`
- `useStore`, `create zustand`, `zustand typescript`, `zustand middleware`
- `zustand persist`, `zustand immer`, `zustand devtools`
- Error keywords: `"mutation warning"`, `"zustand not updating"`, `"persist not working"`

**Production Test:**
- Build example todo app with persist + immer
- Verify all templates work
- Test TypeScript strict mode

---

#### Skill 3: drizzle-orm-d1
**Priority**: HIGH
**Estimated Time**: 5-6 hours
**Token Savings**: ~60%
**Errors Prevented**: 8-10

**Why Build This:**
- On roadmap already
- Complements cloudflare-d1 skill
- Type-safe SQL queries
- Better DX than raw SQL
- Migration management

**Scope:**
- Drizzle setup with D1 adapter
- Schema definition (tables, relations, indexes)
- Type-safe queries (select, insert, update, delete)
- Drizzle Kit migrations
- Relations and joins
- Prepared statements
- Transactions
- Integration with Cloudflare Workers

**Templates to Create (10 files):**
1. `drizzle.config.ts` - Drizzle Kit configuration
2. `schema.ts` - Complete schema example (users, posts, comments)
3. `client.ts` - D1 + Drizzle client setup
4. `basic-queries.ts` - CRUD operations
5. `relations-queries.ts` - Joins and relations
6. `migrations-example/` - Migration workflow
7. `transactions.ts` - Transaction patterns
8. `prepared-statements.ts` - Performance optimization
9. `cloudflare-worker-integration.ts` - Full Worker example
10. `package.json`

**References to Create (6 files):**
1. `wrangler-setup.md` - Local and remote D1 config
2. `schema-patterns.md` - All column types, constraints
3. `migration-workflow.md` - Generate, apply, verify
4. `query-builder-api.md` - Complete API reference
5. `common-errors.md` - 10 documented errors
6. `links-to-official-docs.md`

**Known Errors to Document:**
1. D1 binding not found
2. Migration apply failures
3. Schema inference errors
4. Relations not loading
5. Prepared statement caching issues
6. Transaction rollback patterns
7. TypeScript strict mode errors
8. Drizzle Kit config not found
9. Remote vs local D1 confusion
10. wrangler.toml vs wrangler.jsonc

**Package Versions:**
- `drizzle-orm@0.39.1` (latest)
- `drizzle-kit@0.31.2` (latest)
- `@cloudflare/workers-types@latest`

**Auto-Trigger Keywords:**
- `drizzle orm`, `drizzle d1`, `drizzle cloudflare`, `type-safe sql`
- `drizzle schema`, `drizzle migrations`, `drizzle kit`, `orm cloudflare`
- `drizzle relations`, `drizzle typescript`, `d1 orm`
- Error keywords: `"drizzle migration failed"`, `"schema not found"`, `"d1 binding error"`

**Dependencies:**
- cloudflare-d1 skill (binding setup)
- cloudflare-worker-base (project structure)

**Production Test:**
- Build blog example with users, posts, comments
- Run full migration workflow
- Test relations and joins
- Verify Worker integration

---

### Phase 3: SaaS Essentials (Week 3-4)

#### Skill 4: stripe-payments
**Priority**: CRITICAL
**Estimated Time**: 6-8 hours
**Token Savings**: ~65%
**Errors Prevented**: 12-15

**Why Build This:**
- Essential for monetization
- Complex setup with many gotchas
- Webhook verification is critical
- High error potential
- Huge token savings

**Scope:**
- Stripe SDK setup for Cloudflare Workers
- Checkout Session creation
- Subscription management (create, update, cancel)
- Webhook signature verification
- Customer portal
- Payment intents (one-time payments)
- Invoice management
- Idempotency patterns
- TypeScript types
- Test mode vs production

**Templates to Create (12 files):**
1. `stripe-client.ts` - Stripe SDK initialization
2. `checkout-session.ts` - Create checkout for products/subscriptions
3. `subscription-create.ts` - Subscription flow
4. `subscription-update.ts` - Plan changes, quantity
5. `subscription-cancel.ts` - Cancel/resume patterns
6. `webhook-handler.ts` - Signature verification + event handling
7. `customer-portal.ts` - Self-service portal session
8. `payment-intent.ts` - One-time payments
9. `idempotency-patterns.ts` - Prevent duplicate charges
10. `worker-integration.ts` - Complete Hono Worker example
11. `wrangler-config.jsonc` - Env vars and secrets
12. `package.json`

**References to Create (8 files):**
1. `webhook-events-reference.md` - All event types
2. `subscription-lifecycle.md` - All subscription states
3. `testing-guide.md` - Test mode, Stripe CLI
4. `security-best-practices.md` - Secrets, verification
5. `common-errors.md` - 15 documented errors
6. `typescript-types.md` - Stripe object types
7. `cloudflare-workers-setup.md` - Workers-specific patterns
8. `links-to-official-docs.md`

**Known Errors to Document:**
1. Webhook signature verification failures
2. Idempotency key conflicts
3. Customer not found errors
4. Subscription already canceled
5. Invalid API key errors
6. Missing price/product ID
7. Currency mismatch errors
8. Payment method required
9. Invoice already paid
10. Webhook endpoint URL not HTTPS
11. Metadata size limits exceeded
12. Test mode vs live mode confusion
13. Subscription schedule conflicts
14. Proration issues
15. Coupon/discount errors

**Package Versions:**
- `stripe@18.5.0` (latest)
- `@stripe/stripe-js@5.6.0` (frontend, optional)

**Auto-Trigger Keywords:**
- `stripe`, `stripe payments`, `stripe subscriptions`, `stripe checkout`
- `stripe webhooks`, `payment processing`, `subscription billing`
- `stripe customer portal`, `payment intents`, `stripe cloudflare`
- `stripe idempotency`, `stripe test mode`, `stripe typescript`
- Error keywords: `"webhook verification failed"`, `"stripe customer not found"`, `"idempotency key"`, `"subscription error"`

**Dependencies:**
- cloudflare-worker-base (Hono setup)
- clerk-auth (optional, for user->customer mapping)

**Production Test:**
- Create test subscription flow
- Verify webhook signature locally
- Test cancel/resume flow
- Verify idempotency
- Test customer portal

---

#### Skill 5: resend-email
**Priority**: HIGH
**Estimated Time**: 3-4 hours
**Token Savings**: ~55%
**Errors Prevented**: 6-8

**Why Build This:**
- Modern email API
- Simpler than SendGrid/Mailgun
- Pairs well with Stripe (receipts, notifications)
- Great DX

**Scope:**
- Resend SDK setup
- Sending transactional emails
- Email templates (plain text + HTML)
- React Email integration (optional)
- Domain verification
- Batch sending
- Scheduling emails
- Attachments
- Error handling
- Rate limits

**Templates to Create (9 files):**
1. `resend-client.ts` - SDK initialization
2. `send-simple-email.ts` - Basic email
3. `send-html-email.ts` - HTML template
4. `send-with-attachments.ts` - File attachments
5. `batch-send.ts` - Multiple recipients
6. `react-email-integration.ts` - React Email components
7. `worker-integration.ts` - Hono Worker example
8. `wrangler-config.jsonc` - API key setup
9. `package.json`

**References to Create (6 files):**
1. `domain-verification-guide.md` - DNS records setup
2. `email-templates.md` - Best practices, examples
3. `react-email-setup.md` - React Email integration
4. `rate-limits.md` - Rate limits per tier
5. `common-errors.md` - 8 documented errors
6. `links-to-official-docs.md`

**Known Errors to Document:**
1. Domain not verified
2. API key invalid/missing
3. From address not allowed
4. Rate limit exceeded
5. Invalid email format
6. Attachment size limit
7. Missing required fields (to, from, subject)
8. React Email build errors

**Package Versions:**
- `resend@5.1.0` (latest)
- `react-email@3.0.3` (optional)
- `@react-email/components@0.0.34` (optional)

**Auto-Trigger Keywords:**
- `resend`, `resend email`, `transactional email`, `send email`
- `resend api`, `email cloudflare`, `resend worker`, `email templates`
- `react email resend`, `domain verification email`
- Error keywords: `"domain not verified"`, `"resend api key"`, `"email failed"`

**Dependencies:**
- cloudflare-worker-base (optional, for Worker integration)
- react-email skill (optional, if created separately)

**Production Test:**
- Send test email
- Verify domain setup
- Test HTML templates
- Verify error handling

---

### Phase 4: AI & Developer Tools (Week 5-6)

#### Skill 6: mastra-ai
**Priority**: MEDIUM-HIGH
**Estimated Time**: 6-7 hours
**Token Savings**: ~60%
**Errors Prevented**: 10-12

**Why Build This:**
- You explicitly mention using Mastra
- AI agent framework
- Cloudflare integration built-in
- Complex setup with many moving parts

**Scope:**
- Mastra installation and setup
- Agent creation and configuration
- Memory management (short-term, long-term)
- Tools and function calling
- Workflow management
- LLM integrations (OpenAI, Anthropic, Cloudflare)
- Storage backends (D1, KV, Vectorize)
- Cloudflare deployment
- Multi-agent orchestration

**Templates to Create (11 files):**
1. `mastra.config.ts` - Main configuration
2. `basic-agent.ts` - Simple agent example
3. `agent-with-tools.ts` - Function calling
4. `agent-with-memory.ts` - Memory patterns
5. `workflow-example.ts` - Multi-step workflows
6. `cloudflare-d1-storage.ts` - D1 storage backend
7. `cloudflare-vectorize-memory.ts` - Vector memory
8. `multi-agent-orchestration.ts` - Agent coordination
9. `worker-deployment.ts` - Cloudflare Workers integration
10. `wrangler-config.jsonc` - Complete bindings
11. `package.json`

**References to Create (7 files):**
1. `cloudflare-integration-guide.md` - All CF services
2. `agent-patterns.md` - Agent design patterns
3. `memory-strategies.md` - Memory architectures
4. `tool-creation-guide.md` - Custom tools
5. `deployment-guide.md` - Cloudflare deployment
6. `common-errors.md` - 12 documented errors
7. `links-to-official-docs.md`

**Known Errors to Document:**
1. Configuration file not found
2. LLM provider API key missing
3. Storage backend connection failures
4. Memory serialization errors
5. Tool execution timeouts
6. Workflow state corruption
7. Multi-agent deadlocks
8. Cloudflare binding errors
9. D1 schema mismatch
10. Vectorize dimension errors
11. Deployment bundle size issues
12. TypeScript type inference errors

**Package Versions:**
- `@mastra/core@latest`
- `@mastra/deployer-cloudflare@latest` (if exists)
- Check official docs for current versions

**Auto-Trigger Keywords:**
- `mastra`, `mastra ai`, `mastra agent`, `mastra framework`
- `ai agents mastra`, `mastra cloudflare`, `mastra workflow`
- `mastra memory`, `mastra tools`, `agent orchestration`
- Error keywords: `"mastra config"`, `"agent failed"`, `"workflow error"`

**Dependencies:**
- cloudflare-worker-base
- cloudflare-d1 (for storage)
- cloudflare-vectorize (for memory)
- ai-sdk-core (optional)

**Production Test:**
- Build simple agent with memory
- Test tool calling
- Verify workflow execution
- Deploy to Cloudflare Workers

---

#### Skill 7: openrouter
**Priority**: MEDIUM
**Estimated Time**: 3-4 hours
**Token Savings**: ~45%
**Errors Prevented**: 5-7

**Why Build This:**
- You mention using it for "free API to all providers"
- Multi-provider access
- Cost optimization
- Fallback patterns

**Scope:**
- OpenRouter API setup
- Model selection and routing
- Provider fallbacks
- Cost tracking
- Streaming responses
- Function calling (if supported)
- Rate limit handling
- Error handling per provider

**Templates to Create (8 files):**
1. `openrouter-client.ts` - API client setup
2. `model-selection.ts` - Model routing patterns
3. `streaming-response.ts` - Streaming chat
4. `provider-fallback.ts` - Fallback chain
5. `cost-tracking.ts` - Usage monitoring
6. `worker-integration.ts` - Hono Worker example
7. `wrangler-config.jsonc` - API key setup
8. `package.json`

**References to Create (6 files):**
1. `model-catalog.md` - Available models and pricing
2. `provider-comparison.md` - Provider capabilities
3. `rate-limits.md` - Per-provider limits
4. `cost-optimization.md` - Best practices
5. `common-errors.md` - 7 documented errors
6. `links-to-official-docs.md`

**Known Errors to Document:**
1. API key invalid
2. Model not found/unavailable
3. Provider rate limit exceeded
4. Insufficient credits
5. Invalid request format per provider
6. Streaming not supported (some models)
7. Context length exceeded

**Package Versions:**
- Check if OpenRouter has official SDK
- Otherwise: fetch API with proper types

**Auto-Trigger Keywords:**
- `openrouter`, `openrouter api`, `multi llm provider`
- `openrouter cloudflare`, `model routing`, `llm fallback`
- `openrouter cost`, `openrouter streaming`
- Error keywords: `"model not available"`, `"rate limit openrouter"`, `"credits exceeded"`

**Dependencies:**
- cloudflare-worker-base (optional)

**Production Test:**
- Test multiple providers
- Verify fallback chain
- Test streaming
- Verify cost tracking

---

#### Skill 8: vitest
**Priority**: HIGH
**Estimated Time**: 4-5 hours
**Token Savings**: ~50%
**Errors Prevented**: 8-10

**Why Build This:**
- Testing is essential
- Vite-native (fast)
- Works with Cloudflare Workers
- TypeScript support

**Scope:**
- Vitest installation and setup
- Test file structure and naming
- Unit testing patterns
- Integration testing
- Mocking (modules, functions, env)
- Coverage configuration
- Watch mode
- CI/CD integration
- Testing Cloudflare Workers (Miniflare)
- Snapshot testing

**Templates to Create (10 files):**
1. `vitest.config.ts` - Complete configuration
2. `basic-unit-test.test.ts` - Simple tests
3. `async-test.test.ts` - Async operations
4. `mock-modules.test.ts` - Module mocking
5. `mock-env.test.ts` - Environment variables
6. `cloudflare-worker-test.test.ts` - Worker testing with Miniflare
7. `integration-test.test.ts` - Integration patterns
8. `snapshot-test.test.ts` - Snapshot testing
9. `test-utils.ts` - Shared test utilities
10. `package.json`

**References to Create (7 files):**
1. `cloudflare-workers-testing.md` - Miniflare setup
2. `mocking-guide.md` - All mocking patterns
3. `coverage-setup.md` - Coverage config and CI
4. `ci-integration.md` - GitHub Actions, etc.
5. `best-practices.md` - Test organization
6. `common-errors.md` - 10 documented errors
7. `links-to-official-docs.md`

**Known Errors to Document:**
1. Module not found in tests
2. TypeScript path alias errors
3. Environment variable not defined
4. Async timeout errors
5. Mock not clearing between tests
6. Coverage threshold failures
7. Miniflare binding errors
8. Snapshot mismatch
9. Watch mode file detection issues
10. CI timeout errors

**Package Versions:**
- `vitest@3.0.9` (latest)
- `@vitest/ui@3.0.9` (UI)
- `@vitest/coverage-v8@3.0.9` (coverage)
- `@cloudflare/vitest-pool-workers@latest` (for Worker testing)

**Auto-Trigger Keywords:**
- `vitest`, `vitest testing`, `unit test vite`, `test cloudflare`
- `vitest config`, `vitest mock`, `vitest coverage`, `vitest worker`
- `miniflare test`, `test typescript vite`
- Error keywords: `"vitest module not found"`, `"mock not working"`, `"coverage failed"`

**Dependencies:**
- None (works standalone)

**Production Test:**
- Write tests for example Worker
- Verify mocking works
- Test coverage reports
- Verify CI integration

---

### Phase 5: Testing & Monitoring (Week 7-8)

#### Skill 9: authjs
**Priority**: MEDIUM
**Estimated Time**: 6-7 hours
**Token Savings**: ~60%
**Errors Prevented**: 10-12

**Why Build This:**
- Alternative to Clerk (more flexible, self-hosted)
- Official D1 adapter support
- Next.js, SvelteKit, standalone
- Free and open source

**Scope:**
- Auth.js setup (formerly NextAuth)
- D1 adapter configuration
- OAuth provider setup (Google, GitHub, etc.)
- Email provider (magic links)
- JWT configuration
- Session management
- Callbacks and events
- TypeScript setup
- Cloudflare Workers deployment
- Multi-framework support

**Templates to Create (12 files):**
1. `auth-config.ts` - Core configuration
2. `d1-adapter-setup.ts` - D1 adapter with schema
3. `oauth-providers.ts` - Google, GitHub examples
4. `email-provider.ts` - Magic link setup
5. `jwt-config.ts` - JWT customization
6. `session-callbacks.ts` - Session/JWT callbacks
7. `nextjs-integration.ts` - Next.js App Router
8. `worker-integration.ts` - Standalone Worker
9. `middleware-patterns.ts` - Protected routes
10. `database-schema.sql` - D1 schema for Auth.js
11. `wrangler-config.jsonc` - Complete bindings
12. `package.json`

**References to Create (8 files):**
1. `d1-adapter-guide.md` - D1 setup and migrations
2. `provider-setup.md` - All OAuth providers
3. `email-provider-guide.md` - Magic link + Resend
4. `session-strategies.md` - JWT vs database sessions
5. `cloudflare-deployment.md` - Workers-specific setup
6. `multi-framework-guide.md` - Next.js, Vite, etc.
7. `common-errors.md` - 12 documented errors
8. `links-to-official-docs.md`

**Known Errors to Document:**
1. D1 adapter schema mismatch
2. OAuth redirect URI mismatch
3. Secret key not set
4. Session token not found
5. Provider configuration errors
6. Email delivery failures
7. CSRF token mismatch
8. Callback URL errors
9. D1 binding not found
10. Session expired handling
11. TypeScript type errors
12. Cloudflare Workers middleware issues

**Package Versions:**
- `@auth/core@latest`
- `@auth/d1-adapter@latest`
- Next.js: `next-auth@latest`

**Auto-Trigger Keywords:**
- `authjs`, `auth.js`, `nextauth`, `d1 auth`, `oauth cloudflare`
- `authjs d1`, `magic link auth`, `session management`
- `authjs cloudflare`, `authjs typescript`, `authjs worker`
- Error keywords: `"oauth redirect"`, `"session not found"`, `"d1 adapter error"`

**Dependencies:**
- cloudflare-d1 (database)
- cloudflare-worker-base (Worker setup)
- resend-email (optional, for magic links)

**Production Test:**
- Set up OAuth with Google
- Test D1 adapter
- Verify session persistence
- Test magic links

---

#### Skill 10: playwright
**Priority**: MEDIUM
**Estimated Time**: 5-6 hours
**Token Savings**: ~55%
**Errors Prevented**: 9-11

**Why Build This:**
- E2E testing essential for full-stack
- Tests auth flows
- Multi-browser support
- Great debugging tools

**Scope:**
- Playwright installation
- Test configuration
- Page object pattern
- Authentication testing
- API testing
- Visual regression testing
- Parallel execution
- CI/CD integration
- Testing Cloudflare Pages/Workers
- Debugging techniques

**Templates to Create (10 files):**
1. `playwright.config.ts` - Complete configuration
2. `basic-test.spec.ts` - Simple page test
3. `page-object-pattern.ts` - POM example
4. `auth-flow-test.spec.ts` - Login/logout tests
5. `api-test.spec.ts` - API endpoint testing
6. `visual-regression.spec.ts` - Screenshot comparison
7. `fixtures.ts` - Shared fixtures
8. `test-utils.ts` - Helper functions
9. `ci-config.yml` - GitHub Actions example
10. `package.json`

**References to Create (7 files):**
1. `cloudflare-pages-testing.md` - Testing deployed apps
2. `auth-testing-guide.md` - Auth flow patterns
3. `debugging-guide.md` - Debugging techniques
4. `ci-integration.md` - CI/CD setup
5. `visual-testing.md` - Screenshot testing
6. `common-errors.md` - 11 documented errors
7. `links-to-official-docs.md`

**Known Errors to Document:**
1. Browser not installed
2. Timeout errors
3. Selector not found
4. Authentication state issues
5. Screenshot comparison failures
6. Parallel test race conditions
7. CI environment setup errors
8. Network request failures
9. Page not loaded errors
10. Test isolation issues
11. Fixture cleanup errors

**Package Versions:**
- `@playwright/test@1.51.0` (latest)

**Auto-Trigger Keywords:**
- `playwright`, `playwright testing`, `e2e test`, `browser testing`
- `playwright auth`, `playwright api`, `playwright cloudflare`
- `visual regression`, `playwright ci`, `page object model`
- Error keywords: `"playwright timeout"`, `"selector not found"`, `"browser not installed"`

**Dependencies:**
- None (works standalone)

**Production Test:**
- Test full auth flow
- Run in parallel
- Verify screenshot comparison
- Test CI integration

---

#### Skill 11: sentry
**Priority**: MEDIUM
**Estimated Time**: 4-5 hours
**Token Savings**: ~50%
**Errors Prevented**: 7-9

**Why Build This:**
- Production error monitoring
- Performance tracking
- Essential for debugging live apps

**Scope:**
- Sentry SDK setup
- Error capture and reporting
- Performance monitoring
- Source maps configuration
- Cloudflare Workers integration
- User context and tags
- Breadcrumbs
- Release tracking
- Environment configuration

**Templates to Create (9 files):**
1. `sentry-client.ts` - Frontend setup
2. `sentry-worker.ts` - Worker setup
3. `error-boundary.tsx` - React error boundary
4. `performance-monitoring.ts` - Performance tracing
5. `user-context.ts` - User identification
6. `breadcrumbs-example.ts` - Custom breadcrumbs
7. `source-maps-config.ts` - Source map upload
8. `wrangler-config.jsonc` - Worker integration
9. `package.json`

**References to Create (6 files):**
1. `cloudflare-workers-setup.md` - Workers integration
2. `source-maps-guide.md` - Source map upload
3. `performance-monitoring.md` - Performance setup
4. `release-tracking.md` - Release management
5. `common-errors.md` - 9 documented errors
6. `links-to-official-docs.md`

**Known Errors to Document:**
1. DSN not configured
2. Source maps not found
3. Sampling rate too high/low
4. User context not set
5. Breadcrumbs buffer overflow
6. Performance traces missing
7. Release not found
8. Environment mismatch
9. Cloudflare Workers rate limits

**Package Versions:**
- `@sentry/browser@latest` (frontend)
- `@sentry/react@latest` (React)
- `@sentry/cli@latest` (source maps)

**Auto-Trigger Keywords:**
- `sentry`, `sentry monitoring`, `error tracking`, `sentry cloudflare`
- `sentry worker`, `sentry react`, `sentry performance`
- `source maps sentry`, `release tracking`
- Error keywords: `"sentry dsn"`, `"source maps not found"`, `"sentry not reporting"`

**Dependencies:**
- cloudflare-worker-base (optional)

**Production Test:**
- Trigger test errors
- Verify source maps
- Test performance monitoring
- Verify user context

---

### Phase 6: Specialized Tools (Week 9-10)

#### Skill 13: cloudflare-images
**Priority**: MEDIUM
**Estimated Time**: 4-5 hours
**Token Savings**: ~55%
**Errors Prevented**: 7-9

**Why Build This:**
- Image optimization service
- Complements R2
- Good for media-heavy apps

**Scope:**
- Cloudflare Images setup
- Image upload patterns
- Variants configuration
- URL signing (private images)
- Transformations
- Integration with R2
- Direct upload API
- Batch operations

**Templates to Create (9 files):**
1. `images-client.ts` - API client setup
2. `upload-image.ts` - Upload patterns
3. `variants-config.ts` - Variant definitions
4. `url-signing.ts` - Signed URLs
5. `transformations.ts` - On-the-fly transforms
6. `r2-integration.ts` - R2 + Images
7. `direct-upload.ts` - Client-side upload
8. `worker-integration.ts` - Hono Worker
9. `package.json`

**References to Create (6 files):**
1. `variants-guide.md` - Variant configuration
2. `transformations-reference.md` - All transformation options
3. `url-signing-guide.md` - Private image patterns
4. `r2-integration-guide.md` - R2 + Images workflow
5. `common-errors.md` - 9 documented errors
6. `links-to-official-docs.md`

**Known Errors to Document:**
1. API token not configured
2. Variant not found
3. Image too large
4. Invalid image format
5. Signature verification failed
6. Upload quota exceeded
7. Transformation errors
8. R2 binding errors
9. CORS issues with direct upload

**Package Versions:**
- No official SDK (use fetch API)
- Types: `@cloudflare/workers-types@latest`

**Auto-Trigger Keywords:**
- `cloudflare images`, `cf images`, `image optimization cloudflare`
- `image variants`, `image upload cloudflare`, `signed urls images`
- `cloudflare transforms`, `r2 images`
- Error keywords: `"variant not found"`, `"image too large"`, `"signature failed"`

**Dependencies:**
- cloudflare-worker-base
- cloudflare-r2 (optional integration)

**Production Test:**
- Upload test images
- Configure variants
- Test signed URLs
- Verify transformations

---

#### Skill 14: react-email
**Priority**: MEDIUM-LOW
**Estimated Time**: 3-4 hours
**Token Savings**: ~50%
**Errors Prevented**: 5-7

**Why Build This:**
- Email templates as React components
- Works with Resend
- Type-safe email templates
- Preview server

**Scope:**
- React Email setup
- Component-based templates
- Preview server
- Build process
- Integration with Resend
- Tailwind styling in emails
- Common email patterns
- Testing emails

**Templates to Create (8 files):**
1. `email-config.ts` - React Email config
2. `welcome-email.tsx` - Welcome template
3. `receipt-email.tsx` - Transaction receipt
4. `notification-email.tsx` - Notification template
5. `password-reset-email.tsx` - Password reset
6. `preview-server.ts` - Dev preview setup
7. `resend-integration.ts` - Send React Email via Resend
8. `package.json`

**References to Create (6 files):**
1. `components-reference.md` - All React Email components
2. `styling-guide.md` - Tailwind in emails
3. `resend-integration-guide.md` - Integration patterns
4. `preview-server-guide.md` - Dev workflow
5. `common-errors.md` - 7 documented errors
6. `links-to-official-docs.md`

**Known Errors to Document:**
1. Preview server not starting
2. Build errors (TypeScript)
3. Styling not rendering in email clients
4. Component import errors
5. Resend integration failures
6. Tailwind config not found
7. Image paths incorrect

**Package Versions:**
- `react-email@3.0.3` (latest)
- `@react-email/components@0.0.34` (latest)

**Auto-Trigger Keywords:**
- `react email`, `react-email`, `email templates react`
- `react email resend`, `email components`, `preview email`
- `tailwind email`, `email builder react`
- Error keywords: `"react email build"`, `"preview server"`, `"email styling"`

**Dependencies:**
- resend-email (optional integration)

**Production Test:**
- Build email templates
- Test preview server
- Send via Resend
- Verify rendering in email clients

---

## 📊 Summary Statistics

**Total Skills**: 13
- Already Complete: 1 (tailwind-v4-shadcn)
- To Build: 12

**Total Estimated Time**: 56-68 hours
- Phase 1 (Doc fixes): 0.5 hours
- Phase 2 (Quick wins): 8-10 hours
- Phase 3 (SaaS): 9-12 hours
- Phase 4 (AI/Dev tools): 13-15 hours
- Phase 5 (Testing/Monitoring): 15-18 hours
- Phase 6 (Specialized): 7-9 hours

**Average Token Savings**: ~55%
**Total Errors Prevented**: ~100+

---

## 🎯 Recommended Build Order

### Sprint 1 (Next 2 weeks)
1. ✅ **tailwind-v4-shadcn** - Move to repo (30 min)
2. **zustand** - Quick win (3-4 hours)
3. **drizzle-orm-d1** - High value (5-6 hours)

### Sprint 2 (Weeks 3-4)
4. **stripe-payments** - Critical for monetization (6-8 hours)
5. **resend-email** - Pairs with Stripe (3-4 hours)

### Sprint 3 (Weeks 5-6)
6. **vitest** - Testing foundation (4-5 hours)
7. **mastra-ai** - Your AI framework (6-7 hours)

### Sprint 4 (Weeks 7-8)
8. **authjs** - Clerk alternative (6-7 hours)
9. **playwright** - E2E testing (5-6 hours)

### Sprint 5 (Weeks 9-10)
10. **openrouter** - Multi-provider AI (3-4 hours)
11. **sentry** - Production monitoring (4-5 hours)
12. **cloudflare-images** - Image optimization (4-5 hours)

### Sprint 6 (Week 11)
13. **react-email** - Email templates (3-4 hours)

---

## ✅ Next Actions

1. **Immediate** (Today):
   - [ ] Move tailwind-v4-shadcn to repo
   - [ ] Update roadmap (cloudflare-full-stack-scaffold = 100%)
   - [ ] Update roadmap (tanstack-query = ✅ Complete)
   - [ ] Git commit all documentation fixes

2. **This Week**:
   - [ ] Build zustand skill
   - [ ] Build drizzle-orm-d1 skill

3. **Next 2 Weeks**:
   - [ ] Build stripe-payments skill
   - [ ] Build resend-email skill

4. **Month 2-3**:
   - [ ] Continue with remaining skills in order

---

## 📝 Notes

**Research Requirements:**
- All skills require Context7 MCP lookup for latest docs
- Verify npm versions before building each skill
- Document production examples for each skill
- Follow atomic skills philosophy (no bundling)

**Quality Standards:**
- Minimum 50% token savings
- All errors documented with sources
- Production-tested examples
- TypeScript strict mode
- Complete templates for copy-paste

**Dependency Chain:**
- Some skills depend on others (e.g., drizzle-orm-d1 needs cloudflare-d1)
- Build foundational skills first
- Integration skills can reference multiple base skills

---

**Status**: ✅ Ready for Implementation
**Total Project Duration**: ~11 weeks (at 5-6 hours/week pace)
**Expected Completion**: Early January 2025

