# Common Issues and Troubleshooting

**Last Updated**: 2025-10-20

This document details all 6 documented issues that commonly affect Cloudflare Workers projects, with detailed explanations and fixes.

---

## Table of Contents

1. [Issue #1: Export Syntax Error](#issue-1-export-syntax-error)
2. [Issue #2: Static Assets Routing Conflicts](#issue-2-static-assets-routing-conflicts)
3. [Issue #3: Scheduled/Cron Not Exported](#issue-3-scheduledcron-not-exported)
4. [Issue #4: HMR Race Condition](#issue-4-hmr-race-condition)
5. [Issue #5: Static Assets Upload Race](#issue-5-static-assets-upload-race)
6. [Issue #6: Service Worker Format Confusion](#issue-6-service-worker-format-confusion)

---

## Issue #1: Export Syntax Error

### Symptoms

```
Error: Cannot read properties of undefined (reading 'map')
```

Deployment fails with TypeError during build or runtime.

### Source

- **GitHub Issue**: [honojs/hono #3955](https://github.com/honojs/hono/issues/3955)
- **Related**: [honojs/vite-plugins #237](https://github.com/honojs/vite-plugins/issues/237)
- **Reported**: February 2025

### Root Cause

When using Hono with Vite's build tools, the incorrect export pattern breaks the `this` context:

```typescript
// ❌ WRONG: This causes the error
export default {
  fetch: app.fetch
}
```

**Why it breaks:**
- Vite's bundler transforms the code
- The `app.fetch` binding loses its `this` context
- When Cloudflare calls `fetch()`, `this` is `undefined`
- Hono tries to access `this.routes.map(...)` → Error

### Fix

Use the direct export pattern:

```typescript
import { Hono } from 'hono'

const app = new Hono()

// Define routes...

// ✅ CORRECT
export default app
```

**Why this works:**
- Hono's app object already implements the fetch handler
- No context binding is lost
- Vite can properly bundle the code

### Exception: When You Need Multiple Handlers

If you need scheduled/tail handlers, use Module Worker format:

```typescript
export default {
  fetch: app.fetch,
  scheduled: async (event, env, ctx) => {
    console.log('Cron triggered:', event.cron)
  }
}
```

This works because Cloudflare's runtime handles the binding correctly for Module Workers.

### How to Verify Fix

1. Check your `src/index.ts` export
2. Ensure it's `export default app`
3. Run `npm run dev` → Should start without errors
4. Run `npm run deploy` → Should deploy successfully
5. Test API endpoints → Should return JSON (not errors)

---

## Issue #2: Static Assets Routing Conflicts

### Symptoms

- API routes return `index.html` instead of JSON
- API endpoints return status 200 but wrong content-type (text/html instead of application/json)
- Browser console shows HTML when expecting JSON

### Example

```bash
curl http://localhost:8787/api/hello
# Expected: {"message":"Hello"}
# Actual: <!DOCTYPE html><html>...
```

### Source

- **GitHub Issue**: [workers-sdk #8879](https://github.com/cloudflare/workers-sdk/issues/8879)
- **Reported**: April 2025

### Root Cause

The `not_found_handling: "single-page-application"` configuration creates a fallback:

```
Request → File not found → Return index.html
```

**Without `run_worker_first`:**
1. Request to `/api/hello`
2. Static Assets handler checks: "Does `/api/hello` file exist?"
3. No → SPA fallback → Returns `public/index.html`
4. Your Worker never runs!

### Fix

Add `run_worker_first` to `wrangler.jsonc`:

```jsonc
{
  "assets": {
    "directory": "./public/",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]  // ← CRITICAL
  }
}
```

**What this does:**
- Requests matching `/api/*` go to your Worker FIRST
- If Worker doesn't handle it, then try Static Assets
- Ensures API routes are never intercepted by SPA fallback

### Advanced Configuration

```jsonc
{
  "assets": {
    "run_worker_first": [
      "/api/*",
      "/auth/*",
      "/webhooks/*",
      "/_app/*"
    ]
  }
}
```

### How to Verify Fix

1. Start dev server: `npm run dev`
2. Test API endpoint:
   ```bash
   curl -i http://localhost:8787/api/hello
   ```
3. Check response:
   - ✅ `Content-Type: application/json`
   - ✅ JSON body
4. Test static file:
   ```bash
   curl -i http://localhost:8787/
   ```
5. Check response:
   - ✅ `Content-Type: text/html`
   - ✅ HTML body

---

## Issue #3: Scheduled/Cron Not Exported

### Symptoms

```
Error: Handler does not export a scheduled() function
```

Deployment succeeds, but cron triggers fail.

### Source

- **GitHub Issue**: [honojs/vite-plugins #275](https://github.com/honojs/vite-plugins/issues/275)
- **Reported**: July 2025

### Root Cause

The `@hono/vite-build/cloudflare-workers` plugin **only supports the `fetch` handler**.

If you use:
```typescript
export default app  // Only exports fetch handler
```

...then scheduled/tail handlers are not exported.

### Fix Option 1: Use Module Worker Format

```typescript
import { Hono } from 'hono'

const app = new Hono()

// Define routes...

// ✅ Export multiple handlers
export default {
  fetch: app.fetch,

  scheduled: async (event, env, ctx) => {
    console.log('Cron triggered:', event.cron)
    // Your scheduled logic here
  },

  tail: async (events, env, ctx) => {
    // Tail handler logic
    console.log('Tail events:', events)
  }
}
```

### Fix Option 2: Use @cloudflare/vite-plugin

Instead of `@hono/vite-build/cloudflare-workers`, use the official Cloudflare plugin:

```bash
npm uninstall @hono/vite-build
npm install -D @cloudflare/vite-plugin
```

Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [cloudflare()],
})
```

This plugin supports all handler types.

### Configure Cron in wrangler.jsonc

```jsonc
{
  "triggers": {
    "crons": ["0 0 * * *"]  // Daily at midnight UTC
  }
}
```

### How to Verify Fix

1. Deploy: `npm run deploy`
2. Trigger manually:
   ```bash
   wrangler deploy && wrangler tail
   ```
3. Wait for cron or trigger via dashboard
4. Check logs for scheduled handler output

---

## Issue #4: HMR Race Condition

### Symptoms

```
Error: A hanging Promise was canceled
```

- Development server crashes during file changes
- Happens with rapid HMR updates
- Requires manual restart

### Source

- **GitHub Issue**: [workers-sdk #9518](https://github.com/cloudflare/workers-sdk/issues/9518)
- **Related**: [workers-sdk #9249](https://github.com/cloudflare/workers-sdk/issues/9249)
- **Reported**: June 2025

### Root Cause

**Race condition in `@cloudflare/vite-plugin` versions 1.1.1 through 1.11.x:**

1. File change detected
2. Vite triggers HMR
3. Plugin cancels old Worker instance
4. New instance starts before old one fully terminates
5. Promise cancellation error thrown

### Fix

Update to latest `@cloudflare/vite-plugin`:

```bash
npm install -D @cloudflare/vite-plugin@1.13.13
```

**Fixed in version 1.13.13** (October 2025)

### Alternative: Configure Vite with Persistence

If updating doesn't fix it, try:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [
    cloudflare({
      persist: true,  // Persist state between HMR updates
    }),
  ],
})
```

### How to Verify Fix

1. Start dev server: `npm run dev`
2. Make rapid file changes (edit `src/index.ts` 5 times quickly)
3. Check terminal:
   - ✅ No "hanging Promise" errors
   - ✅ HMR updates smoothly
4. Test API endpoint after each change:
   ```bash
   curl http://localhost:8787/api/hello
   ```

---

## Issue #5: Static Assets Upload Race

### Symptoms

- Deployment fails **non-deterministically** in CI/CD
- Works locally, fails in CI randomly
- Error messages vary:
  - "Failed to upload assets"
  - "Timeout during asset upload"
  - "Asset manifest mismatch"

### Source

- **GitHub Issue**: [workers-sdk #7555](https://github.com/cloudflare/workers-sdk/issues/7555)
- **Reported**: March 2025

### Root Cause

**Race condition during parallel asset uploads:**

1. Wrangler uploads multiple assets simultaneously
2. Cloudflare's asset store processes uploads
3. Manifest is generated before all uploads complete
4. Deployment validation fails

**Most common in CI/CD** because:
- Network latency varies
- Parallel execution timing is different
- No user interaction to retry

### Fix Option 1: Use Wrangler 4.x+ (Recommended)

Wrangler 4.x includes improved upload logic:

```bash
npm install -D wrangler@latest
```

**Improvements in 4.x:**
- Sequential upload of critical assets
- Better retry logic
- Manifest generation after all uploads complete

### Fix Option 2: Add Retry Logic to CI/CD

```yaml
# GitHub Actions example
- name: Deploy to Cloudflare
  run: |
    for i in {1..3}; do
      npm run deploy && break || sleep 10
    done
```

```bash
# Shell script
#!/bin/bash
for i in {1..3}; do
  npm run deploy && break || sleep 10
done
```

### Fix Option 3: Reduce Asset Count

If you have many small files, bundle them:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
})
```

### How to Verify Fix

1. Deploy locally 5 times:
   ```bash
   for i in {1..5}; do npm run deploy; done
   ```
2. All deployments should succeed
3. Run in CI/CD pipeline
4. Check logs for upload errors

---

## Issue #6: Service Worker Format Confusion

### Symptoms

- Using deprecated `addEventListener('fetch', ...)` pattern
- TypeScript errors about missing types
- Bindings don't work (KV, D1, R2)
- Modern Cloudflare features unavailable

### Source

- **Cloudflare Migration Guide**: https://developers.cloudflare.com/workers/configuration/compatibility-dates/
- **Multiple Stack Overflow questions** (2024-2025)

### Root Cause

**Old tutorials and templates** still use the deprecated Service Worker format:

```typescript
// ❌ DEPRECATED: Service Worker format
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  return new Response('Hello World')
}
```

**Problems with this format:**
- Doesn't support bindings (KV, D1, R2, etc.)
- No TypeScript types
- No environment variable access
- Deprecated since Workers v2 (2021)

### Fix: Use ES Module Format

```typescript
// ✅ CORRECT: ES Module format
export default {
  fetch(request, env, ctx) {
    return new Response('Hello World')
  }
}
```

**With Hono:**
```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('Hello World'))

export default app
```

### Migration Steps

1. **Remove `addEventListener`**:
   ```diff
   - addEventListener('fetch', (event) => {
   -   event.respondWith(handleRequest(event.request))
   - })
   ```

2. **Change to ES Module export**:
   ```diff
   + export default {
   +   fetch(request, env, ctx) {
   +     return handleRequest(request, env)
   +   }
   + }
   ```

3. **Update function signatures** to accept `env`:
   ```diff
   - async function handleRequest(request) {
   + async function handleRequest(request, env) {
       // Now you can access env.MY_KV, env.DB, etc.
   ```

4. **Update `wrangler.toml` → `wrangler.jsonc`**:
   ```bash
   # Convert TOML to JSONC (preferred since Wrangler v3.91.0)
   ```

### How to Verify Fix

1. Check `src/index.ts`:
   - ✅ No `addEventListener`
   - ✅ Has `export default`
2. Check you can access bindings:
   ```typescript
   const value = await env.MY_KV.get('key')
   ```
3. TypeScript types work:
   ```typescript
   type Bindings = {
     MY_KV: KVNamespace
   }
   ```

---

## General Troubleshooting Tips

### Check Package Versions

```bash
npm list hono @cloudflare/vite-plugin wrangler
```

**Expected (as of 2025-10-20):**
- `hono@4.10.1`
- `@cloudflare/vite-plugin@1.13.13`
- `wrangler@4.43.0`

### Clear Wrangler Cache

```bash
rm -rf node_modules/.wrangler
rm -rf .wrangler
npm run dev
```

### Check Wrangler Config

```bash
wrangler whoami  # Verify authentication
wrangler dev --local  # Test without deploying
```

### Enable Verbose Logging

```bash
WRANGLER_LOG=debug npm run dev
WRANGLER_LOG=debug npm run deploy
```

### Check Browser Console

Many issues are visible in the browser:
- Open DevTools → Network tab
- Check response Content-Type
- Check response body
- Look for CORS errors

### Test with curl

```bash
# Test API endpoint
curl -i http://localhost:8787/api/hello

# Test POST
curl -X POST http://localhost:8787/api/echo \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'

# Test static file
curl -i http://localhost:8787/styles.css
```

---

## Issue Summary Table

| Issue | Error Message | Source | Fix |
|-------|---------------|--------|-----|
| **#1** | "Cannot read properties of undefined" | hono #3955 | `export default app` |
| **#2** | API routes return HTML | workers-sdk #8879 | `run_worker_first: ["/api/*"]` |
| **#3** | "Handler does not export scheduled()" | vite-plugins #275 | Module Worker format or @cloudflare/vite-plugin |
| **#4** | "A hanging Promise was canceled" | workers-sdk #9518 | Update to vite-plugin@1.13.13+ |
| **#5** | Non-deterministic deployment failures | workers-sdk #7555 | Use Wrangler 4.x+ with retry |
| **#6** | Service Worker format issues | Cloudflare migration | Use ES Module format |

---

## Getting Help

If you encounter issues not covered here:

1. **Check official docs**:
   - Cloudflare Workers: https://developers.cloudflare.com/workers/
   - Hono: https://hono.dev/

2. **Search GitHub issues**:
   - workers-sdk: https://github.com/cloudflare/workers-sdk/issues
   - hono: https://github.com/honojs/hono/issues

3. **Ask in Discord**:
   - Cloudflare Developers: https://discord.gg/cloudflaredev
   - Hono: https://discord.gg/hono

4. **Check Stack Overflow**:
   - Tag: `cloudflare-workers`

---

**All issues documented with GitHub sources** ✅
**All fixes production-tested** ✅
