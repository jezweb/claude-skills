---
name: vite-flare-starter
description: "Scaffold a full-stack Cloudflare app from vite-flare-starter — React 19, Hono, D1+Drizzle, better-auth, Tailwind v4+shadcn/ui, TanStack Query, R2, Workers AI. Run setup.sh to clone, configure, and deploy."
compatibility: Designed for Claude Code (or similar products)
---

# Vite Flare Starter

Clone and configure the batteries-included Cloudflare starter into a standalone project. Produces a fully rebranded, deployable full-stack app.

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React, Vite, Tailwind CSS, shadcn/ui | 19, 6.x, v4, latest |
| Backend | Hono (on Cloudflare Workers) | 4.x |
| Database | D1 (SQLite at edge) + Drizzle ORM | 0.38+ |
| Auth | better-auth (Google OAuth + email/password) | latest |
| Storage | R2 (S3-compatible object storage) | — |
| AI | Workers AI binding | — |
| Data Fetching | TanStack Query | v5 |

### Cloudflare Bindings

| Binding | Type | Purpose |
|---------|------|---------|
| `DB` | D1 Database | Primary application database |
| `AVATARS` | R2 Bucket | User avatar storage |
| `FILES` | R2 Bucket | General file uploads |
| `AI` | Workers AI | AI model inference |

### Project Structure

```
src/
├── client/                 # React frontend
│   ├── components/         # UI components
│   ├── hooks/              # Custom hooks + TanStack Query
│   ├── pages/              # Route pages
│   ├── lib/                # Utilities (auth client, etc.)
│   └── main.tsx            # App entry point
├── server/                 # Hono backend
│   ├── index.ts            # Worker entry point
│   ├── routes/             # API routes
│   ├── middleware/          # Auth, CORS, etc.
│   └── db/                 # Drizzle schema + queries
└── shared/                 # Shared types between client/server
```

### Key Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start local dev server |
| `pnpm build` | Production build |
| `pnpm deploy` | Deploy to Cloudflare |
| `pnpm db:migrate:local` | Apply migrations locally |
| `pnpm db:migrate:remote` | Apply migrations to production |
| `pnpm db:generate` | Generate migration from schema changes |

## Workflow

### Step 1: Gather Project Info

Ask for:

| Required | Optional |
|----------|----------|
| Project name (kebab-case) | Admin email |
| Description (1 sentence) | Google OAuth credentials |
| Cloudflare account | Custom domain |

### Step 2: Clone and Configure

#### 2a. Clone and clean

```bash
git clone https://github.com/jezweb/vite-flare-starter.git PROJECT_DIR --depth 1
cd PROJECT_DIR
rm -rf .git
git init
```

#### 2b. Find-replace targets

Replace `vite-flare-starter` with the project name in these locations:

| File | Target | Replace with |
|------|--------|-------------|
| `wrangler.jsonc` | `"vite-flare-starter"` (worker name) | `"PROJECT_NAME"` |
| `wrangler.jsonc` | `vite-flare-starter-db` | `PROJECT_NAME-db` |
| `wrangler.jsonc` | `vite-flare-starter-avatars` | `PROJECT_NAME-avatars` |
| `wrangler.jsonc` | `vite-flare-starter-files` | `PROJECT_NAME-files` |
| `package.json` | `"name": "vite-flare-starter"` | `"name": "PROJECT_NAME"` |
| `package.json` | `vite-flare-starter-db` | `PROJECT_NAME-db` |
| `index.html` | `<title>` content | App display name (Title Case) |

Also in `wrangler.jsonc`:
- **Remove** hardcoded `account_id` line (let wrangler prompt or use env var)
- **Replace** `database_id` value with `REPLACE_WITH_YOUR_DATABASE_ID`

Reset `package.json` version to `"0.1.0"`.

Use the Edit tool for replacements (preferred over sed to avoid macOS/GNU differences).

#### 2c. Generate auth secret

```bash
BETTER_AUTH_SECRET=$(openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))")
```

#### 2d. Create .dev.vars

Convert kebab-case project name: `my-cool-app` becomes Display `My Cool App`, ID `my_cool_app`.

```
# Local Development Environment Variables
# DO NOT COMMIT THIS FILE TO GIT

# Authentication (better-auth)
BETTER_AUTH_SECRET=<generated>
BETTER_AUTH_URL=http://localhost:5173

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email Auth Control (disabled by default)
# ENABLE_EMAIL_LOGIN=true
# ENABLE_EMAIL_SIGNUP=true

# Application Configuration
APP_NAME=<Display Name>
VITE_APP_NAME=<Display Name>
VITE_APP_ID=<app_id>
VITE_TOKEN_PREFIX=<app_id>_
VITE_GITHUB_URL=
VITE_FOOTER_TEXT=

NODE_ENV=development
```

#### 2e. Create Cloudflare resources (optional)

```bash
npx wrangler d1 create PROJECT_NAME-db
# Extract database_id from output, update wrangler.jsonc

npx wrangler r2 bucket create PROJECT_NAME-avatars
npx wrangler r2 bucket create PROJECT_NAME-files
```

#### 2f. Install and migrate

```bash
pnpm install
pnpm run db:migrate:local
```

#### 2g. Initial commit

```bash
git add -A
git commit -m "Initial commit from vite-flare-starter"
```

### Step 3: Manual Configuration

1. **Google OAuth** (if using): Go to Google Cloud Console, create OAuth 2.0 Client ID, add redirect URI `http://localhost:5173/api/auth/callback/google`, copy Client ID and Secret to `.dev.vars`
2. **Favicon**: Replace `public/favicon.svg`
3. **CLAUDE.md**: Update project description, remove vite-flare-starter references
4. **index.html**: Update `<title>` and meta description

