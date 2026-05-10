---
name: project-health
description: "All-in-one project configuration and health management. Sets up new projects (settings.local.json, CLAUDE.md, .gitignore), audits existing projects (permissions, context quality, MCP coverage, leaked secrets, stale docs), tidies accumulated cruft, captures session learnings, and adds permission presets. Uses sub-agents for heavy analysis to keep main context clean. Trigger with 'project health', 'check project', 'setup project', 'kickoff', 'bootstrap', 'tidy permissions', 'clean settings', 'capture learnings', 'audit context', 'add python permissions', or 'init project'."
compatibility: Designed for Claude Code (or similar products)
---

# Project Health

One skill for everything about your project's Claude Code configuration. Run it at the start, middle, or end of a project — it figures out what's needed.

**Goal**: Zero permission prompts, well-organised context files, no cruft.

## When to Use

| You say... | What happens |
|-----------|-------------|
| "project health" / "check project" | Full audit: permissions + context + docs |
| "setup project" / "kickoff" / "bootstrap" | New project setup from scratch |
| "tidy permissions" / "clean settings" | Fix permissions file only |
| "capture learnings" / "update CLAUDE.md" | Save session discoveries |
| "add python" / "add docker permissions" | Add a preset to existing settings |
| "audit context" / "audit memory" | Context-focused audit only |

## Architecture: Sub-Agents

**Heavy analysis runs in sub-agents** to keep the main conversation clean. The main agent orchestrates; sub-agents do the scanning and return summaries.

### Agent 1: Permission Auditor

Launched with `Task(subagent_type: "general-purpose")`. Prompt:

```
Read .claude/settings.local.json.

**Discover connected MCP servers**: Use ToolSearch (search "mcp") and extract unique
server prefixes from tool names (e.g. mcp__vault__secret_list → vault).

**Discover installed skills**: Use the Skill tool or ToolSearch to list available skills.
For each skill that has scripts/ in its directory, note what Bash patterns it needs
(python3, env var prefixes like GEMINI_API_KEY=*, etc.). Check the SKILL.md for any
MCP tools the skill references (e.g. mcp__vault__secret_get).

Report:
1. MCP servers connected but NOT in settings (missing)
2. MCP servers in settings but NOT connected (stale)
3. Skill permissions: Bash patterns and MCP tools that installed skills need but aren't approved
4. File access: check for Read/Edit/Write patterns for .claude/** and //tmp/**
   in project settings, and ~/Documents/**/~/.claude/** in global settings
5. Leaked secrets: entries containing API keys, tokens, bearer strings, hex >20 chars, base64 >20 chars
6. Legacy colon syntax: entries like Bash(git:*) instead of Bash(git *)
7. Junk entries: shell fragments (Bash(do), Bash(fi), Bash(then), Bash(else), Bash(done)),
   __NEW_LINE_* artefacts, loop body fragments (Bash(break), Bash(continue), Bash(echo *))
8. Duplicates: entries covered by a broader pattern (e.g. Bash(git add *) redundant if Bash(git *) exists)
9. Missing presets: based on files present, suggest presets from [permission-presets.md]

Prefer Read/Glob/Grep tools over Bash. If you need to scan multiple files or
run 3+ commands for one analysis, write a Python script to .jez/scripts/
and run it once (mkdir -p .jez/scripts first).

Return a structured summary, not raw data.
```

### Agent 2: Context Auditor

Launched with `Task(subagent_type: "general-purpose")`. Prompt:

```
Audit the project context landscape at [repo-path]:

1. Find all CLAUDE.md files. For each:
   - Count lines (target: root 50-150, subdirs 15-50)
   - Score quality on 6 criteria (see quality-criteria.md)
   - Check for stale file/path references
   - Flag oversized files

2. Find .claude/rules/ topic files. Check sizes (target: 20-80 lines).

3. Detect project type from files present (see project-types.md).
   Check expected docs exist (ARCHITECTURE.md, DATABASE_SCHEMA.md, etc.)

4. Find public markdown (README.md, LICENSE, CONTRIBUTING.md).
   Check for overlap with CLAUDE.md content.

5. Check auto-memory at ~/.claude/projects/*/memory/MEMORY.md

6. If Cloudflare project: find all wrangler.jsonc/wrangler.toml files.
   Check each has "observability": { "enabled": true }. Flag any missing it.

Prefer Read/Glob/Grep tools over Bash. If you need to scan many files or
aggregate data across the repo, write a Python script to .jez/scripts/
and run it once rather than running many individual bash commands
(mkdir -p .jez/scripts first).

Return: project type, quality scores, missing docs, stale refs, overlaps,
size violations, observability gaps, and total markdown footprint.
```

