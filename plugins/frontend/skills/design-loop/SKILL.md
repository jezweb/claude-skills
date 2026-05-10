---
name: design-loop
description: "Autonomous multi-page site builder using a baton-passing loop pattern. Each iteration reads a task from .design/next-prompt.md, generates a page with Claude's HTML/CSS/Tailwind, integrates it into the site, verifies visually via browser automation, then writes the next task to keep the loop going. Drives complete website builds from a single starting prompt. Triggers: 'design loop', 'build the site', 'build all pages', 'autonomous site build', 'baton loop', 'next page', 'keep building pages'."
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
compatibility: Designed for Claude Code (or similar products)
---

# Design Loop — Autonomous Site Builder

Build complete multi-page websites through an autonomous loop. Each iteration reads a task, generates a page, integrates it, verifies it visually, then writes the next task to keep going.

## Overview

The Design Loop uses a "baton" pattern — a file (`.design/next-prompt.md`) acts as a relay baton between iterations. Each cycle:

1. Reads the current task from the baton
2. Generates the page (via Claude or Google Stitch)
3. Integrates into the site structure (navigation, links)
4. Verifies visually via browser automation (if available)
5. Updates site documentation
6. Writes the NEXT task to the baton — keeping the loop alive

This is orchestration-agnostic. The loop can be driven by:
- **Human-in-loop**: User reviews each page, then says "next" or "keep going"
- **Fully autonomous**: Claude runs continuously until the site is complete
- **CI/CD**: Triggered on `.design/next-prompt.md` changes

## Generation Backends

| Backend | Setup | Quality | Speed | Best for |
|---------|-------|---------|-------|----------|
| **Claude** (default) | Zero dependencies | Great — production-ready HTML/Tailwind | Fast | Most projects, full code control |
| **Google Stitch** | `npm install @google/stitch-sdk` + API key | Higher fidelity AI designs | ~10-20s/screen | Design-heavy projects, visual polish |

### Detecting Stitch

At the start of each loop, check if Stitch is available:

1. Check if `@google/stitch-sdk` is installed: `ls node_modules/@google/stitch-sdk 2>/dev/null`
2. Check if `STITCH_API_KEY` is set in `.dev.vars` or environment
3. Check if `.design/metadata.json` exists (contains Stitch project ID)

If all three are present, use Stitch. Otherwise, fall back to Claude generation.

### Stitch SDK Reference

Install: `npm install @google/stitch-sdk`. Set `STITCH_API_KEY` in environment or `.dev.vars`.

```typescript
import { stitch } from "@google/stitch-sdk";

// Create a project
const result = await stitch.callTool("create_project", { title: "My Site" });

// Reference an existing project
const project = stitch.project("4044680601076201931");

// Generate a screen
const screen = await project.generate("A modern landing page with hero section", "DESKTOP");

// Get assets
const htmlUrl = await screen.getHtml();    // Download URL for HTML
const imageUrl = await screen.getImage();  // Download URL for screenshot

// Edit an existing screen (prefer this for refinements)
const edited = await screen.edit("Make the background dark and enlarge the CTA button");

// Generate variants
const variants = await screen.variants("Try different colour schemes", {
  variantCount: 3,
  creativeRange: "EXPLORE",     // "REFINE" | "EXPLORE" | "REIMAGINE"
  aspects: ["COLOR_SCHEME"],    // "LAYOUT" | "COLOR_SCHEME" | "IMAGES" | "TEXT_FONT" | "TEXT_CONTENT"
});
```

Device types: `"MOBILE"` | `"DESKTOP"` | `"TABLET"` | `"AGNOSTIC"`. Model selection: pass `"GEMINI_3_PRO"` | `"GEMINI_3_FLASH"` as third arg to `generate()`.

Other operations: `stitch.projects()` lists projects, `project.screens()` lists screens, `project.getScreen("id")` fetches one.

`getHtml()` and `getImage()` return download URLs. Append `=w1280` to image URLs for full resolution. Auth: `STITCH_API_KEY` required (or `STITCH_ACCESS_TOKEN` + `GOOGLE_CLOUD_PROJECT` for OAuth). Errors throw `StitchError` with codes: `AUTH_FAILED`, `NOT_FOUND`, `RATE_LIMITED`.

