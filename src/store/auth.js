import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../api'

export const useAuth = create(
  persist(
    (set) => ({
      user: null,
      access: null,
      refresh: null,

      login: async (email, password) => {
        const data = await api.auth.login({ email, password })
        set({ user: data.user, access: data.access, refresh: data.refresh })
        return data.user
      },

      register: async (payload) => {
        const data = await api.auth.register(payload)
        set({ user: data.user, access: data.access, refresh: data.refresh })
        return data.user
      },

      logout: () => set({ user: null, access: null, refresh: null }),
    }),
    { name: 'auth' }
  )
)
