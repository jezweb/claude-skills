---
name: color-palette
description: >
  Generate complete, accessible colour palettes from a single brand hex.
  Produces 11-shade scale (50-950), semantic tokens, dark mode variants,
  and Tailwind v4 CSS output. Includes WCAG contrast checking.
  Use when setting up design systems, creating Tailwind themes, building brand
  colours from a hex value, or checking colour accessibility.
compatibility: Designed for Claude Code (or similar products)
---

# Colour Palette Generator

Generate a complete, accessible colour system from a single brand hex. Produces Tailwind v4 CSS ready to paste into your project.

## Workflow

### Step 1: Get the Brand Hex

Ask for the primary brand colour. A single hex like `#0D9488` is enough.

### Step 2: Generate 11-Shade Scale

Convert hex to HSL, then generate shades by varying lightness while keeping hue constant.

#### Hex to HSL Conversion

```javascript
function hexToHSL(hex) {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let l = (max + min) / 2;
  let s = 0;
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
  }

  let h = 0;
  if (diff !== 0) {
    if (max === r) h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / diff + 2) / 6;
    else h = ((r - g) / diff + 4) / 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
```

#### Lightness and Saturation Values

| Shade | Lightness | Saturation Mult | Use Case |
|-------|-----------|-----------------|----------|
| 50 | 97% | 0.80 | Subtle backgrounds |
| 100 | 94% | 0.80 | Hover states |
| 200 | 87% | 0.85 | Borders, dividers |
| 300 | 75% | 0.90 | Disabled states |
| 400 | 62% | 0.95 | Placeholder text |
| 500 | 48% | 1.00 | **Brand colour baseline** |
| 600 | 40% | 1.00 | Primary actions (often the brand colour) |
| 700 | 33% | 1.00 | Hover on primary |
| 800 | 27% | 1.00 | Active states |
| 900 | 20% | 1.00 | Text on light bg |
| 950 | 10% | 1.00 | Darkest accents |

Reduce saturation for lighter shades (50-200 by 15-20%, 300-400 by 5-10%) to prevent overly vibrant pastels. Keep full saturation for 500-950.

#### Complete Scale Generator

```javascript
function generateShadeScale(brandHex) {
  const { h, s } = hexToHSL(brandHex);
  const shades = {
    50:  { l: 97, sMul: 0.8 },  100: { l: 94, sMul: 0.8 },
    200: { l: 87, sMul: 0.85 }, 300: { l: 75, sMul: 0.9 },
    400: { l: 62, sMul: 0.95 }, 500: { l: 48, sMul: 1.0 },
    600: { l: 40, sMul: 1.0 },  700: { l: 33, sMul: 1.0 },
    800: { l: 27, sMul: 1.0 },  900: { l: 20, sMul: 1.0 },
    950: { l: 10, sMul: 1.0 }
  };
  const result = {};
  for (const [shade, { l, sMul }] of Object.entries(shades)) {
    result[shade] = `hsl(${h}, ${Math.round(s * sMul)}%, ${l}%)`;
  }
  return result;
}
```

#### HSL to Hex Conversion

```javascript
function hslToHex(h, s, l) {
  s = s / 100; l = l / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}
```

#### Verification

Generated shades should look like the same colour family with smooth progression. Light shades (50-300) usable for backgrounds, dark shades (700-950) usable for text. Brand colour recognisable in 500-700.

---

### Step 3: Map Semantic Tokens

Every background token MUST have a paired foreground token. Never use a background without its pair or dark mode will break.

#### Light Mode Tokens

| Token | Shade | Use Case |
|-------|-------|----------|
| `background` | white | Page backgrounds |
| `foreground` | 950 | Body text |
| `card` | white | Card backgrounds |
| `card-foreground` | 900 | Card text |
| `popover` | white | Dropdown/tooltip backgrounds |
| `popover-foreground` | 950 | Dropdown text |
| `primary` | 600 | Primary buttons, links |
| `primary-foreground` | white | Text on primary buttons |
| `secondary` | 100 | Secondary buttons |
| `secondary-foreground` | 900 | Text on secondary buttons |
| `muted` | 50 | Disabled backgrounds, subtle sections |
| `muted-foreground` | 600 | Muted text, captions |
| `accent` | 100 | Hover states, subtle highlights |
| `accent-foreground` | 900 | Text on accent backgrounds |
| `destructive` | red-600 | Delete buttons, errors |
| `destructive-foreground` | white | Text on destructive buttons |
| `border` | 200 | Input borders, dividers |
| `input` | 200 | Input field borders |
| `ring` | 600 | Focus rings |

#### Dark Mode Tokens

