# Claude Code Skills Collection

**Production-ready skills for Claude Code CLI**

A curated collection of battle-tested skills for building modern web applications with Cloudflare, React, Tailwind, and AI integrations.

**👋 New Here?** → Read [START_HERE.md](START_HERE.md) for quick navigation
**🔨 Building a Skill?** → Use [QUICK_WORKFLOW.md](QUICK_WORKFLOW.md) and [templates/](templates/)
**📖 Project Context?** → See [CLAUDE.md](CLAUDE.md)

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/jezweb/claude-skills.git ~/Documents/claude-skills

# Install all skills
cd ~/Documents/claude-skills
./scripts/install-all.sh

# Or install individual skills
./scripts/install-skill.sh cloudflare-react-full-stack
```

### Verify Installation

Skills will be symlinked to `~/.claude/skills/`. Claude Code will automatically discover and suggest them when relevant.

---

## 📦 Available Skills

### Core Infrastructure

#### **cloudflare-worker-base**
Foundation for Cloudflare Workers projects with Hono routing, Static Assets, and Vite plugin.

**Triggers**: `cloudflare worker`, `hono`, `workers static assets`

---

#### **cloudflare-react-full-stack**
Complete stack: Cloudflare Workers + Vite + React + Tailwind v4 + shadcn/ui

**Triggers**: `cloudflare react`, `workers + vite`, `full stack cloudflare`

---

#### **cloudflare-services**
Integration patterns for D1, R2, KV, Workers AI, Vectorize, and Queues.

**Triggers**: `d1 database`, `r2 storage`, `workers ai`, `cloudflare kv`

---

### Authentication & Data

#### **clerk-auth-cloudflare**
Clerk authentication with Cloudflare Workers, JWT verification, and D1 integration.

**Triggers**: `clerk auth`, `jwt verification`, `cloudflare auth`

---

#### **firecrawl-scraper**
Website scraping with Firecrawl v2 API, content extraction, and image cataloging.

**Triggers**: `web scraping`, `firecrawl`, `content extraction`

---

### UI & Frontend

#### **tailwind-v4-shadcn**
Vite + React + Tailwind CSS v4 + shadcn/ui with dark mode and error prevention.

**Triggers**: `tailwind v4`, `shadcn/ui`, `dark mode`

---

#### **react-vite-base**
Standalone Vite + React + TypeScript setup (no Cloudflare).

**Triggers**: `vite react`, `react typescript`, `standalone react`

---

#### **react-form-zod**
React Hook Form + Zod validation with client/server patterns.

**Triggers**: `react form`, `zod validation`, `form validation`

---

#### **ai-chat-ui**
Chat interface components with streaming, history, and AI integration.

**Triggers**: `chat ui`, `ai chat`, `message streaming`

---

## 🎯 How It Works

### Auto-Discovery

Claude Code automatically checks `~/.claude/skills/` before planning tasks. When it finds a relevant skill:

```
User: "Set up a Cloudflare Worker with React"
↓
Claude: [Checks skills automatically]
↓
Claude: "Found cloudflare-react-full-stack skill. Use it?
        (Sets up Workers + Vite + React + Tailwind v4)"
↓
User: "Yes"
↓
Claude: [Uses skill templates and automation]
↓
Result: Production-ready project in minutes, zero errors
```

### Skill Structure

Each skill includes:

```
skills/[skill-name]/
├── README.md           # Auto-trigger keywords, quick reference
├── SKILL.md            # Complete documentation
├── templates/          # Ready-to-copy file templates
├── examples/           # Working example projects
└── scripts/            # Automation scripts
```

---

## 🛠️ Development

### Building New Skills

1. **Create skill directory**:
   ```bash
   mkdir -p skills/my-skill/{templates,examples,scripts}
   ```

2. **Add required files**:
   - `README.md` - Auto-trigger keywords
   - `SKILL.md` - Full documentation
   - Templates for common files

3. **Test the skill**:
   ```bash
   ./scripts/test-skill.sh my-skill
   ```

4. **Install to production**:
   ```bash
   ./scripts/install-skill.sh my-skill
   ```

5. **Commit and push**:
   ```bash
   git add skills/my-skill
   git commit -m "Add my-skill"
   git push
   ```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📋 Skill Priority

Skills are organized by priority and dependency:

### Batch 1 - Core Infrastructure ⭐⭐⭐
1. cloudflare-worker-base
2. cloudflare-react-full-stack
3. cloudflare-services

### Batch 2 - Auth & Data ⭐⭐
4. clerk-auth-cloudflare
5. firecrawl-scraper

### Batch 3 - UI Patterns ⭐
6. react-vite-base
7. react-form-zod
8. ai-chat-ui

---

## 🧪 Testing

Each skill can be tested before installation:

```bash
# Test individual skill
./scripts/test-skill.sh cloudflare-react-full-stack

# Test all skills
./scripts/test-all.sh
```

---

## 📚 Documentation

- **Planning**: See [planning/skills-roadmap.md](planning/skills-roadmap.md)
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Individual skills**: Each skill has README.md + SKILL.md

---

## 🤝 Contributing

Contributions welcome! Please:

1. Follow the skill template standard
2. Include auto-trigger keywords in README.md
3. Provide working templates
4. Test thoroughly before submitting PR
5. Update planning/skills-roadmap.md

---

## 📄 License

MIT License - See [LICENSE](LICENSE)

---

## 🔗 Links

- **Claude Code**: https://claude.com/claude-code
- **Jezweb**: https://jezweb.com.au
- **Issues**: https://github.com/jezweb/claude-skills/issues

---

## ⚡ Token Efficiency

Using skills vs manual setup:

| Approach | Avg Tokens | Typical Errors |
|----------|-----------|----------------|
| Manual setup | 50,000-70,000 | 2-4 common errors |
| With skills | 15,000-25,000 | 0 (prevented) |
| **Savings** | **~70%** | **100%** |

---

**Built with ❤️ by Jeremy Dawes | Jezweb**
