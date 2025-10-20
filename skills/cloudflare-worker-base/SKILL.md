---
name: Cloudflare Worker Base Stack
description: |
  Production-tested setup for Cloudflare Workers with Hono, Vite, and Static Assets.

  Use when: creating new Cloudflare Workers projects, setting up Hono routing with Workers,
  configuring Vite plugin for Workers, adding Static Assets to Workers, deploying with Wrangler,
  or encountering deployment errors, routing conflicts, or HMR crashes.

  Prevents 6 documented issues: export syntax errors, Static Assets routing conflicts,
  scheduled handler errors, HMR race conditions, upload race conditions, and Service Worker
  format confusion.

  Keywords: Cloudflare Workers, CF Workers, Hono, wrangler, Vite, Static Assets, @cloudflare/vite-plugin,
  wrangler.jsonc, ES Module, run_worker_first, SPA fallback, API routes, serverless, edge computing,
  "Cannot read properties of undefined", "Static Assets 404", "A hanging Promise was canceled",
  "Handler does not export", deployment fails, routing not working, HMR crashes
---

# Cloudflare Worker Base Stack

**Production-tested**: cloudflare-worker-base-test (https://cloudflare-worker-base-test.webfonts.workers.dev)
**Last Updated**: 2025-10-20
**Status**: Production Ready ✅

---

## Quick Start (5 Minutes)

### 1. Scaffold Project

```bash
npm create cloudflare@latest my-worker -- \
  --type hello-world \
  --ts \
  --git \
  --deploy false \
  --framework none
```

**Why these flags:**
- `--type hello-world`: Clean starting point
- `--ts`: TypeScript support
- `--git`: Initialize git repo
- `--deploy false`: Don't deploy yet (configure first)
- `--framework none`: We'll add Vite ourselves

### 2. Install Dependencies

```bash
cd my-worker
npm install hono@4.10.1
npm install -D @cloudflare/vite-plugin@1.13.13 vite@latest
```

**Version Notes:**
- `hono@4.10.1`: Latest stable (verified 2025-10-20)
- `@cloudflare/vite-plugin@1.13.13`: Latest stable, fixes HMR race condition
- `vite`: Latest version compatible with Cloudflare plugin

### 3. Configure Wrangler

Create or update `wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-worker",
  "main": "src/index.ts",
  "account_id": "YOUR_ACCOUNT_ID",
  "compatibility_date": "2025-10-11",
  "observability": {
    "enabled": true
  },
  "assets": {
    "directory": "./public/",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]
  }
}
```

**CRITICAL: `run_worker_first` Configuration**
- Without this, SPA fallback intercepts API routes
- API routes return `index.html` instead of JSON
- Source: [workers-sdk #8879](https://github.com/cloudflare/workers-sdk/issues/8879)

### 4. Configure Vite

Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [
    cloudflare({
      // Optional: Configure the plugin if needed
    }),
  ],
})
```

**Why @cloudflare/vite-plugin:**
- Official plugin from Cloudflare
- Supports HMR with Workers
- Enables local development with Miniflare
- Version 1.13.13 fixes "A hanging Promise was canceled" error

---

## The Four-Step Setup Process

### Step 1: Create Hono App with API Routes

Create `src/index.ts`:

```typescript
/**
 * Cloudflare Worker with Hono
 *
 * CRITICAL: Export pattern to prevent build errors
 * ✅ CORRECT: export default app
 * ❌ WRONG:   export default { fetch: app.fetch }
 */

import { Hono } from 'hono'

// Type-safe environment bindings
type Bindings = {
  ASSETS: Fetcher
}

const app = new Hono<{ Bindings: Bindings }>()

/**
 * API Routes
 * Handled BEFORE static assets due to run_worker_first config
 */
app.get('/api/hello', (c) => {
  return c.json({
    message: 'Hello from Cloudflare Workers!',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    version: '1.0.0',
    environment: c.env ? 'production' : 'development',
  })
})

/**
 * Fallback to Static Assets
 * Any route not matched above is served from public/ directory
 */
app.all('*', (c) => {
  return c.env.ASSETS.fetch(c.req.raw)
})

