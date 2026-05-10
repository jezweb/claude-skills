---
name: react-patterns
description: "React 19 performance patterns and composition architecture for Vite + Cloudflare projects. 50+ rules ranked by impact — eliminating waterfalls, bundle optimisation, re-render prevention, composition over boolean props, server/client boundaries, and React 19 APIs. Use when writing, reviewing, or refactoring React components. Triggers: 'react patterns', 'react review', 'react performance', 'optimise components', 'react best practices', 'composition patterns', 'why is it slow', 'reduce re-renders', 'fix waterfall'."
compatibility: Designed for Claude Code (or similar products)
allowed-tools:
  - Read
  - Glob
  - Grep
---

# React Patterns

Performance and composition patterns for React 19 + Vite + Cloudflare Workers projects. Use as a checklist when writing new components, a review guide when auditing existing code, or a refactoring playbook when something feels slow or tangled.

Rules are ranked by impact. Fix CRITICAL issues before touching MEDIUM ones.

## When to Apply

- Writing new React components or pages
- Reviewing code for performance issues
- Refactoring components with too many props or re-renders
- Debugging "why is this slow?" or "why does this re-render?"
- Building reusable component libraries
- Code review before merging

## 1. Eliminating Waterfalls (CRITICAL)

Sequential async calls where they could be parallel. The #1 performance killer.

| Pattern | Problem | Fix |
|---------|---------|-----|
| **Await in sequence** | `const a = await getA(); const b = await getB();` | `const [a, b] = await Promise.all([getA(), getB()]);` |
| **Fetch in child** | Parent renders, then child fetches, then grandchild fetches | Hoist fetches to the highest common ancestor, pass data down |
| **Suspense cascade** | Multiple Suspense boundaries that resolve sequentially | One Suspense boundary wrapping all async siblings |
| **Await before branch** | `const data = await fetch(); if (condition) { use(data); }` | Move await inside the branch — don't fetch what you might not use |
| **Import then render** | `const Component = await import('./Heavy'); return <Component />` | Use `React.lazy()` + `<Suspense>` — renders fallback instantly |

**How to find them**: Search for `await` in components. Each `await` is a potential waterfall. If two awaits are independent, they should be parallel.

## 2. Bundle Size (CRITICAL)

Every KB the user downloads is a KB they wait for.

| Pattern | Problem | Fix |
|---------|---------|-----|
| **Barrel imports** | `import { Button } from '@/components'` pulls the entire barrel file | `import { Button } from '@/components/ui/button'` — direct import |
| **No code splitting** | Heavy component loaded on every page | `React.lazy(() => import('./HeavyComponent'))` + `<Suspense>` |
| **Third-party at load** | Analytics/tracking loaded before the app renders | Load after hydration: `useEffect(() => { import('./analytics') }, [])` |
| **Full library import** | `import _ from 'lodash'` (70KB) | `import debounce from 'lodash/debounce'` (1KB) |
| **Lucide tree-shaking** | `import * as Icons from 'lucide-react'` (all icons) | Explicit map: `import { Home, Settings } from 'lucide-react'` |
| **Duplicate React** | Library bundles its own React → "Cannot read properties of null" | `resolve.dedupe: ['react', 'react-dom']` in vite.config.ts |

**How to find them**: `npx vite-bundle-visualizer` — shows what's in your bundle.

## 3. Composition Architecture (HIGH)

How you structure components matters more than how you optimise them.

| Pattern | Problem | Fix |
|---------|---------|-----|
| **Boolean prop explosion** | `<Card isCompact isClickable showBorder hasIcon isLoading>` | Explicit variants: `<CompactCard>`, `<ClickableCard>` |
| **Compound components** | Complex component with 15 props | Split into `<Dialog>`, `<Dialog.Trigger>`, `<Dialog.Content>` with shared context |
| **renderX props** | `<Layout renderSidebar={...} renderHeader={...} renderFooter={...}>` | Use children + named slots: `<Layout><Sidebar /><Header /></Layout>` |
| **Lift state** | Sibling components can't share state | Move state to parent or context provider |
| **Provider implementation** | Consumer code knows about state management internals | Provider exposes interface `{ state, actions, meta }` — implementation hidden |
| **Inline components** | `function Parent() { function Child() { ... } return <Child /> }` | Define Child outside Parent — inline components remount on every render |

**The test**: If a component has more than 5 boolean props, it needs composition, not more props.

## 4. Re-render Prevention (MEDIUM)

Not all re-renders are bad. Only fix re-renders that cause visible jank or wasted computation.

