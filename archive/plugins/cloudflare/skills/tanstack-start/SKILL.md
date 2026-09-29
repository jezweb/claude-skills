---
name: tanstack-start
description: "Build a full-stack TanStack Start app on Cloudflare Workers from scratch — SSR, file-based routing, server functions, D1+Drizzle, better-auth, Tailwind v4+shadcn/ui. Use whenever the user mentions TanStack Start, asks to scaffold a full-stack Cloudflare app with SSR, wants an SSR dashboard, or asks for a React 19 + Cloudflare Workers app with file-based routing and server functions — even if they don't name TanStack Start specifically. No template repo — Claude generates every file fresh per project."
compatibility: claude-code-only
---

# TanStack Start on Cloudflare

Build a complete full-stack app from nothing. Claude generates every file — no template clone, no scaffold command.

Stack: TanStack Start v1 (SSR, file-based routing, server functions via Nitro) on Cloudflare Workers; React 19 + Tailwind v4 + shadcn/ui; D1 + Drizzle; better-auth (Google OAuth + email/password).

## Project File Tree

```
PROJECT_NAME/
├── src/
│   ├── routes/
│   │   ├── __root.tsx              # Root layout (HTML shell, theme, CSS import)
│   │   ├── index.tsx               # Landing / auth redirect
│   │   ├── login.tsx               # Login page
│   │   ├── register.tsx            # Register page
│   │   ├── _authed.tsx             # Auth guard layout route
│   │   ├── _authed/
│   │   │   ├── dashboard.tsx       # Dashboard with stat cards
│   │   │   ├── items.tsx           # Items list table
│   │   │   ├── items.$id.tsx       # Edit item
│   │   │   └── items.new.tsx       # Create item
│   │   └── api/
│   │       └── auth/
│   │           └── $.ts            # better-auth API catch-all
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components (auto-installed)
│   │   ├── app-sidebar.tsx         # Navigation sidebar
│   │   ├── theme-toggle.tsx        # Light/dark/system toggle
│   │   ├── user-nav.tsx            # User dropdown menu
│   │   └── stat-card.tsx           # Dashboard stat card
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema (all tables)
│   │   └── index.ts                # Drizzle client factory
│   ├── lib/
│   │   ├── auth.server.ts          # better-auth server config
│   │   ├── auth.client.ts          # better-auth React hooks
│   │   └── utils.ts                # cn() helper for shadcn/ui
│   ├── server/
│   │   └── functions.ts            # Server functions (CRUD, auth checks)
│   ├── styles/
│   │   └── app.css                 # Tailwind v4 + shadcn/ui CSS variables
│   ├── router.tsx                  # TanStack Router configuration
│   ├── client.tsx                  # Client entry (hydrateRoot)
│   ├── ssr.tsx                     # SSR entry
│   └── routeTree.gen.ts            # Auto-generated route tree (do not edit)
├── drizzle/                        # Generated migrations
├── public/                         # Static assets (favicon, etc.)
├── vite.config.ts
├── wrangler.jsonc
├── drizzle.config.ts
├── tsconfig.json
├── package.json
├── .dev.vars                       # Local env vars (NOT committed)
└── .gitignore
```

## Dependencies

**Runtime:**
```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "@tanstack/react-router": "^1.120.0",
  "@tanstack/react-start": "^1.120.0",
  "drizzle-orm": "^0.38.0",
  "better-auth": "^1.2.0",
  "zod": "^3.24.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^3.0.0",
  "lucide-react": "^0.480.0"
}
```

**Dev:**
```json
{
  "@cloudflare/vite-plugin": "^1.0.0",
  "@tailwindcss/vite": "^4.0.0",
  "@vitejs/plugin-react": "^4.4.0",
  "tailwindcss": "^4.0.0",
  "typescript": "^5.7.0",
  "drizzle-kit": "^0.30.0",
  "wrangler": "^4.0.0",
  "tw-animate-css": "^1.2.0"
}
```

