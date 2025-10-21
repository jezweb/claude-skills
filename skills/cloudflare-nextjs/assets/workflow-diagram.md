# Next.js on Cloudflare Workers - Development Workflow

Visual guide to the development, testing, and deployment workflow for Next.js applications on Cloudflare Workers.

---

## Complete Workflow Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NEW PROJECT SETUP                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  npm create cloudflare  │
                    │  -- my-next-app         │
                    │  --framework=next       │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Project Created With:  │
                    │  • wrangler.jsonc       │
                    │  • open-next.config.ts  │
                    │  • package.json scripts │
                    └─────────────────────────┘
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT PHASE                                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌───────────────────┐       ┌───────────────────┐
        │  npm run dev      │       │  Code Changes     │
        │  (Next.js Server) │◄──────┤  • Components     │
        │                   │       │  • Routes         │
        │  Fast Iteration   │       │  • Server Actions │
        │  Hot Reload       │       └───────────────────┘
        └───────────────────┘
                    │
                    │  Feature Complete?
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      TESTING PHASE                                   │
└─────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  npm run preview      │
        │  (workerd Runtime)    │
        │                       │
        │  Production-like test │
        │  Catches Workers bugs │
        └───────────────────────┘
                    │
                    ├─────► Check:
                    │       • SSR works?
                    │       • Bindings work (D1, R2, KV)?
                    │       • Middleware runs?
                    │       • No runtime errors?
                    │
                    ▼
              ┌──────────┐
              │  Pass?   │
              └────┬─────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
      YES                    NO
        │                     │
        │                     └─────► Fix Issues
        │                              │
        │                              └────► Back to Dev
        │
┌─────────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT PHASE                                  │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────┐
│  npm run deploy   │
│                   │
│  1. Build         │
│  2. Deploy        │
└───────────────────┘
        │
        ▼
┌───────────────────────┐
│  Cloudflare Workers   │
│  (Production)         │
│                       │
│  • Global CDN         │
│  • Custom Domain      │
│  • Bindings Active    │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│  Monitor & Maintain   │
│                       │
│  • Check logs         │
│  • Track metrics      │
│  • Update deps        │
└───────────────────────┘
```

---

## Detailed Phase Breakdown

### Phase 1: Project Setup

#### New Project
```bash
# One command creates everything
npm create cloudflare@latest -- my-next-app --framework=next

# Creates:
# ✅ Next.js project structure
# ✅ wrangler.jsonc (Worker config)
# ✅ open-next.config.ts (Adapter config)
# ✅ package.json with scripts
```

#### Existing Project
```bash
# Install adapter
npm install --save-dev @opennextjs/cloudflare

# Create config files
# • wrangler.jsonc
# • open-next.config.ts

# Update package.json scripts
```

**Files Created**:
```
my-next-app/
├── wrangler.jsonc              # Worker configuration
├── open-next.config.ts         # OpenNext adapter config
├── package.json                # With dev/preview/deploy scripts
├── app/                        # Next.js App Router
├── public/                     # Static assets
└── next.config.js              # Next.js config
```

---

### Phase 2: Development (Dual Workflow)

#### Workflow A: Fast Iteration (`npm run dev`)

```
Code Change → Hot Reload → View in Browser → Repeat
    ↓
Fast feedback (< 1 second)
Uses Next.js dev server (Node.js)
NOT production runtime
```

**Use for**:
- UI development
- Component iteration
- Quick feature testing
- Styling and layout

**Command**: `npm run dev`

**Runtime**: Node.js (Next.js dev server)

---

#### Workflow B: Production Testing (`npm run preview`)

```
Code Change → Build → Run in workerd → Test → Fix → Repeat
    ↓
Slower rebuild (~10-30 seconds)
Uses actual Workers runtime
Catches production issues
```

**Use for**:
- Integration testing
- Binding testing (D1, R2, KV, AI)
- Middleware verification
- Final pre-deployment checks

**Command**: `npm run preview`

**Runtime**: workerd (Cloudflare Workers runtime)

---

### Phase 3: Testing Checklist

Before deploying, verify in `preview` mode:

```
┌─────────────────────────────────────┐
│  TESTING CHECKLIST                  │
├─────────────────────────────────────┤
│  □ SSR pages render correctly       │
│  □ Static pages generated           │
│  □ API routes work (CRUD)           │
│  □ Server Actions execute           │
│  □ Middleware runs without errors   │
│  □ D1 queries succeed               │
│  □ R2 file operations work          │
│  □ KV read/write functional         │
│  □ Workers AI inference works       │
│  □ Image optimization loads         │
│  □ Forms submit and validate        │
│  □ Authentication flows complete    │
│  □ Environment variables accessible │
│  □ No console errors                │
│  □ Performance acceptable           │
└─────────────────────────────────────┘
```

---

### Phase 4: Deployment

```
npm run deploy
    │
    ├─► 1. Build (opennextjs-cloudflare build)
    │      │
    │      ├─► next build (Standard Next.js build)
    │      │
    │      └─► Transform for Workers
    │          (OpenNext adapter conversion)
    │
    └─► 2. Deploy (opennextjs-cloudflare deploy)
           │
           ├─► Upload to Cloudflare
           │
           ├─► Activate bindings
           │
           └─► Deploy to global network
