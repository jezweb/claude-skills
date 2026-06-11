# Claude Skills

**Repository**: https://github.com/jezweb/claude-skills
**Owner**: Jeremy Dawes (Jez) | Jezweb

Production workflow skills for Claude Code CLI. Each skill guides Claude through a recipe to produce tangible output — not knowledge dumps, but working deliverables.

## Philosophy

- Every skill must produce visible output (files, configurations, deployable projects)
- "The context window is a public good" — only include what Claude doesn't already know
- **Teach patterns, not ship scripts** — skills teach Claude *what* to do, Claude generates scripts adapted to the user's environment. Pre-built scripts in `scripts/` are the rare exception, not the default. Put proven implementation patterns in `references/` for Claude to adapt.
- Follows the official Claude Code plugin spec

## Directory Structure

```
claude-skills/
├── plugins/                                # one folder per plugin; the folders are the truth, don't keep counts here
│   ├── cloudflare/                         # Cloudflare Workers, Hono, D1/Drizzle, Vite, TanStack Start
│   │   └── skills/
│   │       ├── cloudflare-worker-builder/
│   │       ├── vite-flare-starter/
│   │       ├── tanstack-start/
│   │       ├── hono-api-scaffolder/
│   │       ├── d1-drizzle-schema/
│   │       ├── d1-migration/
│   │       ├── db-seed/
│   │       └── cloudflare-api/
│   ├── web-design/                         # Local business SEO
│   │   └── skills/
│   │       └── seo-local-business/
│   ├── frontend/                           # Tailwind v4 + shadcn/ui + landing pages + showcases + React + design
│   │   └── skills/
│   │       ├── tailwind-theme-builder/
│   │       ├── shadcn-ui/
│   │       ├── landing-page/
│   │       ├── product-showcase/
│   │       ├── react-patterns/
│   │       ├── design-review/
│   │       ├── react-native/
│   │       ├── design-loop/
│   │       ├── design-system/
│   │       └── (walkthrough-video removed — superseded by github.com/jezweb/walkabout)
│   ├── design-assets/                      # Colour palettes, favicons, icons, image processing, AI images
│   │   └── skills/
│   │       ├── color-palette/
│   │       ├── favicon-gen/
│   │       ├── icon-set-generator/
│   │       ├── image-processing/
│   │       └── ai-image-generator/
│   ├── integrations/                       # Google Workspace, ElevenLabs, MCP, NemoClaw
│   │   └── skills/
│   │       ├── gws-setup/
│   │       ├── gws-install/
│   │       ├── google-chat-messages/
│   │       ├── google-apps-script/
│   │       ├── elevenlabs-agents/
│   │       ├── mcp-builder/
│   │       ├── nemoclaw-setup/
│   │       ├── parcel-tracking/
│   │       └── stripe-payments/
│   ├── dev-tools/                          # Context, sessions, releases, brains trust, git, browser automation
│   │   └── skills/
│   │       ├── project-health/
│   │       ├── project-docs/
│   │       ├── app-docs/
│   │       ├── github-release/
│   │       ├── git-workflow/
│   │       ├── team-update/
│   │       ├── ux-audit/
│   │       ├── responsiveness-check/
│   │       ├── deep-research/
│   │       ├── onboarding-ux/
│   │       ├── fork-discipline/
│   │       ├── roadmap/
│   │       └── vitest/
│   ├── shopify/                            # Shopify store management
│   │   └── skills/
│   │       ├── shopify-setup/
│   │       ├── shopify-products/
│   │       └── shopify-content/
│   ├── wordpress/                          # WordPress content & Elementor
│   │   └── skills/
│   │       ├── wordpress-setup/
│   │       ├── wordpress-content/
│   │       └── wordpress-elementor/
│   ├── social-media/                       # Social media content creation
│   │   └── skills/
│   │       └── social-media-posts/
│   └── writing/                            # Business English + professional documents
│       └── skills/
│           ├── aussie-business-english/
│           ├── us-business-english/
│           ├── uk-business-english/
│           ├── nz-business-english/
│           ├── resume-cover-letter/
│           ├── proposal-writer/
│           ├── award-application/
│           └── strategy-document/
├── .claude-plugin/                         # Marketplace + plugin config
│   ├── marketplace.json
│   └── plugin.json
├── CLAUDE.md                               # This file
├── README.md                               # Public-facing overview
└── LICENSE                                 # MIT
```

## Plugin Anatomy (Anthropic Spec)

Each plugin contains one or more skills, auto-discovered from `skills/`:

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json        # name, description, author
└── skills/
    └── skill-name/
        ├── SKILL.md       # Frontmatter + instructions (inline everything critical)
        ├── ERRATA.md      # Optional: versioned corrections discovered during builds
        ├── scripts/       # Executable scripts the agent RUNS (not reads)
        ├── references/    # Supplementary/variant docs (NOT critical path)
        └── assets/        # Files used in output (templates, images)
