# Contributing to Claude Code Skills

Thank you for your interest in contributing! This guide will help you create high-quality skills for the Claude Code community.

---

## 🎯 Skill Development Guidelines

### What Makes a Good Skill?

A good skill should:

✅ **Solve a specific, repeated problem** - Not a one-off solution
✅ **Be well-documented** - Clear README with auto-trigger keywords
✅ **Include working templates** - Ready-to-copy files
✅ **Prevent known errors** - Document common pitfalls
✅ **Be production-tested** - Actually used in real projects
✅ **Save significant tokens** - 50%+ reduction vs manual setup

---

## 📁 Skill Structure Standard

Every skill MUST follow this structure:

```
skills/[skill-name]/
├── README.md              # REQUIRED - Auto-trigger keywords
├── SKILL.md               # REQUIRED - Complete documentation
├── templates/             # REQUIRED - File templates
│   ├── config-file.ext
│   ├── main-file.ext
│   └── ...
├── examples/              # OPTIONAL - Working examples
│   └── example-project/
├── scripts/               # OPTIONAL - Automation scripts
│   └── setup.sh
└── reference/             # OPTIONAL - Deep-dive docs
    └── advanced-topics.md
```

---

## 📝 Required Files

### 1. README.md

**Purpose**: Quick reference with auto-trigger keywords

**Required sections**:

```markdown
# [Skill Name]

**Status**: [Production Ready / Beta / Experimental]
**Last Updated**: YYYY-MM-DD
**Production Tested**: [Link or description]

---

## Auto-Trigger Keywords

### Primary Triggers:
- keyword1
- keyword2
- keyword3

### Secondary Triggers:
- related-term1
- related-term2

### Error-Based Triggers:
- common-error-message
- typical-problem

---

## What This Skill Does

[2-3 sentence description]

✅ Feature 1
✅ Feature 2
✅ Feature 3

---

## Known Issues This Skill Prevents

| Issue | Why It Happens | How Skill Fixes It |
|-------|---------------|-------------------|
| Error 1 | Cause | Solution |
| Error 2 | Cause | Solution |

---

## When to Use This Skill

### ✅ Use When:
- Scenario 1
- Scenario 2

### ❌ Don't Use When:
- Scenario 1
- Scenario 2

---

## Quick Usage

[Step-by-step quick start]

---

## Token Efficiency

| Approach | Tokens Used | Errors |
|----------|------------|--------|
| Manual | XX,XXX | X-X |
| With skill | XX,XXX | 0 |
| **Savings** | **XX%** | **100%** |
```

### 2. SKILL.md

**Purpose**: Complete documentation

**Required sections**:
- Detailed setup instructions
- Configuration examples
- Critical rules (Always Do / Never Do)
- Common issues & fixes
- Dependencies
- Reference links

---

## 🔑 Auto-Trigger Keywords

Keywords are **critical** for skill auto-discovery. Include:

### Primary Keywords (3-5)
- Exact technology names: `tailwind v4`, `cloudflare workers`
- Common phrases: `vite + react`, `dark mode setup`

### Secondary Keywords (5-10)
- Related technologies: `shadcn/ui`, `hono routing`
- Use cases: `theme switching`, `jwt verification`

### Error Keywords (2-5)
- Common error messages users search for
- Typical problems: `colors not working`, `build fails`

---

## 📦 Template Files

Templates should be:

✅ **Complete** - Ready to use, not snippets
✅ **Commented** - Explain non-obvious parts
✅ **Current** - Use latest package versions
✅ **Tested** - Actually works in production

### Example Template:

```typescript
// templates/vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',  // Path alias for clean imports
    },
  },
})
```

---

## 🧪 Testing Your Skill

Before submitting, verify:

1. **Auto-discovery works**
   - Test that Claude finds your skill with trigger keywords
   - Verify skill is suggested when appropriate

2. **Templates are complete**
   - Copy templates to new project
   - Run build/dev server
   - Verify no errors

3. **Documentation is clear**
   - Someone unfamiliar can follow SKILL.md
   - All common errors are documented
   - Examples work

4. **Token efficiency**
   - Measure tokens used with vs without skill
   - Aim for 50%+ reduction

---

## 🚀 Submission Process

### 1. Create Your Skill

```bash
cd ~/Documents/claude-skills

# Create skill directory
mkdir -p skills/my-skill/{templates,examples,scripts}

# Add required files
touch skills/my-skill/README.md
touch skills/my-skill/SKILL.md

# Add templates
# ...
```

### 2. Test Locally

```bash
# Install skill to ~/.claude/skills/
./scripts/install-skill.sh my-skill

# Test auto-discovery
# Ask Claude to perform a task that should trigger your skill
```

### 3. Update Planning Doc

Add your skill to `planning/skills-roadmap.md`:

```markdown
## my-skill

**Status**: Ready for review
**Priority**: [High/Medium/Low]
**Dependencies**: [Other skills needed]
**Token savings**: ~XX%
```

### 4. Submit Pull Request

```bash
git checkout -b add-my-skill
git add skills/my-skill
git commit -m "Add my-skill for [use case]"
git push origin add-my-skill
```

Create PR with:
- Clear description of what the skill does
- Token efficiency metrics
- Production testing evidence
- Screenshots/examples

---

## ✅ Review Checklist

Before submitting, ensure:

- [ ] README.md has auto-trigger keywords
- [ ] SKILL.md is complete and accurate
- [ ] Templates are tested and work
- [ ] No hardcoded secrets or credentials
- [ ] Dependencies are documented
- [ ] Known issues are listed with fixes
- [ ] Token efficiency is measured
- [ ] Skill tested in ~/.claude/skills/
- [ ] planning/skills-roadmap.md updated
- [ ] Examples work (if provided)

---

## 📊 Token Efficiency Metrics

Measure token usage:

**Manual Setup** (no skill):
1. Start fresh chat
2. Ask Claude to set up [technology]
3. Note total tokens used
4. Count errors encountered

**With Skill**:
1. Start fresh chat
2. Ensure skill is installed
3. Ask Claude to set up [technology]
4. Note total tokens used
5. Count errors encountered

**Calculate**:
- Token savings = ((Manual - Skill) / Manual) × 100%
- Error reduction = Manual errors - Skill errors

---

## 🤝 Community Standards

### Code of Conduct

- Be respectful and constructive
- Help others learn and improve
- Share knowledge openly
- Credit sources and inspiration

### Quality Over Quantity

We prefer:
- 1 excellent, well-tested skill
- Over 10 untested, incomplete skills

### Maintenance

- Update skills when dependencies change
- Respond to issues promptly
- Document breaking changes
- Test with latest Claude Code versions

---

## 💡 Skill Ideas

Looking for ideas? We need skills for:

- **Databases**: Prisma, Drizzle, TypeORM
- **Testing**: Vitest, Playwright, Jest
- **Deployment**: Railway, Fly.io, Render
- **APIs**: tRPC, GraphQL, REST patterns
- **State Management**: Zustand, Jotai, Redux
- **Mobile**: React Native, Capacitor
- **Desktop**: Tauri, Electron

---

## 📞 Getting Help

- **Issues**: https://github.com/jezweb/claude-skills/issues
- **Discussions**: https://github.com/jezweb/claude-skills/discussions
- **Email**: jeremy@jezweb.net

---

## 🙏 Thank You!

Your contributions make Claude Code better for everyone. We appreciate your time and effort!

---

**Happy skill building! 🚀**
