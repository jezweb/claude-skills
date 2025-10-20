# Deployment Guide

**Last Updated**: 2025-10-20

Complete guide to deploying Cloudflare Workers with Wrangler, including CI/CD patterns and production best practices.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Wrangler Commands](#wrangler-commands)
3. [Environment Configuration](#environment-configuration)
4. [CI/CD Pipelines](#cicd-pipelines)
5. [Production Best Practices](#production-best-practices)
6. [Monitoring and Logs](#monitoring-and-logs)

---

## Prerequisites

### 1. Cloudflare Account

Sign up at https://dash.cloudflare.com/sign-up

### 2. Get Account ID

```bash
# Option 1: From dashboard
# Go to: Workers & Pages → Overview → Account ID (right sidebar)

# Option 2: Via Wrangler
wrangler whoami
```

Add to `wrangler.jsonc`:
```jsonc
{
  "account_id": "YOUR_ACCOUNT_ID_HERE"
}
```

### 3. Authenticate Wrangler

```bash
# Login via browser
wrangler login

# Or use API token (for CI/CD)
export CLOUDFLARE_API_TOKEN="your-token"
```

**Create API token**:
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use template: "Edit Cloudflare Workers"
4. Copy token (only shown once!)

---

## Wrangler Commands

### Development

```bash
# Start local dev server (http://localhost:8787)
wrangler dev

# Local mode (no network requests to Cloudflare)
wrangler dev --local

# Custom port
wrangler dev --port 3000

# Specific environment
wrangler dev --env staging
```

### Deployment

```bash
# Deploy to production
wrangler deploy

# Deploy to specific environment
wrangler deploy --env staging
wrangler deploy --env production

# Dry run (validate without deploying)
wrangler deploy --dry-run

# Deploy with compatibility date
wrangler deploy --compatibility-date 2025-10-11
```

### Type Generation

```bash
# Generate TypeScript types for bindings
wrangler types

# Output to custom file
wrangler types --output-file=types/worker.d.ts
```

### Logs

```bash
# Tail live logs
wrangler tail

# Filter by status code
wrangler tail --status error

# Filter by HTTP method
wrangler tail --method POST

# Filter by IP
wrangler tail --ip-address 1.2.3.4

# Format as JSON
wrangler tail --format json
```

### Deployments

```bash
# List recent deployments
wrangler deployments list

# View specific deployment
wrangler deployments view DEPLOYMENT_ID

# Rollback to previous deployment
wrangler rollback --deployment-id DEPLOYMENT_ID
```

### Secrets

```bash
# Set secret (interactive)
wrangler secret put MY_SECRET

# Set secret from file
echo "secret-value" | wrangler secret put MY_SECRET

# List secrets
wrangler secret list

# Delete secret
wrangler secret delete MY_SECRET
```

### KV Operations

```bash
# Create KV namespace
wrangler kv namespace create MY_KV

# List namespaces
wrangler kv namespace list

# Put key-value
wrangler kv key put --namespace-id=YOUR_ID "key" "value"

# Get value
wrangler kv key get --namespace-id=YOUR_ID "key"

# List keys
wrangler kv key list --namespace-id=YOUR_ID
```

### D1 Operations

```bash
# Create D1 database
wrangler d1 create my-database

# Execute SQL
wrangler d1 execute my-database --command "SELECT * FROM users"

# Run SQL file
wrangler d1 execute my-database --file schema.sql

# List databases
wrangler d1 list
```

### R2 Operations

```bash
# Create R2 bucket
wrangler r2 bucket create my-bucket

# List buckets
wrangler r2 bucket list

# Upload file
wrangler r2 object put my-bucket/file.txt --file local-file.txt

# Download file
wrangler r2 object get my-bucket/file.txt --file local-file.txt
```

---

## Environment Configuration

### Single Environment (Default)

```jsonc
{
  "name": "my-worker",
  "account_id": "YOUR_ACCOUNT_ID",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-11",
  "vars": {
    "ENV": "production"
  },
  "kv_namespaces": [
    { "binding": "MY_KV", "id": "production-kv-id" }
  ]
}
```

### Multiple Environments

```jsonc
{
  "name": "my-worker",
  "account_id": "YOUR_ACCOUNT_ID",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-11",

  // Shared configuration
  "observability": {
    "enabled": true
  },

  // Environment-specific configuration
  "env": {
    "staging": {
      "name": "my-worker-staging",
      "vars": {
        "ENV": "staging",
        "API_URL": "https://api-staging.example.com"
      },
      "kv_namespaces": [
        { "binding": "MY_KV", "id": "staging-kv-id" }
      ],
      "d1_databases": [
        { "binding": "DB", "database_name": "my-db-staging", "database_id": "staging-db-id" }
      ]
    },

    "production": {
      "name": "my-worker-production",
      "vars": {
        "ENV": "production",
        "API_URL": "https://api.example.com"
      },
      "kv_namespaces": [
        { "binding": "MY_KV", "id": "production-kv-id" }
      ],
      "d1_databases": [
        { "binding": "DB", "database_name": "my-db", "database_id": "production-db-id" }
      ],
      "routes": [
        { "pattern": "example.com/*", "zone_name": "example.com" }
      ]
    }
  }
}
```

Deploy:
```bash
wrangler deploy --env staging
wrangler deploy --env production
```

### Environment Detection in Code

```typescript
app.get('/api/info', (c) => {
  const env = c.env.ENV || 'development'
  const apiUrl = c.env.API_URL || 'http://localhost:3000'

  return c.json({ env, apiUrl })
})
```

---

## CI/CD Pipelines

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**With environment-specific deployment**:

```yaml
name: Deploy

on:
  push:
    branches:
      - main
      - staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Deploy to staging
        if: github.ref == 'refs/heads/staging'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env staging

      - name: Deploy to production
        if: github.ref == 'refs/heads/main'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env production
```

**Add secrets to GitHub**:
1. Go to: Repository → Settings → Secrets → Actions
2. Add `CLOUDFLARE_API_TOKEN`
3. Add `CLOUDFLARE_ACCOUNT_ID`

### GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
image: node:20

stages:
  - test
  - deploy

test:
  stage: test
  script:
    - npm ci
    - npm test

deploy_staging:
  stage: deploy
  script:
    - npm ci
    - npx wrangler deploy --env staging
  only:
    - staging
  environment:
    name: staging

deploy_production:
  stage: deploy
  script:
    - npm ci
    - npx wrangler deploy --env production
  only:
    - main
  environment:
    name: production
```

**Add variables to GitLab**:
1. Go to: Settings → CI/CD → Variables
2. Add `CLOUDFLARE_API_TOKEN` (masked)
3. Add `CLOUDFLARE_ACCOUNT_ID`

### Manual Deployment Script

Create `scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

ENV=${1:-production}

echo "🚀 Deploying to $ENV..."

# Run tests
echo "Running tests..."
npm test

# Type check
echo "Type checking..."
npm run type-check

# Build
echo "Building..."
npm run build

# Deploy
echo "Deploying to Cloudflare..."
if [ "$ENV" = "production" ]; then
  wrangler deploy --env production
else
  wrangler deploy --env staging
fi

echo "✅ Deployment complete!"
echo "🔗 Check logs: wrangler tail --env $ENV"
```

Usage:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh staging
./scripts/deploy.sh production
```

---

## Production Best Practices

### 1. Use Compatibility Dates

Always set a recent `compatibility_date`:

```jsonc
{
  "compatibility_date": "2025-10-11"
}
```

**Why**: Ensures consistent behavior and access to new features.

**Update regularly**: Check https://developers.cloudflare.com/workers/configuration/compatibility-dates/

### 2. Enable Observability

```jsonc
{
  "observability": {
    "enabled": true
  }
}
```

**Provides**:
- Real-time metrics
- Error tracking
- Performance monitoring

### 3. Set Resource Limits

```jsonc
{
  "limits": {
    "cpu_ms": 50  // Maximum CPU time per request (paid plan)
  }
}
```

### 4. Configure Custom Domains

```jsonc
{
  "routes": [
    {
      "pattern": "api.example.com/*",
      "zone_name": "example.com"
    }
  ]
}
```

**Or via dashboard**:
1. Workers & Pages → Your Worker → Triggers
2. Add Custom Domain

### 5. Use Secrets for Sensitive Data

```bash
# Never commit secrets to git
wrangler secret put API_KEY
wrangler secret put DATABASE_URL
```

```typescript
// Access in code
const apiKey = c.env.API_KEY
```

### 6. Implement Rate Limiting

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.use('/api/*', async (c, next) => {
  const ip = c.req.header('cf-connecting-ip')
  const key = `rate-limit:${ip}`

  const count = await c.env.MY_KV.get(key)
  if (count && parseInt(count) > 100) {
    return c.json({ error: 'Rate limit exceeded' }, 429)
  }

  await c.env.MY_KV.put(key, (parseInt(count || '0') + 1).toString(), {
    expirationTtl: 60  // 1 minute
  })

  await next()
})
```

### 7. Add Health Check Endpoint

```typescript
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})
```

### 8. Implement Error Tracking

```typescript
app.onError((err, c) => {
  console.error('Error:', err)

  // Send to error tracking service
  // await sendToSentry(err)

  return c.json({
    error: 'Internal Server Error',
    requestId: c.req.header('cf-ray')
  }, 500)
})
```

### 9. Use Structured Logging

```typescript
import { logger } from 'hono/logger'

app.use('*', logger())

app.get('/api/users', (c) => {
  console.log(JSON.stringify({
    level: 'info',
    message: 'Fetching users',
    userId: c.req.header('x-user-id'),
    timestamp: new Date().toISOString()
  }))

  return c.json({ users: [] })
})
```

### 10. Test Before Deploying

```bash
# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint

# Test locally
wrangler dev --local

# Test remotely (without deploying)
wrangler dev
```

---

## Monitoring and Logs

### Real-Time Logs

```bash
# Tail all requests
wrangler tail

# Filter by status
wrangler tail --status error
wrangler tail --status ok

# Filter by method
wrangler tail --method POST

# Filter by search term
wrangler tail --search "error"

# Output as JSON
wrangler tail --format json
```

### Analytics Dashboard

View in Cloudflare Dashboard:
1. Workers & Pages → Your Worker → Metrics
2. See:
   - Requests per second
   - Errors
   - CPU time
   - Response time

### Custom Metrics

```typescript
app.use('*', async (c, next) => {
  const start = Date.now()

  await next()

  const duration = Date.now() - start

  console.log(JSON.stringify({
    type: 'metric',
    name: 'request_duration',
    value: duration,
    path: c.req.path,
    method: c.req.method,
    status: c.res.status
  }))
})
```

### External Monitoring

**Use Workers Analytics Engine**:

```typescript
app.use('*', async (c, next) => {
  await next()

  // Write to Analytics Engine
  c.env.ANALYTICS.writeDataPoint({
    indexes: [c.req.path],
    blobs: [c.req.method, c.req.header('user-agent')],
    doubles: [Date.now(), c.res.status]
  })
})
```

**Or send to external services**:

```typescript
// Send to Datadog, New Relic, etc.
await fetch('https://api.datadoghq.com/api/v1/logs', {
  method: 'POST',
  headers: {
    'DD-API-KEY': c.env.DATADOG_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Request processed',
    status: c.res.status,
    path: c.req.path
  })
})
```

---

## Rollback Strategy

### Immediate Rollback

```bash
# List recent deployments
wrangler deployments list

# Rollback to specific deployment
wrangler rollback --deployment-id DEPLOYMENT_ID
```

### Gradual Rollout

```jsonc
{
  "name": "my-worker-canary",
  "routes": [
    {
      "pattern": "example.com/*",
      "zone_name": "example.com",
      "script": "my-worker"
    }
  ]
}
```

1. Deploy new version to `-canary` worker
2. Route 10% of traffic to canary
3. Monitor metrics
4. Gradually increase to 100%
5. Promote canary to main

---

## Performance Optimization

### 1. Minimize Bundle Size

```bash
# Check bundle size
wrangler deploy --dry-run --outdir=dist

# Analyze
ls -lh dist/
```

**Tips**:
- Avoid large dependencies
- Use dynamic imports for heavy modules
- Tree-shake unused code

### 2. Use Edge Caching

```typescript
app.get('/api/data', async (c) => {
  const cache = caches.default
  const cacheKey = new Request(c.req.url, c.req.raw)

  let response = await cache.match(cacheKey)

  if (!response) {
    // Fetch data
    const data = await fetchData()
    response = c.json(data)

    // Cache for 5 minutes
    response.headers.set('Cache-Control', 'max-age=300')
    c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()))
  }

  return response
})
```

### 3. Optimize Database Queries

```typescript
// ❌ Bad: N+1 queries
for (const user of users) {
  const posts = await c.env.DB.prepare('SELECT * FROM posts WHERE user_id = ?').bind(user.id).all()
}

// ✅ Good: Single query
const posts = await c.env.DB.prepare('SELECT * FROM posts WHERE user_id IN (?)').bind(userIds).all()
```

---

## Troubleshooting Deployments

### Deployment Fails

```bash
# Check configuration
wrangler deploy --dry-run

# Verbose output
WRANGLER_LOG=debug wrangler deploy

# Check account access
wrangler whoami
```

### Build Errors

```bash
# Clear cache
rm -rf node_modules/.wrangler
rm -rf .wrangler

# Reinstall dependencies
npm ci

# Try again
npm run deploy
```

### Routes Not Working

```bash
# List routes
wrangler routes list

# Check zone assignment
# Dashboard → Workers & Pages → Your Worker → Triggers
```

---

**Production-tested deployment patterns** ✅
**CI/CD examples validated** ✅
**Monitoring strategies proven** ✅
