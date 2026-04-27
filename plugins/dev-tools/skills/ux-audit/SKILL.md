---
name: ux-audit
description: "Exhaustive UX audit of a web app. Walks every thread a real user would follow, tests every interactive element, runs visual polish sweep (AI-tells, optical centring, design-token discipline, animation timings) and scenario battery (keyboard-only, heavy data, destructive actions, second user, interrupted workflow, wrong turn, returning user, first contact), produces ranked findings with screenshots, then offers a fix-and-verify loop. Requires a persona. Trigger with 'ux audit', 'dogfood this', 'audit the app', 'qa sweep', 'exhaustive test', 'check all pages'."
compatibility: claude-code-only
---

# UX Audit

Exhaustively audit a web app from the perspective of a real user. Two lenses, combined:

- **Flow lens** — walk the 3–5 real tasks a user would do ("threads"). Count clicks, mark dead ends, screenshot every state change.
- **Element lens** — after threads, sweep every interactive element not already hit. Forms, menus, toggles, edge data volumes.
- **Polish lens** — page-by-page visual polish sweep covering optical centring, design-token discipline, off-scale spacing, animation timings, and the other patterns that mark UIs as machine-generated.

Then run an eight-scenario battery (first contact, interrupted workflow, wrong turn recovery, returning user, keyboard only, heavy data, destructive confidence, second user) and close with a fix-and-verify loop for critical findings.

This is the thorough one. There is no quick mode. If the user wants a targeted check ("audit the dashboard"), scope the audit to that area — but within that area, still go exhaustive. Runtime is unbounded: assume a long-running session, write findings to the report incrementally, don't batch.

## Setup

Four things before any browsing. Stop if any fail.

### 1. Browser tool

| Target | Tool | Why |
|--------|------|-----|
| **Authenticated app** (internal tools, client apps) | Chrome MCP | Uses your real logged-in Chrome session — OAuth, cookies, RBAC just work |
| **Public site** (marketing, competitor, unauthed) | Playwright MCP | No login needed |
| **Neither available** | **Stop** | Ask the user to connect Chrome MCP or install Playwright |

Do **not** silently fall back to a fresh Playwright session for an authenticated app — the audit is worthless if you can't log in. If Chrome MCP isn't connected, stop and say: *"Open Chrome, click Connect in the Claude extension, then rerun."*

See [references/browser-tools.md](references/browser-tools.md) for commands.

### 2. URL

Prefer the deployed/live version — that's what real users see.

1. Check `wrangler.jsonc` for `pattern` or `custom_domain`
2. Check CLAUDE.md, README, `package.json` `homepage` field
3. Fall back to `lsof -i :5173 -i :3000 -i :8787 -t` for a running dev server
4. Ask the user

Live site has real auth, real latency, real CDN and CORS behaviour. Local misses deployment-specific bugs (missing env vars, broken asset paths, CORS, slow APIs). Only use local if the user asks or the feature isn't deployed.

### 3. Viewport

Pin the window at the start:

```
width: 1440, height: 900
```

This is the standard MacBook resolution and the audit's baseline. Responsive sweep (below) also tests 1280, 1024, 768, 375. **Do not go above 2000px wide** — it breaks the harness.

### 4. Persona

The audit needs a persona. Without one, findings drift toward generic "looks fine". Source in order:

1. **Argument** — if the user provided one ("ux audit as a busy insurance broker")
2. **Project personas** — read `.jez/personas/default.md` and `.jez/personas/<app-name>.md` if they exist
3. **Ask** — if neither, ask one question: *"Who uses this app and what are they trying to get done?"*

Capture: role, tech comfort, time pressure, emotional state, device context. A good persona predicts what they'd miss ("A receptionist between phone calls won't scroll below the fold").

### 5. Screenshot post-processing

On Retina Macs, Chrome captures screenshots at 2× the logical viewport — a 1440×900 window produces a 2880×1800 PNG. That's larger than the vision pipeline needs and wastes context. Downsize screenshots after each capture phase:

```bash
img-process batch ./screenshots --action optimise --max-width 1440
```

The `optimise` action is idempotent — no-op if already ≤ 1440px, downsize otherwise. Safe to run unconditionally, on every folder, at any point. At minimum, run it after each thread traversal and after the responsive sweep.

