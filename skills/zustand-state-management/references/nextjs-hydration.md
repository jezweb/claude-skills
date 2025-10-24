# Zustand + Next.js Hydration Guide

Complete guide for using Zustand with Next.js SSR. Load for Next.js-specific problems.

---

## The Hydration Problem

**Error**: `"Text content does not match server-rendered HTML"`

**Why it happens**:
- Server renders with default state
- Client loads persisted state from localStorage
- Content doesn't match → hydration error

---

## Solution: Hydration Flag Pattern

### Store Setup

```typescript
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Store {
  _hasHydrated: boolean  // Track hydration
  count: number
  setHasHydrated: (hydrated: boolean) => void
  increment: () => void
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      _hasHydrated: false,
      count: 0,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    {
      name: 'storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)  // Set true when done
      },
    },
  ),
)
```

### Component Usage

```typescript
'use client'

function Component() {
  const hasHydrated = useStore((state) => state._hasHydrated)
  const count = useStore((state) => state.count)

  if (!hasHydrated) {
    return <div>Loading...</div>
  }

  return <div>Count: {count}</div>
}
```

---

## Alternative: Accept Flash

If loading state is unacceptable, accept brief flash:

```typescript
'use client'

function Component() {
  const count = useStore((state) => state.count)

  // Will show default (0) briefly, then correct value
  return <div>Count: {count}</div>
}
```

**Trade-off**: Simpler code, but user sees flash.

---

## App Router vs Pages Router

### App Router (Recommended)

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}

// app/page.tsx
'use client'

import { useStore } from './store'

export default function Page() {
  return <Component />
}
```

**Note**: Add `'use client'` to components using Zustand.

### Pages Router

```typescript
// pages/_app.tsx
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}

// pages/index.tsx
import { useStore } from '../store'

export default function Page() {
  return <Component />
}
```

**Note**: No `'use client'` needed in Pages Router.

---

## Server Components

**NEVER** use Zustand in Server Components:

```typescript
// ❌ WRONG - Server Component
export default async function ServerComponent() {
  const count = useStore((state) => state.count)  // Error!
  return <div>{count}</div>
}

// ✅ CORRECT - Client Component
'use client'

export default function ClientComponent() {
  const count = useStore((state) => state.count)
  return <div>{count}</div>
}
```

---

## SSR with getServerSideProps

```typescript
// pages/index.tsx
import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async () => {
  // Fetch data on server
  const data = await fetchData()

  return {
    props: { data },
  }
}

export default function Page({ data }) {
  const setData = useStore((state) => state.setData)

  // Sync server data to store
  useEffect(() => {
    setData(data)
  }, [data, setData])

  return <Component />
}
```

---

## Common Patterns

### Initialize Store from Props

```typescript
'use client'

function Page({ serverData }) {
  const setData = useStore((state) => state.setData)

  useEffect(() => {
    setData(serverData)
  }, [serverData, setData])

  return <Component />
}
```

### Conditional Rendering

```typescript
'use client'

function Component() {
  const hasHydrated = useStore((state) => state._hasHydrated)
  const theme = useStore((state) => state.theme)

  return (
    <div className={hasHydrated ? theme : 'default'}>
      {hasHydrated ? <Content /> : <Skeleton />}
    </div>
  )
}
```

### Progressive Enhancement

```typescript
'use client'

function Component() {
  const hasHydrated = useStore((state) => state._hasHydrated)
  const preferences = useStore((state) => state.preferences)

  // Always render, but enhance after hydration
  return (
    <div>
      <DefaultUI />
      {hasHydrated && <EnhancedUI preferences={preferences} />}
    </div>
  )
}
```

---

## Debugging Hydration Errors

### Enable Strict Mode

```typescript
// next.config.js
module.exports = {
  reactStrictMode: true,
}
```

### Check for Differences

```typescript
useEffect(() => {
  console.log('Server state:', defaultState)
  console.log('Client state:', persistedState)
}, [])
```

### Use React DevTools

Look for red warnings about hydration mismatches.

---

## Official Resources

- **Next.js Hydration**: https://nextjs.org/docs/messages/react-hydration-error
- **Zustand Persist**: https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md
- **DEV.to Guide**: https://dev.to/abdulsamad/how-to-use-zustands-persist-middleware-in-nextjs-4lb5
