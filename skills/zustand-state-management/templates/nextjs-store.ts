/**
 * Next.js SSR-Safe Zustand Store with Hydration Handling
 *
 * Use when:
 * - Using persist middleware in Next.js
 * - Getting hydration mismatch errors
 * - Need SSR compatibility
 *
 * This template solves:
 * - "Text content does not match server-rendered HTML"
 * - "Hydration failed" errors
 * - Flashing content during hydration
 *
 * Learn more: See SKILL.md Issue #1 for detailed explanation
 */

'use client' // Required for Next.js App Router

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: string
  name: string
}

interface NextJsStore {
  // State
  _hasHydrated: boolean // CRITICAL: Track hydration status
  count: number
  user: User | null

  // Actions
  setHasHydrated: (hydrated: boolean) => void
  increment: () => void
  setUser: (user: User | null) => void
  reset: () => void
}

export const useNextJsStore = create<NextJsStore>()(
  persist(
    (set) => ({
      // Initial state
      _hasHydrated: false, // Start false
      count: 0,
      user: null,

      // Hydration action
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),

      // Regular actions
      increment: () => set((state) => ({ count: state.count + 1 })),

      setUser: (user) => set({ user }),

      reset: () => set({ count: 0, user: null }),
    }),
    {
      name: 'nextjs-storage',

      // CRITICAL: Call setHasHydrated when rehydration completes
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)

/**
 * Usage in Next.js component:
 *
 * 'use client'
 *
 * import { useNextJsStore } from './store'
 *
 * function Counter() {
 *   const hasHydrated = useNextJsStore((state) => state._hasHydrated)
 *   const count = useNextJsStore((state) => state.count)
 *   const increment = useNextJsStore((state) => state.increment)
 *
 *   // Show loading state during hydration
 *   if (!hasHydrated) {
 *     return <div>Loading...</div>
 *   }
 *
 *   // Now safe to render with persisted state
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={increment}>Increment</button>
 *     </div>
 *   )
 * }
 *
 * Alternative: Skip hydration check if flashing is acceptable
 *
 * function CounterNoLoadingState() {
 *   const count = useNextJsStore((state) => state.count)
 *   const increment = useNextJsStore((state) => state.increment)
 *
 *   // Will show default value (0) until hydration, then correct value
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={increment}>Increment</button>
 *     </div>
 *   )
 * }
 */
