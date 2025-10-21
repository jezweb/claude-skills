# Next.js on Cloudflare Workers - Troubleshooting Guide

Complete guide to common errors and their solutions when deploying Next.js to Cloudflare Workers with the OpenNext adapter.

---

## Worker Size Limit Errors

### Error: "Your Worker exceeded the size limit of 3 MiB"

**Cause**: Workers Free plan limits Worker size to 3 MiB (gzip-compressed)

**Solutions**:

1. **Upgrade to Workers Paid Plan** (10 MiB limit)
   - Navigate to Cloudflare dashboard
   - Workers & Pages → Plan
   - Upgrade to Paid plan

2. **Analyze and reduce bundle size**:
   ```bash
   # Run bundle analysis script
   ./scripts/analyze-bundle.sh

   # Or manually:
   npx opennextjs-cloudflare build
   cd .open-next/server-functions/default
   # Check handler.mjs.meta.json with ESBuild Bundle Analyzer
   ```

3. **Reduce bundle size tactics**:
   - Remove unused dependencies from `package.json`
   - Use dynamic imports for heavy modules
   - Split large features into separate routes
   - Check for duplicate dependencies: `npm dedupe`

**Source**: https://opennext.js.org/cloudflare/troubleshooting#worker-size-limits

---

### Error: "Your Worker exceeded the size limit of 10 MiB"

**Cause**: Unnecessary code bundled into Worker (even on paid plan)

**Debug Process**:

```bash
# 1. Build the project
npx opennextjs-cloudflare build

# 2. Navigate to build output
cd .open-next/server-functions/default

# 3. Analyze handler.mjs.meta.json
# - Identify largest dependencies
# - Check for unexpected includes
# - Look for duplicate code
```

**Common culprits**:
- Large ORMs (Prisma, TypeORM)
- AWS SDK (use specific services instead)
- Full Firebase SDK (use lite version)
- Large UI libraries bundled on server
- Monorepo packages with circular dependencies

**Solutions**:
- Externalize when possible
- Use lighter alternatives
- Move heavy operations to separate Workers
- Use Workers Services bindings for microservices

**Source**: https://opennext.js.org/cloudflare/troubleshooting#worker-size-limits

---

## Runtime Errors

### Error: "ReferenceError: FinalizationRegistry is not defined"

**Cause**: `compatibility_date` in wrangler.jsonc is too old

**Solution**: Update `compatibility_date` to `2025-05-05` or later:

```jsonc
{
  "compatibility_date": "2025-05-05"  // Minimum for FinalizationRegistry
}
```

**Why**: FinalizationRegistry API was added to Workers runtime in this compatibility date.

**Source**: https://opennext.js.org/cloudflare/troubleshooting#finalizationregistry-is-not-defined

---

### Error: "Cannot perform I/O on behalf of a different request"

**Cause**: Database client created globally and reused across requests

**Problem Code**:
```typescript
// ❌ WRONG: Global DB client
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET() {
  const result = await pool.query('SELECT * FROM users');
  return Response.json(result);
}
```

**Solution 1**: Create clients inside request handlers:

```typescript
// ✅ CORRECT: Request-scoped client
import { Pool } from 'pg';

export async function GET() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const result = await pool.query('SELECT * FROM users');
    return Response.json(result.rows);
  } finally {
    await pool.end();
  }
}
```

**Solution 2** (BEST): Use Cloudflare D1:

```typescript
// ✅ BEST: Use D1 (designed for Workers)
export async function GET(request: NextRequest) {
  const env = process.env as any;
  const result = await env.DB.prepare('SELECT * FROM users').all();
  return Response.json(result.results);
}
```

**Why**: Workers runtime cannot share I/O objects across request contexts. Each request must create its own connections.

**See also**: `references/database-client-example.ts`

**Source**: https://opennext.js.org/cloudflare/troubleshooting#cannot-perform-io-on-behalf-of-a-different-request

---

## Build Errors

### Error: "Failed to load chunk server/chunks/ssr/"

**Cause**: Next.js built with Turbopack (`next build --turbo`)

**Solution**: Use standard build (Turbopack not supported):

```json
{
  "scripts": {
    "build": "next build"  // ✅ Correct
    // "build": "next build --turbo"  // ❌ Don't use Turbopack
  }
}
```

