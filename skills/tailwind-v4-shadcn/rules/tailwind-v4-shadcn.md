---
paths: "**/*.css", "**/*.tsx", "**/*.jsx", tailwind.config.*, components.json, postcss.config.*
---

# Tailwind v4 + shadcn/ui Corrections

Claude's training may reference Tailwind v3 patterns. This project uses **Tailwind v4** with different syntax.

## Critical Differences from v3

### Configuration
- **No `tailwind.config.ts`** - v4 uses CSS-first config with `@theme` blocks
- **No PostCSS setup** - Use `@tailwindcss/vite` plugin instead
- **`components.json`** must have `"config": ""` (empty string)

### CSS Syntax
```css
/* ❌ v3 (Claude may suggest this) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ✅ v4 (use this) */
@import "tailwindcss";
```

### Theme Configuration
```css
/* ❌ v3 - tailwind.config.ts */
theme: { colors: { primary: '#3b82f6' } }

/* ✅ v4 - in CSS file */
@theme inline {
  --color-primary: var(--primary);
  --color-background: var(--background);
}
```

### Animations Package
```bash
# ❌ v3 package (deprecated for v4)
pnpm add tailwindcss-animate

# ✅ v4 package
pnpm add -D tw-animate-css
```

```css
/* ✅ v4 import */
@import "tailwindcss";
@import "tw-animate-css";
```

### Plugins
```css
/* ❌ v3 - require() in config */
plugins: [require('@tailwindcss/typography')]

/* ✅ v4 - @plugin directive in CSS */
@plugin "@tailwindcss/typography";
```

### @apply Directive
```css
/* ❌ Deprecated in v4 */
.btn { @apply px-4 py-2 bg-primary; }

/* ✅ Use direct classes or CSS */
.btn { padding: 0.5rem 1rem; background-color: var(--primary); }
```

## Variable Architecture

CSS variables must follow this structure:

```css
/* 1. Define at root (NOT inside @layer base) */
:root {
  --background: hsl(0 0% 100%);  /* hsl() wrapper required */
  --primary: hsl(221.2 83.2% 53.3%);
}

.dark {
  --background: hsl(222.2 84% 4.9%);
  --primary: hsl(217.2 91.2% 59.8%);
}

/* 2. Map to Tailwind utilities */
@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
}

/* 3. Apply base styles (NO hsl wrapper here) */
@layer base {
  body {
    background-color: var(--background);
    color: var(--foreground);
  }
}
```

## Dark Mode

- No `dark:` variants needed for semantic colors - theme switches automatically
- Just use `bg-background`, `text-foreground`, etc.
- ThemeProvider toggles `.dark` class on `<html>` element

## Quick Fixes

| If Claude suggests... | Use instead... |
|----------------------|----------------|
| `@tailwind base` | `@import "tailwindcss"` |
| `tailwind.config.ts` | `@theme inline` in CSS |
| `tailwindcss-animate` | `tw-animate-css` |
| `require('@plugin')` | `@plugin "@plugin"` |
| `@apply` | Direct CSS or utility classes |
| `hsl(var(--color))` | `var(--color)` (already has hsl) |