```

## Adding a New Plugin

1. Create the plugin directory:
   ```bash
   mkdir -p plugins/my-plugin/{.claude-plugin,skills}
   ```

2. Create `.claude-plugin/plugin.json`:
   ```json
   {
     "name": "my-plugin",
     "description": "What this plugin does.",
     "author": { "name": "Jeremy Dawes / Jezweb", "email": "jeremy@jezweb.net" }
   }
   ```

3. Add skills inside `plugins/my-plugin/skills/` (each with SKILL.md)

4. Add an entry to `.claude-plugin/marketplace.json`:
   ```json
   { "name": "my-plugin", "description": "...", "source": "./plugins/my-plugin", "category": "development" }
   ```

5. Update the directory tree in this file and the table in README.md

**Categories**: `development`, `design`, `productivity`, `testing`, `security`, `database`, `monitoring`, `deployment`

## Creating a Skill

See [`SKILL_SHAPE.md`](SKILL_SHAPE.md) for the canonical authoring guide — frontmatter, sections in order, what earns its place, what to leave out, trimming pass for existing skills.

Quick start: use [Anthropic's official skill-creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) or ask Claude: "Create a new skill for [use case]"

Key principle: **every skill must produce something.** If it's just reference material Claude already knows, it doesn't earn a place here.

### Skill Design: Inline Everything Critical

**If the agent skipping it would derail the workflow, it goes in SKILL.md.** Reference files are for genuinely optional material — variant-specific docs, supplementary examples, historical context. Anything on the critical path must be inline.

This was learned the hard way: an agent was told "see references/stitch-direct.md for the curl commands." It skipped the file entirely and tried to use the website in a browser instead. The critical commands were 20 lines away in a reference file. It never read them.

| Content type | Where it goes | Example |
|-------------|--------------|---------|
| Workflow steps, commands, scripts | **SKILL.md body (inline)** | curl commands, Python scripts, mapping tables |
| Executable helper scripts | `scripts/` | Agent runs them without reading (fine) |
| Variant/optional docs | `references/` | Platform-specific variants (AWS vs GCP) |
| Templates copied into user projects | `assets/` | React boilerplate, config files |

**Why not reference files for critical content?** When a skill loads, SKILL.md goes directly into context. The agent sees it immediately. Reference files require a deliberate choice to read another file — an extra decision point that LLMs deprioritise in favour of acting. The instruction to "go read file X" competes with the instruction to "do the task" and loses.

**No file size anxiety.** The old 500-line limit was a context economics rule from the 200K era. A 500-line skill is ~2500 tokens — 0.25% of 1M context, 1.25% of 200K. Even on smaller contexts, a working skill that's 800 lines beats a broken skill that's 300 lines with critical content in references the agent never reads.

### Frontmatter Validation

- `name`: kebab-case, lowercase letters/digits/hyphens, max 64 characters
- `description`: max 1024 characters, no angle brackets. Include trigger phrases.
- Optional: `license`, `compatibility`, `allowed-tools`, `metadata`

## Installing Plugins

```bash
# Add marketplace (one-time)
/plugin marketplace add jezweb/claude-skills

# Install individual plugins
/plugin install cloudflare@jezweb-skills
/plugin install dev-tools@jezweb-skills
/plugin install frontend@jezweb-skills

# Local dev (loads a single plugin without install)
claude --plugin-dir ./plugins/cloudflare
```

After installing, restart Claude Code to load new plugins.

## Quality Bar

Before committing a skill:
- [ ] SKILL.md has valid YAML frontmatter (name: kebab-case max 64 chars, description: max 1024 chars)
- [ ] Everything on the critical path is inline in SKILL.md (no "see references/" for must-do steps)
- [ ] Produces tangible output (not just reference material)
- [ ] Tested by actually using it on a real task
- [ ] Rich enough that the agent doesn't need to improvise — include exact commands, scripts, mapping tables
- [ ] Not brutally summarised — detail is better than brevity when the detail prevents mistakes

## Skill Errata (ERRATA.md)

When a skill's instructions are correct at one point but a library update changes behaviour, capture the correction in `ERRATA.md` alongside the SKILL.md rather than immediately rewriting the skill.

**Status lifecycle**: `active` (current correction) → `absorbed` (folded into SKILL.md) → `outdated` (library changed again)

Only for version-specific issues. Small typos or obvious mistakes should just be fixed in SKILL.md directly.

## Git History

All 105 skills from the v1 era are preserved:
- Tag `v1-final` — the complete 105-skill collection
- Branch `archive/low-priority-skills` — 13 previously archived skills
- Full git history available via `git log v1-final`