**Why**: OpenNext adapter doesn't support Turbopack-generated builds yet.

**Source**: https://opennext.js.org/cloudflare/troubleshooting#failed-to-load-chunk

---

### Error: "Could not resolve '<package>'"

**Cause**: Missing `nodejs_compat` flag or package export conditions not configured

**Solution 1**: Enable `nodejs_compat` flag in wrangler.jsonc:

```jsonc
{
  "compatibility_flags": ["nodejs_compat"]  // Required!
}
```

**Solution 2**: For packages with multiple exports, create `.env`:

```env
WRANGLER_BUILD_CONDITIONS=""
WRANGLER_BUILD_PLATFORM="node"
```

**Why**: Some packages export different code for different platforms. These settings ensure Wrangler uses the Node.js exports.

**Source**: https://opennext.js.org/cloudflare/troubleshooting#npm-packages-fail-to-import

---

### Error: cross-fetch Library Issues

**Problem**: Libraries using `cross-fetch` fail with Node.js module errors

**Cause**: OpenNext patches deployment package causing `cross-fetch` to incorrectly use Node.js libraries when native fetch is available

**Solution**: Use native `fetch` API directly:

```typescript
// ✅ Use native fetch
const response = await fetch('https://api.example.com/data');

// ❌ Avoid cross-fetch
// import fetch from 'cross-fetch';
```

**Alternative**: If you control the library, update it to use native fetch instead of cross-fetch.

**Source**: https://opennext.js.org/cloudflare/troubleshooting

---

## Security Issues

### SSRF Vulnerability (CVE-2025-6087)

**Issue**: Server-Side Request Forgery via `/_next/image` endpoint

**Affected Versions**: `@opennextjs/cloudflare` < 1.3.0

**Impact**: Allows unauthenticated users to proxy arbitrary remote content

**Solution**: Upgrade to version 1.3.0 or later:

```bash
npm install --save-dev @opennextjs/cloudflare@^1.3.0
```

**Verify fix**:
```bash
npm list @opennextjs/cloudflare
# Should show version >= 1.3.0
```

**Source**: https://github.com/advisories/GHSA-rvpw-p7vw-wj3m

---

## Warnings (Safe to Ignore)

### Warning: Durable Objects Binding Warnings

**Warning Message**:
```
You have defined bindings to the following internal Durable Objects...
will not work in local development, but they should work in production
```

**Cause**: OpenNext uses Durable Objects for caching (`DOQueueHandler`, `DOShardedTagCache`)

**Solution**: **Safe to ignore** - this is expected behavior

**Why**: Caching Durable Objects aren't used during build process, only in production runtime.

**Alternative** (to suppress warning): Define Durable Objects in separate Worker with own config file.

**Source**: https://opennext.js.org/cloudflare/known-issues#caching-durable-objects

---

## Integration Errors

### Error: Prisma + D1 Middleware Conflicts

**Issue**: Build errors when using `@prisma/client` + `@prisma/adapter-d1` in Next.js middleware

**Cause**: Database initialization in middleware context

**Workaround**: Initialize Prisma client in route handlers, not middleware

**Example**:
```typescript
// ❌ Don't initialize in middleware.ts
// export async function middleware(request: NextRequest) {
//   const prisma = new PrismaClient({ adapter: new PrismaD1(env.DB) });
// }

// ✅ Initialize in route handlers
export async function GET(request: NextRequest) {
  const env = process.env as any;
  const prisma = new PrismaClient({ adapter: new PrismaD1(env.DB) });
  // Use prisma here
}
```

**Source**: https://github.com/opennextjs/opennextjs-cloudflare/issues/471

---

## Platform-Specific Issues

### Windows Development Issues

**Issue**: Full Windows support not guaranteed

**Cause**: Underlying Next.js tooling issues on Windows

**Solutions**:

1. **Use WSL** (Windows Subsystem for Linux)
   ```bash
   wsl --install
   # Develop in WSL environment
   ```

2. **Use Virtual Machine** with Linux
   - VirtualBox, VMware, or Hyper-V
   - Install Ubuntu or other Linux distribution

3. **Use Linux-based CI/CD**
   - GitHub Actions (Ubuntu runners)
   - GitLab CI (Linux images)
   - Cloudflare Workers Builds

