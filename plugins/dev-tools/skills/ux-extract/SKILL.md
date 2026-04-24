---
name: ux-extract
description: "Exhaustively extract UX patterns from a reference web app. Walks every screen, captures screenshots of every state, records interaction patterns, copy verbatim, keyboard shortcuts, responsive treatments, motion, and empty/error/loading states. Produces a reusable pattern library that other audits can compare against. The inverse of ux-audit — asks 'what is the bar?' rather than 'does this match the bar?'. Trigger with 'learn from X', 'extract patterns from X', 'study X's UX', 'reverse engineer the UX of X', 'build a pattern library from X'."
compatibility: Designed for Claude Code (or similar products)
---

# UX Extract

Exhaustively study a reference web app and produce a reusable pattern library. Goes everywhere, captures everything, then organises it into a document another audit or build can reference.

The inverse of `ux-audit`:
- **Audit** asks: *does this match a bar?*
- **Extract** asks: *what is the bar?*

Audits without extracts implicitly compare to "my memory of other apps" — fragile and inconsistent. Extracts turn that memory into a concrete, navigable artifact. An audit can then say: *"Empty state on /app/clients shows no CTA. Reference (claude.ai) shows 3 keyboard shortcuts plus 'New chat' in the same position"* instead of *"feels a bit sparse"*.

## When to use

- **Before building a new feature** — study how best-in-class apps handle it
- **Benchmarking a build** — extract the reference, then audit against it
- **Onboarding designers or engineers** — here's what good looks like, concretely
- **Competitor research** — document the competitor's UX so you can meaningfully differentiate
- **Refreshing an old app** — extract patterns from modern equivalents to guide the update

## Scope and ethics

Before starting, confirm the target is fair game:

1. **Use your own account** — don't scrape anything that requires credentials you don't legitimately hold
2. **Respect `robots.txt`** for unauthenticated crawling
3. **Rate-limit** — act like a human user, not a crawler. Pause between pages.
4. **Check ToS** — most SaaS Terms of Service permit individual inspection but prohibit automated scraping
5. **Don't redistribute** screenshots of a live competitor's app publicly — pattern libraries are internal references

If the target is behind a paywall or requires a trial account, ask the user whether they have legitimate access before proceeding.

## Setup

### 1. Browser tool

| Target | Tool | Notes |
|--------|------|-------|
| **Authenticated reference** (you have an account) | Chrome MCP | Uses your logged-in session |
| **Public reference** (marketing pages, docs, public demos) | Playwright MCP | No login needed |

See [../ux-audit/references/browser-tools.md](../ux-audit/references/browser-tools.md) for commands.

### 2. Viewport

Pin 1440×900 as baseline (MacBook standard). Also capture 768 and 375 for responsive patterns. Don't exceed 2000px wide.

### 2b. Screenshot post-processing

On Retina Macs, Chrome captures at 2× the logical viewport — a 1440-wide window produces a 2880-wide PNG. Post-process after each batch so the library isn't full of oversized files:

```bash
img-process batch ./screenshots --action optimise --max-width 1440
```

Idempotent — no-op on already-small files. Run at the end of each route's capture, or across the whole `screenshots/` folder at the end of the extract. Playwright MCP users can set `deviceScaleFactor: 1` in the context options and skip this step.

### 3. Scope

Decide before starting:

- **Whole app** — traverse everything reachable (can take hours, produces a comprehensive library)
- **Feature area** — one section ("the settings flow", "the dashboard", "the billing flow")
- **Pattern class** — just empty states, just error handling, just onboarding

Narrower scope produces tighter, more useful libraries. "Whole app" is only worth it for apps you'll be building a direct analogue of.

### 4. Focus lens (optional)

Optional bias for capture. Examples:
- *"Focus on patterns for data-heavy lists"* — prioritise table, filter, search, virtualisation screenshots
- *"Focus on onboarding and empty states"* — prioritise first-run flows and zero-data views
- *"Focus on permission boundaries"* — log in as multiple roles, document the differences