| Token | Shade | Use Case |
|-------|-------|----------|
| `background` | 950 | Page backgrounds |
| `foreground` | 50 | Body text |
| `card` | 900 | Card backgrounds |
| `card-foreground` | 50 | Card text |
| `popover` | 900 | Dropdown backgrounds |
| `popover-foreground` | 50 | Dropdown text |
| `primary` | 500 | Primary buttons (brighter in dark) |
| `primary-foreground` | white | Text on primary buttons |
| `secondary` | 800 | Secondary buttons |
| `secondary-foreground` | 50 | Text on secondary buttons |
| `muted` | 800 | Disabled backgrounds |
| `muted-foreground` | 400 | Muted text |
| `accent` | 800 | Hover states |
| `accent-foreground` | 50 | Text on accent backgrounds |
| `destructive` | red-500 | Delete buttons (brighter) |
| `destructive-foreground` | white | Text on destructive |
| `border` | 800 | Borders |
| `input` | 800 | Input borders |
| `ring` | 500 | Focus rings |

#### Dark Mode Inversion Pattern

Dark mode inverts lightness while preserving hue and saturation. Swap extremes (50 becomes 950, 950 becomes 50), preserve middle (500 stays near 500).

| Light Shade | Dark Equivalent | Role |
|-------------|-----------------|------|
| 50 | 950 | Backgrounds |
| 100 | 900 | Subtle backgrounds |
| 200 | 800 | Borders |
| 500 | 500 (slightly brighter) | Brand baseline |
| 600 | 400 | Primary actions |
| 950 | 50 | Text colour |

Key dark mode principles:
- Use shade 500 (not 600) for primary -- brighter for visibility on dark backgrounds
- Use shade 50 (off-white) for text instead of pure `#FFFFFF` -- easier on eyes
- Borders need ~10-15% lighter than background (e.g. 800 border on 950 background)
- Higher elevation = lighter colour (opposite of light mode shadows)
- Always update foreground when changing background

---

### Step 4: Check Contrast

#### WCAG Minimum Ratios

| Content Type | AA | AAA |
|--------------|-----|-----|
| Normal text (<18px or <14px bold) | 4.5:1 | 7:1 |
| Large text (>=18px or >=14px bold) | 3:1 | 4.5:1 |
| UI components (buttons, borders) | 3:1 | Not defined |
| Graphical objects (icons, charts) | 3:1 | Not defined |

Target AA for most projects, AAA for high-accessibility needs (government, healthcare).

#### Luminance and Contrast Formulas

```javascript
function getLuminance(hex) {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}
```

#### Quick Check Table -- Light Mode

| Foreground | Background | Ratio | Pass? | Use Case |
|------------|------------|-------|-------|----------|
| 950 | white | 18.5:1 | AAA | Body text |
| 900 | white | 14.2:1 | AAA | Card text |
| 700 | white | 8.1:1 | AAA | Text |
| 600 | white | 5.7:1 | AA | Text, buttons |
| 500 | white | 3.9:1 | Fail | Too light for text |
| white | 600 | 5.7:1 | AA | Button text |
| white | 700 | 8.1:1 | AAA | Button text |
| 600 | 50 | 5.4:1 | AA | Muted section text |

#### Quick Check Table -- Dark Mode

| Foreground | Background | Ratio | Pass? | Use Case |
|------------|------------|-------|-------|----------|
| 50 | 950 | 18.5:1 | AAA | Body text |
| 50 | 900 | 14.2:1 | AAA | Card text |
| 400 | 950 | 8.2:1 | AAA | Muted text |
| 400 | 900 | 6.3:1 | AA | Muted text |
| white | 600 | 5.7:1 | AA | Button text |

**Rule of thumb**: For text, aim for 50%+ lightness difference between foreground and background.

#### Essential Pairs to Verify

1. **Body text**: foreground on background (light: 950 on white = 18.5:1, dark: 50 on 950 = 18.5:1)
2. **Primary button**: primary-foreground on primary (light: white on 600 = 5.7:1, dark: white on 500 = 3.9:1 -- borderline)
3. **Muted text**: muted-foreground on muted (light: 600 on 50 = 5.4:1, dark: 400 on 800 = 4.1:1 -- may fail)
4. **Card text**: card-foreground on card (light: 900 on white = 14.2:1, dark: 50 on 900 = 14.2:1)

#### Fixing Common Contrast Failures

**White on primary-500 fails (3.9:1)**: Use primary-600 instead (5.7:1), or use dark text on the button.

**Muted text in dark mode fails (400 on 800 = 4.1:1)**: Use 300 on 900 = 6.8:1.

**Links hard to see (500 on white = 3.9:1)**: Use primary-700 (8.1:1), or add underline decoration.

---

### Step 5: Output Tailwind v4 CSS

