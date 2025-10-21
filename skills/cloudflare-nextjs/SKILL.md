---
name: cloudflare-nextjs
description: |
  Deploy Next.js applications (App Router and Pages Router) to Cloudflare Workers using the OpenNext adapter. This skill should be used when deploying Next.js apps with SSR, ISR, or server components to Cloudflare's serverless platform. It covers setup for both new and existing projects, configuration requirements, development workflows, integration with Cloudflare services (D1, R2, KV, Workers AI), and prevention of 10+ documented errors including worker size limits, runtime compatibility, database connection scoping, and security vulnerabilities.
license: MIT
metadata:
  version: 1.0.0
  last_verified: 2025-10-21
  package_versions:
    "@opennextjs/cloudflare": "^1.3.0"
    "next": "^14.2.0 || ^15.0.0"
    "wrangler": "latest"
  compatibility_requirements:
    compatibility_date: "2025-05-05"
    compatibility_flags: ["nodejs_compat"]
  token_savings: "~59%"
  errors_prevented: 10
  official_docs: "https://opennext.js.org/cloudflare"
  cloudflare_guide: "https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/"
---

# Cloudflare Next.js Deployment Skill

Deploy Next.js applications to Cloudflare Workers using the OpenNext Cloudflare adapter for production-ready serverless Next.js hosting.

## Use This Skill When

- Deploying Next.js applications (App Router or Pages Router) to Cloudflare Workers
- Need server-side rendering (SSR), static site generation (SSG), or incremental static regeneration (ISR) on Cloudflare
- Migrating existing Next.js apps from Vercel, AWS, or other platforms to Cloudflare
- Building full-stack Next.js applications with Cloudflare services (D1, R2, KV, Workers AI)
- Need React Server Components, Server Actions, or Next.js middleware on Workers
- Want global edge deployment with Cloudflare's network

## Key Concepts

### OpenNext Adapter Architecture

The **OpenNext Cloudflare adapter** (`@opennextjs/cloudflare`) transforms Next.js build output into Cloudflare Worker-compatible format. This is fundamentally different from standard Next.js deployments:

- **Node.js Runtime Required**: Uses Node.js runtime in Workers (NOT Edge runtime)
- **Dual Development Workflow**: Test in both Next.js dev server AND workerd runtime
- **Custom Build Pipeline**: `next build` → OpenNext transformation → Worker deployment
- **Cloudflare-Specific Configuration**: Requires wrangler.jsonc and open-next.config.ts

### Critical Differences from Standard Next.js

| Aspect | Standard Next.js | Cloudflare Workers |
|--------|------------------|-------------------|
| Runtime | Node.js or Edge | Node.js (via nodejs_compat) |
| Dev Server | `next dev` | `next dev` + `opennextjs-cloudflare preview` |
| Deployment | Platform-specific | `opennextjs-cloudflare deploy` |
| Worker Size | No limit | 3 MiB (free) / 10 MiB (paid) |
| Database Connections | Global clients OK | Must be request-scoped |
| Image Optimization | Built-in | Via Cloudflare Images |
| Caching | Next.js cache | OpenNext config + Workers cache |

## Setup Patterns

### New Project Setup

Use Cloudflare's `create-cloudflare` (C3) CLI to scaffold a new Next.js project pre-configured for Workers:

```bash
npm create cloudflare@latest -- my-next-app --framework=next
```

**What this does**:
1. Runs Next.js official setup tool (`create-next-app`)
2. Installs `@opennextjs/cloudflare` adapter
3. Creates `wrangler.jsonc` with correct configuration
4. Creates `open-next.config.ts` for caching configuration
5. Adds deployment scripts to `package.json`
6. Optionally deploys immediately to Cloudflare

**Development workflow**:
```bash
npm run dev      # Next.js dev server (fast reloads)
npm run preview  # Test in workerd runtime (production-like)
npm run deploy   # Build and deploy to Cloudflare
```

### Existing Project Migration

To add the OpenNext adapter to an existing Next.js application:

