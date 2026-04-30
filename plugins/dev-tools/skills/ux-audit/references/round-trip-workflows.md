# Round-Trip Workflow Integrity

## Why this exists

Code reviews catch the *outbound* leg of a workflow — "click X on page A, navigate to page B, complete action". They miss the *return* leg — "go back to page A, did the new state appear?"

The bug pattern: a mutation on page B creates/changes data tied to a parent context A, but B's mutation only invalidates B's own query. A's cached state is stale on return. The user sees an empty list, thinks the action failed, retries, creates a duplicate (or worse — gives up and assumes the system is broken).

Static analysis can't catch this — it's a TanStack Query / SWR / Apollo cache-invalidation gap that only surfaces under interaction.

## The smoking-gun example (2026-04-30, vite-flare-starter)

```
1. Open project /dashboard/projects/X — empty conversation list
2. Type prompt + click "Start chat" — navigates to /dashboard/chat?projectId=X
3. Conversation creates, agent replies — works fine on the chat side
4. Click "Back to project" → /dashboard/projects/X
5. Conversation list STILL shows empty state
6. Hard reload → conversation appears
```

Server side was fine. Conversation persisted. But the project-detail TanStack query (`['projects', id]`) didn't refetch because the chat page only invalidated `['conversations']`.

User-facing symptom: "I'm not sure how I get back, the project is just empty if I go back, maybe I can stay in the project when I'm working in a project?" — three problems stacking (weak breadcrumb, sidebar disorientation, stale cache) that all compound the perception of a broken workflow.

## The protocol — required during Phase 3 walkthrough

For every workflow that traverses pages (A → B → A pattern), exercise the full round-trip:

```
1. Open page A. Capture: state, count of items, latest timestamp, current URL.
2. Trigger an action on A that navigates to B (a button, a link, a form-submit).
3. Complete a mutation on B (send a message, create a thing, approve an item).
4. Navigate back to A. Use the discoverable back affordance (breadcrumb,
   browser back, sidebar item) — NOT a hard reload.
5. Verify A's state reflects the new data:
   - Item count incremented?
   - New row visible?
   - Latest timestamp updated?
   - Unread badge updated?
6. ALSO verify the back affordance was discoverable:
   - Visible without hover at first paint
   - Labelled clearly ("Back to {parent}", not just "←")
   - Sized like a control, not decoration
   - Sidebar still highlights the parent context (or has a sub-state)
```

If A is stale or the back affordance is hidden, log a finding.

## Where this lives in the audit

This is **mandatory** for every multi-page workflow. The Interaction Manifest must include a round-trip entry for every cross-page mutation observed. Without it, the verdict is `Incomplete`.

```
ROUND-TRIP MANIFEST — project → chat → project
  [✓] 14:32:01 Open /dashboard/projects/X — capture: 0 conversations
  [✓] 14:32:05 Type prompt "Quote a bathroom reno" + click Start chat
  [✓] 14:32:06 Navigated to /dashboard/chat?projectId=X
  [✓] 14:32:08 Verify breadcrumb visible at first paint:
                "← Quoting / New chat" — yes, ~14em wide, font-medium
  [✓] 14:32:10 Wait for AI reply (Workers AI Kimi K2.6) — completed
  [✓] 14:32:14 Click breadcrumb back-link → /dashboard/projects/X
  [✓] 14:32:15 Verify conversation appears WITHOUT reload:
                expected 1 conversation, got 1 ("Quote a bathroom reno · just now")
  [✓] 14:32:15 Verify sidebar highlight:
                Projects highlighted (not "AI Chat"), no flicker
```

## Surface inventory — every round-trip in the app

Build this list during Phase 2 (Discovery). Each entry is a candidate for the Phase 3 round-trip protocol.

Examples for vite-flare-starter:

| Outbound (A → B) | Mutation on B | Inbound (B → A) | What A must reflect |
|---|---|---|---|
| Project page → Start chat | Conversation created with projectId | Breadcrumb back | New conversation in project's list |
| Spaces list → enter space → send message | Message persisted | Browser back | Last-message timestamp updated |
| Inbox → click finding (opens chat) | Finding marked read | Browser back | Unread count decreases on bell |
| Approvals → approve | Approval status → decided | Sidebar Approvals | Item gone from "Pending" tab |
| Approvals page approve | Approval status → decided | Sidebar Inbox | Item also gone from Inbox unified view |
| Inbox bulk-approve | Approval(s) status → decided | Header bell | Unread count decreases |
| Skills → save edit (with diff approval) | Skill body updated | Skills list page | Updated body shows on next select |
| Connections → connect Google | OAuth + connection persisted | Browser back to /connections | New connection appears in list |
| Routines /new → submit | Routine created | Sidebar Routines | New routine appears in list |
| Settings → API tokens → create | Token created | Same page | List updates without reload |

If any of these is NOT exercised in Phase 3, the audit is `Incomplete` for that surface.