If no focus is given, capture broadly.

## Discovery

### Sitemap crawl

Build the full route inventory:

1. **Public sitemap** — check `/sitemap.xml`, `/robots.txt` for discoverability
2. **Nav crawl** — click through every section visible in the top nav, sidebar, footer
3. **In-app discovery** — once inside, note every link that appears (breadcrumbs, tabs, contextual menus)
4. **URL inspection** — some apps have useful patterns in `/settings`, `/preferences`, `/admin` that aren't in the main nav

Record each route with its purpose: `/settings/billing — subscription plan, payment method, invoice history`.

### Pattern inventory

Before deep-capture, scan the app once and list pattern types you'll document. Typical categories:

- Wayfinding (nav, breadcrumbs, current-location, back)
- Lists & tables (row, hover, action reveal, selection, sort, filter, paginate, empty)
- Forms (label, validation, error, required, inline help)
- Modals & dialogs (trigger, focus, escape, scroll, confirm)
- Feedback (toast, inline, progress, loading, saved)
- Onboarding & empty states (first-run, zero-data CTA, guided tour)
- Permissions & roles (restricted views, denied-access, role indicators)
- Copy & microcopy (buttons, headings, errors, placeholders, tooltips)
- Keyboard (shortcut sheet, focus, tab order, command palette)
- Motion (transition, reveal, loading, gesture)
- Responsive (breakpoints, mobile-specific: bottom sheet, tabs, swipe)

Not every app uses every category. Mark which apply.

## Capture Phase

For each route, capture exhaustively. Screenshots are cheap — err toward more.

### Screenshot all states

Per meaningful element, capture:

| State | Trigger |
|-------|---------|
| Default | page loaded, nothing interacted with |
| Hover | mouse over a button, row, nav item |
| Focus | keyboard-focused via Tab |
| Active | button mid-click, input being typed into |
| Open | dropdown open, menu expanded |
| Closed | dropdown closed, menu collapsed |
| Expanded | accordion open, detail panel expanded |
| Collapsed | accordion closed |
| Selected | checkbox ticked, row selected, tab active |
| Loading | skeleton, spinner, pending state |
| Empty | list with no items |
| Populated | list with many items |
| Error | inline, toast, or full-page error |
| Success | post-action confirmation |

See [references/capture-checklist.md](references/capture-checklist.md) for the full per-pattern checklist.

### Capture copy verbatim

Copy the text exactly, including punctuation, ellipses, and tone:

- Button labels: `"Start chat"`, `"Upgrade plan"`, `"Delete forever"`
- Empty states: *"No conversations yet. Start one to see it here."*
- Error messages: *"We couldn't save that change. Try again, or contact support if it keeps happening."*
- Confirmation dialogs: *"Delete this project? All 14 tasks and 3 members will be removed. This cannot be undone."*
- Placeholder text: `"e.g. smith@company.com"`
- Tooltips: `"Pressing Cmd+K opens this from anywhere"`

Raw copy is gold for writers and informs your app's voice.

### Capture interactions

For each interactive element, note:
- **Trigger**: click / hover / keyboard / long-press / drag
- **Target**: what it affects (opens modal, filters list, navigates)
- **Feedback**: immediate visual response? delayed confirmation?
- **Reversibility**: undoable? destructive?

### Capture keyboard patterns

- **Shortcut sheet**: is there a `?` or `Cmd+/` that reveals the shortcut list? Capture it.
- **Command palette**: `Cmd+K` or similar? Capture the palette open, searching, a result selected, and an action executed.
- **Focus indicators**: tab through the page, note the ring style, colour, thickness
- **Tab order**: is it logical? Any unexpected jumps?

### Capture responsive treatments

For each route, screenshot at 1440, 768, 375. Note **what changes**, not just "it works":
- Navigation moves from sidebar to hamburger at [breakpoint]
- Table collapses to stacked cards at [breakpoint]
- Modal becomes full-screen at [breakpoint]
- Multi-column form becomes single-column at [breakpoint]

