---
name: tailwind-theme-builder
description: >
  Set up Tailwind v4 with shadcn/ui themed UI. Workflow: install dependencies,
  configure CSS variables with @theme inline, set up dark mode, verify.
  Use when initialising React projects with Tailwind v4, setting up shadcn/ui theming,
  or fixing colors not working, tw-animate-css errors, @theme inline dark mode conflicts,
  @apply breaking, v3 migration issues.
compatibility: Designed for Claude Code (or similar products)
---

# Tailwind Theme Builder

Set up a fully themed Tailwind v4 + shadcn/ui project with dark mode. Produces configured CSS, theme provider, and working component library.

## Architecture: The Four-Step Pattern

Tailwind v4 requires a specific architecture for CSS variable-based theming. This pattern is **mandatory** -- skipping or modifying steps breaks the theme.

### How It Works

```
CSS Variable Definition --> @theme inline Mapping --> Tailwind Utility Class
--background           --> --color-background     --> bg-background
(with hsl() wrapper)      (references variable)     (generated class)
```

Dark mode switching:
```
ThemeProvider toggles .dark class on <html>
  --> CSS variables update automatically (.dark overrides :root)
  --> Tailwind utilities reference updated variables
  --> UI updates without re-render
```

### Best Practices

- **Semantic names:** Use `--primary` not `--blue-500`
- **Foreground pairing:** Every background colour needs a foreground (`--primary` + `--primary-foreground`)
- **WCAG contrast:** Normal text 4.5:1, large text 3:1, UI components 3:1
- **Chart colours:** Use separate variables with `@theme inline` mapping, reference via `var(--chart-1)` in style props

---

## Workflow

### Step 1: Install Dependencies

```bash
pnpm add tailwindcss @tailwindcss/vite
pnpm add -D @types/node tw-animate-css
pnpm dlx shadcn@latest init

# Delete v3 config if it exists
rm -f tailwind.config.ts
```

### Step 2: Configure Vite

Copy `assets/vite.config.ts` or add the Tailwind plugin:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } }
})
```

### Step 3: Four-Step CSS Architecture (Mandatory)

This exact order is required. Skipping steps breaks the theme.

**src/index.css:**

```css
@import "tailwindcss";
@import "tw-animate-css";

/* 1. Define CSS variables at root (NOT inside @layer base) */
:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(222.2 84% 4.9%);
  --primary: hsl(221.2 83.2% 53.3%);
  --primary-foreground: hsl(210 40% 98%);
  /* ... all semantic tokens */
}

.dark {
  --background: hsl(222.2 84% 4.9%);
  --foreground: hsl(210 40% 98%);
  --primary: hsl(217.2 91.2% 59.8%);
  --primary-foreground: hsl(222.2 47.4% 11.2%);
}

/* 2. Map variables to Tailwind utilities */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
}

/* 3. Apply base styles (NO hsl() wrapper here) */
@layer base {
  body {
    background-color: var(--background);
    color: var(--foreground);
  }
}
```

**Result:** `bg-background`, `text-primary` etc. work automatically. Dark mode switches via `.dark` class -- no `dark:` variants needed for semantic colours.

### Step 4: Set Up Dark Mode

Copy `assets/theme-provider.tsx` to your components directory, then wrap your app:

```typescript
import { ThemeProvider } from '@/components/theme-provider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <App />
  </ThemeProvider>
)
```

Add a theme toggle -- install the dropdown menu then use the ModeToggle component below:

```bash
pnpm dlx shadcn@latest add dropdown-menu
```

```typescript
// src/components/mode-toggle.tsx
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Step 5: Configure components.json

```json
{
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  }
}
```

`"config": ""` is critical -- v4 doesn't use tailwind.config.ts.

---

## Critical Rules

**Always:**
- Wrap colours with `hsl()` in `:root`/`.dark`
- Use `@theme inline` to map all CSS variables
- Use `@tailwindcss/vite` plugin (NOT PostCSS)
- Delete `tailwind.config.ts` if it exists