**Source**: https://opennext.js.org/cloudflare#windows-support

---

## Configuration Issues

### Missing or Incorrect Compatibility Settings

**Problem**: Unexpected runtime errors or build failures

**Solution**: Verify wrangler.jsonc has minimum required settings:

```jsonc
{
  "name": "your-app-name",
  "compatibility_date": "2025-05-05",      // Minimum!
  "compatibility_flags": ["nodejs_compat"]  // Required!
}
```

**Checklist**:
- [ ] `compatibility_date` is `2025-05-05` or later
- [ ] `compatibility_flags` includes `nodejs_compat`
- [ ] Worker name is set
- [ ] Bindings (if any) are correctly configured

---

### Edge Runtime Used Instead of Node.js

**Problem**: Features not working or unexpected errors

**Cause**: Edge runtime exports in your code

**Solution**: Remove Edge runtime exports:

```typescript
// ❌ Remove this
export const runtime = "edge";

// ✅ Use Node.js runtime (default)
// No export needed - Node.js is default
```

**Find all instances**:
```bash
# Search for Edge runtime exports
grep -r "export const runtime = \"edge\"" app/ pages/
```

**Why**: OpenNext Cloudflare adapter requires Node.js runtime, not Edge runtime.

---

## Testing Issues

### App Works in `dev` But Fails in `preview`

**Problem**: Application works with `npm run dev` but fails with `npm run preview`

**Cause**: Different runtimes (Node.js vs workerd)

**Debugging Process**:

1. **Always test in preview before deploying**:
   ```bash
   npm run preview
   ```

2. **Check for Node.js-specific APIs**:
   - `fs`, `path`, `crypto` (use Web APIs instead)
   - Process-based operations
   - Buffer usage (use Uint8Array)

3. **Check for runtime-specific behavior**:
   - Environment variable access
   - Binding access patterns
   - Database connection handling

4. **Review error logs**:
   ```bash
   # Preview shows workerd errors
   npm run preview
   # Check console for runtime errors
   ```

**Best Practice**: Always test both environments:
- `npm run dev` - Fast iteration
- `npm run preview` - Catch runtime issues

---

## Deployment Issues

### Deployment Succeeds But Site Returns 500

**Possible Causes**:

1. **Environment variables not set**:
   - Check Cloudflare dashboard → Workers & Pages → Settings → Variables
   - Verify all required env vars are configured

2. **Bindings not configured**:
   - Check `wrangler.jsonc` bindings match dashboard configuration
   - Verify database IDs, bucket names, etc.

3. **Database connection issues**:
   - Ensure using request-scoped clients
   - Verify D1 database exists and is accessible

4. **Check Cloudflare Workers logs**:
   ```bash
   wrangler tail
   # Or view in dashboard → Workers & Pages → Logs
   ```

---

## Getting Help

### Debugging Steps

1. **Check logs**:
   ```bash
   # Tail production logs
   wrangler tail

   # Or view in dashboard
   # Cloudflare → Workers & Pages → [Your Worker] → Logs
   ```

2. **Test locally in workerd**:
   ```bash
   npm run preview
   # Check console for errors
   ```

3. **Analyze bundle**:
   ```bash
   ./scripts/analyze-bundle.sh
   ```

4. **Verify configuration**:
   ```bash
   # Check wrangler.jsonc
   cat wrangler.jsonc

   # Verify package versions
   npm list @opennextjs/cloudflare next
   ```

### Resources

- **OpenNext Troubleshooting**: https://opennext.js.org/cloudflare/troubleshooting
- **Known Issues**: https://opennext.js.org/cloudflare/known-issues
- **GitHub Issues**: https://github.com/opennextjs/opennextjs-cloudflare/issues
- **Cloudflare Discord**: https://discord.gg/cloudflaredev
- **Cloudflare Community**: https://community.cloudflare.com/

### Reporting Bugs

When reporting issues:

1. **Include**:
   - Next.js version (`npm list next`)
   - OpenNext adapter version (`npm list @opennextjs/cloudflare`)
   - wrangler.jsonc configuration
   - Full error message and stack trace
   - Steps to reproduce

2. **Post in**:
   - GitHub Issues (for adapter bugs)
   - Cloudflare Community (for Workers-specific issues)
   - Discord (for quick questions)

---

**Last Updated**: 2025-10-21
