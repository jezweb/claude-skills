# Visual Polish Sweep

A page-by-page micro-polish pass. Run after the Responsive Sweep, before the Scenario Battery. Goal: would a design-conscious person look at the page and think *"this is well made"* or *"a developer / AI built this"*?

This is the layer that separates a UI that's *technically correct* from one that *feels considered*. Most of the patterns below are invisible to functional testing and to most humans on first glance — but they pile up and form the unmistakable "machine-generated" smell.

## How to run

1. Pick one major page at a time. Work in this order:
   - Most-used screen (dashboard, primary list view)
   - Highest-stakes screen (settings, billing, anything destructive)
   - Marketing surfaces (login, signup, public pages)
   - Edit / detail screens

2. For each page, run through the **AI-tell catalogue** below in order. Don't skip the ones that feel subtle — those are exactly the ones the catalogue exists for.

3. Use Browser DevTools actively:
   - **Eyedropper** on greys, blues, borders — verify they trace back to design tokens, not raw values
   - **Computed styles** on suspect spacing values — verify they land on the design system's scale
   - **Inspect → Layout panel** — overlays show exact box dimensions and padding/margin
   - **Throttle network → Slow 3G** — forces loading and skeleton states to stay visible long enough to evaluate

4. Capture screenshots of every finding with the relevant DOM inspector overlay visible — the overlay is the proof.

## AI-tell catalogue

### 1. Optical vs mathematical centring

`align-items: center` puts the text-box centre at the container's centre. But text has descenders that shift the *perceptual* centre upward — what looks centred is not the same as what is mathematically centred.

**Buttons / chips / badges with text**:
- Take a screenshot. Draw a horizontal line through the visible text x-height (the top of the lowercase letters and bottom excluding descenders).
- The button's vertical centre should be 1-2px *above* the text-box centre — text should sit slightly low if mathematically centred.
- If text looks high-floating in the button, it's mathematically centred (broken). Should appear visually anchored.
- Numbers in badges (no descenders) need a different correction — they often need to be nudged *down* 1px from text default.

**Icon next to label**:
- Icon should align to the **cap height** of the text (the top of capital letters), not to the line-height box.
- Walk every "icon + text" pair: nav items, button labels with icons, list-item adornments, breadcrumb separators.
- If the icon looks low-slung (sitting on the descender line), it's wrong. Verify with: select the text + icon, check whether the icon centres above the baseline of the lowercase text, not on it.

**How to test**:
- Zoom screenshot to 400% and squint
- Use a horizontal ruler / DevTools horizontal guide
- Compare to a reference component from a polished design system (Radix UI primitives, Linear, Vercel docs)

**Findings shape**: *"Submit button on /signup — text mathematically centred (computed: y-offset 0px from container midline), should be optically corrected (~1px upward nudge). Compare to Linear's primary button styling."*

### 2. Nested border-radius rule

When a rounded container holds a rounded inner element, the inner radius should equal the outer radius minus the padding. `inner = outer - padding`.

**Why**: visually concentric corners trace parallel arcs. Mismatched radii create a wedge of awkward space at every corner.

**How to check**:
- Card with internal media (image, code block, embedded list): outer radius (e.g. 12px), inner padding (e.g. 8px), inner radius should be **4px**.
- Modal dialog with header/footer that have their own backgrounds: same rule applies recursively.
- Buttons with internal icon backgrounds, chips with adornments — same rule.

**Common AI failure**: outer 12px, padding 8px, inner ALSO 12px (or worse, 8px or 4px arbitrary). Inner corner looks pinched or floating depending on direction.

**Findings shape**: *"Card on /dashboard has 12px outer radius and 16px padding, but internal preview image has 12px radius — should be ~0px (clamped) or 4px for a subtle inner corner."*

### 3. Off-scale spacing

The design system defines a spacing scale (e.g. 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64). Every margin, padding, and gap should be a step on that scale. AI-generated CSS often produces *almost-right* values: 22px where 24px belongs, 7px where 8px belongs.

**How to check**:
- DevTools → Computed styles → check every `margin`, `padding`, `gap` on visible elements
- Look for raw pixel values like 13, 15, 17, 22, 27, 31 — these are tells
- The scale's gaps reveal themselves under squint test as inconsistent rhythm: rows that should feel equally spaced look subtly off

**The squint test**: blur your eyes at a list / grid / form. Distances should feel like a small, regular ladder. If anything jumps, that's the off-scale value.

**Findings shape**: *"Form fields on /settings have 14px gap between groups (computed). Design tokens use 12 / 16 / 24 step scale. Should be either 16 or 24."*

### 4. Vibe greys (and other off-token colours)

Body text, borders, dividers, muted text — these should all come from design tokens (`text-foreground`, `text-muted-foreground`, `border`, etc.). AI often introduces raw greys: `text-gray-450`, `#5a6168`, hand-picked hex values.

