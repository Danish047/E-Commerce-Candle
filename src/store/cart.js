import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Cart lives in the browser (works for guests). The backend re-checks
// prices and stock when the order is placed.
export const useCart = create(
  persist(
    (set, get) => ({
      items: [], // [{ product: {id, slug, name, price, color, size, stock, images}, quantity }]
      isOpen: false,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),

      add: (product, quantity = 1) => {
        const items = get().items
        const existing = items.find((i) => i.product.id === product.id)
        const snap = (({ id, slug, name, price, color, size, stock, images }) => ({ id, slug, name, price, color, size, stock, images }))(product)
        if (existing) {
          set({
            items: items.map((i) =>
              i.product.id === product.id ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) } : i
            ),
            isOpen: true,
          })
        } else {
          set({ items: [...items, { product: snap, quantity: Math.min(quantity, product.stock) }], isOpen: true })
        }
      },

      setQty: (id, quantity) =>
        set({
          items: get()
            .items.map((i) => (i.product.id === id ? { ...i, quantity: Math.max(0, Math.min(quantity, i.product.stock)) } : i))
            .filter((i) => i.quantity > 0),
        }),

      remove: (id) => set({ items: get().items.filter((i) => i.product.id !== id) }),
      clear: () => set({ items: [] }),
    }),
    { name: 'cart', partialize: (s) => ({ items: s.items }) }
  )
)

export const cartCount = (items) => items.reduce((n, i) => n + i.quantity, 0)
export const cartSubtotal = (items) => items.reduce((s, i) => s + i.product.price * i.quantity, 0)
