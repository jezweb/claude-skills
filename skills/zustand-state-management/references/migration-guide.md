# Migrating to Zustand

Guide for migrating from Redux, Context API, or Zustand v4. Load when user is migrating state management.

---

## From Redux to Zustand

### Before (Redux)

```typescript
// Action types
const INCREMENT = 'INCREMENT'
const DECREMENT = 'DECREMENT'

// Actions
const increment = () => ({ type: INCREMENT })
const decrement = () => ({ type: DECREMENT })

// Reducer
const reducer = (state = { count: 0 }, action) => {
  switch (action.type) {
    case INCREMENT:
      return { count: state.count + 1 }
    case DECREMENT:
      return { count: state.count - 1 }
    default:
      return state
  }
}

// Store
const store = createStore(reducer)

// Provider
<Provider store={store}>
  <App />
</Provider>

// Component
const count = useSelector((state) => state.count)
const dispatch = useDispatch()
<button onClick={() => dispatch(increment())}>Increment</button>
```

### After (Zustand)

```typescript
// Store (all in one!)
import { create } from 'zustand'

interface Store {
  count: number
  increment: () => void
  decrement: () => void
}

const useStore = create<Store>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))

// No provider needed!

// Component
const count = useStore((state) => state.count)
const increment = useStore((state) => state.increment)
<button onClick={increment}>Increment</button>
```

**Benefits**:
- ~90% less boilerplate
- No provider wrapper
- No action types/creators
- No reducer switch
- Built-in TypeScript support

---

## From Context API to Zustand

### Before (Context)

```typescript
// Context
const CountContext = createContext(null)

// Provider
function CountProvider({ children }) {
  const [count, setCount] = useState(0)

  const increment = () => setCount((c) => c + 1)
  const decrement = () => setCount((c) => c - 1)

  return (
    <CountContext.Provider value={{ count, increment, decrement }}>
      {children}
    </CountContext.Provider>
  )
}

// Hook
function useCount() {
  const context = useContext(CountContext)
  if (!context) throw new Error('useCount must be within CountProvider')
  return context
}

// App
<CountProvider>
  <App />
</CountProvider>

// Component
const { count, increment } = useCount()
```

### After (Zustand)

```typescript
// Store
const useStore = create<Store>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))

// Component (no provider needed!)
const count = useStore((state) => state.count)
const increment = useStore((state) => state.increment)
```

**Benefits**:
- No provider needed
- No context null checks
- No wrapper components
- Better performance (no context re-renders)
- Persistent by default (with middleware)

---

## From Zustand v4 to v5

### Breaking Changes

#### 1. TypeScript Syntax

```typescript
// ❌ v4
const useStore = create<Store>((set) => ({ /* ... */ }))

// ✅ v5
const useStore = create<Store>()((set) => ({ /* ... */ }))
//                            ^^ Double parentheses required
```

#### 2. Persist Middleware Imports

```typescript
// ❌ v4
import { persist } from 'zustand/middleware'

const useStore = create(
  persist((set) => ({ /* ... */ }), { name: 'storage' })
)

// ✅ v5
import { persist, createJSONStorage } from 'zustand/middleware'

const useStore = create<Store>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

#### 3. Shallow Import

```typescript
// ❌ v4
import shallow from 'zustand/shallow'

// ✅ v5
import { shallow } from 'zustand/shallow'
```

---

## Migration Strategies

### Gradual Migration

1. **Install Zustand** alongside existing solution
2. **Migrate one feature** at a time
3. **Test thoroughly** before moving to next
4. **Remove old code** once stable

### Big Bang Migration

1. **Create Zustand stores** for all state
2. **Update all components** at once
3. **Remove old state management** entirely
4. **Test everything**

**Recommendation**: Gradual migration for large apps.

---

## Code Mapping

### Redux → Zustand

| Redux | Zustand |
|-------|---------|
| Actions | Direct functions in store |
| Action types | Not needed |
| Reducers | Inline in `set()` calls |
| `useSelector` | Direct store selectors |
| `useDispatch` | Direct function calls |
| Provider | Not needed |
| Middleware | Built-in (`persist`, `devtools`) |
| DevTools | `devtools` middleware |

### Context → Zustand

| Context | Zustand |
|---------|---------|
| `createContext` | `create()` |
| Provider | Not needed |
| `useContext` | Direct store access |
| State | Store state |
| Updaters | Store actions |

---

## Common Pitfalls

### 1. Forgetting Double Parentheses (v5)

```typescript
// ❌ WRONG
create<Store>((set) => ({ /* ... */ }))

// ✅ CORRECT
create<Store>()((set) => ({ /* ... */ }))
```

### 2. Creating Objects in Selectors

```typescript
// ❌ WRONG - Causes infinite renders
const { a, b } = useStore((state) => ({ a: state.a, b: state.b }))

// ✅ CORRECT
const a = useStore((state) => state.a)
const b = useStore((state) => state.b)
```

### 3. Not Using Persist Correctly

```typescript
// ❌ WRONG - Missing createJSONStorage
persist((set) => ({ /* ... */ }), { name: 'storage' })

// ✅ CORRECT
persist(
  (set) => ({ /* ... */ }),
  {
    name: 'storage',
    storage: createJSONStorage(() => localStorage),
  }
)
```

---

## Checklist

- [ ] Installed Zustand v5+
- [ ] Created store with `create<T>()()`
- [ ] Removed Context providers (if migrating from Context)
- [ ] Removed Redux boilerplate (if migrating from Redux)
- [ ] Updated all `useSelector` to Zustand selectors
- [ ] Updated all `useDispatch` to direct function calls
- [ ] Added `persist` if state needs persistence
- [ ] Added `devtools` if using Redux DevTools
- [ ] Tested all components
- [ ] Verified no hydration errors (Next.js)
- [ ] Removed old state management code

---

## Official Resources

- **Zustand Docs**: https://zustand.docs.pmnd.rs/
- **Migration Guide**: https://github.com/pmndrs/zustand/wiki/Migrating-to-v4
- **TypeScript Guide**: https://zustand.docs.pmnd.rs/guides/typescript
