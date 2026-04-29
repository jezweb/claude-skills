# Component Perfection Checklist

Component-level audit that page-level audits miss. Adapted from the v2 audit-skill-gemini methodology with enforcement: every checkbox cites a proof artefact (screenshot, console line, DOM selector, code reference). No proof = doesn't count.

## Five-Layer Hierarchy

Every finding in the perfection checklist is tagged with one of:

1. **Architecture (the bones)** — navigation, hierarchy, information architecture
2. **Interaction (the joints)** — buttons, forms, toggles behave exactly as expected
3. **Visual Logic (the skin)** — design system consistency, layout, rhythm
4. **Feedback (the voice)** — system communicates state (loading, success, error)
5. **Delight (the soul)** — micro-interactions, polish, premium feel

Plus the standard severity (Critical / High / Medium / Low). Together they drive the Perfection Roadmap (Quick Wins / Structural / Advanced Polish).

## 1. Buttons & Triggers

| Check | What's verified | Common failure |
|---|---|---|
| **State Clarity** | Distinct hover, active, focus, and disabled states | All states identical, or focus invisible |
| **Intent Matching** | Button colour matches action weight (Primary / Ghost / Danger) | Destructive button styled the same as safe button |
| **Micro-Copy** | Text starts with a verb (`Export CSV` not `Data`) | Noun-only labels ("Settings", "Files") on action buttons |
| **Loading State** | Spinner or "Sending..." text on click; button disabled during action | Button stays enabled, user double-clicks |
| **Visual Hierarchy** | One primary CTA per screen | 3+ buttons competing for attention |
| **Click target ≥ 44×44** | Mobile thumb-friendly | Tiny "x" close buttons |
| **Hover delta perceptible** | ~10% brightness shift on hover | 5% imperceptible delta |

**Proof per check**: screenshot of each state, computed CSS, before/after click screenshot.

## 2. Inputs & Forms

| Check | What's verified | Common failure |
|---|---|---|
| **Persistent Labels** | Labels visible after the user starts typing | Placeholder-as-label disappears |
| **Input Masks** | Phone, date, currency formatted as the user types | User has to know format |
| **Inline Validation** | Errors after the user leaves the field, OR "strength" check during typing | Errors only on submit (lost context) |
| **Error Clarity** | Specific guidance: "Enter a valid email (e.g. name@domain.com)" | "Invalid input" |
| **Defaulting** | Common fields pre-filled (country by IP, most-common selection) | User has to fill every field every time |
| **Autocomplete attributes** | `autocomplete="email"`, `name`, `tel` set correctly | Browser can't auto-fill |
| **Tab order logical** | Tab moves through fields in reading order | Tab jumps to a button mid-form |
| **Required-field marking** | `*` or "(required)" before fields, not as failure message | User submits, then learns what's required |
| **Keyboard type on mobile** | `inputmode="numeric"` for phone, `type="email"` for email | iOS/Android shows wrong keyboard |
| **Persistent state on navigate-away** | Drafts saved or restored on return | Data lost when user clicks back |

**Proof per check**: screenshot showing each label + input pair, type into invalid value (capture error), navigate away + back (verify state).

## 3. Navigation & Hierarchy

| Check | What's verified | Common failure |
|---|---|---|
| **"Where am I?" test** | Look at any screen, immediately know module + sub-section | No active state in nav |
| **Click depth** | Primary user task ≤ 3 clicks from dashboard | Common task buried 5 clicks deep |
| **Search logic** | Handles typos; "No results found for [Query]" is clear | Empty results page with no hint |
| **Sticky headers** | Nav stays accessible on long pages OR hides/reveals intelligently | Nav scrolls away, no way back to top |
| **Breadcrumbs** | Present on detail pages, accurate hierarchy | Detail pages with no parent context |
| **Back button preserves state** | Back to a list returns to the same scroll, filter, sort | Back resets to top, filters cleared |
| **Deep links work** | Sharing a link to a specific record opens it correctly | Deep link 404s or shows blank |

**Proof per check**: screenshot of nav at every level, click count for primary task, search test with typo, deep link test.

## 4. Visual Coherence

| Check | What's verified | Common failure |
|---|---|---|
| **Icon consistency** | All icons from the same family (Lucide, Heroicons, etc.) | Mixed sharp + rounded icons |
| **Empty states** | Helpful illustration / icon, copy explaining the feature, primary CTA | Blank table with column headers |
| **Border radii** | Identical across buttons / cards / modals (consistent 4px / 8px / 12px scale) | Random radii: 3px, 7px, 10px |
| **Contrast ratio** | All text passes WCAG AA (4.5:1 body, 3:1 large text) | Light grey text on white |
| **Spacing scale** | All paddings / margins / gaps land on a documented scale (e.g. 4 / 8 / 12 / 16 / 24 / 32) | 22px padding where 24px belongs |
| **Colour tokens** | Body / borders / dividers from `var(--*)` tokens, not raw values | `text-gray-450` energy |
| **Typography scale** | 3-5 sizes globally; consistent line heights | Random font sizes: 15px, 17px, 22px |

**Proof per check**: eyedropper sample, computed-styles inspection, contrast-ratio readout, side-by-side icon comparison.