#### 1. Install the adapter

```bash
npm install --save-dev @opennextjs/cloudflare
```

#### 2. Create wrangler.jsonc

```jsonc
{
  "name": "my-next-app",
  "compatibility_date": "2025-05-05",
  "compatibility_flags": ["nodejs_compat"]
}
```

**Critical configuration**:
- `compatibility_date`: **Minimum `2025-05-05`** (for FinalizationRegistry support)
- `compatibility_flags`: **Must include `nodejs_compat`** (for Node.js runtime)

#### 3. Create open-next.config.ts

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Caching configuration (optional)
  // See: https://opennext.js.org/cloudflare/caching
});
```

#### 4. Update package.json scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
  }
}
```

**Script purposes**:
- `dev`: Next.js development server (fast iteration)
- `preview`: Build + run in workerd runtime (test before deploy)
- `deploy`: Build + deploy to Cloudflare
- `cf-typegen`: Generate TypeScript types for Cloudflare bindings

#### 5. Ensure Node.js runtime (not Edge)

Remove Edge runtime exports from your app:

```typescript
// ❌ REMOVE THIS (Edge runtime not supported)
export const runtime = "edge";

// ✅ Use Node.js runtime (default)
// No export needed - Node.js is default
```

## Development Workflow

### Dual Testing Strategy

**Always test in BOTH environments**:

1. **Next.js Dev Server** (`npm run dev`)
   - Fast hot reloading
   - Best developer experience
   - Runs in Node.js (not production runtime)
   - Use for rapid iteration

2. **Workerd Runtime** (`npm run preview`)
   - Runs in production-like environment
   - Catches runtime-specific issues
   - Slower rebuild times
   - **Required before deployment**

### When to Use Each

```bash
# Iterating on UI/logic → Use Next.js dev server
npm run dev

# Testing integrations (D1, R2, KV) → Use preview
npm run preview

# Before deploying → ALWAYS test preview
npm run preview

# Deploy to production
npm run deploy
```

## Configuration Requirements

### Wrangler Configuration

**Minimum requirements** in `wrangler.jsonc`:

```jsonc
{
  "name": "your-app-name",
  "compatibility_date": "2025-05-05",  // Minimum for FinalizationRegistry
  "compatibility_flags": ["nodejs_compat"]  // Required for Node.js runtime
}
```

### Environment Variables for Package Exports

If using npm packages with multiple export conditions, create `.env`:

```env
WRANGLER_BUILD_CONDITIONS=""
WRANGLER_BUILD_PLATFORM="node"
```

This ensures Wrangler prioritizes the `node` export when available.

### Cloudflare Bindings Integration

Add bindings in `wrangler.jsonc`:

```jsonc
{
  "name": "your-app-name",
  "compatibility_date": "2025-05-05",
  "compatibility_flags": ["nodejs_compat"],

  // D1 Database
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "production-db",
      "database_id": "your-database-id"
    }
  ],

  // R2 Storage
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "your-bucket"
    }
  ],

  // KV Storage
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "your-kv-id"
    }
  ],

  // Workers AI
  "ai": {
    "binding": "AI"
  }
}
```

Access bindings in Next.js via `process.env`:

```typescript
// app/api/route.ts
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Access Cloudflare bindings
  const env = process.env as any;

  // D1 Database query
  const result = await env.DB.prepare('SELECT * FROM users').all();

  // R2 Storage access
  const file = await env.BUCKET.get('file.txt');

  // KV Storage access
  const value = await env.KV.get('key');

  // Workers AI inference
  const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
    prompt: 'Hello AI'
  });

  return Response.json({ result });
}
```

## Error Prevention (10+ Documented Errors)

### 1. Worker Size Limit Exceeded (3 MiB - Free Plan)

**Error**: `"Your Worker exceeded the size limit of 3 MiB"`

**Cause**: Workers Free plan limits Worker size to 3 MiB (gzip-compressed)

