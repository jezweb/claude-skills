---
name: project-docs
description: "Generate project documentation from codebase analysis — ARCHITECTURE.md, API_ENDPOINTS.md, DATABASE_SCHEMA.md. Reads source code, schema files, routes, and config to produce accurate, structured docs. Use when starting a project, onboarding contributors, or when docs are missing or stale. Triggers: 'generate docs', 'document architecture', 'create api docs', 'document schema', 'project documentation', 'write architecture doc'."
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
compatibility: Designed for Claude Code (or similar products)
---

# Project Documentation Generator

Generate structured project documentation by analysing the codebase. Produces docs that reflect the **actual code**, not aspirational architecture.

## When to Use

- New project needs initial documentation
- Docs are missing or stale
- Onboarding someone to the codebase
- Post-refactor doc refresh

## Workflow

### 1. Detect Project Type

Scan the project root to determine what kind of project this is:

| Indicator | Project Type |
|-----------|-------------|
| `wrangler.jsonc` / `wrangler.toml` | Cloudflare Worker |
| `vite.config.ts` + `src/App.tsx` | React SPA |
| `astro.config.mjs` | Astro site |
| `next.config.js` | Next.js app |
| `package.json` with `hono` | Hono API |
| `src/index.ts` with `Hono` | API server |
| `drizzle.config.ts` | Has database layer |
| `schema.ts` or `schema/` | Has database schema |
| `pyproject.toml` / `setup.py` | Python project |
| `Cargo.toml` | Rust project |

### 2. Ask What to Generate

```
Which docs should I generate?
1. ARCHITECTURE.md — system overview, stack, directory structure, key flows
2. API_ENDPOINTS.md — routes, methods, params, response shapes, auth
3. DATABASE_SCHEMA.md — tables, relationships, migrations, indexes
4. All of the above
```

Only offer docs that match the project. Don't offer API_ENDPOINTS.md for a static site. Don't offer DATABASE_SCHEMA.md if there's no database.

### 3. Scan the Codebase

For each requested doc, read the relevant source files:

**ARCHITECTURE.md** — scan:
- `package.json` / `pyproject.toml` (stack, dependencies)
- Entry points (`src/index.ts`, `src/main.tsx`, `src/App.tsx`)
- Config files (`wrangler.jsonc`, `vite.config.ts`, `tsconfig.json`)
- Directory structure (top 2 levels)
- Key modules and their exports

**API_ENDPOINTS.md** — scan:
- Route files (`src/routes/`, `src/api/`, or inline in index)
- Middleware files (auth, CORS, logging)
- Request/response types or Zod schemas
- Error handling patterns

**DATABASE_SCHEMA.md** — scan:
- Drizzle schema files (`src/db/schema.ts`, `src/schema/`)
- Migration files (`drizzle/`, `migrations/`)
- Raw SQL files if present
- Seed files if present

### 4. Generate Documentation

Write each doc to `docs/` (create the directory if it doesn't exist). If the project already has docs there, offer to update rather than overwrite.

For small projects with no `docs/` directory, write to the project root instead.

## Document Templates

### ARCHITECTURE.md

```markdown
# Architecture

## Overview
[One paragraph: what this project does and how it's structured]

## Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | [e.g. Cloudflare Workers] | — |
| Framework | [e.g. Hono] | [version] |
| Database | [e.g. D1 (SQLite)] | — |
| ORM | [e.g. Drizzle] | [version] |
| Frontend | [e.g. React 19] | [version] |
| Styling | [e.g. Tailwind v4] | [version] |

## Directory Structure
[Annotated tree — top 2 levels with purpose comments]

## Key Flows
### [Flow 1: e.g. "User Authentication"]
[Step-by-step: request → middleware → handler → database → response]

### [Flow 2: e.g. "Data Processing Pipeline"]
[Step-by-step through the system]

## Configuration
[Key config files and what they control]

## Deployment
[How to deploy, environment variables needed, build commands]
```

### API_ENDPOINTS.md

```markdown
# API Endpoints

## Base URL
[e.g. `https://api.example.com` or relative `/api`]

## Authentication
[Method: Bearer token, session cookie, API key, none]
[Where tokens come from, how to obtain]

## Endpoints

### [Group: e.g. Users]

#### `GET /api/users`
- **Auth**: Required
- **Params**: `?page=1&limit=20`
- **Response**: `{ users: User[], total: number }`

#### `POST /api/users`
- **Auth**: Required (admin)
- **Body**: `{ name: string, email: string }`
- **Response**: `{ user: User }` (201)
- **Errors**: 400 (validation), 409 (duplicate email)

[Repeat for each endpoint]

## Error Format
[Standard error response shape]

## Rate Limits
[If applicable]
```

### DATABASE_SCHEMA.md

```markdown
# Database Schema

## Engine
[e.g. Cloudflare D1 (SQLite), PostgreSQL, MySQL]

## Tables

### `users`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| email | TEXT | UNIQUE, NOT NULL | User email |
| name | TEXT | NOT NULL | Display name |
| created_at | TEXT | NOT NULL, DEFAULT now | ISO timestamp |

### `posts`
[Same format]

## Relationships
[Foreign keys, join patterns, cascading rules]

## Indexes
[Non-primary indexes and why they exist]

## Migrations
- Generate: `npx drizzle-kit generate`
- Apply local: `npx wrangler d1 migrations apply DB --local`
- Apply remote: `npx wrangler d1 migrations apply DB --remote`

## Seed Data
[Reference to seed script if one exists]
```

## Quality Rules

1. **Document what exists, not what's planned** — read the actual code, don't invent endpoints or tables
2. **Include versions** — extract from package.json/lock files, not from memory
3. **Show real response shapes** — copy from TypeScript types or Zod schemas in the code
4. **Keep it scannable** — tables over paragraphs, code blocks over prose
5. **Don't duplicate CLAUDE.md** — if architecture info is already in CLAUDE.md, either move it to ARCHITECTURE.md or reference it
6. **Flag gaps** — if you find undocumented routes or tables without clear purpose, note them with `<!-- TODO: document purpose -->`

## Updating Existing Docs

If docs already exist:
1. Read the existing doc
2. Diff against the current codebase
3. Show the user what's changed (new endpoints, removed tables, updated stack)
4. Apply updates preserving any hand-written notes or sections

Never silently overwrite custom content the user has added to their docs.
