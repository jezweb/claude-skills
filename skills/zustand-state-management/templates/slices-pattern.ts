/**
 * Zustand Slices Pattern (Modular Store Architecture)
 *
 * Use when:
 * - Store is getting large (100+ lines)
 * - Multiple developers working on store
 * - Need to organize state by domain/feature
 *
 * Benefits:
 * - Each slice is independent and testable
 * - Slices can access each other's state/actions
 * - Easy to add/remove features
 * - Better code organization
 *
 * Learn more: See SKILL.md Issue #5 for TypeScript complexity handling
 */

import { create, StateCreator } from 'zustand'
import { devtools } from 'zustand/middleware'

// ============================================================================
// SLICE 1: User Management
// ============================================================================

interface User {
  id: string
  name: string
  email: string
}

interface UserSlice {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User) => void
  logout: () => void
}

const createUserSlice: StateCreator<
  UserSlice & CartSlice & NotificationSlice,  // Combined type
  [['zustand/devtools', never]],               // Middleware mutators
  [],                                          // Chained middleware
  UserSlice                                     // This slice's type
> = (set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) =>
    set(
      { user, isAuthenticated: true },
      undefined,
      'user/setUser',
    ),

  logout: () =>
    set(
      { user: null, isAuthenticated: false },
      undefined,
      'user/logout',
    ),
})

// ============================================================================
// SLICE 2: Shopping Cart
// ============================================================================

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface CartSlice {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clearCart: () => void
  // Access other slices
  eatFish: () => void // Example: cross-slice action
}

const createCartSlice: StateCreator<
  UserSlice & CartSlice & NotificationSlice,
  [['zustand/devtools', never]],
  [],
  CartSlice
> = (set, get) => ({
  items: [],

  addItem: (item) =>
    set(
      (state) => ({
        items: [...state.items, item],
      }),
      undefined,
      'cart/addItem',
    ),

  removeItem: (id) =>
    set(
      (state) => ({
        items: state.items.filter((item) => item.id !== id),
      }),
      undefined,
      'cart/removeItem',
    ),

  clearCart: () =>
    set(
      { items: [] },
      undefined,
      'cart/clearCart',
    ),

  // Example: Action that accesses another slice
  eatFish: () =>
    set(
      (state) => ({
        // Access notification slice
        notifications: state.notifications + 1,
      }),
      undefined,
      'cart/eatFish',
    ),
})

// ============================================================================
// SLICE 3: Notifications
// ============================================================================

interface NotificationSlice {
  notifications: number
  messages: string[]
  addNotification: (message: string) => void
  clearNotifications: () => void
}

const createNotificationSlice: StateCreator<
  UserSlice & CartSlice & NotificationSlice,
  [['zustand/devtools', never]],
  [],
  NotificationSlice
> = (set) => ({
  notifications: 0,
  messages: [],

  addNotification: (message) =>
    set(
      (state) => ({
        notifications: state.notifications + 1,
        messages: [...state.messages, message],
      }),
      undefined,
      'notifications/add',
    ),

  clearNotifications: () =>
    set(
      { notifications: 0, messages: [] },
      undefined,
      'notifications/clear',
    ),
})

// ============================================================================
// COMBINE SLICES
// ============================================================================

export const useAppStore = create<UserSlice & CartSlice & NotificationSlice>()(
  devtools(
    (...a) => ({
      ...createUserSlice(...a),
      ...createCartSlice(...a),
      ...createNotificationSlice(...a),
    }),
    { name: 'AppStore' },
  ),
)

/**
 * Usage in components:
 *
 * function UserProfile() {
 *   const user = useAppStore((state) => state.user)
 *   const logout = useAppStore((state) => state.logout)
 *
 *   if (!user) return <div>Not logged in</div>
 *
 *   return (
 *     <div>
 *       <p>Welcome, {user.name}!</p>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   )
 * }
 *
 * function Cart() {
 *   const items = useAppStore((state) => state.items)
 *   const clearCart = useAppStore((state) => state.clearCart)
 *
 *   return (
 *     <div>
 *       <h2>Cart ({items.length} items)</h2>
 *       <button onClick={clearCart}>Clear</button>
 *     </div>
 *   )
 * }
 *
 * ORGANIZATION TIP:
 * In larger projects, put each slice in its own file:
 *
 * src/store/
 *   ├── index.ts           (combines slices)
 *   ├── userSlice.ts
 *   ├── cartSlice.ts
 *   └── notificationSlice.ts
 */