Cross-reference [visual-polish.md](visual-polish.md) for the full AI-tell catalogue.

## 5. Mobile & Touch

| Check | What's verified | Common failure |
|---|---|---|
| **Tappable surface ≥ 48×48px** | Links and buttons large enough for thumb without hitting neighbours | Tiny pagination / close buttons |
| **Keyboard optimisation** | `inputmode="numeric"` for numbers, `type="email"` for email | Wrong keyboard pops up |
| **Swipe gestures discoverable** | Swipe-to-delete is hinted (icon, edge nudge) OR has an explicit alt | Hidden swipe with no fallback |
| **Bottom-sheet UX** | Drag handle, gesture-dismissable, full-height when needed | Sheet won't dismiss, content scrollable behind |
| **Thumb zone respected** | Primary actions reachable in lower 1/3 of viewport | Save button at top of long scroll |
| **No hover-only affordances** | Everything works without a hover state | Menus that only open on hover |

**Proof per check**: 375px screenshot with finger overlay, viewport check, gesture replay.

## 6. Performance & Feedback

| Check | What's verified | Common failure |
|---|---|---|
| **Skeleton screens** | Skeleton loaders during fetch, NOT a blank white page | Blank page → sudden content |
| **Skeleton shape parity** | Skeleton matches loaded layout (same column widths, row heights) | Spinner-on-blank disguised as skeleton |
| **Success toasts** | Non-intrusive "Success" appears after background tasks | No confirmation, user wonders if it worked |
| **Confirmation modals** | Used ONLY for high-stakes irreversible actions | Confirmation on every save |
| **Optimistic UI** | List updates immediately; rolls back on server reject | Optimistic update with no rollback handling |
| **Time to first interaction** | < 1.5s on a fast connection | Loading spinner > 3s with no indication |
| **Long action progress** | "Sending email to 12 recipients..." with specific count | "Please wait..." (wait for what?) |
| **Error recovery** | Retry button on failed requests | Generic "Something went wrong" with no path forward |

**Proof per check**: filmstrip from action to feedback, network throttled to Slow 3G, screenshot of error state with retry visible.

## Component States Matrix (six per major component)

For every list, card, table, dashboard widget, form, detail panel, capture all six visual states:

| State | What to verify | Common findings |
|-------|----------------|-----------------|
| **Default** | Loaded, idle | Baseline |
| **Loading (skeleton)** | Shape parity with loaded layout | Spinner-on-blank, layout shift on load |
| **Empty** | Helpful copy + CTA | Blank void; "no data" without next-action |
| **Partial loaded** | First batch usable while later batches arrive | Misleading "complete" framing while still streaming |
| **Error** | Recoverable? Retry available? | Generic "Something went wrong"; raw stack trace |
| **Disabled** | Why disabled is *visible* (tooltip, helper text) | Greyed-out button with no path to enable |

Skeleton loaders specifically — a spinner on top of a blank container is **not** a skeleton. The skeleton's job is to *prevent layout shift* and *signal what's coming*. Verify both: throttle the network to keep the skeleton visible long enough to inspect.

## Proof requirements

Every checkbox in the report must cite at least one of:

- **Screenshot** at `.jez/audit-evidence/<date>/<surface>-<state>.png`
- **Console line** with the warning text and timestamp
- **DOM selector** that reproduces the issue
- **Code reference** (`src/components/Button.tsx:42`)
- **Computed style readout** (specific CSS values)
- **Network request** (URL, method, status, latency)

A check marked "PASS" without a proof artefact is rejected. Forces the agent to actually look, not vibe.

## Severity guide for component findings

| Severity | When to assign | Example |
|----------|---------------|---------|
| **Critical** | User cannot complete primary task | Save button no-op |
| **High** | Confusion, friction, trust damage; OR console warning; OR layout collapse | Loading spinner with no end; placeholder-as-label |
| **Medium** | Suboptimal but workable | Inconsistent border radii; weak hover delta |
| **Low** | Polish | 1-2px alignment; underline offset |

## How to run the perfection checklist

The checklist is a **per-component** scan, not a per-page scan. After thread traversal and element exhaustion, walk every distinct component class on the app:

1. List every type of component (buttons primary / ghost / destructive, inputs text / select / textarea, cards, modals, toasts, etc.)
2. For each type, find one canonical instance to audit
3. Walk that instance through all relevant rows of the checklist
4. Capture proof for each row
5. If the finding is shared across many instances of the same type, log it once with a count: "Affects 47 instances of `<Button variant='primary'>`"

This makes the audit's findings systemic-first, instance-second. Fixing one root cause lifts many surfaces.

## Layer × Severity → Roadmap

The Perfection Roadmap groups findings by layer + severity:

- **Quick Wins (24-48h)** — Low / Medium polish in Visual Logic + Delight layers
- **Structural Updates (1-2 weeks)** — High / Critical in Architecture + Interaction layers
- **Advanced Polish (post-launch)** — Low in all layers, plus Delight enhancements

Critical Architecture issues block ship. Low Delight issues wait for a design pass. The roadmap framing makes prioritisation obvious instead of being one ranked list.