**Never:**
- Put `:root`/`.dark` inside `@layer base`
- Use `.dark { @theme { } }` (v4 doesn't support nested @theme)
- Double-wrap: `hsl(var(--background))`
- Use `@apply` with `@layer base` classes (use `@utility` instead)

---

## All 18 Gotchas

### Quick Diagnosis

| # | Symptom | Cause | Fix |
|---|---------|-------|-----|
| 1 | Variables ignored / theme broken | `:root` inside `@layer base` | Move `:root` and `.dark` to root level |
| 2 | Dark mode colours not switching | `.dark { @theme { } }` | Use CSS variables + single `@theme inline` |
| 3 | Colours all black/white | Double `hsl()` wrapping | Use `var(--background)` not `hsl(var(...))` |
| 4 | `bg-primary` not generated | Colours in `tailwind.config.ts` | Delete config, use `@theme inline` |
| 5 | `bg-background` class missing | No `@theme inline` block | Add `@theme inline` mapping variables |
| 6 | shadcn components break | `components.json` has config path | Set `"config": ""` (empty string) |
| 7 | Tailwind not processing | Using PostCSS plugin | Switch to `@tailwindcss/vite` plugin |
| 8 | `@/` imports fail | Missing path aliases | Add `paths` to `tsconfig.app.json` |
| 9 | Redundant `dark:` variants | Using `dark:bg-primary-dark` | Just use `bg-primary` -- variables handle it |
| 10 | Hardcoded colours everywhere | Using `bg-blue-600 dark:bg-blue-400` | Use semantic tokens: `bg-primary` |
| 11 | Class merging bugs | String concatenation for classes | Use `cn()` from `@/lib/utils` |
| 12 | Radix Select crashes | Empty string value `value=""` | Use `value="placeholder"` |
| 13 | Wrong Tailwind version | Installed `tailwindcss@^3` | Install `tailwindcss@^4.1.0` + `@tailwindcss/vite` |
| 14 | Missing peer deps | Only installed `tailwindcss` | Also install `clsx`, `tailwind-merge`, `@types/node` |
| 15 | Broken in dark mode | Only tested light mode | Test light, dark, system, and toggle transitions |
| 16 | Fails WCAG contrast | Looks fine visually | Check ratios: 4.5:1 normal text, 3:1 large/UI |
| 17 | Build fails on animation import | Using `tailwindcss-animate` (deprecated) | Use `tw-animate-css` or native CSS animations |
| 18 | CSS priority issues | Duplicate `@layer base` after shadcn init | Merge into single `@layer base` block |

### Gotcha Details with Code Examples

**#1 -- :root inside @layer base**

Tailwind v4 strips CSS outside `@theme`/`@layer`, but `:root` must be at root level to persist. This is the most common setup failure.

WRONG:
```css
@layer base {
  :root { --background: hsl(0 0% 100%); }
}
```

CORRECT:
```css
:root { --background: hsl(0 0% 100%); }
@layer base {
  body { background-color: var(--background); }
}
```

**#2 -- Nested @theme**

Tailwind v4 does not support `@theme` inside selectors. Use CSS variables in `:root`/`.dark` with a single `@theme inline` block.

WRONG:
```css
@theme { --color-primary: hsl(0 0% 0%); }
.dark { @theme { --color-primary: hsl(0 0% 100%); } }
```

CORRECT:
```css
:root { --primary: hsl(0 0% 0%); }
.dark { --primary: hsl(0 0% 100%); }
@theme inline { --color-primary: var(--primary); }
```

**#3 -- Double hsl() wrapping**

Variables already contain `hsl()`. Double-wrapping creates `hsl(hsl(...))`.

WRONG: `background-color: hsl(var(--background));`
CORRECT: `background-color: var(--background);`

**#4 -- Colours in tailwind.config.ts**

Tailwind v4 completely ignores `theme.extend.colors` in config files. Delete the file or leave it empty. Set `"config": ""` in `components.json`.

**#5 -- Missing @theme inline**

Without `@theme inline`, Tailwind has no knowledge of your CSS variables. Utility classes like `bg-background` simply won't be generated.

WRONG:
```css
:root { --background: hsl(0 0% 100%); }
/* No @theme inline block -- bg-background won't exist */
```

CORRECT:
```css
:root { --background: hsl(0 0% 100%); }
@theme inline { --color-background: var(--background); }
```

**#7 -- PostCSS vs Vite plugin**

WRONG:
```typescript
export default defineConfig({
  css: { postcss: './postcss.config.js' }  // Old v3 way
})
```

CORRECT:
```typescript
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [react(), tailwindcss()]  // v4 way
})
```

**#8 -- Path aliases**

Add to `tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

**#11 -- cn() utility for class merging**

WRONG: `` className={`base ${isActive && 'active'}`} ``
CORRECT: `className={cn("base", isActive && "active")}`

`cn()` from `@/lib/utils` properly merges and deduplicates Tailwind classes.

**#12 -- Radix Select empty value**

Radix UI Select does not allow empty string values. Use `value="placeholder"` instead of `value=""`.

**#14 -- Required dependencies**

```json
{
  "dependencies": {
    "tailwindcss": "^4.1.0",
    "@tailwindcss/vite": "^4.1.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@types/node": "^24.0.0"
  }
}
```

**#17 -- tw-animate-css**

`tailwindcss-animate` is deprecated in Tailwind v4. shadcn/ui docs may still reference it. Causes build failures and import errors. Use `tw-animate-css` or `@tailwindcss/motion` instead.

**#18 -- Duplicate @layer base after shadcn init**

`shadcn init` adds its own `@layer base` block. Check `src/index.css` immediately after running init and merge any duplicate blocks into one.

WRONG:
```css
@layer base { body { background-color: var(--background); } }
@layer base { * { border-color: hsl(var(--border)); } }  /* duplicate from shadcn */
```

CORRECT:
```css
@layer base {
  * { border-color: var(--border); }
  body { background-color: var(--background); color: var(--foreground); }
}
```

### Prevention Checklist

- [ ] No `tailwind.config.ts` file (or it's empty)
- [ ] `components.json` has `"config": ""`
- [ ] All colors have `hsl()` wrapper in `:root`
- [ ] `@theme inline` maps all variables
- [ ] `@layer base` doesn't wrap `:root`
- [ ] Theme provider wraps app
- [ ] Tested in light, dark, and system modes
- [ ] All text has sufficient contrast

---

## Dark Mode Testing Checklist

- [ ] Light mode displays correctly
- [ ] Dark mode displays correctly
- [ ] System mode respects OS setting
- [ ] Theme persists after page refresh
- [ ] Toggle component shows current state
- [ ] All text has proper contrast
- [ ] No flash of wrong theme on load
- [ ] Works in incognito mode (graceful fallback)

---

## Asset Files

Copy from `assets/` directory:
- `index.css` -- Complete CSS with all colour variables
- `components.json` -- shadcn/ui v4 config
- `vite.config.ts` -- Vite + Tailwind plugin
- `theme-provider.tsx` -- Dark mode provider
- `utils.ts` -- `cn()` utility

## Reference Files

- `references/migration-guide.md` -- v3 to v4 migration

## Official Documentation

- shadcn/ui Tailwind v4 Guide: https://ui.shadcn.com/docs/tailwind-v4
- shadcn/ui Dark Mode (Vite): https://ui.shadcn.com/docs/dark-mode/vite
- shadcn/ui Theming: https://ui.shadcn.com/docs/theming
- Tailwind v4 Docs: https://tailwindcss.com/docs
- Tailwind Dark Mode: https://tailwindcss.com/docs/dark-mode
