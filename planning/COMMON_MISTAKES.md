# Common Mistakes to Avoid

**Purpose**: Learn from failures without experiencing them yourself

**Last Updated**: 2025-10-21

---

## CRITICAL MISTAKES (Break Functionality)

### Mistake #1: Missing YAML Frontmatter

❌ **WRONG** (Skill is invisible to Claude):
```markdown
# My Awesome Skill

This skill helps you build stuff...
```

✅ **CORRECT**:
```markdown
---
name: my-awesome-skill
description: |
  This skill provides comprehensive knowledge for building stuff.

  Use when: specific scenarios

  Keywords: technology, use-case, errors
license: MIT
---

# My Awesome Skill

This skill provides...
```

**Why It Matters**: Without frontmatter, Claude Code **cannot discover your skill**. It's invisible.

**Real Impact**: cloudflare-workers-ai was broken until we added frontmatter (audit: 2025-10-21)

---

### Mistake #2: Invalid YAML Frontmatter

❌ **WRONG** (Breaks parsing):
```yaml
---
name = my-skill  # ← Wrong: Use colon, not equals
description This skill...  # ← Wrong: Missing colon
license MIT  # ← Wrong: Use quotes or pipe for multiline
--  # ← Wrong: Missing third dash
```

✅ **CORRECT**:
```yaml
---
name: my-skill
description: |
  This skill provides...
license: MIT
---
```

**How to Verify**: Copy frontmatter to https://yaml-online-parser.appspot.com/

---

### Mistake #3: Name Doesn't Match Directory

❌ **WRONG**:
```
Directory: skills/cloudflare-workers/
SKILL.md frontmatter: name: cloudflare-worker  ← Mismatch!
```

✅ **CORRECT**:
```
Directory: skills/cloudflare-workers/
SKILL.md frontmatter: name: cloudflare-workers  ← Match!
```

**Why It Matters**: Name MUST match directory name exactly (per official spec)

---

## DISCOVERY MISTAKES (Reduce Effectiveness)

### Mistake #4: Vague Description

❌ **WRONG**:
```yaml
description: "A skill for Cloudflare"
```

✅ **CORRECT**:
```yaml
description: |
  This skill provides production-tested patterns for Cloudflare Workers with
  Hono routing, Vite plugin, and Static Assets.

  Use when: creating Workers projects, configuring Hono routing, deploying with
  Wrangler, or encountering "Static Assets 404" or routing conflicts.

  Keywords: Cloudflare Workers, Hono, Wrangler, Static Assets, CF Workers,
  deployment errors, routing issues
```

**Impact**: Vague = Poor discovery. Detailed = Good discovery.

---

### Mistake #5: Missing Keywords

❌ **WRONG** (Minimal keywords):
```yaml
description: This skill helps with React setup.
```

✅ **CORRECT** (Comprehensive keywords):
```yaml
description: |
  This skill provides React + Vite + TypeScript setup patterns.

  Use when: scaffolding Vite projects, configuring TypeScript for React,
  setting up HMR, or encountering "React is not defined" or HMR issues.

  Keywords: react, vite, typescript, hmr, vite config, react hooks,
  jsx transform, "React is not defined", "HMR not working"
```

**Pro Tip**: Include error messages users search for!

---

### Mistake #6: Second-Person Description

❌ **WRONG** (Second-person):
```yaml
description: Use this skill when you want to build Workers.
```

✅ **CORRECT** (Third-person):
```yaml
description: |
  This skill should be used when building Cloudflare Workers projects.
```

**Why**: Official Anthropic standard uses third-person

---

## STRUCTURE MISTAKES

### Mistake #7: Non-Standard Frontmatter Fields

❌ **WRONG** (Custom fields):
```yaml
---
name: my-skill
version: 1.0.0  # ← Not in spec
author: Me  # ← Not in spec
tags:  # ← Not in spec
  - cloudflare
description: ...
---
```

✅ **CORRECT** (Standard fields only):
```yaml
---
name: my-skill
description: |
  ...
license: MIT
# Optional official fields:
# allowed-tools: [bash, python]
# metadata:
#   category: "cloudflare"
---
```