### Stitch Project Persistence

Save Stitch identifiers to `.design/metadata.json` so future iterations can reference them:

```json
{
  "projectId": "4044680601076201931",
  "screens": {
    "index": { "screenId": "d7237c7d78f44befa4f60afb17c818c1" },
    "about": { "screenId": "bf6a3fe5c75348e58cf21fc7a9ddeafb" }
  }
}
```

Stitch integration tips:
1. Persist project ID in `.design/metadata.json` — don't create a new project each iteration
2. Use `screen.edit()` for refinements rather than full regeneration
3. Post-process Stitch HTML — replace headers/footers with your shared elements
4. Include DESIGN.md context in prompts — Stitch generates better results with explicit design system instructions

## Getting Started

### First Run: Bootstrap the Project

If `.design/` doesn't exist yet, create the project scaffolding:

1. **Ask the user** for:
   - Site name and purpose
   - Target audience
   - Desired aesthetic (minimal, bold, warm, etc.)
   - List of pages they want
   - Brand colours (or extract from existing site with `/design-system`)

2. **Create the project files**:

```
project/
├── .design/
│   ├── SITE.md           # Vision, sitemap, roadmap — the project's long-term memory
│   ├── DESIGN.md         # Visual design system — the source of truth for consistency
│   └── next-prompt.md    # The baton — current task with page frontmatter
└── site/
    └── public/           # Production pages live here
```

3. **Write SITE.md** from the template in the "SITE.md Template" section below
4. **Write DESIGN.md** — either manually from user input, or use the `design-system` skill to extract from an existing site
5. **Write the first baton** (`.design/next-prompt.md`) for the homepage

### Subsequent Runs: Read the Baton

If `.design/next-prompt.md` already exists, parse it and continue the loop.

## The Baton File

`.design/next-prompt.md` has YAML frontmatter + a prompt body:

```markdown
---
page: about
layout: standard
---
An about page for Acme Plumbing describing the company's 20-year history in Newcastle.

**DESIGN SYSTEM:**
[Copied from .design/DESIGN.md Section 6]

**Page Structure:**
1. Header with navigation (consistent with index.html)
2. Hero with company photo and tagline
3. Story timeline showing company milestones
4. Team section with photo grid
5. CTA section: "Get a Free Quote"
6. Footer (consistent with index.html)
```

| Field | Required | Purpose |
|-------|----------|---------|
| `page` | Yes | Output filename (without .html) |
| `layout` | No | `standard`, `wide`, `sidebar` — defaults to `standard` |

## Execution Protocol

### Step 1: Read the Baton

```
Read .design/next-prompt.md
Extract: page name, layout, prompt body
```

### Step 2: Consult Context Files

Before generating, read:

| File | What to check |
|------|---------------|
| `.design/SITE.md` | Section 4 (Sitemap) — don't recreate existing pages |
| `.design/DESIGN.md` | Colour palette, typography, component styles |
| Existing pages in `site/public/` | Header/footer/nav patterns to match |

**Critical**: Read the most recent page's HTML to extract the exact header, navigation, and footer markup. New pages must use identical shared elements.

### Step 3: Generate the Page

#### Option A: Claude Generation (Default)

Generate a complete HTML file using Tailwind CSS (via CDN). The page must:

- **Match the design system** from `.design/DESIGN.md` exactly
- **Reuse the same header/nav/footer** from existing pages (copy verbatim)
- **Be self-contained** — single HTML file with Tailwind CDN, no build step
- **Be responsive** — mobile-first, works at all breakpoints
- **Include dark mode** if the design system specifies it
- **Use semantic HTML** — proper heading hierarchy, landmarks, alt text
- **Wire real navigation** — all nav links point to actual pages (existing or planned)

Write the generated file to `site/public/{page}.html`.

#### Option B: Stitch Generation (If Available)

If Stitch SDK is available:

1. Build the prompt by combining the baton body with the DESIGN.md system block
2. Call `project.generate(prompt, deviceType)` to generate the screen
3. Download the HTML from `screen.getHtml()` to `.design/designs/{page}.html`
4. Download the screenshot from `screen.getImage()` to `.design/screenshots/{page}.png`
5. Post-process the Stitch HTML:
   - Replace the header/nav/footer with your project's shared elements
   - Ensure consistent Tailwind config
   - Wire internal navigation links
