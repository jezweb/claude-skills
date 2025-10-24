---
name: zustand-state-management
description: |
  Production-tested setup for Zustand state management in React applications with TypeScript.
  This skill provides comprehensive patterns for building scalable, type-safe global state.

  Use when: setting up global state in React, migrating from Redux or Context API, implementing
  state persistence with localStorage, configuring TypeScript with Zustand, using slices pattern
  for modular stores, adding devtools middleware for debugging, handling Next.js SSR hydration,
  or encountering hydration errors, TypeScript inference issues, or persist middleware problems.

  Prevents 5 documented issues: Next.js hydration mismatches, TypeScript double parentheses
  syntax errors, persist middleware export errors, infinite render loops, and slices pattern
  type inference failures.

  Keywords: zustand, state management, React state, TypeScript state, persist middleware,
  devtools, slices pattern, global state, React hooks, create store, useBoundStore,
  StateCreator, hydration error, text content mismatch, infinite render, localStorage,
  sessionStorage, immer middleware, shallow equality, selector pattern, zustand v5
license: MIT
---

# Zustand State Management

**Status**: Production Ready ✅
**Last Updated**: 2025-10-24
**Latest Version**: zustand@5.0.8
**Dependencies**: React 18+, TypeScript 5+

---

## Quick Start (3 Minutes)

### 1. Install Zustand

```bash
npm install zustand
# or
pnpm add zustand
# or
yarn add zustand
```

**Why Zustand?**
- Minimal API: Only 1 function to learn (`create`)
- No boilerplate: No providers, reducers, or actions
- TypeScript-first: Excellent type inference
- Fast: Fine-grained subscriptions prevent unnecessary re-renders
- Flexible: Middleware for persistence, devtools, and more

### 2. Create Your First Store (TypeScript)

```typescript
import { create } from 'zustand'

interface BearStore {
  bears: number
  increase: (by: number) => void
  reset: () => void
}

const useBearStore = create<BearStore>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
  reset: () => set({ bears: 0 }),
}))
```

**CRITICAL**: Notice the **double parentheses** `create<T>()()` - this is required for TypeScript with middleware.

### 3. Use Store in Components

```tsx
import { useBearStore } from './store'

function BearCounter() {
  const bears = useBearStore((state) => state.bears)
  return <h1>{bears} around here...</h1>
}

function Controls() {
  const increase = useBearStore((state) => state.increase)
  return <button onClick={() => increase(1)}>Add bear</button>
}
```

**Why this works:**
- Components only re-render when their selected state changes
- No Context providers needed
- Selector function extracts specific state slice

---

## The 3-Pattern Setup Process

### Pattern 1: Basic Store (JavaScript)

For simple use cases without TypeScript:

```javascript
import { create } from 'zustand'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))
```

**When to use:**
- Prototyping
- Small apps
- No TypeScript in project

### Pattern 2: TypeScript Store (Recommended)

For production apps with type safety:

```typescript
import { create } from 'zustand'

// Define store interface
interface CounterStore {
  count: number
  increment: () => void
  decrement: () => void
}

// Create typed store
const useCounterStore = create<CounterStore>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))
```

**Key Points:**
- Separate interface for state + actions
- Use `create<T>()()` syntax (currying for middleware)
- Full IDE autocomplete and type checking

### Pattern 3: Persistent Store

For state that survives page reloads:

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  setTheme: (theme: UserPreferences['theme']) => void
  setLanguage: (language: string) => void
}