## Detection heuristics

When you can't manually walk every workflow, these heuristics surface candidates fast:

### Heuristic 1 — Cross-key invalidation

Grep the codebase for `useMutation` and check what it invalidates. If the mutation can affect data shown on a *different* page that uses a *different* query key, the mutation MUST invalidate both.

```bash
# Find every mutation
grep -rn 'useMutation' src/client/modules/*/hooks/*.ts

# For each, check invalidations
grep -A 10 'useMutation' src/client/modules/X/hooks/Y.ts | grep invalidateQueries
```

For each mutation, ask:
- "What query keys consume the data this mutation affects?"
- "Are ALL of those keys invalidated?"

The classic miss: mutation invalidates `['inbox']` only, but the same data also appears under `['notifications']` (unread count) and `['approvals']` (approvals tab) — invalidating one leaves the others stale.

### Heuristic 2 — Header badges that depend on list state

Audit every UI badge / unread-count / pip indicator at the top of the layout. Each one is consumer of a query that ANY mutation across the app might invalidate.

Common badges that drift:
- Notification bell unread count
- Inbox unread tab count
- Approvals pending count
- Sidebar item dot ("you have something here")

For each badge, list every mutation that should affect it. Verify each mutation invalidates the badge's query key.

### Heuristic 3 — Breadcrumb size + placement

For every page reachable from a parent, the back-to-parent affordance must satisfy:

- Visible without hover at first paint (not opacity-0 or in an overflow menu)
- Labelled with the parent's name (not generic "Back")
- Sized like a primary control, not decoration
- In a consistent location across pages (top-left or in a breadcrumb row)
- Click target ≥ 32×32px (touch-friendly)

If the back affordance is a small pill near the page title, that's a smell — users don't read pills as wayfinding. Use breadcrumb-style links: `[← Parent name] / Current page`.

### Heuristic 4 — Sidebar context disorientation

When a workflow navigates from page A (sidebar item X highlighted) to page B (sidebar item Y highlighted), but A's context is still active (the user IS still working in X conceptually):

- Sidebar should ideally keep X highlighted (showing the parent context)
- OR the chrome should clearly show the parent context as a breadcrumb / pill / header strip
- WITHOUT one of those, the user feels like they switched apps

This is the single biggest source of "I'm not sure how I got there" UX feedback.

## Findings — how to log

A round-trip finding has two halves:

```
ID: H-N
Layer: Interaction
Severity: High
Surface: /dashboard/projects/:id (round-trip from /dashboard/chat)
Persona: SME owner

Reproduce:
  1. Open project /dashboard/projects/X
  2. Type a prompt, click Start chat
  3. Wait for AI reply
  4. Click "Back to project" breadcrumb (or browser back)

Observed: Project page shows empty conversations list — "Start a chat to keep
conversations organised and re-use project knowledge." User sees no evidence
the chat just happened.

Expected: Project page shows the new conversation as a row with title +
timestamp ("just now").

Reload-confirms-server-fine: hitting Cmd+R on the project page reveals
the conversation. Server-side persistence is fine. The bug is client-cache.

Evidence: .jez/audit-evidence/2026-04-30/01-project-stale.png
Suspected location: src/client/modules/chat/pages/ChatPage.tsx — the
useChat completion effect invalidates ['conversations'] but not
['projects', urlProjectId].
Suggested fix: when conversationId becomes set + urlProjectId is non-null,
invalidate ['projects', urlProjectId] alongside ['conversations'].
```

Keep severity `High` for round-trip cache misses — they look like data loss to the user.

## Companion checks

After fixing one round-trip bug, sweep for the same pattern across the codebase:

```bash
# Find every mutation that touches a child resource of a parent
grep -rn 'invalidateQueries' src/client/modules/ | grep -v 'queryKey:.*\[\(parent_key\)\]'
```

Then for each mutation that touches a relationship (e.g. conversation has projectId, finding has agentRunId, approval has conversationId, skill has agent), verify ALL parent query keys are invalidated.

## Anti-patterns

- **"Reload always works"** is not a fix. Users don't reload by reflex; they assume the system is broken.
- **`refetchOnWindowFocus: true` as a panacea** — relies on the user actually leaving the tab and coming back. Doesn't help when they navigate within the SPA.
- **Showing a stale list with a manual "Refresh" button** — the user has to know to click it. Better to invalidate on the mutation.
- **Polling intervals "every 30s"** — masks the bug, doesn't fix it. Wastes bandwidth + battery.

## Related skill rules

- `rules/api-client-alignment.md` — server-side returns the data correctly; the client just doesn't ask again.
- `rules/react-vite.md` — TanStack Query patterns + key alignment.
- `rules/think-in-contracts-not-code.md` — the right contract is "every mutation declares which parent query keys it affects". Implementations like `inbox-keys.ts` / `query-keys/index.ts` reduce drift by centralising the relationships.

**Last Updated**: 2026-04-30
