# Project Planning Skill

**Version**: 1.0
**Last Updated**: 2025-10-25
**Status**: Production Ready

---

## Purpose

This skill generates comprehensive, context-optimized planning documentation for web application projects. It structures work into manageable phases with built-in verification, ensuring projects can be built iteratively while maintaining clarity between sessions.

---

## When to Use This Skill

### Primary Use Cases

**1. Starting a New Project** (Most Common)
```
User: "I want to build a task management app with authentication"
Claude: "Let me use the project-planning skill to structure this properly"
→ Skill generates planning docs
→ Review and refine
→ Start building
```

**2. Adding a Major Feature**
```
User: "I need to add real-time collaboration to the existing app"
Claude: "Let me use project-planning to create phases for this feature"
→ Skill generates new phases
→ Append to existing IMPLEMENTATION_PHASES.md
```

**3. Re-planning a Messy Project**
```
User: "This project has gotten out of hand, let's restructure it"
Claude: "Let me use project-planning to reorganize the work"
→ Skill analyzes current state
→ Generates new phase structure
```

**4. Validating Existing Phases**
```
User: "Does Phase 3 look reasonable, or is it too big?"
Claude: "Let me use project-planning to validate this phase"
→ Skill checks sizing rules
→ Suggests improvements
```

---

## What This Skill Generates

### Core Output (Always)
- **IMPLEMENTATION_PHASES.md** - Structured phase breakdown with verification criteria

### Optional Outputs (Generated When Needed)
- **DATABASE_SCHEMA.md** - Tables, relationships, indexes, migrations
- **API_ENDPOINTS.md** - Routes, methods, auth, request/response schemas
- **ARCHITECTURE.md** - System design, data flow, service boundaries
- **UI_COMPONENTS.md** - Component hierarchy, state management, forms
- **TESTING.md** - Test strategy, E2E flows, integration tests
- **AGENTS_CONFIG.md** - AI agents, tools, workflows (for AI-enabled apps)
- **INTEGRATION.md** - Third-party services, webhooks, API integrations

**Decision Logic**: Skill asks if additional docs are needed, or auto-generates based on project complexity
- Database with >3 tables → Suggest DATABASE_SCHEMA.md
- API with >5 endpoints → Suggest API_ENDPOINTS.md
- Multiple services/workers → Suggest ARCHITECTURE.md
- AI-powered features → Suggest AGENTS_CONFIG.md

---

## How It Works

### 1. Smart Defaults for Web Apps

The skill knows your preferred stack from CLAUDE.md:
- **Frontend**: Vite + React + Tailwind v4 + shadcn/ui
- **Backend**: Cloudflare Workers (with Static Assets for frontend)
- **Database**: D1 (SQL migrations)
- **Storage**: R2 (files), KV (config/cache)
- **Auth**: Clerk (JWT verification)
- **Deployment**: Wrangler CLI

It only asks clarifying questions when:
- Non-standard tech is mentioned
- Project complexity suggests alternatives
- User specifies different preferences

### 2. Hybrid Interaction

**Template-driven with smart questions**:
1. Analyzes project description
2. Identifies phase types needed (Infrastructure, Database, API, UI, Integration, Testing)
3. Asks targeted questions:
   - "Do you need social auth (Google, GitHub)?"
   - "Should users have roles/permissions?"
   - "Any real-time features (Durable Objects)?"
4. Generates docs with completed defaults and your specific choices

### 3. Phase Validation Rules

Every generated phase follows context-safe sizing:
- **Max file scope**: 5-8 files per phase
- **Max dependencies**: Shouldn't require deep knowledge of >2 other phases
- **Time estimate**: Includes implementation + verification + expected fixes
- **Verification required**: Every phase has checkbox criteria
- **Exit criteria required**: Clear "done" definition

If a phase violates these rules, skill auto-suggests splitting it.

---

## Phase Types

The skill uses standardized templates for common web app patterns:

### Infrastructure Phase
- Project scaffolding (Vite, Wrangler, dependencies)
- Build/deploy configuration
- **Verification**: Can deploy to Cloudflare, dev server runs

### Database Phase
- Schema design (tables, relationships, indexes)
- Migration files
- Seed data for testing
- **Verification**: CRUD operations work, constraints enforced

### API Phase
- Route definitions
- Middleware (auth, CORS, error handling)
- Request/response validation (Zod schemas)
- **Verification**: Endpoint tests pass (200, 401, 400, 500 cases)

### UI Phase
- Component structure (shadcn/ui composition)
- Form validation (Zod + React Hook Form)
- State management (TanStack Query for server state, Zustand for client state)
- **Verification**: User flows work, forms validate, states update correctly

### Integration Phase
- Third-party API setup (Clerk, Stripe, OpenAI, etc)
- Webhook handlers
- Configuration (environment variables, bindings)
- **Verification**: External service integration works, webhooks fire correctly

### Testing Phase (Optional)
- E2E test setup
- Integration tests for critical flows
- **Verification**: Test suite passes, coverage meets threshold

---

## Auto-Trigger Keywords

Claude Code will automatically discover this skill when you mention:

**Project Initiation**:
- "new project", "start a project", "create app", "build app", "scaffold project"
- "planning documentation", "project planning", "implementation phases"
- "structure project", "organize project", "plan features"