Playwright MCP users can set `deviceScaleFactor: 1` in the browser context to sidestep this entirely — screenshots match viewport 1:1. Chrome MCP has no equivalent flag, so post-process instead.

## Discovery

### Sitemap crawl

Build the complete page inventory before auditing any page.

1. **Router config** — read the app's route definitions (React Router, TanStack Router, Next.js app dir)
2. **Nav crawl** — click through every section and sub-section of the sidebar/menu
3. **Deep links** — URLs in CLAUDE.md, docs, or a prior audit report

One line per route, with purpose: `/app/clients — list of clients, search, add new`.

### Thread inventory

Identify 3–5 real tasks that make up a user's day. These are the spines of the audit.

Examples:
- **Insurance broker app**: renew a policy, create a new client, work through today's queue
- **Project management**: morning triage, update a task, send a client summary
- **SEO tool**: check latest crawl, diagnose a regression, export a report

How to find them:
- Ask the user if they know the app's use cases
- Read CLAUDE.md / README for "what this app does"
- Infer from top-level nav — each major section usually maps to a thread

Write them down. They structure the traversal phase.

### Element inventory

For each route as you reach it, list every interactive element:

```
/app/clients — 31 elements
  Buttons: Add Client, Import, Export, Filter, Sort (5)
  Inputs: Search
  Table: row-click ×N, star toggle ×N, action menu ×N
  Pagination: Next, Prev, page numbers, items-per-page
```

This inventory powers the coverage metric. After the audit you can say *"tested 29 of 31 elements on /app/clients; 2 pagination controls not reached due to data volume"*. Coverage becomes arithmetic, not a vibe.

Build inventories lazily — per-page as you traverse, not all up-front.

## Thread Traversal (primary phase)

For each thread:

1. **Start from the app entry point** — not mid-thread. Real users land at `/` or `/dashboard`.
2. **Walk as the persona** — if they'd skim, skim. If they'd misread a label, misread it. Note the hesitations.
3. **Screenshot every state change** — default → hover/focus → active → after click → after load → confirmation. Meaningful transitions, not every pixel movement. With modern context windows and sub-agent review, don't scrimp — the filmstrip is the evidence.
4. **Track the cost**:
   - Click count from entry to completion
   - Decision points (moments you stopped to think)
   - Dead ends (wrong paths and backtracks)
   - Interrupt recovery (close the tab at step 3, return at step 4 — did state survive?)
5. **Hand screenshots to a sub-agent for review** — at the end of each thread, dispatch: *"Here are 42 screenshots from Thread 2 (Create Client). Flag every moment of: unclear next action, broken visual hierarchy, lost context, confusing copy, missing feedback, anxiety, or 'did that work?'. Return structured findings."* The sub-agent returns a list; you stay focused on driving the browser.

At the end of each thread, answer three questions (as the persona):
- **Did it end clearly?** Did I know the task was done?
- **Would I come back?** Confidence, trust, momentum.
- **One thing to make this twice as easy?** Often the most actionable insight in the report.

See [references/walkthrough-checklist.md](references/walkthrough-checklist.md) for per-screen evaluation prompts and [references/workflow-comprehension.md](references/workflow-comprehension.md) for wayfinding, mental model, and page-to-page continuity.

## Element Exhaustion (completeness phase)

For each route, work the inventory. Skip elements already exercised by thread traversal.

| Element type | Test |
|--------------|------|
| Button | Click, screenshot result. If it opens a modal → test the modal. If it triggers an action → verify feedback. |
| Link | Follow it. Destination matches the label? |
| Input | Valid, invalid, empty, very long, special characters (`O'Brien`, `café`, emoji, `<script>`). |
| Select / dropdown | Every option. Verify behaviour per option. |
| Toggle / checkbox | On, off. Persistence on refresh? |
| Tab | Every tab. URL updates? Back button works? |
| Accordion | Expand, collapse. State saves? |
| Menu / context menu | Every item. Right-click for context menus. |
| Drag handle | Drag to new position. Drag to invalid target. |
| Pagination | Next, prev, jump, items-per-page. |

For **every form**:
- Valid data → verify creation/update/confirmation
- Invalid data → field-level error, form state preserved
- Empty submit → required-field marking
- Tab through fields → focus order logical

For **every list/table**, test at these volumes if data permits:
- 0 items (empty state)
- 1 item (pluralisation edge case)
- 100 items (pagination)
- 1000+ items (virtualisation, search, filter performance)

