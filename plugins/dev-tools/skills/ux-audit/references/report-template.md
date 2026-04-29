# UX Audit Report Template (v2)

Write the report to `docs/ux-audit-YYYY-MM-DD.md`. If `.jez/artifacts/` exists in the project, write to `.jez/artifacts/ux-audit-YYYY-MM-DD.md` instead.

Write incrementally — open the file at the start of the audit, append as you go. Don't batch at the end.

The report MUST include the verdict block at the top. If any required section is missing, the report is "Incomplete" not "Pass" — even if every observation looked fine.

## Required structure

```markdown
# UX Audit: [App Name]

═══════════════════════════════════════════════════════════
VERDICT: [Pass / Conditional Pass / Fail / Incomplete]

Persona Lock: [persona slug + path to persona file]
Locked at: YYYY-MM-DD HH:MM TZ
Surfaces audited: N / M routes
Interaction Manifest: [complete / incomplete: X of Y required entries]

Hard Gates:
  Console errors:        [count]   [GREEN ✓ / RED ✗]   ([N] allowlisted)
  Console warnings:      [count]   [GREEN ✓ / RED ✗]   ([N] allowlisted)
  Network 5xx:           [count]   [GREEN ✓ / RED ✗]
  Network 403/404 auth:  [count]   [GREEN ✓ / RED ✗]   ([N] allowlisted)
  Layout collapse:       [count]   [GREEN ✓ / RED ✗]

Findings:
  Critical: [count]
  High:     [count]
  Medium:   [count]
  Low:      [count]
═══════════════════════════════════════════════════════════

**Date**: YYYY-MM-DD
**URL**: https://app.example.com
**Persona**: [persona name + 1-line summary]
**Browser**: Chrome MCP / Playwright MCP
**Viewport**: 1440×900 baseline + multi-pane stress + dark mode
**Reference extract used**: [path or "none"]

## Executive Summary

[2–3 sentences: overall impression, biggest concerns, the North Star fix]

## Coverage

| Dimension | Tested | Total | % | Notes |
|-----------|--------|-------|---|-------|
| Routes | 14 | 14 | 100% | |
| Interactive elements | 187 | 203 | 92% | 16 untested on /app/billing |
| Threads walked | 4 | 4 | 100% | |
| Scenarios completed (of 9) | 8 | 9 | 89% | Destructive Confidence skipped — no test account |
| Multi-pane stress combos | 24 | 24 | 100% | 6 viewports × 4 pane combos |
| Component states sampled (of 6) | 4 | 6 | 67% | Partial loaded + Disabled not reproducible on all components |
| Stress recipes | 13 | 15 | 87% | RTL + Print skipped (don't apply) |
| Live Interaction Smoke controls | 47 | 47 | 100% | |

**Elements not tested** (and why):
- /app/billing — 16 elements — requires paid plan, not available on test account
- Pagination on /app/clients — insufficient test data

## Findings

Each finding follows this format. **A finding without reproduction + evidence + suspected location is rejected.**

### Critical (blocks user task; data loss; security)

#### [C-1] Vertical-stacking message text in spaces makes Spaces unusable

- **Layer**: Visual / Interaction
- **Severity**: Critical
- **Surface**: /dashboard/spaces/:id
- **Viewport**: 1280×800, all 3 panes open (sidebar + members + thread aside)
- **Persona**: SME owner

**Reproduce**:
1. Sign in
2. Open any existing space
3. Open the members panel (👥 icon top-right, default on md+)
4. Click any message → opens thread aside
5. Look at the message timeline column

**Observed**: message text wraps one character per line — vertical column ~24px wide.
**Expected**: text wraps at word boundaries within the available column width (≥ 260px).

**Evidence**:
- `.jez/audit-evidence/2026-04-29/spaces-1280-3panes.png`
- `.jez/audit-evidence/2026-04-29/spaces-1280-3panes-devtools.png`
- Console: 0 errors at point of capture
- Layout-detection JS output: `[{ selector: "main.flex-1.min-w-0", width: "184.5", height: "612.0", textPreview: "h\ne\nl\nl\no\n…" }]`

**Suspected location**: `src/client/modules/spaces/pages/SpacePage.tsx:200` — `<main className="flex-1 min-w-0">`

**Suggested fix**: Replace `min-w-0` with `min-w-[260px]` to enforce minimum readable width, OR auto-fold the members pane at lg breakpoint.

---

### High (confusion, friction, trust damage; console warning; layout collapse)

#### [H-1] VoiceClient protocol-mismatch warning logs on every chat-page mount

- **Layer**: Feedback
- **Severity**: High (auto via console budget Hard Gate)
- **Surface**: any /dashboard/chat/* route
- **Persona**: any

**Reproduce**:
1. Sign in
2. Navigate to /dashboard/chat
3. Open browser console

**Observed**: `VoiceClient: protocol mismatch (1.2 vs 1.4)` warning logs on every mount.
**Expected**: clean console.

**Evidence**: `.jez/audit-evidence/2026-04-29/chat-console.txt` (12 occurrences in 2 page loads)

**Suspected location**: `src/client/modules/voice/voiceClient.ts:42`
**Suggested fix**: bump VoiceClient SDK to 1.4-compatible version OR pin protocol to 1.2 in init.

---

### Medium (suboptimal but workable)

#### [M-1] [Short title]

- **Layer**: [Architecture / Interaction / Visual / Feedback / Delight]
- **Severity**: Medium
- **Surface**: [page]
- **Persona**: [persona]
- **Reproduce**: [steps]
- **Observed**: [what happened]
- **Expected**: [what should happen]
- **Evidence**: [paths]
- **Suspected location**: [file:line]
- **Suggested fix**: [recommendation]

---

### Low (polish)

#### [L-1] [Short title]
[Same format as above, abbreviated for polish-class findings]

## Thread Results

### Thread 1: [e.g. "Send a message in a space"]

- **Completable end-to-end**: Yes / No / Partially — [detail]
- **Click count**: [N] (estimated optimal: [N])
- **Decision points**: [N] — [list the moments]
- **Dead ends**: [N] — [list]
- **Interrupt recovery**: [closed tab at step 3 — state preserved? ✓ / ✗]
- **Did it end clearly?**: [Yes/No — detail]
- **Would I come back?**: [Yes/Maybe/No — why]
- **One thing to make it twice as easy**: [single highest-impact suggestion]
- **Screenshots**: [folder path or numbered list]

### Thread 2: [...]

[repeat]

## Interaction Manifest summary

```
INTERACTION MANIFEST — Coverage
  Total entries logged: 84
  Required minimum: 84 (14 pages × 6 entries)
  Pages with complete manifest: 14 / 14
  Pages with incomplete manifest: 0
