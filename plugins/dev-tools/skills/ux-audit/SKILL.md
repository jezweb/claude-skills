---
name: ux-audit
description: "Walk through a live web app AS a real user to find usability + behavioural bugs that static reviews miss. REQUIRES proof of interaction (typing, clicking, sending, observing) before any verdict — a sweep that didn't interact terminates with verdict 'Incomplete'. Walks threads, exercises every element, runs the multi-pane stress matrix, visual polish sweep, component perfection checklist, automated a11y (axe-core), pragmatic performance budget (LCP/CLS/INP), scenario battery (11 scenarios), and stress recipes including the real-flavour data battery. Hard gates: console errors/warnings = 0, network 5xx = 0, layout collapse = 0, axe Critical/Serious = 0, perf budget green. Audit-the-audit meta-check rejects rushed reports. Each finding has reproduction steps, evidence path, and suspected code location. Trigger with 'ux audit', 'walkthrough', 'qa sweep', 'audit the app', 'dogfood this', 'check all pages', 'find what's broken', 'stress the UI'."
compatibility: claude-code-only
---

# UX Audit (v2)

Walk through a live web app AS a real user. The audit is **interaction-first** — typing, clicking, sending, watching, screenshotting. A static DOM sweep cannot produce a verdict.

## Why this skill exists in v2

Most catastrophic UX bugs only surface under interaction:

- The Send button that doesn't clear the input
- The @-mention picker that double-inserts the handle
- The thread pane that breaks layout when the sidebar is also open at 1280px
- The form submit that disables the button but silently 5xx's
- The console warning that's been logging for weeks but no audit ever flagged

A DOM probe sees none of these. They require: type → wait → screenshot → diff → console-read → repeat. The previous audit method drifted toward sweep mode (faster, feels productive, blind to behaviour). v2 makes that drift impossible — the agent cannot output "Pass" without an Interaction Manifest that proves real clicks happened.

## Verdict states

The audit ends in exactly one of:

- **Pass** — Critical = 0, High = 0, all hard gates green, Interaction Manifest complete.
- **Conditional Pass** — Critical = 0, High = 0, all hard gates green, but Medium/Low present.
- **Fail** — at least one Critical or High finding, OR a hard gate red.
- **Incomplete** — Interaction Manifest missing required entries, a phase wasn't run, OR the audit-the-audit meta-check fires (manifest timestamps clustered < 0.5s apart, screenshots fewer than 2 × routes, console reads fewer than 1 × routes, Phase 3 took < 1m for an exhaustive audit). Not legal to upgrade to Pass even if everything observed looked fine.

If the work doesn't include a complete Interaction Manifest, the only legal verdict is **Incomplete**. "It looked OK" is not Pass. A clean Pass with implausible timings is rejected — the agent must redo the audit with real interaction.

## Hard gates

These auto-fail the audit. They cannot be downgraded.

