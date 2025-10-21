# Claude Skills - Project Context

**Repository**: https://github.com/jezweb/claude-skills
**Purpose**: Production-ready skills for Claude Code CLI
**Owner**: Jeremy Dawes (Jez) | Jezweb
**Status**: Active Development | 9 Skills Complete

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

**Last Verified**: 2025-10-21

---

## Directory Structure

```
claude-skills/
├── START_HERE.md                 # ← Read this first!
├── CLAUDE.md                     # ← You are here
├── ONE_PAGE_CHECKLIST.md         # Quick verification
├── QUICK_WORKFLOW.md             # 5-minute skill creation
├── README.md                     # Public-facing overview
├── CONTRIBUTING.md               # Contribution guidelines
├── CLOUDFLARE_SKILLS_AUDIT.md    # Example compliance audit
├── ATOMIC-SKILLS-SUMMARY.md      # Skill philosophy
├── CHANGELOG.md                  # Version history
├── LICENSE                       # MIT License
│
├── skills/                       # ← All production skills
│   ├── tailwind-v4-shadcn/       # Gold standard example
│   ├── cloudflare-worker-base/
│   ├── cloudflare-d1/
│   ├── cloudflare-r2/
│   ├── cloudflare-kv/
│   ├── cloudflare-workers-ai/
│   ├── cloudflare-vectorize/
│   ├── cloudflare-queues/
│   └── firecrawl-scraper/
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
│   └── check-versions.sh         # Verify package versions
│
└── examples/                     # Working example projects
    └── cloudflare-worker-base-test/
```

---

## Current Status (2025-10-21)

### ✅ Completed Skills (9)

**Cloudflare Suite** (7 skills):
1. **cloudflare-worker-base** - Hono + Vite + Static Assets foundation
2. **cloudflare-d1** - D1 serverless SQL database
3. **cloudflare-r2** - R2 object storage (S3-compatible)
4. **cloudflare-kv** - KV key-value storage
5. **cloudflare-workers-ai** - Workers AI model inference
6. **cloudflare-vectorize** - Vector database for RAG/search
7. **cloudflare-queues** - Message queues for async processing

**UI/Tooling** (2 skills):
8. **tailwind-v4-shadcn** - Tailwind v4 + shadcn/ui + Vite + React
9. **firecrawl-scraper** - Firecrawl v2 web scraping API

**All skills**:
- ✅ Production-tested
- ✅ Fully compliant with official standards
- ✅ Package versions verified current
- ✅ Token savings: 50-70%
- ✅ Known errors documented and prevented

### 📋 Planned Skills (4)

**Batch 2 - Auth & Frameworks**:
1. **clerk-auth** - Clerk authentication patterns
2. **hono-routing** - Hono routing best practices
3. **react-hook-form-zod** - Forms + validation

**Batch 3 - Data Management**:
4. **tanstack-query** - Server state management

---

## Development Workflow

### Standard Workflow (From Scratch)

```
1. RESEARCH
   • Read planning/research-protocol.md
   • Check Context7 MCP for library docs
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
   • Run check-versions.sh if applicable

5. COMMIT
   • git add skills/new-skill
   • git commit -m "Add new-skill for [use case]"
   • Update planning/skills-roadmap.md
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
git add skills/my-skill && git commit -m "Add my-skill"
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
- **Metadata** (name + description): Always in context (~100 words)
- **SKILL.md body**: Loaded when skill triggers (<5k words)
- **Bundled resources**: Loaded as needed by Claude

---

## Commands & Scripts

### Installing Skills

```bash
# Install single skill (creates symlink to ~/.claude/skills/)
./scripts/install-skill.sh cloudflare-worker-base

# Install all skills
./scripts/install-all.sh

# Verify installation
ls -la ~/.claude/skills/
```

### Development

```bash
# Check package versions
./scripts/check-versions.sh skills/cloudflare-worker-base/

# Create new skill from template
cp -r templates/skill-skeleton/ skills/new-skill-name/
```

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
3. [CLOUDFLARE_SKILLS_AUDIT.md](CLOUDFLARE_SKILLS_AUDIT.md) - Example audit
4. https://github.com/anthropics/skills - Official reference

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

**Quarterly** (Every 3 months):
- Check package versions: `scripts/check-versions.sh`
- Update to latest stable versions
- Re-test all skills
- Update "Last Verified" dates

**When Package Updates**:
- Check breaking changes in changelog
- Update skill templates
- Test thoroughly
- Document migration if needed

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

**Last Updated**: 2025-10-21
**Next Review**: 2026-01-21 (Quarterly)
**Maintainer**: Jeremy Dawes | jeremy@jezweb.net | https://jezweb.com.au
