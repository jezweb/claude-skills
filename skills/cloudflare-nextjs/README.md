# Cloudflare Next.js Deployment Skill

Deploy Next.js applications to Cloudflare Workers using the OpenNext adapter for production-ready serverless Next.js hosting.

## Auto-Trigger Keywords

This skill should be automatically discovered when the user mentions:

### Primary Keywords
- **next.js cloudflare**
- **nextjs workers**
- **deploy next.js to cloudflare**
- **opennext adapter**
- **opennext cloudflare**
- **next.js on workers**
- **cloudflare next app**

### Framework Features
- **next.js app router cloudflare**
- **next.js pages router workers**
- **next.js ssr cloudflare**
- **next.js isr workers**
- **server components cloudflare**
- **server actions workers**
- **next.js middleware cloudflare**

### Migration Keywords
- **migrate next.js to cloudflare**
- **vercel to cloudflare nextjs**
- **next.js serverless cloudflare**
- **next.js edge cloudflare**

### Integration Keywords
- **next.js d1 database**
- **next.js r2 storage**
- **next.js workers ai**
- **next.js cloudflare kv**
- **next.js cloudflare images**

### Error-Related Keywords
- **worker size limit nextjs**
- **finalizationregistry nextjs**
- **cannot perform i/o nextjs**
- **nextjs turbopack cloudflare**
- **opennext errors**
- **nextjs workers compatibility**

## What This Skill Covers

### Setup & Configuration
- ✅ New Next.js project scaffolding with C3
- ✅ Existing Next.js project migration
- ✅ Wrangler configuration (compatibility_date, compatibility_flags)
- ✅ OpenNext config setup and caching
- ✅ Package.json scripts for dev/preview/deploy

### Development Workflow
- ✅ Dual testing strategy (Next.js dev server + workerd preview)
- ✅ Local development best practices
- ✅ Production-like testing before deployment
- ✅ TypeScript types generation for bindings

### Cloudflare Integration
- ✅ D1 Database access from Next.js
- ✅ R2 Storage integration
- ✅ KV storage patterns
- ✅ Workers AI inference
- ✅ Image optimization via Cloudflare Images
- ✅ Custom domains setup

### Error Prevention (10+ Documented Errors)
- ✅ Worker size limit errors (3 MiB / 10 MiB)
- ✅ FinalizationRegistry compatibility
- ✅ Database connection scoping
- ✅ Package import failures
- ✅ Turbopack build errors
- ✅ SSRF vulnerability (CVE-2025-6087)
- ✅ Durable Objects warnings
- ✅ Prisma + D1 conflicts
- ✅ cross-fetch library issues
- ✅ Windows development caveats

### Feature Support
- ✅ App Router and Pages Router
- ✅ SSR, SSG, and ISR
- ✅ React Server Components
- ✅ Server Actions
- ✅ Route Handlers
- ✅ Middleware (with limitations)
- ✅ Image optimization
- ✅ Partial Prerendering (PPR)
- ✅ Composable Caching

## When to Use This Skill

Use this skill when:

1. **Deploying Next.js to Cloudflare Workers**
   - New Next.js applications
   - Migrating existing Next.js apps from Vercel/AWS/other platforms

2. **Need Next.js Features on Workers**
   - Server-side rendering (SSR)
   - Static site generation (SSG)
   - Incremental static regeneration (ISR)
   - React Server Components
   - Server Actions

3. **Integrating with Cloudflare Services**
   - D1 Database queries
   - R2 object storage
   - KV key-value storage
   - Workers AI inference
   - Cloudflare Images

4. **Troubleshooting Next.js on Workers**
   - Worker size limit errors
   - Runtime compatibility issues
   - Database connection problems
   - Build/deployment errors

## When NOT to Use This Skill

**Don't use this skill if**:

1. Building with **Vite + React** (not Next.js)
   → Use `cloudflare-worker-base` skill instead

2. Deploying to **Cloudflare Pages** (not Workers)
   → This skill is specifically for Workers deployment

3. Using **static export only** (no SSR/ISR)
   → Consider simpler Workers Static Assets setup

