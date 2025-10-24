# Tailwind v4 + shadcn/ui Skill

**Status**: Production Ready ✅
**Last Updated**: 2025-10-20
**Production Tested**: WordPress Auditor (https://wordpress-auditor.webfonts.workers.dev)

---

## Auto-Trigger Keywords

This skill should be invoked when user mentions ANY of:

### Primary Triggers:
- `tailwind v4`
- `tailwind css v4`
- `shadcn/ui`
- `shadcn ui`
- `vite + react + tailwind`
- `@tailwindcss/vite`

### Secondary Triggers:
- `dark mode setup`
- `theme provider`
- `theme switching`
- `@theme inline`
- `css variables not working`
- `colors not applying`
- `tailwind utilities missing`

### Error-Based Triggers:
- `tw-animate-css` (common error)
- `@apply deprecated`
- `dark: variant not working`
- `colors all black/white`
- `bg-primary doesn't work`

---

## What This Skill Does

Sets up **production-ready** Vite + React + Tailwind CSS v4 + shadcn/ui with:

✅ **Correct v4 architecture** - @theme inline pattern, no config file
✅ **Dark mode** - ThemeProvider with system/light/dark support
✅ **Error prevention** - Fixes tw-animate-css, duplicate @layer, @apply deprecation
✅ **Semantic colors** - Full color palette with proper CSS variables
✅ **Path aliases** - @/* imports configured
✅ **TypeScript** - Full type safety
✅ **Templates** - Proven file templates ready to copy

---

## Known Issues This Skill Prevents

| Issue | Why It Happens | How Skill Fixes It |
|-------|---------------|-------------------|
| `tw-animate-css` import error | shadcn init adds non-existent import | Provides clean CSS template |
| Duplicate `@layer base` | shadcn init adds second block with @apply | Single clean @layer block |
| Colors don't work | Missing `@theme inline` mapping | Complete mapping provided |
| Dark mode broken | No ThemeProvider or wrong setup | Full ThemeProvider template |
| Wrong config | `tailwind.config.ts` used for theme | Empty config, CSS-only theme |
| Double hsl() wrapping | Common pattern mistake | Correct variable usage |

---

## When to Use This Skill

### ✅ Use When:
- Starting a new Vite + React project with Tailwind v4
- Adding Tailwind v4 to existing Vite project
- Migrating from Tailwind v3 to v4
- Integrating shadcn/ui components
- Setting up dark mode with theme switching
- Debugging Tailwind v4 color/theme issues
- Need production-tested v4 patterns

### ❌ Don't Use When:
- Using Tailwind v3 (different architecture)
- Using Next.js (different setup, use Next.js skill instead)
- Using PostCSS instead of Vite plugin
- Building pure CSS library (no React needed)
- User specifically requests manual setup for learning

---

## Template Structure

```
~/.claude/skills/tailwind-v4-shadcn/
├── README.md                  # This file - auto-trigger keywords
├── SKILL.md                   # Complete documentation (465 lines)
├── templates/                 # Ready-to-copy file templates
│   ├── index.css              # v4 CSS architecture
│   ├── components.json        # shadcn/ui v4 config
│   ├── vite.config.ts         # Vite + Tailwind plugin
│   ├── tsconfig.app.json      # TypeScript with aliases
│   ├── theme-provider.tsx     # Dark mode provider
│   └── utils.ts               # cn() utility
└── reference/                 # Deep-dive docs
    ├── architecture.md
    ├── dark-mode.md
    ├── common-gotchas.md
    └── migration-guide.md
```

---

## Quick Usage

When Claude detects trigger keywords, it should:

1. **Confirm with user**: "I found the `tailwind-v4-shadcn` skill. Use it?"
2. **Explain benefits**: "This prevents tw-animate-css errors and includes dark mode"
3. **Use templates**: Copy from `templates/` directory
4. **Follow SKILL.md**: Complete step-by-step in SKILL.md
5. **Verify**: Test dev server, check dark mode toggle

---

## Token Efficiency

| Approach | Tokens Used | Errors |
|----------|------------|--------|
| Manual setup (no skill) | ~65,000 | 2-3 common errors |
| With this skill | ~20,000 | 0 (prevented) |
| **Savings** | **~70%** | **100% reduction** |

---

## Dependencies Installed

```json
{
  "dependencies": {
    "tailwindcss": "^4.1.14",
    "@tailwindcss/vite": "^4.1.14",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "@vitejs/plugin-react": "^5.0.4",
    "vite": "^7.0.0",
    "typescript": "~5.9.0"
  }
}
```

---

## Example Skill Invocation

```
User: "Set up a new Vite + React project with Tailwind v4"
↓
Claude: [Checks ~/.claude/skills/tailwind-v4-shadcn/]
↓
Claude: "I found the tailwind-v4-shadcn skill. Use it?
        (Prevents tw-animate-css error, includes dark mode)"
↓
User: "Yes"
↓
Claude: [Uses templates/ + follows SKILL.md]
↓
Result: Working project in ~1 minute, 0 errors
```

---

## Skill Metadata

```yaml
name: tailwind-v4-shadcn
version: 1.0.0
category: frontend-setup
stack: [vite, react, tailwind-v4, shadcn-ui]
confidence: high  # Production-tested pattern
auto_invoke_threshold: 0.7  # Invoke if 70%+ match
maintained_by: jeremy@jezweb.net
last_tested: 2025-10-20
```

---

## Related Skills

- `react-vite-base` - Vite + React without Tailwind
- `cloudflare-react-full-stack` - Adds Cloudflare Workers
- `react-form-zod` - React Hook Form + Zod validation

---

## Support

- **Full Documentation**: See `SKILL.md` (465 lines)
- **Troubleshooting**: See `reference/common-gotchas.md`
- **Official Docs**: https://ui.shadcn.com/docs/tailwind-v4