**Impact**: Non-standard fields may be ignored or break future versions

**Real Example**: cloudflare-vectorize used custom fields - fixed in audit (2025-10-21)

---

### Mistake #8: Second-Person Instructions

❌ **WRONG**:
```markdown
To set up the project, you should run:
```

✅ **CORRECT**:
```markdown
To set up the project, run:
```

**Rule**: Use imperative/infinitive form, not second-person

---

### Mistake #9: Wrong Directory Names

❌ **WRONG**:
```
skill-name/
├── SKILL.md
├── template/  # ← Singular
├── reference/  # ← Singular
└── script/  # ← Singular
```

✅ **CORRECT** (Official Anthropic structure):
```
skill-name/
├── SKILL.md
├── scripts/  # ← Plural
├── references/  # ← Plural
└── assets/  # ← Plural
```

**Note**: We're standardizing to official naming

---

## CONTENT MISTAKES

### Mistake #10: Outdated Package Versions

❌ **WRONG**:
```yaml
# Documented versions (not verified):
- hono@3.5.1  # ← Old version
```

✅ **CORRECT**:
```yaml
# Verified 2025-10-21:
- hono@4.10.1  # ← Latest stable
```

**Process**:
```bash
npm view hono version  # Verify before documenting
```

---

### Mistake #11: Untested Templates

❌ **WRONG**:
```typescript
// Template that was never tested
import { Hono } from 'hono'
const app = new Hono()
// ... untested code
```

✅ **CORRECT**:
```typescript
// Tested in production: https://example.com
import { Hono } from 'hono'
const app = new Hono()
// ... verified working code
```

**Process**: Build example project using templates before committing

---

### Mistake #12: No Error Sources

❌ **WRONG**:
```markdown
### Issue: Colors Not Working
This is a common problem.
```

✅ **CORRECT**:
```markdown
### Issue: Colors Not Working
**Source**: GitHub Issue #3955 (https://github.com/honojs/hono/issues/3955)
**Why**: Using wrong export pattern
**Fix**: Use `export default app` not `{ fetch: app.fetch }`
```

---

## TESTING MISTAKES

### Mistake #13: Not Installing Locally

❌ **WRONG**:
```bash
# Just commit without testing
git add skills/my-skill
git commit -m "Add skill"
```

✅ **CORRECT**:
```bash
# Install and test first
./scripts/install-skill.sh my-skill
# Try using it in Claude Code
# Verify discovery works
# THEN commit
```

---

### Mistake #14: Leaving [TODO:] Markers

❌ **WRONG**:
```markdown
## Quick Start

[TODO: Fill this in later]
```

✅ **CORRECT**:
```markdown
## Quick Start

1. Install dependencies: `npm install hono@4.10.1`
2. Configure wrangler.jsonc
3. Run dev server: `npm run dev`
```

**Check Before Commit**:
```bash
grep -r "\[TODO" skills/my-skill/
# Should return nothing
```

---

## GIT MISTAKES

### Mistake #15: Vague Commit Messages

❌ **WRONG**:
```bash
git commit -m "Add skill"
```

✅ **CORRECT**:
```bash
git commit -m "Add cloudflare-d1 skill for D1 database

- Provides D1 setup with wrangler + migrations
- Token savings: ~58%
- Errors prevented: 6
- Package versions: wrangler@4.43.0

Production tested: Working in 3 projects
Research log: planning/research-logs/cloudflare-d1.md"
```

---

### Mistake #16: Committing Secrets

❌ **WRONG**:
```typescript
// template file
const API_KEY = "sk-real-api-key-here"  // ← NEVER!
```

✅ **CORRECT**:
```typescript
// template file
const API_KEY = process.env.API_KEY  // ← Use env vars
```

**Check Before Commit**:
```bash
git diff | grep -i "api.key\|secret\|password"
```

---

## DOCUMENTATION MISTAKES

### Mistake #17: No "Last Updated" Date

❌ **WRONG**:
```markdown
# My Skill

This skill helps with...
```

