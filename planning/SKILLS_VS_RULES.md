# Skills vs Rules: Strategic Content Placement

**Purpose**: Guide for deciding whether content belongs in a Skill (SKILL.md) or a Rule (rules/*.md)
**Last Updated**: 2025-12-27
**Related**: `/reflect` command (has routing logic), CLAUDE.md (high-level overview)

---

## The Core Distinction

| Aspect | Skills | Rules |
|--------|--------|-------|
| **Trigger** | Keyword discovery (passive) | GLOB file patterns (active) |
| **Loading** | Claude searches for relevant skill | Auto-injected when editing matching files |
| **Precision** | Full context when discovered | Targeted intervention at exact moment needed |
| **Token usage** | Entire SKILL.md loaded | Just the rule content |
| **Scope** | User-level (~/.claude/skills/) | Project or user-level (.claude/rules/ or ~/.claude/rules/) |
| **Purpose** | **Teach** Claude how to use a technology | **Correct** specific patterns in real-time |

### Mental Model

**Skills = Teaching** (comprehensive knowledge for building with a technology)
**Rules = Correcting** (precise interventions when Claude would otherwise use outdated patterns)

---

## What Belongs in Skills (SKILL.md)

Skills are for **comprehensive knowledge** that Claude needs when working with a technology from scratch.

### 1. Setup Guides ("Quick Start")
Complete instructions for scaffolding a project:
```markdown
## Quick Start (5 Minutes)

```bash
npm create cloudflare@latest my-worker
npm install hono@4.10.6
```
```

**Why skill**: User explicitly invokes skill for setup guidance. Comprehensive context needed.

### 2. Architecture Explanations
Multi-step mandatory patterns that define how a technology works:
```markdown
## The Four-Step Architecture (MANDATORY)

### Step 1: Define CSS Variables at Root
### Step 2: Map Variables to Tailwind Utilities
### Step 3: Apply Base Styles
### Step 4: Result - Automatic Dark Mode
```

**Why skill**: Architecture is teaching, not correcting. Needs full context.

### 3. Templates and Scaffolding
Complete, copy-paste-ready code in `templates/` directory:
- `templates/vite.config.ts`
- `templates/wrangler.jsonc`
- `templates/package.json`

**Why skill**: Resources bundled with skill, loaded when Claude needs to scaffold.

### 4. "When to Use" Guidance
Decision support for choosing this technology:
```markdown
### Use ai-sdk-core when:
- Building backend AI features
- Implementing server-side text generation
- Creating structured AI outputs

### Don't use this skill when:
- Building React chat UIs (use ai-sdk-ui instead)
```

**Why skill**: High-level guidance, not file-specific.

### 5. Reference Documentation
Deep dives on specific topics in `references/` directory:
- `references/dark-mode.md`
- `references/migration-guide.md`
- `references/api-patterns.md`

**Why skill**: Loaded on-demand when Claude needs depth.

### 6. Error Solutions with Context
Full troubleshooting with root causes and solutions:
```markdown
### Issue #3: Scheduled/Cron Not Exported
**Error**: "Handler does not export a scheduled() function"
**Source**: [honojs/vite-plugins #275](...)
**Why It Happens**: Vite plugin doesn't expose scheduled handler
**Prevention**: Use Module Worker format when needed
```

**Why skill**: Full context helps Claude understand *why*, not just *what*.

### 7. Production Validation
Evidence that patterns work:
```markdown
**Production-tested**: WordPress Auditor (https://...)
**Build Time**: 45 min
**Errors**: 0 (all 8 issues prevented)
```

**Why skill**: Validation context, not correction.

---

## What Belongs in Rules (rules/*.md)

Rules are for **precise corrections** that should trigger automatically when Claude is about to make a mistake.

### 1. "If Claude Suggests X, Use Y Instead" Tables

The gold standard for rule content:
```markdown
## Quick Fixes

| If Claude suggests... | Use instead... |
|----------------------|----------------|
| `@tailwind base` | `@import "tailwindcss"` |
| `tailwind.config.ts` | `@theme inline` in CSS |
| `tailwindcss-animate` | `tw-animate-css` |
| `maxTokens` | `maxOutputTokens` |
```

**Why rule**: File-triggered correction at the exact moment Claude would suggest wrong pattern.

### 2. Version Migration Corrections

Breaking changes between versions:
```markdown
## Critical v4→v5 Breaking Changes

### Parameter Renames
```typescript
/* ❌ v4 (Claude may suggest this) */
maxTokens: 500

/* ✅ v5 (use this) */
maxOutputTokens: 500
```
```

**Why rule**: Claude's training cutoff means it may suggest old patterns. Auto-correct when editing.

### 3. Current Model/Package Names

Version-specific identifiers that change frequently:
```markdown
## Current Model Names (2025)

```typescript
/* ❌ Deprecated models */
'gpt-3.5-turbo'  // Deprecated
'gpt-4'          // Deprecated

/* ✅ Current models */
'gpt-5.1'        // Latest (Nov 2025)
'gpt-5'          // Previous flagship
```
```

**Why rule**: Models change frequently. Auto-inject current names when editing AI code.

### 4. Syntax Corrections

Patterns that changed between versions:
```markdown
## CSS Syntax
```css
/* ❌ v3 (Claude may suggest this) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ✅ v4 (use this) */
@import "tailwindcss";
```
```

**Why rule**: Triggered when editing CSS files. Precise intervention.

### 5. File-Scoped Patterns

Patterns that only apply to specific file types:
```yaml
---
paths: "**/*.css", "**/*.tsx", tailwind.config.*, postcss.config.*
---
```

**Why rule**: GLOB patterns ensure rule only loads when relevant.

### 6. Common Mistake Prevention

Specific errors to avoid:
```markdown
## DALL-E 3 Single Image Only

```typescript
/* ❌ n > 1 not supported */
const response = await openai.images.generate({
  model: 'dall-e-3',
  n: 4, // Error!
})

/* ✅ DALL-E 3 only supports n: 1 */
const response = await openai.images.generate({
  model: 'dall-e-3',
  n: 1,
})
```
```

**Why rule**: Prevents specific mistake when editing image generation code.

---

## Rule Format Standard

Every rule file follows this structure:

```markdown
---
paths: "[comma-separated GLOB patterns]"
---

# [Technology] Corrections

Claude's training may reference [older version]. This project uses **[current version]**.

## [Category Name]

```typescript
/* ❌ Old pattern (Claude may suggest this) */
[wrong code]

/* ✅ Current pattern (use this) */
[correct code]
```

## Quick Fixes

| If Claude suggests... | Use instead... |
|----------------------|----------------|
| `[wrong]` | `[correct]` |
```

### GLOB Pattern Examples

| Pattern | Matches |
|---------|---------|
| `**/*.ts` | All TypeScript files |
| `**/*.tsx` | All React component files |
| `**/*.css` | All CSS files |
| `wrangler.jsonc` | Exact filename |
| `src/server/**/*.ts` | TypeScript in server directory |
| `**/*form*.ts` | Files with "form" in name |
| `app/**/page.tsx` | Next.js page files |
| `tailwind.config.*` | Tailwind config (any extension) |

---

## Decision Framework

When you have content to add, ask these questions:

### Question 1: Is this a correction or teaching?

- **Correction** (Claude would suggest wrong pattern) → **Rule**
- **Teaching** (how to use technology) → **Skill**

### Question 2: Is this file-scoped?

- **Yes** (applies to specific file types) → **Rule**
- **No** (general knowledge) → **Skill**

### Question 3: Does this need full context?

- **Yes** (architecture, setup, "when to use") → **Skill**
- **No** (simple pattern swap) → **Rule**

### Question 4: How often does this change?

- **Frequently** (model names, package versions) → **Rule** (easier to update)
- **Rarely** (architecture, concepts) → **Skill**

### Question 5: What's the token efficiency?

- **Small, targeted** → **Rule** (minimal token overhead)
- **Large, comprehensive** → **Skill** (only loads when discovered)

---

## Common Content Types: Placement Guide

| Content Type | Skill | Rule | Notes |
|--------------|-------|------|-------|
| Quick Start guide | ✅ | ❌ | Full setup context needed |
| Architecture explanation | ✅ | ❌ | Teaching, not correcting |
| Version migration | 🔶 | ✅ | Summary in skill, corrections in rule |
| Current package versions | 🔶 | ✅ | Reference in skill, corrections in rule |
| Current model names | ❌ | ✅ | Changes frequently, file-triggered |
| "If X, use Y" tables | ❌ | ✅ | Core rule content |
| Error solutions (full) | ✅ | 🔶 | Full context in skill, quick fix in rule |
| Templates/scaffolding | ✅ | ❌ | Bundled resources |
| "When to use" guidance | ✅ | ❌ | High-level decision support |
| API reference | ✅ | ❌ | Comprehensive documentation |
| Breaking changes | 🔶 | ✅ | Explanation in skill, correction in rule |
| Production validation | ✅ | ❌ | Context for skill |

**Legend**: ✅ Primary home | 🔶 Secondary/summary | ❌ Not appropriate

---

## Example: Ideal Skill + Rule Split

### tailwind-v4-shadcn

**SKILL.md (Teaching)**:
- Quick Start (5 minutes)
- Four-Step Architecture (mandatory pattern)
- Dark Mode Setup
- Setup Checklist
- Templates reference
- Production validation
- Official documentation links

**rules/tailwind-v4-shadcn.md (Correcting)**:
- No `tailwind.config.ts` (use CSS)
- `@import "tailwindcss"` not `@tailwind base`
- `tw-animate-css` not `tailwindcss-animate`
- `@plugin` not `require()`
- Variable architecture quick reference
- Quick Fixes table

### ai-sdk-core

**SKILL.md (Teaching)**:
- v6 Beta features overview
- Latest AI models reference
- Core functions documentation
- Stream response methods
- 12 errors & solutions (with context)
- When to use this skill vs others
- Official docs links

**rules/ai-sdk-core.md (Correcting)**:
- `maxOutputTokens` not `maxTokens`
- `inputSchema` not `parameters`
- `stopWhen(stepCountIs(n))` not `maxSteps`
- `@ai-sdk/react` not `ai/react`
- Workers startup fix pattern
- Current model names

---

## Identifying Rule Extraction Opportunities

Look for these patterns in existing SKILL.md files:

### 1. Duplicated "Critical Rules" Sections

If SKILL.md has:
```markdown
## Critical Rules

### ✅ Always Do:
1. Wrap colors with `hsl()` in `:root`

### ❌ Never Do:
1. Put `:root`/`.dark` inside `@layer base`
```

→ Extract to rule as "If Claude suggests X, use Y"

### 2. "Common Errors & Solutions" That Are Pattern Swaps

If the error solution is a simple pattern swap:
```markdown
### ❌ tw-animate-css Import Error
**Solution**: Use `tw-animate-css` not `tailwindcss-animate`
```

→ Extract to Quick Fixes table in rule

### 3. Version-Specific Information

If SKILL.md has sections like:
```markdown
## GPT-5.1 (Released November 13, 2025)
**BREAKING CHANGE**: GPT-5.1 defaults to `reasoning_effort: 'none'`
```

→ Extract correction to rule, keep feature overview in skill

### 4. Package Version References in Prose

If versions are scattered through SKILL.md:
```markdown
Install `hono@4.10.6` and `@cloudflare/vite-plugin@1.15.2`...
```

→ Centralize in rule for easier updates

---

## Migration Strategy for Existing Skills

### Phase 1: Audit (Current State)

Most skills already have rules in `skills/*/rules/`. Check if:
1. Rule covers all correction patterns from SKILL.md
2. SKILL.md has redundant correction content
3. Quick Fixes table is comprehensive

### Phase 2: Extract Redundant Corrections

For each skill:
1. Identify "If X, use Y" patterns in SKILL.md
2. Move to `rules/[skill-name].md`
3. Keep teaching context in SKILL.md (why, not just what)

### Phase 3: Consolidate Version Info

1. Create comprehensive Quick Fixes table in rule
2. Keep version reference in skill header
3. Rule becomes the "living" version document

### Phase 4: Update Templates

Ensure `templates/SKILL-TEMPLATE.md` and rule template guide this split.

---

## Anti-Patterns to Avoid

### ❌ Putting Teaching Content in Rules

Rules should not explain *why* - just correct patterns:
```markdown
/* ❌ Too much context for a rule */
## Why Tailwind v4 Uses CSS-First Config

Tailwind v4 represents a paradigm shift from JavaScript-based
configuration to CSS-first design. This enables...

/* ✅ Correct rule format */
## Configuration

```css
/* ❌ v3 - tailwind.config.ts */
/* ✅ v4 - in CSS file with @theme inline */
```
```

### ❌ Putting Corrections in CLAUDE.md

Technology corrections should NOT go in CLAUDE.md:
```markdown
/* ❌ WRONG: Adds to CLAUDE.md */
Remember to use @import "tailwindcss" not @tailwind base

/* ✅ CORRECT: Create rule with paths: "**/*.css" */
```

CLAUDE.md is for personal preferences and workflow conventions, not tech corrections.

### ❌ Duplicating Content Between Skill and Rule

Each piece of knowledge should have ONE home:
- Teaching context → Skill
- Correction pattern → Rule
- Don't repeat the same information in both

### ❌ Rules Without GLOB Patterns

Every rule MUST have paths:
```yaml
---
paths: "**/*.ts", "**/*.tsx"  # Required!
---
```

Without paths, the rule won't trigger automatically.

---

## Summary

**Use Skills for**:
- Complete setup guides
- Architecture explanations
- Templates and scaffolding
- "When to use" guidance
- Error solutions with full context
- Production validation

**Use Rules for**:
- Version corrections (v3→v4, v4→v5)
- "If Claude suggests X, use Y" tables
- Current model/package names
- Syntax corrections
- Breaking change patterns
- File-scoped interventions

**The key insight**: Skills are passive (discovered when needed), rules are active (injected when editing matching files). Rules provide precise, targeted corrections at the exact moment Claude would otherwise make a mistake.

---

## Related Documentation

- **CLAUDE.md**: Repository overview, mentions rules/skills distinction
- **/reflect command**: Has routing logic for deciding content destination
- **planning/claude-code-skill-standards.md**: Official skill format
- **templates/SKILL-TEMPLATE.md**: Skill creation template
- **skills/tailwind-v4-shadcn/**: Gold standard example of skill + rule split

---

## Appendix: Current Rule Extraction Opportunities

Based on analysis of existing skills, here are specific opportunities to move content from SKILL.md to rules:

### High Priority (Significant Overlap)

#### 1. tailwind-v4-shadcn
**Current State**: SKILL.md has "Critical Rules" section (✅ Always Do / ❌ Never Do) that duplicates rule content.

**Extract to Rule**:
- Lines 149-163: "Never Do" list → Quick Fixes table
- Lines 166-266: "Common Errors & Solutions" → Condensed corrections

**Keep in Skill**:
- Four-Step Architecture (teaching)
- Setup Checklist
- Templates reference

#### 2. ai-sdk-core
**Current State**: ~850-line SKILL.md with extensive v4→v5 migration guide. Rule has ~115 lines.

**Extract to Rule**:
- Lines 213-337: Migration examples → Expand rule's Quick Fixes table
- Lines 340-495: Error solutions that are simple pattern swaps
- Workers startup fix already in rule ✅

**Keep in Skill**:
- v6 Beta feature overview
- Model reference (summary)
- "When to use" guidance
- Error solutions needing full context

#### 3. cloudflare-worker-base
**Current State**: ~195-line SKILL.md with 8 known issues. Has 140-line rule covering some patterns.

**Extract to Rule**:
- Issue #1 (export syntax) → Add pattern to rule
- Issue #2 (routing conflicts) → Add run_worker_first pattern
- Issue #3 (scheduled handler) → Add Module Worker format
- Issue #6 (Service Worker format) → Add ES Module correction

**Keep in Skill**:
- Quick Start guide
- Full issue explanations with GitHub links
- Production validation

### Medium Priority (Some Overlap)

#### 4. openai-api
**Current State**: ~870-line SKILL.md, ~100-line rule. Rule could be expanded.

**Extract to Rule**:
- GPT-5.1 reasoning defaults (partially covered)
- DALL-E 3 n:1 limitation
- Streaming error handling patterns
- More deprecated model names

**Keep in Skill**:
- API reference sections
- Full error handling examples
- When to use vs openai-responses

#### 5. clerk-auth
**Current State**: ~380-line SKILL.md, ~100-line rule. Good balance but some overlap.

**Extract to Rule**:
- JWT size patterns (partially covered)
- 431 error fix (already in rule ✅)
- More API version corrections

**Keep in Skill**:
- Testing setup with Playwright
- JWT shortcodes reference
- Full known issues with context

### Lower Priority (Already Well-Split)

These skills have good skill/rule balance:
- `zustand-state-management` - Rule covers v4→v5 changes
- `drizzle-orm-d1` - Rule covers D1-specific patterns
- `tanstack-query` - Rule covers v5 breaking changes
- `nextjs` - Rule covers async params (Next.js 15)

### Skills Without Rules (Need Creation)

Some skills lack rules/ directories entirely:
- `neon-vercel-postgres`
- `vercel-kv`
- `vercel-blob`
- `tinacms`
- `sveltia-cms`
- `ts-agent-sdk`

**Assessment**: These may not need rules if there are no significant training cutoff issues. Check each for correction patterns before creating.

---

**Last Updated**: 2025-12-27
