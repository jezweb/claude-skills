---
name: fork-discipline
description: "Audit and enforce the core/client boundary in multi-client projects. Detects where shared platform code is tangled with client-specific code, finds hardcoded client checks, config files that replace instead of merge, scattered client code, migration conflicts, and missing extension points. Produces a boundary map, violation report, and refactoring plan. Optionally generates FORK.md documentation and restructuring scripts. Triggers: 'fork discipline', 'check the boundary', 'is this core or client', 'platform audit', 'client separation', 'fork test', 'refactor for multi-client', 'clean up the fork'."
compatibility: Designed for Claude Code (or similar products)
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Fork Discipline

Audit the core/client boundary in multi-client codebases. Every multi-client project should have a clean separation between shared platform code (core) and per-deployment code (client). This skill finds where that boundary is blurred and shows you how to fix it.

## The Principle

```
project/
  src/            ← CORE: shared platform code. Never modified per client.
  config/         ← DEFAULTS: base config, feature flags, sensible defaults.
  clients/
    client-name/  ← CLIENT: everything that varies per deployment.
      config      ← overrides merged over defaults
      content     ← seed data, KB articles, templates
      schema      ← domain tables, migrations (numbered 0100+)
      custom/     ← bespoke features (routes, pages, tools)
```

**The fork test**: Before modifying any file, ask "is this core or client?" If you can't tell, the boundary isn't clean enough.

## When to Use

- Before adding a second or third client to an existing project
- After a project has grown organically and the boundaries are fuzzy
- When you notice `if (client === 'acme')` checks creeping into shared code
- Before a major refactor to understand what's actually shared vs specific
- When onboarding a new developer who needs to understand the architecture
- Periodic health check on multi-client projects

## Modes

| Mode | Trigger | What it produces |
|------|---------|-----------------|
| **audit** | "fork discipline", "check the boundary" | Boundary map + violation report |
| **document** | "write FORK.md", "document the boundary" | FORK.md file for the project |
| **refactor** | "clean up the fork", "enforce the boundary" | Refactoring plan + migration scripts |

Default: **audit**

---

## Audit Mode

### Step 1: Detect Project Type

Determine if this is a multi-client project and what pattern it uses:

| Signal | Pattern |
|--------|---------|
| `clients/` or `tenants/` directory | Explicit multi-client |
| Multiple config files with client names | Config-driven multi-client |
| `packages/` with shared + per-client packages | Monorepo multi-client |
| Environment variables like `CLIENT_NAME` or `TENANT_ID` | Runtime multi-client |
| Only one deployment, no client dirs | Single-client (may be heading multi-client) |

If single-client: check if the project CLAUDE.md or codebase suggests it will become multi-client. If so, audit for readiness. If genuinely single-client forever, this skill isn't needed.

### Step 2: Map the Boundary

Build a boundary map by scanning the codebase:

```
CORE (shared by all clients):
  src/server/          → API routes, middleware, auth
  src/client/          → React components, hooks, pages
  src/db/schema.ts     → Shared database schema
  migrations/0001-0050 → Core migrations

CLIENT (per-deployment):
  clients/acme/config.ts    → Client overrides
  clients/acme/kb/          → Knowledge base articles
  clients/acme/seed.sql     → Seed data
  migrations/0100+          → Client schema extensions

BLURRED (needs attention):
  src/server/routes/acme-custom.ts  → Client code in core!
  src/config/defaults.ts line 47    → Hardcoded client domain
```

### Step 3: Find Violations

Scan for these specific anti-patterns:

#### Client Names in Core Code

```bash
# Search for hardcoded client identifiers in shared code
grep -rn "acme\|smith\|client_name_here" src/ --include="*.ts" --include="*.tsx"

# Search for client-specific conditionals
grep -rn "if.*client.*===\|switch.*client\|case.*['\"]acme" src/ --include="*.ts" --include="*.tsx"

# Search for environment-based client checks in shared code
grep -rn "CLIENT_NAME\|TENANT_ID\|process.env.*CLIENT" src/ --include="*.ts" --include="*.tsx"
```