Write findings to the report as you go. Don't hold them in memory.

## Responsive Sweep

For each route:

| Width | Mode | Why |
|-------|------|-----|
| 1440px | light | Baseline (matches audit viewport) |
| 1280px | light | Standard desktop |
| 1024px | light | Tablet landscape / nav collapse point |
| 768px | light | Tablet portrait / stacked layout |
| 375px | light | Mobile / touch targets |
| 1440px | dark | Dark mode baseline |
| 375px | dark | Dark mode mobile |

On any page that breaks at an intermediate width, screenshot the transition point.

Run the automated layout-detection JS (overflow, clipping, invisible text) at each width — snippets in [references/walkthrough-checklist.md](references/walkthrough-checklist.md). Read console output after injection; every warning is a potential finding.

## Visual Polish Sweep

A page-by-page micro-polish pass that catches the patterns separating *technically correct* UIs from *visibly considered* ones — and the patterns that mark a UI as machine-generated. Run after the Responsive Sweep, before the Scenario Battery.

Cover this even if a separate design-review didn't run. The visual-polish concern lives in this phase by default.

For each major page, walk the **AI-tell catalogue** in `references/visual-polish.md`. The ten checks:

1. **Optical vs mathematical centring** — text in buttons, icons next to labels, numbers in badges. `align-items: center` is not optical centring.
2. **Nested border-radius rule** — `inner radius = outer radius - padding`. Concentric arcs, not pinched corners.
3. **Off-scale spacing** — every margin / padding / gap should land on the design system's scale. 22px where 24px belongs is the AI tell.
4. **Vibe greys** — body text and borders trace to design tokens (`var(--*)`), not raw hex / Tailwind greys. Eyedropper every grey.
5. **Border-weight drift** — 1px / 1.5px / 2px mixed in same logical category.
6. **Drop shadow direction** — light source consistent across the app (all shadows point the same direction).
7. **Animation timings off canonical** — durations on 150 / 200 / 300 / 500ms. Arbitrary values like 187ms are tells.
8. **Hover-delta calibration** — perceptible state change (~10% brightness shift), not 5% imperceptible or 20% jarring.
9. **Underline offset / uppercase letter-spacing** — set deliberately, not browser default.
10. **Symmetry vs editorial pacing** — composed pages vs templated layouts. App shells generated by AI tend toward perfect mathematical symmetry.

Plus a **per-component optical pass** for buttons, badges, inputs, dropdowns, cards, tabs, avatars, toasts. Each verified against the four-point check (text optically centred, icons on cap-height baseline, hover delta perceptible, nested radii correct).

**Tools**: DevTools eyedropper for greys/colours, Computed styles tab for spacing/borders/timings, Layout overlay for grid/padding visualisation. Take screenshots of every finding *with the inspector overlay visible* — the overlay is the proof.

**Severity**: stacked AI-tells on one component (off-centre text + arbitrary radius + raw grey) is **High**. Pattern-level violation across components (raw greys app-wide) is **High**. Single instance, single tell is **Low**.

Full protocol, expected values, and findings shapes in [references/visual-polish.md](references/visual-polish.md).

## Scenario Battery

Eight scenarios. All eight, always. They catch what screen-by-screen testing misses. Full protocols in [references/scenario-tests.md](references/scenario-tests.md).

1. **First Contact** — figure out the app with zero prior knowledge, then write a 2-minute plain-English guide to each thread. Gaps in the guide are UX gaps.
2. **Interrupted Workflow** — start a task, close the tab, refresh, navigate away mid-form. Does state survive?
3. **Wrong Turn Recovery** — deliberately click the wrong thing. How many clicks to get back on track? What context is lost?
4. **Returning User** — repeat a thread already done. Faster the second time? Shortcuts available? On the dashboard, can you tell what changed since last visit?
5. **Keyboard Only** — unplug the mouse. Can every thread complete keyboard-only? Focus visible? Tab order logical? Escape closes?
6. **Heavy Data** — seed with 500+ records. Lists virtualise? Search returns the right thing? Filters narrow meaningfully?
7. **Destructive Confidence** — for every delete, send, publish, pay, share: is consent clear? Does confirm copy tell you what's about to happen? Undo available?
8. **Second User** — log in as a restricted role (viewer not editor, client not staff). Read-only views coherent? Permissions errors make sense?

## Live Interaction Smoke

