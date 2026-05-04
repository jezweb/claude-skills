# Scenario Tests

Eleven structured tests that go beyond page-by-page evaluation. Each simulates a real-world situation that exposes problems traditional QA misses. Run all eleven during an exhaustive audit (skip only ones that genuinely don't apply — e.g. Data Seasoning on a one-shot calculator).

---

## 1. First Contact

**Premise**: You just started this job. Nobody has shown you the app. Figure it out — then prove you understand it by writing a 2-minute plain-English guide a colleague could follow.

**How to run**:

1. Navigate to the app's entry point (login page or dashboard).
2. Do NOT read any CLAUDE.md, README, or source code. No insider knowledge.
3. Try to answer these questions purely from using the app:
   - What is this app for?
   - What are the main things I can do?
   - Where do I start?
   - How do I do the most common task?
4. For each of the main threads, write a short plain-English guide:
   ```
   "To [accomplish task], go to [section], click [button], fill in [fields],
    then click [action]. You'll see [confirmation]. The [thing] will appear
    in [location]."
   ```
5. Evaluate what you just wrote.

**What to report**:
- **Time to first value**: How many clicks/pages before you accomplished something real?
- **Self-explanatory score**: Could you figure out the app without help? (1–5 scale)
- **Missing onboarding**: Is there a welcome screen, guided tour, or empty-state guidance? Or just a blank dashboard?
- **Terminology barriers**: Any labels or section names you didn't understand?
- **Dead ends**: Places where you got stuck with no indication of what to do next?
- **Threads that were easy to explain**: These are well-designed workflows — preserve them.
- **Threads that required caveats**: "But first you need to..." or "Make sure you don't..." signals friction.
- **Threads you couldn't explain**: Where you had to say "then you kind of need to figure out..." — that's a comprehension failure.
- **Jargon you had to translate**: Words in the app that you replaced with plain language in your explanation.
- **Steps you had to invent**: Things the app doesn't guide you through.

**Output**: Include the actual written explanations in the report. They double as draft user documentation — and the gaps map directly to UX improvements.

**Severity guide**: If a new user can't figure out the primary task within 5 minutes of clicking around, that's **High**. If a thread can't be explained in under 5 steps without caveats, that's **Medium**. If a thread can't be explained at all, **High**.

---

## 2. Interrupted Workflow

**Premise**: Real users don't work in uninterrupted sessions. They start something, get a phone call, close the laptop, come back hours later.

**How to run**:
1. Start a multi-step task (creating a record, filling a long form, configuring settings).
2. Get halfway through — don't finish.
3. Simulate interruption:
   - Navigate away to a completely different section
   - Close the tab and reopen the app from the URL bar
   - Refresh the page mid-form
   - Open a different page in the same tab, then hit back
4. Try to resume the task.

**What to report**:

| Interruption | Data preserved? | Could resume? | Notes |
|-------------|----------------|---------------|-------|
| Navigate away mid-form | Y/N | Y/N | |
| Close tab + reopen | Y/N | Y/N | |
| Page refresh | Y/N | Y/N | |
| Back button | Y/N | Y/N | |

Also check:
- **Draft/autosave**: Does the app save partial work? Is there a "drafts" or "recent" section?
- **Return navigation**: Is there a "continue where you left off" or "recently viewed" feature?
- **Warning on abandon**: Does it warn before losing unsaved work?
- **Session persistence**: After reopening, are you still logged in? Does the app remember your last location?

**Severity guide**: Losing form data silently is **Critical**. No way to find where you left off is **High**. No warning when abandoning work is **High**.

---

## 3. Wrong Turn Recovery

**Premise**: Users click the wrong thing constantly. How forgiving is the app?

**How to run**:
1. For each main section, deliberately go to the wrong place:
   - Click Policies when you meant Clients
   - Open the wrong record from a list
   - Start creating the wrong type of item
   - Apply wrong filters to a list
2. Try to recover — get back to what you actually wanted to do.

**What to report**:

| Wrong turn | Recovery method | Steps to recover | Context lost? |
|-----------|----------------|-----------------|---------------|
| Wrong nav section | back/nav click/breadcrumb | [count] | Y/N — what was lost |
| Wrong record opened | back to list/browser back | [count] | filters lost? scroll position? |
| Wrong form started | cancel/back/close | [count] | any data lost from previous work? |
| Wrong filter applied | clear/reset/undo | [count] | other filters preserved? |

Also evaluate:
- **Cancel safety**: Does cancelling a form always work without side effects?
- **Undo availability**: Can you undo any action? Which ones are irreversible?
- **Navigation memory**: When you go back to a list, are filters/sort/scroll preserved?
- **Confirmation dialogs**: Do destructive actions have confirmations? Are they clear about what will happen?

**Severity guide**: Losing work because of a wrong turn is **Critical**. More than 3 clicks to recover from a wrong nav click is **High**. Lost filter state is **Medium**.

---

## 4. Returning User

**Premise**: Day one is about discovery. Day two is about efficiency. The user is back — is the app faster this time? Can they see what needs attention?

**How to run**:

*Part A — efficiency*

1. After completing the full walkthrough (you've used the app extensively), repeat the main workflow threads from the beginning.
2. Measure the difference:
   - Is it faster the second time?
   - Are there shortcuts you can now use?
   - Does the app remember your preferences?
   - Can you skip steps that were necessary the first time?

*Part B — what changed*

3. Now look at the dashboard or landing page after the walkthrough has created/modified data.
4. Try to answer: what happened since the last time I was here?
5. Check for these signals:

| Signal | Present? | Useful? |
|--------|----------|---------|
| Activity feed / recent activity | Y/N | Helpful / Noise / Missing |
| Notification badges/counts | Y/N | Accurate / Stale / Missing |
| "New since last visit" indicators | Y/N | |
| Modified/updated timestamps | Y/N | Visible or buried? |
| Assigned-to-me / needs-attention view | Y/N | |

**What to report**:

| Thread | First time (clicks) | Second time (clicks) | Improvement | Shortcuts found |
|--------|-------------------|---------------------|-------------|-----------------|
| [Thread 1] | [count] | [count] | faster/same/slower | [list] |

Plus:
- **Recent items**: Does the app surface recently viewed/edited items?
- **Defaults**: Does it remember last choices (filters, sort order, selected view)?
- **Keyboard shortcuts**: Are there any? Are they discoverable?
- **Bulk operations**: For repeat tasks, can you do them in batch?
- **Search**: Can you jump directly instead of navigating?
- **Bookmarkable deep links**: Can you save links to specific records/views?
- **Awareness score**: On a 1–5 scale, how quickly could a returning user understand what needs attention?
- **Notification quality**: Do notifications tell you what to do, or just that something happened?
- **Staleness risk**: Could a user miss something important because there's no alert or indicator?
- **Team awareness**: In a multi-user app, can you see what colleagues did?

**Power user friction** — things that are fine on day one but maddening on day 100:
- Confirmation dialogs you can't skip ("Are you sure?" for routine operations)
- Mandatory fields that are always the same value
- No way to duplicate a record (have to re-enter everything)
- Pagination that resets when you navigate back

**Severity guide**: No improvement between first and second use is **High** — the app doesn't learn from the user. Missing search on a data-heavy app is **High**. No way to tell what changed since last visit on a team app is **High**. Dashboard showing static content instead of actionable status is **Medium**.

---

## 5. Keyboard Only

**Premise**: Unplug the mouse. A power user, an accessibility user, or anyone on a long flight with a dead trackpad — can they still use the app?

**How to run**:
1. Do not touch the mouse/trackpad. At all. Don't use it to scroll, don't hover. Pure keyboard.
2. Attempt each main thread end to end using only:
   - `Tab` / `Shift+Tab` — focus navigation
   - `Enter` / `Space` — activate
   - Arrow keys — menus, selects, lists
   - `Escape` — close dialogs
   - Any documented app-specific shortcuts
3. For each thread, note whether it can be completed and what breaks.

**What to report**:

| Thread | Completable? | Blockers |
|--------|--------------|----------|
| [Thread 1] | Y/N/Partially | [what stopped you] |

Also evaluate:
- **Focus visibility**: Is the focused element always clearly visible? Or is the focus ring invisible, or clipped, or missing entirely?
- **Tab order**: Is it logical (top-to-bottom, left-to-right, or matches visual grouping)? Or does it jump around?
- **Focus traps**: Do modals trap focus correctly? Does Escape close them?
- **Skip links**: Is there a "skip to main content" for keyboard users bypassing nav?
- **Click-only elements**: Are there buttons or controls that only respond to mouse click, not keyboard?
- **Custom components**: Custom dropdowns, date pickers, drag-and-drop — do they have keyboard equivalents?
- **Shortcut discovery**: Is there a `?` shortcut sheet? Or are shortcuts undocumented?
- **Shortcut conflicts**: Do app shortcuts conflict with browser defaults (Cmd+K, Cmd+S, etc.)?

**Severity guide**: Any thread that can't complete keyboard-only is **High** (higher if accessibility is a stated requirement). Missing focus indicators is **High**. Focus traps that don't release on Escape is **High**. No keyboard equivalent for a common action (drag-to-reorder, etc.) is **Medium**.

---

## 6. Heavy Data

**Premise**: The app works fine with 5 demo records. Real users have hundreds or thousands. Does it still work?

**How to run**:
1. If you can seed the database with 500+ records, do it. If not, use the heaviest real account available.
2. For each list/table view:
   - Does it load in under 2 seconds?
   - Does it virtualise or render all rows?
   - Does scrolling stay smooth (60fps feel) or does it jank?
   - Does the page memory balloon?
3. Test search:
   - Search for something that matches 1 result — found quickly?
   - Search for something that matches 100 results — is the result set useful?
   - Search for something that matches 0 results — is the empty state helpful?
   - Search with typos — is there fuzzy matching or did it fail silently?
4. Test filters:
   - Apply a filter that matches many records — does the count update? Does the URL reflect the filter?
   - Apply a filter that matches nothing — helpful empty state?
   - Apply multiple filters — are they combined (AND) intuitively? Can you see which are active?
5. Test pagination:
   - Navigate to page 50 directly (if page-jumping is supported)
   - Change items-per-page — does the selection persist?
   - Deep link to page 50 — does it load directly, or redirect to page 1?

**What to report**:

| Area | At 500 records | At 1000+ records |
|------|----------------|------------------|
| List load time | [sec] | [sec] |
| Scroll smoothness | Smooth / Janky | Smooth / Janky |
| Search responsiveness | Instant / Slow / Broken | — |
| Filter narrowing | Useful / Overwhelming | — |
| Pagination | Works / Slow / Broken | — |

Plus:
- **Sort stability**: When sorting by a column, does the order survive navigation and refresh?
- **Bulk selection**: Can you select all filtered records, or only the current page? Is that clear?
- **Export**: Can you export the current filtered view? All records? Does it time out or fail silently?
- **Infinite scroll**: If used, can you get back to where you were after clicking into a detail? Or does it reset?

**Severity guide**: List that doesn't virtualise at 1000+ rows is **High** (performance degrades, memory issues). Search returning irrelevant top results on common terms is **High**. Pagination that resets selection/state on every page change is **Medium**. Filter UI that doesn't show which filters are active is **Medium**.

---

## 7. Destructive Confidence

**Premise**: The high-stakes moments — delete, send, publish, pay, share. Does the app keep the user safe?

**How to run**:
1. Inventory every destructive or irreversible action in the app:
   - Delete (record, file, comment, account)
   - Send (email, invitation, notification)
   - Publish / make public
   - Pay / charge
   - Share (external link, give access)
   - Archive / deactivate
   - Bulk operations on any of the above
2. For each one:
   - Is there a confirmation dialog? What does it say?
   - Does the confirmation specify *what* will happen ("Delete Jenny O'Brien. 3 policies will also be removed. This cannot be undone.") or is it vague ("Are you sure?")?
   - Is the destructive button visually distinguished (red, warning icon)?
   - Is there an undo option after the action?
   - If no undo, is there a time window ("Deleted. Restore within 30 days.")?
3. For the bulk variants:
   - Does the confirmation say how many items will be affected?
   - Can you see which items you're about to act on?
   - Is there a way to undo a bulk action?

**Ask the user before running** this scenario — destructive testing on a real account can cause damage. Use a test account if possible.

**What to report**:

| Action | Confirmation quality | Destructive styling | Undo available | Severity |
|--------|---------------------|---------------------|----------------|----------|
| Delete client | [copy / specific? / count?] | Y/N | Y/N (time window) | |
| Send invoice | [copy] | Y/N | Y/N | |
| Publish page | [copy] | Y/N | Y/N | |
| Bulk delete | [copy / count shown?] | Y/N | Y/N | |

Plus:
- **Side-effect disclosure**: Does the app warn about cascading deletes, linked records, revoked access?
- **Fatigue risk**: If you trigger a destructive action 10 times in a row, do you stop reading the confirmation? Is the confirmation pattern the same every time, making it easy to click through mindlessly?
- **Accidental trigger surface**: How easy is it to hit a destructive action by mistake? Is it next to a similar-looking safe action?

**Severity guide**: Destructive action with no confirmation is **Critical**. Confirmation without specifics ("Are you sure?" with no context) is **High**. Destructive button styled identically to safe buttons is **High**. No undo and no time window for irreversible actions is **High**. Bulk delete without count/preview is **High**.

---

## 8. Second User (Role)

**Premise**: Most apps have roles — admin vs viewer, staff vs client, owner vs guest. The primary user experience is tested exhaustively. What about the others?

**How to run**:
1. Identify every role/permission level the app supports.
2. Log in as a non-primary role (viewer, client, read-only, restricted).
3. Walk the main threads as that role.
4. Specifically check:
   - **Denied pages**: Are they gracefully blocked (meaningful error, redirect to a page you can access) or do you see a broken page, blank screen, or raw error?
   - **Denied actions**: Are destructive/edit buttons hidden? Disabled with tooltip? Or visible-and-clickable but failing with a cryptic error?
   - **Denied data**: Can you see records you shouldn't? Search results leaking internal records?
   - **Error messages**: "You don't have permission to do that" — does it say *why* or *who to ask*?
   - **Empty states**: Do they differ by role? A client sees "No invoices yet" but an admin sees "No invoices yet — add one"?

**What to report**:

| Role | Threads completable | Broken pages | Leaked data | Error message quality |
|------|---------------------|--------------|-------------|----------------------|
| [Viewer] | [list] | [list] | [list] | [assessment] |
| [Client] | [list] | [list] | [list] | [assessment] |

Plus:
- **Wayfinding for restricted users**: Does the nav show items they can't access? Does it clearly mark them, hide them, or tease them?
- **Permissions UX**: If a user has mixed permissions (can view some records but not others), does the UI communicate that cleanly?
- **Request-access flows**: If a user hits a permission wall, is there a "request access from [owner]" option?
- **Impersonation**: If staff can act on behalf of clients, is the switch visually obvious so they don't accidentally act as the wrong user?

**Severity guide**: Broken page on permission denied (blank, raw stack trace, 500) is **Critical**. Leaked data visible to wrong role is **Critical**. Destructive button visible-and-clickable-but-failing for a restricted user is **High**. Confusing or absent error messages on denial is **High**. Nav showing items the user can't use without indication is **Medium**.

---

## 9. Lifecycle Position

**Premise**: Same role can experience the app radically differently depending on *when* in the org's lifecycle the user joins. The primary user gets exhaustive testing from a fully-onboarded perspective. What about the founder on day one, the first invitee on day three, and the colleague who joined a workspace that already has a year of history?

These are different products to different users. Empty-state copy that says "Get started by adding your first user" is correct for user #1 and broken for user #2. Activity feeds that look great with 50 contributors may break or feel hollow with one. Defaults that filter to "your work" are great for user #N and meaningless for user #1.

**How to run**:

Test three lifecycle positions, each with the same role (e.g. admin):

### User #1 — Founder (fresh org)

1. Sign up a fresh account / create a new org / start a new workspace.
2. Walk the *initial setup* and *first meaningful task* as the persona.
3. Specifically check:
   - **Onboarding flow**: Was there one? Was it skippable? Did it explain the app's concepts or assume you knew them?
   - **Empty workspace**: Helpful or hostile? Did the dashboard guide the next action or just show "no data" everywhere?
   - **First-task time**: Could you complete one meaningful piece of work in 5 minutes?
   - **Concept introduction**: Did the app teach its own vocabulary as you encountered it, or did you have to figure it out?

### User #2 — First invitee (partial state)

1. From user #1's account, invite user #2 with the same role.
2. Accept the invite as user #2 and walk the same threads as user #1.
3. Specifically check:
   - **Invite welcome**: Did the welcome copy address you specifically, or did it dump you into the founder's setup wizard?
   - **Setup-wizard misfire**: Were you forced through "set up your org" UI when the org already exists?
   - **Wayfinding in partial state**: Could you find your way around an org someone else shaped, with limited data and one peer?
   - **Peer-feature edge cases**: Mentions, assignments, comments, activity feeds, sharing — do they work meaningfully when there's only one other user?
   - **Empty-with-context copy**: Does empty-state copy still say "Add your first user" when *you are* the first user being added?

### User #N — Later joiner (full workspace)

1. Either use a real workspace with established data, or seed a fresh org with rich state (50+ records, 5+ users, established saved views) before running this segment.
2. Join as user #N (or simulate by seeding then signing up).
3. Specifically check:
   - **Onboarding stays out of the way**: You're catching up, not setting up. Does the app skip founder-flavoured onboarding?
   - **Find your work**: Could you find what's *yours* amongst others' content? Defaults filtered to your context, or dumped into "all data"?
   - **Convention learning**: Did the app teach the org's saved views, custom fields, naming conventions — or did you have to ask a teammate?
   - **Joining-the-party UI**: Is there a "what you missed" / "what's relevant to you" affordance, or do you land in a generic dashboard?

**What to report**:

| Position | Setup flow shown? | Onboarding gap | Wayfinding works? | Empty/partial UI helpful? |
|----------|-------------------|----------------|-------------------|--------------------------|
| User #1 (founder) | Y/N + quality | [list gaps] | Y/N + detail | Y/N + detail |
| User #2 (first invitee) | Y/N + quality | [list gaps] | Y/N + detail | Y/N + detail |
| User #N (later joiner) | Y/N + quality | [list gaps] | Y/N + detail | Y/N + detail |

Plus:
- **Same-screen-three-faces inventory**: For each major page, is the empty / partial / full state coherent? Or does one of the three look unfinished?
- **Onboarding scope creep**: Does setup UI bleed into screens user #2 and #N see?
- **Activity feed dignity**: Does the app present activity sensibly when only one user has acted, or does it look hollow?
- **Assignment / mention UX**: Test mentioning user #1 → user #2 with two-user setup. Does the @mention picker work? Are assignment dropdowns useful with 1, 2, 50 users?
- **Default landing**: Does the default dashboard / home view differ usefully by lifecycle position, or is it identical-and-suboptimal-for-most?

**Severity guide**: User #2 force-routed through founder setup wizard is **High**. Empty-state copy that's wrong for the user's lifecycle position ("Add your first user" shown to user #2) is **High**. Activity feed that breaks or shows raw nulls when only one user has acted is **High**. User #N dumped into all-data with no filter / scoping hint is **Medium**. Concept vocabulary never introduced anywhere (must learn from a teammate) is **Medium**. Onboarding shown to user #N when they don't need it (and unskippable) is **Medium**.

**Why this beats the standard "second user" test**: Roles and lifecycle position are orthogonal axes. A viewer who joined on day one and a viewer who joined on day three hundred see different products. Scenario 8 covers the role axis. This covers the time axis.

---

## 10. Round-Trip Workflow Integrity

**Premise**: Real users navigate A → B → A constantly. Open a project, type a prompt, get dropped into chat, agent replies, back to project — does the project show what just happened? When mutations on B affect data shown on A, the cache invalidation often gets missed and A serves stale state. Looks like data loss.

**How to run**:

For every workflow that traverses pages:

1. Capture A's state — count of items, latest timestamp, badge values.
2. Trigger an action on A that navigates to B.
3. Complete a mutation on B (send a message, create a thing, approve an item, save a draft).
4. Navigate back to A using the discoverable back affordance — NOT a hard reload.
5. Verify A reflects the new state (incremented count, new row, updated timestamp, decremented badge).
6. Verify the back affordance was discoverable (visible without hover, labelled with parent name, sized like a control, sidebar still highlights parent).

If the round-trip leaves A stale, log a finding (severity High — looks like data loss). Reload that "fixes" the staleness is the smoking gun.

**Cross-page mutation surfaces to test**:

| Outbound (A → B) | Mutation on B | What A must reflect on return |
|---|---|---|
| Project page → Start chat | Conversation created | New conversation in project's list |
| Item list → detail page edit | Item updated | List shows new title / status |
| Bulk-action page → batch process | Items processed | List + count + header badge update |
| Inbox → click finding | Finding marked-read | Unread count on bell decrements |
| Approvals page → approve | Approval decided | Pending tab + Inbox unified view both update |
| Settings → API tokens → create | Token created | List populates |
| Connections → OAuth → callback | Connection persisted | Connection list shows new entry |
| Routines /new → submit | Routine created | Sidebar + routines list show new row |

**What to report**:

| Round-trip | Stale on return? | Reload reveals data? | Back affordance discoverable? |
|---|---|---|---|
| project → chat → project | Y/N | Y/N | Y/N — describe (size, label, location) |
| (etc) | | | |

**Severity guide**: Stale parent on return is **High** (looks like data loss). Missing/hidden back affordance is **Medium** (recoverable but disorienting). Header badge that doesn't update is **High** (lies to the user about pending work).

**Code-level companion check**: grep for every `useMutation` and check the keys it invalidates against the keys consumed by parent / sibling views. The classic miss: mutation invalidates `['inbox']` only, but the same data also appears under `['notifications']` (badge) + `['approvals']` (sibling tab). Audit each mutation: "what query keys consume the data this mutation affects?" — invalidate them all.

Full protocol, surface inventory, detection heuristics, and findings template in [round-trip-workflows.md](round-trip-workflows.md).

**Why this exists as its own scenario**: it doesn't fit "Wrong Turn Recovery" (user goes correctly, not wrongly), it doesn't fit "Returning User" (test runs in one sitting), and it's invisible to static analysis. It's the single biggest source of "I'm not sure how I got there / the project is just empty when I go back" UX feedback in real apps.

---

## 11. Data Seasoning

**Premise**: 100 fresh-seeded rows behave differently from 100 rows accumulated over 30 days. Time-shaped data tests UI patterns that quantity-only seeding misses: time dividers ("Today" / "Yesterday" / "Last week"), recency-based sort order, cron-driven side effects, notification badge overflow, signal-vs-noise pressure, chart bucketing.

This catches the bugs that surface "after using the app for a while" — invisible to fresh-seeded audits.

**How to run**: seed the test-auth user with synthetic data at four horizons (Day 0 / 1 / 7 / 30). Walk seasoning-sensitive surfaces at each horizon, capturing screenshots labelled by horizon.

| Horizon | What it stresses |
|---------|------------------|
| **Day 0** (empty) | Empty states, onboarding affordances, "Open X" CTAs, dimmed placeholders |
| **Day 1** (light) | Today/Yesterday dividers, single-item pluralisation, returning-user feel |
| **Day 7** (modest) | Pagination breakpoints, "older than X" boundaries, cron-fired data (~50-150 routine runs), weekly summaries |
| **Day 30** (seasoned) | Notification badges at 47/99+, sort order signal-vs-noise, TanStack Query invalidation cascade depth, chart bucketing (per-day → per-week), search performance with history |

**Surfaces this applies to**: lists, queues (Inbox / Approvals / Pending), observability (agent_runs, audit logs), history (Memory, conversations), notification surfaces (header bell, tab counters), charts, dashboards, mention/assignee pickers.

**What to report** per surface × horizon:

| Surface | Day 0 | Day 1 | Day 7 | Day 30 |
|---------|:---:|:---:|:---:|:---:|
| Inbox | ✓ | ✓ | ✗ pagination breaks | ✗ badge overflow at 47 |
| Approvals | ✓ | ✓ | ✓ | ✗ "snooze" affordance missing |
| agent_runs observability | ✓ | ✓ | ✗ 168 entries melt scroll | (skipped — too slow) |
| Memory search | ✓ | ✓ | ✓ | ✗ 750ms latency at 500 items |

**Severity guide**:
- Notification badge overflows / breaks visually at 47+ unread → **High**
- Pagination breaks at Day 7 horizon → **High**
- Sort order becomes meaningless at Day 30 (recent buried) → **High**
- Charts unreadable at Day 30 (no per-week / per-month bucketing) → **High**
- TanStack Query invalidation cascades > 2s at Day 30 → **High**
- Empty-state CTA wrong for Day 30 (e.g. shown after mark-all-read) → **High**
- Missing Today / Yesterday dividers when data warrants → **Medium**
- Single-item pluralisation off (`1 messages`) → **Medium**
- Search latency >500ms at 500+ saved items → **Medium**
- Activity feed feels hollow at Day 1 (one entry) → **Low** (hard to fix without diluting signal)

**If the project has no seasoning seed scripts** (`pnpm seed:day-{0,1,7,30}` or equivalent): note that Scenario 11 was attempted but couldn't run; recommend the project write seeds (cite [data-seasoning.md](data-seasoning.md) for the architecture). Verdict can still be Pass on other grounds with Scenario 11 coverage = 0. Don't try to manually create 250 inbox items via the UI — that's not the audit's job, and it produces unrealistic time distributions anyway.

Full protocol, project-side seed-script architecture (`scripts/seed/horizons/day-N.ts` pattern, factory layout, CLI entrypoints), surface-by-surface what to look for at each horizon, and composition with other scenarios in [data-seasoning.md](data-seasoning.md).

**Why this exists as its own scenario**: Heavy Data (Scenario 6) is pure quantity. Lifecycle Position (Scenario 9) is *person* time (founder / invitee / joiner). Data Seasoning is *data* time — the app's content has a temporal distribution that a fresh seed can't simulate. Three orthogonal axes; you need all three.

---

## Running the Battery

Recommended order — **judgement-density first** (do the highest-signal scenarios while attention is freshest, low-judgement scenarios last):

**High-judgement scenarios** (do these first — most senior-designer-shaped findings come from here):

1. **Returning User** — repeat threads, measure improvement, check the dashboard. "The app doesn't get easier the second time" is a high-judgement finding.
2. **Lifecycle Position** — user #1 / #2 / #N. "This empty state is wrong for the second user" class.
3. **Round-Trip Workflow Integrity** — A → B → A. "I'm not sure how I got here / project is empty when I go back" class.
4. **Data Seasoning** — Day 0 / 1 / 7 / 30 horizons. "App feels different after a few weeks" findings.

**Mid-judgement scenarios**:

5. **Wrong Turn Recovery** — deliberately click wrong, time the recovery.
6. **Interrupted Workflow** — test mid-workflow.
7. **Heavy Data** — seed volume, rerun list/search/filter.
8. **Destructive Confidence** — ask the user before running.

**Lower-judgement / structural scenarios** (run as completeness backstop — largely covered by other phases):

9. **First Contact** — covered substantially by persona lock + first-time-user lens in Phase 3.
10. **Keyboard Only** — covered substantially by axe-core a11y phase.
11. **Second User (Role)** — covered if you do a persona-overload audit.

**Why reordered**: in the prior chronological order, agents tended to phone in scenarios 4-11 when the first three felt productive. Front-loading judgement-density means the audit never runs out of attention before reaching the high-signal scenarios.

The scenario *numbering* in the sections above (1 First Contact through 11 Data Seasoning) is the canonical scenario library — reports cite scenarios by their library number. The order above is the *running* order. Different concept, same scenarios.