**Scripts:**
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "deploy": "wrangler deploy",
  "db:generate": "drizzle-kit generate",
  "db:migrate:local": "wrangler d1 migrations apply PROJECT_NAME-db --local",
  "db:migrate:remote": "wrangler d1 migrations apply PROJECT_NAME-db --remote"
}
```

## Workflow

### Step 1: Gather Project Info

| Required | Optional |
|----------|----------|
| Project name (kebab-case) | Google OAuth credentials |
| One-line description | Custom domain |
| Cloudflare account | R2 storage needed? |
| Auth method: Google OAuth, email/password, or both | Admin email |

### Step 2: Initialise Project

Create the project directory and all config files from scratch.

**`vite.config.ts`** — Plugin order matters. Cloudflare MUST be first:

```typescript
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});
```

**`wrangler.jsonc`**:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "PROJECT_NAME",
  "compatibility_date": "2025-04-01",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry",
  "account_id": "ACCOUNT_ID",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "PROJECT_NAME-db",
      "database_id": "DATABASE_ID",
      "migrations_dir": "drizzle"
    }
  ]
}
```

Key points: `main` MUST be `"@tanstack/react-start/server-entry"` (Nitro server entry). Use `nodejs_compat` (NOT `node_compat`). Add `account_id` to avoid interactive prompts.

**`tsconfig.json`**:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "paths": { "@/*": ["./src/*"] },
    "types": ["@cloudflare/workers-types/2023-07-01"]
  },
  "include": ["src/**/*", "vite.config.ts"]
}
```

**`.dev.vars`** — generate `BETTER_AUTH_SECRET` with `openssl rand -hex 32`:

```
BETTER_AUTH_SECRET=<generated-hex-32>
BETTER_AUTH_URL=http://localhost:3000
TRUSTED_ORIGINS=http://localhost:3000
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
```

**`.gitignore`** — node_modules, .wrangler, dist, .output, .dev.vars, .vinxi, .DS_Store

Then install and create the D1 database:

```bash
cd PROJECT_NAME && pnpm install
npx wrangler d1 create PROJECT_NAME-db
# Copy the database_id into wrangler.jsonc d1_databases binding
```

### Step 3: Database Schema

**`src/db/schema.ts`** — All tables. better-auth requires: `users`, `sessions`, `accounts`, `verifications`. Add application tables (e.g. `items`) for CRUD demo.

D1-specific rules:
- Use `integer` for timestamps (Unix epoch), NOT Date objects
- Use `text` for primary keys (nanoid/cuid2), NOT autoincrement
- Keep bound parameters under 100 per query (batch large inserts)
- Foreign keys are always ON in D1

**`src/db/index.ts`** — Drizzle client factory:

```typescript
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import * as schema from "./schema";

export function getDb() {
  return drizzle(env.DB, { schema });
}
```

**CRITICAL**: Use `import { env } from "cloudflare:workers"` — NOT `process.env`. Create the Drizzle client inside each server function (per-request), not at module level.

**`drizzle.config.ts`**:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
});
```

Generate and apply the initial migration:

```bash
pnpm db:generate
pnpm db:migrate:local
```

### Step 4: Configure Auth

**`src/lib/auth.server.ts`** — Server-side better-auth:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import * as schema from "../db/schema";

export function getAuth() {
  const db = drizzle(env.DB, { schema });
  return betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite" }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: env.TRUSTED_ORIGINS?.split(",") ?? [],
    emailAndPassword: { enabled: true },
    socialProviders: {
      // Add Google OAuth if credentials provided
    },
  });
}
```

**CRITICAL**: `getAuth()` must be called per-request (inside handler/loader), NOT at module level.

**`src/lib/auth.client.ts`** — Client-side auth hooks:

```typescript
import { createAuthClient } from "better-auth/react";

export const { useSession, signIn, signOut, signUp } = createAuthClient();
```

**`src/routes/api/auth/$.ts`** — API catch-all for better-auth:

```typescript
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getAuth } from "../../../lib/auth.server";