6. Save the processed file to `site/public/{page}.html`
7. Update `.design/metadata.json` with the new screen ID

For iterative edits on an existing Stitch screen, use `screen.edit(prompt)` instead of regenerating.

### Step 4: Integrate into the Site

After generating the new page:

1. **Update navigation across ALL existing pages** — add the new page to nav menus
2. **Fix placeholder links** — replace any `href="#"` with real page URLs
3. **Verify cross-page consistency** — header, footer, nav must be identical everywhere
4. **Check internal links** — no broken links between pages

### Step 5: Visual Verification (If Browser Available)

If Playwright CLI or Chrome MCP is available:

1. Start a local server: `npx serve site/public -p 3456`
2. Screenshot the new page at desktop (1280px) and mobile (375px) widths
3. Save screenshots to `.design/screenshots/{page}-desktop.png` and `{page}-mobile.png`
4. Compare visually against the design system
5. Fix any issues (broken layout, wrong colours, inconsistent nav)
6. Stop the server

If no browser automation is available, skip to Step 6.

### Step 6: Update Site Documentation

Edit `.design/SITE.md`:

- Mark the page as complete in Section 4 (Sitemap): `[x] {page}.html — {description}`
- Remove any consumed item from Section 5 (Roadmap) or Section 6 (Ideas)
- Add any new ideas discovered during generation

### Step 7: Write the Next Baton (CRITICAL)

**You MUST update `.design/next-prompt.md` before completing.** This keeps the loop alive.

1. **Choose the next page**:
   - First: Check Section 5 (Roadmap) for pending high-priority items
   - Second: Check Section 5 for medium-priority items
   - Third: Pick from Section 6 (Ideas)
   - Last resort: Invent something that fits the site vision

2. **Write the baton** with:
   - YAML frontmatter (`page`, optional `layout`)
   - Description of the page purpose and content
   - Design system block copied from `.design/DESIGN.md` Section 6
   - Detailed page structure (numbered sections)

3. **If the site is complete** (all roadmap items done, no more ideas):
   - Write a baton with `page: _complete` and a summary of what was built
   - This signals the loop is finished

## Loop Completion

The loop ends when:
- All pages in the roadmap are built (`[x]` in SITE.md Section 4)
- The user says to stop
- The baton contains `page: _complete`

On completion, output a summary:
- Pages built (with links)
- Screenshots (if captured)
- Any remaining ideas for future work

## Cross-Page Consistency Rules

The #1 risk in multi-page generation is **drift** — pages looking slightly different. Prevent this:

| Element | Rule |
|---------|------|
| **Header/Nav** | Copy exact HTML from the most recent page. Never regenerate. |
| **Footer** | Same — copy verbatim, only change active page indicator |
| **Tailwind config** | If using `<script>` config block, it must be identical across pages |
| **Colour values** | Always use the exact hex codes from DESIGN.md, never approximate |
| **Font imports** | Same Google Fonts `<link>` tag across all pages |
| **Spacing scale** | Consistent padding/margin values (document in DESIGN.md) |

## Design Mappings

Use these to transform vague user requests into precise design instructions when writing baton prompts.

### UI/UX Keyword Refinement

| Vague Term | Professional Terminology |
|:---|:---|
| "menu at the top" | "sticky navigation bar with logo and menu items" |
| "big photo" | "full-width hero section with focal-point imagery" |
| "list of things" | "responsive card grid with hover states and subtle elevation" |
| "button" | "primary call-to-action button with hover transition" |
| "form" | "form with labelled input fields, validation states, and submit button" |
| "picture area" | "hero section with background image or video" |
| "sidebar" | "collapsible side navigation with icon-label pairings" |
| "popup" | "modal dialog with overlay and smooth entry animation" |
| "footer stuff" | "footer with sitemap links, contact info, and legal notices" |
| "cards" | "content cards with consistent padding, rounded corners, and shadow" |
| "tabs" | "tabbed interface with active indicator and smooth content transition" |
| "search" | "search input with icon, placeholder text, and results dropdown" |
| "pricing" | "pricing comparison cards with highlighted recommended tier" |
| "testimonials" | "testimonial carousel or grid with avatar, quote, and attribution" |

### Atmosphere and Vibe Descriptors

