# Claude Code Skill Standards

**Last Updated**: 2025-10-20
**Source**: https://docs.claude.com/en/docs/claude-code/skills
**Reference Skill**: ~/.claude/skills/tailwind-v4-shadcn/

---

## What Are Claude Code Skills?

Skills are modular capabilities stored in `~/.claude/skills/` that Claude Code automatically discovers and uses based on user requests.

### Key Characteristics:
- **Model-invoked** - Claude autonomously decides when to use them
- **Description-based discovery** - Claude matches skills based on YAML frontmatter description
- **Templates and documentation** - Help users set up projects quickly
- **No executable code** - Skills provide instructions and templates, not running code

---

## Required Structure

```
~/.claude/skills/skill-name/
├── SKILL.md              # REQUIRED - Instructions with YAML frontmatter
├── README.md             # OPTIONAL - Quick reference (our addition)
├── templates/            # OPTIONAL - File templates
└── reference/            # OPTIONAL - Additional documentation
```

---

## SKILL.md Format (REQUIRED)

### YAML Frontmatter (Top of File)

```yaml
---
name: Skill Display Name
description: |
  What the skill does and when Claude should use it.

  Use when: specific scenarios where this skill applies.

  Keywords: keyword1, keyword2, error messages, technology names
---
```

**Critical**: The `description` field determines when Claude uses the skill. It MUST include:
- What the skill does
- When Claude should use it
- Keywords for discovery

### Markdown Content (After Frontmatter)

```markdown
# Skill Title

Detailed instructions for Claude to follow when using this skill.

## Section 1: Setup
Step-by-step instructions...

## Section 2: Configuration
Examples and code snippets...

## Common Issues
Known problems and solutions...
```

---

## Example: Tailwind v4 Skill

**SKILL.md Frontmatter**:
```yaml
---
name: Tailwind v4 + shadcn/ui Stack
description: |
  Production-tested setup for Tailwind CSS v4 with shadcn/ui, Vite, and React.

  Use when: initializing React projects with Tailwind v4, setting up shadcn/ui,
  implementing dark mode, debugging CSS variable issues, fixing theme switching,
  migrating from Tailwind v3, or encountering color/theming problems.

  Keywords: Tailwind v4, shadcn/ui, @tailwindcss/vite, @theme inline, dark mode,
  CSS variables, hsl() wrapper, components.json, React theming, theme switching,
  colors not working, variables broken, theme not applying
---
```

**Directory Structure**:
```
tailwind-v4-shadcn/
├── SKILL.md                      # Full instructions
├── README.md                     # Quick reference (our addition)
├── templates/                    # Ready-to-copy files
│   ├── vite.config.ts
│   ├── index.css
│   ├── components.json
│   └── ...
└── reference/                    # Deep-dive docs
    ├── architecture.md
    ├── common-gotchas.md
    └── ...
```

---

## Our Additions (Beyond Minimum)

We're adding these for better quality:

### 1. README.md
**Purpose**: Quick reference with explicit trigger keywords

**Format**:
```markdown
# Skill Name

**Status**: Production Ready ✅
**Last Updated**: 2025-10-20

## Auto-Trigger Keywords
- keyword1
- keyword2
- error message

## What This Skill Does
Brief description...

## Known Issues Prevented
Table of errors this skill fixes...
```

### 2. templates/
**Purpose**: Working file templates users can copy

**Requirements**:
- Complete, tested files
- Latest package versions
- No hardcoded secrets
- Well-commented

### 3. reference/
**Purpose**: Additional documentation for complex topics

**Examples**:
- architecture.md - Deep dive into patterns
- common-gotchas.md - Troubleshooting guide
- migration-guide.md - Upgrading from old versions

---

## Discovery Mechanism

### How Claude Finds Skills

1. User makes a request
2. Claude checks `~/.claude/skills/` directory
3. Reads `SKILL.md` frontmatter from each skill
4. Matches `description` field against user's request
5. If match > threshold, proposes using the skill

### Trigger Keywords

