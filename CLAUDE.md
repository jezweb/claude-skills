# Claude Skills - Project Context

**Repository**: https://github.com/jezweb/claude-skills
**Purpose**: Production-ready skills for Claude Code CLI
**Owner**: Jeremy Dawes (Jez) | Jezweb
**Status**: Active Development | 63 Skills Complete (13 archived)
**Last Updated**: 2025-12-15

---

## What This Repository Is

This is a curated collection of **production-tested Claude Code skills** for building modern web applications. Skills are modular capabilities that extend Claude's knowledge in specific domains, enabling faster development with fewer errors.

**Focus**: Claude Code CLI skills (not claude.ai web interface)

**Target Audience**: Developers building with Cloudflare, React, Tailwind v4, and AI integrations.

---

## Quick Navigation

**👋 First Time Here?** → Read [START_HERE.md](START_HERE.md)
**🔨 Building a Skill?** → See [QUICK_WORKFLOW.md](QUICK_WORKFLOW.md)
**✅ Verifying Work?** → Check [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md)

---

## Official Standards We Follow

This repo aligns with **official Anthropic standards**:

- **Official Skills Repo**: https://github.com/anthropics/skills
- **Agent Skills Spec**: [agent_skills_spec.md](https://github.com/anthropics/skills/blob/main/agent_skills_spec.md)
- **Skill Creator Guide**: [skill-creator/SKILL.md](https://github.com/anthropics/skills/blob/main/skill-creator/SKILL.md)
- **Our Standards Doc**: [planning/claude-code-skill-standards.md](planning/claude-code-skill-standards.md)
- **Comparison**: [planning/STANDARDS_COMPARISON.md](planning/STANDARDS_COMPARISON.md)

**Last Verified**: 2025-10-29

---

## Directory Structure

```
claude-skills/
├── START_HERE.md                 # ← Read this first!
├── CLAUDE.md                     # ← You are here
├── GEMINI_GUIDE.md               # AI agent onboarding guide
├── ONE_PAGE_CHECKLIST.md         # Quick verification
├── QUICK_WORKFLOW.md             # 5-minute skill creation
├── README.md                     # Public-facing overview
├── CONTRIBUTING.md               # Contribution guidelines
├── MARKETPLACE.md                # Marketplace installation guide
├── ATOMIC-SKILLS-SUMMARY.md      # Skill philosophy
├── CHANGELOG.md                  # Version history
├── SESSION.md                    # Working session state (gitignored)
├── *_REPORT.md                   # Auto-generated reports (gitignored)
├── LICENSE                       # MIT License
├── .gitignore                    # Git ignore patterns
│
├── skills/                       # ← All production skills (58 total)
│   ├── tailwind-v4-shadcn/       # Gold standard example
│   ├── cloudflare-worker-base/   # Foundation skill
│   ├── ai-sdk-core/              # AI integration
│   ├── openai-agents/            # OpenAI Agents SDK
│   ├── project-planning/         # Planning automation
│   ├── project-session-management/ # Session handoff protocol
│   ├── project-workflow/         # Slash commands (canonical source)
│   │   └── commands/             # /explore-idea, /plan-project, etc.
│   └── [52 more skills...]       # Run ls skills/ for full list
│
├── commands/                     # ← Slash commands (symlinked to ~/.claude/commands/)
│   ├── brief.md                  # /brief - Context preservation
│   ├── explore-idea.md           # /explore-idea - Pre-planning exploration
│   ├── plan-project.md           # /plan-project - Initial planning
│   ├── plan-feature.md           # /plan-feature - Feature addition
│   ├── wrap-session.md           # /wrap-session - End-of-session workflow
│   ├── continue-session.md       # /continue-session - Resume session
│   ├── workflow.md               # /workflow - Interactive guide
│   ├── release.md                # /release - Pre-release safety checks
│   └── README.md                 # Commands documentation
│
├── .claude/                      # Claude Code local settings
│   └── settings.local.json       # Local preferences (not committed)
│
├── .claude-plugin/               # Marketplace metadata
│   └── marketplace.json          # Auto-generated plugin manifest
│
├── docs/                         # Documentation
│   └── JEZWEB_WORKFLOW.md        # Comprehensive workflow guide
│
├── tools/                        # Utility scripts
│   ├── statusline/               # Custom statusline scripts
│   └── statusline-npm/           # NPM-based statusline
│
├── archive/                      # Archived content
│   ├── low-priority-skills/      # 13 skills archived 2025-11-17 (in git branch)
│   └── session-logs/             # Working audit logs (gitignored, archived when needed)
│
├── templates/                    # ← Templates for new skills
│   ├── SKILL-TEMPLATE.md         # Copy-paste SKILL.md starter
│   ├── README-TEMPLATE.md        # Copy-paste README starter
│   └── skill-skeleton/           # Complete directory to copy
│       ├── SKILL.md
│       ├── README.md
│       ├── scripts/
│       ├── references/
│       └── assets/
│
├── planning/                     # Planning & research docs
│   ├── claude-code-skill-standards.md
│   ├── research-protocol.md
│   ├── skills-roadmap.md
│   ├── verification-checklist.md
│   ├── STANDARDS_COMPARISON.md
│   ├── COMMON_MISTAKES.md
│   └── research-logs/            # Per-skill research
│
├── scripts/                      # Automation scripts
│   ├── install-skill.sh          # Symlink skill to ~/.claude/skills/
│   ├── install-all.sh            # Install all skills
│   ├── check-symlinks.sh         # Verify/repair skill symlinks
│   ├── check-npm-versions.sh     # NPM package version checker
│   ├── check-github-releases.sh  # GitHub release tracker
│   ├── check-metadata.sh         # YAML metadata validator
│   ├── check-ai-models.sh        # AI model reference checker
│   ├── check-all-versions.sh     # Comprehensive checker (runs all)
│   ├── check-marketplace-sync.sh # Verify marketplace.json matches skills/
│   ├── generate-plugin-manifests.sh  # Generate marketplace manifests
│   ├── release-check.sh          # Pre-release safety checks
│   ├── review-skill.sh           # Skill audit/review automation
│   └── check-versions.sh         # Legacy checker (deprecated)
│
└── examples/                     # Working example projects
    └── cloudflare-worker-base-test/
```

### Symlink Workflow

**Skills**: Symlinked from `skills/` → `~/.claude/skills/`
**Commands**: Symlinked from `commands/` → `~/.claude/commands/`

**Installing Skills:**
```bash
./scripts/install-skill.sh <skill-name>      # Symlink single skill
./scripts/install-all.sh                     # Symlink all skills
./scripts/check-symlinks.sh                  # Verify symlinks
./scripts/check-symlinks.sh --fix            # Repair broken symlinks
```

**Installing Commands:**
```bash
# Commands must be manually symlinked:
ln -s /home/jez/Documents/claude-skills/commands/<command>.md ~/.claude/commands/<command>.md

# Example:
ln -s /home/jez/Documents/claude-skills/commands/brief.md ~/.claude/commands/brief.md
```

**Adding New Commands:**

1. Create command in `/commands/<command-name>.md`
2. Symlink to `~/.claude/commands/<command-name>.md`
3. Command is immediately available in Claude Code
4. Commit to git for version control

**Note**: Commands in `skills/project-workflow/commands/` are the canonical source for workflow commands, but `/commands/` directory mirrors them for manual installation and development.

---

## File Conventions

This repository has three types of files:

### 1. Version-Controlled Files (Committed to Git)

**Production Skills**:
- `skills/*/SKILL.md` - Skill documentation
- `skills/*/README.md` - Auto-trigger keywords
- `skills/*/templates/` - Code templates
- `skills/*/references/` - Reference documentation
- `skills/*/scripts/` - Helper scripts
- `skills/*/assets/` - Images, diagrams
- `skills/*/rules/` - Correction rules (copied to projects)

**Commands**:
- `commands/*.md` - Slash command definitions
- `skills/project-workflow/commands/*.md` - Canonical workflow commands

**Documentation**:
- `*.md` files in root (README, CLAUDE, START_HERE, etc.)
- `planning/*.md` - Standards, research, roadmaps
- `templates/` - Skill creation templates

**Configuration**:
- `.gitignore` - Ignore patterns
- `LICENSE` - MIT license
- `.claude-plugin/marketplace.json` - Auto-generated marketplace manifest (committed)

### 2. Auto-Generated Files (Gitignored)

**Reports** (generated by `scripts/check-*.sh`):
- `VERSIONS_REPORT.md` - Package version check results
- `SKILLS_OPTIMIZATION_REPORT.md` - Description analysis
- Generated by automation, recreated on each run

**Manifests** (generated by `generate-plugin-manifests.sh`):
- `skills/*/.claude-plugin/plugin.json` - Individual skill manifests
- Used by Claude Code marketplace

### 3. Working Files (Gitignored)

**Session Tracking**:
- `SESSION.md` - Active session state (changes constantly during work)
- `archive/session-logs/*.md` - Archived audit logs (saved when needed)

**Local Settings**:
- `.claude/settings.local.json` - Claude Code local preferences

**Why Gitignored**: These files change frequently during development and are specific to the current work session. They're preserved manually when needed (e.g., archiving session logs after completing a phase).

### File Lifecycle Example

```
1. Create skill → skills/new-skill/SKILL.md (version controlled)
2. Install skill → ./scripts/install-skill.sh new-skill (creates symlink)
3. Generate manifest → ./scripts/generate-plugin-manifests.sh (auto-generated)
4. Verify versions → ./scripts/check-all-versions.sh (creates VERSIONS_REPORT.md)
5. Audit skill → ./scripts/review-skill.sh new-skill (updates SKILL.md)
6. Track work → Update SESSION.md (working file, not committed)
7. Archive session → mv SESSION.md archive/session-logs/phase-X.md (manual)
8. Commit → git add skills/new-skill && git commit (version controlled only)
```

---

## Current Status (2025-12-15)

### ✅ Active Skills (63)

All 63 skills are production-ready and organized by domain:

**Cloudflare Platform** (20 skills):
- cloudflare-worker-base, cloudflare-d1, cloudflare-r2, cloudflare-kv
- cloudflare-workers-ai, cloudflare-vectorize, cloudflare-queues, cloudflare-workflows
- cloudflare-durable-objects, cloudflare-agents, cloudflare-mcp-server, cloudflare-turnstile
- cloudflare-hyperdrive, cloudflare-images, cloudflare-browser-rendering
- And 5 more...

**Archived Skills** (13):
- Preserved in `archive/low-priority-skills` branch
- Includes: hugo, cloudflare-nextjs, cloudflare-email-routing, cloudflare-cron-triggers, cloudflare-zero-trust-access, cloudflare-sandbox, better-chatbot, better-chatbot-patterns, multi-ai-consultant, ai-elements-chatbot, firecrawl-scraper, content-collections, base-ui-react
- Can be restored anytime via git cherry-pick

**AI & Machine Learning** (10 skills):
- ai-sdk-core, ai-sdk-ui, openai-api, openai-agents, openai-assistants, openai-responses
- google-gemini-api, google-gemini-embeddings, claude-api, claude-agent-sdk, thesys-generative-ui

**Frontend & UI** (7 skills):
- tailwind-v4-shadcn, react-hook-form-zod, tanstack-query, zustand-state-management
- nextjs, hono-routing, firecrawl-scraper

**Auth & Security** (3 skills):
- clerk-auth, better-auth, cloudflare-zero-trust-access

**Content Management** (2 skills):
- tinacms, sveltia-cms

**Database & ORM** (4 skills):
- drizzle-orm-d1, neon-vercel-postgres, vercel-kv, vercel-blob

**Tooling & Planning** (5 skills):
- typescript-mcp, fastmcp, ts-agent-sdk, project-planning, project-session-management

**Quality Standards**:
- ✅ All production-tested
- ✅ Fully compliant with official Anthropic standards
- ✅ Package versions verified current
- ✅ Average token savings: 60-70%
- ✅ 395+ documented errors prevented across all skills

---

## Development Workflow

### Standard Workflow (From Scratch)

```
1. RESEARCH
   • Read planning/research-protocol.md
   • Verify latest package versions (npm view)
   • Document in planning/research-logs/

2. TEMPLATE
   • Copy: cp -r templates/skill-skeleton/ skills/new-skill/
   • Fill TODOs in SKILL.md
   • Fill TODOs in README.md
   • Add resources (scripts/, references/, assets/)

3. TEST
   • Install: ./scripts/install-skill.sh new-skill
   • Test discovery: Ask Claude Code to use skill
   • Build example project to verify templates work

4. VERIFY
   • Check ONE_PAGE_CHECKLIST.md
   • Compare with planning/claude-code-skill-standards.md
   • Run check-all-versions.sh if skill has dependencies

5. COMMIT
   • git add skills/new-skill
   • git commit -m "Add new-skill for [use case]"
   • Update planning/skills-roadmap.md
   • git push

6. MARKETPLACE
   • Generate manifest: ./scripts/generate-plugin-manifests.sh
   • Verify created: skills/new-skill/.claude-plugin/plugin.json
   • git add skills/new-skill/.claude-plugin/
   • git commit -m "Add marketplace manifest for new-skill"
   • git push
```

### Quick Workflow (Experienced)

```bash
# 1. Copy template
cp -r templates/skill-skeleton/ skills/my-skill/

# 2. Edit SKILL.md and README.md (fill TODOs)
# 3. Add resources

# 4. Test
./scripts/install-skill.sh my-skill

# 5. Verify & Commit
git add skills/my-skill && git commit -m "Add my-skill" && git push

# 6. Generate marketplace manifest
./scripts/generate-plugin-manifests.sh
git add skills/my-skill/.claude-plugin/ && git commit -m "Add marketplace manifest for my-skill" && git push
```

---

## Key Principles

### 1. Atomic Skills Philosophy
- **One skill = One domain** (e.g., D1 database, not "all Cloudflare services")
- **Composable**: Claude combines skills automatically
- **Reusable**: Same skill works across different frameworks
- **Maintainable**: Update one skill, benefits all use cases

### 2. Production Quality
- All skills must be **tested in production**
- Package versions must be **current** (verified regularly)
- Known issues must be **documented with sources** (GitHub issues, etc.)
- Token efficiency must be **measured** (≥50% savings)

### 3. Official Standards Compliance
- YAML frontmatter: `name` and `description` (required)
- Optional fields: `license`, `allowed-tools`, `metadata`
- Directory structure: `scripts/`, `references/`, `assets/` (official)
- Writing style: Imperative/infinitive form, third-person descriptions
- See [planning/STANDARDS_COMPARISON.md](planning/STANDARDS_COMPARISON.md)

### 4. Progressive Disclosure
- **Metadata** (name + description): Always in context (target: 250-350 chars, ~40-55 tokens)
- **SKILL.md body**: Loaded when skill triggers (<5k words)
- **Bundled resources**: Loaded as needed by Claude

#### Description Best Practices

After optimizing 20+ skills, these patterns work best:

**Length:** 250-350 characters is the sweet spot
- Below 200: Often too terse, loses context
- 200-400: Target range
- Above 400: Usually has redundancy to trim

**Structure:** Two-paragraph format for clarity
- Paragraph 1: What you can build + key features
- Paragraph 2: When to use + error keywords

**Discoverability:** Balance specificity with brevity
- Include technology names explicitly
- Preserve unique selling points
- Add 2-3 distinctive error keywords
- Move comprehensive keywords to metadata.keywords

**Avoid:**
- Dense comma-separated lists
- Passive voice constructions
- Meta-commentary about the skill
- Over-compression that hurts readability

**Examples:** See ai-sdk-core, auto-animate, cloudflare-mcp-server

### 5. Project Rules (Portable Context)

Skills can include `rules/` directories containing correction rules that get copied into projects. These rules:

- **Bridge training cutoffs**: Correct outdated patterns Claude may suggest (e.g., Tailwind v3 → v4 syntax)
- **Are project-portable**: Committed to the project repo, work in any environment (local CLI, Claude Code online, team members)
- **Reduce user-level dependency**: Project carries its own intelligence instead of relying on user's `~/.claude/CLAUDE.md`

**How rules differ from skills:**

| Aspect | Skills | Rules |
|--------|--------|-------|
| **Location** | `~/.claude/skills/` (user-level) | `.claude/rules/` (project-level) |
| **Content** | Rich bundles (templates, scripts, references) | Single markdown files |
| **Loading** | Triggered by keywords | Always loaded for matching paths |
| **Purpose** | Teach Claude how to use a technology | Correct specific patterns |

**Rule Types:**

1. **Correction Rules** (e.g., `tailwind-v4-shadcn.md`): Bridge training cutoff gaps with current syntax
2. **Session Protocol** (e.g., `session-protocol.md`): Project-specific session management conventions

**Adding rules to a skill:**

```
skills/my-skill/
├── SKILL.md
├── rules/                    # ← NEW
│   └── my-skill.md           # Correction rule (matches skill name)
├── templates/
└── references/
```

**Copying rules to a project:**

Rules are copied to projects via `/plan-project` command or manually:
```bash
mkdir -p .claude/rules
cp ~/.claude/skills/tailwind-v4-shadcn/rules/tailwind-v4-shadcn.md .claude/rules/
```

**Current skills with rules:** Most skills have rules (run `ls skills/*/rules/*.md | wc -l` to count)

**Key examples:**
- `tailwind-v4-shadcn` - v3→v4 syntax corrections
- `cloudflare-worker-base` - Export patterns, wrangler.jsonc, ES modules
- `ai-sdk-core` - v4→v5 breaking changes
- `clerk-auth` - v6 async auth(), API version changes
- `openai-api` - GPT-5.1 reasoning defaults, model names

**Strategic guidance:** See [planning/SKILLS_VS_RULES.md](planning/SKILLS_VS_RULES.md) for:
- When to put content in skills vs rules
- Decision framework (teaching vs correcting)
- Rule extraction opportunities for existing skills

---

## Commands & Scripts

### Installing Skills

```bash
# Install single skill (creates symlink to ~/.claude/skills/)
./scripts/install-skill.sh cloudflare-worker-base

# Install all skills
./scripts/install-all.sh

# Verify and maintain symlinks
./scripts/check-symlinks.sh          # Check for issues
./scripts/check-symlinks.sh --fix    # Auto-repair symlinks

# Verify installation
ls -la ~/.claude/skills/
```

### Development

```bash
# Check all versions (npm, GitHub, metadata, AI models, marketplace sync)
./scripts/check-all-versions.sh                    # All skills
./scripts/check-all-versions.sh cloudflare-worker-base  # Specific skill

# Or run individual checkers
./scripts/check-npm-versions.sh [skill-name]       # NPM packages only
./scripts/check-github-releases.sh [skill-name]    # GitHub releases only
./scripts/check-metadata.sh [skill-name]           # Metadata only
./scripts/check-ai-models.sh [skill-name]          # AI models only
./scripts/check-marketplace-sync.sh                # Marketplace sync only
./scripts/check-marketplace-sync.sh --fix          # Auto-fix marketplace.json

# Create new skill from template
cp -r templates/skill-skeleton/ skills/new-skill-name/
```

### Marketplace & Release

```bash
# Generate marketplace manifests for all skills
./scripts/generate-plugin-manifests.sh

# Generate manifest for specific skill
./scripts/generate-plugin-manifests.sh <skill-name>

# Pre-release safety checks (secrets, docs, config)
./scripts/release-check.sh

# Audit/review a skill (knowledge gaps, errors, token efficiency)
./scripts/review-skill.sh <skill-name>
```

**Output Files** (auto-generated, gitignored):
- `VERSIONS_REPORT.md` - Version check results
- `SKILLS_OPTIMIZATION_REPORT.md` - Description optimization analysis
- Individual skill manifests: `skills/*/. claude-plugin/plugin.json`

### Testing

```bash
# After installing skill, ask Claude Code:
"Use the cloudflare-worker-base skill to set up a new project"

# Claude should discover and propose using the skill automatically
```

### Git Workflow

```bash
# Create feature branch
git checkout -b add-new-skill

# Make changes
git add skills/new-skill/
git commit -m "Add new-skill for [use case]

- Description of what it does
- Token savings: ~XX%
- Errors prevented: X

Production tested: [evidence]"

# Push and create PR
git push origin add-new-skill
```

---

## Quality Standards

### Before Committing (Checklist)

Use [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md) to verify:

- [ ] YAML frontmatter valid (name + description)
- [ ] Description includes "Use when" scenarios
- [ ] Keywords comprehensive (technologies, use cases, errors)
- [ ] Third-person description style
- [ ] Instructions in imperative form
- [ ] Resources organized (scripts/, references/, assets/)
- [ ] Templates tested and working
- [ ] Package versions current
- [ ] Known issues documented with sources
- [ ] LICENSE field present (MIT)
- [ ] README.md has auto-trigger keywords
- [ ] Tested in ~/.claude/skills/
- [ ] Token efficiency measured (≥50%)

### Compliance Verification

Compare against:
1. [planning/claude-code-skill-standards.md](planning/claude-code-skill-standards.md) - Our standards
2. [planning/STANDARDS_COMPARISON.md](planning/STANDARDS_COMPARISON.md) - Official vs ours
3. https://github.com/anthropics/skills - Official reference

---

## Token Efficiency Metrics

**Why This Matters**: Skills save massive amounts of tokens by preventing trial-and-error.

| Scenario | Without Skill | With Skill | Savings |
|----------|---------------|------------|---------|
| Setup Tailwind v4 + shadcn | ~15k tokens, 2-3 errors | ~5k tokens, 0 errors | ~67% |
| Cloudflare Worker setup | ~12k tokens, 1-2 errors | ~4k tokens, 0 errors | ~67% |
| D1 Database integration | ~10k tokens, 2 errors | ~4k tokens, 0 errors | ~60% |
| **Average** | **~12k tokens** | **~4.5k tokens** | **~62%** |

**Errors Prevented**: All 6-8 documented errors per skill = 100% error prevention

---

## Common Pitfalls to Avoid

See [planning/COMMON_MISTAKES.md](planning/COMMON_MISTAKES.md) for detailed examples.

**Quick List**:
- ❌ Missing YAML frontmatter (skill invisible to Claude)
- ❌ Non-standard frontmatter fields (use only name, description, license, allowed-tools, metadata)
- ❌ Second-person descriptions ("You should..." instead of "This skill should be used when...")
- ❌ Vague descriptions (no "Use when" scenarios)
- ❌ Missing keywords (reduces discoverability)
- ❌ Outdated package versions
- ❌ Untested templates
- ❌ No production validation

---

## External Resources

### Official Anthropic
- **Skills Repository**: https://github.com/anthropics/skills
- **Skills Spec**: https://github.com/anthropics/skills/blob/main/agent_skills_spec.md
- **Skill Creator**: https://github.com/anthropics/skills/blob/main/skill-creator/SKILL.md
- **Engineering Blog**: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills

### Support Articles
- [What are skills?](https://support.claude.com/en/articles/12512176-what-are-skills)
- [Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude)
- [Creating custom skills](https://support.claude.com/en/articles/12512198-creating-custom-skills)

### Claude Code Docs
- **Skills Documentation**: https://docs.claude.com/en/docs/claude-code/skills
- **Overview**: https://docs.claude.com/en/docs/claude-code/overview

---

## Maintenance

### Regular Tasks

**Weekly**:
- Check for deprecated AI models: `./scripts/check-ai-models.sh`
- Review and update model references in skills

**Monthly**:
- Update minor/patch versions: `./scripts/check-npm-versions.sh`
- Update GitHub releases: `./scripts/check-github-releases.sh`
- Update templates as needed

**Quarterly** (Every 3 months):
- Full audit: `./scripts/check-all-versions.sh`
- Review `VERSIONS_REPORT.md` for action items
- Update to latest stable versions
- Re-test all skills
- Update `metadata.last_verified` dates

**When Package Updates**:
1. Review `VERSIONS_REPORT.md` for breaking changes
2. Check breaking changes in changelogs
3. Update `templates/package.json` files
4. Update version references in `SKILL.md`
5. Test thoroughly in example projects
6. Document migration if needed
7. Commit with detailed changelog

**When Standards Change**:
- Review official Anthropic skills repo
- Update planning/claude-code-skill-standards.md
- Update planning/STANDARDS_COMPARISON.md
- Audit existing skills for compliance

---

## Getting Help

**Documentation Issues?**
- Check [START_HERE.md](START_HERE.md) for navigation
- Read [planning/COMMON_MISTAKES.md](planning/COMMON_MISTAKES.md)
- Review working examples in `skills/` directory

**Technical Issues?**
- Open issue: https://github.com/jezweb/claude-skills/issues
- Email: jeremy@jezweb.net
- Check official Claude Code docs

**Want to Contribute?**
- Read [CONTRIBUTING.md](CONTRIBUTING.md)
- Use templates in `templates/`
- Follow [QUICK_WORKFLOW.md](QUICK_WORKFLOW.md)
- Verify with [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md)

---

## Project Goals

### Short Term (Next 3 Months)
- Complete Batch 2 skills (clerk-auth, hono-routing, react-hook-form-zod)
- Add Batch 3 (tanstack-query)
- Maintain 100% compliance with official standards
- Keep all package versions current

### Long Term (Next Year)
- Expand to 20+ production skills
- Community contributions
- Validation/packaging scripts (à la Anthropic)
- Automated testing for skill discovery
- Public skill marketplace compatibility

---

## Success Metrics

**Quality**:
- ✅ 100% compliance with official Anthropic standards
- ✅ All skills production-tested
- ✅ Package versions current (checked quarterly)
- ✅ Zero reported errors from documented issues

**Efficiency**:
- ✅ Average 60%+ token savings
- ✅ 100% error prevention (vs manual setup)
- ✅ Sub-5-minute skill creation (with templates)
- ✅ First-try skill discovery rate: 95%+

**Adoption**:
- ✅ 9 skills in production
- ✅ GitHub stars: Growing
- ✅ Community contributions: Welcome
- ✅ Deployed examples: Verified working

---

**Last Updated**: 2025-12-15
**Next Review**: 2026-03-15 (Quarterly)
**Maintainer**: Jeremy Dawes | jeremy@jezweb.net | https://jezweb.com.au