```css
@import "tailwindcss";

@theme {
  /* Shade scale */
  --color-primary-50: #F0FDFA;
  --color-primary-100: #CCFBF1;
  --color-primary-200: #99F6E4;
  --color-primary-300: #5EEAD4;
  --color-primary-400: #2DD4BF;
  --color-primary-500: #14B8A6;
  --color-primary-600: #0D9488;
  --color-primary-700: #0F766E;
  --color-primary-800: #115E59;
  --color-primary-900: #134E4A;
  --color-primary-950: #042F2E;

  /* Light mode semantic tokens */
  --color-background: #FFFFFF;
  --color-foreground: var(--color-primary-950);
  --color-card: #FFFFFF;
  --color-card-foreground: var(--color-primary-900);
  --color-popover: #FFFFFF;
  --color-popover-foreground: var(--color-primary-950);
  --color-primary: var(--color-primary-600);
  --color-primary-foreground: #FFFFFF;
  --color-secondary: var(--color-primary-100);
  --color-secondary-foreground: var(--color-primary-900);
  --color-muted: var(--color-primary-50);
  --color-muted-foreground: var(--color-primary-600);
  --color-accent: var(--color-primary-100);
  --color-accent-foreground: var(--color-primary-900);
  --color-destructive: #DC2626;
  --color-destructive-foreground: #FFFFFF;
  --color-border: var(--color-primary-200);
  --color-input: var(--color-primary-200);
  --color-ring: var(--color-primary-600);
  --radius: 0.5rem;
}

/* Dark mode overrides */
.dark {
  --color-background: var(--color-primary-950);
  --color-foreground: var(--color-primary-50);
  --color-card: var(--color-primary-900);
  --color-card-foreground: var(--color-primary-50);
  --color-popover: var(--color-primary-900);
  --color-popover-foreground: var(--color-primary-50);
  --color-primary: var(--color-primary-500);
  --color-primary-foreground: #FFFFFF;
  --color-secondary: var(--color-primary-800);
  --color-secondary-foreground: var(--color-primary-50);
  --color-muted: var(--color-primary-800);
  --color-muted-foreground: var(--color-primary-400);
  --color-accent: var(--color-primary-800);
  --color-accent-foreground: var(--color-primary-50);
  --color-destructive: #EF4444;
  --color-destructive-foreground: #FFFFFF;
  --color-border: var(--color-primary-800);
  --color-input: var(--color-primary-800);
  --color-ring: var(--color-primary-500);
}
```

Copy `assets/tailwind-colors.css` as a starting template.

---

## Component Usage Examples

```tsx
// Primary button
<button className="bg-primary text-primary-foreground hover:bg-primary/90">Click me</button>

// Secondary button
<button className="bg-secondary text-secondary-foreground hover:bg-secondary/80">Cancel</button>

// Card
<div className="bg-card text-card-foreground border-border rounded-lg">
  <h2>Title</h2>
  <p className="text-muted-foreground">Description</p>
</div>

// Input
<input className="bg-background text-foreground border-input focus:ring-ring" />
```

---

## Common Adjustments

- **Too vibrant at light shades**: Reduce saturation by 10-20%
- **Poor contrast on primary**: Use shade 700+ for text
- **Dark mode too dark**: Use shade 900 instead of 950 for backgrounds
- **Brand colour too light/dark**: Adjust to shade 500-600 range
- **Dark mode looks washed out**: Use shade 500 for primary (brighter than light mode's 600)
- **Pure white text too harsh in dark mode**: Use shade 50 (off-white) instead
- **Dark mode muted text fails contrast**: Use more extreme shades (300 on 900 instead of 400 on 800)

### Brand Identity Adjustments

- **Conservative brands** (finance, law): Use primary-700 for buttons, reduce saturation in light shades
- **Vibrant brands** (creative, tech): Use primary-500-600, keep full saturation
- **Minimal brands** (design, architecture): Use primary sparingly, emphasise muted tones, subtle borders (primary-100)

---

## Verification Checklist

- [ ] Body text: >=4.5:1 (normal) or >=3:1 (large)
- [ ] Primary button text: >=4.5:1
- [ ] Secondary button text: >=4.5:1
- [ ] Muted text: >=4.5:1
- [ ] Links: >=4.5:1 (or underlined)
- [ ] UI elements (borders): >=3:1
- [ ] Focus indicators: >=3:1
- [ ] Error text: >=4.5:1
- [ ] Dark mode: All above checks pass
- [ ] Every background has a foreground pair
- [ ] Brand colour recognisable in both modes
- [ ] Borders visible but not harsh
- [ ] Cards/sections have clear boundaries

**Test both modes before shipping.**

---

## Optional References

- **Online contrast checkers**: WebAIM (webaim.org/resources/contrastchecker), Coolors (coolors.co/contrast-checker), Accessible Colors (accessible-colors.com)
- **CI/CD contrast tests**: Use `getContrastRatio()` in test suites to assert minimum ratios for all token pairs
- **Transparent/gradient edge cases**: For colours with opacity, calculate against final rendered colour. For gradients, check both endpoints.
- **OLED dark mode**: Use `@media (prefers-contrast: high)` with `#000000` background for battery savings on AMOLED screens
- **Multi-colour palettes**: Generate separate shade scales for each brand colour, map to different semantic roles (primary, accent)
- **Palette visualisation tools**: coolors.co, paletton.com, Figma swatches
- `assets/tailwind-colors.css` — Complete CSS output template
