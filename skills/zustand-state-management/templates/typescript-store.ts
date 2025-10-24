/**
 * TypeScript Zustand Store (Recommended for production)
 *
 * Use when:
 * - Production applications
 * - Need type safety
 * - Want IDE autocomplete
 *
 * CRITICAL: Notice the double parentheses `create<T>()()` - required for TypeScript
 *
 * Learn more: See SKILL.md for middleware and advanced patterns
 */

import { create } from 'zustand'

// Define state interface
interface User {
  id: string
  name: string
  email: string
}

// Define store interface (state + actions)
interface AppStore {
  // State
  count: number
  user: User | null
  isLoading: boolean

  // Actions
  increment: () => void
  decrement: () => void
  reset: () => void
  setUser: (user: User) => void
  clearUser: () => void
  setLoading: (loading: boolean) => void
}

// Create typed store with double parentheses
export const useAppStore = create<AppStore>()((set) => ({
  // Initial state
  count: 0,
  user: null,
  isLoading: false,

  // Actions
  increment: () => set((state) => ({ count: state.count + 1 })),

  decrement: () => set((state) => ({ count: state.count - 1 })),

  reset: () => set({ count: 0, user: null }),

  setUser: (user) => set({ user }),

  clearUser: () => set({ user: null }),

  setLoading: (loading) => set({ isLoading: loading }),
}))

/**
 * Usage in component:
 *
 * function Counter() {
 *   // Select single value (component only re-renders when count changes)
 *   const count = useAppStore((state) => state.count)
 *   const increment = useAppStore((state) => state.increment)
 *
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={increment}>Increment</button>
 *     </div>
 *   )
 * }
 *
 * function UserProfile() {
 *   const user = useAppStore((state) => state.user)
 *   const setUser = useAppStore((state) => state.setUser)
 *
 *   if (!user) return <div>No user</div>
 *
 *   return <div>Hello, {user.name}!</div>
 * }
 */