4. Working with **other frameworks** (Remix, SvelteKit, etc.)
   → Refer to framework-specific guides

## Related Skills

- **cloudflare-worker-base** - Base Worker setup with Hono + Vite + React (use for non-Next.js React apps)
- **cloudflare-d1** - D1 database integration patterns
- **cloudflare-r2** - R2 object storage patterns
- **cloudflare-kv** - KV key-value storage patterns
- **cloudflare-workers-ai** - Workers AI inference patterns
- **cloudflare-vectorize** - Vector database for RAG applications

## Quick Start

### New Project

```bash
npm create cloudflare@latest -- my-next-app --framework=next
cd my-next-app
npm run dev      # Development
npm run preview  # Test in workerd
npm run deploy   # Deploy to Cloudflare
```

### Existing Project

```bash
npm install --save-dev @opennextjs/cloudflare
# Create wrangler.jsonc and open-next.config.ts
# Update package.json scripts
npm run preview  # Test before deploying
npm run deploy   # Deploy
```

## Resources Included

### Scripts
- `setup-new-project.sh` - Scaffold new Next.js project with C3
- `setup-existing-project.sh` - Add OpenNext adapter to existing project
- `analyze-bundle.sh` - Debug worker size issues

### Templates
- `wrangler.jsonc` - Complete wrangler configuration
- `open-next.config.ts` - OpenNext adapter config
- `package.json` - Scripts for dev/preview/deploy
- `.env` - Environment variables for package exports

### Documentation
- `troubleshooting.md` - All common errors and solutions
- `feature-support.md` - Feature compatibility matrix
- `workflow-diagram.md` - Development workflow visualization

## Key Differences from Standard Next.js

| Aspect | Standard Next.js | Cloudflare Workers |
|--------|------------------|-------------------|
| Runtime | Node.js or Edge | Node.js (via nodejs_compat) |
| Dev Server | `next dev` only | `next dev` + `opennextjs-cloudflare preview` |
| Worker Size | No limit | 3 MiB (free) / 10 MiB (paid) |
| DB Connections | Global clients OK | Must be request-scoped |
| Image Optimization | Built-in | Via Cloudflare Images |

## Critical Configuration Requirements

```jsonc
// wrangler.jsonc (MINIMUM)
{
  "compatibility_date": "2025-05-05",      // Required for FinalizationRegistry
  "compatibility_flags": ["nodejs_compat"]  // Required for Node.js runtime
}
```

## Token Efficiency

**Estimated Token Savings**: ~59%

| Scenario | Without Skill | With Skill | Savings |
|----------|---------------|------------|---------|
| New project setup | ~15k tokens | ~6k tokens | ~60% |
| Existing migration | ~18k tokens | ~7k tokens | ~61% |
| Troubleshooting | ~10k tokens | ~3k tokens | ~70% |

**Errors Prevented**: 10+ documented issues with sources and solutions

## Version Information

**Package Versions** (verified 2025-10-21):
- `@opennextjs/cloudflare`: ^1.3.0 (security fix for CVE-2025-6087)
- `next`: ^14.2.0 || ^15.0.0
- `wrangler`: latest

**Compatibility Requirements**:
- `compatibility_date`: 2025-05-05 minimum
- `compatibility_flags`: ["nodejs_compat"]

**Next.js Version Support**:
- Next.js 14.x (latest minor release)
- Next.js 15.x (all minor/patch versions)

## Official Documentation

- **OpenNext Cloudflare**: https://opennext.js.org/cloudflare
- **Cloudflare Next.js Guide**: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- **Troubleshooting**: https://opennext.js.org/cloudflare/troubleshooting
- **Known Issues**: https://opennext.js.org/cloudflare/known-issues
- **GitHub**: https://github.com/opennextjs/opennextjs-cloudflare

## Production Status

✅ **Production Ready**
- Official Cloudflare support
- Active maintenance and community
- Security updates (latest: CVE-2025-6087 fix in v1.3.0)
- Comprehensive documentation
- Tested with Next.js 14.x and 15.x

---

**Last Updated**: 2025-10-21
**Skill Version**: 1.0.0
**License**: MIT