/**
 * Export the Hono app directly (ES Module format)
 * This is the correct pattern for Cloudflare Workers with Hono + Vite
 */
export default app
```

**Why This Export Pattern:**
- Source: [honojs/hono #3955](https://github.com/honojs/hono/issues/3955)
- Using `{ fetch: app.fetch }` causes: "Cannot read properties of undefined (reading 'map')"
- Exception: If you need scheduled/tail handlers, use Module Worker format:
  ```typescript
  export default {
    fetch: app.fetch,
    scheduled: async (event, env, ctx) => { /* ... */ }
  }
  ```

### Step 2: Create Static Frontend

Create `public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Worker App</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="container">
    <h1>Cloudflare Worker + Static Assets</h1>
    <button onclick="testAPI()">Test API</button>
    <pre id="output"></pre>
  </div>
  <script src="/script.js"></script>
</body>
</html>
```

Create `public/script.js`:

```javascript
async function testAPI() {
  const response = await fetch('/api/hello')
  const data = await response.json()
  document.getElementById('output').textContent = JSON.stringify(data, null, 2)
}
```

Create `public/styles.css`:

```css
body {
  font-family: system-ui, -apple-system, sans-serif;
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
}

button {
  background: #0070f3;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
}

pre {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
}
```

### Step 3: Update Package Scripts

Update `package.json`:

```json
{
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "cf-typegen": "wrangler types"
  }
}
```

### Step 4: Test & Deploy

```bash
# Generate TypeScript types for bindings
npm run cf-typegen

# Start local dev server (http://localhost:8787)
npm run dev

# Deploy to production
npm run deploy
```

---

## Known Issues Prevention

This skill prevents **6 documented issues**:

### Issue #1: Export Syntax Error
**Error**: "Cannot read properties of undefined (reading 'map')"
**Source**: [honojs/hono #3955](https://github.com/honojs/hono/issues/3955)
**Prevention**: Use `export default app` (NOT `{ fetch: app.fetch }`)

### Issue #2: Static Assets Routing Conflicts
**Error**: API routes return `index.html` instead of JSON
**Source**: [workers-sdk #8879](https://github.com/cloudflare/workers-sdk/issues/8879)
**Prevention**: Add `"run_worker_first": ["/api/*"]` to wrangler.jsonc

### Issue #3: Scheduled/Cron Not Exported
**Error**: "Handler does not export a scheduled() function"
**Source**: [honojs/vite-plugins #275](https://github.com/honojs/vite-plugins/issues/275)
**Prevention**: Use Module Worker format when needed:
```typescript
export default {
  fetch: app.fetch,
  scheduled: async (event, env, ctx) => { /* ... */ }
}
```

### Issue #4: HMR Race Condition
**Error**: "A hanging Promise was canceled" during development
**Source**: [workers-sdk #9518](https://github.com/cloudflare/workers-sdk/issues/9518)
**Prevention**: Use `@cloudflare/vite-plugin@1.13.13` or later

### Issue #5: Static Assets Upload Race
**Error**: Non-deterministic deployment failures in CI/CD
**Source**: [workers-sdk #7555](https://github.com/cloudflare/workers-sdk/issues/7555)
**Prevention**: Use Wrangler 4.x+ with retry logic (fixed in recent versions)

### Issue #6: Service Worker Format Confusion
**Error**: Using deprecated Service Worker format
**Source**: Cloudflare migration guide
**Prevention**: Always use ES Module format (shown in Step 1)

---

## Configuration Files Reference

### wrangler.jsonc (Full Example)

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-worker",
  "main": "src/index.ts",
  "account_id": "YOUR_ACCOUNT_ID",
  "compatibility_date": "2025-10-11",
  "observability": {
    "enabled": true
  },
  "assets": {
    "directory": "./public/",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]
  }
  /* Optional: Environment Variables */
  // "vars": { "MY_VARIABLE": "production_value" }

  /* Optional: KV Namespace Bindings */
  // "kv_namespaces": [
  //   { "binding": "MY_KV", "id": "YOUR_KV_ID" }
  // ]

  /* Optional: D1 Database Bindings */
  // "d1_databases": [
  //   { "binding": "DB", "database_name": "my-db", "database_id": "YOUR_DB_ID" }
  // ]

  /* Optional: R2 Bucket Bindings */
  // "r2_buckets": [
  //   { "binding": "MY_BUCKET", "bucket_name": "my-bucket" }
  // ]
}
```