**Severity**: High. Every hardcoded client check in core code means the next client requires modifying shared code.

#### Config Replacement Instead of Merge

Check if client configs replace entire files or merge over defaults:

```typescript
// BAD — client config is a complete replacement
// clients/acme/config.ts
export default {
  theme: { primary: '#1E40AF' },
  features: { emailOutbox: true },
  // Missing all other defaults — they're lost
}

// GOOD — client config is a delta merged over defaults
// clients/acme/config.ts
export default {
  theme: { primary: '#1E40AF' },  // Only overrides what's different
}
// config/defaults.ts has everything else
```

Look for: client config files that are suspiciously large (close to the size of the defaults file), or client configs that define fields the defaults already handle.

**Severity**: Medium. Stale client configs miss new defaults and features.

#### Scattered Client Code

Check if client-specific code lives outside the client directory:

```bash
# Files with client names in their path but inside src/
find src/ -name "*acme*" -o -name "*smith*" -o -name "*client-name*"

# Routes or pages that serve a single client
grep -rn "// only for\|// acme only\|// client-specific" src/ --include="*.ts" --include="*.tsx"
```

**Severity**: High. Client code in `src/` means core is not truly shared.

#### Missing Extension Points

Check if core has mechanisms for client customisation without modification:

| Extension point | How to check | What it enables |
|----------------|-------------|-----------------|
| Config merge | Does `config/` have a merge function? | Client overrides without replacing |
| Dynamic imports | Does core look for `clients/{name}/custom/`? | Client-specific routes/pages |
| Feature flags | Are features toggled by config, not code? | Enable/disable per client |
| Theme tokens | Are colours/styles in variables, not hardcoded? | Visual customisation |
| Content injection | Can clients provide seed data, templates? | Per-client content |
| Hook/event system | Can clients extend behaviour without patching? | Custom business logic |

**Severity**: Medium. Missing extension points force client code into core.

#### Migration Number Conflicts

```bash
# List all migration files with their numbers
ls migrations/ | sort | head -20

# Check if client migrations are in the reserved ranges
# Core: 0001-0099, Client domain: 0100-0199, Client custom: 0200+
```

**Severity**: Low until it causes a conflict, then Critical.

#### Feature Flags vs Client Checks

```typescript
// BAD — client name check
if (clientName === 'acme') {
  showEmailOutbox = true;
}

// GOOD — feature flag in config
if (config.features.emailOutbox) {
  showEmailOutbox = true;
}
```

Search for patterns where behaviour branches on client identity instead of configuration.

### Step 4: Produce the Report

Write to `.jez/artifacts/fork-discipline-audit.md`:

```markdown
# Fork Discipline Audit: [Project Name]
**Date**: YYYY-MM-DD
**Pattern**: [explicit multi-client / config-driven / monorepo / single-heading-multi]
**Clients**: [list of client deployments]

## Boundary Map

### Core (shared)
| Path | Purpose | Clean? |
|------|---------|--------|
| src/server/ | API routes | Yes / No — [issue] |

### Client (per-deployment)
| Client | Config | Content | Schema | Custom |
|--------|--------|---------|--------|--------|
| acme | config.ts | kb/ | 0100-0120 | custom/routes/ |

### Blurred (needs attention)
| Path | Problem | Suggested fix |
|------|---------|--------------|
| src/routes/acme-custom.ts | Client code in core | Move to clients/acme/custom/ |

## Violations

### High Severity
[List with file:line, description, fix]

### Medium Severity
[List with file:line, description, fix]

### Low Severity
[List]

## Extension Points
| Point | Present? | Notes |
|-------|----------|-------|
| Config merge | Yes/No | |
| Dynamic imports | Yes/No | |
| Feature flags | Yes/No | |

## Health Score
[1-10] — [explanation]

## Top 3 Recommendations
1. [Highest impact fix]
2. [Second priority]
3. [Third priority]
```