| Pattern | Problem | Fix |
|---------|---------|-----|
| **Default object/array props** | `function Foo({ items = [] })` → new array ref every render | Hoist: `const DEFAULT = []; function Foo({ items = DEFAULT })` |
| **Derived state in effect** | `useEffect(() => setFiltered(items.filter(...)), [items])` | Derive during render: `const filtered = useMemo(() => items.filter(...), [items])` |
| **Object dependency** | `useEffect(() => {...}, [config])` fires every render if config is `{}` | Use primitive deps: `useEffect(() => {...}, [config.id, config.type])` |
| **Subscribe to unused state** | Component reads `{ user, theme, settings }` but only uses `user` | Split context or use selector: `useSyncExternalStore` |
| **State for transient values** | `const [mouseX, setMouseX] = useState(0)` on mousemove | Use `useRef` for values that change frequently but don't need re-render |
| **Inline callback props** | `<Button onClick={() => doThing(id)} />` — new function every render | `useCallback` or functional setState: `<Button onClick={handleClick} />` |

**How to find them**: React DevTools Profiler → "Why did this render?" or `<React.StrictMode>` double-renders in dev.

## 5. React 19 Specifics (MEDIUM)

Patterns that changed or are new in React 19.

| Pattern | Old (React 18) | New (React 19) |
|---------|---------------|----------------|
| **Form state** | `useFormState` | `useActionState` — renamed |
| **Ref forwarding** | `forwardRef((props, ref) => ...)` | `function Component({ ref, ...props })` — ref is a regular prop |
| **Context** | `useContext(MyContext)` | `use(MyContext)` — works in conditionals and loops |
| **Pending UI** | Manual loading state | `useTransition` + `startTransition` for non-urgent updates |
| **Route-level lazy** | Works with `createBrowserRouter` only | Still true — `<Route lazy={...}>` is silently ignored with `<BrowserRouter>` |
| **Optimistic updates** | Manual state management | `useOptimistic` hook |
| **Metadata** | Helmet or manual `<head>` management | `<title>`, `<meta>`, `<link>` in component JSX — hoisted to `<head>` automatically |

## 6. Rendering Performance (MEDIUM)

| Pattern | Problem | Fix |
|---------|---------|-----|
| **Layout shift on load** | Content jumps when async data arrives | Skeleton screens matching final layout dimensions |
| **Animate SVG directly** | Janky SVG animation | Wrap in `<div>`, animate the div instead |
| **Large list rendering** | 1000+ items in a table/list | `@tanstack/react-virtual` for virtualised rendering |
| **content-visibility** | Long scrollable content renders everything upfront | `content-visibility: auto` on off-screen sections |
| **Conditional render with &&** | `{count && <Items />}` renders `0` when count is 0 | Use ternary: `{count > 0 ? <Items /> : null}` |

## 7. Data Fetching (MEDIUM)

| Pattern | Problem | Fix |
|---------|---------|-----|
| **No deduplication** | Same data fetched by 3 components | TanStack Query or SWR — automatic dedup + caching |
| **Fetch on mount** | `useEffect(() => { fetch(...) }, [])` — waterfalls, no caching, no dedup | TanStack Query: `useQuery({ queryKey: ['users'], queryFn: fetchUsers })` |
| **No optimistic update** | User clicks save, waits 2 seconds, then sees change | `useMutation` with `onMutate` for instant visual feedback |
| **Stale closure in interval** | `setInterval` captures stale state | `useRef` for the interval ID and current values |
| **Polling without cleanup** | `setInterval` in useEffect without `clearInterval` | Return cleanup: `useEffect(() => { const id = setInterval(...); return () => clearInterval(id); })` |

## 8. Vite + Cloudflare Specifics (MEDIUM)

| Pattern | Problem | Fix |
|---------|---------|-----|
| **`import.meta.env` in Node scripts** | Undefined — only works in Vite-processed files | Use `loadEnv()` from vite |
| **React duplicate instance** | Library bundles its own React | `resolve.dedupe` + `optimizeDeps.include` in vite.config.ts |
| **Radix Select empty string** | `<SelectItem value="">` throws | Use sentinel: `<SelectItem value="__any__">` |
| **React Hook Form null** | `{...field}` passes null to Input | Spread manually: `value={field.value ?? ''}` |
| **Env vars at edge** | `process.env` doesn't exist in Workers | Use `c.env` (Hono context) or `import.meta.env` (Vite build-time) |

## Using as a Review Checklist

When reviewing code, go through categories 1-3 (CRITICAL + HIGH) for every PR. Categories 4-8 only when performance is a concern.

```
/react-patterns [file or component path]
```

Read the file, check against rules in priority order, report findings as:
```
file:line — [rule] description of issue
```