| Basic Vibe | Enhanced Description |
|:---|:---|
| "Modern" | "Clean, minimal, generous whitespace, high-contrast typography" |
| "Professional" | "Sophisticated, trustworthy, subtle shadows, restricted premium palette" |
| "Fun / Playful" | "Vibrant, rounded corners, bold accent colours, bouncy animations" |
| "Dark Mode" | "High-contrast accents on deep slate or near-black backgrounds" |
| "Luxury" | "Elegant, spacious, fine lines, serif headers, high-fidelity photography" |
| "Tech / Cyber" | "Futuristic, neon accents, glassmorphism, monospaced typography" |
| "Warm / Friendly" | "Soft colours, rounded shapes, handwritten accents, inviting imagery" |
| "Bold / Industrial" | "Strong typography, high contrast, geometric shapes, dark backgrounds" |
| "Organic / Natural" | "Earth tones, soft textures, organic shapes, nature photography" |
| "Editorial" | "Magazine-like layouts, strong typographic hierarchy, generous leading" |

### Geometry, Depth, and Spacing

| Description | Tailwind | Visual Effect |
|:---|:---|:---|
| Pill-shaped | `rounded-full` | Buttons, tags, badges |
| Softly rounded | `rounded-xl` | Cards, containers, modals |
| Gently rounded | `rounded-lg` | Inputs, smaller elements |
| Sharp / precise | `rounded-none` or `rounded-sm` | Technical, brutalist aesthetic |
| Glassmorphism | `backdrop-blur-md bg-white/10 border border-white/20` | Overlays, nav bars |
| Frosted | `backdrop-blur-sm bg-white/80` | Subtle glass effect |

| Elevation | Description | Tailwind |
|:---|:---|:---|
| Flat | No shadows, colour blocking and borders | `shadow-none` |
| Whisper-soft | Diffused, barely visible lift | `shadow-sm` |
| Subtle | Gentle shadow for card elevation | `shadow-md` |
| Floating | High-offset, soft shadow | `shadow-lg` or `shadow-xl` |
| Dramatic | Strong shadow for hero elements or modals | `shadow-2xl` |
| Inset | Inner shadow for pressed or nested elements | `shadow-inner` |

| Section Density | Description | Tailwind |
|:---|:---|:---|
| Tight | Compact, information-dense | `py-8 md:py-12` |
| Balanced | Standard section spacing | `py-12 md:py-16` |
| Generous | Breathing room, premium feel | `py-16 md:py-24` |
| Dramatic | Statement spacing, luxury/editorial | `py-24 md:py-32` |

## SITE.md Template

Use this when bootstrapping a new project. Write to `.design/SITE.md`:

```markdown
# Project Vision

> **AGENT INSTRUCTION:** Read this file before every iteration. It is the project's long-term memory.

## 1. Core Identity

| Field | Value |
|-------|-------|
| **Project Name** | [Name] |
| **Mission** | [What the site achieves] |
| **Target Audience** | [Who uses this site] |
| **Voice & Tone** | [Personality descriptors — warm, professional, playful, etc.] |
| **Region** | [Australia / US / UK — affects spelling, phone format, imagery] |

## 2. Visual Language

Reference these when writing baton prompts.

- **Primary Vibe**: [Main aesthetic — e.g. "Clean and modern"]
- **Secondary Vibe**: [Supporting aesthetic — e.g. "Warm and approachable"]
- **Anti-Vibes**: [What to avoid — e.g. "Not corporate, not cluttered"]

## 3. Technical Setup

- **Output Directory**: `site/public/`
- **CSS**: Tailwind CSS via CDN (no build step)
- **Dark Mode**: [Yes/No] — if yes, via class toggle
- **Fonts**: [Google Fonts import URL]

## 4. Live Sitemap

Update this when a page is successfully generated.

- [x] `index.html` — Homepage with hero, features, CTA
- [ ] `about.html` — Company story and team
- [ ] `services.html` — Service offerings with pricing
- [ ] `contact.html` — Contact form and location map

## 5. Roadmap (Backlog)

Pick the next task from here. Remove items as they're completed.

### High Priority
- [ ] Build about page with team section
- [ ] Build services page with pricing cards

### Medium Priority
- [ ] Build contact page with form
- [ ] Build FAQ page

### Low Priority
- [ ] Blog index page
- [ ] Individual blog post template

## 6. Creative Freedom

When the roadmap is empty, follow these guidelines to add pages:

1. **Stay on-brand** — new pages must fit the established vibe
2. **Enhance the core** — support the site mission
3. **Naming convention** — lowercase, descriptive filenames (e.g. `team.html`)

### Ideas to Explore
- [ ] `testimonials.html` — Customer reviews and case studies
- [ ] `gallery.html` — Project portfolio with image grid
- [ ] `faq.html` — Frequently asked questions with accordion

## 7. Rules of Engagement

1. Do NOT recreate pages already marked `[x]` in Section 4
2. ALWAYS update `.design/next-prompt.md` before completing an iteration
3. Remove consumed ideas from Section 6
4. Copy header/nav/footer from existing pages — never regenerate
5. All internal links must point to real pages
```