```

**Output**:
```
✅ Deployment complete!
🌐 Deployed to: https://my-next-app.workers.dev
```

---

## Runtime Differences

### Development Server vs Production Runtime

| Aspect | `npm run dev` | `npm run preview` | Production |
|--------|---------------|-------------------|------------|
| **Runtime** | Node.js | workerd | workerd |
| **Speed** | ⚡ Very Fast | 🐌 Slower | ⚡ Fast |
| **Hot Reload** | ✅ Yes | ❌ No | N/A |
| **Bindings** | ❌ Mocked/None | ✅ Real | ✅ Real |
| **Errors** | Some masked | Production-accurate | Same as preview |
| **Use For** | Iteration | Integration testing | Live traffic |

---

## Configuration Flow

```
┌─────────────────┐
│ wrangler.jsonc  │
│                 │
│ • Worker name   │
│ • Compat date   │
│ • Compat flags  │
│ • Bindings      │
└────────┬────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
┌────────────────┐   ┌──────────────────┐
│ Build Process  │   │ Runtime Config   │
│                │   │                  │
│ • Package deps │   │ • D1 databases   │
│ • Bundle code  │   │ • R2 buckets     │
│ • Generate     │   │ • KV namespaces  │
│   Worker       │   │ • Workers AI     │
└────────────────┘   │ • Env vars       │
                     └──────────────────┘
```

---

## Error Detection Timeline

```
Development (dev)
    │
    ├─ Catches: Syntax errors, type errors, import errors
    │
    ▼
Preview (workerd)
    │
    ├─ Catches: Runtime errors, binding issues, worker size
    │
    ▼
Production
    │
    ├─ Catches: Real-world errors, scale issues
    │
    └─ Monitor via: wrangler tail, Cloudflare dashboard
```

**Best Practice**: Always run `npm run preview` before `npm run deploy`

---

## Binding Access Pattern

```
┌────────────────────────────────────────────┐
│  Route Handler (app/api/route.ts)         │
└────────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Access Environment   │
        │  const env = process  │
        │     .env as any       │
        └───────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
  ┌──────────┐          ┌──────────┐
  │ env.DB   │          │ env.AI   │
  │ (D1)     │          │ (Workers │
  │          │          │  AI)     │
  └──────────┘          └──────────┘
        │                       │
        ▼                       ▼
  ┌──────────┐          ┌──────────┐
  │ env.R2   │          │ env.KV   │
  │ (Storage)│          │ (Cache)  │
  └──────────┘          └──────────┘
```

---

## CI/CD Workflow

```
┌─────────────────┐
│  Git Push       │
│  (main branch)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CI Service     │
│  (GitHub, etc.) │
└────────┬────────┘
         │
         ├─► 1. Install deps
         │
         ├─► 2. Run tests
         │
         ├─► 3. npm run deploy
         │
         └─► 4. Notify success
                 │
                 ▼
         ┌──────────────┐
         │  Production  │
         │  Updated     │
         └──────────────┘
```

**Example GitHub Action**:
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
```

---

## Troubleshooting Flow

```
Error Occurs
    │
    ├─ In dev? → Check syntax, imports, types
    │
    ├─ In preview? → Check runtime compatibility
    │               Check bindings configured
    │               Check wrangler.jsonc settings
    │
    └─ In production? → Check logs (wrangler tail)
                        Check environment variables
                        Check binding IDs match
```

**Debug Tools**:
- `npm run preview` → Local production testing
- `wrangler tail` → Live production logs
- `./scripts/analyze-bundle.sh` → Bundle size analysis
- Browser DevTools → Client-side errors
- Cloudflare Dashboard → Metrics and logs

---

## Best Practices Summary

1. **Always use both dev modes**:
   - `npm run dev` for fast iteration
   - `npm run preview` before deploying

2. **Test in preview before every deploy**:
   - Catches Workers-specific issues
   - Verifies bindings work
   - Tests in production runtime

3. **Monitor after deployment**:
   - `wrangler tail` for live logs
   - Dashboard for metrics
   - Error tracking setup

4. **Keep dependencies updated**:
   - `@opennextjs/cloudflare@^1.3.0+`
   - `next@14.2.0+ || 15.x`
   - Regular security updates

5. **Version control critical files**:
   - `wrangler.jsonc`
   - `open-next.config.ts`
   - `package.json`
   - `.env.example` (not `.env` itself)

---

**Last Updated**: 2025-10-21
