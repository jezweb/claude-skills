---
name: icon-set-generator
description: >
  Generate cohesive, project-specific SVG icon sets for websites and applications.
  Use this skill whenever the user needs custom icons, an icon set for a website or app,
  icons for a client project, or mentions needing SVG icons that look consistent together.
  Also trigger when the user describes a project and icons would naturally be part of the
  deliverable — e.g. "I'm building a site for a plumber" implies they'll need service icons.
  Trigger on: "icons for", "icon set", "custom icons", "SVG icons", "make me icons",
  "I need icons", "website icons", "project icons", or any request for consistent visual
  assets for a web project. This skill produces individual SVG files with a consistent
  style engine, not generic icon library lookups.
compatibility: Designed for Claude Code (or similar products)
---

# Icon Set Generator

Generate custom, visually consistent SVG icon sets tailored to specific projects. Each set is built from a shared style specification so every icon looks like it belongs with the others — same stroke weight, same corner treatment, same visual density.

## Why This Matters

Generic icon libraries (Lucide, Heroicons) are great but every site using them looks similar. A custom icon set gives a project distinct visual identity. The hard part is consistency — drawing 20+ icons individually causes style drift. This skill solves that by defining style rules once and enforcing them across every icon.

## Workflow

### Step 1: Understand the Project

Ask about the project. You need enough to suggest icons and pick a style:

- What's the business/project? (industry, name, vibe)
- Any brand guidelines or colour palette? (informs style choices even though SVGs use currentColor)
- What feel? (modern, friendly, corporate, minimal, bold)
- Roughly how many icons? (typical small site: 15-25)

A brief like "plumber in Newcastle, modern feel" is enough to proceed. Don't over-interview.

### Step 2: Suggest Icons

Read `references/industry-icons.md` for industry-specific suggestions. Organise into groups:

- **Navigation** — menu, close, arrows, search
- **Communication** — phone, email, location, clock
- **Trust** — star, shield, award, users
- **Actions** — download, share, calendar, form
- **Industry-Specific** — icons unique to this business type

Present the list. Let the user add, remove, or rename before generating.

### Step 3: Define the Style Spec

Read `references/style-presets.md` for full preset definitions. Pick one as starting point:

| Preset | Best For | Stroke | Caps/Joins | Corners |
|--------|----------|--------|------------|---------|
| Clean | Most business sites | 1.5px | round/round | 2px |
| Sharp | Corporate/technical | 1.5px | square/miter | 0px |
| Soft | Friendly/approachable | 2px | round/round | 4px |
| Minimal | Elegant/editorial | 1px | round/round | 0px |
| Bold | High impact/accessible | 2.5px | round/round | 2px |

Tell the user which preset you're recommending and why, then confirm.

### Step 4: Generate the Icons

Generate every icon following the SVG Rules below. Output to an `icons/` directory in the project root (or the user's preferred location).

Read `references/svg-examples.md` before generating — it contains reference implementations showing the right level of complexity and how to handle common icon shapes.

Generate in batches of ~5. After each batch, visually review for consistency before continuing. After all icons are done, create the preview page and style-spec.json.

### Step 5: Deliver

Output structure:
```
icons/
├── style-spec.json
├── preview.html
├── home.svg
├── phone.svg
└── ...
```

Present `preview.html` first so the user sees the complete set visually.

---

## SVG Rules

Every icon in a set MUST follow all of these. Even small inconsistencies — a slightly different stroke width, a rounded corner where others are sharp — make the set look amateur.

### SVG Template

Every icon uses this exact outer structure:

```xml
<svg xmlns="http://www.w3.org/2000/svg"
  width="{grid}" height="{grid}"
  viewBox="0 0 {grid} {grid}"
  fill="none"
  stroke="currentColor"
  stroke-width="{strokeWidth}"
  stroke-linecap="{strokeLinecap}"
  stroke-linejoin="{strokeLinejoin}">
  <!-- icon paths here -->
</svg>
```

### Hard Rules

1. **`currentColor` only** — Never hardcode colours. SVGs inherit colour from CSS. No `fill="#000"` or `stroke="blue"`. If a shape needs fill, use `fill="currentColor"`.

2. **Identical viewBox** — Every icon uses the same `viewBox`. No exceptions.

3. **Identical root stroke attributes** — `stroke-width`, `stroke-linecap`, `stroke-linejoin` on the `<svg>` element must match across all icons. Override on individual elements only when truly necessary.

4. **No transforms on root** — No `translate`, `rotate`, `scale`. Bake positioning into coordinates.

5. **No IDs or classes** — Keep SVGs clean for external styling.

6. **Coordinate precision** — Max 2 decimal places. Snap to half-pixel grid (e.g. `12`, `12.5`, not `12.333`).

7. **Consistent padding** — Maintain configured padding from viewBox edge. For 24px grid with 2px padding, draw within 2–22 coordinate range.

8. **Minimal elements** — Fewest `<path>`, `<circle>`, `<rect>`, `<line>` elements practical. Simpler = smaller + faster rendering.

9. **Visual centring** — Appear visually centred, not just mathematically centred. A leftward arrow shifts slightly right. A house with a chimney adjusts for asymmetry.

### Optical Corrections

Subtle but essential for professional results:

- **Curved stroke compensation**: Curves appear thinner than straight lines at same stroke width. For primarily curved icons (phone, globe), make paths slightly larger rather than changing stroke width.
- **Pointed shape overshoot**: Arrows, chevrons, triangles extend ~0.5px beyond where a square would stop to appear the same size.
- **Visual weight balancing**: Simple icons (single chevron) look lighter than complex ones (gear). Make simpler icons slightly larger in the grid, or use slightly more substantial paths. No icon should look noticeably lighter or heavier than the others.

---

## style-spec.json

```json
{
  "name": "project-name-icons",
  "preset": "clean",
  "grid": 24,
  "strokeWidth": 1.5,
  "strokeLinecap": "round",
  "strokeLinejoin": "round",
  "cornerRadius": 2,
  "padding": 2,
  "opticalBalance": true,
  "iconCount": 20,
  "icons": ["home", "phone", "email"],
  "generated": "2026-02-15"
}
```

---

## Preview Page

Generate a self-contained HTML file displaying all icons for visual review. Read `references/preview-template.md` for the template. Requirements:

- Grid of all icons at native size (24px) with labels
- Same grid at 2x (48px) for detail inspection
- Dark background section (white on dark) for contrast check
- Style spec summary at top
- Inline CSS, no dependencies — just open in browser
- Inline all SVGs directly into the HTML (don't reference external files)

---

## Quality Checklist

Verify every item before delivering:

- [ ] All SVGs have identical `viewBox`, `stroke-width`, `stroke-linecap`, `stroke-linejoin`
- [ ] All SVGs use `currentColor` exclusively
- [ ] Visual weight is balanced across the set
- [ ] Padding is consistent (nothing touching viewBox edge)
- [ ] All icons visually centred
- [ ] Filenames are lowercase kebab-case (`arrow-right.svg`)
- [ ] Preview HTML renders all icons correctly
- [ ] style-spec.json is accurate and lists all icons

---

## Reference Files

Read these before generating:

- `references/style-presets.md` — Detailed preset definitions and selection guidance
- `references/industry-icons.md` — Industry-specific icon suggestions
- `references/preview-template.md` — HTML template for the preview page
- `references/svg-examples.md` — Example SVGs showing proper construction at various complexity levels