**Why wrangler.jsonc over wrangler.toml:**
- JSON format preferred since Wrangler v3.91.0
- Better IDE support with JSON schema
- Comments allowed with JSONC

### vite.config.ts (Full Example)

```typescript
import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [
    cloudflare({
      // Persist state between HMR updates
      persist: true,
    }),
  ],

  // Optional: Configure server
  server: {
    port: 8787,
  },

  // Optional: Build optimizations
  build: {
    target: 'esnext',
    minify: true,
  },
})
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "types": ["@cloudflare/workers-types/2023-07-01"],
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

## API Route Patterns

### Basic JSON Response

```typescript
app.get('/api/users', (c) => {
  return c.json({
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ]
  })
})
```

### POST with Request Body

```typescript
app.post('/api/users', async (c) => {
  const body = await c.req.json()

  // Validate and process body
  return c.json({ success: true, data: body }, 201)
})
```

### Route Parameters

```typescript
app.get('/api/users/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ id, name: 'User' })
})
```

### Query Parameters

```typescript
app.get('/api/search', (c) => {
  const query = c.req.query('q')
  return c.json({ query, results: [] })
})
```

### Error Handling

```typescript
app.get('/api/data', async (c) => {
  try {
    // Your logic here
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})
```

### Using Bindings (KV, D1, R2)

```typescript
type Bindings = {
  ASSETS: Fetcher
  MY_KV: KVNamespace
  DB: D1Database
  MY_BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/data', async (c) => {
  // KV
  const value = await c.env.MY_KV.get('key')

  // D1
  const result = await c.env.DB.prepare('SELECT * FROM users').all()

  // R2
  const object = await c.env.MY_BUCKET.get('file.txt')

  return c.json({ value, result, object })
})
```

---

## Static Assets Best Practices

### Directory Structure

```
public/
├── index.html          # Main entry point
├── styles.css          # Global styles
├── script.js           # Client-side JavaScript
├── favicon.ico         # Favicon
└── assets/             # Images, fonts, etc.
    ├── logo.png
    └── fonts/
```

### SPA Fallback

The `"not_found_handling": "single-page-application"` configuration means:
- Unknown routes return `index.html`
- Useful for React Router, Vue Router, etc.
- BUT requires `run_worker_first` for API routes!

### Route Priority

With `"run_worker_first": ["/api/*"]`:

1. `/api/hello` → Worker handles it (returns JSON)
2. `/` → Static Assets serve `index.html`
3. `/styles.css` → Static Assets serve `styles.css`
4. `/unknown` → Static Assets serve `index.html` (SPA fallback)

### Caching Static Assets

Static Assets are automatically cached at the edge. To bust cache:
```html
<link rel="stylesheet" href="/styles.css?v=1.0.0">
<script src="/script.js?v=1.0.0"></script>
```

---

## Development Workflow

### Local Development

```bash
npm run dev
```

- Server runs on http://localhost:8787
- HMR enabled (file changes reload automatically)
- Uses Miniflare for local simulation
- All bindings work locally (KV, D1, R2)

### Testing API Routes

```bash
# Test GET endpoint
curl http://localhost:8787/api/hello

# Test POST endpoint
curl -X POST http://localhost:8787/api/echo \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Type Generation

```bash
npm run cf-typegen
```

Generates `worker-configuration.d.ts` with:
- Binding types (KV, D1, R2, etc.)
- Environment variable types
- Auto-completes in your editor

### Deployment

```bash
# Deploy to production
npm run deploy

# Deploy to specific environment
wrangler deploy --env staging

# Tail logs in production
wrangler tail

# Check deployment status
wrangler deployments list
```

---

## Complete Setup Checklist