The eye notices because:
- Multiple greys with slightly different temperature (warm vs cool) within one component looks careless
- Greys that don't trace to the system fail in dark mode (no inverted equivalent)
- Borders that read as 1.5 different greys at the same weight = visual debt

**How to check**:
- DevTools → Styles → look for inline colour values vs `var(--*)` references
- Eyedropper → sample text, borders, dividers, muted UI
- Verify each sampled colour matches a token in the design system's CSS variables

**Findings shape**: *"Sidebar dividers on /dashboard use #d4d4d8 (raw). Border tokens are `--border: hsl(220 13% 91%)` ≈ #e3e6eb. Two different values rendering at similar weights produces visual drift."*

### 5. Border-weight drift

Borders within the same logical category (inputs, cards, modals) should use the same weight. AI often uses 1px / 1.5px / 2px interchangeably with no rationale.

**How to check**:
- DevTools → Computed → `border-width` on every input field, card, modal
- Inputs: typically all 1px
- Cards: 1px or no border + shadow
- Modals: typically no border + larger shadow
- Hover/focus states may bump weight (1px → 2px focus ring), but consistently across the same category

**Findings shape**: *"On /clients, list cards use 1px border, action buttons use 1.5px, search input uses 2px focus ring while text inputs in modals use 3px. No clear pattern — pick one weight per state per category."*

### 6. Drop shadow direction inconsistency

Shadows imply a light source. The light source should be consistent across the entire app — typically top-left or top, casting shadows down or down-right.

**How to check**:
- For each component with a shadow (cards, modals, dropdowns, tooltips), inspect `box-shadow`
- Shadows should all share the same x-offset sign (positive or zero) and a positive y-offset
- Shadows that point in opposite directions (one shadow down-right, another shadow down-left) is the immediate tell

**Common AI failure**: dropdown shadow `0 4px 6px rgba(0,0,0,0.1)` (good — points down), modal shadow `-2px 4px 12px rgba(0,0,0,0.15)` (bad — points down-left). Same app, different light sources.

**Findings shape**: *"Modal shadow on /settings has -2px x-offset (light from upper-right). Dropdown shadows app-wide have 0 x-offset (light from above). Pick one and apply consistently."*

### 7. Animation timings off canonical

Canonical UX motion durations:
- 100-150ms — micro-interactions (hover, focus)
- 200ms — small transitions (toggle, accordion)
- 300ms — modal/sheet open
- 500ms+ — full-page route transitions

**AI failure**: arbitrary values like 157ms, 233ms, 412ms — reads as "let me just type a number". Off-canonical durations don't *feel* worse than canonical ones in isolation, but they signal lack of care.

**How to check**:
- DevTools → Inspect → Computed → `transition-duration`, `animation-duration`
- Check easing curves too: `ease`, `ease-in-out`, `cubic-bezier(0.4, 0, 0.2, 1)` are reasonable; `cubic-bezier(0.31, 0.07, 0.52, 0.99)` (or any random-looking curve) is a tell

**Findings shape**: *"Dropdown open animation duration is 187ms. Should be either 150 or 200 — pick canonical."*

### 8. Hover-delta too subtle (or too loud)

Default → hover should be a perceptible state change but not jarring.

- **Background-only hover**: typically ~10% darker (or lighter on dark backgrounds). 5% is subtle enough that users wonder if anything happened.
- **Border hover**: typically full colour shift (token to primary), not subtle weight change
- **Text hover**: typically full colour shift to primary or accent, with optional underline
- **Card hover**: shadow bump + 1-2px translate, not 0px bump or 8px translate

**How to check**:
- Hover every interactive element. Take a screenshot of default and hover state.
- Diff visually — would a user notice the change without actively looking for it?
- Accessibility consideration: pure colour changes need to also work in high-contrast / reduced-motion modes

**Findings shape**: *"Sidebar nav items: hover changes background from \`hsl(220 13% 96%)\` to \`hsl(220 13% 94%)\` — 2% delta, imperceptible. Should be ~10% or use a token like \`--accent\`."*

### 9. Text underline offset / letter-spacing on uppercase

**Underline offset**: default browser underlines render close to the descender line, often touching letters. Good design sets `text-underline-offset: 3-4px` or uses `text-decoration-thickness` for a tuned look.

**Uppercase letter-spacing**: ALL CAPS text without letter-spacing reads as cramped. Standard correction is +0.05em to +0.1em letter-spacing on uppercase headings, button labels, badges. AI often skips this.

**How to check**:
- Find every underlined link → DevTools Computed → check `text-underline-offset`. If `auto` or unset on long-form content, log it.
- Find every uppercase element → check `letter-spacing`. If 0 or unset, log it.

**Findings shape**: *"Inline links in body copy have default underline offset (browser ~1-2px) — descenders cross the underline line. Set \`text-underline-offset: 3px\`."*