export const APIRoute = createAPIFileRoute("/api/auth/$")({
  GET: ({ request }) => getAuth().handler(request),
  POST: ({ request }) => getAuth().handler(request),
});
```

**CRITICAL**: Auth MUST use an API route (`createAPIFileRoute`), NOT a server function (`createServerFn`). better-auth needs direct request/response access.

### Step 5: Server Functions

**Core pattern** — always create DB client inside the handler:

```typescript
import { createServerFn } from "@tanstack/react-start";
import { getDb } from "../db";

export const getItems = createServerFn({ method: "GET" }).handler(async () => {
  const db = getDb();
  return db.select().from(items).all();
});
```

**Input validation** with Zod:

```typescript
export const createItem = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const db = getDb();
    const id = crypto.randomUUID();
    await db.insert(items).values({ id, ...data, createdAt: Date.now() });
    return { id };
  });
```

**Protected server functions** — check auth, throw redirect if unauthenticated:

```typescript
import { redirect } from "@tanstack/react-router";
import { getAuth } from "../lib/auth.server";

async function requireSession(request?: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({
    headers: request?.headers ?? new Headers(),
  });
  if (!session) {
    throw redirect({ to: "/login" });
  }
  return session;
}

export const getSessionFn = createServerFn({ method: "GET" }).handler(
  async ({ request }) => {
    const auth = getAuth();
    return auth.api.getSession({ headers: request.headers });
  }
);

export const getItems = createServerFn({ method: "GET" }).handler(
  async ({ request }) => {
    const session = await requireSession(request);
    const db = getDb();
    return db.select().from(items).where(eq(items.userId, session.user.id)).all();
  }
);
```

**Route loader pattern** — server functions in route `loader`:

```typescript
export const Route = createFileRoute("/_authed/items")({
  loader: () => getItems(),
  component: ItemsPage,
});