- [ ] Project scaffolded with `npm create cloudflare@latest`
- [ ] Dependencies installed: `hono@4.10.1`, `@cloudflare/vite-plugin@1.13.13`
- [ ] `wrangler.jsonc` created with:
  - [ ] `account_id` set to your Cloudflare account
  - [ ] `assets.directory` pointing to `./public/`
  - [ ] `assets.run_worker_first` includes `/api/*`
  - [ ] `compatibility_date` set to recent date
- [ ] `vite.config.ts` created with `@cloudflare/vite-plugin`
- [ ] `src/index.ts` created with Hono app
  - [ ] Uses `export default app` (NOT `{ fetch: app.fetch }`)
  - [ ] Includes ASSETS binding type
  - [ ] Has fallback route: `app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))`
- [ ] `public/` directory created with static files
- [ ] `npm run cf-typegen` executed successfully
- [ ] `npm run dev` starts without errors
- [ ] API routes tested in browser/curl
- [ ] Static assets serve correctly
- [ ] HMR works without crashes
- [ ] Ready to deploy with `npm run deploy`

---

## Advanced Topics

### Adding Middleware

```typescript
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'

const app = new Hono<{ Bindings: Bindings }>()

// Global middleware
app.use('*', logger())
app.use('/api/*', cors())

// Route-specific middleware
app.use('/admin/*', async (c, next) => {
  // Auth check
  await next()
})
```

### Environment-Specific Configuration

```jsonc
// wrangler.jsonc
{
  "name": "my-worker",
  "env": {
    "staging": {
      "vars": { "ENV": "staging" }
    },
    "production": {
      "vars": { "ENV": "production" }
    }
  }
}
```

Deploy: `wrangler deploy --env staging`

### Custom Error Pages

```typescript
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})
```

### Testing with Vitest

```bash
npm install -D vitest @cloudflare/vitest-pool-workers
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
      },
    },
  },
})
```

See `reference/testing.md` for complete testing guide.

---

## File Templates

All templates are available in the `templates/` directory:

- **wrangler.jsonc** - Complete Worker configuration
- **vite.config.ts** - Vite + Cloudflare plugin setup
- **package.json** - Dependencies and scripts
- **tsconfig.json** - TypeScript configuration
- **src/index.ts** - Hono app with API routes
- **public/index.html** - Static frontend example
- **public/styles.css** - Example styling
- **public/script.js** - API test functions

Copy these files to your project and customize as needed.

---

## Reference Documentation

For deeper understanding, see:

- **architecture.md** - Deep dive into export patterns, routing, and Static Assets
- **common-issues.md** - All 6 issues with detailed troubleshooting
- **deployment.md** - Wrangler commands, CI/CD patterns, and production tips

---

## Official Documentation

- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Static Assets**: https://developers.cloudflare.com/workers/static-assets/
- **Vite Plugin**: https://developers.cloudflare.com/workers/vite-plugin/
- **Wrangler Configuration**: https://developers.cloudflare.com/workers/wrangler/configuration/
- **Hono**: https://hono.dev/docs/getting-started/cloudflare-workers
- **Context7 Library ID**: `/websites/developers_cloudflare-workers`

---

## Dependencies (Latest Verified 2025-10-20)

```json
{
  "dependencies": {
    "hono": "^4.10.1"
  },
  "devDependencies": {
    "@cloudflare/vite-plugin": "^1.13.13",
    "@cloudflare/workers-types": "^4.20251011.0",
    "vite": "^7.0.0",
    "wrangler": "^4.43.0",
    "typescript": "^5.9.0"
  }
}
```

---

## Production Example

This skill is based on the cloudflare-worker-base-test project:
- **Live**: https://cloudflare-worker-base-test.webfonts.workers.dev
- **Build Time**: ~45 minutes (actual)
- **Errors**: 0 (all 6 known issues prevented)
- **Validation**: ✅ Local dev, HMR, production deployment all successful

All patterns in this skill have been validated in production.

---

**Questions? Issues?**

1. Check `reference/common-issues.md` first
2. Verify all steps in the 4-step setup process
3. Ensure `export default app` (not `{ fetch: app.fetch }`)
4. Ensure `run_worker_first` is configured
5. Check official docs: https://developers.cloudflare.com/workers/