### Capture motion

Record a GIF (Chrome MCP's `gif_creator`) of any animation worth documenting:
- Page transitions
- Modal enter/exit
- List item enter/exit
- Loading → loaded
- Success animations (confetti, checkmarks)
- Drag-and-drop feedback

One 3-second GIF is worth a paragraph of description.

## Dedup Phase

After capture, many patterns will appear on multiple pages. Deduplicate:

- **Same row pattern on 5 list pages** → one "list row" entry with a note *"used on: /clients, /projects, /invoices, /reports, /team"*
- **Same empty state layout with different copy** → one "empty state" entry with copy variants listed
- **Same modal chrome** → one "modal" entry; specific modals listed as usages

Keep two counts per pattern:
- **Occurrences** — how many times this pattern appears
- **Variants** — meaningful differences (icon vs no icon, small vs large, with CTA vs without)

A pattern that appears once is rarely worth documenting unless it's unique and notable.

## Output

Write to `docs/ux-extracts/<app-name>/` (or `.jez/artifacts/ux-extracts/<app-name>/` if that directory exists):

```
docs/ux-extracts/claude-ai/
├── pattern-library.md      ← main document
├── copy-corpus.md          ← optional, raw copy by page (for writers)
└── screenshots/
    ├── 001-home-default.png
    ├── 002-home-hover-cta.png
    ├── 003-new-chat-empty.png
    └── ...
```

See [references/pattern-library-template.md](references/pattern-library-template.md) for the output structure.

The pattern library should be:
- **Navigable** — table of contents at the top, jump links to every section
- **Cross-referenced** — "see also: [Modal Chrome](#modal-chrome)"
- **Screenshot-dense** — every claim backed by a referenced screenshot
- **Copy-accurate** — verbatim text in code blocks or blockquotes, not paraphrased
- **Honest** — note what's *missing* or *weak* as well as what's good. A reference library isn't gospel.

## How ux-audit consumes this

`ux-audit` checks for pattern libraries at `.jez/artifacts/ux-extracts/<ref>/pattern-library.md` or `docs/ux-extracts/<ref>/pattern-library.md`. If found, it uses them as the bar for comparison. Audit findings can then cite specific patterns:

> *"Empty state on /app/clients has no explanatory copy and no CTA. Reference library [claude.ai § Empty States] shows CTA + 2 example prompts in the same position."*

No integration is required beyond producing the library in the expected path.

## Autonomy

- **Just do it**: Navigate, screenshot, copy text, inject JavaScript to read computed styles, download static assets (logo, icons) for reference
- **Ask first**: Any login that requires credentials the user hasn't authorised you to use, any scraping of a site where ToS or rate limiting is ambiguous
- **Stop and confirm**: If the target has a login wall and you don't have clear authorisation, stop and confirm before proceeding

## Reference files

| When | Read |
|------|------|
| Building the pattern-library.md output | [references/pattern-library-template.md](references/pattern-library-template.md) |
| Per-pattern capture checklist (what to screenshot, what to note) | [references/capture-checklist.md](references/capture-checklist.md) |
| Browser tool commands | [../ux-audit/references/browser-tools.md](../ux-audit/references/browser-tools.md) |

## Tips

- **Screenshots are cheap** — capture generously. Easier to drop a screenshot from the library than to rerun the extract to get one.
- **Capture copy the moment you see it** — don't plan to come back; come back and it'll be behind a different state.
- **Note what's absent** — if an app has no keyboard shortcut sheet, that's a pattern decision worth documenting too.
- **Separate observation from evaluation** — extract records what exists, not whether it's good. Opinions belong in an audit, not an extract.
- **Extracts decay** — apps change. Timestamp the library, link to the date on archive.org if possible, plan to re-extract every 6–12 months for apps you compare against often.
- **Build incrementally** — open the library file at the start, append as you go. Don't try to structure it all at the end.
