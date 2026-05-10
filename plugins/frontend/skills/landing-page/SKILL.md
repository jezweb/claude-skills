---
name: landing-page
description: "Generate a complete, deployable landing page from a brief. Produces a single self-contained HTML file with Tailwind CSS (via CDN), responsive design, dark mode, semantic HTML, and OG meta tags. Sections: hero with CTA, features, social proof, pricing (optional), FAQ, footer. Use when building a marketing page, product launch page, coming soon page, or any standalone landing page. Triggers: 'landing page', 'create a page', 'marketing page', 'launch page', 'coming soon page', 'one-page site'."
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
compatibility: Designed for Claude Code (or similar products)
---

# Landing Page Generator

Generate a complete, deployable landing page as a single HTML file. No build step, no dependencies — open it in a browser or deploy anywhere.

## Workflow

### 1. Gather the Brief

Ask the user for:

| Field | Required | Example |
|-------|----------|---------|
| Business/product name | Yes | "Acme Plumbing" |
| Value proposition | Yes | "24/7 emergency plumbing across Newcastle" |
| Target audience | Yes | "Homeowners in the Hunter Valley" |
| Primary CTA | Yes | "Call Now" / "Get a Quote" / "Sign Up" |
| Secondary CTA | No | "Learn More" / "View Pricing" |
| Brand colours | No | Primary: #1E40AF, accent: #F59E0B |
| Logo URL or text | No | URL to logo image, or just use business name |
| Phone / email | No | For contact section |
| Sections wanted | No | Default: hero, features, testimonials, FAQ, footer |

If no brand colours provided, suggest using the `color-palette` skill to generate them, or use a sensible default (slate/blue).

### 2. Generate the HTML

Produce a **single HTML file** with:

```
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <!-- Meta, OG tags, favicon -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind config with custom colours</script>
</head>
<body>
  <!-- Nav -->
  <!-- Hero -->
  <!-- Features -->
  <!-- Social Proof -->
  <!-- Pricing (optional) -->
  <!-- FAQ -->
  <!-- Footer -->
  <!-- Dark mode toggle script -->
</body>
</html>
```

### 3. Section Patterns

#### Navigation
- Sticky top nav with logo/name + anchor links to sections
- Mobile hamburger menu (CSS-only or minimal JS)
- CTA button in nav (right-aligned)

#### Hero
- Full-width, above the fold
- Headline (h1) — the value proposition, not the business name
- Subheadline — supporting detail, 1-2 sentences
- Primary CTA button (large, contrasting colour)
- Optional: hero image placeholder or gradient background
- Pattern: text-left on desktop (60/40 split with image), centred on mobile

#### Features / Services
- 3-6 items in a responsive grid (1 col mobile, 2-3 cols desktop)
- Each: icon placeholder + heading + short description
- Use semantic headings (h2 for section, h3 for items)

#### Social Proof / Testimonials
- 2-3 testimonial cards with quote, name, role/company
- Star rating if applicable
- Alternative: logo bar of client/partner logos

#### Pricing (optional)
- 2-3 tier cards (basic/pro/enterprise pattern)
- Highlighted "recommended" tier
- Feature comparison list per tier
- CTA button per tier

#### FAQ
- Accordion pattern (details/summary — no JS needed)
- 4-6 common questions
- Schema.org FAQPage markup for SEO

#### Footer
- Business name, contact info, social links
- Legal links (privacy, terms) as placeholders
- Copyright year (use JS for auto-update)

### 4. Technical Requirements

**Responsive**: Mobile-first with three breakpoints
```
Default: mobile (< 640px)
sm: 640px+ (tablet)
lg: 1024px+ (desktop)
```

**Dark mode**: Three-state toggle (light/dark/system)
- CSS custom properties for colours
- `.dark` class on `<html>` — no CSS media query
- Small JS snippet for toggle + localStorage persistence

**Accessibility**:
- Proper heading hierarchy (h1 → h2 → h3, no skips)
- Alt text placeholders on all images
- Focus-visible styles on interactive elements
- Sufficient colour contrast (4.5:1 minimum)
- Skip-to-content link

**SEO**:
- Semantic HTML5 elements (header, main, section, footer)
- OG meta tags (title, description, image, url)
- Twitter card meta tags
- Canonical URL
- JSON-LD for LocalBusiness if it's a local business (reference `seo-local-business` skill)

**Performance**:
- No JS required for core content rendering
- Lazy-load images (`loading="lazy"`)
- System font stack (no external font requests)
- Single file — no external CSS/JS beyond Tailwind CDN

### 5. Colour Application

If user provides brand colours, configure Tailwind inline:

```html
<script>
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1E40AF', light: '#3B82F6', dark: '#1E3A8A' },
        accent: { DEFAULT: '#F59E0B', light: '#FBBF24', dark: '#D97706' },
      }
    }
  }
}
</script>
```

If no colours provided, use Tailwind's built-in palette (slate for neutrals, blue for primary).

### 6. Output

Write the file to the user's specified location, or default to `./index.html`.

After generating:
1. Tell the user how to preview: `open index.html` (macOS) or `python3 -m http.server` for a local server
2. Suggest deployment options: drag to Cloudflare Pages, Netlify drop, or `wrangler deploy` for Workers
3. List placeholder content that needs replacing (images, testimonials, phone numbers)

## Quality Rules

1. **No placeholder lorem ipsum** — generate realistic placeholder text based on the business type
2. **No broken layouts** — test the responsive grid mentally: 1 col → 2 col → 3 col
3. **No inline styles** — use Tailwind classes exclusively
4. **Real interactions** — smooth scroll to sections, working accordion, working dark mode toggle
5. **Accessible by default** — don't sacrifice accessibility for aesthetics
6. **Australian conventions** — if the business is Australian, use +61 phone format, Australian spelling, ABN placeholder

## Variations

| Request | Approach |
|---------|----------|
| "Coming soon page" | Hero only + email signup form + countdown timer |
| "Product launch" | Hero + features + pricing + CTA-heavy |
| "Portfolio" | Hero + project grid + about + contact |
| "Event page" | Hero + schedule + speakers + venue + register CTA |
| "App download" | Hero + features + screenshots + app store badges |

Adapt the section selection to match the page purpose. Not every page needs pricing or FAQ.