### 10. Symmetry vs editorial pacing

App shells generated by AI tend toward perfect symmetry: forms perfectly centred in containers, padding equal on all sides, layouts horizontally balanced.

Polished apps often break symmetry intentionally:
- Forms aligned to a column grid, not centred in viewport
- Section padding asymmetric (more breathing room above headings than below)
- Sidebars sized to a meaningful unit (240px, 280px) not "33% / 67%"
- Dashboard cards on a 12-column grid, not all equal width
- Hero sections with asymmetric content/visual layout

**How to check**: hide content for a moment and look at structural composition.
- Does the page feel composed, or laid out by a templater?
- Is white space trapped (awkward) or shaped (intentional)?
- Compare to reference apps: Linear (asymmetric editorial), Stripe Dashboard (deliberate hierarchy), Notion (intentional density), Vercel Dashboard (informational density with whitespace).

**Findings shape**: *"Settings page form is centred in 768px container. Other pages use a left-aligned 640px column with right rail for help/docs. Centred form on settings reads as orphaned and template-generated."*

## Per-component optical pass

For every instance of these component categories on every page, verify the four-point optical check:

| Component | Verify |
|-----------|--------|
| **Buttons (primary, secondary, ghost, destructive)** | Text optically centred, icon (if any) on cap-height baseline, hover delta perceptible, focus ring visible and on token |
| **Badges / chips / tags** | Text or count optically centred (extra care for numbers), padding consistent with size variant |
| **Inputs (text, select, textarea)** | All same height per size variant, leading/trailing icons aligned to text cap height, placeholder colour from token, focus state distinct from default |
| **Dropdowns / comboboxes** | Trigger same height as inputs of same size, chevron icon optically aligned, popover follows nested-radius rule |
| **Cards** | Outer radius and inner content radius follow nested rule, padding consistent within category, shadow direction matches app-wide light source |
| **Tabs** | Active tab indicator height/colour consistent, hover state on inactive tabs distinct, alignment of tab text optically corrected |
| **Avatars** | Truly circular (border-radius: 50%, square aspect), text/initials optically centred, fallback colours from a defined palette |
| **Toasts / alerts** | Icon optically aligned with first line of text, dismiss button optically centred, severity colour from semantic token |

## Severity guide

| Severity | When to assign |
|----------|---------------|
| **High** | One component shows multiple AI-tells stacked (off-centre text + arbitrary radius + raw grey + off-scale padding). Indicates the component was generated end-to-end without polish. |
| **High** | A pattern repeats across the app (raw greys throughout, off-canonical animation timings everywhere) — signals systemic lack of design tokens. |
| **Medium** | Single recurring pattern affecting one component family (all buttons share an off-centring issue; all dropdowns have the same border-weight drift). One fix lifts many surfaces. |
| **Medium** | Light source inconsistency across more than two components. |
| **Low** | Single instance, single tell — one badge with optical-centring miss, one section with off-scale padding. |
| **Low** | Underline offset, uppercase letter-spacing — meaningful but easily forgiven by most users. |

## Tools

- **Browser DevTools eyedropper** — fastest way to verify "is this colour from the system?"
- **DevTools → Computed** — exposes the actual rendered values for every CSS property
- **DevTools → Layout overlay** — visualises grid, padding, margin
- **`getComputedStyle(el)` in console** — script to extract all computed values from a selection
- **Reference apps** for calibration: Linear, Stripe Dashboard, Vercel Dashboard, Notion, Cron / Notion Calendar, Raycast docs

## Tips

- **Run this AFTER the responsive sweep**, not before — responsive sweep often surfaces visual issues that visual polish was masking.
- **Don't stop at "it looks fine"** — the catalogue exists because most patterns require active checking, not vibes.
- **Use the eyedropper on every grey** — this single check catches more issues than any other.
- **The squint test is your friend** — for hierarchy, spacing rhythm, and overall composition.
- **Stack-rank the findings** — fix systemic patterns (token migration, light source consistency) before single-instance polish.
- **Photograph evidence** — every finding should have a screenshot with DOM inspector overlay or eyedropper readout visible. The overlay is the proof.

## What this catches that nothing else does

| Other phase | What it covers | What it misses |
|-------------|---------------|----------------|
| Thread Traversal | Friction, hesitation, dead ends, comprehension | Whether the friction is *partly* caused by visual confusion |
| Element Exhaustion | Functional behaviour of every control | Whether controls *look* trustworthy |
| Responsive Sweep | Layout breakage at different widths | Polish at any single width |
| Scenario Battery | Contextual issues (first contact, returning user, lifecycle) | Composition, optical correction, design token discipline |

Visual Polish Sweep is the only phase that asks: *"Does this look made by someone who cares, or made by an automated pipeline?"*