Code reading verifies a button exists and has an `onClick`. It does not
verify that clicking the button actually **does something observable**.
Bugs of this shape — "the handler runs, fires a call into an SDK, but
the flow never completes" — are invisible to static analysis and
require a live click + network check.

Run these for every **interactive control** on every page:

1. **Click it.** Pointer moves, element highlights, click lands.
2. **Watch the Network tab.** Did a request fire? To the right URL?
   Correct method + body shape?
3. **Watch the DOM.** Did something visibly change — new element,
   removed element, state transition (loading spinner, toast, route
   change)?
4. **If nothing changed in (2) or (3), that's a bug.** The control
   LOOKS alive but isn't doing its job. Log it.

### Known control categories that silently fail

| Control category | Silent-failure mode to watch for |
|---|---|
| Approve / Deny buttons on tool-call cards | Handler fires but server never hears about it (SDK needs a separate "send on state change" callback). See `rules/ai-sdk-tool-approval-autosubmit.md`. |
| "Connect X" OAuth buttons inside dialogs | `window.open()` silently popup-blocked when click originates in a modal. Must use `window.location.href`. See `rules/oauth-popup-blocked-in-dialogs.md`. |
| Save / update buttons on forms with async validation | Button disables during mutation but the mutation itself silently 5xx'd. No toast, no error state, form just sits there. |
| Delete / archive actions | Optimistic UI removes the row but server rejected — after refresh, the row is back. |
| Pagination / "Load more" buttons | Fires request but response empty due to off-by-one offset. |
| Filter chips on list views | Query param updates but query key doesn't — TanStack Query serves stale cached results. |
| "Reply" / "Forward" in email-style UIs | Opens compose pane but Message-ID headers not set — reply threads orphan in recipient's inbox. |

### SDK contract check

When the page uses a third-party SDK with its own state model, verify
the SDK's required options are passed. Silent failures usually trace
to an undocumented-but-required option.

Common SDK contracts to verify:

| SDK | Option that silently breaks behaviour if missing |
|---|---|
| `@ai-sdk/react` useChat with `needsApproval: true` tools | `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses` |
| `@ai-sdk/react` useChat with custom transport | `prepareSendMessagesRequest` reading latest refs (otherwise pinned to initial values) |
| better-auth `createAuthClient` | `sessionOptions.refetchOnWindowFocus: false` for SPAs that route on session state |
| TanStack Query `QueryClient` | `refetchOnWindowFocus: false` if your app redirects on empty query results |
| React Router v7 `createBrowserRouter` | `loader` / `action` defined for routes that need data (not just component) |
| Radix Dialog | `modal: true` + `onEscapeKeyDown` handler if Escape should do more than close |
| zodResolver | `as any` around schema if using Zod v4 and resolver is older — silent validation miss |

**If the page uses an SDK not on this list**, spend 2 minutes reading
its "useX" export's options. Anything named `*On*Change`, `*On*Finish`,
`*SendAutomatically*`, `*RefetchOn*`, or `*Configure*` is a prime
suspect for "silent failure because it's undefined."

## Passive Error Sweeps

Run these throughout, not as a dedicated phase.

### Console errors

On every page load, check the browser console:
- JS errors (TypeError, ReferenceError) — **High**
- Framework warnings (key props, deprecated APIs) — **Medium**
- CSP violations — **Medium**
- Deprecation warnings — **Low**

### Network errors

Monitor network responses across the entire session. Visual browsing misses API failures — TanStack Query and SWR swallow errors and show empty/loading states instead. A "No results found" might actually be a 403.

| Status | Severity | Usual cause |
|--------|----------|-------------|
| 500+ | **Critical** | Server error |
| 403 | **High** | Permissions or route collision (static shadowed by `/:param`) |
| 404 | **Medium** | Missing endpoint |
| 401 | **Low** | Expected unauthenticated; flag on authenticated pages |
| CORS | **High** | Missing headers — production-only failure |

Chrome MCP: use `read_network_requests` after each page. Playwright: attach `page.on('response')` before browsing starts.

## Report

Write to `docs/ux-audit-YYYY-MM-DD.md` as you go. If `.jez/artifacts/` exists, use `.jez/artifacts/ux-audit-YYYY-MM-DD.md` instead.