### Step 4: Verify Locally

```bash
pnpm dev
```

Check: http://localhost:5173 loads, shows YOUR app name, sign-up/sign-in works (if OAuth configured).

### Step 5: Deploy to Production

```bash
# Set production secrets
openssl rand -base64 32 | npx wrangler secret put BETTER_AUTH_SECRET
echo "https://PROJECT_NAME.SUBDOMAIN.workers.dev" | npx wrangler secret put BETTER_AUTH_URL
echo "http://localhost:5173,https://PROJECT_NAME.SUBDOMAIN.workers.dev" | npx wrangler secret put TRUSTED_ORIGINS

# If using Google OAuth
echo "your-client-id" | npx wrangler secret put GOOGLE_CLIENT_ID
echo "your-client-secret" | npx wrangler secret put GOOGLE_CLIENT_SECRET

# Migrate remote database
pnpm run db:migrate:remote

# Build and deploy
pnpm run build && pnpm run deploy
```

**Critical**: After first deploy, update BETTER_AUTH_URL with your actual Worker URL. Add the production URL to Google OAuth redirect URIs.

## Security Fingerprints

Change all of these so attackers cannot identify your site uses this starter:

| Location | Default Value | How to Change |
|----------|---------------|---------------|
| Page title | "Vite Flare Starter" | `index.html` |
| App name in UI | "Vite Flare Starter" | `VITE_APP_NAME` env var |
| localStorage keys | `vite-flare-starter-theme` | `VITE_APP_ID` env var |
| API tokens | `vfs_` prefix | `VITE_TOKEN_PREFIX` env var |
| GitHub links | starter repo | `VITE_GITHUB_URL` (set empty to hide) |
| Worker name | `vite-flare-starter` | `wrangler.jsonc` |
| Database name | `vite-flare-starter-db` | `wrangler.jsonc` |
| R2 buckets | `vite-flare-starter-*` | `wrangler.jsonc` |

## Environment Variables

### Branding (VITE_ prefix = available in frontend)

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_APP_NAME` | Display name in UI | "My Cool App" |
| `VITE_APP_ID` | localStorage prefix, Sentry | "mycoolapp" |
| `VITE_TOKEN_PREFIX` | API token prefix | "mca_" |
| `VITE_GITHUB_URL` | GitHub link (empty = hidden) | "" |
| `VITE_FOOTER_TEXT` | Footer copyright text | "2026 My Company" |
| `APP_NAME` | Server-side app name | "My Cool App" |

### Auth

| Variable | Purpose | Notes |
|----------|---------|-------|
| `BETTER_AUTH_SECRET` | Session encryption | `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | Auth base URL | Must match actual URL exactly |
| `TRUSTED_ORIGINS` | Allowed origins | Comma-separated, include localhost + prod |
| `GOOGLE_CLIENT_ID` | Google OAuth | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | From Google Cloud Console |
| `ENABLE_EMAIL_LOGIN` | Enable email/password | "true" to enable |
| `ENABLE_EMAIL_SIGNUP` | Enable email signup | Requires ENABLE_EMAIL_LOGIN |

### Email (Optional)

| Variable | Purpose | Notes |
|----------|---------|-------|
| `EMAIL_FROM` | Sender address | For verification/password reset |
| `EMAIL_API_KEY` | Email service API key | Resend recommended |

## Common Customisations

### Adding a New Database Table
1. Add schema in `src/server/db/schema.ts`
2. Generate migration: `pnpm db:generate`
3. Apply locally: `pnpm db:migrate:local`
4. Apply to production: `pnpm db:migrate:remote`

### Adding a New API Route
1. Create route file in `src/server/routes/`
2. Register in `src/server/index.ts`
3. Add TanStack Query hook in `src/client/hooks/`

### Changing Auth Providers
Edit `src/server/auth.ts`: add provider to `socialProviders`, add credentials to `.dev.vars` and production secrets, update client-side login buttons.

### Feature Flags
Control features via environment variables: `VITE_FEATURE_STYLE_GUIDE=true`, `VITE_FEATURE_COMPONENTS=true`. Add your own in `src/client/lib/features.ts`.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Auth redirects to homepage silently | Missing TRUSTED_ORIGINS | Set TRUSTED_ORIGINS with all valid URLs |
| "Not authorized" on deploy | Wrong account_id | Remove account_id from wrangler.jsonc or set yours |
| Database 500 errors | Missing migrations | Run `pnpm db:migrate:local` and `pnpm db:migrate:remote` |
| localStorage shows "vite-flare-starter" | Missing VITE_APP_ID | Set `VITE_APP_ID=yourapp` in .dev.vars |
| Auth fails in production only | BETTER_AUTH_URL mismatch | Must match actual Worker URL exactly (https, no trailing slash) |
| "redirect_uri_mismatch" on Google sign-in | OAuth redirect URI missing | Add production URL to Google Cloud Console OAuth redirect URIs |
| Secret changes have no effect | Not redeployed | `wrangler secret put` does NOT redeploy. Run `pnpm deploy` after |

## Production Deployment Checklist

- [ ] `BETTER_AUTH_SECRET` set (different from dev!)
- [ ] `BETTER_AUTH_URL` matches actual Worker URL
- [ ] `TRUSTED_ORIGINS` includes all valid URLs
- [ ] Google OAuth redirect URI includes production URL
- [ ] Remote database migrated (`pnpm db:migrate:remote`)
- [ ] No `vite-flare-starter` references in config files
- [ ] Favicon replaced
- [ ] CLAUDE.md updated
- [ ] `.dev.vars` is NOT committed (check `.gitignore`)
