/**
 * Persistent Zustand Store (localStorage/sessionStorage)
 *
 * Use when:
 * - State needs to survive page reloads
 * - User preferences (theme, language, etc.)
 * - Shopping carts, draft forms
 *
 * Features:
 * - Automatic save to localStorage
 * - Automatic restore on load
 * - Migration support for schema changes
 * - Partial persistence (only save some fields)
 *
 * Learn more: See SKILL.md Issue #1 for Next.js hydration handling
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
}

interface PersistedStore {
  // State
  theme: 'light' | 'dark' | 'system'
  language: string
  user: User | null
  preferences: {
    notifications: boolean
    emailUpdates: boolean
  }

  // Actions
  setTheme: (theme: PersistedStore['theme']) => void
  setLanguage: (language: string) => void
  setUser: (user: User | null) => void
  updatePreferences: (prefs: Partial<PersistedStore['preferences']>) => void
  reset: () => void
}

const initialState = {
  theme: 'system' as const,
  language: 'en',
  user: null,
  preferences: {
    notifications: true,
    emailUpdates: false,
  },
}

export const usePersistedStore = create<PersistedStore>()(
  persist(
    (set) => ({
      ...initialState,

      // Actions
      setTheme: (theme) => set({ theme }),

      setLanguage: (language) => set({ language }),

      setUser: (user) => set({ user }),

      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'app-storage', // unique name in localStorage

      // Optional: use sessionStorage instead
      // storage: createJSONStorage(() => sessionStorage),

      // Optional: only persist specific fields
      // partialize: (state) => ({
      //   theme: state.theme,
      //   language: state.language,
      //   preferences: state.preferences,
      //   // Don't persist user (privacy)
      // }),

      // Optional: version and migration for schema changes
      version: 1,
      migrate: (persistedState: any, version) => {
        if (version === 0) {
          // Migration from version 0 to 1
          // Example: rename field
          persistedState.language = persistedState.lang || 'en'
          delete persistedState.lang
        }
        return persistedState
      },
    },
  ),
)

/**
 * Usage in component:
 *
 * function ThemeToggle() {
 *   const theme = usePersistedStore((state) => state.theme)
 *   const setTheme = usePersistedStore((state) => state.setTheme)
 *
 *   return (
 *     <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *       Toggle theme
 *     </button>
 *   )
 * }
 *
 * NEXT.JS WARNING:
 * For Next.js with SSR, see nextjs-store.ts template for hydration handling!
 */
