# Claude Skills

**Repository**: https://github.com/jezweb/claude-skills
**Owner**: Jeremy Dawes (Jez) | Jezweb

Production workflow skills for Claude Code CLI. Each skill guides Claude through a recipe to produce tangible output: working deliverables, not knowledge dumps.

## Philosophy

- Every skill must produce visible output (files, configurations, deployable projects); reference material Claude already knows does not earn a place.
- "The context window is a public good": only include what Claude doesn't already know.
- **Teach patterns, not ship scripts**: skills teach Claude *what* to do, and Claude generates scripts adapted to the user's environment. Pre-built scripts in `scripts/` are the rare exception; proven implementation patterns go in `references/` for Claude to adapt.
- Follow the official Claude Code plugin spec.

## Layout

`plugins/<plugin>/skills/<skill>/`, one folder per plugin and skill; `.claude-plugin/` holds `marketplace.json` and `plugin.json`; `README.md` is the public overview; `LICENSE` is MIT. The folders are the truth, so this file lists no plugins, skills or counts. A plugin carries `.claude-plugin/plugin.json` (name, description, author) and auto-discovers its `skills/`; the skill folder layout is `SKILL_SHAPE.md` "Multi-file layout".

## Adding a New Plugin

1. `mkdir -p plugins/my-plugin/{.claude-plugin,skills}`
2. Create `.claude-plugin/plugin.json`:
   ```json
   {
     "name": "my-plugin",
     "description": "What this plugin does.",
     "author": { "name": "Jeremy Dawes / Jezweb", "email": "jeremy@jezweb.net" }
   }
   ```
3. Add skills inside `plugins/my-plugin/skills/`, each with SKILL.md.
4. Add an entry to `.claude-plugin/marketplace.json`:
   ```json
   { "name": "my-plugin", "description": "...", "source": "./plugins/my-plugin", "category": "development" }
   ```
5. Update the table in README.md.

**Categories**: `development`, `design`, `productivity`, `testing`, `security`, `database`, `monitoring`, `deployment`

## Creating a Skill

[`SKILL_SHAPE.md`](SKILL_SHAPE.md) is the canonical authoring guide: frontmatter, sections in order, what earns its place, what to leave out, and the trimming pass for existing skills. Quick start: [Anthropic's official skill-creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md), or ask Claude "Create a new skill for [use case]".

- **Inline everything critical.** If the agent skipping it would derail the workflow, it goes in the SKILL.md body: workflow steps, commands, scripts, mapping tables. An agent told to "see references/..." for a must-do step skips the file and improvises.
- **Where the rest goes**: `scripts/` holds helpers the agent runs without reading, `references/` variant or optional docs, `assets/` templates copied into user projects. A long skill that works beats a short one with its critical content in references (`SKILL_SHAPE.md` "Length and progressive disclosure" reconciles this with the 500-line signal).
- **Frontmatter**: `description` has no angle brackets and includes trigger phrases; optional keys are `license`, `compatibility`, `allowed-tools`, `metadata`. Name and length limits: the `SKILL_SHAPE.md` authoring checklist.

## Quality Bar

Before committing a skill, run the `SKILL_SHAPE.md` authoring checklist (valid frontmatter, critical path inline, tested on a real task), and also check that it:
- Produces tangible output, not just reference material.
- Is rich enough that the agent doesn't need to improvise: exact commands, scripts, mapping tables.
- Is not brutally summarised: detail beats brevity when the detail prevents mistakes.

## Installing Plugins

Marketplace install: README "Quick Start". Local dev loads a single plugin without install: `claude --plugin-dir ./plugins/cloudflare`. After installing, restart Claude Code to load new plugins.

## Skill Errata (ERRATA.md)

When a library update changes behaviour a skill described correctly, capture the correction in `ERRATA.md` beside SKILL.md rather than rewriting the skill at once. Status lifecycle: `active` (current correction), `absorbed` (folded into SKILL.md), `outdated` (library changed again). Only for version-specific issues; fix typos and obvious mistakes in SKILL.md directly.

## Git History

Retired skills live in `archive/` (not loaded by any plugin; see `archive/README.md`). The 105 v1-era skills are preserved at tag `v1-final`; 13 previously archived skills are on branch `archive/low-priority-skills`.
