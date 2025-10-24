# Zustand Middleware Complete Guide

Complete reference for all Zustand middleware. Load when user asks about persistence, devtools, immer, or custom middleware.

---

## Persist Middleware

### Basic Usage

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const useStore = create<Store>()(
  persist(
    (set) => ({ /* store */ }),
    { name: 'storage-name' }
  )
)
```

### Storage Options

```typescript
// localStorage (default)
storage: createJSONStorage(() => localStorage)

// sessionStorage
storage: createJSONStorage(() => sessionStorage)

// Custom storage
storage: createJSONStorage(() => customStorage)
```

### Partial Persistence

```typescript
persist(
  (set) => ({ /* store */ }),
  {
    name: 'storage',
    partialize: (state) => ({
      theme: state.theme,
      // Don't persist sensitive data
    }),
  }
)
```

### Schema Migration

```typescript
persist(
  (set) => ({ /* store */ }),
  {
    name: 'storage',
    version: 2,
    migrate: (persistedState: any, version) => {
      if (version === 0) {
        // v0 → v1
        persistedState.newField = 'default'
      }
      if (version === 1) {
        // v1 → v2
        delete persistedState.oldField
      }
      return persistedState
    },
  }
)
```

---

## Devtools Middleware

### Basic Usage

```typescript
import { devtools } from 'zustand/middleware'

const useStore = create<Store>()(
  devtools(
    (set) => ({ /* store */ }),
    { name: 'StoreName' }
  )
)
```

### Named Actions

```typescript
increment: () => set(
  (state) => ({ count: state.count + 1 }),
  undefined,
  'counter/increment' // Shows in DevTools
)
```

### Production Toggle

```typescript
devtools(
  (set) => ({ /* store */ }),
  {
    name: 'Store',
    enabled: process.env.NODE_ENV === 'development'
  }
)
```

---

## Immer Middleware

Allows mutable state updates (Immer handles immutability):

```typescript
import { immer } from 'zustand/middleware/immer'

const useStore = create<Store>()(
  immer((set) => ({
    todos: [],
    addTodo: (text) => set((state) => {
      // Mutate directly!
      state.todos.push({ id: Date.now(), text })
    }),
  }))
)
```

**When to use**: Complex nested state updates

---

## Combining Middlewares

### Order Matters

```typescript
// ✅ CORRECT: devtools wraps persist
const useStore = create<Store>()(
  devtools(
    persist(
      (set) => ({ /* store */ }),
      { name: 'storage' }
    ),
    { name: 'Store' }
  )
)

// Shows persist actions in DevTools
```

### Common Combinations

```typescript
// Persist + Devtools
devtools(persist(...), { name: 'Store' })

// Persist + Immer
persist(immer(...), { name: 'storage' })

// All three
devtools(
  persist(
    immer(...),
    { name: 'storage' }
  ),
  { name: 'Store' }
)
```

---

## Custom Middleware

### Logger Example

```typescript
const logger = (config) => (set, get, api) => {
  return config(
    (...args) => {
      console.log('Before:', get())
      set(...args)
      console.log('After:', get())
    },
    get,
    api
  )
}

const useStore = create(logger((set) => ({ /* store */ })))
```

### TypeScript Logger

```typescript
import { StateCreator } from 'zustand'

type Logger = <T>(
  f: StateCreator<T, [], []>,
  name?: string
) => StateCreator<T, [], []>

const logger: Logger = (f, name) => (set, get, store) => {
  const loggedSet: typeof set = (...a) => {
    set(...(a as Parameters<typeof set>))
    console.log(`[${name}]:`, get())
  }
  return f(loggedSet, get, store)
}
```

---

## Middleware API Reference

### persist()

```typescript
persist<T>(
  stateCreator: StateCreator<T>,
  options: {
    name: string                    // Storage key (required)
    storage?: PersistStorage<T>     // Storage engine
    partialize?: (state: T) => Partial<T>  // Select what to persist
    version?: number                // Schema version
    migrate?: (state: any, version: number) => T  // Migration function
    merge?: (persisted: any, current: T) => T     // Custom merge
    onRehydrateStorage?: (state: T) => void       // Hydration callback
  }
)
```

### devtools()

```typescript
devtools<T>(
  stateCreator: StateCreator<T>,
  options?: {
    name?: string      // Store name in DevTools
    enabled?: boolean  // Enable/disable
  }
)
```

### immer()

```typescript
immer<T>(
  stateCreator: StateCreator<T>
)
```

---

## Common Patterns

### Reset Store

```typescript
const initialState = { count: 0 }

const useStore = create<Store>()(
  persist(
    (set) => ({
      ...initialState,
      reset: () => set(initialState),
    }),
    { name: 'storage' }
  )
)
```

### Clear Persisted Data

```typescript
// Clear localStorage
localStorage.removeItem('storage-name')

// Or programmatically
const useStore = create<Store>()(
  persist(
    (set) => ({
      clearStorage: () => {
        localStorage.removeItem('storage-name')
        set(initialState)
      },
    }),
    { name: 'storage-name' }
  )
)
```

---

## Official Documentation

- **Persist**: https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md
- **Devtools**: https://github.com/pmndrs/zustand/blob/main/docs/middlewares/devtools.md
- **Immer**: https://github.com/pmndrs/zustand/blob/main/docs/middlewares/immer.md