```

Detailed manifest per page is at `.jez/audit-evidence/2026-04-29/manifests/`. Verdict cannot be Pass without complete coverage.

## Multi-Pane Stress Matrix

| Route | 1920 all open | 1440 all | 1280 all | 1024 all | 1024 2-pane | 1024 1-pane | 768 default | 375 mobile |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| / | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| /dashboard/spaces/:id | ✓ | ✓ | ✗ (C-1 vertical text) | ✗ (C-1) | ✓ | ✓ | ✓ | ✓ |
| /dashboard/inbox | ✓ | ✓ | ✓ | ✓ | n/a | n/a | ✓ | ✓ |

## Scenario Battery Results

### Scenario 1 — First Contact
- Time to first value: [clicks/pages]
- Self-explanatory score: [1–5]
- Terminology barriers: [list]
- Threads easy to explain: [list]
- Threads requiring caveats: [list + the caveats]
- Threads unexplainable: [list]
- 2-minute guides written:
  - *Thread 1*: "[actual guide written during the test]"
  - *Thread 2*: "[...]"

### Scenario 2 — Interrupted Workflow

| Interruption | Data preserved? | Could resume? | Notes |
|-------------|----------------|---------------|-------|
| Navigate away mid-form | Y/N | Y/N | |
| Close tab + reopen | Y/N | Y/N | |
| Page refresh | Y/N | Y/N | |
| Back button | Y/N | Y/N | |

### Scenario 3 — Wrong Turn Recovery

| Wrong turn | Recovery method | Steps | Context lost? |
|-----------|----------------|-------|---------------|
| Wrong nav section | [method] | [N] | [what] |
| Wrong record | [method] | [N] | [what] |
| Wrong filter | [method] | [N] | [what] |

### Scenario 4 — Returning User

| Thread | First time | Second time | Improvement | Shortcuts found |
|--------|-----------|-------------|-------------|-----------------|
| Thread 1 | [N clicks] | [N clicks] | [faster/same/slower] | [list] |

- Awareness score (what changed): [1–5]
- Notification quality: [assessment]
- Missing "what's new" signals: [list]

### Scenario 5 — Keyboard Only

| Thread | Completable keyboard-only? | Blockers |
|--------|---------------------------|----------|
| Thread 1 | Y/N/Partially | [what stopped you] |

- Focus visibility: [always visible / sometimes / missing]
- Tab order: [logical / jumps around]
- Focus traps: [work correctly / broken on modal X]
- Documented shortcuts: [list or "none"]

### Scenario 6 — Heavy Data

| Area | At 500 records | At 1000+ |
|------|----------------|----------|
| List load time | [sec] | [sec] |
| Scroll smoothness | Smooth/Janky | |
| Search | Instant/Slow/Broken | |
| Filter | Useful/Overwhelming | |
| Pagination | Works/Slow/Broken | |

### Scenario 7 — Destructive Confidence

| Action | Confirmation | Destructive styling | Undo | Severity |
|--------|-------------|---------------------|------|----------|
| Delete client | [copy quality] | Y/N | Y/N | |
| Send invoice | [copy] | Y/N | Y/N | |

### Scenario 8 — Second User (Role)

| Thread | Completable as [role] | Broken pages | Leaked data | Error quality |
|--------|----------------------|--------------|-------------|--------------|
| Thread 1 | Y/N | [list] | [list] | [assessment] |

### Scenario 9 — Lifecycle Position

| Position | Setup flow shown? | Onboarding gap | Wayfinding works? | Empty/partial UI helpful? |
|----------|-------------------|----------------|-------------------|--------------------------|
| User #1 (founder) | Y/N + quality | [list] | Y/N + detail | Y/N + detail |
| User #2 (first invitee) | Y/N + quality | [list] | Y/N + detail | Y/N + detail |
| User #N (later joiner) | Y/N + quality | [list] | Y/N + detail | Y/N + detail |

- **Same-screen-three-faces coherence**: [pages where empty / partial / full all looked considered]
- **Onboarding scope creep**: [setup UI bleeding into screens it shouldn't]
- **Peer-feature dignity** (mentions, assignments, activity feeds with 1 / 2 / 50 users): [findings]

## Stress Recipe Results

| Recipe | Run? | Findings | Severity |
|--------|------|----------|----------|
| Race conditions (double-click submit) | ✓ | 0 | — |
| Slow network (3G throttle) | ✓ | 1 | M-2 missing skeleton |
| Reduced motion | ✓ | 0 | — |
| i18n long German | ✓ | 1 | H-3 button overflow |
| RTL Arabic | n/a | — | (no i18n yet) |
| CJK widths | n/a | — | (no i18n yet) |
| Empty / saturated states | ✓ | 2 | M-3 + L-1 |
| Offline mode | ✓ | 1 | C-2 silent data loss |
| Print stylesheet | n/a | — | (chat app) |
| Forced colors / high contrast | ✓ | 1 | H-4 buttons disappear |
| Keyboard only | ✓ | 0 | — |
| Screen reader | partial | 2 | H-5 + M-4 |
| Long-press / right-click | ✓ | 0 | — |
| Browser-back during in-flight | ✓ | 0 | — |
| Tab-restore | ✓ | 0 | — |

## Component States Coverage

For each major component sampled, capture which of the six states were verified:

| Component | Default | Skeleton | Empty | Partial | Error | Disabled | Notes |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|-------|
| Spaces list | ✓ | ✓ | ✓ | n/a | ✓ | n/a | |
| Message list (in space) | ✓ | ✗ (spinner) | ✗ (blank) | ✗ | ✗ | n/a | Skeleton + Empty + Partial + Error all missing |
| Send button | ✓ | n/a | n/a | n/a | ✓ | ✓ (no tooltip) | Disabled state has no "why" |
| Settings form | ✓ | n/a | n/a | n/a | ✓ | ✓ | |

## Visual Polish (AI-tell sweep)

| Route | Optical centring | Nested radius | Off-scale spacing | Vibe greys | Border drift | Shadow direction | Anim timings | Hover delta | Underline / uppercase | Symmetry / pacing |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| / | ✓ | ✓ | ✗ (22px gap) | ✗ (#5a6168 raw) | ✓ | ✓ | ✗ (187ms drop) | ✓ | ✓ | ✓ |
| /dashboard/spaces/:id | ✗ (button text 2px high) | ✓ | ✓ | ✗ (3 raw greys) | ✓ | ✓ | ✓ | ✗ (3% delta) | ✓ | ✓ |

**Per-component findings**:

- **Buttons (primary)** — text mathematically centred across all uses; needs ~1px upward optical correction
- **Sidebar dividers** — 2 raw grey values mixed (`#d4d4d8` and `#dfe1e6`); should consolidate to `--border` token
- **Modal shadow direction** — `-2px x-offset` on settings modal disagrees with app-wide `0 x-offset` light source

