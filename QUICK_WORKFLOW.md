# Quick Workflow: Build a Skill in 5 Minutes

**Goal**: Create a production-ready skill from scratch as fast as possible.

**Prerequisites**: Read [START_HERE.md](START_HERE.md) once

---

## The 5-Minute Workflow

### Step 1: Copy Template (30 seconds)

```bash
cd ~/Documents/claude-skills
cp -r templates/skill-skeleton/ skills/my-skill-name/
cd skills/my-skill-name/
```

**Done when**: You have a `skills/my-skill-name/` directory

---

### Step 2: Fill SKILL.md Front matter (2 minutes)

Open `SKILL.md` and fill the [TODO:] markers in the YAML frontmatter:

```yaml
---
name: my-skill-name  # Must match directory name
description: |
  This skill provides... [write 3-5 sentences]

  Use when: [scenarios]

  Keywords: [tech, errors, use-cases]
license: MIT
---
```

**Done when**: All [TODO:] in frontmatter are replaced

---

### Step 3: Write Core Instructions (1.5 minutes)

Fill in the [TODO:] markers in SKILL.md body:
- Quick Start section (how to use in <5 min)
- Critical Rules (Always Do / Never Do)
- Common patterns

**Done when**: Someone could follow your instructions

---

### Step 4: Add Keywords to README.md (30 seconds)

Open `README.md` and add auto-trigger keywords:
- Primary: Exact technology names
- Secondary: Related terms
- Errors: Common error messages

**Done when**: Keywords cover all ways someone might mention this skill

---

### Step 5: Test Locally (30 seconds)

```bash
# Install skill
./scripts/install-skill.sh my-skill-name

# Verify
ls -la ~/.claude/skills/my-skill-name
```

Ask Claude Code to use the skill:
```
"Use the my-skill-name skill to help me with [task]"
```

**Done when**: Claude discovers and uses the skill

---

## Detailed Workflow (For First-Time Builders)

### Phase 1: Research (30-60 minutes)

**Skip if you're already an expert in the domain**

1. **Check existing skills**
   ```bash
   ls skills/
   # Is this skill already covered?
   ```

2. **Find official docs**
   - Use Context7 MCP: `mcp__context7__resolve-library-id`
   - Check official website
   - Find GitHub repo

3. **Verify package versions**
   ```bash
   npm view <package-name> version
   ```

4. **Build example project**
   - Start from scratch
   - Document every error you hit
   - Save working example

5. **Create research log**
   ```bash
   touch planning/research-logs/my-skill.md
   # Document: sources, versions, issues found
   ```

**Done when**: You have a working example and research log

---

### Phase 2: Template (5-10 minutes)

1. **Copy template**
   ```bash
   cp -r templates/skill-skeleton/ skills/my-skill-name/
   ```

2. **Update frontmatter**
   - `name`: Match directory (lowercase-hyphen-case)
   - `description`: 3+ sentences, third-person, with keywords
   - `license`: MIT (or your choice)

3. **Fill SKILL.md sections**
   - Quick Start (< 5 min to first result)
   - Critical Rules (what to do/avoid)
   - Known Issues (with GitHub links)
   - Configuration examples
   - Common patterns

4. **Add README keywords**
   - Primary (3-5): Exact tech names
   - Secondary (5-10): Related terms
   - Errors (2-5): Common error messages

5. **Add resources** (if applicable)
   - `scripts/`: Executable code
   - `references/`: Documentation
   - `assets/`: Templates, images

**Done when**: All [TODO:] markers replaced with real content

---

### Phase 3: Test (5-10 minutes)

1. **Install locally**
   ```bash
   ./scripts/install-skill.sh my-skill-name
   ```

2. **Test discovery**
   - Open Claude Code
   - Mention the technology
   - Claude should suggest your skill

3. **Test templates**
   - Copy any templates from `assets/`
   - Build a project using them
   - Verify everything works

4. **Verify checklist**
   - Open [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md)
   - Check off each item
   - Fix any that fail

**Done when**: All checklist items pass

---

### Phase 4: Commit (2-5 minutes)

1. **Review changes**
   ```bash
   git diff skills/my-skill-name/
   ```

2. **Add and commit**
   ```bash
   git add skills/my-skill-name/
   git commit -m "Add my-skill-name for [use case]

   - Provides [feature]
   - Token savings: ~XX%
   - Errors prevented: X

   Production tested: [evidence]"
   ```