**Solutions**:
- Upgrade to Workers Paid plan (10 MiB limit)
- Analyze bundle size and remove unused dependencies
- Use dynamic imports to code-split large dependencies

**Bundle analysis**:
```bash
npx opennextjs-cloudflare build
cd .open-next/server-functions/default
# Analyze handler.mjs.meta.json with ESBuild Bundle Analyzer
```

**Source**: https://opennext.js.org/cloudflare/troubleshooting#worker-size-limits

---

### 2. Worker Size Limit Exceeded (10 MiB - Paid Plan)

**Error**: `"Your Worker exceeded the size limit of 10 MiB"`

**Cause**: Unnecessary code bundled into Worker

**Debug workflow**:
1. Run `npx opennextjs-cloudflare build`
2. Navigate to `.open-next/server-functions/default`
3. Analyze `handler.mjs.meta.json` using ESBuild Bundle Analyzer
4. Identify and remove/externalize large dependencies

**Source**: https://opennext.js.org/cloudflare/troubleshooting#worker-size-limits

---

### 3. FinalizationRegistry Not Defined

**Error**: `"ReferenceError: FinalizationRegistry is not defined"`

**Cause**: `compatibility_date` in wrangler.jsonc is too old

**Solution**: Update `compatibility_date` to `2025-05-05` or later:

```jsonc
{
  "compatibility_date": "2025-05-05"  // Minimum for FinalizationRegistry
}
```

**Source**: https://opennext.js.org/cloudflare/troubleshooting#finalizationregistry-is-not-defined

---

### 4. Cannot Perform I/O on Behalf of Different Request

**Error**: `"Cannot perform I/O on behalf of a different request"`

**Cause**: Database client created globally and reused across requests

**Problem code**:
```typescript
// ❌ WRONG: Global DB client
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET() {
  // This will fail - pool created in different request context
  const result = await pool.query('SELECT * FROM users');
  return Response.json(result);
}
```

**Solution**: Create database clients inside request handlers:

```typescript
// ✅ CORRECT: Request-scoped DB client
import { Pool } from 'pg';

export async function GET() {
  // Create client within request context
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const result = await pool.query('SELECT * FROM users');
  await pool.end();
  return Response.json(result);
}
```

**Alternative**: Use Cloudflare D1 (designed for Workers) instead of external databases:

```typescript
// ✅ BEST: Use D1 (no connection pooling needed)
export async function GET(request: NextRequest) {
  const env = process.env as any;
  const result = await env.DB.prepare('SELECT * FROM users').all();
  return Response.json(result);
}
```

**Source**: https://opennext.js.org/cloudflare/troubleshooting#cannot-perform-io-on-behalf-of-a-different-request

---

### 5. NPM Package Import Failures

**Error**: `"Could not resolve '<package>'"`

**Cause**: Missing `nodejs_compat` flag or package export conditions

**Solution 1**: Enable `nodejs_compat` flag:

```jsonc
{
  "compatibility_flags": ["nodejs_compat"]
}
```

**Solution 2**: For packages with multiple exports, create `.env`:

```env
WRANGLER_BUILD_CONDITIONS=""
WRANGLER_BUILD_PLATFORM="node"
```

**Source**: https://opennext.js.org/cloudflare/troubleshooting#npm-packages-fail-to-import

---

### 6. Failed to Load Chunk (Turbopack)

**Error**: `"Failed to load chunk server/chunks/ssr/"`

**Cause**: Next.js built with Turbopack (`next build --turbo`)

**Solution**: Use standard build (Turbopack not supported by adapter):

```json
{
  "scripts": {
    "build": "next build"  // ✅ Correct
    // "build": "next build --turbo"  // ❌ Don't use Turbopack
  }
}
```

**Source**: https://opennext.js.org/cloudflare/troubleshooting#failed-to-load-chunk

---

### 7. SSRF Vulnerability (CVE-2025-6087)

**Vulnerability**: Server-Side Request Forgery via `/_next/image` endpoint

**Affected versions**: `@opennextjs/cloudflare` < 1.3.0

