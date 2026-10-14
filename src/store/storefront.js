import { create } from 'zustand'
import { api } from '../api'

// Announcements + banners, fetched once per page load and shared by every component.
export const useStorefront = create((set, get) => ({
  announcements: [],
  banners: {},
  loaded: false,
  load: async () => {
    if (get().loading || get().loaded) return
    set({ loading: true })
    try {
      const d = await api.storefront()
      set({ announcements: d.announcements || [], banners: d.banners || {} })
    } catch {
      /* fall back to the built-in hero; never block the page */
    } finally {
      set({ loading: false, loaded: true })
    }
  },
}))