const usePreferencesStore = create<UserPreferences>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'en',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'user-preferences', // unique name in localStorage
      storage: createJSONStorage(() => localStorage), // optional: defaults to localStorage
    },
  ),
)
```

**Why this matters:**
- State automatically saved to localStorage
- Restored on page reload
- Works with sessionStorage too
- Handles serialization automatically

---

## Critical Rules

### Always Do

✅ Use `create<T>()()` (double parentheses) in TypeScript for middleware compatibility
✅ Define separate interfaces for state and actions
✅ Use selector functions to extract specific state slices
✅ Use `set` with updater functions for derived state: `set((state) => ({ count: state.count + 1 }))`
✅ Use unique names for persist middleware storage keys
✅ Handle Next.js hydration with `hasHydrated` flag pattern
✅ Use `shallow` for selecting multiple values
✅ Keep actions pure (no side effects except state updates)

### Never Do

❌ Use `create<T>(...)` (single parentheses) in TypeScript - breaks middleware types
❌ Mutate state directly: `set((state) => { state.count++; return state })` - use immutable updates
❌ Create new objects in selectors: `useStore((state) => ({ a: state.a }))` - causes infinite renders
❌ Use same storage name for multiple stores - causes data collisions
❌ Access localStorage during SSR without hydration check
❌ Use Zustand for server state - use TanStack Query instead
❌ Export store instance directly - always export the hook

---

## Known Issues Prevention

This skill prevents **5** documented issues:

### Issue #1: Next.js Hydration Mismatch

**Error**: `"Text content does not match server-rendered HTML"` or `"Hydration failed"`

**Source**:
- [DEV Community: Persist middleware in Next.js](https://dev.to/abdulsamad/how-to-use-zustands-persist-middleware-in-nextjs-4lb5)
- GitHub Discussions #2839

**Why It Happens**:
Persist middleware reads from localStorage on client but not on server, causing state mismatch.

**Prevention**:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface StoreWithHydration {
  count: number
  _hasHydrated: boolean
  setHasHydrated: (hydrated: boolean) => void
  increase: () => void
}

const useStore = create<StoreWithHydration>()(
  persist(
    (set) => ({
      count: 0,
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      increase: () => set((state) => ({ count: state.count + 1 })),
    }),
    {
      name: 'my-store',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)

// In component
function MyComponent() {
  const hasHydrated = useStore((state) => state._hasHydrated)

  if (!hasHydrated) {
    return <div>Loading...</div>
  }

  // Now safe to render with persisted state
  return <ActualContent />
}
```

### Issue #2: TypeScript Double Parentheses Missing

**Error**: Type inference fails, `StateCreator` types break with middleware

