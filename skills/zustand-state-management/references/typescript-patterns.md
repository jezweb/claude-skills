# Zustand TypeScript Advanced Patterns

Advanced TypeScript patterns and troubleshooting. Load when encountering complex type inference issues.

---

## Basic TypeScript Setup

### The Golden Rule: Double Parentheses

```typescript
// ✅ CORRECT
const useStore = create<Store>()((set) => ({ /* ... */ }))

// ❌ WRONG
const useStore = create<Store>((set) => ({ /* ... */ }))
```

**Why**: Currying syntax enables middleware type inference.

---

## Store Interface Pattern

```typescript
// Define types
interface BearState {
  bears: number
}

interface BearActions {
  increase: (by: number) => void
  decrease: (by: number) => void
}

// Combine
type BearStore = BearState & BearActions

// Use
const useBearStore = create<BearStore>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
  decrease: (by) => set((state) => ({ bears: state.bears - by })),
}))
```

---

## Slices Pattern Types

```typescript
import { StateCreator } from 'zustand'

// Define slice type
interface BearSlice {
  bears: number
  addBear: () => void
}

// Create slice with proper types
const createBearSlice: StateCreator<
  BearSlice & FishSlice,  // Combined store type
  [],                      // Middleware mutators
  [],                      // Chained middleware
  BearSlice               // This slice
> = (set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
})
```

---

## Middleware Types

### With Devtools

```typescript
import { StateCreator } from 'zustand'
import { devtools } from 'zustand/middleware'

interface Store {
  count: number
  increment: () => void
}

const useStore = create<Store>()(
  devtools(
    (set) => ({
      count: 0,
      increment: () =>
        set(
          (state) => ({ count: state.count + 1 }),
          undefined,
          'increment'
        ),
    }),
    { name: 'Store' }
  )
)
```

### With Persist

```typescript
import { persist } from 'zustand/middleware'

const useStore = create<Store>()(
  persist(
    (set) => ({ /* ... */ }),
    { name: 'storage' }
  )
)
```

### With Multiple Middlewares

```typescript
const useStore = create<Store>()(
  devtools(
    persist(
      (set) => ({ /* ... */ }),
      { name: 'storage' }
    ),
    { name: 'Store' }
  )
)
```

---

## Slices with Middleware

```typescript
import { StateCreator } from 'zustand'
import { devtools } from 'zustand/middleware'

const createBearSlice: StateCreator<
  BearSlice & FishSlice,
  [['zustand/devtools', never]],  // Add devtools mutator
  [],
  BearSlice
> = (set) => ({
  bears: 0,
  addBear: () =>
    set(
      (state) => ({ bears: state.bears + 1 }),
      undefined,
      'bear/add'
    ),
})
```

---

## Selector Types

### Basic Selector

```typescript
const bears = useStore((state) => state.bears)
// Type: number
```

### Computed Selector

```typescript
const selectTotal = (state: Store) => state.items.reduce((sum, item) => sum + item.price, 0)

const total = useStore(selectTotal)
// Type: number
```

### Parameterized Selector

```typescript
const selectById = (id: string) => (state: Store) =>
  state.items.find((item) => item.id === id)

const item = useStore(selectById('123'))
// Type: Item | undefined
```

---

## Vanilla Store Types

```typescript
import { createStore } from 'zustand/vanilla'

const store = createStore<Store>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

// Get state
const state = store.getState()
// Type: Store

// Subscribe
const unsubscribe = store.subscribe((state) => {
  // state is typed as Store
})
```

---

## Custom Hook with Types

```typescript
import { useStore } from 'zustand'

const bearStore = createStore<BearStore>()((set) => ({
  bears: 0,
  increase: () => set((state) => ({ bears: state.bears + 1 })),
}))

// Create custom hook
function useBearStore<T>(selector: (state: BearStore) => T): T {
  return useStore(bearStore, selector)
}
```

---

## Common Type Errors

### Error: Type inference breaks

**Problem**: Using single parentheses

```typescript
// ❌ WRONG
const useStore = create<Store>((set) => ({ /* ... */ }))
```

**Solution**: Use double parentheses

```typescript
// ✅ CORRECT
const useStore = create<Store>()((set) => ({ /* ... */ }))
```

### Error: StateCreator types fail

**Problem**: Missing middleware mutators

```typescript
// ❌ WRONG
const createSlice: StateCreator<CombinedStore, [], [], MySlice>
```

**Solution**: Add middleware mutators

```typescript
// ✅ CORRECT
const createSlice: StateCreator<
  CombinedStore,
  [['zustand/devtools', never]],  // Add this
  [],
  MySlice
>
```

### Error: Circular reference

**Problem**: Slices referencing each other

**Solution**: Define combined type first, then reference in slices

```typescript
type AllSlices = BearSlice & FishSlice & SharedSlice

const createBearSlice: StateCreator<AllSlices, [], [], BearSlice> = ...
```

---

## Official TypeScript Guide

https://zustand.docs.pmnd.rs/guides/typescript