Structure in [references/report-template.md](references/report-template.md):
- Summary
- Coverage metrics (threads walked, elements tested, inventoried coverage %)
- Findings by severity (Critical → Low) with screenshot refs
- Per-thread results
- Scenario battery results
- Network + console error inventory
- What works well
- Priority recommendations

**Severity:**
- **Critical** — user cannot complete the task
- **High** — confusion, friction, trust damage
- **Medium** — suboptimal, workable
- **Low** — polish

## Fix-and-Verify Loop

After writing the report, offer the loop:

*"Found N critical and M high issues. Fix them now and re-verify?"*

If yes:
1. Group findings by file/area
2. Patch each one
3. Re-walk just the affected slice (not the whole app)
4. Update the report: mark finding `✓ fixed`, `✗ still present`, or `⚠ new issue found`
5. Close with a "fixed in this session" summary

Closes the loop inside one session instead of waiting for a second audit pass tomorrow.

## Cross-reference with ux-extract

If a pattern library exists at `.jez/artifacts/ux-extracts/<ref>.md` or `docs/ux-extracts/<ref>.md`, read it before starting and use it as the bar. Findings can then say:

> *"Empty state on /app/clients shows no CTA. Reference (claude.ai) shows 3 keyboard shortcuts + 'New chat' button in the same position."*

Graceful if absent — the audit still works without a reference.

## Autonomy

- **Just do it**: Navigate, screenshot, read pages, inject layout-detection JS, submit forms with obviously-fake test data, write the report file, dispatch screenshot-review sub-agents
- **Ask first**: Destructive actions (delete, send, publish, pay). For Destructive Confidence testing, ask once before running that scenario
- **Stop and confirm**: Anything that emails/notifies external people

## Execution discipline

Three principles for audit runs that catch the most bugs:

1. **Drive the audit from the main session, not a sub-agent.** Sub-agents are fine for bounded analysis tasks (reviewing a batch of captured screenshots, summarising a thread). But the audit *itself* — the navigation, the noticing, the "this button looks off after the previous interaction" kind of judgement — must happen in the session that's been watching the app. Cross-interaction state lives in that session's working memory; a fresh sub-agent starts cold and misses second-order findings.

2. **Use the browser tool directly.** Chrome MCP or Playwright MCP via the main session's tool calls. Don't hand screenshots to a fresh agent and ask for opinions — that loses the state-dependence that makes audits catch logic errors, business-logic issues, and odd edge cases.
3. **Loop to exhaustion with variations.** Don't stop after one pass through the checklist. After each pass, generate a new angle — different persona, different workflow, different input volume, different starting point, different validation lens — and re-walk. Stop only when a full pass produces no new findings. Single-pass audits by definition miss the second-order issues.

For audits expected to run longer than 30 minutes, set up a 15-min `/loop` check-in alongside the main session — it journals findings, grounds the session, and provides a natural termination signal. See [references/long-running-check-in-pattern.md](references/long-running-check-in-pattern.md).

## Reference files

| When | Read |
|------|------|
| Per-screen evaluation questions | [references/walkthrough-checklist.md](references/walkthrough-checklist.md) |
| Workflow threads, wayfinding, mental model alignment, page-to-page continuity | [references/workflow-comprehension.md](references/workflow-comprehension.md) |
| Full protocol for each of the 8 scenarios | [references/scenario-tests.md](references/scenario-tests.md) |
| AI-tell catalogue, optical centring, design-token discipline, per-component pass | [references/visual-polish.md](references/visual-polish.md) |
| Report format and severity rubrics | [references/report-template.md](references/report-template.md) |
| Browser tool commands and viewport notes | [references/browser-tools.md](references/browser-tools.md) |
| Long-running audit supervision via 15-min `/loop` check-in | [references/long-running-check-in-pattern.md](references/long-running-check-in-pattern.md) |

## Tips

- **Thread first, elements second.** If time is short, threads tell you more.
- **Sub-agents for screenshot review.** Don't drive the browser and analyse 200 screenshots in one loop.
- **Write findings incrementally.** The report file is cheaper memory than your context.
- **Stay in persona.** If you catch yourself thinking "a developer would know…" stop. Your persona doesn't.
- **Every hesitation is a finding.** If you paused to figure out what to click, that's friction worth reporting.
- **Use the eyedropper liberally.** Single fastest way to find vibe greys, off-token colours, and design-system drift.
- **Coverage is arithmetic.** Inventoried ÷ tested. Publish the ratio in the report.