### Parallel Execution

For a full health check, **launch both agents in parallel**:

```
Task(subagent_type: "general-purpose", name: "permission-audit", prompt: "...")
Task(subagent_type: "general-purpose", name: "context-audit", prompt: "...")
```

Both return summaries. The main agent combines them into one report and proposes fixes.

## Mode 1: Full Health Check

**The default.** Run this anytime.

### Steps

1. Launch Permission Auditor and Context Auditor agents **in parallel**
2. Combine findings into a single report:

   ```
   ## Project Health Report

   **Project type**: [detected type]
   **CLAUDE.md quality**: [score]/100 ([grade])

   ### Permissions
   - Missing MCP servers: [list]
   - Leaked secrets: [count] found
   - Legacy syntax: [count] entries
   - Missing presets: [list]

   ### Context
   - Oversized files: [list]
   - Stale references: [list]
   - Missing docs: [list]
   - Overlaps: [list]

   ### Recommended Fixes
   1. [fix 1]
   2. [fix 2]
   ...
   ```

3. Apply fixes after single yes/no confirmation

## Mode 2: New Project Setup

**When**: No `.claude/settings.local.json` exists, or user says "setup" / "kickoff".

### Steps

1. **Detect project type** from files present:

   | Indicator | Type | Preset |
   |-----------|------|--------|
   | `wrangler.jsonc` or `wrangler.toml` | cloudflare-worker | JS/TS + Cloudflare |
   | `vercel.json` or `next.config.*` | vercel-app | JS/TS + Vercel |
   | `astro.config.*` | astro | JS/TS + Static Sites |
   | `package.json` (no deploy target) | javascript-typescript | JS/TS |
   | `pyproject.toml` or `setup.py` or `requirements.txt` | python | Python |
   | `Cargo.toml` | rust | Rust |
   | `go.mod` | go | Go |
   | `Gemfile` or `Rakefile` | ruby | Ruby |
   | `composer.json` or `wp-config.php` | php | PHP |
   | `pom.xml` or `build.gradle*` | java | Java/JVM |
   | `*.sln` or `*.csproj` | dotnet | .NET |
   | `mix.exs` | elixir | Elixir |
   | `Package.swift` | swift | Swift + macOS |
   | `pubspec.yaml` | flutter | Mobile |
   | `Dockerfile` or `docker-compose.yml` | docker | Docker |
   | `fly.toml` or `railway.json` or `netlify.toml` | hosted-app | Hosting Platforms |
   | `supabase/config.toml` | supabase | Hosting + Database |
   | `.claude/agents/` or operational scripts | ops-admin | — |
   | Empty directory | Ask the user | — |

   Types stack (e.g. cloudflare-worker + javascript-typescript).

2. **Generate `.claude/settings.local.json`**:
   - Read [references/permission-presets.md](references/permission-presets.md)
   - Always include Universal Base (includes file access for `.claude/**`, `//tmp/**`)
   - Add detected language + deployment presets
   - Check if global `~/.claude/settings.local.json` has home-relative file access
     patterns (`~/Documents/**`, `~/.claude/**`). If not, suggest adding them there
     (NOT in the project file — home paths belong in global settings only)
   - **Launch Permission Auditor agent** to discover MCP servers and add per-server wildcards
   - Always include `WebSearch`, `WebFetch`
   - Always include explicit `gh` subcommands (workaround for `Bash(gh *)` bug)
   - Write with `//` comment groups

3. **Generate `CLAUDE.md`**:
   - Read [references/templates.md](references/templates.md)
   - Use project-type-appropriate template