| Gate | Threshold | Severity if violated |
|------|-----------|----------------------|
| Console errors during walkthrough | > 0 | Critical |
| Console warnings during walkthrough | > 0 | High |
| Network 5xx | > 0 | Critical |
| Network 403 / 404 on authenticated pages | > 0 | High |
| Layout collapse at any tested viewport / pane combo | > 0 | High |
| axe-core Critical violations on any audited page | > 0 | Critical |
| axe-core Serious violations on any audited page | > 0 | High |
| LCP on representative route (pragmatic budget) | > 4.0s | High |
| CLS on representative route | > 0.25 | High |
| INP on representative route | > 500ms | High |
| Required Interaction Manifest entry missing | n/a | Incomplete |
| Manifest median gap between entries < 0.5s | n/a | Incomplete (didn't actually interact) |

A console warning is High *minimum*. A 5xx is Critical *automatically*. There is no "Medium console error" — that category does not exist in this skill.

axe-core thresholds are run **per page** (>1 violation on any single page fails). Performance thresholds are run **once on a representative route** (per-page is overkill); pragmatic budget is well above broken, well below CWV-strict. Full thresholds + rationale in [references/performance-budget.md](references/performance-budget.md). Full a11y wiring + severity mapping in [references/a11y-automation.md](references/a11y-automation.md).

### Allowlist for known noise

Some apps have known-noisy console / network categories that aren't bugs (Sentry info logs in dev, browser-extension chatter, expected 401 on auth-check probes). The audit reads an audit-config file before Phase 3 and applies the allowlist when classifying findings. Path fallback chain: `.jez/audit-config.yml` → `audit-config.yml` (project root) → `.audit/config.yml`. Allowlisted entries stay in the Interaction Manifest (transparency) but suppress from the findings count. The verdict block always shows both raw and allowlisted counts — `Console warnings: 3 (1 allowlisted, 2 reportable)`.

Default without a config: every console error / warning is a finding. Allowlist is opt-in per project, not a global escape hatch. Full format, semantics, surface overrides, and quarterly-audit discipline in [references/audit-config.md](references/audit-config.md).

## Phases (in order)

1. **Pre-flight** — Persona Lock, browser tool, URL, viewport, capability tests
2. **Discovery** — sitemap, thread inventory, element inventory
3. **Walkthrough** — Interaction Manifest, threads, element exhaustion, multi-pane stress, first-time-user lens, live interaction smoke
4. **Polish** — visual polish sweep, component perfection checklist
5. **Stress** — scenario battery (11 scenarios) + extended stress recipes
6. **Verdict** — verdict state, hard-gate scorecard, perfection roadmap, findings with reproduction
7. **Fix-and-verify** — patch findings, re-walk affected slices, update report

This is the thorough audit. There is no quick mode. For a 30-second pre-deploy check, use the dogfood drill at the bottom of this file — it's a project-level rule, not a skill invocation.

## Phase 1 — Pre-flight

Five gates. Stop if any fail.

### 1. Persona Lock

The audit needs a persona before anything else. Without a locked persona, findings drift toward generic "looks fine".

Source the persona in this order:

1. **Argument** — if the user provided one ("ux audit as a busy insurance broker")
2. **Project personas** — read existing persona files (fallback chain: `.jez/audit-personas/<slug>.md` → `docs/personas/<slug>.md` → `personas/<slug>.md` → `.audit/personas/<slug>.md`). The first match wins.
3. **Ask once** — *"Who uses this app and what are they trying to get done?"*

Capture: role, tech comfort, time pressure, emotional state, device context. A good persona predicts what they'd miss ("A receptionist between phone calls won't scroll below the fold").

Lock the persona by writing the chosen persona at the top of the audit report. Every finding must be defensible from this persona's perspective. If you catch yourself thinking *"a developer would know..."* — stop. Your persona doesn't.

**Always also run the first-time-user lens** (mandatory, see Phase 3) on every multi-page feature, even when the explicit persona is something else. It's the single biggest blind spot for AI / internal tooling.

See [references/persona-lock.md](references/persona-lock.md) for the persona library and writing protocol.

### 2. Browser tool

| Target | Tool | Why |
|--------|------|-----|
| **Authenticated app** | Chrome MCP | Uses your real logged-in Chrome session — OAuth, cookies, RBAC just work |
| **Public site** | Playwright MCP | No login needed |
| **Neither available** | **Stop** | Ask the user to connect Chrome MCP or install Playwright |

Do **not** silently fall back to a fresh Playwright session for an authenticated app — the audit is worthless if you can't log in. If Chrome MCP isn't connected, stop and say: *"Open Chrome, click Connect in the Claude extension, then rerun."*

See [references/browser-tools.md](references/browser-tools.md) for commands.

### 3. URL

Prefer the deployed/live version — real auth, real latency, real CDN and CORS. Discovery: read project CLAUDE.md / README for "URL" → check stack config (`wrangler.jsonc`, `vite.config.ts`, `next.config.js`, `config/database.yml`, `manage.py`, `.env` `APP_URL`, `wp-config.php`) → `lsof -i :PORT` (common: 5173 Vite, 3000 Next/Rails, 8000 Django/Laravel, 8787 Wrangler, 4321 Astro) → ask. Stack-specific guide in [references/project-adaptation.md](references/project-adaptation.md). Use local only if the user asks or the feature isn't deployed.

### 4. Viewport

Pin the window at 1440×900 to start. Phase 3 multi-pane stress tests 375 / 768 / 1024 / 1280 / 1440 / 1920. **Do not go above 2000px** — it breaks the harness.

### 5. Capability tests

Before any walkthrough, prove the tools work — one call each:

- One screenshot
- One console read
- One network request inventory
- One element selector query

If any fail, stop and fix the connection before starting the audit. An audit blind to console output is worthless.

## Phase 2 — Discovery

### Sitemap crawl

Build the complete page inventory before auditing any page.

1. **Router config** — read the app's route definitions (React Router, TanStack Router, Next.js app dir)
2. **Nav crawl** — click through every section and sub-section of the sidebar/menu
3. **Deep links** — URLs in CLAUDE.md, docs, or a prior audit report

One line per route, with purpose: `/app/clients — list of clients, search, add new`.

### Thread inventory

Identify 3–5 real tasks that make up a user's day. These are the spines of the audit.

How to find them: ask the user, read CLAUDE.md / README, infer from top-level nav. Examples: insurance broker → renew a policy, create a client, work today's queue. Project management → morning triage, update a task, send a client summary. Spaces / chat app → create a space, send a message, open a thread.

### Element inventory

For each route as you reach it, list every interactive element. Build inventories lazily — per-page as you traverse, not all up-front. This drives the coverage metric: *"tested 29 of 31 elements on /app/clients"*.

## Phase 3 — Walkthrough (the audit itself)

### Interaction Manifest (MANDATORY)

Every walkthrough produces a manifest. Without it, verdict = Incomplete.

```
INTERACTION MANIFEST — /dashboard/spaces/marketing-pod
  Persona: SME owner, time-pressed, low tech comfort
  [✓] 14:32:01 Typed "@assistant test" into message input (textarea[placeholder*="message"])
  [✓] 14:32:03 Picked @assistant from autocomplete (li[data-mention-id="assistant"])
  [✓] 14:32:05 Clicked Send (button[aria-label="Send"])
  [✓] 14:32:06 Verified input cleared within 1000ms (textarea.value === "")
  [✓] 14:32:08 Verified message appeared in transcript ([data-message-id] count +1)
  [✓] 14:32:12 Opened thread on the message ([data-thread-trigger])
  [✓] 14:32:13 Verified main column width ≥ 200px after thread open (getBoundingClientRect().width)
  [✓] Console read after each step (0 warnings, 0 errors)
  [✓] Screenshot before + after each step
  [✓] Network requests inventoried (0 5xx, 0 403/404 on auth pages)
```

Every checkbox needs a tool call (a click, a screenshot, a console read) and the timestamps + selectors are logged. The agent cannot produce a "Pass" report without a complete manifest.

**Required entries per page audited**:

- ≥ 1 input typed into (real text, not just clicked)
- ≥ 1 primary action triggered (Send / Save / Submit / Create / Publish — whichever fits)
- ≥ 1 modal or detail pane opened
- ≥ 1 console read after the primary action
- ≥ 1 screenshot before AND after the primary action
- Verification of expected post-action state (input cleared, success toast, route change, list updated)

Full template + replay protocol in [references/interaction-manifest.md](references/interaction-manifest.md).

### Thread Traversal

For each thread:

1. **Start from the app entry point** — not mid-thread. Real users land at `/` or `/dashboard`.
2. **Walk as the persona** — if they'd skim, skim. If they'd misread a label, misread it. Note hesitations.
3. **Screenshot every state change** — default → hover/focus → active → after click → after load → confirmation. The filmstrip is the evidence.
4. **Track the cost** — click count, decision points, dead ends, interrupt recovery (close tab at step 3, return at step 4 — did state survive?)
5. **Hand screenshots to a sub-agent for review** at the end of each thread.

At the end of each thread, answer (as the persona): *Did it end clearly? Would I come back? One thing to make this twice as easy?*

See [references/walkthrough-checklist.md](references/walkthrough-checklist.md) and [references/workflow-comprehension.md](references/workflow-comprehension.md).

### Element Exhaustion

For each route, work the inventory. Skip elements already exercised by thread traversal. Detail in [references/walkthrough-checklist.md](references/walkthrough-checklist.md).

For **every list/table**, test at volumes 0 / 1 / 100 / 1000+ if data permits.

### Multi-Pane Stress (mandatory for apps with collapsible UI)

Pane combinations hide the worst layout bugs — the 2026-04-29 vertical-text-in-spaces bug only manifested at 1024-1280px with all three panes open. For apps with sidebars / members / threads / drawers / sheets, run the matrix: 1920 / 1440 / **1280 (high-bug)** / **1024 (catastrophic-bug)** / 768 / 375 × all-open, 2-pane, 1-pane, default. For each combination: scroll the longest content, capture a screenshot, run layout-detection JS for overflow / clipping / vertical-text-stacks. Full matrix + JS snippets + automation in [references/multi-pane-stress.md](references/multi-pane-stress.md).

### First-time-user lens (mandatory)

Beyond the locked persona, every multi-page feature must pass the **first-time user** check. This catches the single biggest UX failure mode in internal/AI tooling: features built by the people who designed them work *for them*, but a brand-new user landing on the same screen has no idea what any of the controls mean.

Adopt the persona of *someone signing in to this app for the very first time, with no prior context, no source access, no internal documentation*. For each screen ask:

| Question | What it catches |
|---|---|
| Could I complete the task without reading the code or docs? | Hidden technical knowledge baked into the form |
| Are field labels in plain language, not internal vocabulary? | `agentClass`, `slug`, `webhook_id` leaking into UI |
| Do dropdowns / pickers show **what each option does**, not just an ID? | Snake_case enums, raw class names, opaque slugs |
| Are defaults sensible enough to keep them and move on? | Required fields with no defaults, mandatory ID inputs |
| Is there a discoverable list of valid values when something needs to be entered? | Free-text inputs where a combobox should be |
| If I'd say "click Skip" because I don't understand a setting, that's a UX bug. | Optional-but-confusing settings exposed as primary inputs |

When the lens fires, log a finding even if the screen technically works. Common fixes: replace text inputs with pickers, surface metadata, auto-derive values, hide internal IDs under "Advanced", add inline guidance.

A screen passes the lens when a brand-new persona could complete the task without back-channel help.

### Live Interaction Smoke

Code reading verifies a button exists and has an `onClick`. It does not verify clicking actually does something observable. For every interactive control on every page:

1. **Click it.** Pointer moves, element highlights, click lands.
2. **Watch the Network tab.** Did a request fire? To the right URL? Correct method + body?
3. **Watch the DOM.** Did something visibly change — new element, removed element, state transition?
4. **If nothing changed in (2) or (3), that's a bug.**

Known silent-failure controls (Approve/Deny on tool-call cards, OAuth-in-dialog popup-blocked, async-validation forms, optimistic-UI delete, off-by-one pagination, filter chips with stale TanStack Query, Reply/Forward without Message-ID): see [references/live-interaction-smoke.md](references/live-interaction-smoke.md) for the full silent-failure catalogue and SDK contract checks (`@ai-sdk/react`, better-auth, TanStack Query, React Router v7, Radix Dialog, zodResolver).

### Round-trip Workflow Integrity (mandatory)

For every A → B → A workflow, walk the full round-trip: capture A's state, trigger action that goes to B, complete mutation, navigate back via discoverable affordance (not reload), verify A reflects new state including header badges. Stale A or hidden back-affordance is High — looks like data loss to the user. Particular smells: header badges (bell, unread, pending pips) that depend on data multiple pages can mutate. Full protocol + surface inventory + findings template in [references/round-trip-workflows.md](references/round-trip-workflows.md).

### Responsive Sweep

Layout-detection JS at every width (overflow, clipping, invisible text). Capture transition points. Combined with multi-pane stress above for full coverage.

### Auth-expired mid-audit

If a navigation or API call returns 401/403 on a previously-authenticated route, the session dropped. **Don't silently re-auth** — every subsequent observation is corrupted. Stop, capture the breaking step (silent expiry is itself a finding), terminate with verdict `Incomplete`, recommend re-auth + restart. Full protocol + finding criteria in [references/auth-expired-handling.md](references/auth-expired-handling.md).

## Phase 4 — Polish

### Visual Polish Sweep

A page-by-page micro-polish pass covering ten AI-tell categories: optical centring, nested border-radius rule, off-scale spacing, vibe greys, border-weight drift, drop-shadow direction, animation timings off canonical, hover-delta calibration, underline / uppercase letter-spacing, symmetry vs editorial pacing.

Plus a per-component optical pass for buttons, badges, inputs, dropdowns, cards, tabs, avatars, toasts.

Full protocol with DevTools workflow, severity guide, and reference apps for calibration in [references/visual-polish.md](references/visual-polish.md).

### Component Perfection Checklist

Component-level granularity that page-level audits miss. Six categories, each with concrete yes/no checks that need proof artefacts:

1. **Buttons & Triggers** — state clarity, intent matching, micro-copy, loading state, hierarchy
2. **Inputs & Forms** — persistent labels, masks, inline validation, error clarity, defaulting
3. **Navigation & Hierarchy** — Where am I?, click depth, search logic, sticky headers
4. **Visual Coherence** — icon consistency, empty states, border radii, contrast ratio
5. **Mobile & Touch** — tappable surface (≥ 48×48), keyboard optimisation, swipe gestures
6. **Performance & Feedback** — skeleton screens, success toasts, confirmation modals only for high-stakes

Plus six visual states per major component (default, skeleton, empty, partial, error, disabled) — skeleton-on-blank is not a skeleton.

Each checkbox in the report cites a proof artefact (screenshot, console line, DOM selector, code reference). No proof = doesn't count.

Full checklist in [references/perfection-checklist.md](references/perfection-checklist.md).

### Automated accessibility (axe-core, mandatory)

Manual keyboard-only walks (Scenario 5) catch focus traps and tab-order. They miss ~80% of structural a11y bugs (heading skips, hover/focus contrast failures, missing aria-labels, role mismatches). axe-core covers that 80% in <1 second per page.

For every audited page:

1. Inject axe-core via CDN (one script tag).
2. Run `axe.run()` after the page settles.
3. Map violations → audit findings (axe `critical` → audit Critical, axe `serious` → audit High, etc).
4. Hard-gate: > 0 axe Critical OR > 0 axe Serious on any page = audit Fails.

Total runtime for a 16-route audit is ~16 seconds. Allowlist via the project's audit-config (path fallback chain in [references/audit-config.md](references/audit-config.md)) for builder-mode reference pages (Components, Style guide). Full snippet, severity mapping, and findings format in [references/a11y-automation.md](references/a11y-automation.md).

### Performance budget (pragmatic, mandatory)

Run the Performance API capture once on a representative route (the page real users hit most — usually dashboard or main work surface). Pragmatic thresholds (LCP < 4.0s, CLS < 0.25, INP < 500ms) sit well above broken and well below Google's CWV "Good" tier. CWV-strict is for landing pages and marketing teams; for app interiors that real users sit inside, pragmatic is the right bar.

Add to verdict block. Hard-gate any threshold breach. Diagnose with Chrome DevTools Performance trace (large hero, late font, heavy click handler, hydration cost). Full measurement snippet, throttling spec, and common offenders in [references/performance-budget.md](references/performance-budget.md).

## Phase 5 — Stress

### Scenario Battery (11 scenarios)

All eleven, always. They catch what screen-by-screen testing misses. Full protocols in [references/scenario-tests.md](references/scenario-tests.md).

1. **First Contact** — figure out the app with zero prior knowledge, write a 2-min plain-English guide to each thread.
2. **Interrupted Workflow** — start a task, close the tab, refresh, navigate away mid-form. Does state survive?
3. **Wrong Turn Recovery** — deliberately click wrong. How many clicks to recover?
4. **Returning User** — repeat a thread. Faster? Shortcuts? Can you tell what changed since last visit?
5. **Keyboard Only** — every thread keyboard-only. Focus visible, tab order logical, Escape closes.
6. **Heavy Data** — seed 500+ records. Lists virtualise, search returns the right thing, filters narrow.
7. **Destructive Confidence** — every delete/send/publish/pay/share: consent clear, copy specific, undo available.
8. **Second User (Role)** — restricted role (viewer not editor, client not staff). Read-only views, permission errors.
9. **Lifecycle Position** — same role at user #1 (founder), #2 (first invitee, partial state), #N (later joiner, populated workspace). Each sees a different reality.
10. **Round-Trip Workflow Integrity** — every A→B→A flow: complete mutation on B, verify A reflects new state on return without reload. Discoverable back affordance. Header badges update. The single biggest "the project is just empty when I go back" source.
11. **Data Seasoning** — Day 0 / 1 / 7 / 30 seed horizons. Time-shaped data catches what quantity-only seeds miss: time dividers, recency sort, cron-fired side effects, notification badge overflow, search-with-history performance, chart bucketing. Skip only if no time-distributed data exists.

### Extended Stress Recipes

Beyond scenarios, run every relevant recipe in [references/stress-test-recipes.md](references/stress-test-recipes.md):

| Stress | What it catches |
|--------|-----------------|
| Empty / saturated / long content | Edge layouts AI rarely sees during dev |
| Race conditions (double-click, fast-type-then-blur, slow network) | Optimistic UI bugs, debounce failures |
| Slow network (3G throttle) | Loading states, skeleton rhythm, timeout UX |
| Reduced motion (`prefers-reduced-motion: reduce`) | Animations that ignore the preference |
| i18n (long German, RTL Arabic, CJK widths) | Layout assumptions about text length |
| Offline mode | Retry / queue / dirty-state UX |
| Print stylesheet | Forgotten media query |
| High-contrast mode | Forced-colors media query handling |
| **Real-flavour data battery** (mandatory for any form-accepting app) | Validation that strips characters silently (apostrophe, accents, RTL); length truncation without warning; SQL/XSS canaries not escaped; file uploads that don't fit (.heic, 8000×8000 PNG, 50MB PDF). AI-built UIs are notoriously dev-data clean. |

## Phase 6 — Verdict

### Verdict block (mandatory at the top of the report)

```
═══════════════════════════════════════════════════════════
VERDICT: [Pass / Conditional Pass / Fail / Incomplete]

Persona: [locked persona slug]
Surfaces audited: N / M routes
Interaction Manifest: complete / incomplete (X of Y required entries)

Hard Gates: console errors [N], warnings [N], network 5xx [N], 403/404 auth [N], layout-collapse [N], axe Critical [N], axe Serious [N]   (all must be 0; allowlisted counts shown in parens)
Performance (on /[route]): LCP [N]s / CLS [N] / INP [N]ms — thresholds 4.0s / 0.25 / 500ms

Findings:
  Critical: [count]    High: [count]    Medium: [count]    Low: [count]

Self-critique pass (sub-agent): Drafted: [N]  Kept: [N]  Generic: [N]  Duplicate: [N]

Time per phase: Phase 3 [N]m / Total [N]m   (Phase 3 ≥ 5m for exhaustive)
Manifest plausibility: [N] entries (≥ 6/route), median gap [N]s (< 0.5s = Incomplete), [N] screenshots (≥ 2/route)

TOP 5 (ranked by impact × ease, senior-designer pick):
  1-5. [F-id] Title — one-sentence reason this edges out the others
═══════════════════════════════════════════════════════════
```

Top 5, Self-critique pass, and the Hold-this-in-your-hands closing paragraph (after Phase 7) are mandatory. Without them the verdict is `Incomplete`. Full discipline + format + anti-patterns in [references/audit-output-discipline.md](references/audit-output-discipline.md).

### Self-critique pass (mandatory before publishing)

After the findings draft, dispatch a fresh sub-agent with the draft list and this prompt:

> *"Read these audit findings. For each, mark KEEP / GENERIC / DUPLICATE. KEEP = specific to this app, this persona, this surface. GENERIC = would apply to any web app. DUPLICATE = same root cause as another finding. Drop GENERIC and DUPLICATE before publishing."*

A fresh sub-agent works because the original drafter is invested in its own output. Self-critique done in-context tends to defend rather than prune. Log the pass: `Drafted: 23  Kept: 14  Generic: 5  Duplicate: 4`.

### Audit-the-audit triggers (non-negotiable, auto-flip to Incomplete)

| Signal | Implies |
|---|---|
| Phase 3 took < 1m / manifest first→last span < 5m for exhaustive | Walkthrough skipped or rushed |
| Median gap between manifest entries < 0.5s | Entries batch-emitted, no real interaction |
| Screenshots fewer than 2 × routes / console reads fewer than 1 × routes | Pages weren't actually checked |
| Top 5 missing or padded with filler slots | Discipline broken (see [audit-output-discipline.md](references/audit-output-discipline.md)) |
| Self-critique pass not logged | Filler not pruned |
| Findings use "Suggested fix" / "Consider X" / "Improve Y" | Filler-shaped patches, not committable |
| `[✓]` PASS rows lack one-sentence proof + artefact | Vibe PASS |
| Hold-this-in-your-hands paragraph missing | No holistic judgement applied |

### Findings format (mandatory per finding)

Every finding must include: **ID** (severity-letter + number), **Layer** (Architecture / Interaction / Visual / Feedback / Delight), **Severity**, **Surface** (route + viewport + panes), **Persona**, **Reproduce** (numbered steps), **Observed**, **Expected**, **Evidence** (screenshot paths + console / network captures), **Suspected location** (`file:line`), **Smallest possible patch** (concrete + committable — *not* "Suggested fix" / "Consider X"). A finding without reproduction + evidence + suspected location is rejected. Filler patches ("improve X", "consider Y", "make Z better") get flipped to Incomplete by the self-critique pass. Worked example + Five-Layer Hierarchy in [references/report-template.md](references/report-template.md) and [references/perfection-checklist.md](references/perfection-checklist.md). Discipline rules in [references/audit-output-discipline.md](references/audit-output-discipline.md).

### Hold this in your hands (mandatory closing paragraph)

Every audit ends with one paragraph, no template, that answers: *if this app were a physical object, would I want to hold it?* This is the one place where vibe is the *point* — the holistic judgement no checklist surfaces. Format + worked examples in [references/audit-output-discipline.md](references/audit-output-discipline.md).

### Perfection Roadmap (mandatory)

Group findings into:

- **Quick Wins (24-48h)** — micro-copy, hover states, contrast fixes, single-line CSS adjustments
- **Structural (1-2 weeks)** — primitive replacements, route restructures, multi-pane refactors
- **Advanced Polish (post-launch)** — micro-animations, skeleton variations, personalised empty states

Full report structure in [references/report-template.md](references/report-template.md).

## Phase 7 — Fix-and-verify

After the report, offer the loop:

> *"Found N Critical and M High issues. Fix them now and re-verify?"*

If yes:
1. Group findings by file/area
2. Patch each one
3. **Re-walk just the affected slice** (not the whole app) — including the original interaction that surfaced the bug, with a fresh screenshot
4. Update the report: mark `✓ fixed`, `✗ still present`, or `⚠ new issue found`
5. Close with a "fixed in this session" summary

Closes the loop in one session instead of waiting for tomorrow's audit.

## Cross-reference with ux-extract and brains-trust

If a pattern library exists (fallback chain: `.jez/artifacts/ux-extracts/<ref>.md` → `docs/ux-extracts/<ref>.md` → `audits/extracts/<ref>.md`), read it before starting and use it as the bar for findings.

After v2 produces a verdict, consider running `dev-tools:brains-trust` to get a second-opinion review from a different model. v2 catches a class; brains-trust catches what your specific model habit misses. Recommended cadence: every 4-6 weeks.

When merging brains-trust findings back into the audit report, **dedup by `(reproduction-steps, suspected-location)`**. Same bug surfaced by a second model is one finding with two confirmations, not two findings. The merged finding gets a `Confirmed by:` line listing the models that flagged it — useful signal for prioritising fixes (a bug both models found is high-confidence).

Anti-pattern: appending the second model's report verbatim to the first. Produces a noisy report with the same Critical bug listed twice and inflates the perceived severity.

## The 30-Second Dogfood Drill (project-level rule)

The audit is heavy. For per-change pre-deploy checks, recommend a project rule in CLAUDE.md:

> **Before declaring any UI change "done", run the 30-second dogfood drill:**
> 1. Open the affected page
> 2. Type into any input
> 3. Click the primary action
> 4. Watch the next state for 2 seconds
> 5. Open a related view (thread, modal, detail)
> 6. Read the console
> If any step shows unexpected behaviour, the change isn't done.

Six steps, ~30 seconds. Catches behavioural bugs that surface immediately. Pair with the full ux-audit weekly.

## Playwright killer-flow tests

Audits find what's broken now. Tests prevent regressions. Recommend writing 10-15 Playwright tests for the killer flows — see [references/playwright-killer-flows.md](references/playwright-killer-flows.md) for starter examples (input clears after send, no console warnings on mount, message column width ≥ 200px after thread open, @-mention exactly one pill, etc.). Run on every deploy via CI.

## Autonomy

- **Just do it**: Navigate, screenshot, read pages, inject layout-detection JS, submit forms with fake test data, write the report file, dispatch screenshot-review sub-agents.
- **Ask first**: Destructive actions (delete, send, publish, pay). For Destructive Confidence testing, ask once before running that scenario.
- **Stop and confirm**: Anything that emails / notifies external people.

## Execution discipline

1. **Drive the audit from the main session, not a sub-agent.** Cross-interaction state lives in the session that's been watching. A fresh sub-agent starts cold and misses second-order findings.
2. **Use the browser tool directly.** Chrome MCP or Playwright MCP from the main session. Don't hand screenshots to a fresh agent for opinions.
3. **Loop to exhaustion with variations.** After each pass, generate a new angle (different persona, different workflow, different input volume, different starting point). Stop only when a full pass produces no new findings.

For audits expected to run > 30 minutes, set up a 15-min `/loop` check-in alongside the main session — it journals findings, grounds the session, and provides a natural termination signal. See [references/long-running-check-in-pattern.md](references/long-running-check-in-pattern.md).

## Reference files

| When | Read |
|------|------|
| **Cross-skill output discipline** (Top 5, self-critique, smallest-patch, proof-PASS, hold-this) | [references/audit-output-discipline.md](references/audit-output-discipline.md) |
| **Project adaptation** — non-default stacks (NextAuth/Lucia/Devise/Django auth, Prisma/TypeORM/ActiveRecord seeds, WordPress/Rails/Django URL discovery, persona library by app type) | [references/project-adaptation.md](references/project-adaptation.md) |
| Persona library + writing protocol + persona-overload pattern | [references/persona-lock.md](references/persona-lock.md) |
| Auth expiry mid-audit — protocol + headless test-auth resumption | [references/auth-expired-handling.md](references/auth-expired-handling.md) |
| Data seasoning horizons (Day 0 / 1 / 7 / 30) + project seed-script architecture | [references/data-seasoning.md](references/data-seasoning.md) |
| Audit-config allowlist format + semantics + surface overrides | [references/audit-config.md](references/audit-config.md) |
| Interaction Manifest template + replay protocol | [references/interaction-manifest.md](references/interaction-manifest.md) |
| Multi-pane stress matrix + automation snippets | [references/multi-pane-stress.md](references/multi-pane-stress.md) |
| Per-screen evaluation questions, layout-detection JS | [references/walkthrough-checklist.md](references/walkthrough-checklist.md) |
| Wayfinding, mental model, page-to-page continuity | [references/workflow-comprehension.md](references/workflow-comprehension.md) |
| Full protocol for each of the 11 scenarios | [references/scenario-tests.md](references/scenario-tests.md) |
| Extended stress recipes (race, slow network, reduced motion, i18n) | [references/stress-test-recipes.md](references/stress-test-recipes.md) |
| Component-level perfection checklist (6 categories + 6 states) | [references/perfection-checklist.md](references/perfection-checklist.md) |
| AI-tell catalogue, optical centring, design-token discipline | [references/visual-polish.md](references/visual-polish.md) |
| Silent-failure controls + SDK contract checks | [references/live-interaction-smoke.md](references/live-interaction-smoke.md) |
| Playwright killer-flow test starters | [references/playwright-killer-flows.md](references/playwright-killer-flows.md) |
| Report format, verdict block, severity rubric, reproduction-step format | [references/report-template.md](references/report-template.md) |
| Browser tool commands and viewport notes | [references/browser-tools.md](references/browser-tools.md) |
| Round-trip workflow integrity (A→B→A pattern) | [references/round-trip-workflows.md](references/round-trip-workflows.md) |
| Automated accessibility (axe-core injection + severity mapping) | [references/a11y-automation.md](references/a11y-automation.md) |
| Pragmatic performance budget (LCP/CLS/INP via Performance API) | [references/performance-budget.md](references/performance-budget.md) |
| Long-running audit supervision via 15-min `/loop` | [references/long-running-check-in-pattern.md](references/long-running-check-in-pattern.md) |

## Tips

- **Interaction first, sweep last.** A sweep without prior interaction is Incomplete.
- **Type into something on every page.** Real text. The single most-effective change for catching behaviour bugs.
- **Read the console after every primary action.** Most regressions surface as warnings before they become bugs.
- **Multi-pane stress is not optional.** If the app has collapsible UI, the worst bugs live in pane-overlap zones.
- **Stay in persona.** If you catch yourself thinking "a developer would know..." — stop. Your persona doesn't.
- **Every hesitation is a finding.** If you paused to figure out what to click, that's friction worth reporting.
- **Use the eyedropper liberally.** Single fastest way to find vibe greys, off-token colours, design-system drift.
- **Coverage is arithmetic.** Inventoried ÷ tested. Publish the ratio in the report.
- **Sub-agents for screenshot review and write findings incrementally.** Don't drive the browser and analyse 200 screenshots in one loop. The report file is cheaper memory than your context.