**Source**: [Official Zustand TypeScript Guide](https://zustand.docs.pmnd.rs/guides/typescript)

**Why It Happens**:
The currying syntax `create<T>()()` is required for middleware to work with TypeScript inference.

**Prevention**:
```typescript
// ❌ WRONG - Single parentheses
const useStore = create<MyStore>((set) => ({
  // ...
}))

// ✅ CORRECT - Double parentheses
const useStore = create<MyStore>()((set) => ({
  // ...
}))
```

**Rule**: Always use `create<T>()()` in TypeScript, even without middleware (future-proof).

### Issue #3: Persist Middleware Import Error

**Error**: `"Attempted import error: 'createJSONStorage' is not exported from 'zustand/middleware'"`

**Source**: GitHub Discussion #2839

**Why It Happens**:
Wrong import path or version mismatch between zustand and build tools.

**Prevention**:
```typescript
// ✅ CORRECT imports for v5
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Verify versions
// zustand@5.0.8 includes createJSONStorage
// zustand@4.x uses different API

// Check your package.json
// "zustand": "^5.0.8"
```

### Issue #4: Infinite Render Loop

**Error**: Component re-renders infinitely, browser freezes

**Source**: GitHub Discussions #2642

**Why It Happens**:
Creating new object references in selectors causes Zustand to think state changed.

**Prevention**:
```typescript
import { shallow } from 'zustand/shallow'

// ❌ WRONG - Creates new object every time
const { bears, fishes } = useStore((state) => ({
  bears: state.bears,
  fishes: state.fishes,
}))

// ✅ CORRECT Option 1 - Select primitives separately
const bears = useStore((state) => state.bears)
const fishes = useStore((state) => state.fishes)

// ✅ CORRECT Option 2 - Use shallow for multiple values
const { bears, fishes } = useStore(
  (state) => ({ bears: state.bears, fishes: state.fishes }),
  shallow,
)
```

### Issue #5: Slices Pattern TypeScript Complexity

**Error**: `StateCreator` types fail to infer, complex middleware types break

**Source**: [Official Slices Pattern Guide](https://github.com/pmndrs/zustand/blob/main/docs/guides/slices-pattern.md)

**Why It Happens**:
Combining multiple slices requires explicit type annotations for middleware compatibility.

**Prevention**:
```typescript
import { create, StateCreator } from 'zustand'

// Define slice types
interface BearSlice {
  bears: number
  addBear: () => void
}

interface FishSlice {
  fishes: number
  addFish: () => void
}

// Create slices with proper types
const createBearSlice: StateCreator<
  BearSlice & FishSlice,  // Combined store type
  [],                      // Middleware mutators (empty if none)
  [],                      // Chained middleware (empty if none)
  BearSlice               // This slice's type
> = (set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
})

const createFishSlice: StateCreator<
  BearSlice & FishSlice,
  [],
  [],
  FishSlice
> = (set) => ({
  fishes: 0,
  addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
})

// Combine slices
const useStore = create<BearSlice & FishSlice>()((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
}))
```

---

## Middleware Configuration

### Persist Middleware (localStorage)

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface MyStore {
  data: string[]
  addItem: (item: string) => void
}

const useStore = create<MyStore>()(
  persist(
    (set) => ({
      data: [],
      addItem: (item) => set((state) => ({ data: [...state.data, item] })),
    }),
    {
      name: 'my-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ data: state.data }), // Only persist 'data'
    },
  ),
)
```

### Devtools Middleware (Redux DevTools)

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface CounterStore {
  count: number
  increment: () => void
}

const useStore = create<CounterStore>()(
  devtools(
    (set) => ({
      count: 0,
      increment: () =>
        set(
          (state) => ({ count: state.count + 1 }),
          undefined,
          'counter/increment', // Action name in DevTools
        ),
    }),
    { name: 'CounterStore' }, // Store name in DevTools
  ),
)
```

### Combining Multiple Middlewares

```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

const useStore = create<MyStore>()(
  devtools(
    persist(
      (set) => ({
        // store definition
      }),
      { name: 'my-storage' },
    ),
    { name: 'MyStore' },
  ),
)
```

**Order matters**: `devtools(persist(...))` shows persist actions in DevTools.

---

## Common Patterns

### Pattern: Computed/Derived Values

```typescript
interface StoreWithComputed {
  items: string[]
  addItem: (item: string) => void
  // Computed in selector, not stored
}

const useStore = create<StoreWithComputed>()((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
}))

// Use in component
function ItemCount() {
  const count = useStore((state) => state.items.length)
  return <div>{count} items</div>
}
```

### Pattern: Async Actions

```typescript
interface AsyncStore {
  data: string | null
  isLoading: boolean
  error: string | null
  fetchData: () => Promise<void>
}

const useAsyncStore = create<AsyncStore>()((set) => ({
  data: null,
  isLoading: false,
  error: null,
  fetchData: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/data')
      const data = await response.text()
      set({ data, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
}))
```

### Pattern: Resetting Store

```typescript
interface ResettableStore {
  count: number
  name: string
  increment: () => void
  reset: () => void
}

const initialState = {
  count: 0,
  name: '',
}

const useStore = create<ResettableStore>()((set) => ({
  ...initialState,
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set(initialState),
}))
```

### Pattern: Selector with Params

```typescript
interface TodoStore {
  todos: Array<{ id: string; text: string; done: boolean }>
  addTodo: (text: string) => void
  toggleTodo: (id: string) => void
}

const useStore = create<TodoStore>()((set) => ({
  todos: [],
  addTodo: (text) =>
    set((state) => ({
      todos: [...state.todos, { id: Date.now().toString(), text, done: false }],
    })),
  toggleTodo: (id) =>
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      ),
    })),
}))

// Use with parameter
function Todo({ id }: { id: string }) {
  const todo = useStore((state) => state.todos.find((t) => t.id === id))
  const toggleTodo = useStore((state) => state.toggleTodo)

  if (!todo) return null

  return (
    <div>
      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => toggleTodo(id)}
      />
      {todo.text}
    </div>
  )
}
```

---

## Using Bundled Resources

### Templates (templates/)

This skill includes 8 ready-to-use template files:

- `basic-store.ts` - Minimal JavaScript store example
- `typescript-store.ts` - Properly typed TypeScript store
- `persist-store.ts` - localStorage persistence with migration
- `slices-pattern.ts` - Modular store organization
- `devtools-store.ts` - Redux DevTools integration
- `nextjs-store.ts` - SSR-safe Next.js store with hydration
- `computed-store.ts` - Derived state patterns
- `async-actions-store.ts` - Async operations with loading states

**Example Usage:**
```bash
# Copy template to your project
cp ~/.claude/skills/zustand-state-management/templates/typescript-store.ts src/store/
```

**When to use each:**
- Use `basic-store.ts` for quick prototypes
- Use `typescript-store.ts` for most production apps
- Use `persist-store.ts` when state needs to survive page reloads
- Use `slices-pattern.ts` for large, complex stores (100+ lines)
- Use `nextjs-store.ts` for Next.js projects with SSR

### References (references/)

Deep-dive documentation for complex scenarios:

- `middleware-guide.md` - Complete middleware documentation (persist, devtools, immer, custom)
- `typescript-patterns.md` - Advanced TypeScript patterns and troubleshooting
- `nextjs-hydration.md` - SSR, hydration, and Next.js best practices
- `migration-guide.md` - Migrating from Redux, Context API, or Zustand v4

**When Claude should load these:**
- Load `middleware-guide.md` when user asks about persistence, devtools, or custom middleware
- Load `typescript-patterns.md` when encountering complex type inference issues
- Load `nextjs-hydration.md` for Next.js-specific problems
- Load `migration-guide.md` when migrating from other state management solutions

### Scripts (scripts/)

- `check-versions.sh` - Verify Zustand version and compatibility

**Usage:**
```bash
cd your-project/
~/.claude/skills/zustand-state-management/scripts/check-versions.sh
```

---

## Advanced Topics

### Vanilla Store (Without React)

```typescript
import { createStore } from 'zustand/vanilla'

const store = createStore<CounterStore>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

// Subscribe to changes
const unsubscribe = store.subscribe((state) => {
  console.log('Count changed:', state.count)
})

// Get current state
console.log(store.getState().count)

// Update state
store.getState().increment()

// Cleanup
unsubscribe()
```

### Custom Middleware

```typescript
import { StateCreator, StoreMutatorIdentifier } from 'zustand'

type Logger = <T>(
  f: StateCreator<T, [], []>,
  name?: string,
) => StateCreator<T, [], []>

const logger: Logger = (f, name) => (set, get, store) => {
  const loggedSet: typeof set = (...a) => {
    set(...(a as Parameters<typeof set>))
    console.log(`[${name}]:`, get())
  }
  return f(loggedSet, get, store)
}

// Use custom middleware
const useStore = create<MyStore>()(
  logger((set) => ({
    // store definition
  }), 'MyStore'),
)
```

### Immer Middleware (Mutable Updates)

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface TodoStore {
  todos: Array<{ id: string; text: string }>
  addTodo: (text: string) => void
}

const useStore = create<TodoStore>()(
  immer((set) => ({
    todos: [],
    addTodo: (text) =>
      set((state) => {
        // Mutate directly with Immer
        state.todos.push({ id: Date.now().toString(), text })
      }),
  })),
)
```

---

## Dependencies

**Required**:
- `zustand@5.0.8` - State management library
- `react@18.0.0+` - React framework

**Optional**:
- `@types/node` - For TypeScript path resolution
- `immer` - For mutable update syntax
- Redux DevTools Extension - For devtools middleware

---

## Official Documentation

- **Zustand**: https://zustand.docs.pmnd.rs/
- **GitHub**: https://github.com/pmndrs/zustand
- **TypeScript Guide**: https://zustand.docs.pmnd.rs/guides/typescript
- **Slices Pattern**: https://github.com/pmndrs/zustand/blob/main/docs/guides/slices-pattern.md
- **Context7 Library ID**: `/pmndrs/zustand`

---

## Package Versions (Verified 2025-10-24)

```json
{
  "dependencies": {
    "zustand": "^5.0.8",
    "react": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.0.0"
  }
}
```

**Compatibility**:
- React 18+, React 19 ✅
- TypeScript 5+ ✅
- Next.js 14+, Next.js 15+ ✅
- Vite 5+ ✅

---

## Troubleshooting

### Problem: Store updates don't trigger re-renders
**Solution**: Ensure you're using selector functions, not destructuring: `const bears = useStore(state => state.bears)` not `const { bears } = useStore()`

### Problem: TypeScript errors with middleware
**Solution**: Use double parentheses: `create<T>()()` not `create<T>()`

### Problem: Persist middleware causes hydration error
**Solution**: Implement `_hasHydrated` flag pattern (see Issue #1)

### Problem: Actions not showing in Redux DevTools
**Solution**: Pass action name as third parameter to `set`: `set(newState, undefined, 'actionName')`

### Problem: Store state resets unexpectedly
**Solution**: Check if using HMR (hot module replacement) - Zustand resets on module reload in development

---

## Complete Setup Checklist

Use this checklist to verify your Zustand setup:

- [ ] Installed `zustand@5.0.8` or later
- [ ] Created store with proper TypeScript types
- [ ] Used `create<T>()()` double parentheses syntax
- [ ] Tested selector functions in components
- [ ] Verified components only re-render when selected state changes
- [ ] If using persist: Configured unique storage name
- [ ] If using persist: Implemented hydration check for Next.js
- [ ] If using devtools: Named actions for debugging
- [ ] If using slices: Properly typed `StateCreator` for each slice
- [ ] All actions are pure functions
- [ ] No direct state mutations
- [ ] Store works in production build

---

**Questions? Issues?**

1. Check [references/typescript-patterns.md](references/typescript-patterns.md) for TypeScript help
2. Check [references/nextjs-hydration.md](references/nextjs-hydration.md) for Next.js issues
3. Check [references/middleware-guide.md](references/middleware-guide.md) for persist/devtools help
4. Official docs: https://zustand.docs.pmnd.rs/
5. GitHub issues: https://github.com/pmndrs/zustand/issues