**Severity tally**:

| Severity | Count | Pattern type |
|----------|-------|-------------|
| High | 2 | Stacked AI-tells on primary CTA component |
| Medium | 4 | Pattern-level (raw greys app-wide, animation timings off canonical) |
| Low | 7 | Single-instance |

## Component Perfection Checklist (Phase 4)

- [x] Buttons & Triggers — see [perfection-checklist.md](perfection-checklist.md) for the 7 checks per category
- [x] Inputs & Forms — proof: ../audit-evidence/inputs-2026-04-29/
- [ ] Navigation & Hierarchy — incomplete (didn't test mobile sticky behaviour)
- [x] Visual Coherence — proof captured
- [x] Mobile & Touch — proof: 375px walkthrough
- [x] Performance & Feedback — proof: throttled-3G recordings

## Network Errors (detected during browsing)

| Endpoint | Status | Page | Severity | Notes |
|----------|--------|------|----------|-------|
| `GET /api/boards/users` | 403 | /app/boards/123 | High | Likely route collision with /:boardId |
| `POST /api/settings/theme` | 403 | /app/settings | High | Permission check failing |
| `GET /api/reports/summary` | 500 | /app/dashboard | Critical | Server error |

## Console Errors

| Type | Count | Page | Severity | Notes |
|------|------|------|----------|-------|
| `VoiceClient: protocol mismatch` warning | 12 | /dashboard/chat | High | See H-1 |
| `Warning: Each child in a list should have a unique "key" prop.` | 3 | /dashboard/spaces | High | React key warning |

## What Works Well

Positive findings — patterns to preserve and replicate:

- [e.g. "Empty state on /app/clients has a clear CTA and explanation"]
- [e.g. "Create flow lands on the new record, not back at the list"]
- [e.g. "Keyboard shortcut palette (Cmd+K) works from every page"]

## Perfection Roadmap

### Quick Wins (24-48 hours)
1. **Fix VoiceClient warning** — addresses H-1. Bump SDK or pin protocol. Est. effort: S.
2. **Standardise sidebar grey to `--border` token** — addresses M-1. Single CSS var change. Est. effort: S.
3. **Add aria-label to dismiss buttons** — addresses M-4 screen reader. Est. effort: S.

### Structural Updates (1-2 weeks)
4. **Add `min-w-[260px]` to spaces main column** — addresses C-1 vertical text. Refactor SpacePage layout. Est. effort: M.
5. **Add error toast on settings save 5xx** — addresses C-2 offline silent loss. Wire up `onError` to toast layer. Est. effort: M.
6. **Migrate to design-token greys app-wide** — addresses M-1 + 4 other pattern findings. Touches ~30 files. Est. effort: L.

### Advanced Polish (post-launch)
7. **Add skeleton screens to message list, spaces list, inbox** — addresses Component States gap.
8. **Animation timings to canonical 150/200/300/500ms across the app**.
9. **Visual regression baselines via Playwright + git LFS**.

## Fix-and-Verify (if run)

| Finding | Severity | Fix applied | Verified |
|---------|----------|------------|----------|
| C-1 Vertical text in spaces | Critical | commit 987525f | ✓ |
| H-1 VoiceClient warning | High | commit a1b2c3d | ✓ |
| M-1 Raw grey divider | Medium | — | ⏳ deferred |

**Summary of this session's fixes**: 2 Critical + 1 High fixed and verified. 4 deferred to next sprint.

## Killer-flow tests recommended

After this audit, write these Playwright tests to prevent regression:

1. `spaces: send clears input within 1s` — covers send-button-doesn't-clear regressions
2. `spaces: thread keeps timeline width ≥ 200px at 1024-1280` — covers C-1 class
3. `chat: console emits no warnings on mount` — covers H-1 class
4. `spaces: @-mention does not duplicate` — covers any picker-double-insert
5. `auth: error toast appears on settings save 5xx` — covers C-2 class

See [playwright-killer-flows.md](playwright-killer-flows.md) for starter test code.
```

## Guidelines

- **Verdict block goes at the top.** First thing the reader sees. No exceptions.
- **Hard gates can't be downgraded.** A console warning is High minimum. A 5xx is Critical automatically.
- **Every finding cites proof.** Screenshot path + console line / DOM selector / network response. No proof = rejected.
- **Reproduction steps are mandatory.** A finding without "1. Sign in 2. Click X 3. Observe Y" is rejected.
- **Suspected location** must be `file:line` not "the chat module somewhere".
- **Coverage publishes ratios.** Inventoried ÷ tested. Readers can see what wasn't tested.
- **Roadmap groups by effort + impact.** Not one ranked list — three buckets.
- **What Works Well matters.** Prevents the report reading as pure criticism. Preserves good patterns.
- **Append as you go.** Don't try to remember findings to write them at the end.

## Severity definitions (sharper)

- **Critical** — User CANNOT complete a primary task. OR data loss. OR security exposure. OR Network 5xx that the user doesn't see. OR optimistic UI commits and silently fails to roll back.
- **High** — User gets confused or takes the wrong path. OR console error / warning during walkthrough. OR layout collapse at any tested viewport. OR network 403/404 on authenticated pages. OR placeholder-as-label. OR loading state that never ends.
- **Medium** — Friction; user succeeds with extra effort. OR weak hover delta. OR inconsistent border radii / icon families. OR pattern-level token violations.
- **Low** — Polish. 1-2px alignment. Single-instance off-scale spacing. Letter-spacing on uppercase missing.

A console error or layout collapse is automatically High *minimum*. The category "Medium console warning" does not exist in this skill.
