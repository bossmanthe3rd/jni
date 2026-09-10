import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { reconcilePrice } from '../data/products'

/**
 * Mirrors the live site's zustand store, including the `jni-cart-storage`
 * localStorage key and the price re-sync on rehydrate.
 */
export const useCart = create(
  persist(
    (set, get) => {
      const addItem = (product, qty = 1) => {
        const priced = reconcilePrice(product)
        const amount = Math.max(1, Number(qty) || 1)
        const items = get().items
        const existing = items.find((i) => i.id === priced.id)
        set(
          existing
            ? {
                items: items.map((i) =>
                  i.id === priced.id ? { ...i, qty: i.qty + amount, price: priced.price } : i
                ),
              }
            : { items: [...items, { ...priced, qty: amount }] }
        )
      }

      const setQty = (id, qty) => {
        if (qty <= 0) {
          set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
          return
        }
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, qty } : i)) }))
      }

      return {
        items: [],
        isOpen: false,
        addItem,
        setQty,
        removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
        openCart: () => set({ isOpen: true }),
        closeCart: () => set({ isOpen: false }),
        toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
        clearCart: () => set({ items: [] }),
        getTotalQty: () => get().items.reduce((n, i) => n + i.qty, 0),
        getTotalPrice: () =>
          get()
            .items.reduce((n, i) => n + parseFloat(i.price) * i.qty, 0)
            .toFixed(2),
      }
    },
    {
      name: 'jni-cart-storage',
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => {
        if (state?.items?.length) state.items = state.items.map(reconcilePrice)
      },
    }
  )
)
