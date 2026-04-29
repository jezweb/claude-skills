# Interaction Manifest

The Interaction Manifest is the proof that the walkthrough actually walked. Without it, the audit cannot produce a verdict — the only legal output is **Incomplete**.

This file specifies what counts as a complete manifest, the template, the replay protocol when a manifest entry doesn't match expected behaviour, and worked examples.

## Why this exists

The previous version of ux-audit had a "Walkthrough" mode but didn't enforce it. In practice, agents drifted to sweep mode — query the DOM, read text, move on — because it's faster and feels productive. That mode is blind to behavioural bugs by definition.

The 2026-04-29 vite-flare-starter audit failure proved the cost: six catastrophic bugs went live (Send button doesn't clear input, @-mention doubles the handle, vertical-text-stacking in spaces, etc.) while the audit said "no Critical issues". Every one of those bugs only surfaces under interaction.

The manifest closes that gap. It's a non-negotiable proof requirement. Skipping it means the audit terminates with `Incomplete`.

## What counts as "complete"

A manifest is complete when, for every page audited, all six required entry types are logged with proof:

| Required entry | What it looks like | Proof artefact |
|---|---|---|
| **Type into ≥ 1 input** | Real text, not just clicked | `textarea.value` after typing, screenshot |
| **Trigger ≥ 1 primary action** | Send / Save / Submit / Create / Publish | Network request fired, screenshot before + after |
| **Open ≥ 1 modal or detail pane** | Click a row, open a thread, open a settings panel | Screenshot of opened state |
| **Console read after primary action** | `read_console_messages` call | Output captured (0 warnings or list of warnings) |
| **Screenshot before AND after primary action** | Two screenshots, ideally same viewport | Files written, paths logged |
| **Verify expected post-action state** | Input cleared, success toast, route change, list updated | Assertion logged with selector + expected value |

Six types per page, one row per check. Multi-pane stress adds more entries; scenarios add more entries. The minimum is six per audited route.

## Manifest template

```
INTERACTION MANIFEST — /dashboard/spaces/marketing-pod
  Persona: SME owner, time-pressed, low tech comfort
  Viewport: 1280×800 (desktop default for this persona)
  Panes open: sidebar, members, thread

  [✓] 14:32:01  TYPE     Typed "@assistant test" into message input
                         Selector: textarea[placeholder*="message"]
                         Result: textarea.value === "@assistant test"

  [✓] 14:32:03  PICK     Picked @assistant from autocomplete
                         Selector: li[data-mention-id="assistant"]
                         Screenshot: .jez/audit-evidence/spaces-after-pick.png

  [✓] 14:32:05  SUBMIT   Clicked Send
                         Selector: button[aria-label="Send"]
                         Screenshot before: .jez/audit-evidence/spaces-before-send.png
                         Screenshot after: .jez/audit-evidence/spaces-after-send.png
                         Network: POST /api/messages → 200 (87ms)

  [✓] 14:32:06  ASSERT   Verified input cleared within 1000ms
                         Assertion: textarea.value === ""
                         Result: PASSED (cleared in 142ms)

  [✓] 14:32:08  ASSERT   Verified message appeared in transcript
                         Assertion: [data-message-id] count increased by 1
                         Result: PASSED (count: 12 → 13)

  [✓] 14:32:12  OPEN     Opened thread on the new message
                         Selector: [data-message-id="msg-13"] [data-thread-trigger]
                         Screenshot: .jez/audit-evidence/spaces-thread-open.png

  [✓] 14:32:13  ASSERT   Verified main column width ≥ 200px after thread open
                         Assertion: main.getBoundingClientRect().width >= 200
                         Result: FAILED (width: 184px) ← FINDING H-2

  [✓] 14:32:14  CONSOLE  Read after thread open
                         Errors: 0
                         Warnings: 1 ← FINDING H-1
                         Warning: "VoiceClient: protocol mismatch (1.2 vs 1.4)"

  [✓] Network requests inventoried for the page session
        5xx: 0     403/404 (auth pages): 0     Total: 8

  ─────────────────────────────────────────────────────────────────
  Required entries: 6 / 6 ✓
  Findings produced from this manifest: 2 (H-1 console, H-2 layout)
```

## Required entry types in detail

### TYPE
- Real text into an input. Not just a click on the input.
- For password fields, type a fake password (something like `audit-test-123!`).
- For email fields, type a valid-format fake address.
- For search inputs, type something likely to match (or `zzzzz` to trigger empty state).
- Verify the input received the text (`getByRole('textbox').toHaveValue(...)`).

### PICK
- Optional but common: dropdown selection, autocomplete pick, file upload, date picker, mention picker.
- Required if the page has any picker/combobox/autocomplete that's part of the primary flow.
- Verify the picked value is reflected in the form / display.

### SUBMIT
- The primary action: Send, Save, Submit, Create, Publish, Pay, Share, Send invitation.
- Click it. Watch the network, watch the DOM.
- Capture screenshot before AND after.
- Capture the network request: URL, method, status code, latency.

### OPEN
- Click into a row, open a modal, open a detail pane, open a thread, open a settings panel.
- Captures the "what happens after this lands" view.
- Required because most layout / pane interaction bugs are only visible after opening.

### ASSERT
- Each ASSERT is a yes/no check on observed state.
- Common assertions:
  - Input cleared after submit
  - Success toast appeared (`.toast`, `[role="status"]`, etc.)
  - Route changed (URL pathname check)
  - List item count increased / decreased
  - Loading spinner appeared during action
  - Loading spinner disappeared after action
  - Error toast appeared on invalid input
  - Pane width ≥ minimum (200px is a common floor)
- Failed assertions become findings.

### CONSOLE
- After every SUBMIT (and ideally every state change), read the console.
- Tool: `mcp__claude-in-chrome__read_console_messages` or Playwright `page.on('console', ...)`.
- Any warning or error becomes a finding (Hard Gate).

### NETWORK
- Inventory at the end of each page session.
- Status code distribution: 2xx, 3xx, 4xx, 5xx counts.
- Any 5xx = Critical. Any 403/404 on an authenticated page = High.

## Replay protocol — what to do when an assertion fails

When an ASSERT fails, the finding workflow:

1. **Don't move on.** That's a behavioural bug surfacing right now.
2. **Capture the failure state**: screenshot, DOM at the failure point, network log, console.
3. **Repeat the action** — does the bug reproduce? If yes, it's stable. If no, capture the variation.
4. **Vary one input**: type different text, click in different order, change viewport. Does the bug always happen, or only with specific input?
5. **Check the underlying code** if accessible — `Read` the relevant file, identify the suspected location.
6. **Write the finding** with full reproduction steps, evidence path, suspected location, suggested fix.
7. **Continue the manifest** with the rest of the required entries — don't skip them just because one failed.

A page can have multiple findings; the manifest captures all of them in order.

## Example manifest entries for common page types

### List page (clients, projects, messages)
- TYPE into search
- ASSERT search filters the list
- OPEN one item (click row)
- ASSERT detail pane / detail page loaded
- CONSOLE read

### Form page (settings, create new X)
- TYPE into every required field with realistic data
- TYPE into one optional field
- PICK any required dropdown
- SUBMIT (Save / Create)
- ASSERT success toast OR error toast appeared
- ASSERT route changed (or stayed, depending on intent)
- CONSOLE read

### Conversation / thread page
- TYPE a message
- SUBMIT (Send)
- ASSERT input cleared
- ASSERT message appeared in transcript
- OPEN thread on message
- ASSERT thread pane opened, main column width ≥ 200px (multi-pane stress!)
- CONSOLE read

### Dashboard (multi-widget)
- For each widget: read content, screenshot, OPEN any drill-down
- TYPE into any inline filter / search
- CONSOLE read after each interaction (dashboards are notorious for racy data fetches)

## Interaction Manifest as a coverage metric

At the end of the audit, publish:

```
INTERACTION COVERAGE
  Pages audited: 14
  Required entries logged: 84 / 84
  Pages with complete manifest: 14 / 14
  Pages with incomplete manifest: 0
```

If any page has < 6 required entries, that page is `Incomplete` and the overall verdict is `Incomplete` — even if every observed interaction passed.

## Anti-patterns

Things that look like manifest entries but aren't:

- "Read the page text" — not an interaction. Doesn't count.
- "Hovered over the menu" — counts as a state change but doesn't satisfy SUBMIT requirement.
- "Clicked the menu open" — only counts if the menu IS the primary action; otherwise it's an OPEN.
- "Took a screenshot" — supporting evidence, not an entry on its own.
- "Read the source code" — useful for finding suspected location but doesn't replace interaction.

If your manifest is full of `READ`, `INSPECT`, `QUERY`, you've drifted to sweep mode. Stop, restart with TYPE.

## How this maps to the verdict

| Manifest state | Allowed verdicts |
|----------------|------------------|
| Complete (≥ 6 entries per page, all phases run) | Pass / Conditional Pass / Fail |
| Incomplete on any page | Incomplete (cannot upgrade to Pass) |
| Console hard gate breached | Fail (cannot be Pass / Conditional) |
| Network 5xx hard gate breached | Fail (Critical) |

Hard gates auto-fail. Incomplete manifest auto-blocks Pass. Together they make "audit said clean while bugs were live" structurally difficult.
