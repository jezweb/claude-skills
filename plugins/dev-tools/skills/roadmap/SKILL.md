---
name: roadmap
description: "Plan and execute entire application builds. Generates phased delivery roadmaps, then executes them autonomously — phase by phase, committing at milestones, deploying, testing, and continuing until done or stuck. Modes: plan (generate roadmap), start (begin executing), resume (continue from where you left off), status (show progress). Triggers: 'roadmap', 'start building', 'resume the build', 'keep going', 'build the whole thing', 'execute the roadmap', 'what phase are we on'."
compatibility: claude-code-only
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Roadmap

Generate a comprehensive technical roadmap for building an entire application. Detailed enough that Claude Code can pick up any phase and execute it autonomously for hours.

This is not a high-level strategy doc. It's a **delivery blueprint** — every phase has concrete tasks, every task is actionable, and the whole thing is ordered so you can build from phase 1 through to launch without backtracking.

## When to Use

- Starting a major new product (after deep-research, or from a product brief)
- Converting a vague idea into an executable plan
- Planning a multi-week build that will span many Claude Code sessions
- Before saying "build this" — the roadmap is what you hand Claude Code to execute

## Inputs

The skill needs one of these:

| Input | Where to find it |
|-------|-----------------|
| Deep research brief | `.jez/artifacts/research-brief-{topic}.md` (from `/deep-research`) |
| Product brief | User describes what they want to build |
| Existing partial app | Read CLAUDE.md + codebase to understand what exists |
| Competitor to clone/improve | URL or product name — skill analyses it |

If the user just says "plan a note-taking app on Cloudflare", that's enough — ask clarifying questions as needed.

## Workflow

### 1. Establish the Vision

Before any technical planning, nail down:

- **One sentence**: What is this? ("A cloud-native markdown knowledge workspace for teams and AI agents")
- **Who**: Primary users, secondary users, agents? ("Jez first, then Jezweb team, then clients")
- **Why**: What existing tools fail at? What's the gap? ("Existing tools are headless — you can't browse them or stumble across things")
- **Constraint**: Stack, budget, timeline, must-haves? ("Cloudflare, must have MCP, needs to be a PWA")
- **Not building**: What's explicitly out of scope? ("No real-time CRDT collab, no plugin ecosystem")

### 2. Define the Stack

Based on the vision and constraints, lock in the technical stack:

```markdown
| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | [framework] | [reason] |
| Backend | [framework + runtime] | [reason] |
| Database | [engine + ORM] | [reason] |
| Auth | [provider] | [reason] |
| Storage | [service] | [reason] |
| Search | [method] | [reason] |
| Hosting | [platform] | [reason] |
```

If a deep-research brief exists, pull the recommendations from there. If not, make opinionated choices based on the user's existing stack (check `~/Documents/` for patterns).

### 3. Design the Data Model

Sketch all tables/collections the full product will need. Not just phase 1 — the complete model. This prevents schema redesigns mid-build.

```markdown
## Data Model

### [entity]
  id, [type]
  [field], [type], [constraints]
  ...
  created_at, updated_at

### [entity]
  ...

### Relationships
- [entity] has many [entity] via [field]
- [entity] belongs to [entity] via [field]
```

Mark which tables are needed in which phase. Phase 1 might only need 3 of 8 tables, but designing them all upfront avoids migration pain.

### 4. Plan the Phases

This is the core of the roadmap. Each phase must:

- **Have a clear goal** — one sentence describing what's different when this phase is done
- **Be independently deployable** — the app works (with reduced features) after each phase
- **Build on the previous phase** — no phase requires ripping out what came before
- **Be completable in 1-3 Claude Code sessions** — if a phase takes more than a day, split it

#### Phase Structure

For each phase:

```markdown
## Phase N — [Name]
*Goal: [One sentence — what the user can do after this phase that they couldn't before]*
*Depends on: Phase N-1*
*Estimated effort: [hours/sessions]*

### What's New
[Bullet list of user-visible features]

### Database Changes
[New tables, new columns, migrations needed]

### API Routes
[New endpoints this phase adds]

### Frontend
[New pages, components, UI changes]

### Infrastructure
[New Cloudflare resources, secrets, config]

### Task Checklist
[Actionable tasks grouped by area — these are what Claude Code executes]

#### Setup
- [ ] [task]

#### Data Layer
- [ ] [task]
- [ ] [task]

#### API
- [ ] [task]

#### Frontend
- [ ] [task]

#### Testing & Polish
- [ ] [task]
- [ ] [task]

### Definition of Done
[How to verify this phase is complete — what to test, what to deploy]
```

