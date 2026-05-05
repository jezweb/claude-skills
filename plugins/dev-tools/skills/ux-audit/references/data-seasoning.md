# Data Seasoning

The audit's existing volume tests (0 / 1 / 100 / 1000+) catch quantity-related bugs. They miss **time-shaped** bugs.

100 inbox rows seeded fresh ≠ 100 inbox rows accumulated over 30 days. Same row count, completely different UI behaviour: time dividers, recency-based sort, cron-fired side effects, notification overflow, signal-vs-noise pressure on the user's eye. Most "the app feels different after using it for a while" complaints come from this gap.

Scenario 11 — Data Seasoning — closes it.

## Why time-shaped data matters

| Quantity test misses | Time-shaped catches |
|---|---|
| Today / Yesterday dividers don't exist | Day 1 horizon — single-item pluralisation, returning-user feel |
| Cron-driven side effects (routine_runs, scheduled emails) never fire in fresh seed | Day 7 horizon — recurring jobs have actually run ~50 times |
| Notification badge overflow (47 unread, 99+) | Day 30 horizon — counters break at real volumes |
| Sort order meaning (newest at top) | Day 30 — does "recent" still feel useful with a month of activity? |
| Search-with-history (200 saved memories, 50 conversations) | Day 30 — search latency, result ranking, fuzzy match performance |
| Chart bucketing (per-day vs per-week vs per-month) | Day 30 — UI must adapt or it's unreadable |
| TanStack Query invalidation cascade | Day 30 — many keys = visible re-render storms |

## The four horizons

### Day 0 — fresh install

What's there: nothing. Brand new account, no history, no peers.

Test:
- Every list/queue/observability surface is empty
- Onboarding affordances visible? "Open Routines" / "Add your first" / "Get started" CTAs present?
- Dimmed placeholders that hint at structure ("Your inbox will appear here")
- No phantom data leaking from another user's session
- No 404 / 500 from APIs that assume "at least one record exists"

### Day 1 — light, recent activity

What's there: a handful of items, all created today. Maybe one created yesterday.

Test:
- "Today" divider appears
- "Yesterday" divider appears (single item is fine)
- Pluralisation correct ("1 message" vs "2 messages") at every count boundary
- Returning-user feel: signing in for the second time, does the data feel like *yours* or like demo content?
- Activity feed renders with one entry without looking hollow
- Mention picker / assignee dropdown shows just the founder + one teammate (does it work with 2 humans?)
- Pagination doesn't show controls when there's nothing to paginate

### Day 7 — modest density, time-distributed

What's there: 50-100 items spread across the week. Some recurring (cron-fired routines have run ~50 times), some one-off, some old (>3 days), some today.

Test:
- "This week" / "Older than X" boundaries
- Pagination first appears here — does it work at the breakpoint?
- Weekly summaries / digests visible? Do they read as useful?
- Sort orders work (recent first, oldest first) — try both
- Filter by date range
- Cron-fired side-effects visible (a routine that runs every hour has produced ~168 entries in agent_runs — does observability render them or melt down?)
- Modest density still readable at desktop and mobile

### Day 30 — seasoned, real signal-vs-noise

What's there: 200+ items, distributed across a month, with realistic mix (some pending, some decided, some archived). Notification counters in tens.

Test:
- Notification bell / unread badge: does it show "47" cleanly, or "99+" at the cap?
- Header counters break at any threshold (some apps clip at 9, 99, 999)?
- Sort order — does "newest first" still feel useful, or is recent stuff buried?
- Search performance: type a query, does it return ranked-relevant results fast?
- Chart bucketing — do charts that worked at Day 7 stay readable, or become a wall of bars?
- TanStack Query invalidation: trigger an action that should invalidate multiple keys; observe re-render storm or smooth transition
- Memory / saved-state surfaces: 500+ saved items — does the UI scale?
- "Snooze" / "Archive" / "Mark all read" affordances present? At Day 30 the user *needs* them
- Empty state path tested — mark all read, does the empty state still work?

## Surfaces this applies to

For most apps:
- Lists / tables (clients, projects, files, contacts)
- Queues (Inbox, Approvals, Pending)
- Observability (agent_runs, audit logs, activity feeds)
- History / search (Memory, conversations, message history)
- Notification surfaces (header bell, tab counters, dot indicators)
- Charts and dashboards
- Filter / sort surfaces (saved views, custom filters)

Skip the scenario only if the app has zero time-distributed data — a one-shot calculator, a static directory, an embed-only widget. Most apps don't qualify for skip.

## Severity guide

