# Changelog

All notable changes to the Claude Code Skills Collection will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.1.0] - 2025-10-20

### Added - cloudflare-worker-base Skill ✅

**New Skill**: Complete production-ready setup for Cloudflare Workers with Hono, Vite, and Static Assets.

#### Features
- **SKILL.md** (1,200+ lines): Comprehensive setup guide with Quick Start, API patterns, and configuration reference
- **README.md** (250+ lines): Auto-trigger keywords, quick reference, known issues prevented table
- **templates/** directory: Complete working files (wrangler.jsonc, vite.config.ts, src/index.ts, public/ assets)
- **reference/** directory:
  - `architecture.md`: Deep dive into export patterns, routing, and Static Assets
  - `common-issues.md`: All 6 issues with detailed troubleshooting
  - `deployment.md`: Wrangler commands, CI/CD patterns, production tips

#### Issues Prevented (6 total)
1. **Export Syntax Error** ([honojs/hono #3955](https://github.com/honojs/hono/issues/3955))
   - Error: "Cannot read properties of undefined (reading 'map')"
   - Fix: Use `export default app` instead of `{ fetch: app.fetch }`

2. **Static Assets Routing Conflicts** ([workers-sdk #8879](https://github.com/cloudflare/workers-sdk/issues/8879))
   - Error: API routes return `index.html` instead of JSON
   - Fix: Add `"run_worker_first": ["/api/*"]` to wrangler.jsonc

3. **Scheduled Handler Not Exported** ([vite-plugins #275](https://github.com/honojs/vite-plugins/issues/275))
   - Error: "Handler does not export a scheduled() function"
   - Fix: Use Module Worker format when needed

4. **HMR Race Condition** ([workers-sdk #9518](https://github.com/cloudflare/workers-sdk/issues/9518))
   - Error: "A hanging Promise was canceled" during development
   - Fix: Use `@cloudflare/vite-plugin@1.13.13` or later

5. **Static Assets Upload Race** ([workers-sdk #7555](https://github.com/cloudflare/workers-sdk/issues/7555))
   - Error: Non-deterministic deployment failures in CI/CD
   - Fix: Use Wrangler 4.x+ with improved retry logic

6. **Service Worker Format Confusion** (Cloudflare migration guide)
   - Error: Using deprecated `addEventListener('fetch', ...)` pattern
   - Fix: Use ES Module format exclusively

#### Package Versions (Verified 2025-10-20)
- `wrangler`: 4.43.0
- `@cloudflare/workers-types`: 4.20251011.0
- `hono`: 4.10.1
- `@cloudflare/vite-plugin`: 1.13.13
- `vite`: Latest
- `typescript`: 5.9.0+

#### Auto-Discovery Keywords
Cloudflare Workers, CF Workers, Hono, wrangler, Vite, Static Assets, @cloudflare/vite-plugin, wrangler.jsonc, ES Module, run_worker_first, SPA fallback, API routes, serverless, edge computing, "Cannot read properties of undefined", "Static Assets 404", "A hanging Promise was canceled", "Handler does not export", deployment fails, routing not working, HMR crashes

#### Production Validation
- **Example Project**: https://cloudflare-worker-base-test.webfonts.workers.dev
- **Build Time**: ~45 minutes (0 errors)
- **Errors Prevented**: 6/6 (100% success rate)
- **Location**: `examples/cloudflare-worker-base-test/`

#### Research Documentation
- **Research Log**: `planning/research-logs/cloudflare-worker-base.md`
- Official sources: Cloudflare Workers, Hono, Vite plugin documentation
- All 6 issues have GitHub issue sources
- Community consensus verified (GitHub, Stack Overflow)

#### Metrics
- **Token Savings**: ~60% (8,000 → 3,000 tokens estimated)
- **Development Time**: 2 hours (from research to production)
- **Files Created**: 32 files
- **Lines of Code**: 17,383+ lines

---

## [1.0.0] - 2025-10-19

### Added - Initial Release

#### tailwind-v4-shadcn Skill ✅
Complete production-ready setup for Tailwind CSS v4 with shadcn/ui, Vite, and React.

**Features:**
- Four-step architecture (CSS variables → @theme inline → base styles → auto dark mode)
- ThemeProvider with localStorage persistence
- Component templates and reference documentation
- Dark mode without `dark:` variants

**Issues Prevented (3 total):**
1. CSS variables in wrong location (`:root` in `@layer base`)
2. Missing `@theme inline` mapping
3. Double-wrapping colors with `hsl()`

**Production Validated**: WordPress Auditor (https://wordpress-auditor.webfonts.workers.dev)

**Metrics:**
- Token Savings: ~70%
- Development Time: 6 hours
- Errors Prevented: 3

---

## Project Information

**Repository**: https://github.com/jezweb/claude-skills
**Maintainer**: Jeremy Dawes (Jezweb)
**License**: MIT
**Issues**: https://github.com/jezweb/claude-skills/issues

---

## Version Format

- **Major** (X.0.0): Breaking changes or significant restructuring
- **Minor** (0.X.0): New skills added
- **Patch** (0.0.X): Bug fixes, documentation updates, template improvements

---

## Upcoming

### Next Skills (Planned)
1. **cloudflare-react-full-stack**: Complete CF Workers + Vite + React + Tailwind v4 stack
2. **cloudflare-services**: D1, R2, KV, Workers AI, Vectorize integration patterns
3. **clerk-auth-cloudflare**: Clerk authentication with JWT verification for CF Workers

See `planning/skills-roadmap.md` for complete roadmap.