function ItemsPage() {
  const items = Route.useLoaderData();
  return <div>{items.map((item) => <div key={item.id}>{item.name}</div>)}</div>;
}
```

**Auth guard** (`_authed.tsx`) — use `beforeLoad`:

```typescript
export const Route = createFileRoute("/_authed")({
  beforeLoad: async () => {
    const session = await getSessionFn();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    return { session };
  },
});
```

Child routes access session via `Route.useRouteContext()`.

**Mutation + invalidation** — after mutations, invalidate router to refetch loaders:

```typescript
function CreateItemForm() {
  const router = useRouter();
  const handleSubmit = async (data: NewItem) => {
    await createItem({ data });
    router.invalidate();
    router.navigate({ to: "/items" });
  };
  return <form onSubmit={...}>...</form>;
}
```

**Type safety** — use Drizzle's `InferSelectModel` / `InferInsertModel` for server function input/output types. For auth failures, always use `throw redirect()` — not error responses.

### Step 6: App Shell + Theme

**`src/routes/__root.tsx`** — Full HTML document with `<HeadContent />` + `<Scripts />` from `@tanstack/react-router`, `suppressHydrationWarning` on `<html>` (SSR + theme), inline theme init script to prevent flash, global CSS import.

**`src/styles/app.css`** — `@import "tailwindcss"` (v4 syntax) + shadcn/ui CSS variables in `:root` and `.dark`. Semantic tokens only.

**`src/router.tsx`**:

```typescript
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function createRouter() {
  return createTanStackRouter({ routeTree });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
```

**`src/client.tsx`** + **`src/ssr.tsx`** — standard TanStack Start entry boilerplate.

Install shadcn/ui:

```bash
pnpm dlx shadcn@latest init --defaults
pnpm dlx shadcn@latest add button card input label sidebar table dropdown-menu form separator sheet
```

**Theme toggle** — three-state (light → dark → system → light), localStorage-persisted, `.dark` class on `<html>`. **JS-only** system preference detection; NO CSS `@media (prefers-color-scheme)` queries.

**Components** in `src/components/`: `app-sidebar.tsx`, `theme-toggle.tsx`, `user-nav.tsx`, `stat-card.tsx`.

### Step 7: CRUD Server Functions

| Function | Method | Purpose |
|----------|--------|---------|
| `getItems` | GET | List all items for current user |
| `getItem` | GET | Get single item by ID |
| `createItem` | POST | Create new item |
| `updateItem` | POST | Update existing item |
| `deleteItem` | POST | Delete item by ID |

Each server function: (1) gets auth session, (2) creates per-request Drizzle client via `getDb()`, (3) performs DB operation, (4) returns typed data. Route loaders call GET functions. Mutations call POST functions then `router.invalidate()`.

### Step 8: Verify Locally

```bash
pnpm dev
```

- [ ] App loads at http://localhost:3000
- [ ] Register a new account (email/password)
- [ ] Login and logout work
- [ ] Dashboard loads with stat cards
- [ ] Create, list, edit, delete items
- [ ] Theme toggle cycles: light -> dark -> system
- [ ] Sidebar collapses on mobile
- [ ] No console errors

### Step 9: Deploy to Production

**Pre-deploy checklist** — verify before running deploy:
- [ ] `wrangler.jsonc` has correct `account_id`; `main` is `"@tanstack/react-start/server-entry"`; `nodejs_compat` in `compatibility_flags`
- [ ] D1 database created and `database_id` set
- [ ] `.dev.vars` is gitignored; no hardcoded secrets in source

**Set production secrets:**

```bash
openssl rand -hex 32 | npx wrangler secret put BETTER_AUTH_SECRET
echo "https://PROJECT.SUBDOMAIN.workers.dev" | npx wrangler secret put BETTER_AUTH_URL
echo "http://localhost:3000,https://PROJECT.SUBDOMAIN.workers.dev" | npx wrangler secret put TRUSTED_ORIGINS

# Google OAuth (optional)
echo "your-client-id" | npx wrangler secret put GOOGLE_CLIENT_ID
echo "your-client-secret" | npx wrangler secret put GOOGLE_CLIENT_SECRET
```

If using Google OAuth, add the production redirect URI in Google Cloud Console: `https://PROJECT.SUBDOMAIN.workers.dev/api/auth/callback/google`.

**Migrate and deploy:**

```bash
pnpm db:migrate:remote
pnpm build && npx wrangler deploy
```

After first deploy, update `BETTER_AUTH_URL` to the actual Worker URL and redeploy.

**Verify:** app loads at production URL, auth works, CRUD works, theme persists.

**Custom domain** (optional): Cloudflare Dashboard → Workers → Triggers → Custom Domains. Update `BETTER_AUTH_URL` + `TRUSTED_ORIGINS` secrets + Google OAuth redirect URI to the new domain. Redeploy.

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `env` is undefined | Accessed at module level | Use `import { env } from "cloudflare:workers"` inside request handler only |
| D1 database not found | Binding mismatch | Check `d1_databases` binding name in wrangler.jsonc matches code |
| Auth redirect loop | URL mismatch | `BETTER_AUTH_URL` must match actual URL exactly (protocol + domain, no trailing slash) |
| Auth silently fails | Missing origins | Set `TRUSTED_ORIGINS` secret with all valid URLs (comma-separated) |
| Styles not loading | Missing plugin | Ensure `@tailwindcss/vite` plugin is in vite.config.ts |
| SSR hydration mismatch | Theme flash | Add `suppressHydrationWarning` to `<html>` element |
| Build fails on Cloudflare | Bad config | Check `nodejs_compat` flag and `main` field in wrangler.jsonc |
| Secrets not taking effect | No redeploy | `wrangler secret put` does NOT redeploy — run `npx wrangler deploy` after |
| Auth endpoints return 404 | Wrong route type | Use `createAPIFileRoute` (API route), not `createServerFn` for better-auth |
| "redirect_uri_mismatch" | Missing URI | Add production URL to Google Cloud Console OAuth redirect URIs |
| Cryptic Vite errors | Plugin order | Must be: `cloudflare()` -> `tailwindcss()` -> `tanstackStart()` -> `viteReact()` |
| "Table not found" 500s | Missing migration | Run `pnpm db:migrate:remote` before deploying |