| Symptom | Severity |
|---------|----------|
| Notification badge overflows or breaks visually at 47+ unread | High |
| Sort order becomes meaningless at Day 30 (recent buried) | High |
| Pagination breaks at Day 7 horizon | High |
| Charts unreadable at Day 30 (no per-week / per-month bucketing) | High |
| TanStack Query invalidation visibly cascades for >2s at Day 30 | High |
| Empty-state CTA wrong for Day 30 (e.g. shown after mark-all-read) | High |
| Missing Today/Yesterday dividers when data warrants | Medium |
| Single-item pluralisation off ("1 messages") | Medium |
| Cron observability surface melts at Day 7 (168 entries) | Medium-High depending on UI |
| Search latency >500ms at 500 saved items | Medium |
| Activity feed feels hollow at Day 1 (one entry) | Low (hard to fix without diluting signal) |

## Project-side seed-script architecture

The audit assumes the project provides seasoning seeds. The example below uses **Cloudflare Workers + Drizzle + tsx**; for Prisma / TypeORM / Sequelize / ActiveRecord (Rails) / Django ORM / Laravel Eloquent / WordPress / raw SQL equivalents, see [project-adaptation.md](project-adaptation.md) "Seed-script architectures by ORM".

```
scripts/
  seed/
    index.ts          # CLI entry: pnpm seed:day-N
    horizons/
      day-0.ts        # empty / onboarding state
      day-1.ts        # ~10 items, all today/yesterday
      day-7.ts        # ~75 items, week-distributed
      day-30.ts       # ~250 items, month-distributed
    factories/
      inbox.ts        # faker-driven
      approval.ts
      conversation.ts
      memory.ts
      routine-run.ts
    fixtures/
      personas.ts     # test-auth users
package.json:
  "scripts": {
    "seed:day-0": "tsx scripts/seed/index.ts day-0",
    "seed:day-1": "tsx scripts/seed/index.ts day-1",
    "seed:day-7": "tsx scripts/seed/index.ts day-7",
    "seed:day-30": "tsx scripts/seed/index.ts day-30",
    "seed:reset": "tsx scripts/seed/index.ts reset"
  }
```

Each horizon script:
- Resets the test-auth user's data
- Calls factories with horizon-appropriate parameters (date ranges, counts, mix of states)
- Logs what was seeded so the audit report can cite "seeded with day-7 fixture: 75 inbox items, 12 routines, 30 memories"

Use `@faker-js/faker` for content. Realistic-flavoured strings (names, emails, addresses, message bodies), respecting locale where the app supports it.

For Cloudflare D1 / Drizzle stacks, the seeds are batched inserts through the project's existing schema. Half-day to write the first horizon, then progressively cheaper.

## Audit protocol per horizon

For each seasoning-sensitive surface:

1. Run `pnpm seed:day-N` (or whatever the project calls it)
2. Sign in as the test-auth user
3. Walk the surface — every list, every filter, every action
4. Run an Interaction Manifest at this horizon
5. Capture screenshots labelled `surface-day-N.png`
6. Note any bug that's specific to this horizon
7. Reset (`pnpm seed:reset`) and move to the next horizon

Don't skip a horizon because "the app probably handles it" — every horizon catches a bug class the others miss.

## When the project has no seasoning seed

If the project has no day-N seed scripts:

1. Note in the audit report that Scenario 11 was attempted but couldn't run (missing fixture)
2. Verdict for the audit can still be Pass / Conditional Pass on other grounds, but Scenario 11 coverage = 0
3. Recommend the project write the seeds (cite this reference for the architecture)
4. Re-run the audit when seeds exist

Don't try to manually create 250 inbox items via UI — that's not the audit's job, and it produces unrealistic time distributions anyway.

## Known seasoning-sensitive surfaces in common apps

| App type | Surfaces likely to need seasoning |
|----------|-----------------------------------|
| Chat / messaging | Conversations list, message history, mention pickers, unread counters |
| Inbox / queue | Inbox list, Approvals, Pending, Mark-all-read affordances |
| AI / agent | agent_runs observability, prompt history, memory search, routine_runs |
| Project management | Project list, task lists, activity feeds, assignee pickers |
| Email | Inbox, Sent, Drafts, threads |
| CMS / docs | Recent edits, version history, search |
| E-commerce | Order history, abandoned cart, recently viewed |

Document which surfaces are seasoning-sensitive in the project's CLAUDE.md so future audits know where to escalate.

## Composing with other scenarios

Data seasoning composes with — doesn't replace — other scenarios:

- **Scenario 6 (Heavy Data)** — pure quantity at 500+ items. Data seasoning adds time-distribution. Run both: Heavy Data catches list-virtualisation bugs; Data Seasoning catches time-divider bugs.
- **Scenario 9 (Lifecycle Position)** — person time (founder / first invitee / late joiner). Data seasoning is data time. Together they cover both axes.
- **Scenario 4 (Returning User)** — assumes the user has data; this scenario seeds it realistically.
- **Multi-Pane Stress** — run multi-pane stress at Day 30, not Day 0, when surfaces actually have content to break under squeeze.

The full audit at all four horizons takes ~4 hours for a substantial app. Day 0 + Day 7 covers ~80% of the bugs in ~1 hour if time is short.