4. **Generate `.gitignore`**:
   - Read [references/templates.md](references/templates.md)
   - Always include `.claude/settings.local.json`, `.claude/plans/`, `.jez/screenshots/`, `.jez/artifacts/`
   - Do NOT gitignore `.jez/scripts/` — generated scripts are worth keeping

5. **Optionally** (ask first): `git init` + `gh repo create`

6. **Warn**: "Project settings.local.json SHADOWS global settings (does not merge). Session restart needed."

## Mode 3: Tidy Permissions

**When**: User says "tidy permissions" or health check found permission issues.

Launch the Permission Auditor agent, then apply its recommended fixes.

## Mode 4: Capture Learnings

**When**: End of session, "capture learnings", "save what we learned".

This runs in the **main context** (not a sub-agent) because it needs access to the conversation history.

1. Review conversation for discoveries worth preserving
2. Decide placement:
   ```
   Applies to all projects?
   ├── YES → ~/.claude/rules/<topic>.md
   └── NO  → Specific to a subdirectory?
       ├── YES → <dir>/CLAUDE.md
       └── NO  → Reference or operational?
           ├── Reference → docs/ or ARCHITECTURE.md
           └── Operational → ./CLAUDE.md (root)
   ```
3. Draft all changes as diffs in a single batch
4. Apply after single yes/no confirmation

**Keep it concise**: one line per concept.

## Mode 5: Add Preset

**When**: "add python permissions", "add docker", "add MCP servers".

1. Read the preset from [references/permission-presets.md](references/permission-presets.md)
2. Read existing `.claude/settings.local.json`
3. Merge without duplicating
4. Remind: **session restart required**

## Mode 6: Restructure Context

**When**: Root CLAUDE.md over 200 lines, "restructure memory".

1. Launch Context Auditor agent first
2. Based on findings:
   - Split oversized CLAUDE.md into `.claude/rules/<topic>.md`
   - Extract directory-specific content to sub-directory CLAUDE.md
   - Move reference material to `docs/`
   - Resolve overlaps
   - Create missing docs for project type
3. Present plan, apply after approval

### Size Targets

| File | Target | Maximum |
|------|--------|---------|
| Root CLAUDE.md | 50-150 lines | 200 |
| Sub-directory CLAUDE.md | 15-50 lines | 80 |
| Rules topic file | 20-80 lines | 120 |

## Permission Syntax Quick Reference

| Pattern | Meaning |
|---------|---------|
| `Bash(git *)` | Preferred — space before `*` = word boundary |
| `Bash(nvidia-smi)` | Exact match, no arguments |
| `WebFetch` | Blanket web fetch |
| `WebSearch` | Blanket web search |
| `mcp__servername__*` | All tools on one MCP server |

### What Does NOT Work

| Pattern | Why |
|---------|-----|
| `mcp__*` | Wildcard doesn't cross `__` boundary |
| `mcp__*__*` | Still doesn't work |
| `Bash(git:*)` | Deprecated colon syntax (works but prefer space) |

### Important Behaviours

- **Not hot-reloaded**: `settings.local.json` edits need session restart
- **"Don't ask again"** injects at runtime (no restart) using colon format — normal
- **Shadows, not merges**: Project settings completely replace global
- **`gh` bug**: `Bash(gh *)` sometimes misses subcommands — include explicit `Bash(gh issue *)` etc.

## Autonomy

- **Just do it**: Detect project type, launch audit agents, discover MCP servers
- **Brief confirmation**: Write/update files (single batch yes/no)
- **Ask first**: git init, GitHub repo, delete existing content, major restructures

## Reference Files

| When | Read |
|------|------|
| Building permission presets | [references/permission-presets.md](references/permission-presets.md) |
| Generating CLAUDE.md, .gitignore | [references/templates.md](references/templates.md) |
| Scoring CLAUDE.md quality | [references/quality-criteria.md](references/quality-criteria.md) |
| Detecting project type + expected docs | [references/project-types.md](references/project-types.md) |
| Setting up commit capture hook | [references/commit-hook.md](references/commit-hook.md) |