---

## Document Mode

Generate a `FORK.md` for the project root that documents the boundary:

```markdown
# Fork Discipline

## Architecture

This project serves multiple clients from a shared codebase.

### What's Core (don't modify per client)
[List of directories and their purpose]

### What's Client (varies per deployment)
[Client directory structure with explanation]

### How to Add a New Client
1. Copy `clients/_template/` to `clients/new-client/`
2. Edit `config.ts` with client overrides
3. Add seed data to `content/`
4. Create migrations numbered 0100+
5. Deploy with `CLIENT=new-client wrangler deploy`

### The Fork Test
Before modifying any file: is this core or client?
- Core → change in `src/`, all clients benefit
- Client → change in `clients/name/`, no other client affected
- Can't tell → the boundary needs fixing first

### Migration Numbering
| Range | Owner |
|-------|-------|
| 0001-0099 | Core platform |
| 0100-0199 | Client domain schema |
| 0200+ | Client custom features |

### Config Merge Pattern
Client configs are shallow-merged over defaults:
[Show the actual merge code from the project]
```

---

## Refactor Mode

After an audit, generate the concrete steps to enforce the boundary:

### 1. Move Client Code Out of Core

For each violation where client code lives in `src/`:

```bash
# Create client directory if it doesn't exist
mkdir -p clients/acme/custom/routes

# Move the file
git mv src/routes/acme-custom.ts clients/acme/custom/routes/

# Update imports in core to use dynamic discovery
```

### 2. Replace Client Checks with Feature Flags

For each `if (client === ...)` in core:

```typescript
// Before (in src/)
if (clientName === 'acme') {
  app.route('/email-outbox', emailRoutes);
}

// After (in src/) — feature flag
if (config.features.emailOutbox) {
  app.route('/email-outbox', emailRoutes);
}

// After (in clients/acme/config.ts) — client enables it
export default {
  features: { emailOutbox: true }
}
```

### 3. Implement Config Merge

If the project replaces configs instead of merging:

```typescript
// config/resolve.ts
import defaults from './defaults';

export function resolveConfig(clientConfig: Partial<Config>): Config {
  return {
    ...defaults,
    ...clientConfig,
    features: { ...defaults.features, ...clientConfig.features },
    theme: { ...defaults.theme, ...clientConfig.theme },
  };
}
```

### 4. Add Extension Point for Custom Routes

If clients need custom routes but currently modify core:

```typescript
// src/server/index.ts — auto-discover client routes
const clientRoutes = await import(`../../clients/${clientName}/custom/routes`)
  .catch(() => null);
if (clientRoutes?.default) {
  app.route('/custom', clientRoutes.default);
}
```

### 5. Generate the Refactoring Script

Write a script to `.jez/scripts/fork-refactor.sh` that:
- Creates the client directory structure
- Moves identified files
- Updates import paths
- Generates the FORK.md

---

## The Right Time to Run This

| Client count | What to do |
|-------------|-----------|
| 1 | Don't refactor. Just document the boundary (FORK.md) so you know where it is. |
| 2 | Run the audit. Fix high-severity violations. Start the config merge pattern. |
| 3+ | Full refactor mode. The boundary must be clean — you now have proof of what varies. |

**Rule 5 from the discipline**: Don't abstract until client #3. With 1 client you're guessing. With 2 you're pattern-matching. With 3+ you know what actually varies.

## Tips

- Run this before adding a new client, not after
- The boundary map is the most valuable output — print it, put it on the wall
- Config merge is the single highest-ROI refactor — do it first
- Feature flags are better than `if (client)` even with one client
- If you find yourself saying "this is mostly the same for all clients except..." that's a feature flag, not a fork
- The FORK.md is for the team, not just for Claude — write it like a human will read it
