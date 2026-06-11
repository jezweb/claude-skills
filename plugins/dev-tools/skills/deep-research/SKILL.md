---
name: deep-research
description: "Deep research and discovery before building something new. Explores local projects for reusable code, researches competitors, reads forums and reviews, analyses plugin ecosystems, investigates technical options, and produces a comprehensive research brief. Three depths: focused (30 min), wide (1-2 hours), deep (3-6 hours). Triggers: 'research this', 'discovery', 'explore the space', 'what should I build', 'competitive analysis', 'before I start building', 'research before coding'. Not for cited fact-checking research reports (a separate harness does those); this is pre-build product discovery."
compatibility: claude-code-only
---

# Deep Research

Comprehensive research and discovery before building something new. Instead of jumping straight into code from training data, this skill goes wide and deep — local exploration, web research, competitor analysis, ecosystem signals, future-casting — and produces a research brief that makes the actual build 10x more productive.

## Depth Levels

The difference is **scope of ambition**, not just time.

| Depth | Purpose | Scope |
|-------|---------|-------|
| **focused** | Answer a specific question | One decision: "CodeMirror vs ProseMirror?" — targeted search, local scan, 1-2 comparisons. Produces a 1-page recommendation. |
| **wide** | Understand the space | Landscape for a new product or feature. Competitors, ecosystem, user needs, architecture options. Enough to write a spec. |
| **deep** | Plan a major build | Leave no stone unturned. Everything in wide PLUS library/component research, plugin ecosystems, GitHub issues mining, community sentiment, future-casting, technical deep-dives on every decision. Enough to drive weeks of coding. |

Default: **wide**

## Workflow

### 1. Understand the Intent

Ask the user:
- **What** are you building? (one sentence)
- **Why?** What problem does it solve? Who's it for?
- **Constraints?** Stack preferences, budget, timeline, must-haves?
- **Existing work?** Any projects to build on? Repos to look at?

If the user gives a brief prompt ("obsidian replacement on cloudflare"), that's enough — fill in the gaps through research.

### 2. Local Exploration

Scan the user's machine for relevant prior work:

```bash
# Find related projects by name/keyword
ls ~/Documents/ | grep -i "KEYWORD"

# Read CLAUDE.md of related projects for architecture context
find ~/Documents -maxdepth 2 -name "CLAUDE.md" -exec grep -l "KEYWORD" {} \;

# Check for reusable patterns, schemas, components
find ~/Documents -maxdepth 3 -name "schema.ts" -o -name "ARCHITECTURE.md" | head -20
```

For each related project found:
- Read CLAUDE.md (stack, architecture, gotchas)
- Check for reusable code (schemas, components, utilities, configs)
- Note what worked well and what didn't (from git history, TODO comments)

Also check:
- Basalt Cortex (`~/Documents/basalt-cortex/`) for related clients, contacts, knowledge facts
- `grep -rl "KEYWORD" ~/Documents/basalt-cortex/ --include="*.md"`

### 3. Web Research

Search broadly to understand the space:

- **Product category**: "markdown note app", "knowledge management tool for teams"
- **Competitors**: find top 5-10 by searching "best X", "X alternatives", "X vs Y"
- **Open source**: search GitHub for open-source alternatives, check star counts
- **Architecture**: "how to build X", "X tech stack", "building X with [framework]"
- **Technology docs**: check llms.txt, official docs for key technologies
- **Platform examples**: "built with Cloudflare Workers", "D1 full-text search example"
- **Tutorials and case studies**: "building a Y from scratch", "lessons learned building Z"

### 4. Ecosystem and Community Research (wide + deep)

Go beyond the core product — the ecosystem reveals what users actually need:

**Plugins and add-ons**:
- What plugins exist for major competitors? The most popular ones reveal what the core product lacks.
- e.g. Obsidian has 1800+ plugins — the top 20 tell you what Obsidian doesn't do well natively.
- Search: "top [product] plugins", "[product] plugin directory"

**GitHub issues and feature requests**:
- Check top competitors' GitHub repos for most-upvoted issues
- Sort by thumbs-up reactions — this is direct user demand signal
- Check closed issues for how features were implemented

**Forum discussions**:
- Reddit: r/[product], r/selfhosted, r/webdev, relevant niche subreddits
- Hacker News: search for the product category
- Discord/Discourse: product-specific communities
- What do users love? What do they complain about? What do they wish existed?

