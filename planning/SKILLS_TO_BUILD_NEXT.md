# Skills to Build Next - Quick Reference

**Date**: 2025-10-24
**Full Plan**: See `skill-build-plan-2025.md` for complete details

---

## 🚨 URGENT: Documentation Fixes First

**Before building any new skills, fix these documentation issues:**

1. ✅ **tailwind-v4-shadcn** - EXISTS in `~/.claude/skills/` but NOT in repo
   ```bash
   cp -r ~/.claude/skills/tailwind-v4-shadcn /home/jez/Documents/claude-skills/skills/
   git add skills/tailwind-v4-shadcn
   git commit -m "Add tailwind-v4-shadcn skill (production-tested)"
   ```

2. ✅ **cloudflare-full-stack-scaffold** - Actually 100% complete (roadmap says 40%)
   - Update `planning/skills-roadmap.md` line with correct status

3. ✅ **tanstack-query** - Actually 100% complete (roadmap says planned)
   - Update `planning/skills-roadmap.md` to mark as ✅ Complete

---

## 📅 Build Schedule (11 Weeks)

### Sprint 1 (Next 2 weeks)
**Focus:** Quick wins, frequently used

1. **zustand** (3-4 hours)
   - Client state management
   - Complements tanstack-query
   - Token savings: ~50%
   - Priority: HIGH

2. **drizzle-orm-d1** (5-6 hours)
   - Type-safe SQL for D1
   - Migration management
   - Token savings: ~60%
   - Priority: HIGH

---

### Sprint 2 (Weeks 3-4)
**Focus:** SaaS monetization essentials

3. **stripe-payments** (6-8 hours)
   - Subscriptions, webhooks, checkout
   - Critical for revenue
   - Token savings: ~65%
   - Priority: CRITICAL

4. **resend-email** (3-4 hours)
   - Transactional emails
   - Pairs with Stripe
   - Token savings: ~55%
   - Priority: HIGH

---

### Sprint 3 (Weeks 5-6)
**Focus:** AI tooling & testing foundation

5. **vitest** (4-5 hours)
   - Vite-native testing
   - Cloudflare Workers support
   - Token savings: ~50%
   - Priority: HIGH

6. **mastra-ai** (6-7 hours)
   - AI agent framework
   - Cloudflare integration
   - Token savings: ~60%
   - Priority: MEDIUM-HIGH

7. **openrouter** (3-4 hours)
   - Multi-provider LLM access
   - Cost optimization
   - Token savings: ~45%
   - Priority: MEDIUM

---

### Sprint 4 (Weeks 7-8)
**Focus:** Alternative auth & E2E testing

8. **authjs** (6-7 hours)
   - Clerk alternative (self-hosted)
   - D1 adapter support
   - Token savings: ~60%
   - Priority: MEDIUM

9. **playwright** (5-6 hours)
   - E2E testing
   - Auth flow testing
   - Token savings: ~55%
   - Priority: MEDIUM

---

### Sprint 5 (Weeks 9-10)
**Focus:** Production monitoring & media

10. **sentry** (4-5 hours)
    - Error monitoring
    - Performance tracking
    - Token savings: ~50%
    - Priority: MEDIUM

11. **cloudflare-images** (4-5 hours)
    - Image optimization
    - Complements R2
    - Token savings: ~55%
    - Priority: MEDIUM

---

### Sprint 6 (Week 11)
**Focus:** Email templates

12. **react-email** (3-4 hours)
    - Email templates as React
    - Works with Resend
    - Token savings: ~50%
    - Priority: MEDIUM-LOW

---

## 📊 Quick Stats

**Total Skills**: 13 (1 exists, 12 to build)
**Total Estimated Time**: 56-68 hours
**Timeline**: ~11 weeks at 5-6 hours/week
**Average Token Savings**: ~55%
**Total Errors Prevented**: ~100+

---

## 🎯 Immediate Next Steps

1. **Today** (30 minutes):
   - [ ] Move tailwind-v4-shadcn to repo
   - [ ] Update roadmap statuses
   - [ ] Commit documentation fixes

2. **This Week**:
   - [ ] Build **zustand** skill (3-4 hours)
   - [ ] Build **drizzle-orm-d1** skill (5-6 hours)

3. **Next Week**:
   - [ ] Start **stripe-payments** skill

---

## 📖 Detailed Planning

**For complete details on each skill, see:**
`planning/skill-build-plan-2025.md`

Each skill includes:
- Complete scope definition
- Templates to create (with file list)
- References to create (with file list)
- Known errors to document (with sources)
- Package versions (verified)
- Auto-trigger keywords
- Dependencies
- Production test requirements

---

**Last Updated**: 2025-10-24
**Status**: Ready for Implementation
