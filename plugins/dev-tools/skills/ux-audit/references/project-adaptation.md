# Project Adaptation

The audit skill ships with examples drawn from a specific stack (Cloudflare Workers + React 19 + Vite + TanStack Query + better-auth + Radix UI + Jezweb's `.jez/` convention). Those examples are illustrative — the discipline is the same across stacks.

This file is the adaptation guide for non-default stacks.

## Path conventions — fallback chain

The skill defaults to `.jez/` (Jezweb's convention) but uses a fallback chain. The audit reads existing directories first; falls back to creating one only if nothing matches.

| Convention | Path | Used by |
|------------|------|---------|
| Jezweb | `.jez/audit-evidence/<date>/` | jezweb.com.au internal projects |
| Common docs | `docs/audits/<date>/` | many open-source projects |
| Project-root | `audits/<date>/` | minimal projects |
| Hidden-folder | `.audit/<date>/` | conventional fallback if nothing else exists |

Same fallback applies to:

- **Personas**: `.jez/audit-personas/` → `docs/personas/` → `personas/` → `.audit/personas/`
- **Audit config (allowlist)**: `.jez/audit-config.yml` → `audit-config.yml` → `.audit/config.yml`
- **Audit reports**: `.jez/artifacts/ux-audit-YYYY-MM-DD.md` → `docs/audits/ux-audit-YYYY-MM-DD.md` → `audits/<date>.md`

The audit reads project conventions before defaulting. If the project's CLAUDE.md says *"audit reports go in `quality-reports/`"*, use that.

## URL discovery by stack

Phase 1 step 3 (URL discovery) needs adaptation per stack. The skill default checks `wrangler.jsonc`, falls back to `lsof -i :5173 -i :3000 -i :8787`. Stacks below have different conventions:

| Stack | Where to look | Common ports |
|-------|---------------|--------------|
| **Cloudflare Workers** | `wrangler.jsonc` `pattern` / `custom_domain` | 8787, 5173 (Vite dev) |
| **Vite (any framework)** | `vite.config.ts` `server.port` | 5173 default |
| **Next.js** | `package.json` scripts; `.env.local` `NEXT_PUBLIC_*` | 3000 default |
| **Remix** | `vite.config.ts` or `remix.config.js` | 3000 default |
| **Rails** | `config/database.yml`, `bin/rails server` | 3000 default |
| **Django** | `manage.py runserver`, `settings.py` `ALLOWED_HOSTS` | 8000 default |
| **Laravel** | `.env` `APP_URL`, `php artisan serve` | 8000 default |
| **PHP (Apache/Nginx)** | virtualhost config; check `localhost` or `*.test` | 80, 443, 8080 |
| **WordPress** | `wp-config.php` `WP_HOME` / `WP_SITEURL`; Local-by-Flywheel sites at `*.local` | 80, 443, custom |
| **Symfony** | `bin/console server:start` | 8000 default |
| **Static / Astro / Hugo** | `astro.config.mjs` / `hugo.toml`; deployment preview URL | 4321 (Astro), 1313 (Hugo) |

**Discovery order regardless of stack**:

1. Check the project's CLAUDE.md / README for "URL" or "dev server"
2. Check stack-specific config file (per table above)
3. Run `lsof -i :PORT_RANGE` or `ss -tlnp | grep LISTEN` for matching dev ports
4. Ask the user

Always prefer the deployed URL over local dev — local misses CDN, CORS, latency, real auth.

## Test-auth alternatives (headless authentication)

The skill's headless test-auth pattern is **better-auth-specific** (`/api/test-auth/cookies` endpoint with X-Test-Auth secret). Other auth stacks need different approaches:

### better-auth (default in skill)
```bash
curl -sX POST "$URL/api/test-auth/cookies" \
  -H "X-Test-Auth: $TEST_AUTH_TOKEN" \
  -d '{"email":"alice@test.app.local"}' > cookies.json
```

### NextAuth / Auth.js
Two patterns:
1. **Test-only credentials provider** — register a `Credentials` provider gated on `NODE_ENV !== 'production'` that accepts a test token, returns a session for any email
2. **Direct session injection** — write a session row to the DB with a known token, set the `next-auth.session-token` cookie in Playwright

```ts
// Playwright before-each: bypass the auth flow
await page.context().addCookies([{
  name: 'next-auth.session-token',
  value: process.env.TEST_SESSION_TOKEN,
  domain: 'localhost',
  path: '/',
}]);
```

### Lucia
Use `lucia.createSession(userId, attributes)` server-side, write the session cookie manually. Wrap in a test-only `/api/test-auth` route gated on env.

### Rails Devise
Use Devise's `sign_in` helper in a test-only controller action:
```ruby
# Only mounted in test/dev
class TestAuthController < ApplicationController
  def sign_in_as
    user = User.find_or_create_by!(email: params[:email])
    sign_in user
    head :ok
  end
end
```

### Django auth
Test view using `force_login`:
```python
# urls.py — only mounted when DEBUG = True
def test_login(request):
    user, _ = User.objects.get_or_create(email=request.GET['email'])
    login(request, user)
    return HttpResponse(status=200)
```

### Custom JWT / API tokens
Mint a test JWT with a known secret, set in `Authorization` header for Playwright:
```ts
await page.setExtraHTTPHeaders({ Authorization: `Bearer ${process.env.TEST_JWT}` });
```

### Magic-link bypass
For magic-link auth (Clerk, Resend Auth, Supabase Auth): expose a test-only endpoint that mints a magic-link token and returns it, skipping email delivery.

### WordPress
Use WP-CLI or `wp_set_current_user()` / `wp_set_auth_cookie()` in a test mu-plugin gated on a constant. Or use a session-stealing test plugin.

**Pattern across all stacks**: gate test-auth on a server-side environment variable (`TEST_AUTH_ENABLED=true` only in dev/staging), use a token / shared secret to authorise, lock to email patterns like `*@test.<app>.local` to prevent real-user takeover.

## Seed-script architectures by ORM

The data-seasoning scenario assumes the project provides Day 0 / 1 / 7 / 30 seed scripts. The skill's example uses Drizzle/D1; here's the pattern across ORMs:

### Drizzle (Cloudflare D1, PostgreSQL, MySQL, SQLite)
```
scripts/seed/horizons/day-7.ts
import { db } from '../../../src/db';
import { faker } from '@faker-js/faker';
import { inboxItems, conversations } from '../../../src/db/schema';

await db.insert(inboxItems).values(
  Array.from({ length: 75 }, () => ({...})),
);
```

### Prisma
```
prisma/seeds/horizons/day-7.ts
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();
await prisma.inboxItem.createMany({ data: [...] });
```

### TypeORM / MikroORM
Equivalent: use the entity manager / repository, batch insert.

### Sequelize
```
scripts/seed/day-7.js
const { Inbox } = require('../../models');
await Inbox.bulkCreate(items);
```

### Rails ActiveRecord
```
db/seeds/horizons/day_7.rb
require 'faker'
75.times { Inbox.create!(...) }
```

CLI: `bundle exec rails runner db/seeds/horizons/day_7.rb`

### Django ORM
```
audit/management/commands/seed_horizon.py
from django.core.management.base import BaseCommand
from inbox.models import Item

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('horizon', choices=['day-0', 'day-1', 'day-7', 'day-30'])
    def handle(self, *args, **opts):
        # ...
```

CLI: `python manage.py seed_horizon day-7`

### Laravel Eloquent
```
database/seeders/HorizonsSeeder.php
class HorizonsSeeder extends Seeder { /* ... */ }
```

CLI: `php artisan db:seed --class=HorizonsSeeder`

### WordPress
Custom WP-CLI command:
```
wp eval-file scripts/seed-horizon.php day-7
```

### Raw SQL
For projects without an ORM: SQL files at `scripts/seed/horizons/day-7.sql`, run via `psql -f` / `sqlite3 < file` / `wrangler d1 execute --file=`.

**Pattern**: each horizon = one script that resets state and seeds horizon-appropriate data with realistic time distribution. Use a faker-equivalent for realistic content. CLI per horizon: `<runner> seed:day-N`.

## Build verify by stack

Phase 1 capability tests + Phase 7 fix-and-verify both need stack-aware build commands:

| Stack | Type-check | Build | Run tests |
|-------|------------|-------|-----------|
| Node + TS | `tsc --noEmit` or `pnpm typecheck` | `pnpm build` | `pnpm test` / `pnpm vitest` |
| Next.js | included in `next build` | `next build` | `next test` / `vitest` |
| Cloudflare Workers | `tsc --noEmit` + Vite build | `wrangler deploy --dry-run` | `vitest` |
| Rails | n/a (Ruby) | `bundle exec rails assets:precompile` | `bundle exec rspec` / `rails test` |
| Django | `python manage.py check` | `collectstatic` | `pytest` / `python manage.py test` |
| Laravel | n/a (PHP) | `php artisan optimize` | `php artisan test` |
| WordPress | n/a | n/a | optional plugin test suite |
| Static (Astro/Hugo) | `astro check` / n/a | `astro build` / `hugo --minify` | optional |
| Mobile (React Native) | `tsc --noEmit` | `expo build` / native build | `jest` |

Detect by reading project files: `package.json` scripts, `Gemfile`, `requirements.txt`, `composer.json`, `manage.py`, `Cargo.toml`, `go.mod`, etc.

## SDK contract examples by ecosystem

The `live-interaction-smoke.md` SDK contract table is heavily React + TanStack + Radix biased. Equivalents in other ecosystems:

### Vue 3
- **Pinia stores** with `$reset()` not called in cleanup → state leaks between tests
- **vue-router** `beforeEach` guards must `next()` or navigation hangs
- **VueQuery** — same `queryKey` stale-results pattern as TanStack Query (it's a port)
- **Headless UI** — same Dialog focus-trap requirements as Radix

### Svelte / SvelteKit
- **Stores** without `derived` for computed state → re-render storms
- **Actions** that don't return `{ destroy }` → leaks
- **`+page.server.ts`** without proper `redirect()` semantics

### Angular
- **RxJS subscriptions** without `takeUntil(destroy$)` → memory leaks
- **Angular Material `<mat-dialog>`** — focus-trap vs Esc-key handling
- **Forms reactive vs template-driven mix** — silent validation loss

### Native browser / vanilla JS
- **Form validation** without `novalidate` → browser default messages override custom
- **`<dialog>` element** without `showModal()` — backdrop missing

### WordPress / PHP
- **Nonce checks** missing on AJAX endpoints → CSRF + silent failure
- **`wp_die()` vs `wp_send_json_error()`** — wrong error response shape breaks JS handlers
- **Block editor (Gutenberg)** — `useBlockProps()` not spread → missing styling

### iOS / SwiftUI (mobile)
- **`@Published` not on main actor** → UI updates from background thread
- **Sheets without `.presentationDetents`** → broken sizing on iOS 16+
- **List with `.id()`** missing — animations break

The general principle: any ecosystem has a class of "undocumented option that silently breaks behaviour if missing". The audit catches them by clicking + watching network + watching DOM. The catalogue in `live-interaction-smoke.md` is the React/TanStack flavour — read your stack's docs for the same shape.

## Reference apps by category

For visual-polish calibration, the skill defaults to Linear / Stripe / Vercel / Notion (B2B SaaS / dev-tooling). Different app categories want different references:

| Category | Reference apps |
|----------|---------------|
| **B2B SaaS / dev tools** | Linear, Stripe, Vercel Dashboard, Notion, Cron, Raycast |
| **B2C consumer** | Airbnb, Notion (consumer plan), Things 3, Dropbox |
| **E-commerce** | Stripe Checkout, Shopify storefront examples, Apple Store, Amazon |
| **CMS / content** | Ghost editor, Sanity Studio, Contentful, Webflow |
| **Mobile-first** | Cron mobile, Notion Calendar, Linear mobile, Things 3 |
| **Marketing / landing** | Stripe.com, Linear.app, Vercel.com, Apple product pages |
| **Editor / creative** | Figma, Canva, Linear's editor, Notion |
| **Email / messaging** | Superhuman, Hey, claude.ai, ChatGPT |
| **Internal admin / dashboard** | Stripe Dashboard, Vercel Dashboard, Cloudflare Dashboard, AWS Console (as anti-example) |
| **Public sector / accessibility-first** | gov.uk, healthcare.gov (post-redesign) |
| **News / publishing** | NYT, Stratechery, FT.com |
| **WordPress sites** | a polished agency reference site, the project's reference site, a competitor |

Pick 3 references per audit *from the right category*. Cross-category references confuse the calibration ("Linear is good and we're not Linear" is true but unhelpful for an e-commerce checkout).

## Persona library by app type

The default personas in `persona-lock.md` (SME owner, power user, first-time developer) are biased to B2B SaaS. Different app types want different personas:

### Consumer apps
- Curious newcomer (came via marketing, no commitment)
- Returning casual (uses 2-3 features)
- Devoted power user (knows every shortcut)

### E-commerce
- Browsing visitor (no intent to buy)
- Comparison shopper (multiple tabs open)
- Repeat buyer (knows the product)
- Gift purchaser (buying for someone else)

### CMS / publishing
- Writer (focuses on content)
- Editor (focuses on flow + queue)
- Designer (focuses on layout)
- Reader (the published audience)

### Internal admin tools
- Operator (does the daily work)
- Manager (reviews + approves)
- Auditor (compliance / external review)
- New hire (onboarding into the tool)

### Mobile-first
- One-thumb commuter
- At-the-desk multitasker
- Quick check between meetings

### WordPress / agency
- Site owner (non-technical, manages content)
- Content editor (writes posts, uploads media)
- Developer (PHP/theme work)
- Visitor (the published site's audience)

Each persona file follows the same format as `persona-lock.md` — Goals / Constraints / Pain triggers / Wins / How to audit AS them.

## When the project is brand-new (no prior conventions)

If the project has none of the above conventions established (no audit folder, no personas, no test-auth, no seed scripts), the audit's first run is partly *bootstrapping*:

1. **Pick a fallback path** for audit artefacts (`.audit/<date>/` is the safest hidden default)
2. **Ask + write a persona file** — capture in `.audit/personas/<slug>.md` for next time
3. **Note in the report** that the project lacks test-auth / seed scripts; recommend adopting them
4. **Verdict can still be Pass / Conditional Pass** — bootstrap-state isn't an audit failure
5. **First audit takes longer** than subsequent ones because it's establishing the conventions

Subsequent audits inherit the conventions and run faster.

## What stays universal

The discipline above all this:

- **Interaction-first methodology** — works on any UI, any stack, any framework
- **Hard gates** (console errors / warnings, network errors, layout collapse) — every web stack has these
- **Persona Lock + first-time-user lens** — always applies
- **Multi-pane stress matrix** — applies to any app with collapsible UI
- **Visual polish + AI-tells** — stack-agnostic; pattern recognition on rendered pixels
- **Component perfection checklist** (6 categories + 6 states) — categories are universal
- **Scenario battery** — all 11 scenarios apply to any web app (skip Data Seasoning if no time-distributed data)
- **Audit-the-audit meta-check** — universal
- **Top 5 + self-critique + smallest-patch + hold-this discipline** — universal

The skill's core is stack-agnostic. The examples in references illustrate one stack — this file shows how to translate them.
