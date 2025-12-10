---
paths: wrangler.jsonc, wrangler.toml, src/server/**/*.ts, src/worker/**/*.ts, "**/*.worker.ts", vite.config.*
---

# Cloudflare Workers Corrections

Claude's training may reference older Workers patterns. This project uses current (2025) conventions.

## Critical Patterns

### Export Syntax
```typescript
/* ❌ Causes "Cannot read properties of undefined" */
export default { fetch: app.fetch }

/* ✅ Correct pattern */
export default app
```

### Static Assets with SPA Routing

When using `"not_found_handling": "single-page-application"`, API routes get intercepted and return `index.html` instead of JSON.

```jsonc
/* wrangler.jsonc - MUST include run_worker_first */
{
  "assets": {
    "directory": "./public/",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]  // ← Critical: ensures Worker handles API routes
  }
}
```

### Configuration File
```bash
# ❌ Older format (still works but not recommended)
wrangler.toml

# ✅ Current format (supports comments, better DX)
wrangler.jsonc
```

### ES Module Format (Required)

```typescript
/* ❌ Service Worker format (deprecated) */
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})

/* ✅ ES Module format (required) */
export default {
  async fetch(request, env, ctx) {
    return new Response('Hello')
  }
}

/* ✅ Or with Hono */
import { Hono } from 'hono'
const app = new Hono()
export default app
```

### Scheduled Handlers

When adding cron triggers, must use Module Worker format:

```typescript
/* ✅ Combining fetch + scheduled */
export default {
  fetch: app.fetch,
  scheduled: async (event, env, ctx) => {
    // Cron job logic
  }
}
```

## Environment & Bindings

### Type-Safe Bindings
```typescript
type Bindings = {
  DB: D1Database
  KV: KVNamespace
  BUCKET: R2Bucket
  ASSETS: Fetcher
  MY_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()
```

### Secrets Management
```bash
# ❌ Native Integrations (removed from dashboard June 2025)
# Set up via Cloudflare dashboard

# ✅ CLI-based approach
wrangler secret put MY_SECRET
```

## No Node.js APIs

Workers runtime is NOT Node.js:

```typescript
/* ❌ Node.js APIs don't exist */
import fs from 'fs'
import path from 'path'
process.env.MY_VAR

/* ✅ Use Web APIs and env bindings */
const response = await fetch(url)
const data = env.MY_VAR
```

## Vite Plugin

```typescript
/* vite.config.ts */
import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [cloudflare()]
})
```

## Quick Fixes

| If Claude suggests... | Use instead... |
|----------------------|----------------|
| `export default { fetch: app.fetch }` | `export default app` |
| `wrangler.toml` | `wrangler.jsonc` |
| Service Worker `addEventListener` | ES Module `export default` |
| `process.env.X` | `env.X` from handler params |
| Native Integrations dashboard | `wrangler secret put` |
| Missing `run_worker_first` | Add to assets config for API routes |
