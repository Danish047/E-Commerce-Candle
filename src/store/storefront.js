import { create } from 'zustand'
import { api } from '../api'

// Announcements + banners + sections (Candles, 3D Printing, ...), fetched once per page load and shared by every component.
export const useStorefront = create((set, get) => ({
  announcements: [],
  banners: {},
  sections: [],
  loaded: false,
  load: async () => {
    if (get().loading || get().loaded) return
    set({ loading: true })
    try {
      const d = await api.storefront()
      set({ announcements: d.announcements || [], banners: d.banners || {}, sections: d.sections || [] })
    } catch {
      /* fall back to the built-in hero; never block the page */
    } finally {
      set({ loading: false, loaded: true })
    }
  },
}))

// Small helpers so pages don't repeat the same lookups.
export const sectionBySlug = (sections, slug) => sections.find((s) => s.slug === slug)
export const liveSections = (sections) => sections.filter((s) => s.status === 'live')