3. **Update roadmap**
   - Edit `planning/skills-roadmap.md`
   - Mark skill as complete

4. **Push**
   ```bash
   git push
   ```

**Done when**: Skill is in GitHub

---

## Time Estimates

| Task | First Time | Experienced | Notes |
|------|-----------|-------------|-------|
| Research | 30-60 min | Skip | Only needed once per domain |
| Copy template | 30 sec | 30 sec | Simple command |
| Fill frontmatter | 2-5 min | 1-2 min | Gets faster with practice |
| Write instructions | 10-20 min | 5-10 min | Depends on complexity |
| Add keywords | 2 min | 1 min | Easy |
| Test locally | 5-10 min | 2-3 min | Includes building example |
| Verify checklist | 5 min | 2 min | Scan and check |
| Commit | 2-5 min | 1-2 min | Review and push |
| **Total** | **1-2 hours** | **15-20 min** | Faster after first skill |

---

## Quick Command Reference

```bash
# Copy template
cp -r templates/skill-skeleton/ skills/my-skill-name/

# Install skill
./scripts/install-skill.sh my-skill-name

# Verify installation
ls -la ~/.claude/skills/my-skill-name

# Check package versions
npm view <package> version

# Create research log
touch planning/research-logs/my-skill.md

# Commit
git add skills/my-skill-name/
git commit -m "Add my-skill-name"
git push
```

---

## Common Shortcuts

### Experienced Builder Shortcuts

If you're building your 3rd+ skill, you can:

1. **Skip research** if you know the domain
2. **Copy similar skill** instead of template
   ```bash
   cp -r skills/cloudflare-d1/ skills/cloudflare-new/
   # Then find-replace to update
   ```
3. **Skip README** if skill is simple (just frontmatter matters)
4. **Skip test project** if templates are straightforward

### Using Existing Skills as Templates

Our best templates to copy from:

| Copy This | When Building |
|-----------|---------------|
| `cloudflare-worker-base/` | New Cloudflare service |
| `tailwind-v4-shadcn/` | UI framework skill |
| `firecrawl-scraper/` | API integration skill |

---

## Workflow Decision Tree

```
Do you know the domain well?
  ├─ YES → Skip research, go straight to template
  └─ NO  → Research first (30-60 min)

Is this your first skill?
  ├─ YES → Follow detailed workflow
  └─ NO  → Use 5-minute workflow

Is skill similar to existing skill?
  ├─ YES → Copy that skill and modify
  └─ NO  → Use template

Do you have working templates?
  ├─ YES → Add to assets/ directory
  └─ NO  → Skip assets/ for now

Do you have reference docs?
  ├─ YES → Add to references/ directory
  └─ NO  → Skip references/ for now

Do you have scripts?
  ├─ YES → Add to scripts/ directory
  └─ NO  → Skip scripts/ for now
```

---

## Quality Gates

Don't skip these, even when rushing:

1. ✅ **Frontmatter complete** (name + description + keywords)
2. ✅ **Tested locally** (skill actually works)
3. ✅ **No [TODO:] markers** left in committed files
4. ✅ **Checklist verified** (at least scan it)

Everything else can be improved later.

---

## What If Something Goes Wrong?

### Skill not discovered
- Check `~/.claude/skills/` symlink exists
- Verify frontmatter YAML is valid
- Add more keywords to description

### Templates don't work
- Test them in fresh directory
- Check for hardcoded paths
- Verify package versions current

### Can't think of good keywords
- Look at errors people search for
- Check Stack Overflow questions
- Review official docs examples

### Stuck on description
- Start with: "This skill provides..."
- Add: "Use when..."
- List: "Keywords:"
- See templates/SKILL-TEMPLATE.md for examples

---

## Next Steps

After building your first skill:

1. Read [planning/COMMON_MISTAKES.md](planning/COMMON_MISTAKES.md)
2. Review [CLOUDFLARE_SKILLS_AUDIT.md](CLOUDFLARE_SKILLS_AUDIT.md)
3. Study working skills in `skills/` directory
4. Build second skill (will be much faster!)

---

**Remember**: The goal is production-ready skills, not perfect documentation. Ship it, then improve it!

**Most important**: Make sure Claude can discover and use the skill. Everything else is secondary.