**App store and review sites**:
- 1-star reviews = unmet needs (the product fails at this)
- 5-star reviews = what to preserve (users love this, don't break it)
- 3-star reviews = the interesting middle (it's okay but...)
- Search: ProductHunt, G2, Capterra, App Store reviews

**Integration requests**:
- What systems do users want to connect to? (Zapier integrations, API requests)
- These reveal real workflows — users duct-tape tools together

### 5. Competitor Deep-Dive (wide + deep)

For each major competitor (3-5 for wide, 5-10 for deep):

| Question | How to research |
|----------|----------------|
| Features | Landing page, docs, changelog |
| Pricing | Pricing page, comparison sites |
| User complaints | Reddit, HN, app store reviews |
| Tech stack | Wappalyzer, view-source, job postings, blog posts |
| What they do well | 5-star reviews, product demos |
| What they do poorly | 1-star reviews, forum complaints, migration guides FROM the product |
| Documentation quality | Read their docs site — is it comprehensive? What topics need the most explanation? (Complex topics = things users struggle with) |
| Help/support content | Help centre, FAQ, knowledge base, support forums — what questions do users ask most? |
| Onboarding/tutorials | Getting started guides, video tutorials, interactive walkthroughs — how do they teach their product? What do they assume the user already knows? |
| API documentation | If they have an API — how well documented? What patterns do they use? What SDKs do they provide? |
| Migration guides | Do they have "switch from X" guides? These reveal what they consider their advantages AND what users find hard to switch from |

### 6. Library and Component Research (deep mode)

Research the building blocks — what already exists that you can use or learn from:

**React / UI libraries**:
- Search npm for category-specific packages ("react markdown editor", "react kanban", "react data table")
- Check weekly downloads, last publish date, GitHub stars, open issues count
- Read the README and examples — what patterns do they use?
- Check bundle size (bundlephobia.com) — does it fit the project constraints?
- Look at the source code of the best ones — their architecture is proven by real usage

**Headless / unstyled libraries**:
- Headless UI, Radix, React Aria, Downshift — what primitives exist for the features you need?
- These are often better than full component libraries because you control the styling
- Check if shadcn/ui already wraps what you need

**Hooks and utilities**:
- TanStack (Query, Table, Virtual, Router) — what's relevant?
- React Hook Form, Zod, date-fns, Zustand — proven solutions for common problems
- Search "awesome-react" lists and curated collections

**Platform-specific libraries**:
- For Cloudflare: what works on Workers? (No Node.js APIs, no native modules)
- Check Cloudflare's own examples and starter templates
- Search for "cloudflare workers" + the feature you need

**What to capture for each library**:

| Question | Why it matters |
|----------|---------------|
| Does it solve our problem? | Feature match |
| Bundle size | Performance budget |
| Last publish date | Is it maintained? |
| Open issues / PRs | Community health |
| Works on our platform? | Cloudflare Workers has restrictions |
| What patterns does it use? | Even if we don't use the library, its patterns are valuable |

**The insight**: Even if you decide to build something custom, researching existing libraries shows you the patterns that survived contact with real users. A library with 10K stars has had its API refined by thousands of developers — steal their design decisions.

### 7. Platform Capability Deep-Dive (wide + deep)

**This is critical.** Claude's training data is always behind on platform features. Cloudflare, Vercel, Firebase, Supabase — they all ship new capabilities constantly. A feature you assume doesn't exist might have launched last month. The Basalt Cortex project exists because of capabilities (Workers AI toMarkdown, Vectorize metadata filtering, D1 FTS5) that weren't obvious without actively looking.

**Do NOT rely on training data for platform capabilities.** Go read the actual current docs.

#### How to Research the Platform

1. **Fetch the platform's changelog/blog**:
   - Cloudflare: `https://blog.cloudflare.com/` + `https://developers.cloudflare.com/changelog/`
   - Vercel: `https://vercel.com/changelog`
   - Firebase: `https://firebase.google.com/support/releases`
   - Supabase: `https://supabase.com/changelog`

2. **Read the full product catalogue** — not just the services you already use:
   - Cloudflare: Workers, D1, R2, KV, Vectorize, Queues, Durable Objects, Workers AI, AI Gateway, Workflows, Containers, Browser Rendering, Tunnel, Email Routing, Images, Stream, Hyperdrive, Pipelines, Sandbox
   - Vercel: Functions, Edge Middleware, KV, Postgres, Blob, AI SDK, Cron, Firewall
   - Firebase: Firestore, Auth, Storage, Functions, Hosting, Extensions, Genkit, App Check

3. **For each service, ask**: could this solve a problem in the product we're building?

4. **Look for recently shipped features** that expand what's possible:
   - New AI models available at the edge?
   - New storage primitives?
   - New networking capabilities?
   - New auth/identity features?
   - New build/deploy options?

#### Cloudflare Capability Checklist (Expand for Other Platforms)

Go through each and ask "would this be useful for what we're building?":

| Category | Services to investigate |
|----------|----------------------|
| **Compute** | Workers, Cron Triggers, Queues consumers, Workflows (multi-step), Containers, Durable Objects (stateful), Tail Workers |
| **Storage** | D1 (SQL + FTS5), R2 (objects), KV (key-value), Durable Object storage (strongly consistent) |
| **AI** | Workers AI models (text, image, embedding, speech, translation, toMarkdown), Vectorize (semantic search), AI Gateway (caching/routing) |
| **Networking** | Custom domains, Tunnel, Spectrum (TCP/UDP), WebSockets, Hyperdrive (database proxy) |
| **Security** | WAF, Turnstile (CAPTCHA), Bot Management, API Shield, DDoS |
| **Media** | Images (resize/optimise on-the-fly), Stream (video), Browser Rendering (screenshots, PDF generation) |
| **Email** | Email Routing (rules), Email Workers (programmable inbound email processing) |
| **Observability** | Workers Logs, Analytics Engine, GraphQL analytics |

#### What to Capture

For each relevant capability, note:
- What it does (one sentence)
- How it could be used in this product
- Any limitations or pricing considerations
- Example: "Workers AI `toMarkdown()` converts any uploaded PDF/DOCX to markdown at the edge — we could use this for document import without any external service"

#### Why This Matters

The difference between "build a note app" and "build a note app that converts any file to markdown, searches semantically across all notes, generates summaries with AI, syncs via background Workflows, and renders PDFs with Browser Rendering" is **knowing what the platform offers**. Most developers only use 20% of their platform because they never looked at the other 80%.

### 8. Future-Casting (deep mode)

Think beyond what exists today:

**Platform roadmap**: Based on the changelog and blog research above, what direction is the platform heading? What's in beta? What was announced but not yet GA?

**AI integration**: Not "add a chatbot" — think deeper. What's possible when the tool can read, reason about, and act on the user's data? What if every note could be searched semantically? What if the app could write its own documentation? What if uploads auto-converted to markdown?

**Device and input evolution**: Mobile-first, voice input, wearables, spatial computing. How might users interact with this in 2-5 years?

**Data sources**: What new inputs could feed in? Sensors, APIs, real-time data, cross-app context?

**Adjacent opportunities**: What problems sit next to this one? e.g. building a note app — adjacent: task management, project tracking, team communication. What are users duct-taping together today?

**Convergence trends**: What separate tools are being unified? (Email + chat + tasks = Slack. Notes + databases + wikis = Notion. What's next?)

### 9. Technical Research (deep mode)

For each major architectural decision:

| Decision area | Questions to answer |
|--------------|-------------------|
| Editor / UI framework | Options, tradeoffs, community size, our experience |
| Database | SQL vs NoSQL vs file, managed vs self-hosted, our stack support |
| Auth | Better-auth, Clerk, Auth.js, custom — what fits? |
| Hosting / deployment | Cloudflare, Vercel, Railway — constraints and capabilities |
| Search | FTS5, Elasticsearch, Meilisearch, Vectorize — what scale? |
| Real-time | WebSockets, SSE, Durable Objects — do we need it? |
| File storage | R2, S3, local — access patterns? |
| API design | REST, tRPC, GraphQL — what does the use case need? |

### 10. Synthesis

Produce a research brief saved to `.jez/artifacts/research-brief-{topic}.md`:

```markdown
# Research Brief: [Topic]
**Depth**: [focused|wide|deep]
**Date**: YYYY-MM-DD
**Research time**: [duration]

## Executive Summary
[2-3 sentences: what to build, why, key insight from research]

## Competitive Landscape
| Product | Strengths | Weaknesses | Pricing | Users |

### Key Insights
[What winners do well, what gaps exist in the market]

## Ecosystem Signals
### Most Popular Plugins/Add-ons
[Top plugins for competitors — reveals unmet needs]
### Most Requested Features
[From GitHub issues, forums, reviews — sorted by demand]
### Integration Patterns
[What systems users connect to — reveals real workflows]

## User Needs
[What real users want, from reviews/forums/complaints]

## Technical Landscape
| Decision | Options | Recommendation | Why |

## Libraries and Components
| Need | Library | Stars | Size | Fits platform? | Notes |
[Key libraries evaluated for each major feature]

## Platform Capabilities
| Service | Could use for | Impact |
[Every platform service evaluated against the product's needs]
[Flag recently shipped features the team may not know about]

## Reusable From Existing Projects
| Project | What to reuse | Location |

## Future Possibilities
### Platform roadmap
### AI opportunities
### Adjacent problems
### 2-5 year horizon

## Proposed Architecture
[Stack, data model sketch, key flows]

## Risks and Open Questions
[Things research couldn't answer]

## Suggested Phases
[Build order based on research findings]

## Sources
[Links to everything read]
```

## Tips

- Start the brief early and add to it as you research — the artifact is the deliverable
- For deep mode, use sub-agents to parallelise web research and local exploration
- The "Reusable From Existing Projects" section often saves weeks of work
- Ecosystem signals (plugins, issues, reviews) are often more valuable than competitor feature lists
- Save the brief to `.jez/artifacts/` — it's useful for future sessions and for the actual build phase
- The brief is a living document — update it as you learn more during the build