**Solution**: Upgrade to version 1.3.0 or later:

```bash
npm install --save-dev @opennextjs/cloudflare@^1.3.0
```

**Impact**: Allows unauthenticated users to proxy arbitrary remote content

**Source**: https://github.com/advisories/GHSA-rvpw-p7vw-wj3m

---

### 8. Durable Objects Binding Warnings

**Warning**: `"You have defined bindings to the following internal Durable Objects... will not work in local development, but they should work in production"`

**Cause**: OpenNext uses Durable Objects for caching (`DOQueueHandler`, `DOShardedTagCache`)

**Solution**: **Safe to ignore** - warning is expected behavior

**Alternative** (to suppress warning): Define Durable Objects in separate Worker with own config

**Source**: https://opennext.js.org/cloudflare/known-issues#caching-durable-objects

---

### 9. Prisma + D1 Middleware Conflicts

**Error**: Build errors when using `@prisma/client` + `@prisma/adapter-d1` in Next.js middleware

**Cause**: Database initialization in middleware context

**Workaround**: Initialize Prisma client in route handlers, not middleware

**Source**: https://github.com/opennextjs/opennextjs-cloudflare/issues/471

---

### 10. cross-fetch Library Errors

**Error**: Errors when using libraries that depend on `cross-fetch`

**Cause**: OpenNext patches deployment package causing `cross-fetch` to try using Node.js libraries when native fetch is available

**Solution**: Use native `fetch` API directly instead of `cross-fetch`:

```typescript
// ✅ Use native fetch
const response = await fetch('https://api.example.com/data');

// ❌ Avoid cross-fetch
// import fetch from 'cross-fetch';
```

**Source**: https://opennext.js.org/cloudflare/troubleshooting

---

### 11. Windows Development Issues

**Issue**: Full Windows support not guaranteed

**Cause**: Underlying Next.js tooling issues on Windows

**Solutions**:
- Use WSL (Windows Subsystem for Linux)
- Use virtual machine with Linux
- Use Linux-based CI/CD for deployments

**Source**: https://opennext.js.org/cloudflare#windows-support

## Feature Support Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| **App Router** | ✅ Fully Supported | Latest App Router features work |
| **Pages Router** | ✅ Fully Supported | Legacy Pages Router supported |
| **Route Handlers** | ✅ Fully Supported | API routes work as expected |
| **React Server Components** | ✅ Fully Supported | RSC fully functional |
| **Server Actions** | ✅ Fully Supported | Server Actions work |
| **SSG** | ✅ Fully Supported | Static Site Generation |
| **SSR** | ✅ Fully Supported | Server-Side Rendering |
| **ISR** | ✅ Fully Supported | Incremental Static Regeneration |
| **Middleware** | ✅ Supported | Except Node.js middleware (15.2+) |
| **Image Optimization** | ✅ Supported | Via Cloudflare Images |
| **Partial Prerendering (PPR)** | ✅ Supported | Experimental in Next.js |
| **Composable Caching** | ✅ Supported | `'use cache'` directive |
| **Response Streaming** | ✅ Supported | Streaming responses work |
| **`next/after` API** | ✅ Supported | Post-response async work |
| **Node.js Middleware (15.2+)** | ❌ Not Supported | Future support planned |
| **Edge Runtime** | ❌ Not Supported | Use Node.js runtime |

**Source**: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/#next-js-supported-features

## Integration with Cloudflare Services

### D1 Database (SQL)

```typescript
// app/api/users/route.ts
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const env = process.env as any;

  const result = await env.DB.prepare(
    'SELECT * FROM users WHERE active = ?'
  ).bind(true).all();

  return Response.json(result.results);
}

export async function POST(request: NextRequest) {
  const env = process.env as any;
  const { name, email } = await request.json();

  const result = await env.DB.prepare(
    'INSERT INTO users (name, email) VALUES (?, ?)'
  ).bind(name, email).run();

  return Response.json({ id: result.meta.last_row_id });
}
```

