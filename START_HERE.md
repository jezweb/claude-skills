# START HERE 👋

**Welcome to claude-skills!** This is your entry point for building production-ready skills for Claude Code.

---

## What Do You Want To Do?

### 🆕 Build a New Skill

**Quick Start** (5 minutes):
1. Copy the template: `cp -r templates/skill-skeleton/ skills/my-skill-name/`
2. Fill in the TODOs in `SKILL.md` and `README.md`
3. Add your resources (scripts, references, assets)
4. Install locally: `./scripts/install-skill.sh my-skill-name`
5. Test by mentioning it to Claude Code
6. Verify with [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md)

**Detailed Workflow**: See [QUICK_WORKFLOW.md](QUICK_WORKFLOW.md)

---

### ✅ Verify an Existing Skill

**Compliance Check**:
- Use [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md) for quick verification
- See [CLOUDFLARE_SKILLS_AUDIT.md](CLOUDFLARE_SKILLS_AUDIT.md) for example audit
- Check against [planning/claude-code-skill-standards.md](planning/claude-code-skill-standards.md)

---

### 🔬 Research Before Building

**Research Protocol**:
1. Read [planning/research-protocol.md](planning/research-protocol.md)
2. Check Context7 MCP for library docs
3. Verify latest package versions on npm
4. Document findings in `planning/research-logs/`
5. Build working example first

---

### 📚 Understand the Standards

**Official Documentation**:
- Anthropic Skills Repo: https://github.com/anthropics/skills
- Agent Skills Spec: [anthropics/skills/agent_skills_spec.md](https://github.com/anthropics/skills/blob/main/agent_skills_spec.md)
- Our Standards Doc: [planning/claude-code-skill-standards.md](planning/claude-code-skill-standards.md)
- Comparison: [planning/STANDARDS_COMPARISON.md](planning/STANDARDS_COMPARISON.md)

---

### 📝 Learn From Examples

**Working Examples**:
- **Gold Standard**: `~/.claude/skills/tailwind-v4-shadcn/`
- **Cloudflare Suite** (7 production skills):
  - cloudflare-worker-base
  - cloudflare-d1
  - cloudflare-r2
  - cloudflare-kv
  - cloudflare-workers-ai
  - cloudflare-vectorize
  - cloudflare-queues
- **Official Examples**: https://github.com/anthropics/skills

---

## Quick Reference Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  START: I want to build a skill for [technology]           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ 1. RESEARCH                  │
        │ • Check Context7 MCP         │
        │ • Verify package versions    │
        │ • Build working example      │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ 2. COPY TEMPLATE             │
        │ cp -r templates/skill-       │
        │   skeleton/ skills/my-skill/ │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ 3. FILL TODOS                │
        │ • Edit SKILL.md frontmatter  │
        │ • Write instructions         │
        │ • Add README keywords        │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ 4. ADD RESOURCES             │
        │ • scripts/ (executable code) │
        │ • references/ (docs)         │
        │ • assets/ (templates)        │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ 5. TEST LOCALLY              │
        │ ./scripts/install-skill.sh   │
        │ • Ask Claude to use skill    │
        │ • Verify discovery works     │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ 6. VERIFY COMPLIANCE         │
        │ Check ONE_PAGE_CHECKLIST.md  │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ 7. COMMIT                    │
        │ • git add skills/my-skill    │
        │ • git commit with details    │
        │ • git push                   │
        └──────────────────────────────┘
```

---

## Key Files Quick Reference

| File | Purpose | When To Read |
|------|---------|--------------|
| **START_HERE.md** (this file) | Navigation hub | Always (entry point) |
| **CLAUDE.md** | Project context | When working on this repo |
| **ONE_PAGE_CHECKLIST.md** | Quick verification | Before committing |
| **QUICK_WORKFLOW.md** | 5-minute process | Building new skill |
| **templates/SKILL-TEMPLATE.md** | Copy-paste starter | Building new skill |
| **planning/claude-code-skill-standards.md** | Official standards | Understanding requirements |
| **planning/research-protocol.md** | Research process | Before building skill |
| **CLOUDFLARE_SKILLS_AUDIT.md** | Example audit | Learning compliance |

---

## Project Status (2025-10-21)

### ✅ Completed (9 skills):
1. **tailwind-v4-shadcn** - Tailwind v4 + shadcn/ui + Vite + React
2. **cloudflare-worker-base** - Hono + Vite + Static Assets
3. **cloudflare-d1** - D1 serverless database
4. **cloudflare-r2** - R2 object storage
5. **cloudflare-kv** - KV key-value storage
6. **cloudflare-workers-ai** - Workers AI models
7. **cloudflare-vectorize** - Vector database
8. **cloudflare-queues** - Message queues
9. **firecrawl-scraper** - Firecrawl v2 API

### 📋 Planned (4 skills):
1. **clerk-auth** - Clerk authentication
2. **hono-routing** - Hono routing patterns
3. **react-hook-form-zod** - Forms + validation
4. **tanstack-query** - Server state management

---

## Common Questions

**Q: Where do I start after clearing context?**
A: Read this file, then go to [CLAUDE.md](CLAUDE.md) for project context.

**Q: How do I know if my skill is correct?**
A: Check [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md) - if all boxes check, you're good!

**Q: Where are the templates?**
A: `templates/skill-skeleton/` - copy this entire directory to start a new skill.

**Q: What if I forget the workflow?**
A: See [QUICK_WORKFLOW.md](QUICK_WORKFLOW.md) for step-by-step instructions.

**Q: How do I verify against official Anthropic standards?**
A: See [planning/STANDARDS_COMPARISON.md](planning/STANDARDS_COMPARISON.md)

---

## Need Help?

1. Check [planning/COMMON_MISTAKES.md](planning/COMMON_MISTAKES.md) for what NOT to do
2. Look at existing skills in `skills/` directory for working examples
3. Review [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
4. Open an issue: https://github.com/jezweb/claude-skills/issues

---

## External Resources

- **Official Anthropic Skills**: https://github.com/anthropics/skills
- **Claude Code Docs**: https://docs.claude.com/en/docs/claude-code/skills
- **Support Articles**:
  - [What are skills?](https://support.claude.com/en/articles/12512176-what-are-skills)
  - [Creating custom skills](https://support.claude.com/en/articles/12512198-creating-custom-skills)
- **Engineering Blog**: [Equipping agents with skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

---

**Ready to build?** Start with the quick workflow above or dive into [QUICK_WORKFLOW.md](QUICK_WORKFLOW.md) for details!

**Questions about the project?** Read [CLAUDE.md](CLAUDE.md) for full context.

**Just need to verify?** Check [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md) and you're done.