### 5. Phase Planning Patterns

#### Phase 1 — Always the MVP

The first phase must produce something **usable by one person for one purpose**. Not a demo, not a skeleton — a working tool that replaces whatever the user currently does (even if it's a spreadsheet or Apple Notes).

Phase 1 scope test: "Would you use this instead of what you use now?" If no, the MVP is too thin.

Typical Phase 1:
- Auth (single user or invite-only)
- Core data model (2-3 tables)
- CRUD for the primary entity
- Basic UI (list + detail + create/edit)
- Deploy to production domain
- Bare minimum styling (dark mode, responsive)

#### Phase 2 — Make It Real

The second phase turns the MVP into something you'd show to others:
- Polish the UI
- Add secondary features (search, filters, sort)
- Better error handling and validation
- Empty states and onboarding (use the `onboarding-ux` skill)
- Mobile responsiveness
- Data export/import

#### Phase 3 — The Differentiator

What makes this product different from alternatives? Build that here:
- AI features, MCP server, semantic search
- The thing competitors don't have
- The reason someone would choose this over the established player

#### Phase 4+ — Growth Features

Each subsequent phase adds capabilities:
- Multi-user / team features
- Advanced views (graph, canvas, calendar, kanban)
- Integrations (API, webhooks, third-party connections)
- Admin / settings
- Performance optimisation
- Public-facing features (sharing, embedding, white-label)

#### Final Phase — Platform

Only if the product is heading toward multi-tenant / SaaS:
- Client workspaces
- Billing / plans
- White-label / custom domains
- API tokens for third-party access

### 6. Build Order

Summarise the phases in a table:

```markdown
| Phase | Goal | New tables | New routes | Sessions |
|-------|------|-----------|-----------|----------|
| 1 | Personal MVP | 3 | 8 | 2-3 |
| 2 | Polish + search | +1 | +4 | 1-2 |
| 3 | AI + MCP | +1 (vectors) | +5 | 2-3 |
| 4 | Team features | +2 | +6 | 2-3 |
| 5 | Integrations | 0 | +4 | 1-2 |
| 6 | Platform | +2 | +8 | 3-4 |
```

### 7. Deliberately Not Building

List what's explicitly out of scope and why. This prevents scope creep during execution:

```markdown
## Deliberately Not Building (v1)

- Real-time collaborative editing (CRDTs) — too complex, Phase 5+ at earliest
- Plugin ecosystem — too much surface area
- Native mobile app — PWA is good enough
- Offline-first with local storage — we're cloud-native
```

### 8. Schema Evolution Map

Show how the database grows across phases:

```markdown
| Table | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|-------|---------|---------|---------|---------|
| users | ✓ | | | |
| notes | ✓ | +tags col | +embeddings | |
| folders | ✓ | | | |
| note_links | | ✓ | | |
| workspaces | | | | ✓ |
| workspace_users | | | | ✓ |
```

### 9. API Surface Map

Show how the API grows:

```markdown
| Route | Phase | Auth | Purpose |
|-------|-------|------|---------|
| POST /api/auth/* | 1 | — | Authentication |
| GET/POST /api/notes | 1 | Yes | Note CRUD |
| GET /api/search | 2 | Yes | Full-text search |
| GET /api/search/semantic | 3 | Yes | Vector search |
| GET/POST /mcp/tools | 3 | Token | MCP interface |
| POST /api/workspaces | 4 | Yes | Team workspaces |
```

## Output

Write the roadmap to `docs/ROADMAP.md` (or the project root if no `docs/` exists).

The file should be a single markdown document that Claude Code can read at the start of any session and know exactly what to build next. It's the project's north star.

After generating, also update:
- `CLAUDE.md` — add a reference to the roadmap
- `SESSION.md` — set current phase

## Quality Rules

1. **Every task must be actionable** — "Set up auth" is too vague. "Configure better-auth with email/password, create user and session tables, add auth middleware to Hono" is actionable.
2. **Phases must be deployable** — after each phase the app works. No "infrastructure phase" that produces nothing usable.
3. **Phase 1 must be ruthlessly small** — if it takes more than 2-3 sessions, cut scope.
4. **The data model must be complete upfront** — schema redesigns mid-build are the #1 time waster.
5. **"Deliberately not building" is mandatory** — without it, every phase grows.
6. **Tasks are grouped by layer** (data, API, frontend, infra) — Claude Code works in layers, not features.
7. **Each phase has a definition of done** — specific things to test and verify.
8. **Include the stack table** — don't make Claude guess the tech choices per phase.

---

## Execution Modes

The roadmap isn't just a document — it's an execution engine. After generating the plan, use these modes to drive the build.

### Mode: `start`

**Trigger**: "start building", "execute the roadmap", "build the whole thing", "start from phase 1"

1. Read `docs/ROADMAP.md`
2. Verify the project is set up (repo exists, dependencies installed, Cloudflare resources created)
3. Begin Phase 1, task by task
4. After each task: verify it works (build, run, test)
5. After all tasks in a phase: run the Definition of Done checks
6. Commit: `git add -A && git commit -m "Phase N complete: [goal]"`
7. Deploy if applicable: `npx wrangler deploy`
8. Run `/ux-audit quick` on the deployed app
9. Update the roadmap: mark the phase as complete
10. **Continue to the next phase. Don't stop. Don't ask.**
11. Repeat until all phases are complete or you hit a blocker

### Mode: `resume`

**Trigger**: "resume the build", "keep going", "continue", "what phase are we on"

1. Read `docs/ROADMAP.md` — find the first incomplete phase
2. Check `git log` — what was the last roadmap-related commit?
3. Check what exists in the codebase vs what the phase expects
4. Pick up from the first uncompleted task in the current phase
5. Continue executing as in `start` mode

### Mode: `status`

**Trigger**: "roadmap status", "where are we", "what's done"

Read `docs/ROADMAP.md` and produce a summary:

```
Phase 1: Personal MVP ✓ (committed abc1234)
Phase 2: Polish + Search ✓ (committed def5678)
Phase 3: AI + MCP ← IN PROGRESS (7/15 tasks done)
Phase 4: Team Features — not started
Phase 5: Integrations — not started
```

### Execution Rules

**Keep going.** The default is to continue to the next phase after completing one. Don't pause between phases to ask permission. The roadmap IS the permission.

**Commit at phase boundaries.** Every completed phase gets its own commit with a clear message. This creates natural restore points.

**Deploy after every phase.** If the project has a deployment target (wrangler.jsonc, vercel.json), deploy after each phase completes. Real deployment catches issues that local dev doesn't.

**Quick audit between phases.** Run a quick visual check on the deployed app between phases — catch layout issues, broken routes, obvious regressions before building on top of them.

**Thorough audit at the end.** After the final phase, run:
1. `/ux-audit thorough` — comprehensive overnight test
2. `/onboarding-ux` — generate empty states, welcome flow, help content
3. `/project-docs` — update architecture documentation

**Stop only when:**
- A task fails and you can't figure out why (error you haven't seen before)
- You need a credential, API key, or account access you don't have
- A design decision needs human input ("should this be a modal or a page?")
- The build is complete