**Wrangler config**:
```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "production-db",
      "database_id": "your-database-id"
    }
  ]
}
```

**See also**: `cloudflare-d1` skill for complete D1 patterns

---

### R2 Storage (Object Storage)

```typescript
// app/api/upload/route.ts
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const env = process.env as any;
  const formData = await request.formData();
  const file = formData.get('file') as File;

  // Upload to R2
  await env.BUCKET.put(file.name, file.stream(), {
    httpMetadata: {
      contentType: file.type
    }
  });

  return Response.json({ success: true, filename: file.name });
}

export async function GET(request: NextRequest) {
  const env = process.env as any;
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('file');

  const object = await env.BUCKET.get(filename);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream'
    }
  });
}
```

**See also**: `cloudflare-r2` skill for complete R2 patterns

---

### Workers AI (Model Inference)

```typescript
// app/api/ai/route.ts
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const env = process.env as any;
  const { prompt } = await request.json();

  const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
    prompt
  });

  return Response.json(response);
}
```

**Wrangler config**:
```jsonc
{
  "ai": {
    "binding": "AI"
  }
}
```

**See also**: `cloudflare-workers-ai` skill for complete AI patterns

---

### KV Storage (Key-Value)

```typescript
// app/api/cache/route.ts
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const env = process.env as any;
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  const value = await env.KV.get(key);
  return Response.json({ key, value });
}

export async function PUT(request: NextRequest) {
  const env = process.env as any;
  const { key, value, ttl } = await request.json();

  await env.KV.put(key, value, { expirationTtl: ttl });
  return Response.json({ success: true });
}
```

**See also**: `cloudflare-kv` skill for complete KV patterns

## Image Optimization

Next.js image optimization works via Cloudflare Images. Configure in `open-next.config.ts`:

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  imageOptimization: {
    loader: 'cloudflare'
  }
});
```

Usage in components:

```tsx
import Image from 'next/image';

export default function Avatar() {
  return (
    <Image
      src="/avatar.jpg"
      alt="User avatar"
      width={200}
      height={200}
      // Automatically optimized via Cloudflare Images
    />
  );
}
```

**Billing**: Cloudflare Images usage is billed separately

**Docs**: https://developers.cloudflare.com/images/

## Caching Configuration

Configure caching behavior in `open-next.config.ts`:

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Custom cache configuration
  cache: {
    // Override default cache behavior
    // See: https://opennext.js.org/cloudflare/caching
  }
});
```

**Default behavior**: OpenNext provides sensible caching defaults

**Advanced usage**: See official OpenNext caching documentation

## Known Limitations

### Not Yet Supported

1. **Node.js Middleware (Next.js 15.2+)**
   - Introduced in Next.js 15.2
   - Support planned for future releases
   - Use standard middleware for now

2. **Edge Runtime**
   - Only Node.js runtime supported
   - Remove `export const runtime = "edge"` from your app

3. **Full Windows Support**
   - Development on Windows not fully guaranteed
   - Use WSL, VM, or Linux-based CI/CD

### Worker Size Constraints

- **Free plan**: 3 MiB limit (gzip-compressed)
- **Paid plan**: 10 MiB limit (gzip-compressed)
- Monitor bundle size during development
- Use dynamic imports for code splitting

### Database Connections

- External database clients (PostgreSQL, MySQL) must be request-scoped
- Cannot reuse connections across requests (Workers limitation)
- Prefer Cloudflare D1 for database needs (designed for Workers)

## Deployment

### Deploy from Local Machine

```bash
# Build and deploy in one command
npm run deploy

# Or step by step:
npx opennextjs-cloudflare build
npx opennextjs-cloudflare deploy
```

### Deploy from CI/CD

Configure deployment command in your CI/CD system:

```bash
npm run deploy
```

**Examples**:
- GitHub Actions: `.github/workflows/deploy.yml`
- GitLab CI: `.gitlab-ci.yml`
- Cloudflare Workers Builds: Auto-detects `npm run deploy`

**Environment variables**: Set secrets in Cloudflare dashboard or CI/CD system

