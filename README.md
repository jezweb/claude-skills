# Claude Code Skills

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/jezweb/claude-skills?style=social)](https://github.com/jezweb/claude-skills)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> **Marketplace Renamed (v3.4.0)**: The marketplace name changed from `claude-skills` to `jezweb-skills`.
> If you had the old version installed, run:
> ```bash
> /plugin marketplace remove claude-skills
> /plugin marketplace add jezweb/claude-skills
> ```

**95 production-ready skills** for Claude Code CLI — Cloudflare, React, AI integrations, and more.

~60% token savings | 400+ errors prevented | Auto-discovered by Claude

---

## Quick Install

### Marketplace (Recommended)

```bash
/plugin marketplace add https://github.com/jezweb/claude-skills
/plugin install cloudflare-worker-base@jezweb-skills
```

### Manual

```bash
git clone https://github.com/jezweb/claude-skills.git ~/Documents/claude-skills
cd ~/Documents/claude-skills
./scripts/install-skill.sh cloudflare-worker-base  # or ./scripts/install-all.sh
```

---

## Skills by Category

| Category | Skills | Highlights |
|----------|--------|------------|
| **Cloudflare** | 16 | Workers, D1, R2, KV, Agents, MCP Server, Durable Objects |
| **AI/ML** | 12 | Vercel AI SDK, OpenAI Agents, Claude API, Gemini |
| **Frontend** | 12 | Tailwind v4 + shadcn, TanStack (Query/Router/Table), Zustand |
| **Python** | 2 | FastAPI, Flask |
| **Database** | 4 | Drizzle, Neon Postgres, Vercel KV/Blob |
| **Auth** | 2 | Clerk, Better Auth |
| **Planning** | 5 | Project workflow, session management |
| **MCP/Tools** | 4 | FastMCP, TypeScript MCP |
| **CMS** | 3 | TinaCMS, Sveltia, WordPress |
| **Developer Workflow** | 1 | Developer Toolbox (7 agents for code review, debugging, testing) |

**📋 Full list**: [SKILLS_CATALOG.md](SKILLS_CATALOG.md)

---

## How It Works

Claude Code automatically discovers skills in `~/.claude/skills/` and suggests them when relevant:

```
You: "Set up a Cloudflare Worker with D1"
Claude: "Found cloudflare-worker-base and cloudflare-d1 skills. Use them?"
You: "Yes"
→ Production-ready setup, zero errors
```

---

## Bundled Agents

Some skills include **sub-agents** that can be invoked via the Task tool for specialized tasks:

| Bundle | Agents | Purpose |
|--------|--------|---------|
| **design** | `a11y-auditor`, `favicon-crafter`, `image-prompter` | Accessibility audits, favicon generation, image prompts |
| **cloudflare** | `cloudflare-deploy`, `cloudflare-debug`, `d1-migration`, `worker-scaffold` | Deployment, debugging, migrations |

**Note**: Agents require manual installation to `~/.claude/agents/`:

```bash
# List available agents
./scripts/install-skill-agents.sh list

# Install agents from a bundle
./scripts/install-skill-agents.sh design
./scripts/install-skill-agents.sh cloudflare

# Install all agents
./scripts/install-skill-agents.sh all

# Restart Claude Code to discover new agents
```

After installation, agents appear in the Task tool's available agents.

---

## Request a Skill

**Want a skill we don't have?** [Open an issue](https://github.com/jezweb/claude-skills/issues/new?template=skill_request.md&title=Skill+Request:+) with the technology/framework and we'll build it.

Popular requests get prioritized. No need to build it yourself unless you want to.

---

## Your Own Skills Repo

Want your own skills ecosystem with your own authorship? **Fork this repo** or use it as a template:

1. Fork → customize skills with your preferences
2. Use our QA agents (`content-accuracy-auditor`, `code-example-validator`, `version-checker`) to maintain currency
3. Pull upstream updates when useful

This works well if you maintain skills across multiple machines or want to publish your own collection.

---

## Creating Skills

**Quick start**:
```bash
cp -r templates/skill-skeleton/ skills/my-skill/
# Edit SKILL.md and README.md
./scripts/install-skill.sh my-skill
```

**Guides**: [CONTRIBUTING.md](CONTRIBUTING.md) | [templates/](templates/) | [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md)

---

## Token Efficiency

| Metric | Manual | With Skills |
|--------|--------|-------------|
| Tokens | 12-15k | 4-6k (~50% less) |
| Errors | 2-4 | 0 (prevented) |
| Time | 2-4 hours | 15-45 min |

---

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) — How to contribute
- [CLAUDE.md](CLAUDE.md) — Project context
- [docs/SKILLS_CATALOG.md](docs/SKILLS_CATALOG.md) — Full skill details
- [docs/MARKETPLACE.md](docs/MARKETPLACE.md) — Marketplace installation

---

## Tools

### ContextBricks — Status Line

Real-time context tracking for Claude Code.

```bash
npx contextbricks  # One-command install
```

[![npm](https://img.shields.io/npm/v/contextbricks.svg)](https://www.npmjs.com/package/contextbricks)

---

## Links

- **Issues**: [github.com/jezweb/claude-skills/issues](https://github.com/jezweb/claude-skills/issues)
- **Claude Code**: [claude.com/claude-code](https://claude.com/claude-code)
- **Jezweb**: [jezweb.com.au](https://jezweb.com.au)

---

MIT License | Built by Jeremy Dawes

## Compatible Agents

These skills work with:

- [Claude Code](https://claude.ai/code) - Anthropic's official CLI
- [AdaL](https://sylph.ai/adal) - Self-evolving AI coding agent with MCP support