## DESIGN.md Template

Generate using the `design-system` skill, or create manually. Write to `.design/DESIGN.md`:

```markdown
# Design System: [Project Name]

## 1. Visual Theme & Atmosphere

[Describe the mood, density, and aesthetic philosophy. Use evocative language.]

## 2. Colour Palette & Roles

| Role | Name | Value | Usage |
|------|------|-------|-------|
| Primary | [Name] | `#hexcode` | Buttons, links, active states |
| Primary Foreground | [Name] | `#hexcode` | Text on primary backgrounds |
| Secondary | [Name] | `#hexcode` | Supporting elements, badges |
| Background | [Name] | `#hexcode` | Page background |
| Surface | [Name] | `#hexcode` | Cards, containers |
| Text Primary | [Name] | `#hexcode` | Headings, body text |
| Text Secondary | [Name] | `#hexcode` | Captions, metadata |
| Border | [Name] | `#hexcode` | Dividers, input borders |
| Accent | [Name] | `#hexcode` | Highlights, notifications |

## 3. Typography

| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|-------------|
| H1 | [Font] | 700 | 3rem | 1.1 |
| H2 | [Font] | 600 | 2rem | 1.2 |
| H3 | [Font] | 600 | 1.5rem | 1.3 |
| Body | [Font] | 400 | 1rem | 1.6 |
| Small | [Font] | 400 | 0.875rem | 1.5 |

## 4. Component Styles

Document each component: Buttons (primary, secondary, hover), Cards (bg, border, radius, shadow, padding), Navigation (sticky/static, active indicator, mobile pattern), Forms (input style, labels, validation colours).

## 5. Layout Principles

Max content width, section padding, grid system, whitespace philosophy.

## 6. Design System Notes for Generation

**Copy this entire block into every baton prompt:**

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first, responsive
- Theme: [Light/Dark], [descriptors]
- Background: [Description] (#hex)
- Surface: [Description] (#hex)
- Primary: [Description] (#hex) for [role]
- Text: [Description] (#hex)
- Font: [Font name] via Google Fonts
- Corners: [Description]
- Shadows: [Description]
- Spacing: [Description]
```

## File Structure

```
project/
├── .design/
│   ├── SITE.md              # Project vision, sitemap, roadmap
│   ├── DESIGN.md            # Visual design system (source of truth)
│   ├── next-prompt.md       # The baton — current/next task
│   ├── metadata.json        # Stitch project/screen IDs (if using Stitch)
│   └── screenshots/         # Visual verification captures
├── site/
│   └── public/              # Production pages
└── .gitignore               # Add .design/screenshots/
```

## Tips

- **Start with the homepage** — it establishes the visual language for everything else
- **Read existing pages before generating** — consistency comes from copying, not recreating
- **One page per iteration** — don't try to generate multiple pages at once
- **Include the design system in every baton** — Claude needs it fresh each time
- **Use the roadmap** — don't generate pages randomly; follow the user's priority order
- **Wire navigation early** — even link to pages that don't exist yet (they will soon)

## Common Pitfalls

- Forgetting to update `.design/next-prompt.md` (breaks the loop)
- Recreating a page that already exists in the sitemap
- Regenerating the header/nav instead of copying from existing pages
- Not including the design system block in the baton prompt
- Leaving `href="#"` placeholder links instead of real page URLs
- Inconsistent Tailwind config across pages
