/**
 * Basic Zustand Store (JavaScript style, no TypeScript)
 *
 * Use when:
 * - Prototyping quickly
 * - Small applications
 * - No TypeScript in project
 *
 * Learn more: See SKILL.md for TypeScript version
 */

import { create } from 'zustand'

// Create store with minimal setup
export const useStore = create((set) => ({
  // State
  count: 0,
  user: null,

  // Actions
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  setUser: (user) => set({ user }),
  reset: () => set({ count: 0, user: null }),
}))

/**
 * Usage in component:
 *
 * function Counter() {
 *   const count = useStore((state) => state.count)
 *   const increment = useStore((state) => state.increment)
 *
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={increment}>Increment</button>
 *     </div>
 *   )
 * }
 */