**In frontmatter description**, include:
- **Technology names**: "Tailwind v4", "Cloudflare Workers"
- **Use cases**: "dark mode setup", "JWT verification"
- **Error messages**: "colors not working", "build fails"
- **Related terms**: "shadcn/ui", "theme switching"

**Example**:
```yaml
description: |
  Use when: setting up Cloudflare Workers, configuring Hono routing,
  deploying with wrangler, or encountering "Static Assets not found" errors.

  Keywords: Cloudflare Workers, Hono, wrangler, Static Assets, CF Workers,
  deployment, serverless
```

---

## Quality Standards

### Before Committing a Skill

- [ ] **SKILL.md has valid YAML frontmatter**
- [ ] **Description includes "Use when" scenarios**
- [ ] **Keywords cover common searches and errors**
- [ ] **Instructions are clear and complete**
- [ ] **Templates are tested and working**
- [ ] **Versions are documented**
- [ ] **Official docs are referenced**
- [ ] **No hardcoded secrets**

### Documentation Requirements

**Must Include**:
- Version numbers for all packages
- Links to official documentation
- Known issues with sources (GitHub issues, etc.)
- Last updated date
- Production testing evidence

**Must Not Include**:
- Outdated patterns
- Deprecated approaches
- Unverified information
- Hardcoded credentials
- Untested templates

---

## File Naming Conventions

- **SKILL.md** - Must be exactly this name (case-sensitive)
- **README.md** - Optional, our addition
- **templates/** - Lowercase, plural
- **reference/** - Lowercase, plural
- **examples/** - Lowercase, plural (if used)

---

## Best Practices

### Description Field
✅ **Good**:
```yaml
description: |
  Sets up Cloudflare Workers with Vite, Hono routing, and Static Assets.

  Use when: creating new CF Workers projects, adding Vite to existing Workers,
  or encountering "Static Assets 404" errors.

  Keywords: Cloudflare Workers, CF Workers, Hono, wrangler, Vite, Static Assets
```

❌ **Bad**:
```yaml
description: "Cloudflare Workers skill"
```

### Instructions
✅ **Good**: Step-by-step with code examples
❌ **Bad**: Vague descriptions without specifics

### Templates
✅ **Good**: Complete, working files with comments
❌ **Bad**: Code snippets or incomplete examples

---

## Maintenance

### When to Update
- New major version of key dependency
- Security vulnerability reported
- Breaking change announced
- Official docs updated
- Users report skill doesn't work

### Update Process
1. Re-verify official documentation
2. Test with new versions
3. Update templates
4. Update SKILL.md
5. Update "Last Updated" date
6. Commit with detailed changelog

---

## Examples from Real Skills

### Tailwind v4 Skill
**What it teaches us**:
- ✅ Comprehensive frontmatter with keywords
- ✅ Templates directory with working files
- ✅ Reference docs for deep dives
- ✅ Production-tested evidence

### Firecrawl Scraper Skill
**What it teaches us**:
- ✅ Clear use cases in description
- ✅ API key configuration documented
- ✅ Python and TypeScript templates
- ✅ Error handling patterns

---

## Official Documentation

**Primary Source**: https://docs.claude.com/en/docs/claude-code/skills

**Key Points from Official Docs**:
- Skills are model-invoked (Claude decides when to use them)
- Description field is critical for discovery
- SKILL.md with YAML frontmatter is required
- Supporting files are optional
- Can be personal (~/.claude/skills/) or project-level (.claude/skills/)

---

## Summary

### Minimum Required
```
skill-name/
└── SKILL.md (with YAML frontmatter + instructions)
```

### Our Standard
```
skill-name/
├── SKILL.md              # Required: Full instructions
├── README.md             # Our addition: Quick reference
├── templates/            # Our addition: Working files
└── reference/            # Optional: Deep-dive docs
```

**Why we add more**: Better discoverability, proven templates, comprehensive documentation leads to higher quality skills that actually help users.

---

**Next**: Use this standard when building all our skills.
