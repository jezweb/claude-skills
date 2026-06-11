# Claude Code Skills

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Production workflow skills for [Claude Code](https://claude.com/claude-code). Each skill guides Claude through a recipe to produce tangible output — scaffolded projects, generated assets, professional documents, deployed services.

Ten plugins of practical, production-oriented skills. Every one produces something. (The thinking skills — planning, prompt-writing, verification doctrine, brains-trust — live in their own framework: [dotjez](https://github.com/jezweb/dotjez).)

## Quick Start

```bash
# Add the marketplace (one-time)
/plugin marketplace add jezweb/claude-skills

# Install what you need
/plugin install cloudflare@jezweb-skills
/plugin install writing@jezweb-skills
/plugin install dev-tools@jezweb-skills
```

Then just ask Claude what you need — installed skills trigger automatically from natural language.

## Plugins

### Build & Deploy

| Plugin | Skills | What it does |
|--------|--------|-------------|
| **cloudflare** | cloudflare-worker-builder, vite-flare-starter, tanstack-start, hono-api-scaffolder, d1-drizzle-schema, d1-migration, db-seed, cloudflare-api | Scaffold and deploy Workers, full-stack Vite+React apps, TanStack Start, Hono APIs, D1/Drizzle schemas, migrations, database seeding, direct REST API for bulk/fleet operations |
| **shopify** | shopify-setup, shopify-products, shopify-content | Shopify API setup, product creation (single + bulk CSV), content pages, blog posts, SEO metadata |
| **wordpress** | wordpress-setup, wordpress-content, wordpress-elementor | WordPress WP-CLI/REST API access, content management, Elementor page editing |

### Design & Frontend

| Plugin | Skills | What it does |
|--------|--------|-------------|
| **frontend** | tailwind-theme-builder, shadcn-ui, landing-page, product-showcase, react-patterns, design-review, react-native | Tailwind v4 theming, shadcn/ui, landing pages, app showcases, React 19 performance/composition patterns, visual design quality review, React Native + Expo mobile patterns |
| **design-assets** | color-palette, favicon-gen, icon-set-generator, image-processing, ai-image-generator | Accessible colour palettes from a single hex, favicon packages, custom SVG icon sets, image resize/convert/optimise, AI image generation (Gemini/GPT) |
| **web-design** | seo-local-business | Local business SEO: JSON-LD schema, meta tags, robots.txt, sitemap.xml |

### Writing & Documents

| Plugin | Skills | What it does |
|--------|--------|-------------|
| **writing** | aussie-business-english, us-business-english, uk-business-english, nz-business-english, resume-cover-letter, proposal-writer, award-application, strategy-document | Regional business English style guides (AU/US/UK/NZ), resumes and cover letters, client proposals, award submissions, SWOT/business plans |
| **social-media** | social-media-posts | Platform-formatted posts for LinkedIn, Facebook, Instagram, Reddit — character limits, hashtag strategies, campaign sequences |

### Developer Tools

| Plugin | Skills | What it does |
|--------|--------|-------------|
| **dev-tools** | project-health, project-docs, app-docs, team-update, github-release, codex-review, git-workflow, ux-audit, ux-compare, ux-extract, responsiveness-check, deep-research, onboarding-ux, fork-discipline, roadmap, vitest | Project config, doc generation, app user guides, team updates, releases, Codex second opinions, git workflows, UX dogfooding and pattern extraction, responsive testing, pre-build discovery, in-app onboarding, core/client boundary audit, autonomous phased app delivery, Vitest test setup |
| **integrations** | gws-setup, gws-install, google-chat-messages, google-apps-script, elevenlabs-agents, mcp-builder, nemoclaw-setup, parcel-tracking, stripe-payments | Google Workspace setup, Google Chat webhooks, Apps Script, ElevenLabs voice agents, MCP servers, NemoClaw, parcel tracking, Stripe payments (checkout, subscriptions, webhooks, billing portal) |

## All 60 Skills

<details>
<summary>Full skill list with trigger phrases</summary>

| Skill | Triggers on |
|-------|------------|
| `cloudflare-worker-builder` | "scaffold a worker", "new cloudflare project" |
| `vite-flare-starter` | "scaffold a full-stack app", "vite + cloudflare" |
| `tanstack-start` | "tanstack start", "SSR dashboard" |
| `hono-api-scaffolder` | "hono api", "api routes" |
| `d1-drizzle-schema` | "d1 schema", "drizzle schema" |
| `d1-migration` | "d1 migration", "migrate database" |
| `db-seed` | "seed database", "sample data", "demo data" |
| `cloudflare-api` | "cloudflare api", "bulk dns", "custom hostname", "email routing" |
| `seo-local-business` | "local seo", "json-ld schema" |
| `tailwind-theme-builder` | "tailwind theme", "set up tailwind" |
| `shadcn-ui` | "shadcn", "install components" |
| `landing-page` | "landing page", "marketing page", "one-page site" |
| `product-showcase` | "showcase site", "product page", "show off the app" |
| `react-patterns` | "react patterns", "react performance", "reduce re-renders" |
| `design-review` | "design review", "does this look good", "visual review" |
| `react-native` | "react native", "expo", "mobile app" |
| `color-palette` | "colour palette", "color palette from hex" |
| `favicon-gen` | "favicon", "generate icons" |
| `icon-set-generator` | "icon set", "svg icons" |
| `image-processing` | "resize image", "convert to webp" |
| `ai-image-generator` | "generate image", "ai image", "hero image" |
| `gws-setup` | "google workspace mcp", "set up gmail mcp" |
| `gws-install` | "install google workspace", "connect gmail" |
| `google-chat-messages` | "google chat webhook", "send chat message" |
| `google-apps-script` | "apps script", "google sheets automation" |
| `elevenlabs-agents` | "elevenlabs agent", "voice agent" |
| `mcp-builder` | "build mcp server", "fastmcp" |
| `nemoclaw-setup` | "install nemoclaw", "setup nemoclaw", "nvidia nemoclaw" |
| `parcel-tracking` | "where's my parcel", "track my order", "tracking number" |
| `stripe-payments` | "add payments", "stripe checkout", "subscription billing" |
| `project-health` | "project health", "audit permissions" |
| `project-docs` | "generate docs", "document architecture", "api docs" |
| `app-docs` | "document the app", "user guide", "screenshot docs" |
| `team-update` | "team update", "post to chat" |
| `github-release` | "github release", "cut a release" |
| `git-workflow` | "prepare pr", "clean branches" |
| `ux-audit` | "ux audit", "dogfood the app" |
| `responsiveness-check` | "check responsiveness", "test viewports" |
| `deep-research` | "research this", "deep research", "explore the space" |
| `onboarding-ux` | "onboarding", "empty states", "new user experience" |
| `fork-discipline` | "fork discipline", "check the boundary", "core or client" |
| `roadmap` | "roadmap", "plan the build", "delivery plan", "phase plan" |
| `vitest` | "set up vitest", "add tests", "configure vitest", "migrate from jest" |
| `shopify-setup` | "shopify setup", "connect shopify" |
| `shopify-products` | "shopify products", "add products" |
| `shopify-content` | "shopify pages", "shopify blog" |
| `wordpress-setup` | "wordpress setup", "connect wordpress" |
| `wordpress-content` | "wordpress post", "create page" |
| `wordpress-elementor` | "elementor", "edit elementor page" |
| `social-media-posts` | "social media post", "linkedin post", "instagram caption" |
| `aussie-business-english` | "australian english", "write in aussie style" |
| `us-business-english` | "american english", "us business writing" |
| `uk-business-english` | "british english", "uk business writing" |
| `nz-business-english` | "new zealand english", "nz business writing" |
| `resume-cover-letter` | "write a resume", "cover letter" |
| `proposal-writer` | "write a proposal", "client quote" |
| `award-application` | "award application", "grant submission" |
| `strategy-document` | "swot analysis", "business plan", "okrs" |

</details>

## Philosophy

**Every skill must produce something.** No knowledge dumps — only workflow recipes that create files, projects, or configurations.

**Teach patterns, not ship scripts.** Skills describe what to do; Claude generates scripts adapted to your environment.

## Create Your Own

Use [Anthropic's official skill-creator](https://github.com/anthropics/skills) or ask Claude: "Create a new skill for [use case]"

See [SKILL_SHAPE.md](SKILL_SHAPE.md) for the authoring shape (frontmatter, sections, what to leave out) and [CLAUDE.md](CLAUDE.md) for repo development conventions.

## History

Started as 105 skills — many were reference guides that Claude's training data made redundant.

- **v1** (tag: `v1-final`) — 105 skills, flat structure
- **v2** — restructured into installable plugins, "every skill must produce something"
- **v12** — 10 plugins, 44 skills
- **v13** (current) — 11 plugins, 52 skills

## License

MIT