**Don't stop for:**
- "Should I continue?" — yes, always
- "Should I deploy?" — yes, if there's a deployment target
- "Should I commit?" — yes, at phase boundaries
- Minor issues that don't block the next task — log them as GitHub issues and keep going

### Progress Tracking

Mark completed phases directly in `docs/ROADMAP.md`:

```markdown
## Phase 1 — Personal MVP ✅
*Completed: 2026-03-19, commit abc1234*
*Goal: Replace Apple Notes for one user.*
```

And for the current phase, mark completed tasks:

```markdown
### Task Checklist
- [x] D1 schema — notes, folders tables
- [x] Hono API routes: CRUD for notes
- [ ] CodeMirror 6 integration  ← CURRENT
- [ ] Quick switcher (Cmd+K)
```

This means `resume` can read the roadmap and know exactly where to pick up.

### How This Replaces dev-session

The old `dev-session` skill managed SESSION.md files for cross-session handoff. The roadmap's progress tracking replaces that:

| dev-session had | roadmap has |
|----------------|-------------|
| SESSION.md with "Current Position" | Checked tasks in ROADMAP.md |
| "Resume Instructions" | The next unchecked task IS the instruction |
| "What Works" section | Completed phases with commit hashes |
| Checkpoint commits | Phase boundary commits |
| Wrap session | Final phase + thorough audit |

The roadmap is the session file. No separate tracking document needed.