**Planning Documents**:
- "IMPLEMENTATION_PHASES.md", "DATABASE_SCHEMA.md", "API_ENDPOINTS.md"
- "ARCHITECTURE.md", "session handoff", "phase breakdown"
- "planning docs", "project spec", "requirements doc"

**Phase Management**:
- "phases", "phased approach", "implementation phases", "context-safe phases"
- "verification criteria", "exit criteria", "phase validation"
- "split phase", "merge phases", "adjust phases"

**Stack Keywords**:
- "Cloudflare Workers", "Vite + React", "D1 database", "full-stack app"
- "Clerk auth", "Tailwind v4", "shadcn/ui", "TanStack Query"

**Use Cases**:
- "major feature", "restructure project", "plan sprint", "roadmap"
- "session tracking", "context management", "git checkpoint"

**AI/Integration Projects**:
- "AI agents", "LLM features", "third-party integration", "webhooks"
- "real-time features", "Durable Objects", "websockets"

---

## Invocation

### Automatic (Recommended)
When you describe a new project, Claude Code will automatically suggest using this skill:
```
User: "I want to build a blog with comments and user profiles"
Claude: "Let me use the project-planning skill to structure this"
```

### Manual
Explicitly request the skill:
```
"Use the project-planning skill to plan this project"
"Generate planning docs for this feature"
"Validate my existing phases with project-planning"
```

---

## Example Workflow

**User**: "I want to build a URL shortener with analytics"

**Skill**:
```
Analyzing project requirements...

Project Type: Web App (CRUD + Analytics)
Suggested Stack: Cloudflare Workers + D1 + Vite + React

Questions:
1. Auth required? (public tool vs user accounts)
2. Custom short URLs or auto-generated?
3. Analytics detail level? (simple count vs detailed visitor data)
4. Admin dashboard needed?
```

**User**: "User accounts, auto-generated, detailed analytics, yes to dashboard"

**Skill Generates**:
- IMPLEMENTATION_PHASES.md (6 phases)
- DATABASE_SCHEMA.md (users, urls, analytics_events tables)
- API_ENDPOINTS.md (auth, URL CRUD, redirect, analytics)

**Output Preview**:
```markdown
# Implementation Phases: URL Shortener

## Phase 1: Project Setup (2 hours)
**Type**: Infrastructure
**Files**: package.json, wrangler.jsonc, vite.config.ts, src/index.ts

**Tasks**:
- [x] Scaffold Cloudflare Worker with Vite
- [x] Configure Tailwind v4 + shadcn/ui
- [x] Setup D1 database binding
- [x] Test deployment

**Verification**:
- [ ] `npm run dev` starts without errors
- [ ] Can deploy to Cloudflare
- [ ] Worker serves React app

**Exit Criteria**: Working dev environment and successful deployment

---

## Phase 2: Database Schema (2-3 hours)
**Type**: Database
**Files**: migrations/0001_initial.sql, src/db/schema.ts

[... and so on for each phase ...]
```

---

## What This Skill Does NOT Do

**Not a code generator**: Generates planning docs, not implementation code
**Not a session tracker**: Doesn't update SESSION.md (that's Claude's job)
**Not an architect**: Doesn't make technical decisions (Claude does that with you)
**Not mandatory**: Optional tool - use when beneficial

---

## Expanding the Skill

Easy to add new document templates:
1. Create template in `templates/` directory
2. Add generation logic to SKILL.md
3. Update this README

Future possibilities:
- `phase-split`: Break oversized phase into sub-phases
- `session-init`: Generate SESSION.md from IMPLEMENTATION_PHASES.md
- More phase types (Migration, Optimization, Security)

---

## Files in This Skill

```
project-planning/
├── README.md                          # This file
├── SKILL.md                           # Main skill logic (planning assistant)
├── templates/
│   ├── IMPLEMENTATION_PHASES.md       # Phase breakdown template
│   ├── DATABASE_SCHEMA.md             # Database design template
│   ├── API_ENDPOINTS.md               # API routes template
│   ├── ARCHITECTURE.md                # System design template
│   ├── UI_COMPONENTS.md               # Component structure template
│   ├── TESTING.md                     # Test strategy template
│   ├── AGENTS_CONFIG.md               # AI agents template
│   └── INTEGRATION.md                 # Third-party integrations template
└── examples/
    ├── simple-web-app.md              # Basic CRUD example
    ├── auth-web-app.md                # Authentication example
    └── ai-web-app.md                  # AI-powered app example
```

---

## Tips for Best Results

**Be specific in project description**: "Task manager with tags and due dates" is better than "to-do app"

**Mention non-standard requirements early**: "Need to support 10k concurrent users" or "Must integrate with legacy SOAP API"

**Review generated phases before starting**: Easier to refine planning docs than mid-implementation

**Use examples for reference**: Check `examples/` directory for similar projects

**Iterate if needed**: Regenerate or refine phases if initial output doesn't feel right

---

## Integration with Session Workflow

After this skill generates IMPLEMENTATION_PHASES.md:

1. Review and refine phases
2. Create SESSION.md (manually or with future `session-init` tool)
3. Start Phase 1
4. Update SESSION.md as you progress
5. Create git checkpoints at phase boundaries

See main CLAUDE.md for full session handoff protocol.

---

## Questions?

This skill is designed to evolve based on usage. If something doesn't work as expected or you'd like additional capabilities, refine SKILL.md and templates directly.