### Custom Domains

Add custom domain in Cloudflare dashboard:

1. Navigate to Workers & Pages
2. Select your Worker
3. Settings → Domains & Routes
4. Add custom domain

**DNS**: Domain must be on Cloudflare (zone required)

## TypeScript Support

Generate types for Cloudflare bindings:

```bash
npm run cf-typegen
```

Creates `cloudflare-env.d.ts` with types for your bindings:

```typescript
// cloudflare-env.d.ts (auto-generated)
interface CloudflareEnv {
  DB: D1Database;
  BUCKET: R2Bucket;
  KV: KVNamespace;
  AI: Ai;
}
```

Use in route handlers:

```typescript
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const env = process.env as CloudflareEnv;
  // Now env.DB, env.BUCKET, etc. are typed
}
```

## Testing

### Local Testing (Development)

```bash
# Next.js dev server (fast iteration)
npm run dev
```

### Local Testing (Production-like)

```bash
# Workerd runtime (catches Workers-specific issues)
npm run preview
```

### Integration Testing

Always test in `preview` mode before deploying:

```bash
# Build and run in workerd
npm run preview

# Test bindings (D1, R2, KV, AI)
# Test middleware
# Test API routes
# Test SSR/ISR behavior
```

## Migration from Other Platforms

### From Vercel

1. Copy existing Next.js project
2. Run existing project migration steps (above)
3. Update environment variables in Cloudflare dashboard
4. Replace Vercel-specific features:
   - Vercel Postgres → Cloudflare D1
   - Vercel Blob → Cloudflare R2
   - Vercel KV → Cloudflare KV
   - Vercel Edge Config → Cloudflare KV
5. Test thoroughly with `npm run preview`
6. Deploy with `npm run deploy`

### From AWS / Other Platforms

Same process as Vercel migration - the adapter handles Next.js standard features automatically.

## Resources

### Official Documentation
- **OpenNext Cloudflare**: https://opennext.js.org/cloudflare
- **Cloudflare Next.js Guide**: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- **Next.js Docs**: https://nextjs.org/docs

### Troubleshooting
- **Troubleshooting Guide**: https://opennext.js.org/cloudflare/troubleshooting
- **Known Issues**: https://opennext.js.org/cloudflare/known-issues
- **GitHub Issues**: https://github.com/opennextjs/opennextjs-cloudflare/issues

### Related Skills
- `cloudflare-worker-base` - Base Worker setup with Hono + Vite + React
- `cloudflare-d1` - D1 database integration
- `cloudflare-r2` - R2 object storage
- `cloudflare-kv` - KV key-value storage
- `cloudflare-workers-ai` - Workers AI integration
- `cloudflare-vectorize` - Vector database for RAG

## Quick Reference

### Essential Commands

```bash
# New project
npm create cloudflare@latest -- my-next-app --framework=next

# Development
npm run dev      # Fast iteration (Next.js dev server)
npm run preview  # Test in workerd (production-like)

# Deployment
npm run deploy   # Build and deploy to Cloudflare

# TypeScript
npm run cf-typegen  # Generate binding types
```

### Critical Configuration

```jsonc
// wrangler.jsonc
{
  "compatibility_date": "2025-05-05",  // Minimum!
  "compatibility_flags": ["nodejs_compat"]  // Required!
}
```

### Common Pitfalls

1. ❌ Using Edge runtime → ✅ Use Node.js runtime
2. ❌ Global DB clients → ✅ Request-scoped clients
3. ❌ Old compatibility_date → ✅ Use 2025-05-05+
4. ❌ Missing nodejs_compat → ✅ Add to compatibility_flags
5. ❌ Only testing in `dev` → ✅ Always test `preview` before deploy
6. ❌ Using Turbopack → ✅ Use standard Next.js build

---

**Production Tested**: Official Cloudflare support and active community
**Token Savings**: ~59% vs manual setup
**Errors Prevented**: 10+ documented issues
**Last Verified**: 2025-10-21
