# Extended Stress Test Recipes

Beyond the 9 scenarios in [scenario-tests.md](scenario-tests.md), these recipes catch the failure modes that scenarios miss. Each recipe has a how-to, what-it-catches, and severity guide.

Run all relevant recipes during Phase 5 of the audit. Skip recipes that genuinely don't apply (no print stylesheet on a chat app).

## 1. Race conditions

### Double-click submit

**How**: Click any Send / Save / Submit button twice in rapid succession (< 200ms apart).

**What it catches**:
- Duplicate creation (two records, two messages, two payments)
- Optimistic UI desync (one click goes through optimistically, second click finds the optimistic state and acts on it)
- Disabled-state race (button disables but second click already queued)

**Severity if it produces duplicates**: **Critical**.

### Fast-type then immediate blur

**How**: Type into an input, then `Tab` or click outside without waiting for autocomplete / validation.

**What it catches**:
- Validation that runs after blur but the form already submitted via Enter
- Autocomplete that completes after blur, leaving stale value
- onChange handlers firing after onSubmit

### Rapid navigation

**How**: Click a list item, then before it loads, click a different list item.

**What it catches**:
- Stale data shown (old item's data leaks into new item's view)
- Cancelled-fetch handling (TanStack Query / SWR — abort missed)
- Loading spinner stuck

## 2. Slow network (3G throttle)

**How**: Browser DevTools → Network → Slow 3G (or set request throttling to 100kbps download / 400ms latency).

**What it catches**:
- Loading states that disappear after 200ms (real users see them)
- Skeleton screens never showing (data arrives too fast in dev)
- Timeouts (button-disable for 60s with no progress hint)
- Retry UX (does it auto-retry? Should it?)
- Optimistic UI (does it work when the server takes 5s to confirm?)

**Severity guide**: missing skeleton on a list view that takes > 1s = High. Stuck spinner with no escape > 5s = Critical.

## 3. Reduced motion

**How**: Browser DevTools → Rendering → Emulate CSS media `(prefers-reduced-motion: reduce)` → matches.

**What it catches**:
- Animations that ignore the preference (still slide, still fade)
- Spring physics on scroll (causes motion sickness for users who set the pref)
- Auto-playing videos

**Severity if any animation runs when reduced**: High (accessibility violation).

## 4. i18n stress

### Long German nouns

**How**: Inspect the longest copy on each page and replace with a synthetic 50+ character string. Or, if i18n exists, switch to `de`.

**What it catches**:
- Truncation without tooltip (`overflow: hidden` cuts off important info)
- Wrap into 4+ lines breaking layout
- Buttons that grow beyond their parent container

### RTL Arabic

**How**: Set `dir="rtl"` on `<html>` (or switch to `ar` / `he` if i18n exists).

**What it catches**:
- Icons that should mirror but don't (chevron-right pointing wrong way)
- Layouts assuming left-to-right (sidebar on wrong side)
- Padding-left vs margin-inline-start drift

### CJK character widths

**How**: Replace copy with CJK strings (Chinese / Japanese / Korean) for the longest fields.

**What it catches**:
- Line-height insufficient for character ascenders
- Font-family fallback ugly in CJK
- Text rendering as squares (missing font subset)

## 5. Empty / saturated states

### Empty
- Lists with 0 items
- Conversations with 0 messages
- Projects with 0 files / tasks
- Search with 0 results
- New user with 0 history

### Saturated
- Lists with 1000+ items (pagination, virtualisation, performance)
- Conversation with 200+ messages (scroll-to-bottom, performance)
- Project with 50+ tagged categories (filter UX)

### Long content edges
- Single field with 100+ characters (overflow, tooltip, truncate)
- Single field with 5000-word paste (textarea behaviour, save semantics)
- Filename with special characters (`O'Brien.pdf`, `café.csv`, emoji, `<script>` injection check)

## 6. Offline mode

**How**: Browser DevTools → Network → Offline. Then perform an action.

**What it catches**:
- Silent failures (no error shown)
- Optimistic UI without rollback
- Queue / retry UX (Tauri / Notion / Linear show "queued" — does this app?)
- Lost work on subsequent reload

**Severity if data is lost silently**: Critical.

## 7. Print stylesheet

**How**: Browser DevTools → Rendering → Emulate CSS media → `print`. OR `Ctrl+P` to open the print preview.

**What it catches**:
- Invisible content (white text on white background after print rules apply)
- Sidebar / nav still showing (should typically be hidden)
- Page breaks landing mid-content
- Print-specific layout never tested

