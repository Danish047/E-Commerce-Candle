import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAdminAuth = create(
  persist(
    (set) => ({
      user: null,
      access: null,
      refresh: null,
      notice: null, // shown on the login screen after a forced sign-out
      signIn: ({ user, access, refresh }) => set({ user, access, refresh, notice: null }),
      setTokens: (access, refresh) => set({ access, refresh }),
      setUser: (user) => set({ user }),
      logout: (notice = null) => set({ user: null, access: null, refresh: null, notice }),
    }),
    { name: 'admin-auth', partialize: ({ notice, ...s }) => s }
  )
)

// ─── Toasts ────────────────────────────────────────────────────────
let seq = 0
export const useToasts = create((set, get) => ({
  items: [],
  push: (text, tone = 'ok') => {
    const id = ++seq
    set({ items: [...get().items, { id, text, tone }] })
    setTimeout(() => get().dismiss(id), tone === 'bad' ? 6000 : 3500)
  },
  dismiss: (id) => set({ items: get().items.filter((t) => t.id !== id) }),
}))

export const toast = {
  ok: (t) => useToasts.getState().push(t, 'ok'),
  bad: (t) => useToasts.getState().push(t?.message || t, 'bad'),
}
