/**
 * Zustand Store with Computed/Derived Values
 *
 * Use when:
 * - Need values calculated from state
 * - Want to avoid storing redundant data
 * - Need efficient memoization
 *
 * Pattern: Compute in selectors, not in store
 *
 * Benefits:
 * - Cleaner state (only source data)
 * - Automatic recomputation when dependencies change
 * - Components only re-render when result changes
 *
 * Learn more: See SKILL.md Common Patterns section
 */

import { create } from 'zustand'

interface Product {
  id: string
  name: string
  price: number
  category: string
  inStock: boolean
}

interface CartItem {
  productId: string
  quantity: number
}

interface ComputedStore {
  // Source state (stored)
  products: Product[]
  cart: CartItem[]
  taxRate: number
  discountPercent: number

  // Actions
  addProduct: (product: Product) => void
  addToCart: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  setTaxRate: (rate: number) => void
  setDiscount: (percent: number) => void
}

export const useComputedStore = create<ComputedStore>()((set) => ({
  // Initial state
  products: [],
  cart: [],
  taxRate: 0.1, // 10%
  discountPercent: 0,

  // Actions
  addProduct: (product) =>
    set((state) => ({
      products: [...state.products, product],
    })),

  addToCart: (productId, quantity) =>
    set((state) => {
      const existing = state.cart.find((item) => item.productId === productId)
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        }
      }
      return {
        cart: [...state.cart, { productId, quantity }],
      }
    }),

  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.productId !== productId),
    })),

  setTaxRate: (rate) => set({ taxRate: rate }),

  setDiscount: (percent) => set({ discountPercent: percent }),
}))

// ============================================================================
// COMPUTED/DERIVED SELECTORS (put these in separate file for reuse)
// ============================================================================

/**
 * Selector: Get cart items with product details
 */
export const selectCartWithDetails = (state: ComputedStore) =>
  state.cart.map((item) => {
    const product = state.products.find((p) => p.id === item.productId)
    return {
      ...item,
      product,
      subtotal: product ? product.price * item.quantity : 0,
    }
  })

/**
 * Selector: Calculate subtotal (before tax and discount)
 */
export const selectSubtotal = (state: ComputedStore) =>
  state.cart.reduce((sum, item) => {
    const product = state.products.find((p) => p.id === item.productId)
    return sum + (product ? product.price * item.quantity : 0)
  }, 0)

/**
 * Selector: Calculate discount amount
 */
export const selectDiscountAmount = (state: ComputedStore) => {
  const subtotal = selectSubtotal(state)
  return subtotal * (state.discountPercent / 100)
}

/**
 * Selector: Calculate tax amount
 */
export const selectTaxAmount = (state: ComputedStore) => {
  const subtotal = selectSubtotal(state)
  const discountAmount = selectDiscountAmount(state)
  const afterDiscount = subtotal - discountAmount
  return afterDiscount * state.taxRate
}

/**
 * Selector: Calculate final total
 */
export const selectTotal = (state: ComputedStore) => {
  const subtotal = selectSubtotal(state)
  const discountAmount = selectDiscountAmount(state)
  const taxAmount = selectTaxAmount(state)
  return subtotal - discountAmount + taxAmount
}

/**
 * Selector: Get products by category
 */
export const selectProductsByCategory = (category: string) => (state: ComputedStore) =>
  state.products.filter((product) => product.category === category)

/**
 * Selector: Get in-stock products only
 */
export const selectInStockProducts = (state: ComputedStore) =>
  state.products.filter((product) => product.inStock)

/**
 * Selector: Count items in cart
 */
export const selectCartItemCount = (state: ComputedStore) =>
  state.cart.reduce((sum, item) => sum + item.quantity, 0)

/**
 * Usage in components:
 *
 * function CartSummary() {
 *   // Each selector only causes re-render when its result changes
 *   const subtotal = useComputedStore(selectSubtotal)
 *   const discount = useComputedStore(selectDiscountAmount)
 *   const tax = useComputedStore(selectTaxAmount)
 *   const total = useComputedStore(selectTotal)
 *   const itemCount = useComputedStore(selectCartItemCount)
 *
 *   return (
 *     <div>
 *       <h3>Cart ({itemCount} items)</h3>
 *       <p>Subtotal: ${subtotal.toFixed(2)}</p>
 *       <p>Discount: -${discount.toFixed(2)}</p>
 *       <p>Tax: ${tax.toFixed(2)}</p>
 *       <h4>Total: ${total.toFixed(2)}</h4>
 *     </div>
 *   )
 * }
 *
 * function ProductList() {
 *   const inStockProducts = useComputedStore(selectInStockProducts)
 *
 *   return (
 *     <ul>
 *       {inStockProducts.map((product) => (
 *         <li key={product.id}>{product.name} - ${product.price}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 *
 * function CategoryFilter() {
 *   const electronicsProducts = useComputedStore(selectProductsByCategory('electronics'))
 *
 *   return <div>{electronicsProducts.length} electronics</div>
 * }
 *
 * PERFORMANCE TIP:
 * For expensive computations, use useMemo in the component:
 *
 * function ExpensiveComputation() {
 *   const data = useComputedStore((state) => state.products)
 *
 *   const result = useMemo(() => {
 *     // Expensive calculation
 *     return data.map(...).filter(...).reduce(...)
 *   }, [data])
 *
 *   return <div>{result}</div>
 * }
 */