✅ **CORRECT**:
```markdown
# My Skill

**Status**: Production Ready ✅
**Last Updated**: 2025-10-21
**Latest Versions**: package@x.y.z
```

---

### Mistake #18: Broken Links

❌ **WRONG**:
```markdown
See [documentation](./docs/guide.md)  # ← File doesn't exist
```

✅ **CORRECT**:
```markdown
See [documentation](references/guide.md)  # ← Actual path
```

**Verify**:
```bash
# Test all links work
for link in $(grep -o '\[.*\](.*\.md)' SKILL.md); do
  # Verify file exists
done
```

---

## WORKFLOW MISTAKES

### Mistake #19: No Research Log

❌ **WRONG**:
```bash
# Build skill from memory
# No documentation of research
```

✅ **CORRECT**:
```bash
# Create research log first
touch planning/research-logs/my-skill.md
# Document:
# - Official docs reviewed
# - Package versions verified
# - Issues researched
# - Example built
```

---

### Mistake #20: Skipping Checklist

❌ **WRONG**:
```bash
# Commit without verification
git commit -m "Done!"
```

✅ **CORRECT**:
```bash
# Verify against ONE_PAGE_CHECKLIST.md
# Ensure all boxes checked
# THEN commit
```

---

## BEFORE/AFTER EXAMPLES

### Example 1: cloudflare-workers-ai (Fixed 2025-10-21)

**BEFORE** (Broken):
```markdown
# Cloudflare Workers AI - Complete Reference

Production-ready knowledge domain...
```
❌ No frontmatter = Invisible to Claude Code

**AFTER** (Fixed):
```yaml
---
name: Cloudflare Workers AI
description: |
  This skill provides Workers AI knowledge...

  Use when: implementing AI inference...

  Keywords: workers ai, llm, @cf/meta/llama...
license: MIT
---

# Cloudflare Workers AI - Complete Reference
```
✅ Properly discoverable

---

### Example 2: cloudflare-vectorize (Fixed 2025-10-21)

**BEFORE** (Non-standard):
```yaml
---
name: cloudflare-vectorize
version: 1.0.0  # ← Custom field
author: Jezweb  # ← Custom field
tags: [cloudflare, vectorize]  # ← Custom field
description: Complete guide...
---
```
⚠️ Works but non-standard

**AFTER** (Standard):
```yaml
---
name: Cloudflare Vectorize
description: |
  This skill provides comprehensive knowledge...

  Use when: creating vector indexes...

  Keywords: vectorize, vector database, RAG...
license: MIT
---
```
✅ Follows official spec

---

## PREVENTION CHECKLIST

Before committing, verify you DIDN'T make these mistakes:

- [ ] ✅ YAML frontmatter exists
- [ ] ✅ Frontmatter is valid YAML
- [ ] ✅ `name` matches directory name
- [ ] ✅ Description is detailed (not vague)
- [ ] ✅ Keywords comprehensive
- [ ] ✅ Third-person description
- [ ] ✅ Imperative instructions (not "you should")
- [ ] ✅ Only standard frontmatter fields
- [ ] ✅ Package versions current
- [ ] ✅ Templates tested
- [ ] ✅ Error sources documented
- [ ] ✅ Installed and tested locally
- [ ] ✅ No [TODO:] markers
- [ ] ✅ No secrets in code
- [ ] ✅ "Last Updated" date present
- [ ] ✅ All links work
- [ ] ✅ Research log created
- [ ] ✅ Checked ONE_PAGE_CHECKLIST.md

**All boxes checked** = Ready to commit! ✅

---

## Learn More

- [START_HERE.md](../START_HERE.md) - Workflow overview
- [ONE_PAGE_CHECKLIST.md](../ONE_PAGE_CHECKLIST.md) - Verification checklist
- [planning/STANDARDS_COMPARISON.md](STANDARDS_COMPARISON.md) - Official standards
- [CLOUDFLARE_SKILLS_AUDIT.md](../CLOUDFLARE_SKILLS_AUDIT.md) - Example audit

---

**Remember**: These mistakes were all made during development. Learn from them!