**Severity if no print rules and printing is plausible**: Medium (e.g. invoices, reports).

## 8. High-contrast / forced-colors mode

**How**: Browser DevTools → Rendering → Emulate CSS media → `forced-colors: active`. OR Windows High Contrast.

**What it catches**:
- Elements that disappear (background-only highlights without borders)
- Icons rendering as squares
- Focus rings invisible in forced colours
- Form inputs unstyleable

**Severity**: High accessibility violation.

## 9. Keyboard-only

**How**: Unplug the mouse. Walk the entire app with Tab / Shift+Tab / Enter / Space / Arrow keys / Escape.

**What it catches**:
- Focus traps in modals (can't Tab out)
- Hidden focus states (can't see where you are)
- Skipped focusable elements
- Custom dropdowns that don't respond to arrow keys
- Drag-and-drop with no keyboard alternative
- Modals that don't return focus to trigger on close

**Coverage check**: every interactive element must be reachable via Tab and operable via Enter / Space / Arrow.

## 10. Screen reader test (NVDA / VoiceOver)

**How**: Mac: VoiceOver (Cmd+F5). Windows: NVDA (free download).

**What it catches**:
- Unlabeled buttons ("Click here" landmarks, icons without aria-label)
- Decorative images announced
- Form fields with no associated label
- Dynamic content that doesn't announce changes (`aria-live`)
- Headings out of order (h1 → h3 skipping h2)

**Severity**: Major accessibility violation. Often Critical for compliance-required apps.

## 11. Long-press / right-click variations

**How**: Right-click on every interactive element. Long-press (touch device emulation).

**What it catches**:
- Context menus not implemented where they should be
- Default browser context menu showing on a custom widget
- Long-press selecting text on a card meant to be tappable
- Drag handles activating a context menu

## 12. Browser-back during in-flight action

**How**: Click Submit, then immediately click browser back before the action completes.

**What it catches**:
- Server still processes the action; user lands on previous screen with no idea
- Optimistic UI rolled back but server confirmed (state inconsistency)
- Navigation guards not present on dirty forms

**Severity**: High if data is created server-side without user confirmation.

## 13. Tab-restore (browser crash sim)

**How**: Close the browser tab mid-task. Reopen. Use browser's "Reopen Closed Tab" or navigate to the URL.

**What it catches**:
- Drafts not saved (autosave gap)
- "Continue where you left off" missing
- Local storage cleared on tab close
- Session lost (re-login required for an authenticated state)

## 14. Multiple-tab consistency

**How**: Open the app in two tabs side by side. Modify a record in tab A. Switch to tab B. Modify the same record.

**What it catches**:
- Stale state in tab B (no sync)
- Conflict resolution UX (last-write-wins silently)
- Real-time updates (or absence)
- Auth state divergence (logout in A, B doesn't notice)

## 15. Stale localStorage / IndexedDB

**How**: Modify a known localStorage / IndexedDB key to an old version's format. Reload.

**What it catches**:
- App crashes on schema mismatch
- Silent reset of user state
- Missing migration logic

**Especially relevant for**: apps that have been deployed for > 6 months with persistent client-state.

## Severity reference

A stress test produces findings whose severity follows these defaults:

| Recipe failure | Default severity |
|---|---|
| Double-click produces duplicates | Critical |
| Slow-network shows no skeleton | High |
| Reduced-motion ignored | High |
| Long German breaks layout | High |
| RTL mirroring missing on icons | Medium |
| Offline silently loses data | Critical |
| Print stylesheet absent (where plausible) | Medium |
| Forced-colors elements disappear | High |
| Focus trap in modal | Critical |
| Screen reader: unlabeled primary action | Critical |
| Tab-restore loses draft | High |
| Multi-tab: stale state | Medium |

Promote findings with stacked failures (e.g. slow-network AND no skeleton AND no progress text → Critical).

## When to skip a recipe

Skip recipes that don't apply:
- Print stylesheet on a chat app — skip
- RTL on an English-only app — skip but note that future i18n will need it
- Offline mode on a tool that legitimately requires connectivity — note the connection requirement instead

Don't skip recipes that *should* apply but the team hasn't implemented yet — those produce findings.

## Coverage publication

At the end of the stress phase, publish:

```
STRESS COVERAGE
  Recipes run: 13 / 15
  Skipped: 2 (RTL — no i18n yet; Print — chat-only app)
  Findings produced: 7 (1 Critical, 3 High, 2 Medium, 1 Low)
```

Coverage transparency lets the next agent know what wasn't tested.
